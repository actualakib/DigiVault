import { apiRequest, requireAuthOrRedirect, getToken, getUser } from './api.js';
import { renderTopbar, renderFooter } from './layout.js';

requireAuthOrRedirect();
const user = getUser();
renderTopbar(user && user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U');
renderFooter();

const statusText = document.getElementById('statusText');
const ocrPanel = document.getElementById('ocrPanel');
const ocrTextOutput = document.getElementById('ocrTextOutput');
const ocrPanelTitle = document.getElementById('ocrPanelTitle');
const filesById = new Map();
const API_BASE_URL = window.DIGIVAULT_API_BASE_URL || 'http://localhost:4000/api';

function openOcrPanel(fileName, text) {
  ocrPanel.classList.remove('hidden');
  ocrPanelTitle.textContent = fileName ? `Extracted Text - ${fileName}` : 'Extracted Text';
  ocrTextOutput.value = text || '';
  ocrTextOutput.placeholder = text ? '' : 'No text detected in this image.';
}

function fileRow(file) {
  const div = document.createElement('div');
  div.className = 'file-item';
  div.innerHTML = `
    <div class="file-name">${file.original_name}</div>
    <div class="file-actions">
      ${file.mime_type.startsWith('image/') ? `<button data-action="view-text" data-id="${file.id}">View Text</button>` : ''}
      <button data-action="download" data-id="${file.id}">Download</button>
      <button data-action="delete" data-id="${file.id}">Delete</button>
    </div>
  `;
  return div;
}

async function loadFiles() {
  const grouped = await apiRequest('/personal-vault/files');
  const photosList = document.getElementById('photosList');
  const videosList = document.getElementById('videosList');
  const documentsList = document.getElementById('documentsList');
  photosList.innerHTML = '';
  videosList.innerHTML = '';
  documentsList.innerHTML = '';
  filesById.clear();
  [...grouped.photos, ...grouped.videos, ...grouped.documents].forEach((file) => filesById.set(String(file.id), file));
  grouped.photos.forEach((file) => photosList.appendChild(fileRow(file)));
  grouped.videos.forEach((file) => videosList.appendChild(fileRow(file)));
  grouped.documents.forEach((file) => documentsList.appendChild(fileRow(file)));
}

document.getElementById('addFileButton').addEventListener('click', () => {
  document.getElementById('fileInput').click();
});

document.getElementById('fileInput').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const formData = new FormData();
  formData.append('file', file);
  try {
    statusText.textContent = 'Uploading...';
    const record = await apiRequest('/personal-vault/files', { method: 'POST', body: formData, isForm: true });
    statusText.textContent = '';
    event.target.value = '';
    await loadFiles();
    if (file.type.startsWith('image/')) openOcrPanel(file.name, record.ocr_text || '');
  } catch (err) {
    statusText.textContent = err.message;
  }
});

document.body.addEventListener('click', async (event) => {
  const action = event.target.dataset.action;
  const id = event.target.dataset.id;
  if (!action || !id) return;
  if (action === 'view-text') {
    const file = filesById.get(String(id));
    if (file) openOcrPanel(file.original_name, file.ocr_text || '');
    return;
  }
  if (action === 'download') {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/personal-vault/files/${id}/download`, {
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
    await apiRequest(`/personal-vault/files/${id}`, { method: 'DELETE' });
    await loadFiles();
  }
});

loadFiles();
