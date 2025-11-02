import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as ImageManipulator from 'expo-image-manipulator';

export interface PdfOptions {
  pages: string[];
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string[];
  includeOcrText?: boolean;
  ocrText?: string[];
  pageLayout?: 'portrait' | 'landscape';
  margin?: number;
  fontSize?: number;
}

export interface PdfResult {
  success: boolean;
  filePath?: string;
  fileSize?: number;
  pageCount?: number;
  error?: string;
}

export class PdfGenerator {
  private static exportDir: string;

  static async initialize(): Promise<void> {
    try {
      this.exportDir = `${FileSystem.documentDirectory}pdf_exports/`;
      const dirInfo = await FileSystem.getInfoAsync(this.exportDir);
      
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.exportDir, { intermediates: true });
      }
      
      // Clean up old exports (keep last 10)
      await this.cleanupOldExports();
    } catch (error) {
      console.error('Failed to initialize PDF generator:', error);
    }
  }

  static async createPdf(options: PdfOptions): Promise<PdfResult> {
    try {
      const {
        pages,
        title = 'Document Scan',
        author = 'AuricRx MedCoach',
        subject = 'Scanned Document',
        keywords = ['scan', 'document', 'medical'],
        includeOcrText = true,
        ocrText = [],
        pageLayout = 'portrait',
        margin = 20,
        fontSize = 12
      } = options;

      if (pages.length === 0 && ocrText.length === 0) {
        throw new Error('No pages or text provided for PDF generation');
      }
      
      // If we have OCR text but no pages, that's fine - we'll create a text-only PDF
      if (pages.length === 0 && ocrText.length > 0) {
        console.log('📄 Creating text-only PDF with', ocrText.length, 'text entries');
      }

      console.log('🔄 Processing images for PDF generation...');
      console.log('📄 Pages to process:', pages.length);
      console.log('📄 Page URIs:', pages);
      console.log('📄 OCR text to process:', ocrText.length);
      
      let processedImages = [];
      
      if (pages.length > 0) {
        console.log('📸 Processing images...');
        // Process images: convert to black and white and get base64
        processedImages = await Promise.all(
          pages.map(async (uri, index) => {
          try {
            console.log(`📸 Processing page ${index + 1}: ${uri}`);
            
            // Validate URI first
            if (!uri || typeof uri !== 'string') {
              throw new Error(`Invalid URI for page ${index + 1}: ${uri}`);
            }
            
            // Convert to black and white for better document readability
            const processedImage = await ImageManipulator.manipulateAsync(
              uri,
              [
                { resize: { width: 800 } }, // Resize for better PDF size
                // Note: ImageManipulator doesn't have direct grayscale filter
                // We'll use CSS filter in the PDF to convert to grayscale
              ],
              {
                compress: 0.8, // Good compression for documents
                format: ImageManipulator.SaveFormat.JPEG,
                base64: true // Get base64 for embedding
              }
            );

            if (!processedImage.base64) {
              throw new Error(`No base64 data returned for page ${index + 1}`);
            }

            return {
              index,
              base64: `data:image/jpeg;base64,${processedImage.base64}`,
              ocrText: ocrText[index] || ''
            };
          } catch (error) {
            console.error(`❌ Failed to process image ${index + 1}:`, error);
            // Fallback: try to get base64 without processing
            try {
              const base64 = await FileSystem.readAsStringAsync(uri, {
                encoding: FileSystem.EncodingType.Base64
              });
              return {
                index,
                base64: `data:image/jpeg;base64,${base64}`,
                ocrText: ocrText[index] || ''
              };
            } catch (fallbackError) {
              console.error(`❌ Fallback also failed for image ${index + 1}:`, fallbackError);
              return {
                index,
                base64: null,
                ocrText: ocrText[index] || ''
              };
            }
          }
        })
      );

      console.log('✅ Images processed successfully');
      console.log('📊 Processed images:', processedImages.length);
      } else {
        // No images, create text-only entries
        console.log('📄 No images provided, creating text-only entries');
        processedImages = ocrText.map((text, index) => ({
          index,
          base64: null,
          ocrText: text
        }));
      }

      // Check if we have at least one valid image or text
      const validImages = processedImages.filter(img => img.base64 !== null);
      const hasText = processedImages.some(img => img.ocrText.trim().length > 0);
      
      if (validImages.length === 0 && !hasText) {
        throw new Error('No valid images or text could be processed for PDF generation');
      }

      console.log(`📄 Using ${validImages.length} valid images and ${processedImages.length} text entries for PDF`);

      // Create rich HTML content with processed images
      const htmlContent = this.generateRichHtml({
        processedImages,
        title,
        author,
        subject,
        keywords,
        includeOcrText,
        pageLayout,
        margin,
        fontSize
      });

      // Generate unique filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `scan_${timestamp}.pdf`;
      const filePath = `${this.exportDir}${filename}`;

      console.log('📄 Generating PDF...');

      // Create PDF using expo-print
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false
      });

      // Copy to our export directory
      await FileSystem.copyAsync({
        from: uri,
        to: filePath
      });

      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      const fileSize = fileInfo.exists && 'size' in fileInfo ? fileInfo.size || 0 : 0;

      // Clean up temporary file
      await FileSystem.deleteAsync(uri, { idempotent: true });

      console.log(`✅ PDF generated successfully: ${filename} (${Math.round(fileSize / 1024)}KB)`);

      return {
        success: true,
        filePath,
        fileSize,
        pageCount: Math.max(pages.length, processedImages.length)
      };

    } catch (error) {
      console.error('❌ PDF generation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private static generateRichHtml(options: {
    processedImages: Array<{
      index: number;
      base64: string | null;
      ocrText: string;
    }>;
    title: string;
    author: string;
    subject: string;
    keywords: string[];
    includeOcrText: boolean;
    pageLayout: 'portrait' | 'landscape';
    margin: number;
    fontSize: number;
  }): string {
    const {
      processedImages,
      title,
      author,
      subject,
      keywords,
      includeOcrText,
      pageLayout,
      margin,
      fontSize
    } = options;
    
    const css = `
      @page {
        size: ${pageLayout === 'portrait' ? 'A4' : 'A4 landscape'};
        margin: ${margin}mm;
      }
      body {
        font-family: 'Arial', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', sans-serif;
        font-size: ${fontSize}px;
        line-height: 1.6;
        color: #333;
        margin: 0;
        padding: 0;
      }
      .header {
        text-align: center;
        border-bottom: 2px solid #d4af37;
        padding-bottom: 20px;
        margin-bottom: 30px;
      }
      .title {
        font-size: 24px;
        font-weight: bold;
        color: #d4af37;
        margin-bottom: 10px;
      }
      .metadata {
        font-size: 12px;
        color: #666;
        margin-bottom: 20px;
      }
      .page-container {
        page-break-after: always;
        margin-bottom: 30px;
      }
      .page-image {
        max-width: 100%;
        height: auto;
        border: 1px solid #ddd;
        border-radius: 8px;
        margin-bottom: 15px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        filter: grayscale(100%) contrast(1.2); /* Convert to black and white with enhanced contrast */
      }
      .page-number {
        font-size: 14px;
        font-weight: bold;
        color: #d4af37;
        margin-bottom: 10px;
        text-align: center;
      }
      .ocr-text {
        background: #f8f9fa;
        border: 1px solid #e9ecef;
        border-radius: 6px;
        padding: 15px;
        margin-top: 15px;
        font-family: 'Courier New', monospace;
        font-size: 11px;
        line-height: 1.4;
        white-space: pre-wrap;
        max-height: 300px;
        overflow-y: auto;
      }
      .ocr-text:empty {
        display: none;
      }
      .footer {
        text-align: center;
        font-size: 10px;
        color: #999;
        margin-top: 30px;
        border-top: 1px solid #eee;
        padding-top: 20px;
      }
      .keywords {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        justify-content: center;
        margin: 15px 0;
      }
      .keyword {
        background: #d4af37;
        color: white;
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 10px;
        font-weight: bold;
      }
      .no-image {
        background: #f8f9fa;
        border: 2px dashed #dee2e6;
        border-radius: 8px;
        padding: 40px;
        text-align: center;
        color: #6c757d;
        font-style: italic;
        margin: 20px 0;
      }
    `;

    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <style>${css}</style>
      </head>
      <body>
        <div class="header">
          <div class="title">${title}</div>
          <div class="metadata">
            <strong>Author:</strong> ${author}<br>
            <strong>Subject:</strong> ${subject}<br>
            <strong>Generated:</strong> ${new Date().toLocaleDateString()}<br>
            <strong>Pages:</strong> ${processedImages.length}
          </div>
          <div class="keywords">
            ${keywords.map(k => `<span class="keyword">${k}</span>`).join('')}
          </div>
        </div>
    `;

    // Add each page with processed image and OCR text
    processedImages.forEach((imageData) => {
      const { index, base64, ocrText: pageOcrText } = imageData;
      const hasOcrText = pageOcrText.trim().length > 0;
      const hasImage = base64 !== null;
      
      console.log(`📄 Processing page ${index + 1}:`);
      console.log(`📄 Has image: ${hasImage}`);
      console.log(`📄 Has OCR text: ${hasOcrText}`);
      console.log(`📄 OCR text length: ${pageOcrText.length}`);
      console.log(`📄 OCR text preview: ${pageOcrText.substring(0, 100)}...`);
      console.log(`📄 Include OCR text: ${includeOcrText}`);
      
      html += `
        <div class="page-container">
          <div class="page-number">Page ${index + 1}</div>
          ${hasImage ? `<img src="${base64}" alt="Page ${index + 1}" class="page-image" />` : ''}
          ${hasOcrText && includeOcrText ? `<div class="ocr-text">${pageOcrText}</div>` : ''}
        </div>
      `;
    });

    html += `
        <div class="footer">
          Generated by AuricRx MedCoach<br>
          ${new Date().toLocaleString()}
        </div>
      </body>
      </html>
    `;

    console.log('📄 Final HTML length:', html.length);
    console.log('📄 HTML preview:', html.substring(0, 500) + '...');
    
    return html;
  }

  static async sharePdf(filePath: string): Promise<boolean> {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(filePath, {
          mimeType: 'application/pdf',
          dialogTitle: 'Share PDF Document'
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to share PDF:', error);
      return false;
    }
  }

  private static async cleanupOldExports(): Promise<void> {
    try {
      const files = await FileSystem.readDirectoryAsync(this.exportDir);
      const pdfFiles = files.filter(file => file.endsWith('.pdf'));
      
      if (pdfFiles.length > 10) {
        // Sort by modification time and keep only the 10 most recent
        const fileInfos = await Promise.all(
          pdfFiles.map(async (file) => {
            const filePath = `${this.exportDir}${file}`;
            const info = await FileSystem.getInfoAsync(filePath);
      return {
              name: file,
              path: filePath,
              modificationTime: info.exists && 'modificationTime' in info ? info.modificationTime || 0 : 0
            };
          })
        );

        // Sort by modification time (newest first) and remove old files
        fileInfos
          .sort((a, b) => b.modificationTime - a.modificationTime)
          .slice(10)
          .forEach(async (file) => {
            try {
              await FileSystem.deleteAsync(file.path, { idempotent: true });
              console.log(`Cleaned up old PDF: ${file.name}`);
            } catch (error) {
              console.error(`Failed to delete old PDF ${file.name}:`, error);
            }
          });
      }
    } catch (error) {
      console.error('Failed to cleanup old exports:', error);
    }
  }
}
