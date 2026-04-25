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

const router = express.Router();

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
    const folder = await getFolderByIdForUser(folderId, req.session.user);

    if (!folder) {
      res.status(404).render('error', {
        title: 'Folder Tidak Ditemukan',
        statusCode: 404,
        message: 'Folder yang diminta tidak ditemukan atau tidak dapat diakses.'
      });
      return;
    }

    const [subfolders, breadcrumbs, mediaPage] = await Promise.all([
      listChildFolders(folder.id, req.session.user),
      getBreadcrumbs(folder.id, req.session.user),
      listMediaByFolder({
        folderId: folder.id,
        user: req.session.user,
        cursor: req.query.cursor
      })
    ]);

    res.render('folders/show', {
      title: folder.name,
      folder,
      subfolders,
      breadcrumbs,
      mediaPage
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
      res.status(404).render('error', {
        title: 'Folder Tidak Ditemukan',
        statusCode: 404,
        message: 'Folder tujuan tidak ditemukan atau tidak dapat diakses.'
      });
      return;
    }

    const uploads = req.files || [];
    if (uploads.length === 0) {
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

    if (successCount > 0) {
      setFlash(req, failed.length > 0 ? 'warning' : 'success', `${successCount} file berhasil diunggah${failed.length > 0 ? `, ${failed.length} gagal.` : '.'}`);
    } else {
      setFlash(req, 'error', failed.join(' | ') || 'Semua unggahan gagal diproses.');
    }

    res.redirect(`/folders/${folder.id}`);
  })
);

module.exports = router;
