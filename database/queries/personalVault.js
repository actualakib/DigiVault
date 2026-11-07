const { query } = require('../db');

async function listFiles(userId) {
  const result = await query(
    `SELECT id, category, original_name, mime_type, size_bytes, created_at
     FROM personal_vault_files WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );
  return result.rows;
}

async function getFile(userId, fileId) {
  const result = await query(
    `SELECT * FROM personal_vault_files WHERE user_id = $1 AND id = $2`,
    [userId, fileId]
  );
  return result.rows[0] || null;
}

async function insertFile({ userId, category, originalName, storedName, mimeType, sizeBytes, storagePath, ocrText }) {
  const result = await query(
    `INSERT INTO personal_vault_files
     (user_id, category, original_name, stored_name, mime_type, size_bytes, storage_path, ocr_text)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [userId, category, originalName, storedName, mimeType, sizeBytes, storagePath, ocrText || null]
  );
  return result.rows[0];
}

async function deleteFile(userId, fileId) {
  const result = await query(
    `DELETE FROM personal_vault_files WHERE user_id = $1 AND id = $2 RETURNING storage_path`,
    [userId, fileId]
  );
  return result.rows[0] || null;
}

async function searchFiles(userId, term) {
  const result = await query(
    `SELECT id, category, original_name, mime_type, size_bytes, created_at
     FROM personal_vault_files
    WHERE user_id = $1 AND (LOWER(original_name) LIKE LOWER($2) OR LOWER(ocr_text) LIKE LOWER($2))
     ORDER BY created_at DESC`,
    [userId, `%${term}%`]
  );
  return result.rows;
}

module.exports = { listFiles, getFile, insertFile, deleteFile, searchFiles };
