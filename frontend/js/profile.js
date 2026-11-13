import { apiRequest, requireAuthOrRedirect, clearSession, getToken } from './api.js';
import { renderFooter } from './layout.js';

requireAuthOrRedirect();
renderFooter();

const API_BASE_URL = window.DIGIVAULT_API_BASE_URL || 'http://localhost:4000/api';
const statusText = document.getElementById('statusText');
const sections = ['menuView', 'profileSection', 'backupSection', 'securitySection', 'deleteSection'];
const fileActivityActions = new Set([
  'file_upload', 'file_download', 'file_delete', 'file_update', 'file_modify', 'file_rename',
  'folder_create', 'folder_update', 'folder_delete', 'folder_rename', 'folder_upload', 'folder_download',
  'file_convert', 'file_categorize', 'file_uncategorize'
]);

function renderAuditEntries(containerId, logs, includeMetadata = false) {
  const list = document.getElementById(containerId);
  list.innerHTML = '';
  if (!logs.length) {
    const empty = document.createElement('p');
    empty.className = 'activity-entry';
    empty.textContent = 'No activity recorded yet.';
    list.appendChild(empty);
    return;
  }

  logs.forEach((log) => {
    const row = document.createElement('p');
    row.className = 'activity-entry';
    let details = '';
    if (includeMetadata && log.metadata) {
      try {
        const metadata = typeof log.metadata === 'string' ? JSON.parse(log.metadata) : log.metadata;
        const identifiers = [];
        if (metadata.fileId) identifiers.push(`File ID ${metadata.fileId}`);
        if (metadata.folderId) identifiers.push(`Folder ID ${metadata.folderId}`);
        if (metadata.category) identifiers.push(metadata.category);
        if (identifiers.length) details = ` (${identifiers.join(', ')})`;
      } catch {
        details = '';
      }
    }
    row.textContent = `${new Date(log.created_at).toLocaleString()} — ${log.feature} — ${log.action}${details}`;
    list.appendChild(row);
  });
}

function showSection(id) {
  sections.forEach((sectionId) => document.getElementById(sectionId).classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
}

document.querySelectorAll('.menu-item').forEach((item) => {
  item.addEventListener('click', async () => {
    const section = item.dataset.section;
    if (section === 'dashboard') {
      window.location.href = 'dashboard.html';
      return;
    }
    if (section === 'logout') {
      clearSession();
      window.location.href = 'index.html';
      return;
    }
    if (section === 'profile') {
      const profile = await apiRequest('/profile');
      document.getElementById('displayNameInput').value = profile.displayName || '';
      document.getElementById('emailInput').value = profile.email || '';
      showSection('profileSection');
    }
    if (section === 'backup') {
      showSection('backupSection');
    }
    if (section === 'security') {
      try {
        const logs = await apiRequest('/profile/audit-logs');
        renderAuditEntries('auditList', logs);

        let fileActivity;
        try {
          fileActivity = await apiRequest('/profile/audit-logs/file-activity');
        } catch {
          fileActivity = logs.filter((log) => fileActivityActions.has(log.action));
        }
        renderAuditEntries('fileActivityList', fileActivity, true);
        statusText.textContent = '';
        showSection('securitySection');
      } catch (err) {
        statusText.textContent = err.message;
      }
    }
    if (section === 'delete') {
      showSection('deleteSection');
    }
  });
});

document.querySelectorAll('[data-back="menu"]').forEach((button) => {
  button.addEventListener('click', () => showSection('menuView'));
});

document.getElementById('saveProfileButton').addEventListener('click', async () => {
  try {
    await apiRequest('/profile', { method: 'PUT', body: { displayName: document.getElementById('displayNameInput').value } });
    statusText.textContent = 'Profile updated.';
  } catch (err) {
    statusText.textContent = err.message;
  }
});

document.getElementById('exportBackupButton').addEventListener('click', async () => {
  if (!confirm('Download uploaded vault files and their metadata? Passwords and non-file records are excluded.')) return;

  const button = document.getElementById('exportBackupButton');
  button.disabled = true;
  statusText.textContent = 'Preparing backup...';
  try {
    const response = await fetch(`${API_BASE_URL}/profile/backup`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    if (response.status === 401) {
      clearSession();
      window.location.href = 'index.html';
      return;
    }
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Could not create the backup.');
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'DigiVault-Backup.zip';
    link.click();
    URL.revokeObjectURL(url);
    statusText.textContent = 'Backup downloaded.';
  } catch (err) {
    statusText.textContent = err.message;
  } finally {
    button.disabled = false;
  }
});

document.getElementById('changePinButton').addEventListener('click', async () => {
  try {
    await apiRequest('/profile/change-pin', {
      method: 'POST',
      body: {
        currentPin: document.getElementById('currentPinInput').value,
        newPin: document.getElementById('newPinInput').value
      }
    });
    document.getElementById('currentPinInput').value = '';
    document.getElementById('newPinInput').value = '';
    statusText.textContent = 'PIN updated.';
  } catch (err) {
    statusText.textContent = err.message;
  }
});

document.getElementById('confirmDeleteButton').addEventListener('click', async () => {
  if (!confirm('This cannot be undone. Delete your account?')) return;
  try {
    await apiRequest('/profile', { method: 'DELETE' });
    clearSession();
    window.location.href = 'index.html';
  } catch (err) {
    statusText.textContent = err.message;
  }
});
