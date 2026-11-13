const { query } = require('../db');

const FILE_TABLES = {
  personal_vault: 'personal_vault_files',
  financial_vault: 'financial_vault_files',
  certificates: 'certificates_files'
};
const ALLOWED_CATEGORIES = ['Favourite', 'Emergency'];

async function addFileCategory(userId, feature, fileId, category) {
  const table = FILE_TABLES[feature];
  if (!table || !ALLOWED_CATEGORIES.includes(category)) return null;

  const file = await query(
    `SELECT id FROM ${table} WHERE user_id = $1 AND id = $2`,
    [userId, fileId]
  );
  if (!file.rows[0]) return null;

  await query(
    `INSERT INTO custom_file_categories (user_id, feature, file_id, category)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, feature, file_id, category) DO NOTHING`,
    [userId, feature, fileId, category]
  );
  return { user_id: userId, feature, file_id: fileId, category };
}

async function removeFileCategory(userId, feature, fileId, category) {
  if (!FILE_TABLES[feature] || !ALLOWED_CATEGORIES.includes(category)) return false;
  const result = await query(
    `DELETE FROM custom_file_categories
     WHERE user_id = $1 AND feature = $2 AND file_id = $3 AND category = $4`,
    [userId, feature, fileId, category]
  );
  return result.rowCount > 0;
}

async function deleteFileCategories(userId, feature, fileId) {
  await query(
    `DELETE FROM custom_file_categories
     WHERE user_id = $1 AND feature = $2 AND file_id = $3`,
    [userId, feature, fileId]
  );
}

function categorizedFileSelects() {
  return Object.entries(FILE_TABLES).map(([feature, table]) => `
    SELECT c.category, c.feature, f.id AS file_id, f.original_name, f.mime_type, f.created_at
    FROM custom_file_categories c
    JOIN ${table} f ON f.id = c.file_id AND f.user_id = c.user_id
    WHERE c.user_id = $1 AND c.feature = '${feature}'
      AND c.category IN ('Favourite', 'Emergency')
  `);
}

async function listCategories(userId) {
  const result = await query(
    `SELECT 'Favourite' AS category, COUNT(*) AS file_count
     FROM custom_file_categories WHERE user_id = $1 AND category = 'Favourite'
     UNION ALL
     SELECT 'Emergency' AS category, COUNT(*) AS file_count
     FROM custom_file_categories WHERE user_id = $1 AND category = 'Emergency'`,
    [userId]
  );
  return result.rows;
}

async function listCategorizedFiles(userId, { category, query: searchQuery, feature } = {}) {
  if (category && !ALLOWED_CATEGORIES.includes(category)) return [];
  if (feature && !FILE_TABLES[feature]) return [];
  const selects = categorizedFileSelects().map((select) => `
    SELECT * FROM (${select}) feature_files
    WHERE ($2 IS NULL OR category = $2)
      AND ($3 IS NULL OR LOWER(original_name) LIKE LOWER($3))
      AND ($4 IS NULL OR feature = $4)
  `);
  const searchPattern = searchQuery ? `%${searchQuery}%` : null;
  const result = await query(
    `${selects.join(' UNION ALL ')} ORDER BY created_at DESC, original_name ASC`,
    [userId, category || null, searchPattern, feature || null]
  );
  return result.rows;
}

module.exports = { addFileCategory, removeFileCategory, deleteFileCategories, listCategories, listCategorizedFiles };