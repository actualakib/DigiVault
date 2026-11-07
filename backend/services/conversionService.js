const { PDFDocument } = require('pdf-lib');
const sharp = require('sharp');

async function imageToPdf(buffer, mimeType) {
  const pdfDoc = await PDFDocument.create();
  const normalized = await sharp(buffer).png().toBuffer();
  const image = await pdfDoc.embedPng(normalized);
  const page = pdfDoc.addPage([image.width, image.height]);
  page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
  return pdfDoc.save();
}

module.exports = { imageToPdf };
