const { query } = require('../db');

const DEFAULT_FOLDERS = ['Bank', 'Properties', 'Tax'];

async function ensureDefaultFolders(userId) {
  for (const name of DEFAULT_FOLDERS) {
    await query(
      `INSERT INTO financial_vault_folders (user_id, name, is_default)
       VALUES ($1, $2, true) ON CONFLICT (user_id, name) DO NOTHING`,
      [userId, name]
    );
  }
}

async function listFolders(userId) {
  const result = await query(
    `SELECT * FROM financial_vault_folders WHERE user_id = $1 ORDER BY is_default DESC, name ASC`,
    [userId]
  );
  return result.rows;
}

async function createFolder(userId, name) {
  const result = await query(
    `INSERT INTO financial_vault_folders (user_id, name, is_default)
     VALUES ($1, $2, false) RETURNING *`,
    [userId, name]
  );
  return result.rows[0];
}

async function getFolder(userId, folderId) {
  const result = await query(
    `SELECT * FROM financial_vault_folders WHERE user_id = $1 AND id = $2`,
    [userId, folderId]
  );
  return result.rows[0] || null;
}

async function listFiles(userId, folderId) {
  const result = await query(
    `SELECT id, folder_id, original_name, mime_type, size_bytes, created_at
     FROM financial_vault_files WHERE user_id = $1 AND folder_id = $2 ORDER BY created_at DESC`,
    [userId, folderId]
  );
  return result.rows;
}

async function getFile(userId, fileId) {
  const result = await query(
    `SELECT * FROM financial_vault_files WHERE user_id = $1 AND id = $2`,
    [userId, fileId]
  );
  return result.rows[0] || null;
}

async function insertFile({ userId, folderId, originalName, storedName, mimeType, sizeBytes, storagePath, ocrText }) {
  const result = await query(
    `INSERT INTO financial_vault_files
     (user_id, folder_id, original_name, stored_name, mime_type, size_bytes, storage_path, ocr_text)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [userId, folderId, originalName, storedName, mimeType, sizeBytes, storagePath, ocrText || null]
  );
  return result.rows[0];
}

async function deleteFile(userId, fileId) {
  const result = await query(
    `DELETE FROM financial_vault_files WHERE user_id = $1 AND id = $2 RETURNING storage_path`,
    [userId, fileId]
  );
  return result.rows[0] || null;
}

module.exports = {
  ensureDefaultFolders,
  listFolders,
  createFolder,
  getFolder,
  listFiles,
  getFile,
  insertFile,
  deleteFile
};
