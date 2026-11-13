const users = require('../../database/queries/users');
const auditLogs = require('../../database/queries/auditLogs');
const { admin } = require('../../security/firebaseAdmin');
const { isValidPin, hashPin, verifyPin } = require('../../security/pin');
const { logAction } = require('../../security/audit');
const { createBackupArchive } = require('../services/backupService');

async function getProfile(req, res) {
  const user = await users.findById(req.user.userId);
  return res.json({
    id: user.id,
    email: user.email,
    displayName: user.display_name,
    photoUrl: user.photo_url,
    createdAt: user.created_at,
    lastLoginAt: user.last_login_at
  });
}

async function updateProfile(req, res) {
  const { displayName, photoUrl } = req.body;
  const user = await users.updateProfile(req.user.userId, { displayName, photoUrl });
  await logAction(req, { action: 'profile_update', feature: 'profile' });
  return res.json({ id: user.id, displayName: user.display_name, photoUrl: user.photo_url });
}

async function changePin(req, res) {
  const { currentPin, newPin } = req.body;
  if (!isValidPin(newPin)) {
    return res.status(400).json({ error: 'New PIN must be 4-8 digits' });
  }
  const user = await users.findById(req.user.userId);
  const valid = await verifyPin(currentPin, user.pin_hash);
  if (!valid) {
    await logAction(req, { action: 'pin_change_failed', feature: 'security' });
    return res.status(401).json({ error: 'Current PIN is incorrect' });
  }
  const newHash = await hashPin(newPin);
  await users.setPinHash(req.user.userId, newHash);
  await logAction(req, { action: 'pin_change_success', feature: 'security' });
  return res.status(204).send();
}

async function getAuditLogs(req, res) {
  const logs = await auditLogs.listLogs(req.user.userId);
  return res.json(logs);
}

async function getFileActivityLogs(req, res) {
  const logs = await auditLogs.listFileActivity(req.user.userId);
  return res.json(logs);
}

async function exportBackup(req, res, next) {
  try {
    const archive = await createBackupArchive(req.user.userId);
    await logAction(req, { action: 'backup_export', feature: 'profile' });
    archive.on('error', (err) => {
      if (res.headersSent) res.destroy(err);
      else next(err);
    });
    res.attachment(`DigiVault-Backup-${new Date().toISOString().slice(0, 10)}.zip`);
    archive.pipe(res);
    archive.finalize();
  } catch (err) {
    next(err);
  }
}

async function deleteAccount(req, res) {
  await logAction(req, { action: 'account_delete', feature: 'security' });
  try {
    await admin.auth().deleteUser(req.user.firebaseUid);
  } catch (err) {
    // Firebase record may already be gone; proceed with local deletion regardless
  }
  await users.deleteUser(req.user.userId);
  return res.status(204).send();
}

module.exports = { getProfile, updateProfile, changePin, getAuditLogs, getFileActivityLogs, exportBackup, deleteAccount };
