const Tesseract = require('tesseract.js');

async function extractText(buffer, mimeType) {
  if (!mimeType.startsWith('image/')) return null;
  try {
    const { data } = await Tesseract.recognize(buffer, 'eng');
    return (data && data.text) ? data.text.trim() : null;
  } catch (err) {
    return null;
  }
}

module.exports = { extractText };
// added by @zareen76 for module 1, feature 4
