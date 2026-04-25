const bcrypt = require('bcryptjs');
const env = require('../config/env');
const { query } = require('./pool');

async function migrate() {
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      name VARCHAR(120) NOT NULL,
      email VARCHAR(190) NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_users_email (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS folders (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      parent_id BIGINT UNSIGNED NULL,
      owner_id BIGINT UNSIGNED NOT NULL,
      created_by BIGINT UNSIGNED NOT NULL,
      name VARCHAR(180) NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_folders_owner_parent (owner_id, parent_id, name),
      KEY idx_folders_parent_name (parent_id, name),
      CONSTRAINT fk_folders_parent FOREIGN KEY (parent_id) REFERENCES folders(id) ON DELETE CASCADE,
      CONSTRAINT fk_folders_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT fk_folders_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS media (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      folder_id BIGINT UNSIGNED NULL,
      owner_id BIGINT UNSIGNED NOT NULL,
      uploaded_by BIGINT UNSIGNED NOT NULL,
      title VARCHAR(255) NOT NULL,
      original_name VARCHAR(255) NOT NULL,
      mime_type VARCHAR(150) NOT NULL,
      media_type ENUM('image', 'video') NOT NULL,
      file_extension VARCHAR(20) NOT NULL,
      file_size BIGINT UNSIGNED NOT NULL,
      width INT UNSIGNED NULL,
      height INT UNSIGNED NULL,
      duration_seconds DECIMAL(10, 2) NULL,
      storage_path VARCHAR(500) NOT NULL,
      thumbnail_path VARCHAR(500) NULL,
      status ENUM('ready', 'processing', 'failed') NOT NULL DEFAULT 'ready',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_media_folder_created (folder_id, created_at, id),
      KEY idx_media_owner_created (owner_id, created_at, id),
      CONSTRAINT fk_media_folder FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL,
      CONSTRAINT fk_media_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT fk_media_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  const adminEmail = env.defaultAdmin.email.trim().toLowerCase();
  const existing = await query('SELECT id FROM users WHERE email = ? LIMIT 1', [adminEmail]);

  if (existing.length === 0) {
    const passwordHash = await bcrypt.hash(env.defaultAdmin.password, 12);
    await query(
      `
        INSERT INTO users (name, email, password_hash, role, is_active)
        VALUES (?, ?, ?, 'admin', 1)
      `,
      [env.defaultAdmin.name.trim(), adminEmail, passwordHash]
    );
  }
}

module.exports = {
  migrate
};
