import { apiRequest, requireAuthOrRedirect, getToken, getUser } from './api.js';
import { renderTopbar, renderFooter } from './layout.js';

requireAuthOrRedirect();
const user = getUser();
renderTopbar(user && user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U');
renderFooter();

const API_BASE_URL = window.DIGIVAULT_API_BASE_URL || 'http://localhost:4000/api';
const statusText = document.getElementById('statusText');
const folderView = document.getElementById('folderView');
const filesView = document.getElementById('filesView');
let activeFolder = null;

async function loadFolders() {
  const folders = await apiRequest('/certificates/folders');
  const grid = document.getElementById('folderGrid');
  grid.innerHTML = '';
  folders.forEach((folder) => {
    const tile = document.createElement('div');
    tile.className = 'folder-tile';
    tile.innerHTML = `<div class="folder-icon">🎓</div><div>${folder.name}</div>`;
    tile.addEventListener('click', () => openFolder(folder));
    grid.appendChild(tile);
  });
}

async function openFolder(folder) {
  activeFolder = folder;
  document.getElementById('activeFolderName').textContent = folder.name;
  folderView.classList.add('hidden');
  filesView.classList.remove('hidden');
  await loadFiles();
}

async function loadFiles() {
  const files = await apiRequest(`/certificates/folders/${activeFolder.id}/files`);
  const list = document.getElementById('fileList');
  list.innerHTML = '';
  files.forEach((file) => {
    const div = document.createElement('div');
    div.className = 'file-item';
    div.innerHTML = `
      <div class="file-name">${file.original_name}</div>
      <div class="file-actions">
        <button data-action="download" data-id="${file.id}">Download</button>
        <button data-action="delete" data-id="${file.id}">Delete</button>
      </div>
    `;
    list.appendChild(div);
  });
}

document.getElementById('addFolderButton').addEventListener('click', async () => {
  const name = prompt('Folder name');
  if (!name) return;
  try {
    await apiRequest('/certificates/folders', { method: 'POST', body: { name } });
    await loadFolders();
  } catch (err) {
    statusText.textContent = err.message;
  }
});

document.getElementById('backToFolders').addEventListener('click', (event) => {
  event.preventDefault();
  activeFolder = null;
  filesView.classList.add('hidden');
  folderView.classList.remove('hidden');
});

document.getElementById('addFileButton').addEventListener('click', () => {
  document.getElementById('fileInput').click();
});

document.getElementById('fileInput').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file || !activeFolder) return;
  const formData = new FormData();
  formData.append('file', file);
  try {
    statusText.textContent = 'Uploading...';
    await apiRequest(`/certificates/folders/${activeFolder.id}/files`, { method: 'POST', body: formData, isForm: true });
    statusText.textContent = '';
    event.target.value = '';
    await loadFiles();
  } catch (err) {
    statusText.textContent = err.message;
  }
});

document.body.addEventListener('click', async (event) => {
  const action = event.target.dataset.action;
  const id = event.target.dataset.id;
  if (!action || !id) return;
  if (action === 'download') {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/certificates/files/${id}/download`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = '';
    link.click();
    URL.revokeObjectURL(url);
  }
  if (action === 'delete') {
    await apiRequest(`/certificates/files/${id}`, { method: 'DELETE' });
    await loadFiles();
  }
});

loadFolders();
