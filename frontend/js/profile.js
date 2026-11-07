import { apiRequest, requireAuthOrRedirect, clearSession } from './api.js';
import { renderFooter } from './layout.js';

requireAuthOrRedirect();
renderFooter();

const statusText = document.getElementById('statusText');
const sections = ['menuView', 'profileSection', 'securitySection', 'deleteSection'];

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
    if (section === 'security') {
      const logs = await apiRequest('/profile/audit-logs');
      const list = document.getElementById('auditList');
      list.innerHTML = '';
      logs.forEach((log) => {
        const row = document.createElement('div');
        row.className = 'bank-account-row';
        row.textContent = `${new Date(log.created_at).toLocaleString()} — ${log.feature} — ${log.action}`;
        list.appendChild(row);
      });
      showSection('securitySection');
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
