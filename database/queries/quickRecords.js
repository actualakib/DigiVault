const { query } = require('../db');

async function listRecords(userId) {
  const result = await query(
    `SELECT * FROM quick_records WHERE user_id = $1 ORDER BY
     CASE relation WHEN 'self' THEN 0 WHEN 'father' THEN 1 WHEN 'mother' THEN 2 WHEN 'spouse' THEN 3 ELSE 4 END,
     created_at ASC`,
    [userId]
  );
  return result.rows;
}

async function getRecord(userId, recordId) {
  const result = await query(
    `SELECT * FROM quick_records WHERE user_id = $1 AND id = $2`,
    [userId, recordId]
  );
  return result.rows[0] || null;
}

async function upsertSelfRecord(userId, fields) {
  const existing = await query(
    `SELECT id FROM quick_records WHERE user_id = $1 AND relation = 'self'`,
    [userId]
  );
  if (existing.rows[0]) {
    return updateRecord(userId, existing.rows[0].id, fields);
  }
  return createRecord(userId, { ...fields, relation: 'self' });
}

async function createRecord(userId, { relation, fullName, passportNumber, nidNumber, birthCertificateNumber, transcriptDetails }) {
  const result = await query(
    `INSERT INTO quick_records
     (user_id, relation, full_name, passport_number, nid_number, birth_certificate_number, transcript_details)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [userId, relation, fullName || null, passportNumber || null, nidNumber || null, birthCertificateNumber || null, transcriptDetails || null]
  );
  return result.rows[0];
}

async function updateRecord(userId, recordId, { fullName, passportNumber, nidNumber, birthCertificateNumber, transcriptDetails }) {
  const result = await query(
    `UPDATE quick_records SET
       full_name = COALESCE($3, full_name),
       passport_number = COALESCE($4, passport_number),
       nid_number = COALESCE($5, nid_number),
       birth_certificate_number = COALESCE($6, birth_certificate_number),
       transcript_details = COALESCE($7, transcript_details),
       updated_at = now()
     WHERE user_id = $1 AND id = $2 RETURNING *`,
    [userId, recordId, fullName, passportNumber, nidNumber, birthCertificateNumber, transcriptDetails]
  );
  return result.rows[0];
}

async function deleteRecord(userId, recordId) {
  await query(`DELETE FROM quick_records WHERE user_id = $1 AND id = $2 AND relation != 'self'`, [userId, recordId]);
}

async function listBankAccounts(recordId) {
  const result = await query(
    `SELECT * FROM quick_record_bank_accounts WHERE quick_record_id = $1 ORDER BY created_at ASC`,
    [recordId]
  );
  return result.rows;
}

async function addBankAccount(recordId, { label, accountNumber }) {
  const result = await query(
    `INSERT INTO quick_record_bank_accounts (quick_record_id, label, account_number)
     VALUES ($1, $2, $3) RETURNING *`,
    [recordId, label || null, accountNumber]
  );
  return result.rows[0];
}

async function deleteBankAccount(recordId, accountId) {
  await query(
    `DELETE FROM quick_record_bank_accounts WHERE quick_record_id = $1 AND id = $2`,
    [recordId, accountId]
  );
}

module.exports = {
  listRecords,
  getRecord,
  upsertSelfRecord,
  createRecord,
  updateRecord,
  deleteRecord,
  listBankAccounts,
  addBankAccount,
  deleteBankAccount
};
