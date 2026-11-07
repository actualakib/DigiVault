const passwordManager = require('../../database/queries/passwordManager');
const { encryptField, decryptField } = require('../../security/encryption');
const { logAction } = require('../../security/audit');

async function listEntries(req, res) {
  const entries = await passwordManager.listEntries(req.user.userId);
  return res.json(entries);
}

async function getEntry(req, res) {
  const entry = await passwordManager.getEntry(req.user.userId, req.params.entryId);
  if (!entry) {
    return res.status(404).json({ error: 'Entry not found' });
  }
  await logAction(req, { action: 'password_reveal', feature: 'password_manager', metadata: { entryId: entry.id } });
  return res.json({
    id: entry.id,
    siteName: entry.site_name,
    siteUrl: entry.site_url,
    username: entry.username,
    password: decryptField(entry.encrypted_password, req.user.firebaseUid),
    notes: decryptField(entry.encrypted_notes, req.user.firebaseUid)
  });
}

async function createEntry(req, res) {
  const { siteName, siteUrl, username, password, notes } = req.body;
  if (!siteName || !password) {
    return res.status(400).json({ error: 'siteName and password are required' });
  }
  const entry = await passwordManager.createEntry({
    userId: req.user.userId,
    siteName,
    siteUrl,
    username,
    encryptedPassword: encryptField(password, req.user.firebaseUid),
    encryptedNotes: encryptField(notes, req.user.firebaseUid)
  });
  await logAction(req, { action: 'password_create', feature: 'password_manager', metadata: { entryId: entry.id } });
  return res.status(201).json({ id: entry.id, siteName: entry.site_name, siteUrl: entry.site_url, username: entry.username });
}

async function updateEntry(req, res) {
  const { siteName, siteUrl, username, password, notes } = req.body;
  const entry = await passwordManager.updateEntry(req.user.userId, req.params.entryId, {
    siteName, siteUrl, username,
    encryptedPassword: password ? encryptField(password, req.user.firebaseUid) : undefined,
    encryptedNotes: notes !== undefined ? encryptField(notes, req.user.firebaseUid) : undefined
  });
  if (!entry) {
    return res.status(404).json({ error: 'Entry not found' });
  }
  await logAction(req, { action: 'password_update', feature: 'password_manager', metadata: { entryId: entry.id } });
  return res.json({ id: entry.id, siteName: entry.site_name, siteUrl: entry.site_url, username: entry.username });
}

async function deleteEntry(req, res) {
  await passwordManager.deleteEntry(req.user.userId, req.params.entryId);
  await logAction(req, { action: 'password_delete', feature: 'password_manager', metadata: { entryId: req.params.entryId } });
  return res.status(204).send();
}

module.exports = { listEntries, getEntry, createEntry, updateEntry, deleteEntry };
