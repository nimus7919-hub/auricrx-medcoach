import * as FileSystem from 'expo-file-system';

export interface ScanManifest {
  id: string;
  name: string;
  createdAt: string;
  pages: string[];
  ocrText?: string;
  pageCount: number;
}

export interface ScanPage {
  id: string;
  uri: string;
  order: number;
  ocrText?: string;
}

export class ScanStorage {
  private static readonly SCANS_DIR = `${FileSystem.documentDirectory}scans/`;
  private static readonly MANIFEST_FILE = 'manifest.json';

  static async initialize(): Promise<void> {
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.SCANS_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.SCANS_DIR, { intermediates: true });
      }
    } catch (error) {
      console.error('Failed to initialize scan storage:', error);
    }
  }

  static async saveScan(scan: ScanManifest): Promise<void> {
    try {
      const scanDir = `${this.SCANS_DIR}${scan.id}/`;
      await FileSystem.makeDirectoryAsync(scanDir, { intermediates: true });
      
      // Save manifest
      const manifestPath = `${scanDir}${this.MANIFEST_FILE}`;
      await FileSystem.writeAsStringAsync(manifestPath, JSON.stringify(scan, null, 2));
      
      // Save pages
      for (let i = 0; i < scan.pages.length; i++) {
        const pageUri = scan.pages[i];
        const pagePath = `${scanDir}page_${i}.jpg`;
        await FileSystem.copyAsync({
          from: pageUri,
          to: pagePath
        });
        // Update manifest with local paths
        scan.pages[i] = pagePath;
      }
      
      // Update manifest with local paths
      await FileSystem.writeAsStringAsync(manifestPath, JSON.stringify(scan, null, 2));
    } catch (error) {
      console.error('Failed to save scan:', error);
      throw error;
    }
  }

  static async loadScan(scanId: string): Promise<ScanManifest | null> {
    try {
      const scanDir = `${this.SCANS_DIR}${scanId}/`;
      const manifestPath = `${scanDir}${this.MANIFEST_FILE}`;
      
      const manifestInfo = await FileSystem.getInfoAsync(manifestPath);
      if (!manifestInfo.exists) return null;
      
      const manifestContent = await FileSystem.readAsStringAsync(manifestPath);
      return JSON.parse(manifestContent);
    } catch (error) {
      console.error('Failed to load scan:', error);
      return null;
    }
  }

  static async getAllScans(): Promise<ScanManifest[]> {
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.SCANS_DIR);
      if (!dirInfo.exists) return [];
      
      const scanDirs = await FileSystem.readDirectoryAsync(this.SCANS_DIR);
      const scans: ScanManifest[] = [];
      
      for (const scanDir of scanDirs) {
        const scan = await this.loadScan(scanDir);
        if (scan) scans.push(scan);
      }
      
      return scans.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error('Failed to get all scans:', error);
      return [];
    }
  }

  static async deleteScan(scanId: string): Promise<void> {
    try {
      const scanDir = `${this.SCANS_DIR}${scanId}/`;
      const dirInfo = await FileSystem.getInfoAsync(scanDir);
      if (dirInfo.exists) {
        await FileSystem.deleteAsync(scanDir, { idempotent: true });
      }
    } catch (error) {
      console.error('Failed to delete scan:', error);
      throw error;
    }
  }

  static async updateScanOcr(scanId: string, ocrText: string): Promise<void> {
    try {
      const scan = await this.loadScan(scanId);
      if (!scan) return;
      
      scan.ocrText = ocrText;
      await this.saveScan(scan);
    } catch (error) {
      console.error('Failed to update scan OCR:', error);
      throw error;
    }
  }

  static async getScanStats(): Promise<{ totalScans: number; totalPages: number; totalSize: number }> {
    try {
      const scans = await this.getAllScans();
      const totalScans = scans.length;
      const totalPages = scans.reduce((sum, scan) => sum + scan.pageCount, 0);
      
      // Calculate total size (simplified)
      const totalSize = totalPages * 500000; // Estimate 500KB per page
      
      return { totalScans, totalPages, totalSize };
    } catch (error) {
      console.error('Failed to get scan stats:', error);
      return { totalScans: 0, totalPages: 0, totalSize: 0 };
    }
  }
}
