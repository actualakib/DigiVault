import { apiRequest, requireAuthOrRedirect, getToken, getUser, copyTextToClipboard } from './api.js';
import { renderTopbar, renderFooter } from './layout.js';

requireAuthOrRedirect();
const user = getUser();
renderTopbar(user && user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U');
renderFooter();

const API_BASE_URL = window.DIGIVAULT_API_BASE_URL || 'http://localhost:4000/api';
const statusText = document.getElementById('statusText');
const FILE_FEATURE = 'certificates';
let fileCategories = new Map();
const folderView = document.getElementById('folderView');
const filesView = document.getElementById('filesView');
let activeFolder = null;

function categoryButton(file, category) {
  const selected = fileCategories.get(String(file.id))?.has(category) || false;
  const actionLabel = selected ? `Remove from ${category}` : `Add to ${category}`;
  return `<button type="button" class="category-action${selected ? ' is-selected' : ''}" data-action="toggle-category" data-category="${category}" data-id="${file.id}" aria-pressed="${selected}" aria-label="${actionLabel}"><span class="category-mark" aria-hidden="true">${selected ? '💖' : '♡'}</span><span class="category-action-label">${actionLabel}</span></button>`;
}

function updateCategoryButton(button, category, selected) {
  const actionLabel = selected ? `Remove from ${category}` : `Add to ${category}`;
  button.classList.toggle('is-selected', selected);
  button.setAttribute('aria-pressed', String(selected));
  button.setAttribute('aria-label', actionLabel);
  button.querySelector('.category-mark').textContent = selected ? '💖' : '♡';
  button.querySelector('.category-action-label').textContent = actionLabel;
}

async function loadFileCategories() {
  fileCategories = new Map();
  try {
    const assigned = await apiRequest(`/custom-categories/files?feature=${FILE_FEATURE}`);
    assigned.forEach((file) => {
      const categories = fileCategories.get(String(file.file_id)) || new Set();
      categories.add(file.category);
      fileCategories.set(String(file.file_id), categories);
    });
  } catch {
    fileCategories = new Map();
  }
}

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
  await loadFileCategories();
  const list = document.getElementById('fileList');
  list.innerHTML = '';
  files.forEach((file) => {
    const div = document.createElement('div');
    div.className = 'file-item';
    div.innerHTML = `
      <div class="file-name">${file.original_name}</div>
        <div class="file-id">File ID: ${file.id}</div>
      <div class="file-actions">
        <button data-action="copy-id" data-id="${file.id}">Copy ID</button>
        <button data-action="download" data-id="${file.id}">Download</button>
        <button data-action="delete" data-id="${file.id}">Delete</button>
        ${categoryButton(file, 'Favourite')}
        ${categoryButton(file, 'Emergency')}
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
    const record = await apiRequest(`/certificates/folders/${activeFolder.id}/files`, { method: 'POST', body: formData, isForm: true });
    statusText.textContent = `Uploaded successfully. File ID: ${record.id}`;
    event.target.value = '';
    await loadFiles();
  } catch (err) {
    statusText.textContent = err.message;
  }
});

document.body.addEventListener('click', async (event) => {
  const actionButton = event.target.closest('button[data-action]');
  if (!actionButton) return;
  const action = actionButton.dataset.action;
  const id = actionButton.dataset.id;
  if (!action || !id) return;
  if (action === 'copy-id') {
    try {
      await copyTextToClipboard(id);
      statusText.textContent = `Copied File ID: ${id}`;
    } catch (err) {
      statusText.textContent = err.message;
    }
    return;
  }
  if (action === 'toggle-category') {
    const category = actionButton.dataset.category;
    const selected = actionButton.getAttribute('aria-pressed') === 'true';
    try {
      await apiRequest('/custom-categories', {
        method: selected ? 'DELETE' : 'POST',
        body: { feature: FILE_FEATURE, fileId: id, category }
      });
      const categories = fileCategories.get(String(id)) || new Set();
      if (selected) categories.delete(category);
      else categories.add(category);
      fileCategories.set(String(id), categories);
      updateCategoryButton(actionButton, category, !selected);
      statusText.textContent = selected ? `Removed from ${category}.` : `Added to ${category}.`;
    } catch (err) {
      statusText.textContent = err.message;
    }
    return;
  }
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
