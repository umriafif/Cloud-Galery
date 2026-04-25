const express = require('express');
const asyncHandler = require('../utils/async-handler');
const env = require('../config/env');
const { requireGuest, setFlash } = require('../middleware/auth');
const { authenticate, createUser } = require('../services/user-service');

const router = express.Router();

router.get('/login', requireGuest, (req, res) => {
  res.render('auth/login', {
    title: 'Masuk'
  });
});

router.post(
  '/login',
  requireGuest,
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await authenticate(email, password);

    if (!user) {
      setFlash(req, 'error', 'Email atau password tidak valid.');
      res.redirect('/login');
      return;
    }

    req.session.user = user;
    const redirectTo = req.session.returnTo || '/dashboard';
    delete req.session.returnTo;

    setFlash(req, 'success', `Selamat datang kembali, ${user.name}.`);
    res.redirect(redirectTo);
  })
);

router.get('/register', requireGuest, (req, res) => {
  if (!env.allowPublicRegistration) {
    res.status(404).render('error', {
      title: 'Pendaftaran Ditutup',
      statusCode: 404,
      message: 'Pendaftaran publik saat ini tidak diaktifkan.'
    });
    return;
  }

  res.render('auth/register', {
    title: 'Daftar'
  });
});

router.post(
  '/register',
  requireGuest,
  asyncHandler(async (req, res) => {
    if (!env.allowPublicRegistration) {
      res.status(404).render('error', {
        title: 'Pendaftaran Ditutup',
        statusCode: 404,
        message: 'Pendaftaran publik saat ini tidak diaktifkan.'
      });
      return;
    }

    const user = await createUser({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      role: 'user'
    });

    req.session.user = user;
    setFlash(req, 'success', 'Akun berhasil dibuat.');
    res.redirect('/dashboard');
  })
);

router.post('/logout', (req, res, next) => {
  req.session.destroy((error) => {
    if (error) {
      next(error);
      return;
    }

    res.clearCookie('cloud_gallery_sid');
    res.redirect('/login');
  });
});

module.exports = router;
