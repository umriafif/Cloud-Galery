const env = require('../config/env');
const { formatBytes, formatDuration, formatDate } = require('../utils/formatters');
const { getAcceptedMediaHint } = require('../utils/media-types');

function setFlash(req, type, message) {
  req.session.flash = { type, message };
}

function injectLocals(req, res, next) {
  res.locals.currentUser = req.session.user || null;
  res.locals.currentPath = req.path;
  res.locals.allowPublicRegistration = env.allowPublicRegistration;
  res.locals.flash = req.session.flash || null;
  res.locals.formatBytes = formatBytes;
  res.locals.formatDuration = formatDuration;
  res.locals.formatDate = formatDate;
  res.locals.appName = env.appName;
  res.locals.acceptedMediaHint = getAcceptedMediaHint();
  res.locals.maxUploadSizeMb = Math.round(env.upload.maxFileSizeBytes / (1024 * 1024));
  res.locals.maxFilesPerRequest = env.upload.maxFilesPerRequest;

  delete req.session.flash;
  next();
}

function requireAuth(req, res, next) {
  if (req.session.user) {
    next();
    return;
  }

  req.session.returnTo = req.originalUrl;
  setFlash(req, 'error', 'Silakan login terlebih dahulu.');
  res.redirect('/login');
}

function requireGuest(req, res, next) {
  if (req.session.user) {
    res.redirect('/dashboard');
    return;
  }

  next();
}

function requireAdmin(req, res, next) {
  if (req.session.user?.role === 'admin') {
    next();
    return;
  }

  res.status(403).render('error', {
    title: 'Akses Ditolak',
    statusCode: 403,
    message: 'Halaman ini hanya bisa diakses admin.'
  });
}

module.exports = {
  injectLocals,
  requireAuth,
  requireGuest,
  requireAdmin,
  setFlash
};
