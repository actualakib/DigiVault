const { query } = require('../db');

async function findByFirebaseUid(firebaseUid) {
  const result = await query('SELECT * FROM users WHERE firebase_uid = $1', [firebaseUid]);
  return result.rows[0] || null;
}

async function findById(id) {
  const result = await query('SELECT * FROM users WHERE id = $1', [id]);
  return result.rows[0] || null;
}

async function createUser({ firebaseUid, email, displayName, photoUrl }) {
  const result = await query(
    `INSERT INTO users (firebase_uid, email, display_name, photo_url, last_login_at)
     VALUES ($1, $2, $3, $4, now())
     RETURNING *`,
    [firebaseUid, email, displayName || null, photoUrl || null]
  );
  return result.rows[0];
}

async function touchLastLogin(id) {
  await query('UPDATE users SET last_login_at = now() WHERE id = $1', [id]);
}

async function setPinHash(id, pinHash) {
  const result = await query(
    `UPDATE users SET pin_hash = $2, pin_set_at = now() WHERE id = $1 RETURNING *`,
    [id, pinHash]
  );
  return result.rows[0];
}

async function updateProfile(id, { displayName, photoUrl }) {
  const result = await query(
    `UPDATE users SET display_name = COALESCE($2, display_name), photo_url = COALESCE($3, photo_url)
     WHERE id = $1 RETURNING *`,
    [id, displayName || null, photoUrl || null]
  );
  return result.rows[0];
}

async function deleteUser(id) {
  await query('DELETE FROM users WHERE id = $1', [id]);
}

module.exports = {
  findByFirebaseUid,
  findById,
  createUser,
  touchLastLogin,
  setPinHash,
  updateProfile,
  deleteUser
};
// module 1, feature 1 by @actualakib
