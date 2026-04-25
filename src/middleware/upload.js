const fs = require('node:fs/promises');
const path = require('node:path');
const multer = require('multer');
const env = require('../config/env');
const { isSupportedMediaFile } = require('../utils/media-types');

function createUploadMiddleware() {
  const storage = multer.diskStorage({
    destination: async (req, file, callback) => {
      // Keep temp upload in the uploads mount to avoid cross-device move in Docker.
      const tempUploadDir = path.join(env.storage.uploadsDir, '.tmp');

      try {
        await fs.mkdir(tempUploadDir, { recursive: true });
        callback(null, tempUploadDir);
      } catch (error) {
        callback(error);
      }
    },
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
      const allowed = isSupportedMediaFile({
        mimeType: file.mimetype,
        filename: file.originalname
      });

      if (allowed) {
        callback(null, true);
        return;
      }

      const error = new Error('Format file tidak didukung. Gunakan format foto atau video umum seperti JPG, PNG, WEBP, MP4, MOV, MKV, WEBM, AVI, dan sejenisnya.');
      error.statusCode = 400;
      callback(error);
    }
  }).array('media_files', env.upload.maxFilesPerRequest);
}

module.exports = createUploadMiddleware();
