const express = require('express');
const controller = require('../controllers/profileController');
const { requireSession, requirePinVerified } = require('../../security/authMiddleware');

const router = express.Router();

router.use(requireSession);

router.get('/', controller.getProfile);
router.put('/', controller.updateProfile);
router.get('/audit-logs', requirePinVerified, controller.getAuditLogs);
router.post('/change-pin', requirePinVerified, controller.changePin);
router.delete('/', requirePinVerified, controller.deleteAccount);

module.exports = router;
