const sharp = require('sharp');

function categoryForMime(mimeType) {
  if (mimeType.startsWith('image/')) return 'photos';
  if (mimeType.startsWith('video/')) return 'videos';
  return 'documents';
}

async function normalizeImage(buffer) {
  return sharp(buffer).rotate().toBuffer();
}

module.exports = { categoryForMime, normalizeImage };
