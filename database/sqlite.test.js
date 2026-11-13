process.env.SQLITE_DB_PATH = ':memory:';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
process.env.STORAGE_ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'digivault-backup-test-'));
process.env.ENCRYPTION_KEY = 'digivault-test-encryption-key';
const test = require('node:test');
const { close, execute } = require('./db');
const users = require('./queries/users');
const personalVault = require('./queries/personalVault');
const financialVault = require('./queries/financialVault');
const certificates = require('./queries/certificates');
const quickRecords = require('./queries/quickRecords');
const passwordManager = require('./queries/passwordManager');
const fileConverter = require('./queries/fileConverter');
const auditLogs = require('./queries/auditLogs');
const customCategories = require('./queries/customCategories');
const backup = require('./queries/backup');
const { encryptField } = require('../security/encryption');
const { createBackupArchive } = require('../backend/services/backupService');

test('SQLite supports DigiVault database operations', async () => {
  const schema = fs.readFileSync(`${__dirname}/schema.sql`, 'utf8');
  execute(schema);

  const user = await users.createUser({
    firebaseUid: 'sqlite-test-user',
    email: 'sqlite-test@example.test'
  });
  assert.ok(user.id);

  await financialVault.ensureDefaultFolders(user.id);
  await certificates.ensureDefaultFolders(user.id);
  assert.equal((await financialVault.listFolders(user.id)).length, 3);
  assert.equal((await certificates.listFolders(user.id)).length, 2);

  const personalFilePath = path.join(process.env.STORAGE_ROOT, 'demo.txt');
  fs.writeFileSync(personalFilePath, 'Demo file contents');
  await personalVault.insertFile({
    userId: user.id,
    category: 'documents',
    originalName: 'Demo.txt',
    storedName: 'demo.txt',
    mimeType: 'text/plain',
    sizeBytes: 4,
    storagePath: personalFilePath,
    ocrText: 'Searchable text'
  });
  const savedFiles = await personalVault.listFiles(user.id);
  assert.ok(savedFiles[0].id);
  assert.equal(savedFiles[0].ocr_text, 'Searchable text');
  assert.equal((await personalVault.searchFiles(user.id, 'SEARCHABLE')).length, 1);

  const financialFolder = (await financialVault.listFolders(user.id))[0];
  const financialFile = await financialVault.insertFile({
    userId: user.id,
    folderId: financialFolder.id,
    originalName: 'Statement.pdf',
    storedName: 'statement.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 4,
    storagePath: 'statement.pdf'
  });
  const certificateFolder = (await certificates.listFolders(user.id))[0];
  const certificateFile = await certificates.insertFile({
    userId: user.id,
    folderId: certificateFolder.id,
    originalName: 'Certificate.png',
    storedName: 'certificate.png',
    mimeType: 'image/png',
    sizeBytes: 4,
    storagePath: 'certificate.png'
  });
  await customCategories.addFileCategory(user.id, 'personal_vault', savedFiles[0].id, 'Favourite');
  await customCategories.addFileCategory(user.id, 'financial_vault', financialFile.id, 'Favourite');
  await customCategories.addFileCategory(user.id, 'certificates', certificateFile.id, 'Emergency');
  await customCategories.addFileCategory(user.id, 'personal_vault', savedFiles[0].id, 'Favourite');
  assert.deepEqual((await customCategories.listCategories(user.id)).map(({ category, file_count }) => [category, file_count]), [
    ['Favourite', 2],
    ['Emergency', 1]
  ]);
  const matchingFiles = await customCategories.listCategorizedFiles(user.id, { category: 'Favourite', query: 'statement' });
  assert.deepEqual(matchingFiles.map((file) => [file.feature, file.file_id]), [['financial_vault', financialFile.id]]);
  assert.equal((await customCategories.listCategorizedFiles(user.id, { feature: 'certificates' })).length, 1);
  assert.equal(await customCategories.removeFileCategory(user.id, 'certificates', certificateFile.id, 'Emergency'), true);
  assert.equal(await customCategories.removeFileCategory(user.id, 'certificates', certificateFile.id, 'Emergency'), false);
  assert.equal((await customCategories.listCategorizedFiles(user.id, { feature: 'certificates' })).length, 0);
  assert.equal(await customCategories.addFileCategory(user.id, 'personal_vault', savedFiles[0].id, 'Private'), null);

  const otherUser = await users.createUser({
    firebaseUid: 'sqlite-category-other-user',
    email: 'sqlite-category-other@example.test'
  });
  assert.equal(await customCategories.addFileCategory(otherUser.id, 'personal_vault', savedFiles[0].id, 'Private'), null);
  const backupData = await backup.loadBackupData(user.id);
  assert.deepEqual(Object.keys(backupData).sort(), ['categories', 'certificateFiles', 'financialFiles', 'personalFiles']);
  assert.equal(backupData.personalFiles[0].original_name, 'Demo.txt');
  assert.equal(backupData.financialFiles[0].original_name, 'Statement.pdf');
  assert.equal(backupData.certificateFiles[0].original_name, 'Certificate.png');
  assert.equal(Object.hasOwn(backupData.personalFiles[0], 'ocr_text'), false);

  const record = await quickRecords.upsertSelfRecord(user.id, { fullName: 'Demo User' });
  await quickRecords.addBankAccount(record.id, {
    label: 'Demo',
    accountNumber: encryptField('1234', user.firebase_uid)
  });
  assert.equal((await quickRecords.listBankAccounts(record.id)).length, 1);

  const entry = await passwordManager.createEntry({
    userId: user.id,
    siteName: 'Example',
    encryptedPassword: encryptField('example-secret', user.firebase_uid),
    encryptedNotes: encryptField('backup note', user.firebase_uid)
  });
  assert.equal((await passwordManager.updateEntry(user.id, entry.id, { siteName: 'Updated' })).site_name, 'Updated');

  const converterFilePath = path.join(process.env.STORAGE_ROOT, 'converted', 'out.pdf');
  fs.mkdirSync(path.dirname(converterFilePath), { recursive: true });
  fs.writeFileSync(converterFilePath, 'Converted file contents');
  const job = await fileConverter.insertJob({
    userId: user.id,
    sourceType: 'upload',
    outputName: 'out.pdf',
    outputPath: converterFilePath
  });
  assert.ok(job.id);

  await auditLogs.recordLog({ userId: user.id, action: 'test', feature: 'sqlite', metadata: { ok: true } });
  assert.equal((await auditLogs.listLogs(user.id))[0].metadata, '{"ok":true}');

  await auditLogs.recordLog({ userId: user.id, action: 'file_upload', feature: 'personal_vault', metadata: { fileId: savedFiles[0].id } });
  await auditLogs.recordLog({ userId: user.id, action: 'folder_create', feature: 'certificates', metadata: { folderId: 1 } });
  await auditLogs.recordLog({ userId: user.id, action: 'pin_change_success', feature: 'security' });
  const fileActivity = await auditLogs.listFileActivity(user.id);
  assert.deepEqual(fileActivity.map((log) => log.action).sort(), ['file_upload', 'folder_create']);

  const archive = await createBackupArchive(user.id);
  const archiveChunks = [];
  const archiveFinished = new Promise((resolve, reject) => {
    archive.on('data', (chunk) => archiveChunks.push(chunk));
    archive.on('end', resolve);
    archive.on('error', reject);
  });
  archive.finalize();
  await archiveFinished;
  const archiveBytes = Buffer.concat(archiveChunks);
  assert.equal(archiveBytes.subarray(0, 2).toString(), 'PK');
  assert.ok(archiveBytes.includes(Buffer.from('DigiVault_Backup.txt')));
  assert.ok(archiveBytes.includes(Buffer.from(`Personal Vault/documents/${savedFiles[0].id}-Demo.txt`)));
  assert.equal(archiveBytes.includes(Buffer.from(`File Converter/${job.id}-out.pdf`)), false);
});

test.after(() => {
  close();
  fs.rmSync(process.env.STORAGE_ROOT, { recursive: true, force: true });
});