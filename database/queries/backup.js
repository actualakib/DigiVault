const { query } = require('../db');

async function loadBackupData(userId) {
  const [personalFiles, financialFiles, certificateFiles, categories] = await Promise.all([
    query(
      `SELECT id, category, original_name, mime_type, size_bytes, storage_path, created_at
       FROM personal_vault_files WHERE user_id = $1 ORDER BY created_at ASC`,
      [userId]
    ),
    query(
            `SELECT f.id, f.folder_id, folders.name AS folder_name, f.original_name,
              f.mime_type, f.size_bytes, f.storage_path, f.created_at
       FROM financial_vault_files f
       JOIN financial_vault_folders folders ON folders.id = f.folder_id AND folders.user_id = f.user_id
       WHERE f.user_id = $1 ORDER BY f.created_at ASC`,
      [userId]
    ),
    query(
            `SELECT f.id, f.folder_id, folders.name AS folder_name, f.original_name,
              f.mime_type, f.size_bytes, f.storage_path, f.created_at
       FROM certificates_files f
       JOIN certificates_folders folders ON folders.id = f.folder_id AND folders.user_id = f.user_id
       WHERE f.user_id = $1 ORDER BY f.created_at ASC`,
      [userId]
    ),
    query(
      `SELECT feature, file_id, category, created_at
       FROM custom_file_categories WHERE user_id = $1 AND category IN ('Favourite', 'Emergency')
       ORDER BY category ASC, created_at ASC`,
      [userId]
    )
  ]);

  return {
    personalFiles: personalFiles.rows,
    financialFiles: financialFiles.rows,
    certificateFiles: certificateFiles.rows,
    categories: categories.rows
  };
}

module.exports = { loadBackupData };