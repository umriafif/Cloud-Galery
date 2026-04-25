const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const env = require('../config/env');

async function ensureStorageDirectories() {
  await Promise.all([
    fs.mkdir(env.storage.tmpDir, { recursive: true }),
    fs.mkdir(env.storage.uploadsDir, { recursive: true }),
    fs.mkdir(env.storage.thumbnailsDir, { recursive: true })
  ]);
}

function buildRelativeStoragePath(extension) {
  const now = new Date();
  const year = String(now.getUTCFullYear());
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  const id = crypto.randomUUID();
  const shard = id.slice(0, 2);
  const cleanExtension = extension.startsWith('.') ? extension : `.${extension}`;

  return [year, month, day, shard, `${id}${cleanExtension}`].join('/');
}

function buildRelativeThumbnailPath() {
  const now = new Date();
  const year = String(now.getUTCFullYear());
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  const id = crypto.randomUUID();
  const shard = id.slice(0, 2);

  return [year, month, day, shard, `${id}.jpg`].join('/');
}

function resolveManagedPath(baseDir, relativePath) {
  const segments = relativePath.split('/').filter(Boolean);
  const absolutePath = path.resolve(baseDir, ...segments);
  const normalizedBase = path.resolve(baseDir);

  if (absolutePath !== normalizedBase && !absolutePath.startsWith(`${normalizedBase}${path.sep}`)) {
    throw new Error('Invalid storage path.');
  }

  return absolutePath;
}

async function moveFromTemp(tempPath, targetBaseDir, relativePath) {
  const destination = resolveManagedPath(targetBaseDir, relativePath);
  await fs.mkdir(path.dirname(destination), { recursive: true });

  try {
    await fs.rename(tempPath, destination);
  } catch (error) {
    if (error?.code !== 'EXDEV') {
      throw error;
    }

    await fs.copyFile(tempPath, destination);
    await fs.unlink(tempPath);
  }

  return destination;
}

async function removeIfExists(filePath) {
  if (!filePath) {
    return;
  }

  await fs.rm(filePath, { force: true });
}

module.exports = {
  ensureStorageDirectories,
  buildRelativeStoragePath,
  buildRelativeThumbnailPath,
  resolveManagedPath,
  moveFromTemp,
  removeIfExists
};
