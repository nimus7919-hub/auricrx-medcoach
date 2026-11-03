import { NativeModules, Platform } from 'react-native';

export type DocumentScanResult =
  | { status: 'success'; images: string[] }
  | { status: 'cancel' | 'unavailable'; images: [] };

// No hooks: safe to call from an event handler and safe in older native builds.
let scanning = false;
export async function scanDocumentPages(pageLimit = 100): Promise<DocumentScanResult> {
  if (scanning) return { status: 'cancel', images: [] };
  if (Platform.OS !== 'android' || !NativeModules.AuricDocumentScanner?.scanDocument) {
    return { status: 'unavailable', images: [] };
  }
  try {
    scanning = true;
    const result = await NativeModules.AuricDocumentScanner.scanDocument(pageLimit);
    if (result.status === 'cancel') return { status: 'cancel', images: [] };
    if (result.scannedImages?.length) return { status: 'success', images: result.scannedImages };
  } catch {
    // Missing Play services, unsupported hardware, or scanner download failure.
  } finally {
    scanning = false;
  }
  return { status: 'unavailable', images: [] };
}
