const express = require('express');
const controller = require('../controllers/personalVaultController');
const { requireSession, requirePinVerified } = require('../../security/authMiddleware');
const { upload } = require('../middleware/upload');

const router = express.Router();

router.use(requireSession, requirePinVerified);

router.get('/files', controller.listFiles);
router.get('/search', controller.search);
router.post('/files', upload.single('file'), controller.uploadFile);
router.get('/files/:fileId/download', controller.downloadFile);
router.delete('/files/:fileId', controller.deleteFile);

module.exports = router;
