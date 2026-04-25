const path = require('node:path');
const multer = require('multer');
const env = require('../config/env');

function createUploadMiddleware() {
  const storage = multer.diskStorage({
    destination: env.storage.tmpDir,
    filename: (req, file, callback) => {
      const safeName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname || '')}`;
      callback(null, safeName);
    }
  });

  return multer({
    storage,
    limits: {
      fileSize: env.upload.maxFileSizeBytes,
      files: env.upload.maxFilesPerRequest
    },
    fileFilter: (req, file, callback) => {
      const allowed = file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/');
      callback(allowed ? null : new Error('Hanya gambar dan video yang diperbolehkan.'), allowed);
    }
  }).array('media_files', env.upload.maxFilesPerRequest);
}

module.exports = createUploadMiddleware();
