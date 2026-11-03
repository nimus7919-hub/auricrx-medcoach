import uiI18n from '../i18n';
import { Image } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Print from 'expo-print';
import { PDFDocument } from 'pdf-lib';

// Normalize camera/gallery formats (including HEIC) before embedding them.
async function imageBytes(uri: string) {
  const image = await ImageManipulator.manipulateAsync(uri, [], {
    compress: 0.9, format: ImageManipulator.SaveFormat.JPEG, base64: true,
  });
  if (!image.base64) throw new Error(uiI18n.t('ui.couldNotReadDocumentImage'));
  return image.base64;
}

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, char =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!));

export async function createDocumentPdf(
  sources: Array<{ uri: string; mimeType?: string; type?: string }>,
  sideBySide = false,
): Promise<string> {
  if (!sources.length) throw new Error(uiI18n.t('ui.noDocumentPages'));
  if (sideBySide && sources.length > 2) throw new Error(uiI18n.t('ui.selectOnlyTheFrontAndBackOfOneId'));
  const ordered = sideBySide ? [...sources].sort((a, b) =>
    (a.type === 'back' ? 1 : 0) - (b.type === 'back' ? 1 : 0)) : sources;
  const pdf = await PDFDocument.create();
  const width = sideBySide ? 720 : 612;
  const height = sideBySide ? 400 : 792;
  const frameWidth = 312;
  const frameHeight = frameWidth / 1.586;
  const frameTop = 145;
  const brand = uiI18n.t('documentPdf.brand');
  const title = uiI18n.t(sideBySide ? 'documentPdf.identification' : 'documentPdf.scannedDocument');
  const date = new Date().toLocaleDateString(uiI18n.language || 'es', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
  const logoUri = Image.resolveAssetSource(require('../../assets/icon-auric.png')).uri;
  const logo = await ImageManipulator.manipulateAsync(logoUri, [], {
    format: ImageManipulator.SaveFormat.PNG, base64: true,
  });
  if (!logo.base64) throw new Error(uiI18n.t('ui.couldNotReadDocumentImage'));
  // Native HTML rendering preserves Unicode translations, including Chinese.
  // Compose source pages afterward so imported PDFs keep their vector content.
  const html = `<!DOCTYPE html><html lang="${escapeHtml(uiI18n.language || 'es')}"><head>
    <meta charset="utf-8"><style>
    @page { size: ${width}pt ${height}pt; margin: 0; }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; width: ${width}pt; height: ${height}pt; }
    body { background: #faf7f0; font-family: Arial, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    header { height: 108pt; background: #0d1019; border-bottom: 2pt solid #D4AF37; padding: 22pt 32pt; }
    img { width: 52pt; height: 52pt; float: left; margin-right: 16pt; }
    .brand { color: #D4AF37; font: bold 25pt Georgia, 'Times New Roman', serif; }
    .title { color: #faf7f0; font-size: 12pt; margin-top: 8pt; }
    .frame { position: absolute; top: ${frameTop}pt; width: ${frameWidth}pt; height: ${frameHeight}pt;
      background: white; border: 0.75pt solid #D4AF37; border-radius: 12pt; box-shadow: 0 4pt 12pt rgba(13,16,25,.14); }
    .label { position: absolute; top: 122pt; width: ${frameWidth}pt; text-align: center;
      color: #D4AF37; font-size: 9pt; font-variant: small-caps; text-transform: uppercase; letter-spacing: 1.5pt; }
    footer { position: absolute; bottom: 18pt; left: 32pt; right: 32pt; border-top: .5pt solid #ded9cd;
      padding-top: 9pt; font-size: 8pt; color: #777b83; display: flex; justify-content: space-between; }
    </style></head><body><header><img src="data:image/png;base64,${logo.base64}">
    <div class="brand">${escapeHtml(brand)}</div><div class="title">${escapeHtml(title)}</div></header>
    ${sideBySide ? ordered.map((source, index) => {
      const left = ordered.length === 1 ? (width - frameWidth) / 2 : 32 + index * 344;
      const label = uiI18n.t(source.type === 'back' || (source.type !== 'front' && index === 1)
        ? 'documentPdf.back' : 'documentPdf.front');
      return `<div class="label" style="left:${left}pt">${escapeHtml(label)}</div><div class="frame" style="left:${left}pt"></div>`;
    }).join('') : ''}
    <footer><span>${escapeHtml(uiI18n.t('documentPdf.exportedOn', { date }))}</span><span>${escapeHtml(brand)}</span></footer>
    </body></html>`;
  const templateResult = await Print.printToFileAsync({ html, width, height, base64: true,
    margins: { top: 0, bottom: 0, left: 0, right: 0 } });
  const templateBytes = templateResult.base64 || await FileSystem.readAsStringAsync(templateResult.uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const template = await PDFDocument.load(templateBytes);
  const addPage = async () => {
    const [page] = await pdf.copyPages(template, [0]);
    return pdf.addPage(page);
  };
  const combined = sideBySide ? await addPage() : null;
  pdf.setTitle(`${brand} - ${title}`);
  pdf.setAuthor(brand);
  for (let index = 0; index < ordered.length; index++) {
    const source = ordered[index];
    const isPdf = source.mimeType === 'application/pdf' || /\.pdf(?:$|\?)/i.test(source.uri);
    const bytes = isPdf
      ? await FileSystem.readAsStringAsync(source.uri, { encoding: FileSystem.EncodingType.Base64 })
      : await imageBytes(source.uri);
    const inputPdf = isPdf ? await PDFDocument.load(bytes) : null;
    if (sideBySide && inputPdf && inputPdf.getPageCount() !== 1)
      throw new Error(uiI18n.t('ui.eachIdSideMustContainExactlyOnePage'));
    const embedded = inputPdf
      ? await pdf.embedPdf(inputPdf, inputPdf.getPageIndices())
      : [await pdf.embedJpg(bytes)];
    for (const item of embedded) {
      const page = combined || await addPage();
      // Inset content within the rounded frame to keep every corner visible.
      const box = combined
        ? { x: (ordered.length === 1 ? (width - frameWidth) / 2 : 32 + index * 344) + 10,
          y: height - frameTop - frameHeight + 10, width: frameWidth - 20, height: frameHeight - 20 }
        : { x: 32, y: 62, width: width - 64, height: height - 186 };
      const scale = Math.min(box.width / item.width, box.height / item.height);
      const dimensions = { x: box.x + (box.width - item.width * scale) / 2,
        y: box.y + (box.height - item.height * scale) / 2,
        width: item.width * scale, height: item.height * scale };
      if (isPdf) page.drawPage(item as any, dimensions);
      else page.drawImage(item as any, dimensions);
    }
  }
  const uri = `${FileSystem.documentDirectory}document_${Date.now()}_${Math.random().toString(36).slice(2)}.pdf`;
  await FileSystem.writeAsStringAsync(uri, await pdf.saveAsBase64(), { encoding: FileSystem.EncodingType.Base64 });
  return uri;
}
