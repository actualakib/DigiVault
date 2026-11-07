const express = require('express');
const controller = require('../controllers/passwordManagerController');
const { requireSession, requirePinVerified } = require('../../security/authMiddleware');

const router = express.Router();

router.use(requireSession, requirePinVerified);

router.get('/', controller.listEntries);
router.get('/:entryId', controller.getEntry);
router.post('/', controller.createEntry);
router.put('/:entryId', controller.updateEntry);
router.delete('/:entryId', controller.deleteEntry);

module.exports = router;
