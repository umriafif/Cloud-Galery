const path = require('node:path');
const express = require('express');
const session = require('express-session');
const MySQLStoreFactory = require('express-mysql-session');
const expressLayouts = require('express-ejs-layouts');
const helmet = require('helmet');
const morgan = require('morgan');
const env = require('./config/env');
const { injectLocals } = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const folderRoutes = require('./routes/folders');
const mediaRoutes = require('./routes/media');
const adminRoutes = require('./routes/admin');

function createApp() {
  const app = express();
  const MySQLStore = MySQLStoreFactory(session);
  const sessionStore = new MySQLStore({
    ...env.db,
    createDatabaseTable: true,
    clearExpired: true,
    checkExpirationInterval: 15 * 60 * 1000,
    expiration: 24 * 60 * 60 * 1000
  });

  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'views'));
  app.set('layout', 'layout');

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: false
    })
  );
  app.use(morgan(env.isProduction ? 'combined' : 'dev'));
  app.use(expressLayouts);
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));
  app.use(express.json());
  app.use(
    session({
      name: 'cloud_gallery_sid',
      secret: env.sessionSecret,
      store: sessionStore,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
        maxAge: 24 * 60 * 60 * 1000
      }
    })
  );
  app.use(injectLocals);
  app.use('/assets', express.static(path.join(env.projectRoot, 'public', 'assets')));
  app.use('/js', express.static(path.join(env.projectRoot, 'public', 'js')));

  app.get('/', (req, res) => {
    res.redirect(req.session.user ? '/dashboard' : '/login');
  });

  app.use(authRoutes);
  app.use(dashboardRoutes);
  app.use(folderRoutes);
  app.use(mediaRoutes);
  app.use(adminRoutes);

  app.use((req, res) => {
    res.status(404).render('error', {
      title: 'Halaman Tidak Ditemukan',
      statusCode: 404,
      message: 'Halaman yang Anda cari tidak tersedia.'
    });
  });

  app.use((error, req, res, next) => {
    if (error?.name === 'MulterError') {
      const reason = error.code === 'LIMIT_FILE_SIZE'
        ? 'Ukuran file melebihi batas upload.'
        : 'Upload gagal diproses.';

      res.status(400).render('error', {
        title: 'Upload Gagal',
        statusCode: 400,
        message: reason
      });
      return;
    }

    const statusCode = error.statusCode || 500;
    res.status(statusCode).render('error', {
      title: statusCode >= 500 ? 'Terjadi Kesalahan' : 'Permintaan Tidak Valid',
      statusCode,
      message: error.message || 'Terjadi kesalahan yang tidak terduga.'
    });
  });

  return app;
}

module.exports = createApp;
