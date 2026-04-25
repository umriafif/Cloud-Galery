const express = require('express');
const asyncHandler = require('../utils/async-handler');
const { requireAuth, setFlash } = require('../middleware/auth');
const uploadMiddleware = require('../middleware/upload');
const {
  createFolder,
  getFolderByIdForUser,
  listChildFolders,
  getBreadcrumbs
} = require('../services/folder-service');
const { listMediaByFolder, createMediaFromUpload } = require('../services/media-service');
const { wantsJsonResponse } = require('../utils/request');
const { renderEjsView } = require('../utils/render-ejs-view');

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

async function sendMediaPageJson(req, res, mediaPage) {
  const html = await renderEjsView(req.app, 'partials/media-grid-items', {
    ...res.locals,
    items: mediaPage.items
  });

  res.json({
    ok: true,
    html,
    count: mediaPage.items.length,
    hasMore: mediaPage.hasMore,
    nextCursor: mediaPage.nextCursor
  });
}

router.post(
  '/folders',
  requireAuth,
  asyncHandler(async (req, res) => {
    const parentId = req.body.parent_id ? Number(req.body.parent_id) : null;
    const folder = await createFolder({
      name: req.body.name,
      parentId,
      currentUser: req.session.user
    });

    setFlash(req, 'success', `Folder "${folder.name}" berhasil dibuat.`);
    res.redirect(parentId ? `/folders/${parentId}` : '/dashboard');
  })
);

router.get(
  '/folders/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const folderId = Number(req.params.id);
    const mediaQuery = String(req.query.q || '').trim();
    const isPartialMediaRequest = wantsJsonResponse(req) && req.query.partial === 'media';
    const folder = await getFolderByIdForUser(folderId, req.session.user);

    if (!folder) {
      if (isPartialMediaRequest) {
        res.status(404).json({
          ok: false,
          message: 'Folder yang diminta tidak ditemukan atau tidak dapat diakses.'
        });
        return;
      }

      res.status(404).render('error', {
        title: 'Folder Tidak Ditemukan',
        statusCode: 404,
        message: 'Folder yang diminta tidak ditemukan atau tidak dapat diakses.'
      });
      return;
    }

    if (isPartialMediaRequest) {
      const mediaPage = await listMediaByFolder({
        folderId: folder.id,
        user: req.session.user,
        cursor: req.query.cursor,
        search: mediaQuery
      });

      await sendMediaPageJson(req, res, mediaPage);
      return;
    }

    const [subfolders, breadcrumbs, mediaPage] = await Promise.all([
      listChildFolders(folder.id, req.session.user),
      getBreadcrumbs(folder.id, req.session.user),
      listMediaByFolder({
        folderId: folder.id,
        user: req.session.user,
        cursor: req.query.cursor,
        search: mediaQuery
      })
    ]);

    res.render('folders/show', {
      title: folder.name,
      folder,
      subfolders,
      breadcrumbs,
      mediaPage,
      mediaQuery
    });
  })
);

router.post(
  '/folders/:id/upload',
  requireAuth,
  uploadMiddleware,
  asyncHandler(async (req, res) => {
    const folderId = Number(req.params.id);
    const folder = await getFolderByIdForUser(folderId, req.session.user);

    if (!folder) {
      if (wantsJsonResponse(req)) {
        res.status(404).json({
          ok: false,
          message: 'Folder tujuan tidak ditemukan atau tidak dapat diakses.'
        });
        return;
      }

      res.status(404).render('error', {
        title: 'Folder Tidak Ditemukan',
        statusCode: 404,
        message: 'Folder tujuan tidak ditemukan atau tidak dapat diakses.'
      });
      return;
    }

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
      res.redirect(`/folders/${folder.id}`);
      return;
    }

    const failed = [];
    let successCount = 0;

    for (const file of uploads) {
      try {
        await createMediaFromUpload({
          file,
          folder,
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

    res.redirect(`/folders/${folder.id}`);
  })
);

module.exports = router;
