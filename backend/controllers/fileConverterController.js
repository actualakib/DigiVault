const path = require('path');
const fs = require('fs/promises');
const fileConverter = require('../../database/queries/fileConverter');
const personalVault = require('../../database/queries/personalVault');
const financialVault = require('../../database/queries/financialVault');
const certificates = require('../../database/queries/certificates');
const { imageToPdf } = require('../services/conversionService');
const { watermarkPdf } = require('../../security/watermark');
const { ensureDirSync, safeFileName, resolvePath, removeFile } = require('../services/storage');
const { logAction } = require('../../security/audit');

const VAULT_LOOKUPS = {
  personal_vault: (userId, fileId) => personalVault.getFile(userId, fileId),
  financial_vault: (userId, fileId) => financialVault.getFile(userId, fileId),
  certificates: (userId, fileId) => certificates.getFile(userId, fileId)
};

async function listJobs(req, res) {
  const jobs = await fileConverter.listJobs(req.user.userId);
  return res.json(jobs);
}

async function convertFromVault(req, res) {
  const { feature, fileId } = req.body;
  const lookup = VAULT_LOOKUPS[feature];
  if (!lookup) {
    return res.status(400).json({ error: 'Unsupported source feature' });
  }
  const file = await lookup(req.user.userId, fileId);
  if (!file) {
    return res.status(404).json({ error: 'Source file not found' });
  }
  if (!file.mime_type.startsWith('image/')) {
    return res.status(415).json({ error: 'Only image files can be converted to PDF' });
  }

  const buffer = await fs.readFile(file.storage_path);
  const pdfBytes = await imageToPdf(buffer, file.mime_type);

  const outputDir = resolvePath('converted', String(req.user.userId));
  ensureDirSync(outputDir);
  const outputName = safeFileName(`${path.parse(file.original_name).name}.pdf`);
  const outputPath = path.join(outputDir, outputName);
  await fs.writeFile(outputPath, pdfBytes);
  await watermarkPdf(outputPath, outputPath, 'DigiVault');

  const job = await fileConverter.insertJob({
    userId: req.user.userId,
    sourceType: 'vault',
    sourceLabel: `${feature}:${file.original_name}`,
    outputName,
    outputPath
  });

  await logAction(req, { action: 'file_convert', feature: 'file_converter', metadata: { jobId: job.id, source: 'vault' } });

  return res.status(201).json(job);
}

async function convertFromUpload(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  if (!req.file.mimetype.startsWith('image/')) {
    return res.status(415).json({ error: 'Only image files can be converted to PDF' });
  }

  const pdfBytes = await imageToPdf(req.file.buffer, req.file.mimetype);

  const outputDir = resolvePath('converted', String(req.user.userId));
  ensureDirSync(outputDir);
  const outputName = safeFileName(`${path.parse(req.file.originalname).name}.pdf`);
  const outputPath = path.join(outputDir, outputName);
  await fs.writeFile(outputPath, pdfBytes);
  await watermarkPdf(outputPath, outputPath, 'DigiVault');

  const job = await fileConverter.insertJob({
    userId: req.user.userId,
    sourceType: 'upload',
    sourceLabel: req.file.originalname,
    outputName,
    outputPath
  });

  await logAction(req, { action: 'file_convert', feature: 'file_converter', metadata: { jobId: job.id, source: 'upload' } });

  return res.status(201).json(job);
}

async function downloadJob(req, res) {
  const job = await fileConverter.getJob(req.user.userId, req.params.jobId);
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  return res.download(job.output_path, job.output_name);
}

module.exports = { listJobs, convertFromVault, convertFromUpload, downloadJob };
// module 1, feature 2 by @actualakib and @nihadrahman69

