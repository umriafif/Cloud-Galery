const path = require('node:path');
const dotenv = require('dotenv');

dotenv.config();

const projectRoot = path.resolve(__dirname, '..', '..');

function toNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toBoolean(value, fallback) {
  if (value === undefined) {
    return fallback;
  }

  return String(value).toLowerCase() === 'true';
}

const port = toNumber(process.env.PORT, 3000);

module.exports = {
  appName: process.env.APP_NAME || 'Cloud Gallery',
  baseUrl: process.env.BASE_URL || `http://localhost:${port}`,
  env: process.env.NODE_ENV || 'development',
  isProduction: (process.env.NODE_ENV || 'development') === 'production',
  port,
  sessionSecret: process.env.SESSION_SECRET || 'change-me-immediately',
  allowPublicRegistration: toBoolean(process.env.ALLOW_PUBLIC_REGISTRATION, true),
  upload: {
    maxFileSizeBytes: toNumber(process.env.MAX_UPLOAD_SIZE_MB, 1024) * 1024 * 1024,
    maxFilesPerRequest: toNumber(process.env.MAX_FILES_PER_UPLOAD, 50)
  },
  pagination: {
    galleryPageSize: toNumber(process.env.GALLERY_PAGE_SIZE, 60),
    dashboardRecentSize: toNumber(process.env.DASHBOARD_RECENT_SIZE, 12)
  },
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: toNumber(process.env.DB_PORT, 3306),
    database: process.env.DB_NAME || 'cloud_gallery',
    user: process.env.DB_USER || 'gallery',
    password: process.env.DB_PASSWORD || 'gallery_secret',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  },
  defaultAdmin: {
    name: process.env.DEFAULT_ADMIN_NAME || 'Administrator',
    email: process.env.DEFAULT_ADMIN_EMAIL || 'admin@cloud-gallery.local',
    password: process.env.DEFAULT_ADMIN_PASSWORD || 'ChangeMe123!'
  },
  storage: {
    rootDir: path.join(projectRoot, 'storage'),
    tmpDir: path.join(projectRoot, 'storage', 'tmp'),
    uploadsDir: path.join(projectRoot, 'storage', 'uploads'),
    thumbnailsDir: path.join(projectRoot, 'storage', 'thumbnails')
  },
  projectRoot
};
