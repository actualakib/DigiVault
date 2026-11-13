const { ZipArchive } = require('archiver');
const fs = require('fs');
const path = require('path');
const backupQuery = require('../../database/queries/backup');
const { STORAGE_ROOT } = require('./storage');

function safeArchiveFileName(name) {
  return path.basename(String(name || 'file')).replace(/[<>:"|?*\x00-\x1F]/g, '_').replace(/[\\/]/g, '_') || 'file';
}

function resolveStoredFile(filePath) {
  const resolvedPath = path.resolve(filePath);
  const relativePath = path.relative(path.resolve(STORAGE_ROOT), resolvedPath);
  if (!relativePath || relativePath.startsWith('..') || path.isAbsolute(relativePath)) return null;
  return fs.existsSync(resolvedPath) ? resolvedPath : null;
}

function addArchiveFiles(archive, files, createEntryName, manifestFiles, missingFiles) {
  files.forEach((file) => {
    const archivePath = createEntryName(file);
    const storedPath = resolveStoredFile(file.storage_path || file.output_path);
    if (!storedPath) {
      missingFiles.push({ fileName: file.original_name || file.output_name, archivePath });
      return;
    }
    archive.file(storedPath, { name: archivePath });
    manifestFiles.push(archivePath);
  });
}

async function createBackupArchive(userId) {
  const data = await backupQuery.loadBackupData(userId);
  const archive = new ZipArchive({ zlib: { level: 6 } });
  const manifestFiles = [];
  const missingFiles = [];
  const textFiles = [];

  addArchiveFiles(archive, data.personalFiles, (file) =>
    `Personal Vault/${file.category}/${file.id}-${safeArchiveFileName(file.original_name)}`,
  textFiles, missingFiles);
  addArchiveFiles(archive, data.financialFiles, (file) =>
    `Financial Vault/folder-${file.folder_id}/${file.id}-${safeArchiveFileName(file.original_name)}`,
  textFiles, missingFiles);
  addArchiveFiles(archive, data.certificateFiles, (file) =>
    `Certificates/folder-${file.folder_id}/${file.id}-${safeArchiveFileName(file.original_name)}`,
  textFiles, missingFiles);
  const backupContent = {
    exportedAt: new Date().toISOString(),
    contents: 'Uploaded files from Personal Vault, Financial Vault, and Certificates, plus non-sensitive file metadata. OCR text, saved credentials, bank details, quick records, audit logs, and converted outputs are not exported.',
    personalFiles: data.personalFiles.map(({ storage_path, ...file }) => file),
    financialFiles: data.financialFiles.map(({ storage_path, ...file }) => file),
    certificateFiles: data.certificateFiles.map(({ storage_path, ...file }) => file),
    categories: data.categories,
    includedFilePaths: textFiles,
    missingFiles
  };

  archive.append(
    `DigiVault Local File Backup\nThis archive contains uploaded vault files and their non-sensitive metadata. Passwords, bank details, quick records, OCR text, and converted outputs are not included. Uploaded files may themselves contain sensitive information; store the archive securely.\n\n${JSON.stringify(backupContent, null, 2)}\n`,
    { name: 'DigiVault_Backup.txt' }
  );

  return archive;
}

module.exports = { createBackupArchive };