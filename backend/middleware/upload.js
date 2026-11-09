const multer = require('multer');

const MAX_FILE_SIZE_BYTES = Number(process.env.MAX_UPLOAD_MB || 50) * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES }
});

module.exports = { upload };
// module 1, feature 1 by @actualakib
