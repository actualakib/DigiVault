const { query } = require('../db');

async function recordLog({ userId, action, feature, metadata, ipAddress }) {
  await query(
    `INSERT INTO audit_logs (user_id, action, feature, metadata, ip_address)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId || null, action, feature, metadata ? JSON.stringify(metadata) : null, ipAddress || null]
  );
}

async function listLogs(userId, limit = 100) {
  const result = await query(
    `SELECT id, action, feature, metadata, ip_address, created_at
     FROM audit_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2`,
    [userId, limit]
  );
  return result.rows;
}

async function listFileActivity(userId, limit = 100) {
  const result = await query(
    `SELECT id, action, feature, metadata, ip_address, created_at
     FROM audit_logs
     WHERE user_id = $1 AND action IN (
       'file_upload', 'file_download', 'file_delete', 'file_update', 'file_modify', 'file_rename',
       'folder_create', 'folder_update', 'folder_delete', 'folder_rename', 'folder_upload', 'folder_download',
      'file_convert', 'file_categorize', 'file_uncategorize'
     )
     ORDER BY created_at DESC LIMIT $2`,
    [userId, limit]
  );
  return result.rows;
}

module.exports = { recordLog, listLogs, listFileActivity };
