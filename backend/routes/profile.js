const express = require('express');
const controller = require('../controllers/profileController');
const { requireSession, requirePinVerified } = require('../../security/authMiddleware');

const router = express.Router();

router.use(requireSession);

router.get('/', controller.getProfile);
router.put('/', controller.updateProfile);
router.get('/audit-logs/file-activity', requirePinVerified, controller.getFileActivityLogs);
router.get('/audit-logs', requirePinVerified, controller.getAuditLogs);
router.get('/backup', requirePinVerified, controller.exportBackup);
router.post('/change-pin', requirePinVerified, controller.changePin);
router.delete('/', requirePinVerified, controller.deleteAccount);

module.exports = router;
