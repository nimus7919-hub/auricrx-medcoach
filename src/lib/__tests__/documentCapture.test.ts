import { capturedDocumentFields } from '../documentCapture';

describe('capturedDocumentFields', () => {
  it('prefers the PDF as primary uri for single-page scans when available', () => {
    expect(capturedDocumentFields({
      type: 'single',
      imageUri: 'file:///docs/scan.jpg',
      pdfUri: 'file:///docs/scan.pdf',
    })).toEqual({
      uri: 'file:///docs/scan.pdf',
      pdfUri: 'file:///docs/scan.pdf',
      mimeType: 'application/pdf',
    });
  });

  it('falls back to the image when PDF generation failed', () => {
    expect(capturedDocumentFields({
      type: 'single',
      imageUri: 'file:///docs/scan.jpg',
    })).toEqual({
      uri: 'file:///docs/scan.jpg',
      pdfUri: undefined,
      mimeType: 'image/jpeg',
    });
  });

  it('keeps ID front/back images as primary even when a PDF exists', () => {
    expect(capturedDocumentFields({
      type: 'front',
      imageUri: 'file:///docs/front.jpg',
      pdfUri: 'file:///docs/id.pdf',
    })).toEqual({
      uri: 'file:///docs/front.jpg',
      pdfUri: 'file:///docs/id.pdf',
      mimeType: 'image/jpeg',
    });
  });

  it('can force camera captures to keep the JPEG as primary', () => {
    expect(capturedDocumentFields({
      type: 'single',
      imageUri: 'file:///docs/photo.jpg',
      pdfUri: 'file:///docs/photo.pdf',
      preferPdfForSingle: false,
    })).toEqual({
      uri: 'file:///docs/photo.jpg',
      pdfUri: 'file:///docs/photo.pdf',
      mimeType: 'image/jpeg',
    });
  });
});
