const fs = require('node:fs/promises');
const path = require('node:path');
const { spawn } = require('node:child_process');
const sharp = require('sharp');

function runProcess(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }

      reject(new Error(`${command} exited with code ${code}: ${stderr || stdout}`.trim()));
    });
  });
}

async function getImageMetadata(filePath) {
  const metadata = await sharp(filePath).metadata();

  return {
    width: metadata.width || null,
    height: metadata.height || null,
    durationSeconds: null
  };
}

async function createImageThumbnail(sourcePath, targetPath) {
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await sharp(sourcePath)
    .rotate()
    .resize({ width: 640, height: 640, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(targetPath);
}

async function getVideoMetadata(filePath) {
  const { stdout } = await runProcess('ffprobe', [
    '-v',
    'error',
    '-print_format',
    'json',
    '-show_streams',
    '-show_format',
    filePath
  ]);

  const parsed = JSON.parse(stdout);
  const videoStream = (parsed.streams || []).find((stream) => stream.codec_type === 'video') || {};
  const duration = parsed.format?.duration || videoStream.duration || null;

  return {
    width: videoStream.width || null,
    height: videoStream.height || null,
    durationSeconds: duration ? Number(duration) : null
  };
}

async function createVideoThumbnail(sourcePath, targetPath) {
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await runProcess('ffmpeg', [
    '-y',
    '-ss',
    '00:00:00.100',
    '-i',
    sourcePath,
    '-frames:v',
    '1',
    '-vf',
    'scale=640:-1:force_original_aspect_ratio=decrease',
    targetPath
  ]);
}

module.exports = {
  getImageMetadata,
  createImageThumbnail,
  getVideoMetadata,
  createVideoThumbnail
};
