process.env.SQLITE_DB_PATH = ':memory:';

const assert = require('node:assert/strict');
const fs = require('node:fs');
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

  await personalVault.insertFile({
    userId: user.id,
    category: 'documents',
    originalName: 'Demo.txt',
    storedName: 'demo.txt',
    mimeType: 'text/plain',
    sizeBytes: 4,
    storagePath: 'demo.txt',
    ocrText: 'Searchable text'
  });
  assert.equal((await personalVault.searchFiles(user.id, 'SEARCHABLE')).length, 1);

  const record = await quickRecords.upsertSelfRecord(user.id, { fullName: 'Demo User' });
  await quickRecords.addBankAccount(record.id, { label: 'Demo', accountNumber: '1234' });
  assert.equal((await quickRecords.listBankAccounts(record.id)).length, 1);

  const entry = await passwordManager.createEntry({
    userId: user.id,
    siteName: 'Example',
    encryptedPassword: 'encrypted'
  });
  assert.equal((await passwordManager.updateEntry(user.id, entry.id, { siteName: 'Updated' })).site_name, 'Updated');

  const job = await fileConverter.insertJob({
    userId: user.id,
    sourceType: 'upload',
    outputName: 'out.pdf',
    outputPath: 'out.pdf'
  });
  assert.ok(job.id);

  await auditLogs.recordLog({ userId: user.id, action: 'test', feature: 'sqlite', metadata: { ok: true } });
  assert.equal((await auditLogs.listLogs(user.id))[0].metadata, '{"ok":true}');
});

test.after(() => close());