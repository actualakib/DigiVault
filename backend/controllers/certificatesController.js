const path = require('path');
const fs = require('fs/promises');
const certificates = require('../../database/queries/certificates');
const { extractText } = require('../services/ocrService');
const { ensureDirSync, safeFileName, resolvePath, removeFile } = require('../services/storage');
const { logAction } = require('../../security/audit');

async function listFolders(req, res) {
  await certificates.ensureDefaultFolders(req.user.userId);
  const folders = await certificates.listFolders(req.user.userId);
  return res.json(folders);
}

async function createFolder(req, res) {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Folder name is required' });
  }
  const folder = await certificates.createFolder(req.user.userId, name.trim());
  await logAction(req, { action: 'folder_create', feature: 'certificates', metadata: { folderId: folder.id } });
  return res.status(201).json(folder);
}

async function listFiles(req, res) {
  const folder = await certificates.getFolder(req.user.userId, req.params.folderId);
  if (!folder) {
    return res.status(404).json({ error: 'Folder not found' });
  }
  const files = await certificates.listFiles(req.user.userId, folder.id);
  return res.json(files);
}

async function uploadFile(req, res) {
  const folder = await certificates.getFolder(req.user.userId, req.params.folderId);
  if (!folder) {
    return res.status(404).json({ error: 'Folder not found' });
  }
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const userDir = resolvePath('certificates', String(req.user.userId), String(folder.id));
  ensureDirSync(userDir);
  const storedName = safeFileName(req.file.originalname);
  const storagePath = path.join(userDir, storedName);
  await fs.writeFile(storagePath, req.file.buffer);

  const ocrText = await extractText(req.file.buffer, req.file.mimetype);

  const record = await certificates.insertFile({
    userId: req.user.userId,
    folderId: folder.id,
    originalName: req.file.originalname,
    storedName,
    mimeType: req.file.mimetype,
    sizeBytes: req.file.size,
    storagePath,
    ocrText
  });

  await logAction(req, { action: 'file_upload', feature: 'certificates', metadata: { fileId: record.id, folderId: folder.id } });

  return res.status(201).json(record);
}

async function downloadFile(req, res) {
  const file = await certificates.getFile(req.user.userId, req.params.fileId);
  if (!file) {
    return res.status(404).json({ error: 'File not found' });
  }
  await logAction(req, { action: 'file_download', feature: 'certificates', metadata: { fileId: file.id } });
  return res.download(file.storage_path, file.original_name);
}

async function deleteFile(req, res) {
  const deleted = await certificates.deleteFile(req.user.userId, req.params.fileId);
  if (!deleted) {
    return res.status(404).json({ error: 'File not found' });
  }
  await removeFile(deleted.storage_path);
  await logAction(req, { action: 'file_delete', feature: 'certificates', metadata: { fileId: req.params.fileId } });
  return res.status(204).send();
}

module.exports = { listFolders, createFolder, listFiles, uploadFile, downloadFile, deleteFile };
