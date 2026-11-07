const { query } = require('../db');

async function listEntries(userId) {
  const result = await query(
    `SELECT id, site_name, site_url, username, created_at, updated_at
     FROM password_entries WHERE user_id = $1 ORDER BY site_name ASC`,
    [userId]
  );
  return result.rows;
}

async function getEntry(userId, entryId) {
  const result = await query(
    `SELECT * FROM password_entries WHERE user_id = $1 AND id = $2`,
    [userId, entryId]
  );
  return result.rows[0] || null;
}

async function createEntry({ userId, siteName, siteUrl, username, encryptedPassword, encryptedNotes }) {
  const result = await query(
    `INSERT INTO password_entries (user_id, site_name, site_url, username, encrypted_password, encrypted_notes)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [userId, siteName, siteUrl || null, username || null, encryptedPassword, encryptedNotes || null]
  );
  return result.rows[0];
}

async function updateEntry(userId, entryId, { siteName, siteUrl, username, encryptedPassword, encryptedNotes }) {
  const result = await query(
    `UPDATE password_entries SET
       site_name = COALESCE($3, site_name),
       site_url = COALESCE($4, site_url),
       username = COALESCE($5, username),
       encrypted_password = COALESCE($6, encrypted_password),
       encrypted_notes = COALESCE($7, encrypted_notes),
       updated_at = now()
     WHERE user_id = $1 AND id = $2 RETURNING *`,
    [userId, entryId, siteName, siteUrl, username, encryptedPassword, encryptedNotes]
  );
  return result.rows[0];
}

async function deleteEntry(userId, entryId) {
  await query(`DELETE FROM password_entries WHERE user_id = $1 AND id = $2`, [userId, entryId]);
}

module.exports = { listEntries, getEntry, createEntry, updateEntry, deleteEntry };
