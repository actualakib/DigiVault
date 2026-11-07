const express = require('express');
const controller = require('../controllers/authController');
const { requireSession } = require('../../security/authMiddleware');

const router = express.Router();

router.post('/google', controller.googleSignIn);
router.post('/pin/set', requireSession, controller.setPin);
router.post('/pin/verify', requireSession, controller.verifyPin);
router.get('/me', requireSession, controller.me);

module.exports = router;
