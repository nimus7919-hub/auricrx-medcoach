/**
 * File I/O helpers for encrypted Documents vault files.
 * Keeps MedicalDocumentsScreen changes small and testable.
 */
import * as FileSystem from 'expo-file-system';
import DocumentsSecurityService from '../services/documentsSecurityService';

/**
 * Encrypt a newly copied vault file in place and return a plaintext cache URI for UI.
 * Persist the original `uri` (storage path) in medical_documents.json — not the cache URI.
 */
export async function sealCopiedDocument(uri: string): Promise<{ storageUri: string; displayUri: string }> {
  const security = DocumentsSecurityService.getInstance();
  await security.encryptFileInPlace(uri);
  const displayUri = await security.ensureReadableUri(uri);
  return { storageUri: uri, displayUri };
}

export function toStorageDocument<T extends { uri: string; pdfUri?: string }>(doc: T): T {
  return DocumentsSecurityService.getInstance().toStorageDocument(doc);
}

export async function openDocumentUri(uri: string): Promise<string> {
  return DocumentsSecurityService.getInstance().ensureReadableUri(uri);
}

export async function migrateAndHydrateDocuments<T extends { uri: string; pdfUri?: string }>(
  documents: T[]
): Promise<T[]> {
  const security = DocumentsSecurityService.getInstance();
  await security.migrateDocumentFiles(documents);

  const hydrated: T[] = [];
  for (const doc of documents) {
    const uri = await security.ensureReadableUri(doc.uri);
    const pdfUri = doc.pdfUri ? await security.ensureReadableUri(doc.pdfUri) : doc.pdfUri;
    hydrated.push({ ...doc, uri, pdfUri });
  }
  return hydrated;
}

export async function readDocumentBase64(uri: string): Promise<string> {
  const readable = await openDocumentUri(uri);
  return FileSystem.readAsStringAsync(readable, {
    encoding: FileSystem.EncodingType.Base64,
  });
}
