const fs = require('node:fs/promises');
const path = require('node:path');
const { query } = require('../db/pool');
const env = require('../config/env');
const { encodeCursor, decodeCursor } = require('../utils/cursor');
const {
  ensureStorageDirectories,
  buildRelativeStoragePath,
  buildRelativeThumbnailPath,
  resolveManagedPath,
  moveFromTemp,
  removeIfExists
} = require('./storage-service');
const {
  getImageMetadata,
  createImageThumbnail,
  getVideoMetadata,
  createVideoThumbnail
} = require('./thumbnail-service');

function inferMediaType(mimeType) {
  if (String(mimeType).startsWith('image/')) {
    return 'image';
  }

  if (String(mimeType).startsWith('video/')) {
    return 'video';
  }

  return null;
}

function cleanTitleFromFilename(filename) {
  const base = path.parse(filename).name;
  return base.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim() || 'Untitled';
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

async function extractMetadataAndThumbnail({ mediaType, absoluteSourcePath, absoluteThumbnailPath }) {
  if (mediaType === 'image') {
    const metadata = await getImageMetadata(absoluteSourcePath);
    await createImageThumbnail(absoluteSourcePath, absoluteThumbnailPath);
    return metadata;
  }

  if (mediaType === 'video') {
    const metadata = await getVideoMetadata(absoluteSourcePath);
    await createVideoThumbnail(absoluteSourcePath, absoluteThumbnailPath);
    return metadata;
  }

  throw new Error('Format file tidak didukung.');
}

async function createMediaFromUpload({ file, folder, currentUser }) {
  const mediaType = inferMediaType(file.mimetype);

  if (!mediaType) {
    await removeIfExists(file.path);
    throw new Error(`File ${file.originalname} bukan gambar atau video yang didukung.`);
  }

  await ensureStorageDirectories();

  const extension = path.extname(file.originalname || '').toLowerCase() || (mediaType === 'image' ? '.jpg' : '.mp4');
  const relativeStoragePath = buildRelativeStoragePath(extension);
  const relativeThumbnailPath = buildRelativeThumbnailPath();
  const absoluteStoragePath = resolveManagedPath(env.storage.uploadsDir, relativeStoragePath);
  const absoluteThumbnailPath = resolveManagedPath(env.storage.thumbnailsDir, relativeThumbnailPath);
  const ownerId = folder ? folder.owner_id : currentUser.id;

  try {
    await moveFromTemp(file.path, env.storage.uploadsDir, relativeStoragePath);
    const metadata = await extractMetadataAndThumbnail({
      mediaType,
      absoluteSourcePath: absoluteStoragePath,
      absoluteThumbnailPath
    });

    const result = await query(
      `
        INSERT INTO media (
          folder_id,
          owner_id,
          uploaded_by,
          title,
          original_name,
          mime_type,
          media_type,
          file_extension,
          file_size,
          width,
          height,
          duration_seconds,
          storage_path,
          thumbnail_path,
          status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ready')
      `,
      [
        folder?.id || null,
        ownerId,
        currentUser.id,
        cleanTitleFromFilename(file.originalname),
        file.originalname,
        file.mimetype,
        mediaType,
        extension,
        file.size,
        metadata.width,
        metadata.height,
        metadata.durationSeconds,
        relativeStoragePath,
        relativeThumbnailPath
      ]
    );

    return getMediaByIdForUser(result.insertId, currentUser);
  } catch (error) {
    await Promise.all([
      removeIfExists(file.path),
      removeIfExists(absoluteStoragePath),
      removeIfExists(absoluteThumbnailPath)
    ]);
    throw error;
  }
}

async function getMediaByIdForUser(mediaId, user) {
  const access = ownershipClause('m', user);
  const rows = await query(
    `
      SELECT
        m.*,
        u.name AS owner_name,
        uploader.name AS uploaded_by_name,
        f.name AS folder_name,
        f.id AS folder_id_ref
      FROM media m
      INNER JOIN users u ON u.id = m.owner_id
      INNER JOIN users uploader ON uploader.id = m.uploaded_by
      LEFT JOIN folders f ON f.id = m.folder_id
      WHERE m.id = ? AND ${access.sql}
      LIMIT 1
    `,
    [mediaId, ...access.params]
  );

  return rows[0] || null;
}

async function listMediaByFolder({ folderId = null, user, cursor, limit = env.pagination.galleryPageSize }) {
  const access = ownershipClause('m', user);
  const decodedCursor = decodeCursor(cursor);
  const params = [folderId, ...access.params];

  let cursorSql = '';
  if (decodedCursor) {
    cursorSql = 'AND (m.created_at < ? OR (m.created_at = ? AND m.id < ?))';
    params.push(decodedCursor.createdAt, decodedCursor.createdAt, decodedCursor.id);
  }

  params.push(limit + 1);

  const rows = await query(
    `
      SELECT
        m.*,
        u.name AS owner_name
      FROM media m
      INNER JOIN users u ON u.id = m.owner_id
      WHERE m.folder_id <=> ? AND ${access.sql} ${cursorSql}
      ORDER BY m.created_at DESC, m.id DESC
      LIMIT ?
    `,
    params
  );

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const tail = items[items.length - 1];

  return {
    items,
    hasMore,
    nextCursor: hasMore ? encodeCursor({ createdAt: tail.created_at, id: tail.id }) : null
  };
}

async function listRecentMedia(user, limit = env.pagination.dashboardRecentSize) {
  const access = ownershipClause('m', user);

  return query(
    `
      SELECT
        m.*,
        u.name AS owner_name
      FROM media m
      INNER JOIN users u ON u.id = m.owner_id
      WHERE ${access.sql}
      ORDER BY m.created_at DESC, m.id DESC
      LIMIT ?
    `,
    [...access.params, limit]
  );
}

async function countMediaForUser(user) {
  const access = ownershipClause('m', user);
  const rows = await query(
    `SELECT COUNT(*) AS total FROM media m WHERE ${access.sql}`,
    access.params
  );

  return rows[0]?.total || 0;
}

async function resolveOriginalPath(media) {
  const absolutePath = resolveManagedPath(env.storage.uploadsDir, media.storage_path);
  await fs.access(absolutePath);
  return absolutePath;
}

async function resolveThumbnailPath(media) {
  if (!media.thumbnail_path) {
    return resolveOriginalPath(media);
  }

  const absolutePath = resolveManagedPath(env.storage.thumbnailsDir, media.thumbnail_path);
  await fs.access(absolutePath);
  return absolutePath;
}

module.exports = {
  createMediaFromUpload,
  getMediaByIdForUser,
  listMediaByFolder,
  listRecentMedia,
  countMediaForUser,
  resolveOriginalPath,
  resolveThumbnailPath
};
