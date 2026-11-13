import DocumentsSecurityService from '../../services/documentsSecurityService';
import { sealCopiedDocument, toStorageDocument } from '../documentVaultIo';

const mockVault = {
  encryptFileInPlace: jest.fn(async () => true),
  ensureReadableUri: jest.fn(async (uri: string) => `${uri}.plain`),
  toStorageDocument: jest.fn((doc: any) => ({
    ...doc,
    uri: String(doc.uri).replace(/\.plain$/, ''),
    pdfUri: doc.pdfUri ? String(doc.pdfUri).replace(/\.plain$/, '') : doc.pdfUri,
  })),
};

jest.mock('../../services/documentsSecurityService', () => ({
  __esModule: true,
  default: {
    getInstance: () => mockVault,
  },
}));

describe('documentVaultIo', () => {
  it('seals a copied file and returns storage + display URIs', async () => {
    const result = await sealCopiedDocument('file:///docs/scan.jpg');
    expect(result.storageUri).toBe('file:///docs/scan.jpg');
    expect(result.displayUri).toBe('file:///docs/scan.jpg.plain');
    expect(DocumentsSecurityService.getInstance().encryptFileInPlace).toHaveBeenCalledWith(
      'file:///docs/scan.jpg'
    );
  });

  it('maps display documents back to storage paths for persistence', () => {
    const stored = toStorageDocument({
      uri: 'file:///docs/scan.jpg.plain',
      pdfUri: 'file:///docs/scan.pdf.plain',
    });
    expect(stored.uri).toBe('file:///docs/scan.jpg');
    expect(stored.pdfUri).toBe('file:///docs/scan.pdf');
  });
});
