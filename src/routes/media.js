const fs = require('node:fs');
const fsPromises = require('node:fs/promises');
const express = require('express');
const asyncHandler = require('../utils/async-handler');
const { requireAuth } = require('../middleware/auth');
const { getMediaByIdForUser, resolveOriginalPath, resolveThumbnailPath } = require('../services/media-service');
const { getBreadcrumbs } = require('../services/folder-service');

const router = express.Router();

function escapeXml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function sendThumbnailPlaceholder(res, media) {
  const label = media.media_type === 'video' ? 'Preview video tidak tersedia' : 'Preview gambar tidak tersedia';
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480" fill="none">
      <rect width="640" height="480" rx="32" fill="#0f172a"/>
      <rect x="24" y="24" width="592" height="432" rx="24" fill="#1e293b" stroke="#334155"/>
      <circle cx="92" cy="92" r="22" fill="#14b8a6"/>
      <path d="M174 204L258 136L344 248L404 192L512 324H132L174 204Z" fill="#334155"/>
      <text x="50%" y="56%" dominant-baseline="middle" text-anchor="middle" fill="#f8fafc" font-size="28" font-family="Arial, sans-serif">${escapeXml(label)}</text>
      <text x="50%" y="64%" dominant-baseline="middle" text-anchor="middle" fill="#94a3b8" font-size="18" font-family="Arial, sans-serif">${escapeXml(media.original_name)}</text>
    </svg>
  `.trim();

  res.setHeader('Cache-Control', 'private, max-age=3600');
  res.type('image/svg+xml');
  res.send(svg);
}

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

    try {
      const absolutePath = await resolveThumbnailPath(media);
      res.setHeader('Cache-Control', 'private, max-age=86400');
      res.type('image/jpeg');
      res.sendFile(absolutePath);
    } catch (error) {
      sendThumbnailPlaceholder(res, media);
    }
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
