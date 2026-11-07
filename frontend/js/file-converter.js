import { apiRequest, requireAuthOrRedirect, getToken, getUser } from './api.js';
import { renderTopbar, renderFooter } from './layout.js';

requireAuthOrRedirect();
const user = getUser();
renderTopbar(user && user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U');
renderFooter();

const API_BASE_URL = window.DIGIVAULT_API_BASE_URL || 'http://localhost:4000/api';
const statusText = document.getElementById('statusText');

function jobRow(job) {
  const div = document.createElement('div');
  div.className = 'file-item';
  div.innerHTML = `
    <div class="file-name">${job.output_name}</div>
    <div>${job.status}</div>
    <div class="file-actions">
      <button data-id="${job.id}">Download</button>
    </div>
  `;
  return div;
}

async function loadJobs() {
  const jobs = await apiRequest('/file-converter/jobs');
  const list = document.getElementById('jobList');
  list.innerHTML = '';
  jobs.forEach((job) => list.appendChild(jobRow(job)));
}

document.getElementById('chooseExistingTile').addEventListener('click', () => {
  document.getElementById('existingPicker').classList.toggle('hidden');
});

document.getElementById('uploadNewTile').addEventListener('click', () => {
  document.getElementById('uploadInput').click();
});

document.getElementById('convertExistingButton').addEventListener('click', async () => {
  const feature = document.getElementById('sourceFeature').value;
  const fileId = document.getElementById('sourceFileId').value;
  if (!fileId) {
    statusText.textContent = 'Enter a file ID.';
    return;
  }
  try {
    statusText.textContent = 'Converting...';
    await apiRequest('/file-converter/from-vault', { method: 'POST', body: { feature, fileId } });
    statusText.textContent = '';
    await loadJobs();
  } catch (err) {
    statusText.textContent = err.message;
  }
});

document.getElementById('uploadInput').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const formData = new FormData();
  formData.append('file', file);
  try {
    statusText.textContent = 'Converting...';
    await apiRequest('/file-converter/from-upload', { method: 'POST', body: formData, isForm: true });
    statusText.textContent = '';
    event.target.value = '';
    await loadJobs();
  } catch (err) {
    statusText.textContent = err.message;
  }
});

document.body.addEventListener('click', async (event) => {
  const id = event.target.dataset.id;
  if (!id) return;
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}/file-converter/jobs/${id}/download`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = '';
  link.click();
  URL.revokeObjectURL(url);
});

loadJobs();
