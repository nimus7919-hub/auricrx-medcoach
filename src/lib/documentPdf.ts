import uiI18n from "../i18n";
import { Image } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

// Normalize camera/gallery formats (including HEIC) before embedding them.
async function imageBytes(uri: string) {
  const image = await ImageManipulator.manipulateAsync(uri, [], {
    compress: 0.9, format: ImageManipulator.SaveFormat.JPEG, base64: true,
  });
  if (!image.base64) throw new Error(uiI18n.t("ui.couldNotReadDocumentImage"));
  return image.base64;
}

export async function createDocumentPdf(
  sources: Array<{ uri: string; mimeType?: string }>,
  sideBySide = false,
): Promise<string> {
  if (!sources.length) throw new Error(uiI18n.t("ui.noDocumentPages"));
  if (sideBySide && sources.length > 2) throw new Error(uiI18n.t("ui.selectOnlyTheFrontAndBackOfOneId"));
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.HelveticaBold);
  const logoUri = Image.resolveAssetSource(require('../../assets/icon-auric.png')).uri;
  const logo = await pdf.embedJpg(await imageBytes(logoUri));
  const drawHeader = (page: ReturnType<typeof pdf.addPage>) => {
    page.drawImage(logo, { x: 30, y: 742, width: 40, height: 40 });
    page.drawText('Auric MedCoach', { x: 82, y: 756, size: 20, font, color: rgb(0.65, 0.49, 0.15) });
  };
  const combined = sideBySide ? pdf.addPage([612, 792]) : null;
  if (combined) drawHeader(combined);
  for (let index = 0; index < sources.length; index++) {
    const source = sources[index];
    const isPdf = source.mimeType === 'application/pdf' || /\.pdf(?:$|\?)/i.test(source.uri);
    const bytes = isPdf
      ? await FileSystem.readAsStringAsync(source.uri, { encoding: FileSystem.EncodingType.Base64 })
      : await imageBytes(source.uri);
    const embedded = isPdf ? await pdf.embedPdf(bytes) : [await pdf.embedJpg(bytes)];
    if (sideBySide && embedded.length !== 1) throw new Error(uiI18n.t("ui.eachIdSideMustContainExactlyOnePage"));
    for (const item of embedded) {
      const page = combined || pdf.addPage([612, 792]);
      if (!combined) drawHeader(page);
      const box = combined
        ? { x: 30 + index * 282, y: 380, width: 270, height: 300 }
        : { x: 30, y: 30, width: 552, height: 680 };
      const scale = Math.min(box.width / item.width, box.height / item.height);
      const dimensions = { x: box.x + (box.width - item.width * scale) / 2,
        y: box.y + (box.height - item.height * scale) / 2,
        width: item.width * scale, height: item.height * scale };
      if (isPdf) page.drawPage(item as any, dimensions);
      else page.drawImage(item as any, dimensions);
      if (combined) page.drawText(index === 0 ? uiI18n.t("ui.frontFrente") : uiI18n.t("ui.backReverso"), {
        x: box.x, y: 700, size: 12, font,
      });
    }
  }
  const uri = `${FileSystem.documentDirectory}document_${Date.now()}_${Math.random().toString(36).slice(2)}.pdf`;
  await FileSystem.writeAsStringAsync(uri, await pdf.saveAsBase64(), { encoding: FileSystem.EncodingType.Base64 });
  return uri;
}
