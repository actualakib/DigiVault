import { apiRequest, requireAuthOrRedirect, getUser } from './api.js';
import { renderTopbar, renderFooter } from './layout.js';

requireAuthOrRedirect();
const user = getUser();
renderTopbar(user && user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U');
renderFooter();

const statusText = document.getElementById('statusText');
let selfRecord = null;

function bankRow(recordId, account) {
  const row = document.createElement('div');
  row.className = 'bank-account-row';
  row.innerHTML = `
    <input placeholder="Label (e.g. Savings)" value="${account.label || ''}" disabled style="flex:1">
    <input placeholder="Account number" value="${account.accountNumber || ''}" disabled style="flex:2">
    <button data-action="delete-bank" data-record="${recordId}" data-account="${account.id}">Remove</button>
  `;
  return row;
}

function renderSelf(record) {
  selfRecord = record;
  document.getElementById('selfFullName').value = record.fullName || '';
  document.getElementById('selfPassport').value = record.passportNumber || '';
  document.getElementById('selfNid').value = record.nidNumber || '';
  document.getElementById('selfBirthCert').value = record.birthCertificateNumber || '';
  document.getElementById('selfTranscript').value = record.transcriptDetails || '';
  const container = document.getElementById('selfBankAccounts');
  container.innerHTML = '';
  record.bankAccounts.forEach((account) => container.appendChild(bankRow(record.id, account)));
}

function familyCard(record) {
  const card = document.createElement('div');
  card.className = 'family-card';
  card.innerHTML = `
    <h3 style="text-transform:capitalize">${record.relation}</h3>
    <div class="form-grid">
      <div class="form-field"><label>Full Name</label><input value="${record.fullName || ''}" data-field="fullName" data-record="${record.id}"></div>
      <div class="form-field"><label>Passport Number</label><input value="${record.passportNumber || ''}" data-field="passportNumber" data-record="${record.id}"></div>
      <div class="form-field"><label>NID Number</label><input value="${record.nidNumber || ''}" data-field="nidNumber" data-record="${record.id}"></div>
      <div class="form-field"><label>Birth Certificate Number</label><input value="${record.birthCertificateNumber || ''}" data-field="birthCertificateNumber" data-record="${record.id}"></div>
    </div>
    <div class="file-actions" style="margin-top:12px">
      <button data-action="save-family" data-record="${record.id}">Save</button>
      <button data-action="delete-family" data-record="${record.id}">Remove</button>
    </div>
  `;
  return card;
}

async function loadAll() {
  const records = await apiRequest('/quick-records');
  const self = records.find((r) => r.relation === 'self') || { id: null, bankAccounts: [] };
  renderSelf(self);
  const familyList = document.getElementById('familyList');
  familyList.innerHTML = '';
  records.filter((r) => r.relation !== 'self').forEach((record) => familyList.appendChild(familyCard(record)));
}

document.getElementById('saveSelfButton').addEventListener('click', async () => {
  try {
    const record = await apiRequest('/quick-records/self', {
      method: 'PUT',
      body: {
        fullName: document.getElementById('selfFullName').value,
        passportNumber: document.getElementById('selfPassport').value,
        nidNumber: document.getElementById('selfNid').value,
        birthCertificateNumber: document.getElementById('selfBirthCert').value,
        transcriptDetails: document.getElementById('selfTranscript').value
      }
    });
    selfRecord = record;
    statusText.textContent = 'Saved.';
  } catch (err) {
    statusText.textContent = err.message;
  }
});

document.getElementById('addSelfBankButton').addEventListener('click', async () => {
  if (!selfRecord || !selfRecord.id) {
    statusText.textContent = 'Save your information first.';
    return;
  }
  const label = prompt('Account label (e.g. Savings)') || '';
  const accountNumber = prompt('Account number');
  if (!accountNumber) return;
  await apiRequest(`/quick-records/${selfRecord.id}/bank-accounts`, { method: 'POST', body: { label, accountNumber } });
  await loadAll();
});

document.getElementById('addFamilyButton').addEventListener('click', async () => {
  const relation = prompt('Relation (father, mother, spouse, child)');
  if (!relation || !['father', 'mother', 'spouse', 'child'].includes(relation.toLowerCase())) {
    statusText.textContent = 'Enter father, mother, spouse, or child.';
    return;
  }
  await apiRequest('/quick-records/family', { method: 'POST', body: { relation: relation.toLowerCase() } });
  await loadAll();
});

document.body.addEventListener('click', async (event) => {
  const action = event.target.dataset.action;
  if (!action) return;

  if (action === 'delete-bank') {
    const recordId = event.target.dataset.record;
    const accountId = event.target.dataset.account;
    await apiRequest(`/quick-records/${recordId}/bank-accounts/${accountId}`, { method: 'DELETE' });
    await loadAll();
  }

  if (action === 'delete-family') {
    const recordId = event.target.dataset.record;
    await apiRequest(`/quick-records/${recordId}`, { method: 'DELETE' });
    await loadAll();
  }

  if (action === 'save-family') {
    const recordId = event.target.dataset.record;
    const card = event.target.closest('.family-card');
    const fields = {};
    card.querySelectorAll('[data-field]').forEach((input) => {
      fields[input.dataset.field] = input.value;
    });
    await apiRequest(`/quick-records/${recordId}`, { method: 'PUT', body: fields });
    statusText.textContent = 'Saved.';
  }
});

loadAll();
