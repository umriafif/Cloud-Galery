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
const { wantsJsonResponse } = require('../utils/request');

const router = express.Router();

function buildUploadResponsePayload({ successCount, failed }) {
  const failedCount = failed.length;

  if (successCount > 0) {
    return {
      ok: true,
      successCount,
      failedCount,
      failed,
      message: `${successCount} file berhasil diunggah${failedCount > 0 ? `, ${failedCount} gagal.` : '.'}`
    };
  }

  return {
    ok: false,
    successCount: 0,
    failedCount,
    failed,
    message: failed.join(' | ') || 'Semua unggahan gagal diproses.'
  };
}

router.get(
  '/dashboard',
  requireAuth,
  asyncHandler(async (req, res) => {
    const mediaQuery = String(req.query.q || '').trim();
    const [rootFolders, rootMediaPage, folderCount, mediaCount] = await Promise.all([
      listRootFolders(req.session.user),
      listMediaByFolder({
        folderId: null,
        user: req.session.user,
        cursor: req.query.cursor,
        limit: 12,
        search: mediaQuery
      }),
      countFoldersForUser(req.session.user),
      countMediaForUser(req.session.user)
    ]);

    res.render('dashboard/index', {
      title: 'Dashboard',
      rootFolders,
      rootMediaPage,
      mediaQuery,
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
      if (wantsJsonResponse(req)) {
        res.status(400).json({
          ok: false,
          message: 'Pilih minimal satu file untuk diunggah.'
        });
        return;
      }

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

    const payload = buildUploadResponsePayload({ successCount, failed });

    if (wantsJsonResponse(req)) {
      res.status(payload.ok ? 200 : 400).json(payload);
      return;
    }

    if (payload.ok) {
      setFlash(req, failed.length > 0 ? 'warning' : 'success', payload.message);
    } else {
      setFlash(req, 'error', payload.message);
    }

    res.redirect('/dashboard');
  })
);

module.exports = router;
