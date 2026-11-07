import { apiRequest, requireAuthOrRedirect, getUser } from './api.js';
import { renderTopbar, renderFooter } from './layout.js';

requireAuthOrRedirect();
const user = getUser();
renderTopbar(user && user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U');
renderFooter();

const statusText = document.getElementById('statusText');

function entryRow(entry) {
  const div = document.createElement('div');
  div.className = 'file-item';
  div.innerHTML = `
    <div class="file-name">${entry.site_name}</div>
    <div>${entry.username || ''}</div>
    <div class="file-actions">
      <button data-action="reveal" data-id="${entry.id}">View</button>
      <button data-action="delete" data-id="${entry.id}">Delete</button>
    </div>
  `;
  return div;
}

async function loadEntries() {
  const entries = await apiRequest('/password-manager');
  const list = document.getElementById('entryList');
  list.innerHTML = '';
  entries.forEach((entry) => list.appendChild(entryRow(entry)));
}

document.getElementById('addEntryButton').addEventListener('click', async () => {
  const siteName = document.getElementById('newSiteName').value;
  const password = document.getElementById('newPassword').value;
  if (!siteName || !password) {
    statusText.textContent = 'Site name and password are required.';
    return;
  }
  try {
    await apiRequest('/password-manager', {
      method: 'POST',
      body: {
        siteName,
        siteUrl: document.getElementById('newSiteUrl').value,
        username: document.getElementById('newUsername').value,
        password,
        notes: document.getElementById('newNotes').value
      }
    });
    document.getElementById('newSiteName').value = '';
    document.getElementById('newSiteUrl').value = '';
    document.getElementById('newUsername').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('newNotes').value = '';
    statusText.textContent = '';
    await loadEntries();
  } catch (err) {
    statusText.textContent = err.message;
  }
});

document.body.addEventListener('click', async (event) => {
  const action = event.target.dataset.action;
  const id = event.target.dataset.id;
  if (!action || !id) return;
  if (action === 'reveal') {
    const entry = await apiRequest(`/password-manager/${id}`);
    alert(`Username: ${entry.username || '-'}\nPassword: ${entry.password}\nNotes: ${entry.notes || '-'}`);
  }
  if (action === 'delete') {
    await apiRequest(`/password-manager/${id}`, { method: 'DELETE' });
    await loadEntries();
  }
});

loadEntries();
