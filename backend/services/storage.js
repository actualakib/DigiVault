const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

const STORAGE_ROOT = process.env.STORAGE_ROOT || path.join(__dirname, '..', '..', 'storage');

function ensureDirSync(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function safeFileName(originalName) {
  const ext = path.extname(originalName);
  const base = path.basename(originalName, ext).replace(/[^a-zA-Z0-9-_]/g, '_').slice(0, 60);
  const unique = crypto.randomBytes(8).toString('hex');
  return `${Date.now()}-${unique}-${base}${ext}`;
}

function resolvePath(...segments) {
  return path.join(STORAGE_ROOT, ...segments);
}

async function removeFile(filePath) {
  try {
    await fsp.unlink(filePath);
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
}

module.exports = { STORAGE_ROOT, ensureDirSync, safeFileName, resolvePath, removeFile };
