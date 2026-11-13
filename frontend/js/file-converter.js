import { apiRequest, requireAuthOrRedirect, getToken, getUser } from './api.js';
import { renderTopbar, renderFooter } from './layout.js';

requireAuthOrRedirect();
const user = getUser();
renderTopbar(user && user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U');
renderFooter();

const API_BASE_URL = window.DIGIVAULT_API_BASE_URL || 'http://localhost:4000/api';
const statusText = document.getElementById('statusText');
const categoryStatusText = document.getElementById('categoryStatusText');
let categoriesLoaded = false;
let selectedCategory = '';
let selectedCategorizedFile = null;

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

async function convertVaultFile(feature, fileId, statusElement = statusText) {
  try {
    statusElement.textContent = 'Converting...';
    await apiRequest('/file-converter/from-vault', {
      method: 'POST',
      body: { feature, fileId }
    });
    statusElement.textContent = 'Conversion complete.';
    await loadJobs();
  } catch (err) {
    statusElement.textContent = err.message;
  }
}

function categoryFileRow(file) {
  const featureNames = {
    personal_vault: 'Personal Vault',
    financial_vault: 'Financial Vault',
    certificates: 'Certificates'
  };
  const card = document.createElement('label');
  card.className = 'category-file-selection';

  const radio = document.createElement('input');
  radio.type = 'radio';
  radio.name = 'categorizedSourceFile';
  radio.disabled = !file.mime_type.startsWith('image/');
  radio.addEventListener('change', () => {
    selectedCategorizedFile = { feature: file.feature, fileId: file.file_id };
    document.getElementById('convertCategorizedFileButton').disabled = false;
  });

  const content = document.createElement('span');
  content.className = 'category-file-content';
  const name = document.createElement('span');
  name.className = 'file-name';
  name.textContent = file.original_name;

  const details = document.createElement('span');
  details.className = 'file-id';
  details.textContent = `File ID: ${file.file_id} · ${featureNames[file.feature]} · ${file.category}`;
  content.append(name, details);
  card.append(radio, content);
  return card;
}

async function loadCategorizedFiles() {
  selectedCategorizedFile = null;
  document.getElementById('convertCategorizedFileButton').disabled = true;
  const params = new URLSearchParams();
  if (selectedCategory) params.set('category', selectedCategory);

  try {
    const files = await apiRequest(`/custom-categories/files?${params.toString()}`);
    const list = document.getElementById('categoryFileList');
    list.replaceChildren();
    categoryStatusText.textContent = files.length ? 'Select an image file to convert the complete original.' : 'No files are marked in this category.';
    files.forEach((file) => list.appendChild(categoryFileRow(file)));
  } catch (err) {
    categoryStatusText.textContent = err.message;
  }
}

async function loadCategories() {
  try {
    const categories = await apiRequest('/custom-categories');
    const list = document.getElementById('categoryList');
    list.replaceChildren();
    const addCategoryButton = (label, category) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'category-filter-button';
      button.textContent = label;
      button.setAttribute('aria-pressed', String(selectedCategory === category));
      button.addEventListener('click', async () => {
        selectedCategory = category;
        list.querySelectorAll('.category-filter-button').forEach((item) => {
          item.setAttribute('aria-pressed', String(item.dataset.category === selectedCategory));
        });
        await loadCategorizedFiles();
      });
      button.dataset.category = category;
      list.appendChild(button);
    };

    addCategoryButton('All files', '');
    categories.forEach((category) => {
      addCategoryButton(`${category.category} (${category.file_count})`, category.category);
    });
    categoriesLoaded = true;
    if (!categories.length) categoryStatusText.textContent = 'No categories available.';
    await loadCategorizedFiles();
  } catch (err) {
    categoryStatusText.textContent = err.message;
  }
}

document.getElementById('chooseExistingTile').addEventListener('click', () => {
  document.getElementById('existingPicker').classList.toggle('hidden');
});

document.getElementById('browseCategoriesTile').addEventListener('click', async () => {
  const browser = document.getElementById('categoryBrowser');
  const shouldOpen = browser.classList.contains('hidden');
  browser.classList.toggle('hidden');
  if (shouldOpen && !categoriesLoaded) await loadCategories();
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
  await convertVaultFile(feature, fileId);
});

document.getElementById('convertCategorizedFileButton').addEventListener('click', async () => {
  if (!selectedCategorizedFile) return;
  await convertVaultFile(selectedCategorizedFile.feature, selectedCategorizedFile.fileId, categoryStatusText);
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
// added by @nihadrahman69 for module 1, feature
