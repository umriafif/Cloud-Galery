const { query } = require('../db/pool');

function normalizeFolderName(name) {
  return String(name || '').trim().replace(/\s+/g, ' ');
}

function ownershipClause(alias, user) {
  if (user.role === 'admin') {
    return {
      sql: '1 = 1',
      params: []
    };
  }

  return {
    sql: `${alias}.owner_id = ?`,
    params: [user.id]
  };
}

async function getFolderByIdForUser(folderId, user) {
  const access = ownershipClause('f', user);
  const rows = await query(
    `
      SELECT
        f.*,
        u.name AS owner_name,
        u.email AS owner_email
      FROM folders f
      INNER JOIN users u ON u.id = f.owner_id
      WHERE f.id = ? AND ${access.sql}
      LIMIT 1
    `,
    [folderId, ...access.params]
  );

  return rows[0] || null;
}

async function listRootFolders(user) {
  const access = ownershipClause('f', user);

  return query(
    `
      SELECT
        f.*,
        u.name AS owner_name,
        (
          SELECT COUNT(*)
          FROM folders child
          WHERE child.parent_id = f.id
        ) AS child_count,
        (
          SELECT COUNT(*)
          FROM media m
          WHERE m.folder_id = f.id
        ) AS media_count
      FROM folders f
      INNER JOIN users u ON u.id = f.owner_id
      WHERE f.parent_id IS NULL AND ${access.sql}
      ORDER BY f.updated_at DESC, f.id DESC
    `,
    access.params
  );
}

async function listChildFolders(parentId, user) {
  const access = ownershipClause('f', user);

  return query(
    `
      SELECT
        f.*,
        u.name AS owner_name,
        (
          SELECT COUNT(*)
          FROM folders child
          WHERE child.parent_id = f.id
        ) AS child_count,
        (
          SELECT COUNT(*)
          FROM media m
          WHERE m.folder_id = f.id
        ) AS media_count
      FROM folders f
      INNER JOIN users u ON u.id = f.owner_id
      WHERE f.parent_id = ? AND ${access.sql}
      ORDER BY f.name ASC
    `,
    [parentId, ...access.params]
  );
}

async function createFolder({ name, parentId = null, currentUser }) {
  const cleanName = normalizeFolderName(name);

  if (!cleanName) {
    throw new Error('Nama folder wajib diisi.');
  }

  let ownerId = currentUser.id;

  if (parentId) {
    const parent = await getFolderByIdForUser(parentId, currentUser);

    if (!parent) {
      throw new Error('Folder induk tidak ditemukan atau tidak bisa diakses.');
    }

    ownerId = parent.owner_id;
  }

  const duplicate = await query(
    `
      SELECT id
      FROM folders
      WHERE owner_id = ? AND name = ? AND parent_id <=> ?
      LIMIT 1
    `,
    [ownerId, cleanName, parentId]
  );

  if (duplicate.length > 0) {
    throw new Error('Sudah ada folder dengan nama yang sama pada lokasi ini.');
  }

  const result = await query(
    `
      INSERT INTO folders (parent_id, owner_id, created_by, name)
      VALUES (?, ?, ?, ?)
    `,
    [parentId, ownerId, currentUser.id, cleanName]
  );

  return getFolderByIdForUser(result.insertId, currentUser);
}

async function getBreadcrumbs(folderId, user) {
  const breadcrumbs = [];
  let currentId = folderId;
  let guard = 0;

  while (currentId && guard < 20) {
    const folder = await getFolderByIdForUser(currentId, user);

    if (!folder) {
      break;
    }

    breadcrumbs.unshift(folder);
    currentId = folder.parent_id;
    guard += 1;
  }

  return breadcrumbs;
}

async function countFoldersForUser(user) {
  const access = ownershipClause('f', user);
  const rows = await query(
    `SELECT COUNT(*) AS total FROM folders f WHERE ${access.sql}`,
    access.params
  );

  return rows[0]?.total || 0;
}

module.exports = {
  createFolder,
  getFolderByIdForUser,
  listRootFolders,
  listChildFolders,
  getBreadcrumbs,
  countFoldersForUser
};
