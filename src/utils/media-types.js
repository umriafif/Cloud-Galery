const path = require('node:path');

const IMAGE_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.bmp',
  '.tif',
  '.tiff',
  '.svg',
  '.avif',
  '.heic',
  '.heif',
  '.jfif'
]);

const VIDEO_EXTENSIONS = new Set([
  '.mp4',
  '.m4v',
  '.mov',
  '.mkv',
  '.webm',
  '.avi',
  '.wmv',
  '.flv',
  '.mpg',
  '.mpeg',
  '.mpe',
  '.mpv',
  '.m2v',
  '.m2ts',
  '.ts',
  '.mts',
  '.3gp',
  '.3g2',
  '.ogv',
  '.ogg',
  '.vob'
]);

function normalizeExtension(filename) {
  return path.extname(String(filename || '')).trim().toLowerCase();
}

function detectMediaType({ mimeType, filename }) {
  const cleanMimeType = String(mimeType || '').trim().toLowerCase();
  const extension = normalizeExtension(filename);

  if (cleanMimeType.startsWith('image/') || IMAGE_EXTENSIONS.has(extension)) {
    return {
      mediaType: 'image',
      extension
    };
  }

  if (cleanMimeType.startsWith('video/') || VIDEO_EXTENSIONS.has(extension)) {
    return {
      mediaType: 'video',
      extension
    };
  }

  return {
    mediaType: null,
    extension
  };
}

function isSupportedMediaFile({ mimeType, filename }) {
  return Boolean(detectMediaType({ mimeType, filename }).mediaType);
}

function getAcceptedMediaHint() {
  return 'image/*,video/*,.jpg,.jpeg,.png,.gif,.webp,.bmp,.tif,.tiff,.svg,.avif,.heic,.heif,.jfif,.mp4,.m4v,.mov,.mkv,.webm,.avi,.wmv,.flv,.mpg,.mpeg,.m2ts,.ts,.mts,.3gp,.3g2,.ogv,.ogg,.vob';
}

module.exports = {
  detectMediaType,
  isSupportedMediaFile,
  getAcceptedMediaHint,
  IMAGE_EXTENSIONS,
  VIDEO_EXTENSIONS
};
