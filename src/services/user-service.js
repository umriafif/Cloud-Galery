const bcrypt = require('bcryptjs');
const { query } = require('../db/pool');

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function sanitizeUser(user) {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: Boolean(user.is_active)
  };
}

async function findByEmail(email) {
  const rows = await query('SELECT * FROM users WHERE email = ? LIMIT 1', [normalizeEmail(email)]);
  return rows[0] || null;
}

async function findById(id) {
  const rows = await query('SELECT * FROM users WHERE id = ? LIMIT 1', [id]);
  return rows[0] || null;
}

async function authenticate(email, password) {
  const user = await findByEmail(email);

  if (!user || !user.is_active) {
    return null;
  }

  const isValid = await bcrypt.compare(password, user.password_hash);
  return isValid ? sanitizeUser(user) : null;
}

async function createUser({ name, email, password, role = 'user' }) {
  const cleanName = String(name || '').trim();
  const cleanEmail = normalizeEmail(email);
  const cleanRole = role === 'admin' ? 'admin' : 'user';

  if (!cleanName || !cleanEmail || !password || password.length < 8) {
    throw new Error('Nama, email, dan password minimal 8 karakter wajib diisi.');
  }

  const existing = await findByEmail(cleanEmail);
  if (existing) {
    throw new Error('Email sudah terdaftar.');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const result = await query(
    `
      INSERT INTO users (name, email, password_hash, role, is_active)
      VALUES (?, ?, ?, ?, 1)
    `,
    [cleanName, cleanEmail, passwordHash, cleanRole]
  );

  const created = await findById(result.insertId);
  return sanitizeUser(created);
}

async function listUsers() {
  return query(`
    SELECT
      u.id,
      u.name,
      u.email,
      u.role,
      u.is_active,
      u.created_at,
      (
        SELECT COUNT(*)
        FROM folders f
        WHERE f.owner_id = u.id
      ) AS folder_count,
      (
        SELECT COUNT(*)
        FROM media m
        WHERE m.owner_id = u.id
      ) AS media_count
    FROM users u
    ORDER BY FIELD(u.role, 'admin', 'user'), u.name ASC
  `);
}

async function updateUserRole(userId, role) {
  const cleanRole = role === 'admin' ? 'admin' : 'user';
  await query('UPDATE users SET role = ? WHERE id = ?', [cleanRole, userId]);
}

async function updateUserStatus(userId, isActive) {
  await query('UPDATE users SET is_active = ? WHERE id = ?', [isActive ? 1 : 0, userId]);
}

module.exports = {
  sanitizeUser,
  authenticate,
  createUser,
  listUsers,
  updateUserRole,
  updateUserStatus,
  findById
};
