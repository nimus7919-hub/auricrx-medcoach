const mockDownloadAsync = jest.fn();
const mockCopyAsync = jest.fn();
const mockFsDownloadAsync = jest.fn();
const mockManipulateAsync = jest.fn();
const mockPrintToFileAsync = jest.fn();
const mockWriteAsStringAsync = jest.fn();
const mockReadAsStringAsync = jest.fn();

jest.mock('expo-asset', () => ({
  Asset: {
    fromModule: jest.fn(() => ({
      localUri: null,
      uri: 'icon_auric',
      downloadAsync: mockDownloadAsync,
    })),
  },
}));

jest.mock('expo-file-system', () => ({
  cacheDirectory: 'file:///cache/',
  documentDirectory: 'file:///documents/',
  EncodingType: { Base64: 'base64' },
  copyAsync: (...args: unknown[]) => mockCopyAsync(...args),
  downloadAsync: (...args: unknown[]) => mockFsDownloadAsync(...args),
  writeAsStringAsync: (...args: unknown[]) => mockWriteAsStringAsync(...args),
  readAsStringAsync: (...args: unknown[]) => mockReadAsStringAsync(...args),
}));

jest.mock('expo-image-manipulator', () => ({
  SaveFormat: { PNG: 'png', JPEG: 'jpeg' },
  manipulateAsync: (...args: unknown[]) => mockManipulateAsync(...args),
}));

jest.mock('expo-print', () => ({
  printToFileAsync: (...args: unknown[]) => mockPrintToFileAsync(...args),
}));

jest.mock('pdf-lib', () => {
  const page = {
    drawImage: jest.fn(),
    drawPage: jest.fn(),
  };
  const pdf = {
    copyPages: jest.fn(async () => [{}]),
    addPage: jest.fn(() => page),
    setTitle: jest.fn(),
    setAuthor: jest.fn(),
    embedJpg: jest.fn(async () => ({ width: 100, height: 100 })),
    embedPdf: jest.fn(),
    saveAsBase64: jest.fn(async () => 'cGRm'),
  };
  return {
    PDFDocument: {
      create: jest.fn(async () => pdf),
      load: jest.fn(async () => ({
        getPageCount: () => 1,
        getPageIndices: () => [0],
      })),
    },
  };
});

describe('resolveBundledImageFileUri', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDownloadAsync.mockResolvedValue(undefined);
    mockCopyAsync.mockResolvedValue(undefined);
  });

  it('copies Android release drawable resource names into the cache', async () => {
    const { resolveBundledImageFileUri } = require('../documentPdf');
    const uri = await resolveBundledImageFileUri(1, 'logo.png');

    expect(mockCopyAsync).toHaveBeenCalledWith({
      from: 'icon_auric',
      to: 'file:///cache/logo.png',
    });
    expect(uri).toBe('file:///cache/logo.png');
  });

  it('returns an already-manipulable file URI without copying', async () => {
    const { Asset } = require('expo-asset');
    Asset.fromModule.mockReturnValueOnce({
      localUri: 'file:///cache/ExponentAsset-logo.png',
      uri: 'file:///cache/ExponentAsset-logo.png',
      downloadAsync: mockDownloadAsync,
    });

    const { resolveBundledImageFileUri } = require('../documentPdf');
    const uri = await resolveBundledImageFileUri(1, 'logo.png');

    expect(mockCopyAsync).not.toHaveBeenCalled();
    expect(uri).toBe('file:///cache/ExponentAsset-logo.png');
  });
});

describe('createDocumentPdf logo handling', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    mockDownloadAsync.mockResolvedValue(undefined);
    mockCopyAsync.mockResolvedValue(undefined);
    mockManipulateAsync.mockImplementation(async (uri: string) => {
      if (String(uri).includes('logo') || String(uri).includes('cache')) {
        return { base64: 'bG9nbw==', uri };
      }
      return { base64: '/9j/fakejpeg', uri };
    });
    mockPrintToFileAsync.mockResolvedValue({
      uri: 'file:///documents/template.pdf',
      base64: 'dGVtcGxhdGU=',
    });
    mockWriteAsStringAsync.mockResolvedValue(undefined);
  });

  it('materializes the logo before ImageManipulator runs', async () => {
    jest.doMock('expo-asset', () => ({
      Asset: {
        fromModule: jest.fn(() => ({
          localUri: null,
          uri: 'assets_images_icon_auric',
          downloadAsync: mockDownloadAsync,
        })),
      },
    }));

    const { createDocumentPdf } = require('../documentPdf');
    const uri = await createDocumentPdf([{ uri: 'file:///documents/scan.jpg', type: 'single' }]);

    expect(mockCopyAsync).toHaveBeenCalledWith({
      from: 'assets_images_icon_auric',
      to: 'file:///cache/auricrx-document-pdf-logo.png',
    });
    expect(mockManipulateAsync).toHaveBeenCalledWith(
      'file:///cache/auricrx-document-pdf-logo.png',
      [],
      expect.objectContaining({ base64: true }),
    );
    expect(uri).toMatch(/^file:\/\/\/documents\/document_/);
  });

  it('still builds a PDF when logo loading fails', async () => {
    mockCopyAsync.mockRejectedValue(new Error('cannot open resource'));
    mockManipulateAsync.mockImplementation(async (uri: string) => {
      if (String(uri).includes('auricrx-document-pdf-logo')) {
        throw new Error('logo failed');
      }
      return { base64: '/9j/fakejpeg', uri };
    });

    const { createDocumentPdf } = require('../documentPdf');
    const uri = await createDocumentPdf([{ uri: 'file:///documents/scan.jpg' }]);

    expect(uri).toMatch(/^file:\/\/\/documents\/document_/);
    expect(console.error).toHaveBeenCalled();
  });
});
