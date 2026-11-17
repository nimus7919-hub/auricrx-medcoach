/**
 * Build durable document fields after scan/camera capture.
 * pdfUri is optional so a failed branded PDF never drops the original image.
 */
export function capturedDocumentFields(options: {
  type: 'front' | 'back' | 'single';
  imageUri: string;
  pdfUri?: string;
  /** When true (default), single-page scans prefer the PDF as the primary uri. */
  preferPdfForSingle?: boolean;
}): { uri: string; pdfUri?: string; mimeType: 'application/pdf' | 'image/jpeg' } {
  const preferPdf = options.preferPdfForSingle !== false;
  const usePdfPrimary = preferPdf && options.type === 'single' && !!options.pdfUri;
  return {
    uri: usePdfPrimary ? options.pdfUri! : options.imageUri,
    pdfUri: options.pdfUri,
    mimeType: usePdfPrimary ? 'application/pdf' : 'image/jpeg',
  };
}
