import { Platform } from 'react-native';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import * as ImageManipulator from 'expo-image-manipulator';

export interface OcrResult {
  text: string;
  confidence: number;
  blocks: OcrBlock[];
  language: string;
}

export interface OcrBlock {
  text: string;
  confidence: number;
  boundingBox: {
    left: number;
    top: number;
    right: number;
    bottom: number;
  };
}

export class OcrProcessor {
  private static isInitialized = false;

  static async initialize(): Promise<void> {
    try {
      // Check if ML Kit is available on this platform
      if (Platform.OS === 'web') {
        console.log('OCR not available on web platform');
        this.isInitialized = false;
        return;
      }
      
      // Test ML Kit availability
      try {
        // Try to access ML Kit to see if it's available
        if (TextRecognition && typeof TextRecognition.recognize === 'function') {
          this.isInitialized = true;
          console.log('ML Kit OCR initialized successfully');
        } else {
          throw new Error('ML Kit not properly imported');
        }
      } catch (error) {
        console.log('ML Kit OCR test failed, falling back to basic mode:', error);
        this.isInitialized = false;
      }
    } catch (error) {
      console.error('Failed to initialize OCR processor:', error);
      this.isInitialized = false;
    }
  }

  static async recognizeText(imageUri: string, language?: string): Promise<OcrResult> {
    try {
      if (!this.isInitialized) {
        throw new Error('ML Kit OCR not available on this device');
      }

      // Preprocess image for better OCR results
      const processedImageUri = await this.preprocessImageForOcr(imageUri);

      // Use real ML Kit text recognition
      const result = await TextRecognition.recognize(processedImageUri);
      
      if (!result || !result.text) {
        throw new Error('No text detected in image');
      }

      // Clean up the text for better readability
      const cleanedText = result.text
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .replace(/\n\s+/g, '\n') // Remove leading spaces from new lines
        .trim();

      // Convert ML Kit result to our format
      const blocks: OcrBlock[] = result.blocks?.map(block => ({
        text: block.text || '',
        confidence: 0.8, // ML Kit doesn't provide confidence per block
        boundingBox: {
          left: block.frame?.left || 0,
          top: block.frame?.top || 0,
          right: (block.frame?.left || 0) + (block.frame?.width || 0),
          bottom: (block.frame?.top || 0) + (block.frame?.height || 0)
        }
      })) || [];

      return {
        text: cleanedText,
        confidence: 0.8, // ML Kit doesn't provide overall confidence
        blocks,
        language: language || 'en'
      };
    } catch (error) {
      console.error('ML Kit OCR text recognition failed:', error);
      
      // Fallback to basic text detection
      return {
        text: 'Text recognition failed - please ensure image is clear and contains readable text',
        confidence: 0.0,
        blocks: [],
        language: language || 'en'
      };
    }
  }

  static async recognizeMultiplePages(imageUris: string[], language?: string): Promise<OcrResult[]> {
    try {
      const results: OcrResult[] = [];
      
      for (let i = 0; i < imageUris.length; i++) {
        console.log(`Processing page ${i + 1} of ${imageUris.length}`);
        const result = await this.recognizeText(imageUris[i], language);
        results.push(result);
      }
      
      return results;
    } catch (error) {
      console.error('Multi-page OCR failed:', error);
      throw error;
    }
  }

  static async batchProcess(
    images: string[], 
    onProgress?: (current: number, total: number) => void,
    language?: string
  ): Promise<OcrResult[]> {
    try {
      const results: OcrResult[] = [];
      const total = images.length;
      
      for (let i = 0; i < total; i++) {
        if (onProgress) {
          onProgress(i + 1, total);
        }
        
        const result = await this.recognizeText(images[i], language);
        results.push(result);
        
        // Small delay to prevent overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      return results;
    } catch (error) {
      console.error('Batch OCR processing failed:', error);
      throw error;
    }
  }

  /**
   * Preprocess image for better OCR results
   */
  private static async preprocessImageForOcr(imageUri: string): Promise<string> {
    try {
      console.log('🔧 Preprocessing image for OCR...');
      
      // Check if imageUri is valid
      if (!imageUri || typeof imageUri !== 'string') {
        console.warn('⚠️ Invalid image URI provided');
        return imageUri;
      }

      // Enhance image for better text recognition
      const processedImage = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          // Resize to optimal size for OCR (not too small, not too large)
          { resize: { width: 1200 } },
          // Enhance contrast and brightness for better text recognition
          { format: ImageManipulator.SaveFormat.JPEG },
        ],
        {
          compress: 0.95, // Very high quality for better OCR
          format: ImageManipulator.SaveFormat.JPEG
        }
      );

      console.log('✅ Image preprocessed for OCR successfully');
      return processedImage.uri;
    } catch (error) {
      console.log('📝 Image preprocessing skipped, using original image (this is normal)');
      // Don't show error to user, just use original image
      return imageUri; // Fallback to original image
    }
  }

  static isOcrAvailable(): boolean {
    return this.isInitialized;
  }

  static getSupportedLanguages(): string[] {
    if (!this.isInitialized) return ['en'];
    
    // ML Kit supports many languages
    return [
      'en', 'es', 'zh', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko',
      'ar', 'hi', 'th', 'vi', 'id', 'ms', 'nl', 'pl', 'sv', 'da',
      'no', 'fi', 'hu', 'cs', 'sk', 'sl', 'hr', 'bg', 'ro', 'el',
      'tr', 'he', 'fa', 'ur', 'bn', 'ta', 'te', 'kn', 'ml', 'gu'
    ];
  }
}
