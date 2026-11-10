import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

export interface ExportOptions {
  format: 'json' | 'pdf';
  includeReminders?: boolean;
  includeMedications?: boolean;
  includeDocuments?: boolean;
  includeHabits?: boolean;
  includeFamilyCircle?: boolean;
  includeLabValues?: boolean;
}

class PrivacyExportService {
  private static instance: PrivacyExportService;

  static getInstance() {
    if (!this.instance) {
      this.instance = new PrivacyExportService();
    }
    return this.instance;
  }

  async getAllData(): Promise<{ [key: string]: any }> {
    const keys = await AsyncStorage.getAllKeys();
    const data: { [key: string]: any } = {};

    for (const key of keys) {
      try {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          data[key] = JSON.parse(value);
        }
      } catch (error) {
        data[key] = value;
      }
    }

    return data;
  }

  async exportData(options: ExportOptions): Promise<string | null> {
    try {
      const allData = await this.getAllData();
      
      const exportData: { [key: string]: any } = {
        exportedAt: new Date().toISOString(),
        appVersion: '1.0.0',
        platform: Platform.OS,
      };

      if (options.includeReminders) {
        exportData.reminders = allData['reminders'] || [];
      }

      if (options.includeMedications) {
        exportData.medications = allData['medications'] || [];
      }

      if (options.includeDocuments) {
        const docs = allData['labDocuments:documents'] || [];
        exportData.documents = docs.map((doc: any) => ({
          ...doc,
          uri: undefined,
          pages: undefined,
        }));
      }

      if (options.includeHabits) {
        exportData.dailyHabits = allData['dailyHabits:entries'] || [];
      }

      if (options.includeFamilyCircle) {
        exportData.familyCircle = {
          members: allData['familyCircle:members'] || [],
          doseLogs: allData['familyCircle:doseLogs'] || [],
        };
      }

      if (options.includeLabValues) {
        exportData.labValues = allData['labDocuments:labValues'] || [];
      }

      if (options.format === 'json') {
        return this.saveAndShareJSON(exportData);
      } else {
        return this.saveAndSharePDF(exportData);
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      return null;
    }
  }

  private async saveAndShareJSON(data: any): Promise<string | null> {
    try {
      const filename = `auricrx_export_${new Date().toISOString().split('T')[0]}.json`;
      const fileUri = FileSystem.documentDirectory + filename;
      
      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(data, null, 2));

      if (Platform.OS !== 'web' && await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'Exportar Datos de AuricRX',
        });
      }

      return fileUri;
    } catch (error) {
      console.error('Error saving JSON export:', error);
      return null;
    }
  }

  private async saveAndSharePDF(data: any): Promise<string | null> {
    try {
      const content = this.generatePDFContent(data);
      const filename = `auricrx_export_${new Date().toISOString().split('T')[0]}.txt`;
      const fileUri = FileSystem.documentDirectory + filename;
      
      await FileSystem.writeAsStringAsync(fileUri, content);

      if (Platform.OS !== 'web' && await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/plain',
          dialogTitle: 'Exportar Datos de AuricRX',
        });
      }

      return fileUri;
    } catch (error) {
      console.error('Error saving PDF export:', error);
      return null;
    }
  }

  private generatePDFContent(data: any): string {
    let content = '=================================\n';
    content += 'EXPORTACIÓN DE DATOS - AURICRX MEDCOACH\n';
    content += '=================================\n\n';
    content += `Fecha de exportación: ${new Date(data.exportedAt).toLocaleString()}\n`;
    content += `Versión: ${data.appVersion}\n`;
    content += `Plataforma: ${data.platform}\n\n`;

    if (data.reminders && data.reminders.length > 0) {
      content += '\n--- RECORDATORIOS ---\n';
      content += `Total: ${data.reminders.length}\n\n`;
    }

    if (data.medications && data.medications.length > 0) {
      content += '\n--- MEDICAMENTOS ---\n';
      content += `Total: ${data.medications.length}\n\n`;
    }

    if (data.dailyHabits && data.dailyHabits.length > 0) {
      content += '\n--- HÁBITOS DIARIOS ---\n';
      content += `Total de entradas: ${data.dailyHabits.length}\n\n`;
    }

    if (data.familyCircle) {
      content += '\n--- CÍRCULO FAMILIAR ---\n';
      content += `Miembros: ${data.familyCircle.members?.length || 0}\n`;
      content += `Registros de dosis: ${data.familyCircle.doseLogs?.length || 0}\n\n`;
    }

    if (data.labValues && data.labValues.length > 0) {
      content += '\n--- VALORES DE LABORATORIO ---\n';
      content += `Total: ${data.labValues.length}\n\n`;
    }

    content += '\n=================================\n';
    content += 'FIN DE LA EXPORTACIÓN\n';
    content += '=================================\n';

    return content;
  }

  async deleteAllData(): Promise<boolean> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      
      const keysToDelete = keys.filter(key => 
        !key.includes('consent') &&
        !key.includes('onboarding') &&
        !key.includes('selectedWallpaper') &&
        !key.includes('languageSelected')
      );

      await AsyncStorage.multiRemove(keysToDelete);
      return true;
    } catch (error) {
      console.error('Error deleting data:', error);
      return false;
    }
  }
}

export default PrivacyExportService;
