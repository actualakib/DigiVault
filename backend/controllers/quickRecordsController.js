const quickRecords = require('../../database/queries/quickRecords');
const { encryptField, decryptField } = require('../../security/encryption');
const { logAction } = require('../../security/audit');

function toResponse(record, bankAccounts, firebaseUid) {
  return {
    id: record.id,
    relation: record.relation,
    fullName: record.full_name,
    passportNumber: record.passport_number,
    nidNumber: record.nid_number,
    birthCertificateNumber: record.birth_certificate_number,
    transcriptDetails: record.transcript_details,
    bankAccounts: (bankAccounts || []).map((account) => ({
      id: account.id,
      label: account.label,
      accountNumber: decryptField(account.account_number, firebaseUid)
    }))
  };
}

async function listAll(req, res) {
  const records = await quickRecords.listRecords(req.user.userId);
  const withAccounts = await Promise.all(records.map(async (record) => {
    const accounts = await quickRecords.listBankAccounts(record.id);
    return toResponse(record, accounts, req.user.firebaseUid);
  }));
  return res.json(withAccounts);
}

async function upsertSelf(req, res) {
  const { fullName, passportNumber, nidNumber, birthCertificateNumber, transcriptDetails } = req.body;
  const record = await quickRecords.upsertSelfRecord(req.user.userId, {
    fullName, passportNumber, nidNumber, birthCertificateNumber, transcriptDetails
  });
  await logAction(req, { action: 'record_save', feature: 'quick_records', metadata: { relation: 'self' } });
  return res.json(toResponse(record, [], req.user.firebaseUid));
}

async function addFamilyMember(req, res) {
  const { relation, fullName, passportNumber, nidNumber, birthCertificateNumber, transcriptDetails } = req.body;
  if (!['father', 'mother', 'spouse', 'child'].includes(relation)) {
    return res.status(400).json({ error: 'Invalid relation' });
  }
  const record = await quickRecords.createRecord(req.user.userId, {
    relation, fullName, passportNumber, nidNumber, birthCertificateNumber, transcriptDetails
  });
  await logAction(req, { action: 'record_create', feature: 'quick_records', metadata: { relation } });
  return res.status(201).json(toResponse(record, [], req.user.firebaseUid));
}

async function updateRecord(req, res) {
  const record = await quickRecords.getRecord(req.user.userId, req.params.recordId);
  if (!record) {
    return res.status(404).json({ error: 'Record not found' });
  }
  const { fullName, passportNumber, nidNumber, birthCertificateNumber, transcriptDetails } = req.body;
  const updated = await quickRecords.updateRecord(req.user.userId, record.id, {
    fullName, passportNumber, nidNumber, birthCertificateNumber, transcriptDetails
  });
  await logAction(req, { action: 'record_update', feature: 'quick_records', metadata: { recordId: record.id } });
  return res.json(toResponse(updated, [], req.user.firebaseUid));
}

async function deleteRecord(req, res) {
  await quickRecords.deleteRecord(req.user.userId, req.params.recordId);
  await logAction(req, { action: 'record_delete', feature: 'quick_records', metadata: { recordId: req.params.recordId } });
  return res.status(204).send();
}

async function addBankAccount(req, res) {
  const record = await quickRecords.getRecord(req.user.userId, req.params.recordId);
  if (!record) {
    return res.status(404).json({ error: 'Record not found' });
  }
  const { label, accountNumber } = req.body;
  if (!accountNumber) {
    return res.status(400).json({ error: 'accountNumber is required' });
  }
  const encrypted = encryptField(accountNumber, req.user.firebaseUid);
  const account = await quickRecords.addBankAccount(record.id, { label, accountNumber: encrypted });
  await logAction(req, { action: 'bank_account_add', feature: 'quick_records', metadata: { recordId: record.id } });
  return res.status(201).json({ id: account.id, label: account.label, accountNumber });
}

async function deleteBankAccount(req, res) {
  const record = await quickRecords.getRecord(req.user.userId, req.params.recordId);
  if (!record) {
    return res.status(404).json({ error: 'Record not found' });
  }
  await quickRecords.deleteBankAccount(record.id, req.params.accountId);
  await logAction(req, { action: 'bank_account_delete', feature: 'quick_records', metadata: { recordId: record.id } });
  return res.status(204).send();
}

module.exports = { listAll, upsertSelf, addFamilyMember, updateRecord, deleteRecord, addBankAccount, deleteBankAccount };
