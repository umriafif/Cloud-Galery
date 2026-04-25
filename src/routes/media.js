const fs = require('node:fs');
const fsPromises = require('node:fs/promises');
const express = require('express');
const asyncHandler = require('../utils/async-handler');
const { requireAuth } = require('../middleware/auth');
const { getMediaByIdForUser, resolveOriginalPath, resolveThumbnailPath } = require('../services/media-service');
const { getBreadcrumbs } = require('../services/folder-service');

const router = express.Router();

router.get(
  '/media/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const media = await getMediaByIdForUser(Number(req.params.id), req.session.user);

    if (!media) {
      res.status(404).render('error', {
        title: 'Media Tidak Ditemukan',
        statusCode: 404,
        message: 'Media yang diminta tidak ditemukan atau tidak dapat diakses.'
      });
      return;
    }

    const breadcrumbs = media.folder_id ? await getBreadcrumbs(media.folder_id, req.session.user) : [];

    res.render('media/show', {
      title: media.title,
      media,
      breadcrumbs
    });
  })
);

router.get(
  '/media/:id/thumb',
  requireAuth,
  asyncHandler(async (req, res) => {
    const media = await getMediaByIdForUser(Number(req.params.id), req.session.user);

    if (!media) {
      res.sendStatus(404);
      return;
    }

    const absolutePath = await resolveThumbnailPath(media);
    res.setHeader('Cache-Control', 'private, max-age=86400');
    res.type('image/jpeg');
    res.sendFile(absolutePath);
  })
);

async function streamMediaFile(req, res, media) {
  const absolutePath = await resolveOriginalPath(media);
  const fileStats = await fsPromises.stat(absolutePath);

  if (media.media_type !== 'video') {
    res.setHeader('Content-Type', media.mime_type);
    res.setHeader('Content-Length', fileStats.size);
    res.setHeader('Cache-Control', 'private, max-age=86400');
    res.sendFile(absolutePath);
    return;
  }

  const range = req.headers.range;

  if (!range) {
    res.writeHead(200, {
      'Content-Type': media.mime_type,
      'Content-Length': fileStats.size,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'private, max-age=86400'
    });
    fs.createReadStream(absolutePath).pipe(res);
    return;
  }

  const matches = /bytes=(\d*)-(\d*)/.exec(range);
  const start = matches?.[1] ? Number(matches[1]) : 0;
  const end = matches?.[2] ? Number(matches[2]) : fileStats.size - 1;

  if (Number.isNaN(start) || Number.isNaN(end) || start > end || end >= fileStats.size) {
    res.status(416).setHeader('Content-Range', `bytes */${fileStats.size}`);
    res.end();
    return;
  }

  res.writeHead(206, {
    'Content-Type': media.mime_type,
    'Content-Length': end - start + 1,
    'Content-Range': `bytes ${start}-${end}/${fileStats.size}`,
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'private, max-age=86400'
  });

  fs.createReadStream(absolutePath, { start, end }).pipe(res);
}

router.get(
  '/media/:id/file',
  requireAuth,
  asyncHandler(async (req, res) => {
    const media = await getMediaByIdForUser(Number(req.params.id), req.session.user);

    if (!media) {
      res.sendStatus(404);
      return;
    }

    await streamMediaFile(req, res, media);
  })
);

module.exports = router;
