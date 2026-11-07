const express = require('express');
const controller = require('../controllers/financialVaultController');
const { requireSession, requirePinVerified } = require('../../security/authMiddleware');
const { upload } = require('../middleware/upload');

const router = express.Router();

router.use(requireSession, requirePinVerified);

router.get('/folders', controller.listFolders);
router.post('/folders', controller.createFolder);
router.get('/folders/:folderId/files', controller.listFiles);
router.post('/folders/:folderId/files', upload.single('file'), controller.uploadFile);
router.get('/files/:fileId/download', controller.downloadFile);
router.delete('/files/:fileId', controller.deleteFile);

module.exports = router;
