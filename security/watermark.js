const { PDFDocument, rgb, degrees, StandardFonts } = require('pdf-lib');
const fs = require('fs/promises');

async function watermarkPdf(inputPath, outputPath, label) {
  const bytes = await fs.readFile(inputPath);
  const pdfDoc = await PDFDocument.load(bytes);
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const pages = pdfDoc.getPages();

  for (const page of pages) {
    const { width, height } = page.getSize();
    page.drawText(label, {
      x: width / 6,
      y: height / 2,
      size: 36,
      font,
      color: rgb(0.75, 0.75, 0.75),
      opacity: 0.35,
      rotate: degrees(35)
    });
  }

  const outputBytes = await pdfDoc.save();
  await fs.writeFile(outputPath, outputBytes);
  return outputPath;
}

module.exports = { watermarkPdf };
