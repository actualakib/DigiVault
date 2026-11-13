const customCategories = require('../../database/queries/customCategories');
const { logAction } = require('../../security/audit');
const ALLOWED_CATEGORIES = new Set(['Favourite', 'Emergency']);

async function addFileCategory(req, res) {
  const { feature, fileId, category } = req.body;
  const parsedFileId = Number(fileId);
  const categoryName = typeof category === 'string' ? category.trim() : '';
  if (!Number.isInteger(parsedFileId) || parsedFileId <= 0 || !ALLOWED_CATEGORIES.has(categoryName)) {
    return res.status(400).json({ error: 'Choose Favourite or Emergency and provide a valid file ID' });
  }

  const savedCategory = await customCategories.addFileCategory(req.user.userId, feature, parsedFileId, categoryName);
  if (!savedCategory) {
    return res.status(404).json({ error: 'File not found in the selected vault' });
  }

  await logAction(req, {
    action: 'file_categorize',
    feature,
    metadata: { fileId: parsedFileId, category: categoryName }
  });
  return res.status(201).json(savedCategory);
}

async function removeFileCategory(req, res) {
  const { feature, fileId, category } = req.body;
  const parsedFileId = Number(fileId);
  const categoryName = typeof category === 'string' ? category.trim() : '';
  if (!Number.isInteger(parsedFileId) || parsedFileId <= 0 || !ALLOWED_CATEGORIES.has(categoryName)) {
    return res.status(400).json({ error: 'Choose Favourite or Emergency and provide a valid file ID' });
  }

  await customCategories.removeFileCategory(req.user.userId, feature, parsedFileId, categoryName);
  await logAction(req, {
    action: 'file_uncategorize',
    feature,
    metadata: { fileId: parsedFileId, category: categoryName }
  });
  return res.status(204).send();
}

async function listCategories(req, res) {
  return res.json(await customCategories.listCategories(req.user.userId));
}

async function listCategorizedFiles(req, res) {
  const files = await customCategories.listCategorizedFiles(req.user.userId, {
    category: req.query.category || undefined,
    query: req.query.q || undefined,
    feature: req.query.feature || undefined
  });
  return res.json(files);
}

module.exports = { addFileCategory, removeFileCategory, listCategories, listCategorizedFiles };