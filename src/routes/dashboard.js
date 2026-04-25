const express = require('express');
const asyncHandler = require('../utils/async-handler');
const { requireAuth, setFlash } = require('../middleware/auth');
const uploadMiddleware = require('../middleware/upload');
const { listRootFolders, countFoldersForUser } = require('../services/folder-service');
const {
  listMediaByFolder,
  countMediaForUser,
  createMediaFromUpload
} = require('../services/media-service');

const router = express.Router();

router.get(
  '/dashboard',
  requireAuth,
  asyncHandler(async (req, res) => {
    const [rootFolders, rootMediaPage, folderCount, mediaCount] = await Promise.all([
      listRootFolders(req.session.user),
      listMediaByFolder({
        folderId: null,
        user: req.session.user,
        cursor: req.query.cursor,
        limit: 12
      }),
      countFoldersForUser(req.session.user),
      countMediaForUser(req.session.user)
    ]);

    res.render('dashboard/index', {
      title: 'Dashboard',
      rootFolders,
      rootMediaPage,
      stats: {
        totalFolders: folderCount,
        totalMedia: mediaCount
      }
    });
  })
);

router.post(
  '/upload',
  requireAuth,
  uploadMiddleware,
  asyncHandler(async (req, res) => {
    const uploads = req.files || [];

    if (uploads.length === 0) {
      setFlash(req, 'error', 'Pilih minimal satu file untuk diunggah.');
      res.redirect('/dashboard');
      return;
    }

    const failed = [];
    let successCount = 0;

    for (const file of uploads) {
      try {
        await createMediaFromUpload({
          file,
          folder: null,
          currentUser: req.session.user
        });
        successCount += 1;
      } catch (error) {
        failed.push(`${file.originalname}: ${error.message}`);
      }
    }

    if (successCount > 0) {
      setFlash(req, failed.length > 0 ? 'warning' : 'success', `${successCount} file berhasil diunggah${failed.length > 0 ? `, ${failed.length} gagal.` : '.'}`);
    } else {
      setFlash(req, 'error', failed.join(' | ') || 'Semua unggahan gagal diproses.');
    }

    res.redirect('/dashboard');
  })
);

module.exports = router;
