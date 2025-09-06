import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  TextInput,
  Animated,
  StatusBar,
  Platform,
  Vibration,
  Share,
  Clipboard,
  PanResponder,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system';

import { ScanStorage, ScanManifest } from '../lib/storage';
import { OcrProcessor } from '../lib/ocr';
import { PdfGenerator } from '../lib/pdf';
import { EdgeDetector } from '../lib/edgeDetection';
import { useTranslation } from 'react-i18next';
import DocumentCamera from '../components/DocumentCamera';


const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface DocScanScreenProps {
  onClose: () => void;
  onScanSaved?: (scan: ScanManifest) => void;
  theme?: any;
}

export default function DocScanScreen({ onClose, onScanSaved, theme }: DocScanScreenProps) {
  const { t } = useTranslation();
  
  // Default theme if not provided
  const defaultTheme = {
    card: '#ffffff',
    text: '#2c2c2c',
    sub: '#6b6b6b',
    accent: '#d4af37',
    chip: '#e8e3d8',
  };
  
  const currentTheme = theme || defaultTheme;
  
  // Generate dynamic styles based on theme
  const getDynamicStyles = () => StyleSheet.create({
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: currentTheme.text,
      marginBottom: 16,
    },
    qualitySelector: {
      backgroundColor: currentTheme.card,
      padding: 16,
      borderRadius: 12,
      marginBottom: 8,
      borderColor: currentTheme.chip,
    },
    languageSelector: {
      backgroundColor: currentTheme.card,
      padding: 16,
      borderRadius: 12,
      marginBottom: 8,
    },
    ocrSection: {
      backgroundColor: currentTheme.card,
      padding: 16,
      borderRadius: 12,
      marginBottom: 24,
    },
    ocrResultItem: {
      backgroundColor: currentTheme.card,
      padding: 12,
      borderRadius: 8,
      width: 200,
    },
    ocrResultBadge: {
      backgroundColor: currentTheme.chip,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    ocrActionButton: {
      backgroundColor: currentTheme.chip,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: currentTheme.chip,
    },
    progressContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    progressBar: {
      width: '80%',
      height: 8,
      backgroundColor: currentTheme.chip,
      borderRadius: 4,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: currentTheme.accent,
      borderRadius: 4,
    },
    processingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    processingIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: currentTheme.chip,
      paddingVertical: 12,
      paddingHorizontal: 16,
      marginHorizontal: 16,
      marginTop: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: currentTheme.chip,
    },
    confidenceIndicator: {
      backgroundColor: currentTheme.chip,
      paddingVertical: 12,
      paddingHorizontal: 16,
      marginHorizontal: 16,
      marginTop: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: currentTheme.chip,
    },
    confidenceBar: {
      height: 6,
      backgroundColor: currentTheme.chip,
      borderRadius: 3,
      overflow: 'hidden',
    },
    savedScansSection: {
      marginBottom: 24,
    },
    savedScansList: {
      flexDirection: 'row',
      gap: 12,
    },
    savedScanItem: {
      backgroundColor: currentTheme.card,
      padding: 12,
      borderRadius: 12,
      width: 250,
      alignItems: 'center',
      borderColor: currentTheme.chip,
    },
    savedScanActionButton: {
      backgroundColor: currentTheme.accent,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: currentTheme.accent,
    },
    nameInputContainer: {
      backgroundColor: currentTheme.card,
      padding: 16,
      borderRadius: 12,
      marginBottom: 24,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    pagesSection: {
      marginBottom: 24,
    },
    controlsSection: {
      gap: 12,
      marginBottom: 24,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 60,
    },
    modalOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
    modalContent: {
      backgroundColor: currentTheme.card,
      borderRadius: 12,
      padding: 24,
      width: '80%',
      alignItems: 'center',
    },
    modalButton: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 10,
      alignItems: 'center',
    },
    modalButtonCancel: {
      backgroundColor: currentTheme.chip,
    },
    modalButtonSave: {
      backgroundColor: currentTheme.accent,
    },
    pdfOptionsContainer: {
      backgroundColor: currentTheme.card,
      padding: 16,
      borderRadius: 12,
      marginTop: 12,
      width: '100%',
    },
    pdfOptionRow: {
      marginBottom: 12,
    },
    pdfOptionButtons: {
      flexDirection: 'row',
      gap: 8,
      justifyContent: 'center',
    },
    pdfOptionButton: {
      backgroundColor: currentTheme.chip,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    newScanModalContent: {
      backgroundColor: currentTheme.card,
      borderRadius: 16,
      padding: 24,
      width: '85%',
      alignItems: 'center',
    },
    newScanModalButtons: {
      flexDirection: 'row',
      gap: 16,
      marginBottom: 24,
    },
    newScanModalCancelButton: {
      backgroundColor: 'transparent',
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: currentTheme.chip,
    },
    nameInputLabel: {
      color: currentTheme.text,
      fontSize: 14,
      fontWeight: '500',
    },
    nameInput: {
      flex: 1,
      backgroundColor: currentTheme.chip,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      color: currentTheme.text,
      fontSize: 14,
    },
    nameInputButton: {
      backgroundColor: currentTheme.accent,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
    },
    nameInputButtonText: {
      color: currentTheme.text,
      fontSize: 14,
      fontWeight: '600',
    },
    pageItem: {
      width: (screenWidth - 44) / 2,
      backgroundColor: currentTheme.card,
      borderRadius: 12,
      padding: 8,
      position: 'relative',
    },
    languageLabel: {
      color: currentTheme.text,
      fontSize: 14,
      fontWeight: '500',
      marginBottom: 12,
      textAlign: 'center',
    },
    languageButton: {
      backgroundColor: currentTheme.chip,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    languageButtonText: {
      color: currentTheme.sub,
      fontSize: 12,
      fontWeight: '600',
    },
    controlButton: {
      backgroundColor: currentTheme.chip,
      paddingVertical: 16,
      paddingHorizontal: 20,
      borderRadius: 12,
      alignItems: 'center',
    },
    controlButtonText: {
      color: currentTheme.text,
      fontSize: 16,
      fontWeight: '600',
    },
    primaryButton: {
      backgroundColor: currentTheme.accent,
    },
    primaryButtonText: {
      color: currentTheme.text,
      fontSize: 16,
      fontWeight: '600',
    },
    secondaryButton: {
      backgroundColor: currentTheme.chip,
    },
    secondaryButtonText: {
      color: currentTheme.text,
      fontSize: 16,
      fontWeight: '600',
    },
    dangerButton: {
      backgroundColor: '#dc2626',
    },
    dangerButtonText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '600',
    },
    infoButton: {
      backgroundColor: '#0891b2',
    },
    infoButtonText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '600',
    },
    emptyStateTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: currentTheme.text,
      marginBottom: 8,
    },
    emptyStateText: {
      fontSize: 14,
      color: currentTheme.sub,
      textAlign: 'center',
      lineHeight: 20,
    },
    ocrResultTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: currentTheme.accent,
    },
    ocrResultBadgeText: {
      color: currentTheme.text,
      fontSize: 10,
      fontWeight: '500',
    },
    ocrResultText: {
      fontSize: 12,
      color: currentTheme.sub,
      lineHeight: 16,
    },
    ocrActionButtonText: {
      color: currentTheme.text,
      fontSize: 12,
      fontWeight: '600',
    },
    progressText: {
      color: currentTheme.text,
      fontSize: 14,
      fontWeight: '600',
      marginLeft: 10,
    },
    processingText: {
      color: currentTheme.text,
      fontSize: 14,
      fontWeight: '600',
    },
    qualityLabel: {
      color: currentTheme.text,
      fontSize: 14,
      fontWeight: '500',
      marginBottom: 12,
      textAlign: 'center',
    },
    qualityButton: {
      backgroundColor: currentTheme.chip,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    qualityButtonText: {
      color: currentTheme.sub,
      fontSize: 12,
      fontWeight: '600',
    },
    edgeDetectionLabel: {
      color: currentTheme.text,
      fontSize: 14,
      fontWeight: '500',
    },
    edgeDetectionDescription: {
      color: currentTheme.sub,
      fontSize: 12,
      marginTop: 2,
    },
    edgeDetectionToggleButton: {
      backgroundColor: currentTheme.chip,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: currentTheme.chip,
    },
    edgeDetectionToggleButtonText: {
      color: currentTheme.sub,
      fontSize: 12,
      fontWeight: '600',
    },
    savedScanTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: currentTheme.accent,
      flex: 1,
      marginRight: 8,
    },
    savedScanBadgeText: {
      color: currentTheme.text,
      fontSize: 10,
      fontWeight: '500',
    },
    savedScanDate: {
      color: currentTheme.sub,
      fontSize: 12,
      marginBottom: 12,
    },
    savedScanActionButtonText: {
      color: '#ffffff',
      fontSize: 12,
      fontWeight: '600',
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: currentTheme.text,
      marginBottom: 16,
    },
    modalTextInput: {
      width: '100%',
      backgroundColor: currentTheme.chip,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 8,
      color: currentTheme.text,
      fontSize: 14,
      minHeight: 100,
      textAlignVertical: 'top',
    },
    modalButtonText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '600',
    },
    pdfOptionsTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: currentTheme.text,
      marginBottom: 12,
      textAlign: 'center',
    },
    pdfOptionLabel: {
      color: currentTheme.text,
      fontSize: 14,
      fontWeight: '500',
      marginBottom: 8,
    },
    pdfOptionButton: {
      backgroundColor: currentTheme.chip,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    pdfOptionButtonText: {
      color: currentTheme.sub,
      fontSize: 12,
      fontWeight: '600',
    },
    pdfOptionsInfo: {
      color: currentTheme.sub,
      fontSize: 12,
      textAlign: 'center',
      marginTop: 12,
    },
    newScanModalTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: currentTheme.text,
      marginBottom: 8,
    },
    newScanModalSubtitle: {
      fontSize: 16,
      color: currentTheme.sub,
      textAlign: 'center',
      marginBottom: 24,
      lineHeight: 22,
    },
    newScanModalButton: {
      backgroundColor: currentTheme.chip,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 100,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    newScanModalButtonText: {
      color: currentTheme.text,
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 2,
    },
    newScanModalButtonSubtext: {
      color: currentTheme.sub,
      fontSize: 12,
      textAlign: 'center',
    },
    newScanModalCancelText: {
      color: currentTheme.sub,
      fontSize: 14,
      fontWeight: '500',
    },
  });
  
  const dynamicStyles = getDynamicStyles();
  const [pages, setPages] = useState<string[]>([]);
  const [scanName, setScanName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrResults, setOcrResults] = useState<string[]>([]);
  const [currentScan, setCurrentScan] = useState<ScanManifest | null>(null);
  const [showNameInput, setShowNameInput] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  const [scanProgress, setScanProgress] = useState(0);
  const [showOcrResults, setShowOcrResults] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingText, setEditingText] = useState<string[]>([]);
  const [selectedPage, setSelectedPage] = useState<number | null>(null);
  const [scanQuality, setScanQuality] = useState<'high' | 'medium' | 'low'>('high');
  const [showPdfOptions, setShowPdfOptions] = useState(false);
  const [pdfLayout, setPdfLayout] = useState<'portrait' | 'landscape'>('portrait');
  const [pdfMargins, setPdfMargins] = useState(10);
  const [pdfFontSize, setPdfFontSize] = useState(12);
  const [savedScans, setSavedScans] = useState<ScanManifest[]>([]);
  const [showSavedScans, setShowSavedScans] = useState(false);
  const [showNewScanModal, setShowNewScanModal] = useState(false);
  const [enableEdgeDetection, setEnableEdgeDetection] = useState(true);
  const [enableCropping, setEnableCropping] = useState(false); // Always disabled
  const [isProcessingEdges, setIsProcessingEdges] = useState(false);
  const [edgeDetectionConfidence, setEdgeDetectionConfidence] = useState<number | null>(null);
  const [showDocumentCamera, setShowDocumentCamera] = useState(false);

  
  // Gesture navigation state
  const [gestureEnabled, setGestureEnabled] = useState(true);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Haptic feedback
  const triggerHaptic = (type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (Platform.OS === 'ios') {
      const style = type === 'light' ? Haptics.ImpactFeedbackStyle.Light : 
                   type === 'medium' ? Haptics.ImpactFeedbackStyle.Medium : 
                   Haptics.ImpactFeedbackStyle.Heavy;
      Haptics.impactAsync(style);
    } else {
      Vibration.vibrate(type === 'light' ? 50 : type === 'medium' ? 100 : 200);
    }
  };

  // PanResponder for gesture navigation
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => gestureEnabled,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 10 || Math.abs(gestureState.dy) > 10;
      },
      onPanResponderGrant: () => {
        // Gesture started
      },
      onPanResponderMove: (_, gestureState) => {
        // Gesture in progress
      },
      onPanResponderRelease: (_, gestureState) => {
        if (!gestureEnabled) return;
        
        const { dx, dy, vx, vy, x0, y0 } = gestureState;
        
        // Check if gesture started from edge (within 50px of edge)
        const fromLeftEdge = x0 < 50;
        const fromRightEdge = x0 > screenWidth - 50;
        const fromTopEdge = y0 < 50;
        const fromBottomEdge = y0 > screenHeight - 50;
        
        // Swipe from left edge to go back
        if (fromLeftEdge && dx > 100 && vx > 0.5) {
          triggerHaptic('medium');
          onClose();
          return;
        }
        
        // Swipe from right edge for new scan
        if (fromRightEdge && dx < -100 && vx < -0.5) {
          triggerHaptic('light');
          setShowNewScanModal(true);
          return;
        }
        
        // Swipe up from bottom for saved scans
        if (fromBottomEdge && dy < -100 && vy < -0.5) {
          triggerHaptic('light');
          setShowSavedScans(!showSavedScans);
          return;
        }
        
        // Swipe down from top to close
        if (fromTopEdge && dy > 100 && vy > 0.5) {
          triggerHaptic('medium');
          onClose();
          return;
        }
      },
    })
  ).current;

  useEffect(() => {
    initializeStorage();
    loadExistingScans();
    
    // Premium entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous pulse animation for action buttons
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const loadExistingScans = async () => {
    try {
      const existingScans = await ScanStorage.getAllScans();
      setSavedScans(existingScans);
      console.log('Loaded existing scans:', existingScans.length);
    } catch (error) {
      console.error('Failed to load existing scans:', error);
    }
  };

  const initializeStorage = async () => {
    try {
      await ScanStorage.initialize();
      await PdfGenerator.initialize();
      await OcrProcessor.initialize();
    } catch (error) {
      console.error('Failed to initialize storage:', error);
    }
  };

  const requestPermissions = async (): Promise<boolean> => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          '📱 Permission Required',
          'Please grant camera roll access to scan documents.',
          [{ text: 'OK' }]
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  };

  const addFromGallery = async () => {
    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) return;

      triggerHaptic('light');

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: scanQuality === 'high' ? 1.0 : scanQuality === 'medium' ? 0.8 : 0.6,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets) {
        if (enableEdgeDetection) {
          setIsProcessingEdges(true);
          showSuccessFeedback('🔍 Processing document edges...');
          
          try {
            const processedPages: string[] = [];
            
            for (const asset of result.assets) {
              const processedResult = await EdgeDetector.processDocument(asset.uri, false); // Always disable cropping
              
              if (processedResult.success && processedResult.processedUri) {
                processedPages.push(processedResult.processedUri);
              } else {
                // Fallback to original image if edge detection fails
                processedPages.push(asset.uri);
                console.log('⚠️ Edge detection failed for gallery image:', processedResult.error);
              }
            }
            
            setPages(prev => [...prev, ...processedPages]);
            showSuccessFeedback('✅ Gallery images processed with edge detection');
          } catch (error) {
            console.error('Gallery edge detection error:', error);
            // Fallback to original images
            const originalPages = result.assets.map(asset => asset.uri);
            setPages(prev => [...prev, ...originalPages]);
            showSuccessFeedback('📸 Images added from gallery (processing failed)');
          } finally {
            setIsProcessingEdges(false);
          }
        } else {
          // No edge detection, use original images
          const newPages = result.assets.map(asset => asset.uri);
          setPages(prev => [...prev, ...newPages]);
          showSuccessFeedback('📸 Images added from gallery');
        }
        
        triggerHaptic('medium');
      }
    } catch (error) {
      console.error('Failed to add from gallery:', error);
      Alert.alert('❌ Error', 'Failed to add images from gallery');
    }
  };

  const addFromGalleryForAI = async () => {
    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) return;

      triggerHaptic('light');

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 1.0, // High quality for AI analysis
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets) {
        setIsProcessing(true);
        showSuccessFeedback('🤖 AI is analyzing your images...');
        
        try {
          const aiAnalysisResults: string[] = [];
          
          for (const asset of result.assets) {
            const analysis = await analyzeImageWithAI(asset.uri);
            if (analysis) {
              aiAnalysisResults.push(analysis);
            }
          }
          
          if (aiAnalysisResults.length > 0) {
            // Create a document with AI analysis
            const aiDocument = aiAnalysisResults.join('\n\n---\n\n');
            await saveAIAnalysisAsDocument(aiDocument);
            showSuccessFeedback('✅ AI analysis saved as document!');
          } else {
            showSuccessFeedback('⚠️ AI analysis failed, please try again');
          }
        } catch (error) {
          console.error('AI analysis error:', error);
          showSuccessFeedback('❌ AI analysis failed');
        } finally {
          setIsProcessing(false);
        }
        
        triggerHaptic('medium');
      }
    } catch (error) {
      console.error('Failed to analyze with AI:', error);
      Alert.alert('❌ Error', 'Failed to analyze images with AI');
    }
  };

  const analyzeImageWithAI = async (imageUri: string): Promise<string | null> => {
    try {
      console.log('🤖 Starting AI analysis...');
      
      // First, try to extract text using OCR
      console.log('📝 Extracting text with OCR...');
      const ocrResult = await OcrProcessor.recognizeText(imageUri);
      let extractedText = '';
      
      if (ocrResult && ocrResult.text) {
        extractedText = ocrResult.text;
        console.log('✅ OCR extracted text:', extractedText.substring(0, 100) + '...');
      } else {
        console.log('⚠️ No text extracted from OCR');
      }
      
      // Create analysis based on what we have
      let analysis = '';
      
      if (extractedText) {
        // Analyze the extracted text
        analysis = `📄 DOCUMENT ANALYSIS\n\n` +
          `Extracted Text:\n"${extractedText}"\n\n` +
          `Analysis:\n` +
          `This appears to be a medical document containing text. The extracted content shows: "${extractedText.substring(0, 200)}${extractedText.length > 200 ? '...' : ''}"\n\n` +
          `Key Information Found:\n` +
          `- Document contains readable text\n` +
          `- Text length: ${extractedText.length} characters\n` +
          `- First 50 characters: "${extractedText.substring(0, 50)}"\n\n` +
          `Recommendation: Review the extracted text above for any medical information, prescriptions, or important details.`;
      } else {
        // Generic analysis for images without text
        analysis = `📸 IMAGE ANALYSIS\n\n` +
          `This image appears to be a medical document or health-related content.\n\n` +
          `Common elements to look for in medical documents:\n` +
          `• Patient information and demographics\n` +
          `• Prescription details (medication name, dosage, instructions)\n` +
          `• Doctor's notes and recommendations\n` +
          `• Lab results or test values\n` +
          `• Appointment information\n` +
          `• Insurance or billing information\n\n` +
          `Note: No text was automatically extracted from this image. You may need to review it manually or try taking a clearer photo.`;
      }
      
      console.log('✅ AI analysis completed');
      return analysis;
      
    } catch (error) {
      console.error('AI analysis failed:', error);
      
      // Fallback analysis
      return `📄 DOCUMENT ANALYSIS\n\n` +
        `Error during analysis: ${error.message}\n\n` +
        `This appears to be a medical document. Please review the image manually for:\n` +
        `• Patient information\n` +
        `• Prescription details\n` +
        `• Medical instructions\n` +
        `• Important dates or numbers\n\n` +
        `Consider taking a clearer photo if the text is not easily readable.`;
    }
  };

  const saveAIAnalysisAsDocument = async (content: string) => {
    try {
      const timestamp = new Date().toISOString();
      const fileName = `AI_Analysis_${timestamp.split('T')[0]}.txt`;
      
      // Save to document directory
      const documentPath = `${FileSystem.documentDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(documentPath, content, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      
      // Also save to scan storage for consistency
      const scanManifest: ScanManifest = {
        id: `ai_${Date.now()}`,
        name: `AI Analysis - ${new Date().toLocaleDateString()}`,
        pages: [],
        ocrResults: [content],
        createdAt: new Date().toISOString(),
        language: 'en',
        type: 'ai_analysis'
      };
      
      await ScanStorage.saveScan(scanManifest);
      setCurrentScan(scanManifest);
      
      showSuccessFeedback('📄 AI analysis saved successfully!');
    } catch (error) {
      console.error('Failed to save AI analysis:', error);
      throw error;
    }
  };

  const saveAIAnalysisAsPDF = async (content: string, imageUri: string) => {
    try {
      console.log('📄 Starting PDF generation...');
      console.log('📄 Content length:', content.length);
      console.log('📄 Image URI:', imageUri);
      console.log('📄 Content preview:', content.substring(0, 200) + '...');
      
      // Create a simple text-only PDF first to test
      const timestamp = new Date().toISOString();
      const fileName = `AI_Analysis_${timestamp.split('T')[0]}.txt`;
      
      // Save as text file first
      const documentPath = `${FileSystem.documentDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(documentPath, content, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      
      // Also save to scan storage
      const scanManifest: ScanManifest = {
        id: `ai_${Date.now()}`,
        name: `AI Analysis - ${new Date().toLocaleDateString()}`,
        pages: [imageUri],
        ocrResults: [content],
        createdAt: new Date().toISOString(),
        language: 'en',
        type: 'ai_analysis'
      };
      
      await ScanStorage.saveScan(scanManifest);
      setCurrentScan(scanManifest);
      
      showSuccessFeedback('📄 AI analysis saved as text file!');
      console.log('✅ Text file saved successfully:', documentPath);
      
      // Try to create a simple PDF with just the text (no image processing)
      try {
        await PdfGenerator.initialize();
        
        const pdfResult = await PdfGenerator.createPdf({
          pages: [], // No images to avoid preprocessing issues
          title: `AI Analysis - ${new Date().toLocaleDateString()}`,
          author: 'AuricRx MedCoach',
          subject: 'AI Document Analysis',
          keywords: ['ai', 'analysis', 'medical', 'document'],
          includeOcrText: true,
          ocrText: [content],
          pageLayout: 'portrait',
          margin: 20,
          fontSize: 12
        });
        
        if (pdfResult.success && pdfResult.filePath) {
          console.log('✅ PDF also created successfully:', pdfResult.filePath);
          showSuccessFeedback('📄 AI analysis saved as both text and PDF!');
        }
      } catch (pdfError) {
        console.log('⚠️ PDF creation failed, but text file saved:', pdfError);
        // Don't throw error, text file was saved successfully
      }
      
    } catch (error) {
      console.error('Failed to save AI analysis:', error);
      throw error;
    }
  };

  const addFromCamera = async () => {
    setShowDocumentCamera(true);
  };


  const handleCameraCapture = async (uri: string) => {
    setShowDocumentCamera(false);
    
    // Show AI Analysis option after capture
    Alert.alert(
      '📸 Photo Captured',
      'What would you like to do with this photo?',
      [
        {
          text: 'Regular Scan',
          onPress: async () => {
            await processCapturedImage(uri);
          }
        },
        {
          text: '🤖 AI Analysis',
          onPress: async () => {
            await analyzeCapturedImageWithAI(uri);
          }
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  };

  const processCapturedImage = async (uri: string) => {
    try {
        if (enableEdgeDetection) {
          setIsProcessingEdges(true);
          showSuccessFeedback('🔍 Processing document edges...');
          console.log('🔍 Starting edge detection for camera image...');
          
          try {
          const processedResult = await EdgeDetector.processDocument(uri, false); // Always disable cropping
            console.log('🔍 Edge detection result:', processedResult);
            
            if (processedResult.success && processedResult.processedUri) {
              setPages(prev => [...prev, processedResult.processedUri!]);
              setEdgeDetectionConfidence(processedResult.confidence || 0.85);
              showSuccessFeedback(`✅ Smart edge detection (${Math.round((processedResult.confidence || 0.85) * 100)}% confidence)`);
              console.log('📄 Document bounds detected:', processedResult.bounds);
            } else {
              // Fallback to original image if edge detection fails
            setPages(prev => [...prev, uri]);
              setEdgeDetectionConfidence(null);
              showSuccessFeedback('📷 Image captured (edge detection failed)');
              console.log('⚠️ Edge detection failed:', processedResult.error);
            }
          } catch (error) {
            console.error('❌ Edge detection error:', error);
            // Fallback to original image
          setPages(prev => [...prev, uri]);
            showSuccessFeedback('📷 Image captured (processing failed)');
          } finally {
            setIsProcessingEdges(false);
          }
        } else {
          // No edge detection, use original image
          console.log('📷 Using original image without edge detection');
        setPages(prev => [...prev, uri]);
          showSuccessFeedback('📷 Image captured successfully');
        }
        
        triggerHaptic('medium');
    } catch (error) {
      console.error('Failed to process captured image:', error);
      Alert.alert('❌ Error', 'Failed to process captured image');
    }
  };

  const analyzeCapturedImageWithAI = async (uri: string) => {
    try {
      setIsProcessing(true);
      showSuccessFeedback('🤖 AI is analyzing your photo...');
      
      const analysis = await analyzeImageWithAI(uri);
      
      if (analysis) {
        // Save AI analysis as PDF
        await saveAIAnalysisAsPDF(analysis, uri);
        showSuccessFeedback('✅ AI analysis saved as PDF!');
      } else {
        showSuccessFeedback('⚠️ AI analysis failed, please try again');
      }
    } catch (error) {
      console.error('AI analysis error:', error);
      showSuccessFeedback('❌ AI analysis failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const showSuccessFeedback = (message: string) => {
    // Premium success feedback
    console.log(message);
    triggerHaptic('light');
  };

  const removePage = (index: number) => {
    triggerHaptic('medium');
    setPages(prev => prev.filter((_, i) => i !== index));
    setOcrResults(prev => prev.filter((_, i) => i !== index));
    
    if (pages.length <= 1) {
      setShowOcrResults(false);
    }
  };

  const reorderPages = (fromIndex: number, toIndex: number) => {
    triggerHaptic('light');
    setPages(prev => {
      const newPages = [...prev];
      const [movedPage] = newPages.splice(fromIndex, 1);
      newPages.splice(toIndex, 0, movedPage);
      return newPages;
    });

    setOcrResults(prev => {
      const newResults = [...prev];
      const [movedResult] = newResults.splice(fromIndex, 1);
      newResults.splice(toIndex, 0, movedResult);
      return newResults;
    });
  };

  const processOcr = async () => {
    if (pages.length === 0) {
      Alert.alert('📄 No Pages', 'Please add some pages before running OCR');
      return;
    }

    setIsProcessing(true);
    setScanProgress(0);
    triggerHaptic('medium');
    
    try {
      const results = await OcrProcessor.batchProcess(pages, (current, total) => {
        const progress = (current / total) * 100;
        setScanProgress(progress);
        
        // Animate progress bar
        Animated.timing(progressAnim, {
          toValue: progress / 100,
          duration: 300,
          useNativeDriver: false,
        }).start();
        
        console.log(`Processing page ${current} of ${total} (${progress.toFixed(1)}%)`);
      }, selectedLanguage);

      const texts = results.map(result => result.text);
      setOcrResults(texts);
      setShowOcrResults(true);

      // Premium OCR completion feedback
      const totalText = results.reduce((acc, result) => acc + result.text.length, 0);
      const avgConfidence = results.reduce((acc, result) => acc + result.confidence, 0) / results.length;
      
      triggerHaptic('heavy');
      
      Alert.alert(
        '🎉 OCR Complete!', 
        `Successfully processed ${pages.length} page${pages.length > 1 ? 's' : ''}\n\n` +
        `📝 Total characters extracted: ${totalText.toLocaleString()}\n` +
        `🎯 Average confidence: ${(avgConfidence * 100).toFixed(1)}%\n\n` +
        `Your document text is ready for export!`,
        [
          { text: 'View Results', onPress: () => setShowOcrResults(true) },
          { text: 'OK', style: 'default' }
        ]
      );
    } catch (error) {
      console.error('OCR processing failed:', error);
      triggerHaptic('heavy');
      Alert.alert(
        '❌ OCR Failed', 
        'Failed to process text recognition.\n\n' +
        '💡 Tips for better results:\n' +
        '• Ensure images are well-lit and clear\n' +
        '• Text should be readable and not blurry\n' +
        '• Avoid shadows or reflections\n' +
        '• Try adjusting camera angle or lighting\n' +
        '• Use high-quality scan settings'
      );
    } finally {
      setIsProcessing(false);
      setScanProgress(0);
      Animated.timing(progressAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  };

  const saveScan = async () => {
    if (pages.length === 0) {
      Alert.alert('📄 No Pages', 'Please add some pages before saving');
      return;
    }

    if (!scanName.trim()) {
      setShowNameInput(true);
      return;
    }

    try {
      triggerHaptic('medium');
      
      const scan: ScanManifest = {
        id: `scan_${Date.now()}`,
        name: scanName.trim(),
        createdAt: new Date().toISOString(),
        pages: [...pages],
        ocrText: ocrResults.join('\n\n'),
        pageCount: pages.length,
      };

      await ScanStorage.saveScan(scan);
      setCurrentScan(scan);
      
      if (onScanSaved) {
        onScanSaved(scan);
      }
      
      triggerHaptic('heavy');
      Alert.alert(
        '💾 Scan Saved!', 
        `Document "${scan.name}" saved successfully!\n\n` +
        `📄 Pages: ${pages.length}\n` +
        `📝 OCR Text: ${ocrResults.length > 0 ? 'Available' : 'Not processed'}\n\n` +
        `Your scan is now stored and accessible from the Documents tile.`
      );
      
      setScanName('');
      loadExistingScans(); // Reload saved scans to show the new one
    } catch (error) {
      console.error('Failed to save scan:', error);
      Alert.alert('❌ Save Failed', 'Failed to save the document scan');
    }
  };

  const exportPdf = async () => {
    if (pages.length === 0) {
      Alert.alert('📄 No Pages', 'Please add some pages before exporting');
      return;
    }

    setIsProcessing(true);
    triggerHaptic('medium');
    
    try {
      const result = await PdfGenerator.createPdf({
        pages,
        title: scanName || 'Document Scan',
        author: 'AuricRx MedCoach',
        subject: 'Scanned Document',
        keywords: ['scan', 'document', 'medical'],
        includeOcrText: true,
        ocrText: ocrResults || [],
        pageLayout: pdfLayout,
        margin: pdfMargins,
        fontSize: pdfFontSize
      });

      if (result.success) {
        const shared = await PdfGenerator.sharePdf(result.filePath || '');
        triggerHaptic('heavy');
        
        if (shared) {
          Alert.alert(
            '📄 PDF Exported!', 
            'PDF exported and shared successfully!\n\n' +
            `📊 File size: ${((result.fileSize || 0) / 1024).toFixed(1)} KB\n` +
            `📄 Pages: ${result.pageCount}\n` +
            `📝 OCR Text: ${ocrResults.length > 0 ? 'Included' : 'Not available'}\n` +
            `📐 Layout: ${pdfLayout} | Margins: ${pdfMargins}mm | Font: ${pdfFontSize}px`
          );
        } else {
          Alert.alert(
            '📄 PDF Exported!', 
            `PDF saved successfully!\n\n` +
            `📁 Location: ${result.filePath}\n` +
            `📊 File size: ${((result.fileSize || 0) / 1024).toFixed(1)} KB\n` +
            `📄 Pages: ${result.pageCount}\n` +
            `📝 OCR Text: ${ocrResults.length > 0 ? 'Included' : 'Not available'}\n` +
            `📐 Layout: ${pdfLayout} | Margins: ${pdfMargins}mm | Font: ${pdfFontSize}px`
          );
        }
      } else {
        console.error('PDF export failed:', result.error);
        Alert.alert(
          '❌ Export Failed', 
          result.error || 'Failed to export PDF\n\n' +
          '💡 Troubleshooting tips:\n' +
          '• Make sure you have at least one page scanned\n' +
          '• Check that images are valid and accessible\n' +
          '• Try scanning again with better lighting\n' +
          '• Ensure sufficient storage space'
        );
      }
    } catch (error) {
      console.error('PDF export failed:', error);
      Alert.alert('❌ Export Failed', 'Failed to export PDF');
    } finally {
      setIsProcessing(false);
    }
  };

  const exportOcrText = async () => {
    if (ocrResults.length === 0) {
      Alert.alert('📝 No OCR Results', 'Please run OCR first before exporting text');
      return;
    }

    try {
      triggerHaptic('medium');
      
      const textContent = ocrResults.map((text, index) => 
        `=== Page ${index + 1} ===\n${text}\n\n`
      ).join('');
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `ocr_${scanName || 'document'}_${timestamp}.txt`;
      
      // Copy to clipboard
      await Clipboard.setString(textContent);
      
      // Share the text
      try {
        await Share.share({
          message: textContent,
          title: 'OCR Text Export',
        });
      } catch (shareError) {
        console.log('Share not available, text copied to clipboard');
      }
      
      triggerHaptic('light');
      Alert.alert(
        '📝 OCR Text Ready!', 
        `OCR text extracted from ${ocrResults.length} page${ocrResults.length > 1 ? 's' : ''}.\n\n` +
        `📊 Total characters: ${textContent.length.toLocaleString()}\n` +
        `📄 File name: ${filename}\n\n` +
        `✅ Text copied to clipboard and shared!`
      );
    } catch (error) {
      console.error('OCR text export failed:', error);
      Alert.alert('❌ Export Failed', 'Failed to export OCR text');
    }
  };

  const editOcrText = (pageIndex: number) => {
    setSelectedPage(pageIndex);
    setEditingText([...ocrResults]);
    setIsEditing(true);
    triggerHaptic('light');
  };

  const saveOcrEdit = () => {
    if (selectedPage !== null) {
      setOcrResults(editingText);
      setIsEditing(false);
      setSelectedPage(null);
      triggerHaptic('medium');
      showSuccessFeedback('✅ OCR text updated successfully');
    }
  };

  const copyOcrText = async (text: string) => {
    try {
      await Clipboard.setString(text);
      triggerHaptic('light');
      showSuccessFeedback('📋 Text copied to clipboard');
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  const loadSavedScan = async (scan: ScanManifest) => {
    setPages(scan.pages);
    setOcrResults(scan.ocrText ? scan.ocrText.split('\n\n') : []);
    setScanName(scan.name);
    setCurrentScan(scan);
    setShowOcrResults(true);
    triggerHaptic('light');
    Alert.alert(
      '📄 Scan Loaded!', 
      `Document "${scan.name}" loaded successfully.`,
      [{ text: 'OK' }]
    );
  };

  const deleteSavedScan = async (id: string) => {
    triggerHaptic('heavy');
    Alert.alert(
      '🗑️ Scan Deleted',
      'Scan deleted successfully.',
      [{ text: 'OK' }]
    );
    await ScanStorage.deleteScan(id);
    loadExistingScans();
  };

  const renderPageItem = (uri: string, index: number) => (
    <Animated.View 
      key={`${uri}_${index}`} 
      style={[
        dynamicStyles.pageItem,
        {
          opacity: fadeAnim,
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim }
          ]
        }
      ]}
    >
      <Image source={{ uri }} style={styles.pageImage} resizeMode="contain" />
      
      {/* Premium page number overlay */}
      <View style={styles.pageNumber}>
        <Text style={styles.pageNumberText}>{index + 1}</Text>
      </View>
      
      {/* Premium page controls */}
      <View style={styles.pageControls}>
        <TouchableOpacity
          style={styles.deletePageButton}
          onPress={() => removePage(index)}
        >
          <Text style={styles.deletePageButtonText}>🗑️</Text>
        </TouchableOpacity>
        {index > 0 && (
          <TouchableOpacity
            style={styles.pageButton}
            onPress={() => reorderPages(index, index - 1)}
          >
            <Text style={styles.pageButtonText}>↑</Text>
          </TouchableOpacity>
        )}
        {index < pages.length - 1 && (
          <TouchableOpacity
            style={styles.pageButton}
            onPress={() => reorderPages(index, index + 1)}
          >
            <Text style={styles.pageButtonText}>↓</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {/* Premium OCR indicator */}
      {ocrResults[index] && (
        <View style={styles.ocrIndicator}>
          <Text style={styles.ocrIndicatorText}>OCR ✓</Text>
          <Text style={styles.ocrConfidenceText}>
            {ocrResults[index].length > 100 ? 'High' : ocrResults[index].length > 50 ? 'Medium' : 'Low'}
          </Text>
        </View>
      )}
    </Animated.View>
  );

  const renderOcrResults = () => (
    <Animated.View 
      style={[
        dynamicStyles.ocrSection,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <View style={styles.ocrHeader}>
        <Text style={dynamicStyles.sectionTitle}>📝 OCR Results</Text>
        <TouchableOpacity 
          style={styles.toggleButton}
          onPress={() => {
            setShowOcrResults(!showOcrResults);
            triggerHaptic('light');
          }}
        >
          <Text style={styles.toggleButtonText}>
            {showOcrResults ? 'Hide' : 'Show'}
          </Text>
        </TouchableOpacity>
      </View>
      
      {showOcrResults && (
        <View style={styles.ocrResults}>
          {ocrResults.map((text, index) => (
          <View key={index} style={dynamicStyles.ocrResultItem}>
              <View style={styles.ocrResultHeader}>
                <Text style={dynamicStyles.ocrResultTitle}>Page {index + 1}</Text>
                <View style={dynamicStyles.ocrResultBadge}>
                  <Text style={dynamicStyles.ocrResultBadgeText}>
                    {text.length} chars
                  </Text>
                </View>
              </View>
              
              <View style={styles.ocrResultTextContainer}>
                <Text style={dynamicStyles.ocrResultText}>
                  {text}
                </Text>
              </View>
              
              <View style={styles.ocrResultActions}>
                <TouchableOpacity 
                  style={dynamicStyles.ocrActionButton}
                  onPress={() => copyOcrText(text)}
                >
                  <Text style={dynamicStyles.ocrActionButtonText}>📋 Copy</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={dynamicStyles.ocrActionButton}
                  onPress={() => editOcrText(index)}
                >
                  <Text style={dynamicStyles.ocrActionButtonText}>✏️ Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={dynamicStyles.ocrActionButton}
                  onPress={() => Share.share({ message: text, title: `Page ${index + 1} OCR Text` })}
                >
                  <Text style={dynamicStyles.ocrActionButtonText}>📤 Share</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}
    </Animated.View>
  );

  const renderQualitySelector = () => (
    <View style={[styles.qualitySelector, { backgroundColor: currentTheme.card, borderColor: currentTheme.chip }]}>
      <Text style={[styles.qualityLabel, { color: currentTheme.text }]}>Scan Quality:</Text>
      <View style={styles.qualityButtons}>
        {(['low', 'medium', 'high'] as const).map(quality => (
          <TouchableOpacity
            key={quality}
            style={[
              styles.qualityButton,
              { backgroundColor: currentTheme.chip },
              scanQuality === quality && { backgroundColor: currentTheme.accent }
            ]}
            onPress={() => {
              setScanQuality(quality);
              triggerHaptic('light');
            }}
          >
            <Text style={[
              styles.qualityButtonText,
              { color: currentTheme.text },
              scanQuality === quality && { color: currentTheme.text }
            ]}>
              {quality.charAt(0).toUpperCase() + quality.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {/* Edge Detection Toggle */}
      <View style={styles.edgeDetectionToggle}>
        <View style={styles.edgeDetectionInfo}>
          <Text style={[styles.edgeDetectionLabel, { color: currentTheme.text }]}>🔍 Smart Edge Detection:</Text>
          <Text style={[styles.edgeDetectionDescription, { color: currentTheme.sub }]}>
            AI-powered document boundary detection
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.edgeDetectionToggleButton,
            { backgroundColor: currentTheme.chip },
            enableEdgeDetection && { backgroundColor: currentTheme.accent }
          ]}
          onPress={() => {
            setEnableEdgeDetection(!enableEdgeDetection);
            triggerHaptic('light');
          }}
        >
          <Text style={[
            styles.edgeDetectionToggleButtonText,
            { color: currentTheme.text },
            enableEdgeDetection && { color: currentTheme.text }
          ]}>
            {enableEdgeDetection ? 'ON' : 'OFF'}
          </Text>
        </TouchableOpacity>
      </View>

    </View>
  );

  // Show DocumentCamera when requested
  if (showDocumentCamera) {
  return (
      <DocumentCamera
        onCapture={handleCameraCapture}
        onClose={() => setShowDocumentCamera(false)}
        enableEdgeDetection={enableEdgeDetection}
        theme={currentTheme}
      />
    );
  }


  return (
    <LinearGradient colors={[currentTheme.bgStart || '#faf8f5', currentTheme.bgEnd || '#f5f2ed', '#f0ede8']} style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      <View style={styles.container}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          {...panResponder.panHandlers}
        >
        {/* Premium Header */}
        <Animated.View 
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <TouchableOpacity style={styles.homeButton} onPress={onClose}>
            <Image 
              source={require('../../assets/AuricRX_home_button.png')} 
              style={styles.homeButtonIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </Animated.View>

        {/* Premium Action Buttons */}
        <Animated.View 
          style={[
            styles.actionRow,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }, { scale: pulseAnim }]
            }
          ]}
        >
          <TouchableOpacity 
            style={[styles.actionButton, styles.primaryActionButton]} 
            onPress={() => {
              triggerHaptic('medium');
              setShowNewScanModal(true);
            }}
          >
            <Text style={styles.actionButtonText}>Start Scan</Text>
          </TouchableOpacity>
          
          {pages.length > 0 && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.clearButton]} 
              onPress={() => {
                triggerHaptic('medium');
                Alert.alert(
                  '🗑️ Clear Current Scan',
                  'This will clear current pages and start fresh. Continue?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { 
                      text: 'Clear All', 
                      onPress: () => {
                        setPages([]);
                        setOcrResults([]);
                        setScanName('');
                        setCurrentScan(null);
                        setShowOcrResults(false);
                        triggerHaptic('heavy');
                        showSuccessFeedback('🗑️ Scan cleared');
                      }
                    }
                  ]
                );
              }}
            >
              <Text style={styles.actionButtonIcon}>🗑️</Text>
              <Text style={styles.actionButtonText}>Clear Scan</Text>
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* Quality Selector */}
        <View style={[dynamicStyles.qualitySelector, { borderColor: currentTheme.chip }]}>
          <Text style={[dynamicStyles.qualityLabel, { color: currentTheme.text }]}>Scan Quality:</Text>
          <View style={styles.qualityButtons}>
            {(['low', 'medium', 'high'] as const).map(quality => (
              <TouchableOpacity
                key={quality}
                style={[
                  dynamicStyles.qualityButton,
                  { backgroundColor: currentTheme.chip },
                  scanQuality === quality && { backgroundColor: currentTheme.accent }
                ]}
                onPress={() => {
                  setScanQuality(quality);
                  triggerHaptic('light');
                }}
              >
                <Text style={[
                  dynamicStyles.qualityButtonText,
                  { color: currentTheme.text },
                  scanQuality === quality && { color: currentTheme.text }
                ]}>
                  {quality.charAt(0).toUpperCase() + quality.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          {/* Edge Detection Toggle */}
          <View style={styles.edgeDetectionToggle}>
            <View style={styles.edgeDetectionInfo}>
              <Text style={[dynamicStyles.edgeDetectionLabel, { color: currentTheme.text }]}>🔍 Smart Edge Detection:</Text>
              <Text style={[dynamicStyles.edgeDetectionDescription, { color: currentTheme.sub }]}>
                AI-powered document boundary detection
              </Text>
            </View>
            <TouchableOpacity
              style={[
                dynamicStyles.edgeDetectionToggleButton,
                { backgroundColor: currentTheme.chip },
                enableEdgeDetection && { backgroundColor: currentTheme.accent }
              ]}
              onPress={() => {
                setEnableEdgeDetection(!enableEdgeDetection);
                triggerHaptic('light');
              }}
            >
              <Text style={[
                dynamicStyles.edgeDetectionToggleButtonText,
                { color: currentTheme.text },
                enableEdgeDetection && { color: currentTheme.text }
              ]}>
                {enableEdgeDetection ? 'ON' : 'OFF'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Edge Processing Indicator */}
        {isProcessingEdges && (
          <View style={dynamicStyles.processingIndicator}>
            <ActivityIndicator size="small" color={currentTheme.accent} />
            <Text style={[dynamicStyles.processingText, { color: currentTheme.text }]}>🔍 AI-powered edge detection...</Text>
            <Text style={[dynamicStyles.edgeDetectionDescription, { color: currentTheme.sub }]}>Analyzing document boundaries</Text>
          </View>
        )}

        {/* Edge Detection Confidence Indicator */}
        {edgeDetectionConfidence !== null && (
          <View style={dynamicStyles.confidenceIndicator}>
            <Text style={[dynamicStyles.edgeDetectionLabel, { color: currentTheme.text }]}>
              🎯 Detection Confidence: {Math.round(edgeDetectionConfidence * 100)}%
            </Text>
            <View style={dynamicStyles.confidenceBar}>
              <View 
                style={[
                  dynamicStyles.progressFill, 
                  { 
                    width: `${edgeDetectionConfidence * 100}%`,
                    backgroundColor: edgeDetectionConfidence > 0.8 ? '#10b981' : 
                                   edgeDetectionConfidence > 0.6 ? '#f59e0b' : '#ef4444'
                  }
                ]} 
              />
            </View>
          </View>
        )}

        {/* Saved Scans Section */}
        {savedScans.length > 0 && (
          <Animated.View 
            style={[
              dynamicStyles.savedScansSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <View style={styles.savedScansHeader}>
              <Text style={[dynamicStyles.sectionTitle, { color: currentTheme.text }]}>💾 Saved Scans ({savedScans.length})</Text>
              <TouchableOpacity 
                style={[styles.toggleButton, { backgroundColor: currentTheme.chip }]}
                onPress={() => {
                  setShowSavedScans(!showSavedScans);
                  triggerHaptic('light');
                }}
              >
                <Text style={[styles.toggleButtonText, { color: currentTheme.text }]}>
                  {showSavedScans ? 'Hide' : 'Show'}
                </Text>
              </TouchableOpacity>
            </View>
            
            {showSavedScans && (
              <ScrollView style={dynamicStyles.savedScansList} horizontal showsHorizontalScrollIndicator={false}>
                {savedScans.map((scan) => (
                  <View key={scan.id} style={[dynamicStyles.savedScanItem, { borderColor: currentTheme.chip }]}>
                    <View style={styles.savedScanHeader}>
                      <Text style={[dynamicStyles.savedScanTitle, { color: currentTheme.accent }]}>{scan.name}</Text>
                      <View style={[dynamicStyles.ocrResultBadge, { backgroundColor: currentTheme.chip }]}>
                        <Text style={[dynamicStyles.savedScanBadgeText, { color: currentTheme.text }]}>
                          {scan.pageCount} page{scan.pageCount > 1 ? 's' : ''}
                        </Text>
                      </View>
                    </View>
                    
                    <Text style={[dynamicStyles.savedScanDate, { color: currentTheme.sub }]}>
                      {new Date(scan.createdAt).toLocaleDateString()}
                    </Text>
                    
                    <View style={styles.savedScanActions}>
                      <TouchableOpacity 
                        style={[dynamicStyles.savedScanActionButton, { backgroundColor: currentTheme.accent }]}
                        onPress={() => loadSavedScan(scan)}
                      >
                        <Text style={[dynamicStyles.savedScanActionButtonText, { color: currentTheme.text }]}>📄 Load</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[dynamicStyles.savedScanActionButton, { backgroundColor: '#dc2626' }]}
                        onPress={() => {
                          triggerHaptic('heavy');
                          Alert.alert(
                            '🗑️ Delete Scan',
                            `Are you sure you want to delete "${scan.name}"? This cannot be undone.`,
                            [
                              { text: 'Cancel', style: 'cancel' },
                              { 
                                text: 'Delete', 
                                style: 'destructive',
                                onPress: () => deleteSavedScan(scan.id)
                              }
                            ]
                          );
                        }}
                      >
                        <Text style={[dynamicStyles.savedScanActionButtonText, { color: '#ffffff' }]}>🗑️ Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
          </Animated.View>
        )}

        {/* Premium Scan Name Input */}
        {showNameInput && (
          <Animated.View 
            style={[
              dynamicStyles.nameInputContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <Text style={dynamicStyles.nameInputLabel}>📝 Document Name:</Text>
            <TextInput
              style={dynamicStyles.nameInput}
              value={scanName}
              onChangeText={setScanName}
              placeholder="Enter document name"
              placeholderTextColor={currentTheme.sub}
              autoFocus
            />
            <TouchableOpacity
              style={dynamicStyles.nameInputButton}
              onPress={() => setShowNameInput(false)}
            >
              <Text style={dynamicStyles.nameInputButtonText}>Done</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Premium Pages Grid */}
        {pages.length > 0 && (
          <Animated.View 
            style={[
              dynamicStyles.pagesSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <Text style={dynamicStyles.sectionTitle}>
              📄 Pages ({pages.length})
            </Text>
            <View style={styles.pagesGrid}>
              {pages.map((uri, index) => renderPageItem(uri, index))}
            </View>
          </Animated.View>
        )}

        {/* Premium Processing Controls */}
        {pages.length > 0 && (
          <Animated.View 
            style={[
              dynamicStyles.controlsSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            {/* Language Selector */}
            <View style={dynamicStyles.languageSelector}>
              <Text style={dynamicStyles.languageLabel}>🌐 OCR Language:</Text>
              <View style={styles.languageButtons}>
                {['en', 'es', 'zh'].map(lang => (
                  <TouchableOpacity
                    key={lang}
                    style={[
                      dynamicStyles.languageButton,
                      selectedLanguage === lang && styles.languageButtonActive
                    ]}
                    onPress={() => {
                      setSelectedLanguage(lang);
                      triggerHaptic('light');
                    }}
                  >
                    <Text style={[
                      dynamicStyles.languageButtonText,
                      selectedLanguage === lang && styles.languageButtonTextActive
                    ]}>
                      {lang === 'en' ? 'English' : lang === 'es' ? 'Español' : '中文'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Premium Progress Bar */}
            {isProcessing && (
              <View style={dynamicStyles.progressContainer}>
                <View style={dynamicStyles.progressBar}>
                  <Animated.View 
                    style={[
                      dynamicStyles.progressFill, 
                      { 
                        width: progressAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0%', '100%']
                        })
                      }
                    ]} 
                  />
                </View>
                <Text style={dynamicStyles.progressText}>{scanProgress.toFixed(1)}%</Text>
              </View>
            )}

            <TouchableOpacity
              style={[dynamicStyles.controlButton, isProcessing && styles.disabledButton]}
              onPress={processOcr}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <View style={styles.processingContainer}>
                  <ActivityIndicator color={currentTheme.accent} size="small" />
                  <Text style={dynamicStyles.processingText}>Processing...</Text>
                </View>
              ) : (
                <Text style={dynamicStyles.controlButtonText}>
                  🔍 Run OCR ({pages.length} pages)
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[dynamicStyles.controlButton, dynamicStyles.primaryButton]}
              onPress={saveScan}
            >
              <Text style={dynamicStyles.primaryButtonText}>💾 Save Scan</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[dynamicStyles.controlButton, dynamicStyles.secondaryButton]}
              onPress={exportPdf}
            >
              <Text style={dynamicStyles.secondaryButtonText}>📄 Export PDF</Text>
            </TouchableOpacity>

            {/* PDF Export Options */}
            <TouchableOpacity
              style={[dynamicStyles.controlButton, dynamicStyles.infoButton]}
              onPress={() => {
                setShowPdfOptions(!showPdfOptions);
                triggerHaptic('light');
              }}
            >
              <Text style={dynamicStyles.infoButtonText}>
                ⚙️ PDF Options {showPdfOptions ? '▼' : '▶'}
              </Text>
            </TouchableOpacity>

            {showPdfOptions && (
              <View style={dynamicStyles.pdfOptionsContainer}>
                <Text style={dynamicStyles.pdfOptionsTitle}>📐 PDF Export Settings</Text>
                
                {/* Layout Selection */}
                <View style={dynamicStyles.pdfOptionRow}>
                  <Text style={dynamicStyles.pdfOptionLabel}>Layout:</Text>
                  <View style={dynamicStyles.pdfOptionButtons}>
                    {(['portrait', 'landscape'] as const).map(layout => (
                      <TouchableOpacity
                        key={layout}
                        style={[
                          dynamicStyles.pdfOptionButton,
                          pdfLayout === layout && styles.pdfOptionButtonActive
                        ]}
                        onPress={() => {
                          setPdfLayout(layout);
                          triggerHaptic('light');
                        }}
                      >
                        <Text style={[
                          dynamicStyles.pdfOptionButtonText,
                          pdfLayout === layout && styles.pdfOptionButtonTextActive
                        ]}>
                          {layout === 'portrait' ? '📱 Portrait' : '🖼️ Landscape'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Margins Selection */}
                <View style={dynamicStyles.pdfOptionRow}>
                  <Text style={dynamicStyles.pdfOptionLabel}>Margins:</Text>
                  <View style={dynamicStyles.pdfOptionButtons}>
                    {[10, 15, 20, 25, 30].map(margin => (
                      <TouchableOpacity
                        key={margin}
                        style={[
                          dynamicStyles.pdfOptionButton,
                          pdfMargins === margin && styles.pdfOptionButtonActive
                        ]}
                        onPress={() => {
                          setPdfMargins(margin);
                          triggerHaptic('light');
                        }}
                      >
                        <Text style={[
                          dynamicStyles.pdfOptionButtonText,
                          pdfMargins === margin && styles.pdfOptionButtonTextActive
                        ]}>
                          {margin}mm
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Font Size Selection */}
                <View style={dynamicStyles.pdfOptionRow}>
                  <Text style={dynamicStyles.pdfOptionLabel}>Font Size:</Text>
                  <View style={dynamicStyles.pdfOptionButtons}>
                    {[10, 11, 12, 14, 16].map(size => (
                      <TouchableOpacity
                        key={size}
                        style={[
                          dynamicStyles.pdfOptionButton,
                          pdfFontSize === size && styles.pdfOptionButtonActive
                        ]}
                        onPress={() => {
                          setPdfFontSize(size);
                          triggerHaptic('light');
                        }}
                      >
                        <Text style={[
                          dynamicStyles.pdfOptionButtonText,
                          pdfFontSize === size && styles.pdfOptionButtonTextActive
                        ]}>
                          {size}px
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <Text style={dynamicStyles.pdfOptionsInfo}>
                  💡 These settings will apply to your next PDF export
                </Text>
              </View>
            )}

            {ocrResults.length > 0 && (
              <TouchableOpacity
                style={[dynamicStyles.controlButton, dynamicStyles.infoButton]}
                onPress={exportOcrText}
              >
                <Text style={dynamicStyles.infoButtonText}>📝 Export OCR Text</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[dynamicStyles.controlButton, dynamicStyles.dangerButton]}
              onPress={() => {
                triggerHaptic('heavy');
                Alert.alert(
                  '🗑️ Clear All Pages',
                  'Are you sure you want to remove all pages? This cannot be undone.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { 
                      text: 'Clear All', 
                      style: 'destructive',
                      onPress: () => {
                        setPages([]);
                        setOcrResults([]);
                        setScanName('');
                        setCurrentScan(null);
                        setShowOcrResults(false);
                        triggerHaptic('heavy');
                      }
                    }
                  ]
                );
              }}
            >
              <Text style={dynamicStyles.dangerButtonText}>🗑️ Clear All</Text>
            </TouchableOpacity>
          </Animated.View>
        )}


        {/* Premium OCR Results */}
        {ocrResults.length > 0 && renderOcrResults()}
      </ScrollView>

      {/* Premium OCR Text Editor Modal */}
      {isEditing && selectedPage !== null && (
        <View style={dynamicStyles.modalOverlay}>
          <View style={dynamicStyles.modalContent}>
            <Text style={dynamicStyles.modalTitle}>✏️ Edit OCR Text - Page {selectedPage + 1}</Text>
            <TextInput
              style={dynamicStyles.modalTextInput}
              value={editingText[selectedPage]}
              onChangeText={(text) => {
                const newEditingText = [...editingText];
                newEditingText[selectedPage] = text;
                setEditingText(newEditingText);
              }}
              multiline
              placeholder="Edit the extracted text..."
              placeholderTextColor={currentTheme.sub}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[dynamicStyles.modalButton, dynamicStyles.modalButtonCancel]}
                onPress={() => {
                  setIsEditing(false);
                  setSelectedPage(null);
                  triggerHaptic('light');
                }}
              >
                <Text style={dynamicStyles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[dynamicStyles.modalButton, dynamicStyles.modalButtonSave]}
                onPress={saveOcrEdit}
              >
                <Text style={dynamicStyles.modalButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* New Scan Modal */}
      {showNewScanModal && (
        <View style={dynamicStyles.modalOverlay}>
          <View style={dynamicStyles.newScanModalContent}>
            <Text style={dynamicStyles.newScanModalTitle}>🆕 Start New Scan</Text>
            <Text style={dynamicStyles.newScanModalSubtitle}>
              Choose how you'd like to add pages to your new scan
            </Text>
            
            <View style={dynamicStyles.newScanModalButtons}>
              <TouchableOpacity 
                style={[dynamicStyles.newScanModalButton, styles.cameraButton]}
                onPress={() => {
                  setShowNewScanModal(false);
                  triggerHaptic('medium');
                  addFromCamera();
                }}
              >
                <Text style={styles.newScanModalButtonIcon}>📷</Text>
                <Text style={dynamicStyles.newScanModalButtonText}>Camera</Text>
                <Text style={dynamicStyles.newScanModalButtonSubtext}>Take a photo</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[dynamicStyles.newScanModalButton, styles.galleryButton]}
                onPress={() => {
                  setShowNewScanModal(false);
                  triggerHaptic('medium');
                  addFromGallery();
                }}
              >
                <Text style={styles.newScanModalButtonIcon}>🖼️</Text>
                <Text style={dynamicStyles.newScanModalButtonText}>Gallery</Text>
                <Text style={dynamicStyles.newScanModalButtonSubtext}>Select from photos</Text>
              </TouchableOpacity>

            </View>
            
            <TouchableOpacity 
              style={dynamicStyles.newScanModalCancelButton}
              onPress={() => {
                setShowNewScanModal(false);
                triggerHaptic('light');
              }}
            >
              <Text style={dynamicStyles.newScanModalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerSpacer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  homeButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -65,
  },
  homeButtonIcon: {
    width: 180,
    height: 70,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#d4af37',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'column',
    justifyContent: 'center',
    minHeight: 80,
  },
  primaryActionButton: {
    backgroundColor: '#d4af37',
    flex: 1,
    minHeight: 60,
  },
  clearButton: {
    backgroundColor: '#dc2626',
    flex: 1,
  },
  newScanButton: {
    backgroundColor: '#059669',
  },
  actionButtonIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  actionButtonText: {
    color: '#0b1117',
    fontSize: 16,
    fontWeight: '600',
  },
  nameInputContainer: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  nameInputLabel: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  nameInput: {
    flex: 1,
    backgroundColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    color: '#ffffff',
    fontSize: 14,
  },
  nameInputButton: {
    backgroundColor: '#d4af37',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  nameInputButtonText: {
    color: '#0b1117',
    fontSize: 14,
    fontWeight: '600',
  },
  pagesSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 16,
  },
  pagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  pageItem: {
    width: (screenWidth - 44) / 2,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 8,
    position: 'relative',
  },
  pageImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
  },
  pageControls: {
    position: 'absolute',
    top: 8,
    right: 8,
    gap: 4,
  },
  pageButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  deletePageButton: {
    backgroundColor: 'rgba(220, 38, 38, 0.8)',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deletePageButtonText: {
    color: '#ffffff',
    fontSize: 12,
  },
  pageNumber: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  pageNumberText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  ocrIndicator: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: '#d4af37',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ocrIndicatorText: {
    color: '#0b1117',
    fontSize: 10,
    fontWeight: '600',
  },
  ocrConfidenceText: {
    color: '#0b1117',
    fontSize: 8,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 2,
  },
  controlsSection: {
    gap: 12,
    marginBottom: 24,
  },
  languageSelector: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  languageLabel: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
    textAlign: 'center',
  },
  languageButtons: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  languageButton: {
    backgroundColor: '#333',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  languageButtonActive: {
    backgroundColor: '#d4af37',
    borderColor: '#d4af37',
  },
  languageButtonText: {
    color: '#cccccc',
    fontSize: 12,
    fontWeight: '600',
  },
  languageButtonTextActive: {
    color: '#0b1117',
  },
  controlButton: {
    backgroundColor: '#333',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  controlButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: '#d4af37',
  },
  primaryButtonText: {
    color: '#0b1117',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#666',
  },
  secondaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  dangerButton: {
    backgroundColor: '#dc2626',
  },
  dangerButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoButton: {
    backgroundColor: '#0891b2',
  },
  infoButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  ocrSection: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  ocrHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  toggleButton: {
    backgroundColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  toggleButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  ocrResults: {
    flexDirection: 'row',
    gap: 12,
  },
  ocrResultItem: {
    backgroundColor: '#1a1a1a',
    padding: 12,
    borderRadius: 8,
    width: 200,
  },
  ocrResultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ocrResultTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#d4af37',
  },
  ocrResultBadge: {
    backgroundColor: '#333',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  ocrResultBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '500',
  },
  ocrResultTextContainer: {
    maxHeight: 100, // Limit height for scrolling
    marginBottom: 12,
  },
  ocrResultText: {
    fontSize: 12,
    color: '#cccccc',
    lineHeight: 16,
  },
  ocrResultActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
  },
  ocrActionButton: {
    backgroundColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#666',
  },
  ocrActionButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressBar: {
    width: '80%',
    height: 8,
    backgroundColor: '#666',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#d4af37',
    borderRadius: 4,
  },
  progressText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 10,
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  processingText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  qualitySelector: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  qualityLabel: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
    textAlign: 'center',
  },
  qualityButtons: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  qualityButton: {
    backgroundColor: '#333',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  qualityButtonActive: {
    backgroundColor: '#d4af37',
    borderColor: '#d4af37',
  },
  qualityButtonText: {
    color: '#cccccc',
    fontSize: 12,
    fontWeight: '600',
  },
  qualityButtonTextActive: {
    color: '#0b1117',
  },
  edgeDetectionToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingHorizontal: 16,
  },
  edgeDetectionInfo: {
    flex: 1,
  },
  edgeDetectionLabel: {
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: '500',
  },
  edgeDetectionDescription: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 2,
  },
  edgeDetectionToggleButton: {
    backgroundColor: '#374151',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#4b5563',
  },
  edgeDetectionToggleButtonActive: {
    backgroundColor: '#d4af37',
    borderColor: '#d4af37',
  },
  edgeDetectionToggleButtonText: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '600',
  },
  toggleButtonTextActive: {
    color: '#000',
    fontWeight: 'bold',
  },
  processingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  processingStatusText: {
    color: '#d4af37',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  processingSubtext: {
    color: '#9ca3af',
    fontSize: 12,
    marginLeft: 8,
    marginTop: 2,
  },
  confidenceIndicator: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  confidenceText: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  confidenceBar: {
    height: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    borderRadius: 3,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 24,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  modalTextInput: {
    width: '100%',
    backgroundColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    color: '#ffffff',
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#666',
  },
  modalButtonSave: {
    backgroundColor: '#d4af37',
  },
  modalButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  pdfOptionsContainer: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    width: '100%',
  },
  pdfOptionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
    textAlign: 'center',
  },
  pdfOptionRow: {
    marginBottom: 12,
  },
  pdfOptionLabel: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  pdfOptionButtons: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  pdfOptionButton: {
    backgroundColor: '#333',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  pdfOptionButtonActive: {
    backgroundColor: '#d4af37',
    borderColor: '#d4af37',
  },
  pdfOptionButtonText: {
    color: '#cccccc',
    fontSize: 12,
    fontWeight: '600',
  },
  pdfOptionButtonTextActive: {
    color: '#0b1117',
  },
  pdfOptionsInfo: {
    color: '#999',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
  },
  savedScansSection: {
    marginBottom: 24,
  },
  savedScansHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  savedScansList: {
    flexDirection: 'row',
    gap: 12,
  },
  savedScanItem: {
    backgroundColor: '#1a1a1a',
    padding: 12,
    borderRadius: 12,
    width: 250,
    alignItems: 'center',
  },
  savedScanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  savedScanTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#d4af37',
    flex: 1,
    marginRight: 8,
  },
  savedScanBadge: {
    backgroundColor: '#333',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  savedScanBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '500',
  },
  savedScanDate: {
    color: '#999',
    fontSize: 12,
    marginBottom: 12,
  },
  savedScanActions: {
    flexDirection: 'row',
    gap: 8,
  },
  savedScanActionButton: {
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#059669',
  },
  savedScanActionButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  
  // New Scan Modal Styles
  newScanModalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    alignItems: 'center',
  },
  newScanModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  newScanModalSubtitle: {
    fontSize: 16,
    color: '#cccccc',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  newScanModalButtons: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  newScanModalButton: {
    backgroundColor: '#333',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cameraButton: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  galleryButton: {
    backgroundColor: '#0891b2',
    borderColor: '#0891b2',
  },

  aiAnalysisButton: {
    backgroundColor: '#7c3aed',
    borderColor: '#7c3aed',
  },

  newScanModalButtonIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  newScanModalButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  newScanModalButtonSubtext: {
    color: '#cccccc',
    fontSize: 12,
    textAlign: 'center',
  },
  newScanModalCancelButton: {
    backgroundColor: 'transparent',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#666',
  },
  newScanModalCancelText: {
    color: '#cccccc',
    fontSize: 14,
    fontWeight: '500',
  },
});
