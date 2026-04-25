const express = require('express');
const asyncHandler = require('../utils/async-handler');
const { requireAdmin, setFlash } = require('../middleware/auth');
const { createUser, listUsers, updateUserRole, updateUserStatus } = require('../services/user-service');

const router = express.Router();

router.get(
  '/admin/users',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const users = await listUsers();
    res.render('admin/users', {
      title: 'Manajemen User',
      users
    });
  })
);

router.post(
  '/admin/users',
  requireAdmin,
  asyncHandler(async (req, res) => {
    await createUser({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      role: req.body.role
    });

    setFlash(req, 'success', 'User baru berhasil dibuat.');
    res.redirect('/admin/users');
  })
);

router.post(
  '/admin/users/:id/role',
  requireAdmin,
  asyncHandler(async (req, res) => {
    await updateUserRole(Number(req.params.id), req.body.role);
    setFlash(req, 'success', 'Role user berhasil diperbarui.');
    res.redirect('/admin/users');
  })
);

router.post(
  '/admin/users/:id/status',
  requireAdmin,
  asyncHandler(async (req, res) => {
    await updateUserStatus(Number(req.params.id), req.body.is_active === '1');
    setFlash(req, 'success', 'Status user berhasil diperbarui.');
    res.redirect('/admin/users');
  })
);

module.exports = router;
