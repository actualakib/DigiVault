const path = require('path');
const fs = require('fs/promises');
const personalVault = require('../../database/queries/personalVault');
const customCategories = require('../../database/queries/customCategories');
const { categoryForMime } = require('../services/imageService');
const { extractText } = require('../services/ocrService');
const { ensureDirSync, safeFileName, resolvePath, removeFile } = require('../services/storage');
const { logAction } = require('../../security/audit');

const ALLOWED_MIME_PREFIXES = ['application/pdf', 'image/', 'video/', 'application/msword',
  'application/vnd.openxmlformats-officedocument', 'application/vnd.ms-excel'];

function isAllowedMime(mimeType) {
  return ALLOWED_MIME_PREFIXES.some((prefix) => mimeType.startsWith(prefix));
}

async function listFiles(req, res) {
  const files = await personalVault.listFiles(req.user.userId);
  const grouped = { photos: [], videos: [], documents: [] };
  for (const file of files) {
    grouped[file.category].push(file);
  }
  return res.json(grouped);
}

async function search(req, res) {
  const term = req.query.q || '';
  const results = await personalVault.searchFiles(req.user.userId, term);
  return res.json(results);
}

async function uploadFile(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  if (!isAllowedMime(req.file.mimetype)) {
    return res.status(415).json({ error: 'Unsupported file type' });
  }

  const category = categoryForMime(req.file.mimetype);
  const userDir = resolvePath('personal-vault', String(req.user.userId));
  ensureDirSync(userDir);
  const storedName = safeFileName(req.file.originalname);
  const storagePath = path.join(userDir, storedName);
  await fs.writeFile(storagePath, req.file.buffer);

  const ocrText = await extractText(req.file.buffer, req.file.mimetype);

  const record = await personalVault.insertFile({
    userId: req.user.userId,
    category,
    originalName: req.file.originalname,
    storedName,
    mimeType: req.file.mimetype,
    sizeBytes: req.file.size,
    storagePath,
    ocrText
  });

  await logAction(req, { action: 'file_upload', feature: 'personal_vault', metadata: { fileId: record.id, category } });

  return res.status(201).json(record);
}

async function downloadFile(req, res) {
  const file = await personalVault.getFile(req.user.userId, req.params.fileId);
  if (!file) {
    return res.status(404).json({ error: 'File not found' });
  }
  await logAction(req, { action: 'file_download', feature: 'personal_vault', metadata: { fileId: file.id } });
  return res.download(file.storage_path, file.original_name);
}

async function deleteFile(req, res) {
  const deleted = await personalVault.deleteFile(req.user.userId, req.params.fileId);
  if (!deleted) {
    return res.status(404).json({ error: 'File not found' });
  }
  await customCategories.deleteFileCategories(req.user.userId, 'personal_vault', req.params.fileId);
  await removeFile(deleted.storage_path);
  await logAction(req, { action: 'file_delete', feature: 'personal_vault', metadata: { fileId: req.params.fileId } });
  return res.status(204).send();
}

module.exports = { listFiles, search, uploadFile, downloadFile, deleteFile };
// module 2, feature 3 by @actualakib and @zareen76
