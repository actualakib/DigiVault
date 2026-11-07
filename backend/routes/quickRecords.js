const express = require('express');
const controller = require('../controllers/quickRecordsController');
const { requireSession, requirePinVerified } = require('../../security/authMiddleware');

const router = express.Router();

router.use(requireSession, requirePinVerified);

router.get('/', controller.listAll);
router.put('/self', controller.upsertSelf);
router.post('/family', controller.addFamilyMember);
router.put('/:recordId', controller.updateRecord);
router.delete('/:recordId', controller.deleteRecord);
router.post('/:recordId/bank-accounts', controller.addBankAccount);
router.delete('/:recordId/bank-accounts/:accountId', controller.deleteBankAccount);

module.exports = router;
