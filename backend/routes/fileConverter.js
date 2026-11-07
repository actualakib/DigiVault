const express = require('express');
const controller = require('../controllers/fileConverterController');
const { requireSession, requirePinVerified } = require('../../security/authMiddleware');
const { upload } = require('../middleware/upload');

const router = express.Router();

router.use(requireSession, requirePinVerified);

router.get('/jobs', controller.listJobs);
router.post('/from-vault', controller.convertFromVault);
router.post('/from-upload', upload.single('file'), controller.convertFromUpload);
router.get('/jobs/:jobId/download', controller.downloadJob);

module.exports = router;
