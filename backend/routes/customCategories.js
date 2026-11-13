const express = require('express');
const controller = require('../controllers/customCategoriesController');
const { requireSession, requirePinVerified } = require('../../security/authMiddleware');

const router = express.Router();

router.use(requireSession, requirePinVerified);

router.get('/files', controller.listCategorizedFiles);
router.get('/', controller.listCategories);
router.post('/', controller.addFileCategory);
router.delete('/', controller.removeFileCategory);

module.exports = router;