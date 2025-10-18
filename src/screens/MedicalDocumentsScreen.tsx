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
  Modal,
  Linking,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { SecureSharing } from '../lib/SecureSharing';
import DynamicText from '../components/DynamicText';
import PDFViewer from '../components/PDFViewer';
// Removed AppointmentService import - no longer using doctor contacts
import { useWallpaper } from '../contexts/WallpaperContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface MedicalDocumentsScreenProps {
  onClose: () => void;
  theme?: any;
  S?: any;
}

type DocumentCategory = 'photo_id' | 'birth_certificate' | 'insurance' | 'lab_results' | 'prescriptions' | 'medical_records' | 'other';

interface DocumentItem {
  id: string;
  name: string;
  uri: string;
  type: 'front' | 'back' | 'single';
  category: DocumentCategory;
  createdAt: string;
  size?: number;
}

// This will be defined inside the component to access translations

export default function MedicalDocumentsScreen({ onClose, theme, S }: MedicalDocumentsScreenProps) {
  const { getCardBackgroundColor, getCardBorderColor, getCardTextColor } = useWallpaper();
  
  // Use S object for translations, fallback to key if not available
  const t = (key: string) => S?.[key] || key;
  
  // Check if expo-print is available (diagnostic)
  useEffect(() => {
    console.log('📄 PDF Module Check:', {
      printAvailable: !!Print,
      printToFileAsync: !!Print?.printToFileAsync,
      webViewAvailable: !!WebView,
      fileSystemAvailable: !!FileSystem,
    });
    
    if (!Print || !Print.printToFileAsync) {
      console.error('❌ expo-print is not available! PDF features will not work.');
      console.error('❌ This usually means you need a development build with expo-print included.');
    } else {
      console.log('✅ expo-print is available and ready');
    }
  }, []);
  
  const DOCUMENT_CATEGORIES = {
    photo_id: {
      title: t('photoID'),
      icon: '',
      description: t('driversLicensePassport'),
      supportsDualSides: true,
      frontLabel: t('frontSide'),
      backLabel: t('backSide')
    },
    birth_certificate: {
      title: t('birthCertificate'),
      icon: '',
      description: t('officialBirthCertificate'),
      supportsDualSides: false
    },
    insurance: {
      title: t('insuranceCard'),
      icon: '',
      description: t('healthInsuranceInfo'),
      supportsDualSides: true,
      frontLabel: t('frontOfCard'),
      backLabel: t('backOfCard')
    },
    lab_results: {
      title: t('labResults'),
      icon: '',
      description: t('bloodTestsLabWork'),
      supportsDualSides: false
    },
    prescriptions: {
      title: t('prescriptions'),
      icon: '',
      description: t('currentAndPastPrescriptions'),
      supportsDualSides: false
    },
    medical_records: {
      title: t('medicalRecords'),
      icon: '',
      description: t('medicalHistoryReports'),
      supportsDualSides: false
    },
    other: {
      title: t('otherDocuments'),
      icon: '',
      description: t('anyOtherMedicalDocuments'),
      supportsDualSides: false
    }
  };
  
  // Default theme if not provided
  const defaultTheme = {
    card: '#ffffff',
    text: '#2c2c2c',
    sub: '#6b6b6b',
    accent: '#d4af37',
    chip: '#e8e3d8',
    bgStart: '#faf8f5',
    bgEnd: '#f5f2ed',
  };
  
  const currentTheme = theme || defaultTheme;
  
  // Generate dynamic styles based on theme
  const getDynamicStyles = () => StyleSheet.create({
    categoryCard: {
      backgroundColor: getCardBackgroundColor() + 'CC',
      padding: 10,
      borderRadius: 8,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: getCardBorderColor(),
    },
    categoryHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    categoryIcon: {
      fontSize: 18,
      marginRight: 8,
    },
    categoryTitle: {
      fontSize: 13,
      fontWeight: '600',
      flex: 1,
    },
    categoryTitleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    categoryDescription: {
      fontSize: 10,
      marginBottom: 6,
      opacity: 0.8,
    },
    documentItem: {
      backgroundColor: getCardBackgroundColor() + '80',
      padding: 8,
      borderRadius: 6,
      marginBottom: 6,
      flexDirection: 'row',
      alignItems: 'center',
      borderColor: getCardBorderColor(),
      borderWidth: 1,
    },
    documentImage: {
      width: 28,
      height: 28,
      borderRadius: 4,
      marginRight: 8,
    },
    documentInfo: {
      flex: 1,
    },
    documentName: {
      fontSize: 10,
      fontWeight: '500',
    },
    documentType: {
      fontSize: 8,
      opacity: 0.7,
    },
    fileExtensionLabel: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      marginLeft: 8,
    },
    fileExtensionText: {
      color: 'white',
      fontSize: 10,
      fontWeight: 'bold',
    },
    actionButton: {
      backgroundColor: currentTheme.accent + 'CC',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
      marginLeft: 6,
    },
    actionButtonText: {
      fontSize: 10,
      fontWeight: '600',
    },
    scanButton: {
      backgroundColor: currentTheme.accent + 'CC',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 5,
      flexDirection: 'row',
      alignItems: 'center',
    },
    scanButtonText: {
      fontSize: 11,
      fontWeight: '600',
      marginLeft: 5,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 6,
    },
    emptyStateText: {
      fontSize: 11,
      textAlign: 'center',
      opacity: 0.6,
    },
    modalContainer: {
      flex: 1,
      backgroundColor: 'transparent',
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
      backgroundColor: getCardBackgroundColor() + 'F0',
      borderRadius: 12,
      padding: 24,
      width: '85%',
      alignItems: 'center',
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 16,
    },
    modalButton: {
      backgroundColor: currentTheme.accent + 'CC',
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 8,
      alignItems: 'center',
      marginBottom: 12,
      width: '100%',
    },
    modalButtonText: {
      fontSize: 16,
      fontWeight: '600',
    },
    modalCancelButton: {
      backgroundColor: 'transparent',
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 8,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: getCardBorderColor(),
    },
    modalCancelButtonText: {
      fontSize: 16,
      fontWeight: '500',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
      paddingBottom: 12,
      paddingHorizontal: 20,
      paddingTop: 10,
      borderBottomWidth: 1,
      borderBottomColor: getCardBorderColor(),
    },
    closeModalButton: {
      padding: 8,
      borderRadius: 20,
      backgroundColor: getCardBackgroundColor() + '80',
    },
    closeModalButtonText: {
      fontSize: 18,
      fontWeight: 'bold',
    },
    documentViewer: {
      flex: 1,
      marginBottom: 16,
    },
    documentViewerContent: {
      flexGrow: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    fullSizeImage: {
      width: '100%',
      height: '100%',
      minHeight: 400,
    },
    pdfViewer: {
      alignItems: 'center',
      padding: 20,
    },
    imageViewer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 200,
    },
    loadingText: {
      fontSize: 16,
      color: '#6B7280',
      textAlign: 'center',
    },
    pdfMessage: {
      fontSize: 24,
      marginBottom: 16,
    },
    pdfInfo: {
      fontSize: 16,
      marginBottom: 8,
      textAlign: 'center',
    },
    modalActions: {
      flexDirection: 'row',
      marginTop: 16,
    },
    // Sharing Modal Styles
    sharingModal: {
      backgroundColor: getCardBackgroundColor() + 'F0',
      borderRadius: 16,
      padding: 24,
      width: '90%',
      maxWidth: 400,
      alignItems: 'center',
    },
    closeButton: {
      padding: 8,
      borderRadius: 20,
      backgroundColor: getCardBackgroundColor() + '80',
    },
    closeButtonText: {
      fontSize: 18,
      fontWeight: 'bold',
    },
    modalSubtitle: {
      fontSize: 14,
      textAlign: 'center',
      marginBottom: 24,
      opacity: 0.8,
    },
    sharingOptions: {
      width: '100%',
      gap: 12,
    },
    sharingOption: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderRadius: 12,
      marginBottom: 8,
    },
    sharingOptionIcon: {
      fontSize: 24,
      marginRight: 16,
    },
    sharingOptionText: {
      flex: 1,
    },
    sharingOptionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: 'white',
      marginBottom: 4,
    },
    sharingOptionSubtitle: {
      fontSize: 12,
      color: 'white',
      opacity: 0.8,
    },
    // Dual ID Viewer Styles
    dualIDContainer: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    dualIDScrollView: {
      flex: 1,
      padding: 20,
      paddingBottom: 20,
    },
    idSideContainer: {
      marginBottom: 15,
    },
    idSideLabel: {
      fontSize: 18,
      fontWeight: '600',
      color: getCardTextColor(),
      marginBottom: 15,
      textAlign: 'center',
    },
    idImageContainer: {
      backgroundColor: getCardBackgroundColor(),
      borderRadius: 12,
      padding: 8,
      minHeight: 250,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: getCardBorderColor(),
      marginBottom: 15,
    },
    idImage: {
      width: '100%',
      height: 250,
      borderRadius: 8,
      backgroundColor: 'transparent',
    },
    emptyIDContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    emptyIDText: {
      fontSize: 16,
      color: getCardTextColor(),
      opacity: 0.6,
      textAlign: 'center',
    },
    dualIDActions: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 8,
      paddingBottom: 15,
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderTopWidth: 1,
      borderTopColor: '#E5E7EB',
    },
    // Checkbox styles
    checkbox: {
      position: 'absolute',
      top: 8,
      left: 8,
      zIndex: 10,
      width: 24,
      height: 24,
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#d1d5db',
    },
    checkboxText: {
      fontSize: 16,
    },
  });
  
  const dynamicStyles = getDynamicStyles();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showPDFViewer, setShowPDFViewer] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<DocumentItem | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageDataUri, setImageDataUri] = useState<string | null>(null);
  const [backImageDataUri, setBackImageDataUri] = useState<string | null>(null);
  const [showDualIDViewer, setShowDualIDViewer] = useState(false);
  const [idPair, setIDPair] = useState<{ front: DocumentItem | null, back: DocumentItem | null }>({ front: null, back: null });
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());
  const imageTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  
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

  // Removed loadDoctorContacts function - no longer using doctor contacts

  useEffect(() => {
    loadDocuments();
    
    // Entrance animation
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
    ]).start();
  }, []);

  const loadDocuments = async () => {
    try {
      // Load documents from storage
      const documentsData = await FileSystem.readAsStringAsync(
        `${FileSystem.documentDirectory}medical_documents.json`
      );
      setDocuments(JSON.parse(documentsData));
    } catch (error) {
      // File doesn't exist yet, start with empty array
      setDocuments([]);
    }
  };

  const saveDocuments = async (newDocuments: DocumentItem[]) => {
    try {
      await FileSystem.writeAsStringAsync(
        `${FileSystem.documentDirectory}medical_documents.json`,
        JSON.stringify(newDocuments)
      );
      setDocuments(newDocuments);
    } catch (error) {
      console.error('Failed to save documents:', error);
    }
  };

  const requestPermissions = async (): Promise<boolean> => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          '📱 ' + t('permissionRequired'),
          t('grantCameraRollAccess'),
          [{ text: t('ok') }]
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  };

  const uploadDocument = async (category: DocumentCategory, type: 'front' | 'back' | 'single' = 'single') => {
    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) return;

      triggerHaptic('light');

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, // Only allow images, not PDFs
        allowsMultipleSelection: false,
        quality: 0.8,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        
        // Verify it's an image file (not PDF)
        const isImage = asset.mimeType?.startsWith('image/') || 
                       asset.uri.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/);
        
        if (!isImage) {
          Alert.alert('❌ ' + t('error'), t('pleaseUseUploadPDF'));
          return;
        }
        
        const newDocument: DocumentItem = {
          id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: `${DOCUMENT_CATEGORIES[category].title} - ${type === 'single' ? t('document') : type === 'front' ? DOCUMENT_CATEGORIES[category].frontLabel : DOCUMENT_CATEGORIES[category].backLabel}`,
          uri: asset.uri,
          type,
          category,
          createdAt: new Date().toISOString(),
          size: asset.fileSize,
        };

        const updatedDocuments = [...documents, newDocument];
        await saveDocuments(updatedDocuments);
        
        triggerHaptic('medium');
        Alert.alert('✅ ' + t('success'), t('documentUploadedSuccessfully'));
      }
    } catch (error) {
      console.error('Failed to upload document:', error);
      Alert.alert('❌ ' + t('error'), t('failedToUploadDocument'));
    }
  };

  const uploadPDF = async (category: DocumentCategory, type: 'front' | 'back' | 'single' = 'single') => {
    try {
      triggerHaptic('light');

      // Use document picker specifically for PDF files
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        
        // Verify it's a PDF file
        const isPDF = asset.mimeType === 'application/pdf' || 
                     asset.name?.toLowerCase().endsWith('.pdf');
        
                  if (isPDF) {
          // For PDFs, copy to a more accessible location with proper .pdf extension
          const originalName = asset.name || 'document.pdf';
          const fileName = `${Date.now()}_${originalName}`;
                    const newUri = `${FileSystem.documentDirectory}${fileName}`;
                    
                    try {
            // Copy the PDF to our document directory (preserving binary format)
                      await FileSystem.copyAsync({
                        from: asset.uri,
                        to: newUri
                      });
                      
                      console.log('PDF copied to:', newUri);
            
            // Verify the copied file is still a valid PDF
            const fileInfo = await FileSystem.getInfoAsync(newUri);
            if (!fileInfo.exists || fileInfo.size === 0) {
              throw new Error(t('pdfCorrupted'));
            }
                      
                      const newDocument: DocumentItem = {
                        id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        name: `${DOCUMENT_CATEGORIES[category].title} - ${type === 'single' ? t('pdfDocument') : type === 'front' ? DOCUMENT_CATEGORIES[category].frontLabel : DOCUMENT_CATEGORIES[category].backLabel}`,
                        uri: newUri,
                        type,
                        category,
                        createdAt: new Date().toISOString(),
                        size: asset.size,
                      };

                      const updatedDocuments = [...documents, newDocument];
                      await saveDocuments(updatedDocuments);
                      
                      triggerHaptic('medium');
                      Alert.alert('✅ ' + t('success'), t('uploadSuccess'));
                    } catch (copyError) {
                      console.error('Failed to copy PDF:', copyError);
                      Alert.alert('❌ ' + t('error'), t('failedToSavePDF'));
                    }
        } else {
          Alert.alert('❌ ' + t('error'), 'Please select a PDF file. The selected file is not a PDF document.');
        }
      }
    } catch (error) {
      console.error('Failed to upload PDF:', error);
      Alert.alert('❌ ' + t('error'), t('failedToUploadPDF'));
    }
  };

  const takePhoto = async (category: DocumentCategory, type: 'front' | 'back' | 'single' = 'single') => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          '📷 ' + t('permissionRequired'),
          t('grantCameraAccess'),
          [{ text: t('ok') }]
        );
        return;
      }

      triggerHaptic('light');

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const newDocument: DocumentItem = {
          id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: `${DOCUMENT_CATEGORIES[category].title} - ${type === 'single' ? t('document') : type === 'front' ? DOCUMENT_CATEGORIES[category].frontLabel : DOCUMENT_CATEGORIES[category].backLabel}`,
          uri: asset.uri,
          type,
          category,
          createdAt: new Date().toISOString(),
          size: asset.fileSize,
        };

        const updatedDocuments = [...documents, newDocument];
        await saveDocuments(updatedDocuments);
        
        triggerHaptic('medium');
        Alert.alert('✅ ' + t('success'), t('photoTakenSuccessfully'));
      }
    } catch (error) {
      console.error('Failed to take photo:', error);
      Alert.alert('❌ ' + t('error'), t('failedToTakePhoto'));
    }
  };

  const deleteDocument = async (documentId: string) => {
    triggerHaptic('heavy');
    Alert.alert(
      '🗑️ ' + t('deleteDocument'),
      t('areYouSureDeleteDocument'),
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('delete'), 
          style: 'destructive',
          onPress: async () => {
            const updatedDocuments = documents.filter(doc => doc.id !== documentId);
            await saveDocuments(updatedDocuments);
            triggerHaptic('medium');
          }
        }
      ]
    );
  };

  const shareDocument = async (document: DocumentItem) => {
    try {
      triggerHaptic('light');
      
      console.log('Sharing document:', {
        name: document.name,
        uri: document.uri,
        type: document.type
      });
      
      // Check if it's an ID document that has a pair
      const isIDDocument = document.name.toLowerCase().includes('id') || 
                          document.name.toLowerCase().includes('front') || 
                          document.name.toLowerCase().includes('back');
      
      if (isIDDocument) {
        // Try to find the pair for ID documents
        const pair = findIDPair(document);
        if (pair && pair.front && pair.back) {
          console.log('🔄 Found ID pair, creating PDF for sharing...');
          
          // Use the same PDF generation logic as the Eye view
          try {
            console.log('🔄 Creating PDF with both ID images and AuricRX logo...');
            
            // Convert images to base64 for embedding in PDF
            const frontBase64 = await convertImageToDataUri(pair.front.uri);
            const backBase64 = await convertImageToDataUri(pair.back.uri);
            
            if (!frontBase64 || !backBase64) {
              Alert.alert('❌ ' + t('error'), t('failedToProcessImages'));
              return;
            }

            // Try to load the AuricRX logo using fetch approach
            let logoBase64 = null;
            try {
              console.log('🔄 Loading AuricRX logo...');
              
              // Get the logo URI - using the document logo
              const logoSource = require('../../assets/AuricRX Document Logo.png');
              const logoUri = Image.resolveAssetSource(logoSource).uri;
              console.log('🔄 Logo URI:', logoUri);
              
              // Try using fetch to get the image as blob, then convert to base64
              const response = await fetch(logoUri);
              const blob = await response.blob();
              console.log('🔄 Blob size:', blob.size);
              
              // Convert blob to base64
              const reader = new FileReader();
              logoBase64 = await new Promise((resolve, reject) => {
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
              });
              
              console.log('✅ Logo loaded successfully');
            } catch (logoError) {
              console.log('⚠️ Failed to load logo, proceeding without it:', logoError);
            }

            // Create HTML for PDF with both images side by side
            const html = `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <style>
                  body {
                    margin: 0;
                    padding: 20px;
                    font-family: Arial, sans-serif;
                    background-color: white;
                  }
                  .header {
                    text-align: center;
                    margin-bottom: 30px;
                  }
                  .logo {
                    max-width: 200px;
                    max-height: 80px;
                    margin-bottom: 10px;
                  }
                  .title {
                    font-size: 18px;
                    font-weight: bold;
                    color: #333;
                    margin-bottom: 20px;
                  }
                  .id-container {
                    display: flex;
                    justify-content: space-between;
                    gap: 20px;
                    margin-bottom: 20px;
                  }
                  .id-side {
                    flex: 1;
                    text-align: center;
                  }
                  .id-side h3 {
                    margin: 0 0 10px 0;
                    font-size: 14px;
                    color: #666;
                  }
                  .id-image {
                    width: 100%;
                    max-width: 300px;
                    height: auto;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                  }
                  .footer {
                    text-align: center;
                    margin-top: 30px;
                    font-size: 12px;
                    color: #666;
                  }
                </style>
              </head>
              <body>
                <div class="header">
                  ${logoBase64 ? `<img src="${logoBase64}" class="logo" alt="AuricRX Logo">` : ''}
                  <div class="title">${t('auricrxMedicalID')}</div>
                </div>
                
                <div class="id-container">
                  <div class="id-side">
                    <h3>${t('front')}</h3>
                    <img src="${frontBase64}" class="id-image" alt="${t('idFront')}">
                  </div>
                  <div class="id-side">
                    <h3>${t('back')}</h3>
                    <img src="${backBase64}" class="id-image" alt="${t('idBack')}">
                  </div>
                </div>
                
                <div class="footer">
                  <p>Generated by AuricRX Medical Coach</p>
                  <p>Document created: ${new Date().toLocaleDateString()}</p>
                </div>
              </body>
              </html>
            `;

            console.log('🔄 Generating PDF...');
            
            // Generate PDF using expo-print
            const { uri } = await Print.printToFileAsync({
              html: html,
              base64: false,
            });
            
            console.log('✅ PDF generated successfully:', uri);
            
            // Copy PDF to a more accessible location for sharing
            const shareableUri = `${FileSystem.documentDirectory}ID_Document_${Date.now()}.pdf`;
            await FileSystem.copyAsync({
              from: uri,
              to: shareableUri,
            });
            
            console.log('✅ PDF copied to shareable location:', shareableUri);
            
            // Share the PDF
            console.log('📤 Attempting to share ID PDF from shareDocument:', shareableUri);
            try {
              const isAvailable = await Sharing.isAvailableAsync();
              console.log('📤 Sharing availability check:', isAvailable);
              
              if (isAvailable) {
                await Sharing.shareAsync(shareableUri, {
                  mimeType: 'application/pdf',
                  dialogTitle: `Share AuricRX ID Document: ${pair.front.name}`,
                });
                console.log('✅ ID PDF shared successfully');
              } else {
                console.log('⚠️ Sharing not available, trying direct share anyway...');
                // Try sharing anyway - sometimes the availability check fails in dev builds
                await Sharing.shareAsync(shareableUri, {
                  mimeType: 'application/pdf',
                  dialogTitle: `Share AuricRX ID Document: ${pair.front.name}`,
                });
                console.log('✅ ID PDF shared successfully (fallback)');
              }
            } catch (shareError) {
              console.error('❌ ID PDF sharing failed:', shareError);
              Alert.alert('❌ Error', `Failed to share PDF: ${shareError.message || 'Unknown error'}`);
            }
            
          } catch (pdfError) {
            console.error('❌ Failed to create PDF:', pdfError);
            Alert.alert('❌ Error', 'Failed to create PDF. Sharing original image instead.');
            
            // Fallback to sharing the original image
            console.log('📤 Fallback: sharing original image:', document.uri);
            try {
              const shareableUri = await convertToShareableUri(document.uri);
              const isAvailable = await Sharing.isAvailableAsync();
              console.log('📤 Fallback sharing availability check:', isAvailable);
              
              if (isAvailable) {
                await Sharing.shareAsync(shareableUri, {
                  mimeType: document.mimeType,
                  dialogTitle: `Share ${document.name}`,
                });
                console.log('✅ Fallback sharing successful');
              } else {
                console.log('⚠️ Fallback sharing not available, trying direct share anyway...');
                await Sharing.shareAsync(shareableUri, {
                  mimeType: document.mimeType,
                  dialogTitle: `Share ${document.name}`,
                });
                console.log('✅ Fallback sharing successful (fallback)');
              }
            } catch (fallbackError) {
              console.error('❌ Fallback sharing failed:', fallbackError);
              Alert.alert('❌ Error', `Failed to share document: ${fallbackError.message || 'Unknown error'}`);
            }
          }
        } else {
          console.log('⚠️ Could not find ID pair, using regular sharing...');
          // Fallback to regular sharing
          console.log('📤 Regular sharing for ID document without pair:', document.uri);
          try {
            const shareableUri = await convertToShareableUri(document.uri);
            const isAvailable = await Sharing.isAvailableAsync();
            console.log('📤 Regular sharing availability check:', isAvailable);
            
            if (isAvailable) {
              await Sharing.shareAsync(shareableUri, {
                mimeType: document.mimeType,
                dialogTitle: `Share ${document.name}`,
              });
              console.log('✅ Regular sharing successful');
            } else {
              console.log('⚠️ Regular sharing not available, trying direct share anyway...');
              await Sharing.shareAsync(shareableUri, {
                mimeType: document.mimeType,
                dialogTitle: `Share ${document.name}`,
              });
              console.log('✅ Regular sharing successful (fallback)');
            }
          } catch (regularError) {
            console.error('❌ Regular sharing failed:', regularError);
            Alert.alert('❌ Error', `Failed to share document: ${regularError.message || 'Unknown error'}`);
          }
        }
      } else {
        // For non-ID documents, use regular sharing
        console.log('📤 Regular sharing for non-ID document:', document.uri);
        try {
          const shareableUri = await convertToShareableUri(document.uri);
          const isAvailable = await Sharing.isAvailableAsync();
          console.log('📤 Non-ID sharing availability check:', isAvailable);
          
          if (isAvailable) {
            await Sharing.shareAsync(shareableUri, {
              mimeType: document.mimeType,
              dialogTitle: `Share ${document.name}`,
            });
            console.log('✅ Non-ID sharing successful');
          } else {
            console.log('⚠️ Non-ID sharing not available, trying direct share anyway...');
            await Sharing.shareAsync(shareableUri, {
              mimeType: document.mimeType,
              dialogTitle: `Share ${document.name}`,
            });
            console.log('✅ Non-ID sharing successful (fallback)');
          }
        } catch (nonIdError) {
          console.error('❌ Non-ID sharing failed:', nonIdError);
          Alert.alert('❌ Error', `Failed to share document: ${nonIdError.message || 'Unknown error'}`);
        }
      }
      
    } catch (error) {
      console.error('Failed to share document:', error);
      Alert.alert('❌ ' + t('error'), t('failedToShareDocument'));
    }
  };

  // Removed shareToGmail function - now using direct sharing in shareDocument

  // Removed shareToSpecificDoctorEmail function - no longer using doctor contacts
  const removedFunction1 = async (document: DocumentItem, doctor: any) => {
    try {
      console.log('Sharing to doctor via email:', doctor.name, doctor.email);
      
      // Check if doctor has email
      if (!doctor.email) {
        Alert.alert(
          '📧 No Email Available',
          `${doctor.name} doesn't have an email address. Please add their email in the Appointment Tracker.`,
          [
            {
              text: t('useWhatsApp'),
              onPress: () => shareToSpecificDoctorWhatsApp(document, doctor)
            },
            {
              text: t('cancel'),
              style: 'cancel'
            }
          ]
        );
        return;
      }
      
      // Check if it's an ID document that has a pair
      const isIDDocument = document.name.toLowerCase().includes('id') || 
                          document.name.toLowerCase().includes('front') || 
                          document.name.toLowerCase().includes('back');
      
      if (isIDDocument) {
        // Try to find the pair for ID documents
        const pair = findIDPair(document);
        if (pair && pair.front && pair.back) {
          console.log('🔄 Found ID pair, creating PDF for email...');
          
          // Use the same PDF generation logic as the Eye view
          try {

            console.log('🔄 Creating PDF with both ID images and AuricRX logo...');
            
            // Convert images to base64 for embedding in PDF
            const frontBase64 = await convertImageToDataUri(pair.front.uri);
            const backBase64 = await convertImageToDataUri(pair.back.uri);
            
            if (!frontBase64 || !backBase64) {
              Alert.alert('❌ ' + t('error'), t('failedToProcessImages'));
              return;
            }

            // Try to load the AuricRX logo using fetch approach
            let logoBase64 = null;
            try {
              console.log('🔄 Loading AuricRX logo...');
              
              // Get the logo URI - using the document logo
              const logoSource = require('../../assets/AuricRX Document Logo.png');
              const logoUri = Image.resolveAssetSource(logoSource).uri;
              console.log('🔄 Logo URI:', logoUri);
              
              // Try using fetch to get the image as blob, then convert to base64
              const response = await fetch(logoUri);
              const blob = await response.blob();
              console.log('🔄 Blob size:', blob.size);
              
              // Convert blob to base64
              const reader = new FileReader();
              const base64Promise = new Promise<string>((resolve, reject) => {
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = reject;
              });
              reader.readAsDataURL(blob);
              logoBase64 = await base64Promise;
              console.log('✅ Logo loaded successfully');
            } catch (logoError) {
              console.log('⚠️ Logo loading failed, using text fallback:', logoError);
              logoBase64 = null;
            }

            // Create HTML content for PDF
            const htmlContent = `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <style>
                  body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 20px;
                    background: white;
                    color: #333;
                  }
                  .header {
                    text-align: center;
                    margin-bottom: 30px;
                    padding: 20px 0;
                    border-bottom: 3px solid #C5860A;
                  }
                  .document-title {
                    font-size: 24px;
                    font-weight: bold;
                    color: #C5860A;
                    margin: 20px 0;
                    text-align: center;
                  }
                  .id-label {
                    font-size: 18px;
                    font-weight: bold;
                    color: #333;
                    margin: 20px 0;
                    text-align: center;
                    background: #f8f9fa;
                    padding: 10px;
                    border-radius: 8px;
                    border-left: 4px solid #C5860A;
                  }
                  .single-page-layout {
                    margin: 30px 0;
                    page-break-inside: avoid;
                  }
                  .id-images-container {
                    display: flex;
                    justify-content: space-between;
                    gap: 20px;
                    margin-top: 20px;
                  }
                  .id-image-wrapper {
                    flex: 1;
                    text-align: center;
                  }
                  .id-side-label {
                    font-weight: bold;
                    margin-bottom: 10px;
                    font-size: 16px;
                    color: #333;
                    background: #f8f9fa;
                    padding: 8px;
                    border-radius: 6px;
                    border-left: 3px solid #C5860A;
                  }
                  .id-image-side {
                    max-width: 100%;
                    height: auto;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    border: 2px solid #e9ecef;
                  }
                  .footer {
                    text-align: center;
                    margin-top: 40px;
                    padding-top: 20px;
                    border-top: 2px solid #C5860A;
                    font-size: 12px;
                    color: #666;
                  }
                </style>
              </head>
              <body>
                <div class="header">
                  ${logoBase64 ? `
                    <img src="${logoBase64}" style="max-width: 120px; height: auto; margin: 10px auto; display: block;" alt="AuricRX Logo" />
                  ` : `
                    <div style="text-align: center; margin: 20px 0;">
                      <div style="font-size: 32px; font-weight: 700; color: #333;">
                        AURIC<span style="color: #C5860A;">RX</span>
                      </div>
                      <div style="font-size: 14px; color: #666; margin-top: 5px;">Medical Coach App</div>
                    </div>
                  `}
                </div>
                
                <div class="document-title">
                  📋 Medical ID Document
                </div>
                
                <!-- Single page layout with both IDs side by side -->
                <div class="single-page-layout">
                  <div class="id-label">🆔 Front & Back ID Document</div>
                  <div class="id-images-container">
                    <div class="id-image-wrapper">
                      <div class="id-side-label">Front</div>
                      <img src="${frontBase64}" class="id-image-side" alt="ID Front" />
                    </div>
                    <div class="id-image-wrapper">
                      <div class="id-side-label">Back</div>
                      <img src="${backBase64}" class="id-image-side" alt="ID Back" />
                    </div>
                  </div>
                </div>
                
                <div class="footer">
                  <div style="font-weight: bold; color: #C5860A;">Generated by AuricRX Medical Coach App</div>
                  <div style="margin-top: 5px;">Secure • Professional • Reliable</div>
                  <div style="margin-top: 10px; font-size: 10px;">
                    Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
                  </div>
                </div>
              </body>
              </html>
            `;

            // Generate PDF using expo-print
            console.log('📄 Generating PDF from ID document...');
            const { uri } = await Print.printToFileAsync({
              html: htmlContent,
              base64: false,
              width: 8.5 * 72, // 8.5 inches in points (72 points per inch)
              height: 11 * 72, // 11 inches in points
            });

            console.log('✅ PDF created successfully:', uri);
            
            // Check if the PDF file exists
            const fileInfo = await FileSystem.getInfoAsync(uri);
            console.log('🔍 PDF file exists:', fileInfo.exists);
            
            if (!fileInfo.exists) {
              Alert.alert('❌ ' + t('error'), t('pdfNotCreated'));
              return;
            }
            
            // Share the PDF directly to Gmail using IntentLauncher
            try {
              console.log('📧 Opening Gmail directly with PDF...');
              
              // Copy PDF to a more accessible location
              const gmailUri = `${FileSystem.documentDirectory}ID_Document_${Date.now()}.pdf`;
              await FileSystem.copyAsync({
                from: uri,
                to: gmailUri,
              });
              
        // Use our secure sharing library for Gmail
        const success = await SecureSharing.shareToGmail({
          fileUri: gmailUri,
          fileName: `ID_Document_${Date.now()}.pdf`,
          message: `Hi Dr. ${doctor.name}, please find attached my ID document for your records.`,
          title: `Medical ID Document - Dr. ${doctor.name}`,
          mimeType: 'application/pdf',
        }, doctor);
        
        if (!success) {
          throw new Error(t('secureSharingFailed'));
        }
              
              console.log('✅ ID PDF opened in Gmail successfully');
            } catch (intentError) {
              console.log('⚠️ Intent failed, trying expo-sharing:', intentError);
              
              // Fallback to expo-sharing
              try {
                const isAvailable = await Sharing.isAvailableAsync();
                if (isAvailable) {
                  await Sharing.shareAsync(uri, {
                    mimeType: 'application/pdf',
                    dialogTitle: `Share ID Document with Dr. ${doctor.name}`,
                  });
                  console.log('✅ ID PDF shared successfully with expo-sharing');
                } else {
                  throw new Error(t('sharingNotAvailable'));
                }
              } catch (sharingError) {
                console.log('⚠️ expo-sharing failed, trying Share.share:', sharingError);
                
                // Final fallback to Share.share
                const shareResult = await Share.share({
                  url: uri,
                  title: `ID Document for Dr. ${doctor.name}`,
                  message: `Hi Dr. ${doctor.name}, please find attached my ID document.`,
                });
                
                if (shareResult.action === Share.sharedAction) {
                  console.log('✅ ID PDF shared successfully with Share API');
                }
              }
            }
          } catch (pdfError) {
            console.error('❌ PDF generation failed:', pdfError);
            Alert.alert('❌ Error', 'Failed to create PDF. Using regular sharing instead.');
            
            // Fallback to regular sharing
            await shareRegularDocumentToEmail(document, doctor);
          }
        } else {
          // If we can't find the pair, fall back to regular sharing
          console.log('⚠️ Could not find ID pair, using regular sharing...');
          await shareRegularDocumentToEmail(document, doctor);
        }
      } else {
        // For non-ID documents, use regular sharing
        await shareRegularDocumentToEmail(document, doctor);
      }
      
    } catch (error) {
      console.error('Failed to share to doctor via email:', error);
      Alert.alert('❌ ' + t('error'), t('failedToShareToEmail'));
    }
  };

  const shareToSpecificDoctorWhatsApp = async (document: DocumentItem, doctor: DoctorContact) => {
    try {
      console.log('Sharing to doctor via WhatsApp:', doctor.name, doctor.phoneNumber);
      
      // Check if doctor has phone number
      if (!doctor.phoneNumber) {
        Alert.alert(
          '📱 No Phone Number Available',
          `${doctor.name} doesn't have a phone number. Please add their phone number in the Appointment Tracker.`,
          [
            {
              text: t('useEmail'),
              onPress: () => shareToSpecificDoctorEmail(document, doctor)
            },
            {
              text: t('cancel'),
              style: 'cancel'
            }
          ]
        );
        return;
      }
      
      // Check if it's an ID document that has a pair
      const isIDDocument = document.name.toLowerCase().includes('id') || 
                          document.name.toLowerCase().includes('front') || 
                          document.name.toLowerCase().includes('back');
      
      if (isIDDocument) {
        // Try to find the pair for ID documents
        const pair = findIDPair(document);
        if (pair && pair.front && pair.back) {
          console.log('🔄 Found ID pair, creating PDF for WhatsApp...');
          
          // Use the same PDF generation logic as the Eye view
          try {

            console.log('🔄 Creating PDF with both ID images and AuricRX logo...');
            
            // Convert images to base64 for embedding in PDF
            const frontBase64 = await convertImageToDataUri(pair.front.uri);
            const backBase64 = await convertImageToDataUri(pair.back.uri);
            
            if (!frontBase64 || !backBase64) {
              Alert.alert('❌ ' + t('error'), t('failedToProcessImages'));
              return;
            }

            // Try to load the AuricRX logo using fetch approach
            let logoBase64 = null;
            try {
              console.log('🔄 Loading AuricRX logo...');
              
              // Get the logo URI - using the document logo
              const logoSource = require('../../assets/AuricRX Document Logo.png');
              const logoUri = Image.resolveAssetSource(logoSource).uri;
              console.log('🔄 Logo URI:', logoUri);
              
              // Try using fetch to get the image as blob, then convert to base64
              const response = await fetch(logoUri);
              const blob = await response.blob();
              console.log('🔄 Blob size:', blob.size);
              
              // Convert blob to base64
              const reader = new FileReader();
              const base64Promise = new Promise<string>((resolve, reject) => {
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = reject;
              });
              reader.readAsDataURL(blob);
              logoBase64 = await base64Promise;
              console.log('✅ Logo loaded successfully');
            } catch (logoError) {
              console.log('⚠️ Logo loading failed, using text fallback:', logoError);
              logoBase64 = null;
            }

            // Create HTML content for PDF
            const htmlContent = `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <style>
                  body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 20px;
                    background: white;
                    color: #333;
                  }
                  .header {
                    text-align: center;
                    margin-bottom: 30px;
                    padding: 20px 0;
                    border-bottom: 3px solid #C5860A;
                  }
                  .document-title {
                    font-size: 24px;
                    font-weight: bold;
                    color: #C5860A;
                    margin: 20px 0;
                    text-align: center;
                  }
                  .id-label {
                    font-size: 18px;
                    font-weight: bold;
                    color: #333;
                    margin: 20px 0;
                    text-align: center;
                    background: #f8f9fa;
                    padding: 10px;
                    border-radius: 8px;
                    border-left: 4px solid #C5860A;
                  }
                  .single-page-layout {
                    margin: 30px 0;
                    page-break-inside: avoid;
                  }
                  .id-images-container {
                    display: flex;
                    justify-content: space-between;
                    gap: 20px;
                    margin-top: 20px;
                  }
                  .id-image-wrapper {
                    flex: 1;
                    text-align: center;
                  }
                  .id-side-label {
                    font-weight: bold;
                    margin-bottom: 10px;
                    font-size: 16px;
                    color: #333;
                    background: #f8f9fa;
                    padding: 8px;
                    border-radius: 6px;
                    border-left: 3px solid #C5860A;
                  }
                  .id-image-side {
                    max-width: 100%;
                    height: auto;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    border: 2px solid #e9ecef;
                  }
                  .footer {
                    text-align: center;
                    margin-top: 40px;
                    padding-top: 20px;
                    border-top: 2px solid #C5860A;
                    font-size: 12px;
                    color: #666;
                  }
                </style>
              </head>
              <body>
                <div class="header">
                  ${logoBase64 ? `
                    <img src="${logoBase64}" style="max-width: 120px; height: auto; margin: 10px auto; display: block;" alt="AuricRX Logo" />
                  ` : `
                    <div style="text-align: center; margin: 20px 0;">
                      <div style="font-size: 32px; font-weight: 700; color: #333;">
                        AURIC<span style="color: #C5860A;">RX</span>
                      </div>
                      <div style="font-size: 14px; color: #666; margin-top: 5px;">Medical Coach App</div>
                    </div>
                  `}
                </div>
                
                <div class="document-title">
                  📋 Medical ID Document
                </div>
                
                <!-- Single page layout with both IDs side by side -->
                <div class="single-page-layout">
                  <div class="id-label">🆔 Front & Back ID Document</div>
                  <div class="id-images-container">
                    <div class="id-image-wrapper">
                      <div class="id-side-label">Front</div>
                      <img src="${frontBase64}" class="id-image-side" alt="ID Front" />
                    </div>
                    <div class="id-image-wrapper">
                      <div class="id-side-label">Back</div>
                      <img src="${backBase64}" class="id-image-side" alt="ID Back" />
                    </div>
                  </div>
                </div>
                
                <div class="footer">
                  <div style="font-weight: bold; color: #C5860A;">Generated by AuricRX Medical Coach App</div>
                  <div style="margin-top: 5px;">Secure • Professional • Reliable</div>
                  <div style="margin-top: 10px; font-size: 10px;">
                    Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
                  </div>
                </div>
              </body>
              </html>
            `;

            // Generate PDF using expo-print
            console.log('📄 Generating PDF from ID document...');
            const { uri } = await Print.printToFileAsync({
              html: htmlContent,
              base64: false,
              width: 8.5 * 72, // 8.5 inches in points (72 points per inch)
              height: 11 * 72, // 11 inches in points
            });

            console.log('✅ PDF created successfully:', uri);
            
            // Check if the PDF file exists
            const fileInfo = await FileSystem.getInfoAsync(uri);
            console.log('🔍 PDF file exists:', fileInfo.exists);
            
            if (!fileInfo.exists) {
              Alert.alert('❌ ' + t('error'), t('pdfNotCreated'));
              return;
            }
            
            // Share the PDF directly to WhatsApp using IntentLauncher
            try {
              console.log('📱 Opening WhatsApp directly with PDF...');
              
              // Copy PDF to a more accessible location
              const whatsappUri = `${FileSystem.documentDirectory}ID_Document_${Date.now()}.pdf`;
              await FileSystem.copyAsync({
                from: uri,
                to: whatsappUri,
              });
              
              // Try to open WhatsApp directly with file attachment
              try {
                console.log('📱 Attempting to open WhatsApp directly with ID document...');
                console.log('📱 File URI:', whatsappUri);
                console.log('📱 Doctor phone:', doctor.phoneNumber);
                
                // Try to use IntentLauncher to open WhatsApp directly with the file
                try {
                  await IntentLauncher.startActivityAsync('android.intent.action.SEND', {
                    type: 'application/pdf',
                    data: whatsappUri,
                    extra: {
                      'android.intent.extra.TEXT': `Hi Dr. ${doctor.name}, please find attached my ID document for your records.`,
                    },
                    packageName: 'com.whatsapp',
                  });
                  console.log('✅ WhatsApp opened directly with ID document via IntentLauncher');
                } catch (intentError) {
                  console.log('⚠️ IntentLauncher failed, trying without package restriction:', intentError);
                  
                  // Try without package restriction
                  try {
                    await IntentLauncher.startActivityAsync('android.intent.action.SEND', {
                      type: 'application/pdf',
                      data: whatsappUri,
                      extra: {
                        'android.intent.extra.TEXT': `Hi Dr. ${doctor.name}, please find attached my ID document for your records.`,
                      },
                    });
                    console.log('✅ WhatsApp opened directly with ID document without package restriction');
                  } catch (secondError) {
                    console.log('⚠️ Second IntentLauncher attempt failed, using expo-sharing:', secondError);
                    
                    // Fallback to expo-sharing
                    const isAvailable = await Sharing.isAvailableAsync();
                    if (isAvailable) {
                      await Sharing.shareAsync(whatsappUri, {
                        mimeType: 'application/pdf',
                        dialogTitle: `Share Medical ID Document with Dr. ${doctor.name}`,
                      });
                      console.log('✅ ID document shared via expo-sharing fallback');
                    } else {
                      throw new Error(t('sharingNotAvailable'));
                    }
                  }
                }
              } catch (sharingError) {
                console.log('⚠️ All methods failed, using Share.share as final fallback:', sharingError);
                
                // Final fallback: Use Share.share
                const shareResult = await Share.share({
                  url: whatsappUri,
                  title: `Medical ID Document: ${document.name}`,
                  message: `Hi Dr. ${doctor.name}, please find attached my ID document for your records.`,
                });
                
                if (shareResult.action === Share.sharedAction) {
                  console.log('✅ ID document shared to WhatsApp with Share API');
                } else {
                  throw new Error(t('shareWasDismissed'));
                }
              }
              
              console.log('✅ ID PDF opened in WhatsApp successfully');
            } catch (intentError) {
              console.log('⚠️ Intent failed, trying expo-sharing:', intentError);
              
              // Fallback to expo-sharing
              try {
                const isAvailable = await Sharing.isAvailableAsync();
                if (isAvailable) {
                  await Sharing.shareAsync(uri, {
                    mimeType: 'application/pdf',
                    dialogTitle: `Share ID Document with Dr. ${doctor.name} via WhatsApp`,
                  });
                  console.log('✅ ID PDF shared successfully with expo-sharing');
                } else {
                  throw new Error(t('sharingNotAvailable'));
                }
              } catch (sharingError) {
                console.log('⚠️ expo-sharing failed, trying Share.share:', sharingError);
                
                // Final fallback to Share.share
                const shareResult = await Share.share({
                  url: uri,
                  title: `ID Document for Dr. ${doctor.name}`,
                  message: `Hi Dr. ${doctor.name}, please find attached my ID document.`,
                });
                
                if (shareResult.action === Share.sharedAction) {
                  console.log('✅ ID PDF shared successfully with Share API');
                }
              }
            }
          } catch (pdfError) {
            console.error('❌ PDF generation failed:', pdfError);
            Alert.alert('❌ Error', 'Failed to create PDF. Using regular sharing instead.');
            
            // Fallback to regular sharing
            await shareRegularDocumentToWhatsApp(document, doctor);
          }
        } else {
          // If we can't find the pair, fall back to regular sharing
          console.log('⚠️ Could not find ID pair, using regular sharing...');
          await shareRegularDocumentToWhatsApp(document, doctor);
        }
      } else {
        // For non-ID documents, use regular sharing
        await shareRegularDocumentToWhatsApp(document, doctor);
      }
      
    } catch (error) {
      console.error('Failed to share to doctor via WhatsApp:', error);
      Alert.alert('❌ ' + t('error'), t('failedToShareToWhatsApp'));
    }
  };

  const shareRegularDocumentToEmail = async (document: DocumentItem, doctor: DoctorContact) => {
    try {
      // Check if it's a PDF file
      const isPDF = document.name.toLowerCase().includes('pdf') || 
                   document.uri.toLowerCase().includes('.pdf');
      
      if (isPDF) {
        // For PDFs, use expo-sharing with Gmail intent
        try {
          const fileInfo = await FileSystem.getInfoAsync(document.uri);
          if (fileInfo.exists) {
            console.log('PDF file exists, sharing with Gmail...');
            
            // Check if sharing is available
            const isAvailable = await Sharing.isAvailableAsync();
            if (!isAvailable) {
              throw new Error(t('sharingNotAvailablePlatform'));
            }
            
            // Share the PDF directly to Gmail using IntentLauncher
            try {
              console.log('📧 Opening Gmail directly with PDF...');
              
              // Copy PDF to a more accessible location
              const gmailUri = `${FileSystem.documentDirectory}${document.name}_${Date.now()}.pdf`;
              await FileSystem.copyAsync({
                from: document.uri,
                to: gmailUri,
              });
              
              // Launch Gmail with the PDF attached
              await IntentLauncher.startActivityAsync('android.intent.action.SEND', {
                type: 'application/pdf',
                data: `file://${gmailUri}`,
                extra: {
                  'android.intent.extra.SUBJECT': `Medical Document - Dr. ${doctor.name}`,
                  'android.intent.extra.TEXT': `Hi Dr. ${doctor.name},\n\nPlease find attached: ${document.name}\n\nBest regards,\nPatient`,
                },
              });
              
              console.log('✅ PDF opened in Gmail successfully');
            } catch (intentError) {
              console.log('⚠️ Intent failed, trying expo-sharing:', intentError);
              
              // Fallback to expo-sharing
              await Sharing.shareAsync(document.uri, {
                mimeType: 'application/pdf',
                dialogTitle: `Share ${document.name} with Dr. ${doctor.name}`,
              });
              
              console.log('✅ PDF shared to Gmail successfully');
            }
          } else {
            Alert.alert('❌ ' + t('error'), t('documentNotFound'));
          }
        } catch (error) {
          console.error('Failed to share PDF to Gmail:', error);
          Alert.alert('❌ Error', 'Failed to share PDF to Gmail. Please try using the general sharing option.');
        }
      } else {
        // For images, convert to shareable URI and use general sharing
        try {
          const shareableUri = await convertToShareableUri(document.uri);
          console.log('Converted URI for Gmail sharing:', shareableUri);
          
          const shareResult = await Share.share({
            url: shareableUri,
            title: document.name,
            message: `Hi Dr. ${doctor.name}, please find attached: ${document.name}`,
          });
          
          if (shareResult.action === Share.sharedAction) {
            console.log('✅ Image shared to Gmail successfully');
          } else {
            console.log('⚠️ Share was dismissed or failed');
          }
        } catch (error) {
          console.error('Failed to share image to Gmail:', error);
          Alert.alert('❌ Error', 'Failed to share image to Gmail. Please try using the general sharing option.');
        }
      }
    } catch (error) {
      console.error('Failed to share regular document to email:', error);
      Alert.alert('❌ ' + t('error'), t('failedToShareRegularDocumentEmail'));
    }
  };

  const shareRegularDocumentToWhatsApp = async (document: DocumentItem, doctor: DoctorContact) => {
    try {
      // Check if it's a PDF file
      const isPDF = document.name.toLowerCase().includes('pdf') || 
                   document.uri.toLowerCase().includes('.pdf');
      
      if (isPDF) {
        // For PDFs, use expo-sharing with WhatsApp intent
        try {
          const fileInfo = await FileSystem.getInfoAsync(document.uri);
          if (fileInfo.exists) {
            console.log('PDF file exists, sharing with WhatsApp...');
            
            // Check if sharing is available
            const isAvailable = await Sharing.isAvailableAsync();
            if (!isAvailable) {
              throw new Error(t('sharingNotAvailablePlatform'));
            }
            
            // Share the PDF directly to WhatsApp using IntentLauncher
            try {
              console.log('📱 Opening WhatsApp directly with PDF...');
              
              // Copy PDF to a more accessible location
              const whatsappUri = `${FileSystem.documentDirectory}${document.name}_${Date.now()}.pdf`;
              await FileSystem.copyAsync({
                from: document.uri,
                to: whatsappUri,
              });
              
        // Use our secure sharing library for WhatsApp
        const success = await SecureSharing.shareToWhatsApp({
          fileUri: whatsappUri,
          fileName: `${document.name}_${Date.now()}.pdf`,
          message: `Hi Dr. ${doctor.name}, please find attached: ${document.name}`,
          title: `Medical Document: ${document.name}`,
          mimeType: 'application/pdf',
        }, doctor);
        
        if (!success) {
          throw new Error(t('secureSharingFailed'));
        }
              
              console.log('✅ PDF opened in WhatsApp successfully');
            } catch (intentError) {
              console.log('⚠️ Intent failed, trying expo-sharing:', intentError);
              
              // Fallback to expo-sharing
              await Sharing.shareAsync(document.uri, {
                mimeType: 'application/pdf',
                dialogTitle: `Share ${document.name} with Dr. ${doctor.name} via WhatsApp`,
              });
              
              console.log('✅ PDF shared to WhatsApp successfully');
            }
          } else {
            Alert.alert('❌ ' + t('error'), t('documentNotFound'));
          }
        } catch (error) {
          console.error('Failed to share PDF to WhatsApp:', error);
          Alert.alert('❌ Error', 'Failed to share PDF to WhatsApp. Please try using the general sharing option.');
        }
      } else {
        // For images, convert to shareable URI and use general sharing
        try {
          const shareableUri = await convertToShareableUri(document.uri);
          console.log('Converted URI for WhatsApp sharing:', shareableUri);
          
          const shareResult = await Share.share({
            url: shareableUri,
            title: document.name,
            message: `Hi Dr. ${doctor.name}, please find attached: ${document.name}`,
          });
          
          if (shareResult.action === Share.sharedAction) {
            console.log('✅ Image shared to WhatsApp successfully');
          } else {
            console.log('⚠️ Share was dismissed or failed');
          }
        } catch (error) {
          console.error('Failed to share image to WhatsApp:', error);
          Alert.alert('❌ Error', 'Failed to share image to WhatsApp. Please try using the general sharing option.');
        }
      }
    } catch (error) {
      console.error('Failed to share regular document to WhatsApp:', error);
      Alert.alert('❌ ' + t('error'), t('failedToShareRegularDocumentWhatsApp'));
    }
  };

  const shareToSpecificDoctor = async (document: DocumentItem, doctor: DoctorContact) => {
    try {
      console.log('Sharing to specific doctor:', doctor.name, doctor.email);
      
      // Check if doctor has email
      if (!doctor.email) {
        Alert.alert(
          '📧 No Email Available',
          `${doctor.name} doesn't have an email address. Please add their email in the Appointment Tracker or use WhatsApp sharing.`,
          [
            {
              text: t('addEmail'),
              onPress: () => {
                // Navigate to appointment tracker to add email
                // This would require navigation logic
                Alert.alert(t('info'), t('goToAppointmentTracker'));
              }
            },
            {
              text: t('useWhatsApp'),
              onPress: () => shareToDoctor(document)
            },
            {
              text: t('cancel'),
              style: 'cancel'
            }
          ]
        );
        return;
      }
      
      // Check if it's a PDF file
      const isPDF = document.name.toLowerCase().includes('pdf') || 
                   document.uri.toLowerCase().includes('.pdf');
      
      if (isPDF) {
        // For PDFs, use expo-sharing with email intent
        try {
          const fileInfo = await FileSystem.getInfoAsync(document.uri);
          if (fileInfo.exists) {
            console.log('PDF file exists, sharing to doctor email...');
            
            // Check if sharing is available
            const isAvailable = await Sharing.isAvailableAsync();
            if (!isAvailable) {
              throw new Error(t('sharingNotAvailablePlatform'));
            }
            
            // Share the PDF file directly using expo-sharing
            await Sharing.shareAsync(document.uri, {
              mimeType: 'application/pdf',
              dialogTitle: `Share ${document.name} with ${doctor.name}`,
            });
            
            console.log('✅ PDF shared to doctor successfully');
          } else {
            Alert.alert('❌ ' + t('error'), t('documentNotFound'));
          }
        } catch (shareError) {
          console.error('Failed to share PDF to doctor:', shareError);
          Alert.alert('❌ Error', 'Failed to share PDF to doctor. Please try using the general sharing option.');
        }
      } else {
        // For images, convert to shareable URI and use general sharing
        try {
          const shareableUri = await convertToShareableUri(document.uri);
          console.log('Converted URI for doctor sharing:', shareableUri);
          
          const shareResult = await Share.share({
            url: shareableUri,
            title: document.name,
            message: `Medical Document: ${document.name} - For Dr. ${doctor.name}`,
          });
          
          if (shareResult.action === Share.sharedAction) {
            console.log('✅ Image shared to doctor successfully');
          } else {
            console.log('⚠️ Share was dismissed or failed');
          }
        } catch (error) {
          console.error('Failed to share image to doctor:', error);
          Alert.alert('❌ Error', 'Failed to share image to doctor. Please try using the general sharing option.');
        }
      }
      
    } catch (error) {
      console.error('Failed to share to doctor:', error);
      Alert.alert('❌ ' + t('error'), 'Failed to share to doctor');
    }
  };

  // Removed shareToDoctor function - no longer using doctor contacts



  // Removed shareToDoctorWhatsApp function - no longer using doctor contacts

  // Removed shareToAllApps function - now using direct sharing in shareDocument

  const isValidUri = (uri: string): boolean => {
    try {
      // Check if it's a valid URI format
      return uri && (uri.startsWith('file://') || uri.startsWith('content://') || uri.startsWith('http://') || uri.startsWith('https://'));
    } catch {
      return false;
    }
  };

  const isImageFile = (document: DocumentItem): boolean => {
    const uri = document.uri.toLowerCase();
    const name = document.name.toLowerCase();
    
    // Check URI extension
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
    const hasImageExtension = imageExtensions.some(ext => uri.includes(ext));
    
    // Check name for image indicators
    const hasImageName = name.includes('photo') || name.includes('image') || name.includes('front') || name.includes('back');
    
    // Check if it's NOT a PDF
    const isNotPDF = !uri.includes('.pdf') && !name.includes('pdf');
    
    return hasImageExtension || (hasImageName && isNotPDF);
  };

  const isPDFFile = (document: DocumentItem): boolean => {
    const uri = document.uri.toLowerCase();
    const name = document.name.toLowerCase();
    
    return uri.includes('.pdf') || name.includes('pdf');
  };

  const isIDDocument = (document: DocumentItem): boolean => {
    const name = document.name.toLowerCase();
    const result = name.includes('id') || name.includes('license') || name.includes('passport') || 
           name.includes('front') || name.includes('back') || name.includes('side') ||
           name.includes('credencial') || name.includes('votar') || name.includes('elector') ||
           name.includes('cedula') || name.includes('identidad');
    
    console.log('🆔 isIDDocument check:', { 
      name: document.name, 
      lowercase: name, 
      isID: result,
      checks: {
        hasId: name.includes('id'),
        hasLicense: name.includes('license'),
        hasPassport: name.includes('passport'),
        hasFront: name.includes('front'),
        hasBack: name.includes('back'),
        hasSide: name.includes('side'),
        hasCredencial: name.includes('credencial'),
        hasVotar: name.includes('votar'),
        hasElector: name.includes('elector'),
        hasCedula: name.includes('cedula'),
        hasIdentidad: name.includes('identidad')
      }
    });
    
    return result;
  };

  


  const findIDPair = (document: DocumentItem): { front: DocumentItem | null, back: DocumentItem | null } | null => {
    try {
      console.log('🔍 Looking for ID pair for:', document.name);
      
      // First try the name-based approach
      const docName = document.name.toLowerCase();
      const isFront = docName.includes('front') || docName.includes('frente') || docName.includes('anverso');
      const isBack = docName.includes('back') || docName.includes('reverso') || docName.includes('atras');
      
      if (isFront || isBack) {
        console.log('🔍 Using name-based pairing');
        const pair = documents.find(doc => {
          if (doc.id === document.id) return false;
          
          const otherDocName = doc.name.toLowerCase();
          const docIsFront = otherDocName.includes('front') || otherDocName.includes('frente') || otherDocName.includes('anverso');
          const docIsBack = otherDocName.includes('back') || otherDocName.includes('reverso') || otherDocName.includes('atras');
          
          if (isFront && docIsBack) return true;
          if (isBack && docIsFront) return true;
          return false;
        });
        
        if (pair) {
          const result = {
            front: isFront ? document : pair,
            back: isBack ? document : pair
          };
          console.log('✅ Found name-based ID pair:', { front: result.front?.name, back: result.back?.name });
          return result;
        }
      }
      
      // Fallback: Group ID documents by category and creation time (within 5 minutes)
      console.log('🔍 Trying time-based pairing for ID documents');
      const idDocuments = documents.filter(doc => 
        doc.id !== document.id && 
        isIDDocument(doc) &&
        Math.abs(new Date(doc.createdAt).getTime() - new Date(document.createdAt).getTime()) < 5 * 60 * 1000 // 5 minutes
      );
      
      console.log('🔍 Found ID documents within time window:', idDocuments.map(d => d.name));
      
      if (idDocuments.length > 0) {
        // If we have exactly 2 ID documents created close together, pair them
        if (idDocuments.length === 1) {
          const otherDoc = idDocuments[0];
          const result = {
            front: document.createdAt < otherDoc.createdAt ? document : otherDoc,
            back: document.createdAt < otherDoc.createdAt ? otherDoc : document
          };
          console.log('✅ Found time-based ID pair:', { front: result.front?.name, back: result.back?.name });
          return result;
        }
      }
      
      console.log('⚠️ No ID pair found');
      return null;
    } catch (error) {
      console.error('❌ Error finding ID pair:', error);
      return null;
    }
  };

  const convertImageToDataUri = async (uri: string): Promise<string | null> => {
    try {
      console.log('🔄 Converting image to data URI:', uri);
      
      // If it's already a data URI, return as is
      if (uri.startsWith('data:')) {
        console.log('✅ Already a data URI');
        return uri;
      }
      
      // For file URIs, read the file and convert to base64
      if (uri.startsWith('file://')) {
        console.log('🔄 Reading file and converting to base64...');
        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        return `data:image/jpeg;base64,${base64}`;
      }
      
      // For content URIs, copy to temp file first
      if (uri.startsWith('content://')) {
        console.log('🔄 Converting content URI to data URI...');
        const tempUri = `${FileSystem.documentDirectory}temp_image_${Date.now()}.jpg`;
        
        await FileSystem.copyAsync({
          from: uri,
          to: tempUri,
        });
        
        const base64 = await FileSystem.readAsStringAsync(tempUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        // Clean up temp file
        await FileSystem.deleteAsync(tempUri, { idempotent: true });
        
        return `data:image/jpeg;base64,${base64}`;
      }
      
      console.log('⚠️ Unknown URI format:', uri);
      return null;
    } catch (error) {
      console.error('❌ Failed to convert image to data URI:', error);
      return null;
    }
  };

  const convertToShareableUri = async (uri: string): Promise<string> => {
    try {
      console.log('🔄 Converting URI to shareable format:', uri);
      
      // If it's already a file URI, return as is
      if (uri.startsWith('file://')) {
        console.log('✅ Already a file URI');
        return uri;
      }
      
      // If it's a content URI, copy to a temporary file
      if (uri.startsWith('content://')) {
        console.log('🔄 Converting content URI to file URI...');
        const tempUri = `${FileSystem.documentDirectory}shareable_${Date.now()}.jpg`;
        
        await FileSystem.copyAsync({
          from: uri,
          to: tempUri,
        });
        
        console.log('✅ Converted to file URI:', tempUri);
        return tempUri;
      }
      
      // For other URIs, return as is
      console.log('✅ Using original URI');
      return uri;
    } catch (error) {
      console.error('❌ Failed to convert URI:', error);
      return uri; // Return original if conversion fails
    }
  };

  const createIDPDF = async (frontImageUri: string, backImageUri: string): Promise<string | null> => {
    try {
      console.log('📄 Creating ID PDF with both images and AuricRX logo...');
      
      // Convert URIs to shareable format
      const frontShareableUri = await convertToShareableUri(frontImageUri);
      const backShareableUri = await convertToShareableUri(backImageUri);
      
      // Convert images to base64 for embedding in HTML
      const frontBase64 = await FileSystem.readAsStringAsync(frontShareableUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const backBase64 = await FileSystem.readAsStringAsync(backShareableUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      // Get AuricRX logo as base64
      const logoSource = require('../../assets/auricrx-logo.png');
      const logoAssetInfo = Image.resolveAssetSource(logoSource);
      console.log('📄 Logo asset info:', logoAssetInfo);
      
      // For bundled assets, we need to fetch and convert to base64
      let logoBase64 = '';
      try {
        // Download the asset to a temporary location
        const logoDownload = await FileSystem.downloadAsync(
          logoAssetInfo.uri,
          FileSystem.cacheDirectory + 'auricrx-logo-temp.png'
        );
        console.log('📄 Logo downloaded to:', logoDownload.uri);
        
        // Read as base64
        logoBase64 = await FileSystem.readAsStringAsync(logoDownload.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        console.log('📄 Logo base64 length:', logoBase64.length);
      } catch (logoError) {
        console.error('⚠️ Failed to load logo, continuing without it:', logoError);
        // Continue without logo rather than failing completely
      }
      
      // Create HTML content for PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>AuricRX ID Document</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
              background-color: #f8f9fa;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #3B82F6;
              padding-bottom: 20px;
            }
            .logo {
              max-width: 200px;
              height: auto;
              margin-bottom: 10px;
            }
            .title {
              color: #3B82F6;
              font-size: 24px;
              font-weight: bold;
              margin: 0;
            }
            .subtitle {
              color: #6B7280;
              font-size: 16px;
              margin: 5px 0 0 0;
            }
            .page {
              background-color: white;
              margin-bottom: 20px;
              padding: 20px;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .page-title {
              color: #1F2937;
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 15px;
              text-align: center;
            }
            .image-container {
              text-align: center;
              margin: 20px 0;
            }
            .id-image {
              max-width: 100%;
              height: auto;
              border: 1px solid #E5E7EB;
              border-radius: 8px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #E5E7EB;
              color: #6B7280;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <img src="data:image/png;base64,${logoBase64}" alt="AuricRX Logo" class="logo">
            <h1 class="title">AuricRX Medical Coach</h1>
            <p class="subtitle">ID Document - ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div class="page">
            <h2 class="page-title">📷 Front Side</h2>
            <div class="image-container">
              <img src="data:image/jpeg;base64,${frontBase64}" alt="Front ID" class="id-image">
            </div>
          </div>
          
          <div class="page">
            <h2 class="page-title">📷 Back Side</h2>
            <div class="image-container">
              <img src="data:image/jpeg;base64,${backBase64}" alt="Back ID" class="id-image">
            </div>
          </div>
          
          <div class="footer">
            <p>Generated by AuricRX Medical Coach App</p>
            <p>Document created on ${new Date().toLocaleString()}</p>
          </div>
        </body>
        </html>
      `;
      
      // Create PDF using Expo Print
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
        width: 8.5 * 72, // 8.5 inches in points (72 points per inch)
        height: 11 * 72, // 11 inches in points
      });
      
      console.log('✅ PDF created successfully:', uri);
      return uri;
    } catch (error) {
      console.error('❌ Failed to create ID PDF:', error);
      return null;
    }
  };

  // Create formatted PDF for viewing ID documents (same styling as exported PDFs)
  const createFormattedIDPDF = async (docs: DocumentItem[]): Promise<string | null> => {
    try {
      console.log('🔄 Creating formatted ID PDF for viewing with', docs.length, 'documents');
      
      if (docs.length === 0) {
        console.error('❌ No documents provided for PDF creation');
        return null;
      }
      
      // Convert images to base64
      const imageBase64s = await Promise.all(
        docs.map(async (doc) => {
          console.log('📄 Converting image to base64:', doc.name);
          const base64 = await convertImageToDataUri(doc.uri);
          if (!base64) {
            console.error('❌ Failed to convert image to base64:', doc.name);
          }
          return base64;
        })
      );
      
      const validImages = imageBase64s.filter(base64 => base64 !== null);
      if (validImages.length === 0) {
        console.error('❌ No valid images to create PDF');
        return null;
      }
      
      // Try to load the AuricRX logo
      let logoBase64 = null;
      try {
        const logoSource = require('../../assets/AuricRX Document Logo.png');
        const logoAssetInfo = Image.resolveAssetSource(logoSource);
        console.log('📄 Loading logo for viewing PDF:', logoAssetInfo.uri);
        
        const logoDownload = await FileSystem.downloadAsync(
          logoAssetInfo.uri,
          FileSystem.cacheDirectory + 'auricrx-view-logo-temp.png'
        );
        
        const logoBase64Data = await FileSystem.readAsStringAsync(logoDownload.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        logoBase64 = `data:image/png;base64,${logoBase64Data}`;
        console.log('✅ Logo loaded successfully for viewing PDF');
      } catch (logoError) {
        console.log('⚠️ Failed to load logo for viewing PDF, continuing without it:', logoError);
      }

      // Create HTML with the same styling as exported PDFs
      let html = '';
      
      if (validImages.length === 1) {
        // Single ID document
        html = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body {
                margin: 0;
                padding: 20px;
                font-family: Arial, sans-serif;
                background-color: white;
              }
              .header {
                text-align: center;
                margin-bottom: 30px;
              }
              .logo {
                max-width: 200px;
                max-height: 80px;
                margin-bottom: 10px;
              }
              .title {
                font-size: 18px;
                font-weight: bold;
                color: #333;
                margin-bottom: 20px;
              }
              .id-container {
                display: flex;
                justify-content: center;
                margin-bottom: 20px;
              }
              .id-side {
                text-align: center;
              }
              .id-side h3 {
                margin: 0 0 10px 0;
                font-size: 14px;
                color: #666;
              }
              .id-image {
                max-width: 400px;
                height: auto;
                border: 2px solid #ddd;
                border-radius: 8px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
              }
              .footer {
                text-align: center;
                margin-top: 30px;
                font-size: 12px;
                color: #666;
                border-top: 1px solid #ddd;
                padding-top: 20px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              ${logoBase64 ? `<img src="${logoBase64}" class="logo" alt="AuricRX Logo">` : ''}
              <div class="title">AuricRX Medical ID Document</div>
            </div>
            
            <div class="id-container">
              <div class="id-side">
                <h3>ID Document</h3>
                <img src="${validImages[0]}" class="id-image" alt="ID Document">
              </div>
            </div>
            
            <div class="footer">
              Generated by AuricRX MedCoach - ${new Date().toLocaleDateString()}
            </div>
          </body>
          </html>
        `;
      } else {
        // Dual ID document
        html = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body {
                margin: 0;
                padding: 20px;
                font-family: Arial, sans-serif;
                background-color: white;
              }
              .header {
                text-align: center;
                margin-bottom: 30px;
              }
              .logo {
                max-width: 200px;
                max-height: 80px;
                margin-bottom: 10px;
              }
              .title {
                font-size: 18px;
                font-weight: bold;
                color: #333;
                margin-bottom: 20px;
              }
              .id-container {
                display: flex;
                justify-content: space-between;
                margin-bottom: 20px;
                gap: 20px;
              }
              .id-side {
                flex: 1;
                text-align: center;
              }
              .id-side h3 {
                margin: 0 0 10px 0;
                font-size: 14px;
                color: #666;
              }
              .id-image {
                max-width: 100%;
                height: auto;
                border: 2px solid #ddd;
                border-radius: 8px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
              }
              .footer {
                text-align: center;
                margin-top: 30px;
                font-size: 12px;
                color: #666;
                border-top: 1px solid #ddd;
                padding-top: 20px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              ${logoBase64 ? `<img src="${logoBase64}" class="logo" alt="AuricRX Logo">` : ''}
              <div class="title">AuricRX Medical ID Document</div>
            </div>
            
            <div class="id-container">
              <div class="id-side">
                <h3>Front Side</h3>
                <img src="${validImages[0]}" class="id-image" alt="Front ID">
              </div>
              <div class="id-side">
                <h3>Back Side</h3>
                <img src="${validImages[1]}" class="id-image" alt="Back ID">
              </div>
            </div>
            
            <div class="footer">
              Generated by AuricRX MedCoach - ${new Date().toLocaleDateString()}
            </div>
          </body>
          </html>
        `;
      }

      // Generate PDF using expo-print
      console.log('📄 Generating formatted PDF with expo-print...');
      const { uri } = await Print.printToFileAsync({
        html: html,
        base64: false,
      });
      
      console.log('✅ Formatted ID PDF created successfully at:', uri);
      return uri;
      
    } catch (error) {
      console.error('❌ Failed to create formatted ID PDF for viewing:', error);
      return null;
    }
  };

  const viewDocument = async (document: DocumentItem) => {
    try {
      triggerHaptic('light');
      
      console.log('📄 Opening document:', {
        name: document.name,
        uri: document.uri,
        type: document.type,
        isPDF: isPDFFile(document),
        isImage: isImageFile(document),
        isID: isIDDocument(document)
      });
      
      // Check file type using helper functions
      if (isPDFFile(document)) {
        // For PDFs, open in built-in PDF viewer
        console.log('📄 Opening PDF in built-in viewer:', {
          name: document.name,
          uri: document.uri,
          isPDF: true
        });
        setSelectedDocument(document);
        setShowPDFViewer(true);
      } else if (isImageFile(document)) {
        // Check if this is an ID document - create formatted PDF instead of showing raw images
        if (isIDDocument(document)) {
          console.log('📄 Creating formatted PDF for ID document viewing...');
          const pair = findIDPair(document);
          console.log('Found ID pair:', pair);
          
          try {
            // Create formatted PDF for viewing
            let pdfUri: string | null = null;
            
            if (pair && pair.front && pair.back) {
              // Dual ID document - create combined PDF
              console.log('📄 Creating combined ID PDF for viewing...');
              const docs = [pair.front, pair.back];
              pdfUri = await createFormattedIDPDF(docs);
            } else {
              // Single ID document - create single PDF
              console.log('📄 Creating single ID PDF for viewing...');
              const docs = [document];
              pdfUri = await createFormattedIDPDF(docs);
            }
            
            if (pdfUri) {
              console.log('✅ Formatted PDF created, opening in PDF viewer:', pdfUri);
              
              // Create a temporary document object for the PDF viewer
              const pdfDocument: DocumentItem = {
                id: `view-${Date.now()}`,
                name: `ID_Document_${new Date().toISOString().split('T')[0]}.pdf`,
                uri: pdfUri,
                type: 'application/pdf',
                mimeType: 'application/pdf',
                size: 0,
                category: 'id_documents',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
              
              setSelectedDocument(pdfDocument);
              setShowPDFViewer(true);
            } else {
              console.error('❌ Failed to create formatted PDF for viewing');
              Alert.alert('❌ Error', 'Failed to create formatted view for ID document');
            }
          } catch (error) {
            console.error('❌ Error creating formatted PDF for viewing:', error);
            Alert.alert('❌ Error', 'Failed to create formatted view for ID document');
          }
        } else {
          // For regular images, show in single modal
          console.log('Opening image in modal...');
          setImageLoading(true);
          setImageError(false);
          setImageDataUri(null);
                  setSelectedDocument(document);
                  setShowViewModal(true);
          
          // Convert image to data URI
          try {
            console.log('🔄 Starting image conversion...');
            const dataUri = await convertImageToDataUri(document.uri);
            console.log('🔄 Conversion result:', dataUri ? 'SUCCESS' : 'FAILED');
            if (dataUri) {
              console.log('✅ Data URI length:', dataUri.length);
              console.log('✅ Data URI preview:', dataUri.substring(0, 100) + '...');
              setImageDataUri(dataUri);
              setImageLoading(true); // Keep loading true for Image component
              setImageError(false);
              console.log('✅ Image converted to data URI successfully');
              
              // Set a timeout for the Image component to load
              const imageTimeout = setTimeout(() => {
                console.log('⏰ Image component timeout - showing error');
                setImageLoading(false);
                setImageError(true);
              }, 10000); // 10 second timeout for Image component
              
              imageTimeoutRef.current = imageTimeout;
            } else {
              console.log('❌ Failed to convert image to data URI');
              setImageLoading(false);
              setImageError(true);
            }
          } catch (error) {
            console.error('❌ Error converting image:', error);
            console.error('❌ Error details:', JSON.stringify(error, null, 2));
            setImageLoading(false);
            setImageError(true);
          }
        }
      } else {
        // For other file types, show in modal with basic info
        console.log('Opening document in modal...');
        setSelectedDocument(document);
        setShowViewModal(true);
      }
      
    } catch (error) {
      console.error('❌ Failed to view document:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      console.error('❌ Document that failed:', {
        name: document.name,
        uri: document.uri,
        type: document.type
      });
      Alert.alert('❌ ' + t('error'), `Failed to open document: ${error.message || 'Unknown error'}`);
    }
  };

  // Multi-selection functions
  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    if (isSelectionMode) {
      setSelectedDocuments(new Set());
    }
  };

  const toggleDocumentSelection = (documentId: string) => {
    const newSelected = new Set(selectedDocuments);
    if (newSelected.has(documentId)) {
      newSelected.delete(documentId);
    } else {
      newSelected.add(documentId);
    }
    setSelectedDocuments(newSelected);
  };

  const selectAllDocuments = () => {
    const allIds = new Set(documents.map(doc => doc.id));
    setSelectedDocuments(allIds);
  };

  const clearSelection = () => {
    setSelectedDocuments(new Set());
  };

  const shareSelectedDocuments = async () => {
    if (selectedDocuments.size === 0) return;

    try {
      triggerHaptic('light');
      
      const selectedDocs = documents.filter(doc => selectedDocuments.has(doc.id));
      console.log('📄 Sharing selected documents:', selectedDocs.map(d => ({ name: d.name, type: d.type })));
      console.log('📄 Selected document IDs:', Array.from(selectedDocuments));
      console.log('📄 Total documents available:', documents.length);

      if (selectedDocs.length === 1) {
        // Single document - use existing logic
        console.log('📄 Single document selected, using shareDocument');
        await shareDocument(selectedDocs[0]);
      } else {
        // Multiple documents - create a combined approach
        console.log('📄 Multiple documents selected, using shareMultipleDocuments');
        await shareMultipleDocuments(selectedDocs);
      }

      // Clear selection after sharing
      setSelectedDocuments(new Set());
      setIsSelectionMode(false);
      
    } catch (error) {
      console.error('Failed to share selected documents:', error);
      Alert.alert('❌ Error', 'Failed to share selected documents');
    }
  };

  const shareMultipleDocuments = async (docs: DocumentItem[]) => {
    try {
      console.log('🔄 Sharing multiple documents:', docs.map(d => ({ name: d.name, type: d.type })));
      
      // Check if all documents are ID documents that can be combined
      const allIDDocs = docs.every(doc => isIDDocument(doc));
      console.log('🔄 All documents are ID documents:', allIDDocs);
      console.log('🔄 Document count:', docs.length);
      
      if (allIDDocs && docs.length === 2) {
        // For 2 ID documents, try to create a combined PDF
        console.log('🔄 Creating combined ID PDF...');
        await shareCombinedIDDocuments(docs);
      } else {
        // For other combinations, use Android's multiple file sharing
        console.log('🔄 Using multiple file sharing (not ID documents or wrong count)...');
        console.log('🔄 Reason: allIDDocs =', allIDDocs, ', docs.length =', docs.length);
        await shareMultipleFiles(docs);
      }
    } catch (error) {
      console.error('Failed to share multiple documents:', error);
      throw error;
    }
  };

  const shareCombinedIDDocuments = async (docs: DocumentItem[]) => {
    try {
      console.log('🚀 shareCombinedIDDocuments called with:', docs.map(d => ({ name: d.name, uri: d.uri })));
      
      // Find the ID pair - use more flexible detection
      const frontDoc = docs.find(doc => {
        const name = doc.name.toLowerCase();
        return name.includes('front') || name.includes('frontal') || name.includes('frente') || 
               name.includes('anverso') || name.includes('id');
      });
      const backDoc = docs.find(doc => {
        const name = doc.name.toLowerCase();
        return name.includes('back') || name.includes('trasero') || name.includes('reverso') || 
               name.includes('atras') || name.includes('lado trasero');
      });
      
      console.log('🔍 Found documents:', { 
        frontDoc: frontDoc?.name, 
        backDoc: backDoc?.name,
        totalDocs: docs.length 
      });
      
      if (frontDoc && backDoc) {
        console.log('🔄 Creating combined PDF with both ID images...');
        
        // Convert images to base64 for embedding in PDF
        console.log('📄 Converting front image:', frontDoc.uri);
        const frontBase64 = await convertImageToDataUri(frontDoc.uri);
        console.log('📄 Converting back image:', backDoc.uri);
        const backBase64 = await convertImageToDataUri(backDoc.uri);
        
        console.log('📄 Front image converted:', !!frontBase64);
        console.log('📄 Back image converted:', !!backBase64);
        
        if (!frontBase64 || !backBase64) {
          console.error('❌ Failed to convert images to base64');
          Alert.alert('❌ ' + t('error'), t('failedToProcessImages'));
          return;
        }

        // Try to load the AuricRX logo
        let logoBase64 = null;
        try {
          const logoSource = require('../../assets/AuricRX Document Logo.png');
          const logoAssetInfo = Image.resolveAssetSource(logoSource);
          console.log('📄 Loading logo for combined ID PDF:', logoAssetInfo.uri);
          
          // Download asset to cache and convert to base64
          const logoDownload = await FileSystem.downloadAsync(
            logoAssetInfo.uri,
            FileSystem.cacheDirectory + 'auricrx-doc-logo-temp.png'
          );
          
          const logoBase64Data = await FileSystem.readAsStringAsync(logoDownload.uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          
          // Create data URI
          logoBase64 = `data:image/png;base64,${logoBase64Data}`;
          console.log('✅ Logo loaded successfully for combined ID PDF');
        } catch (logoError) {
          console.log('⚠️ Failed to load logo, proceeding without it:', logoError);
        }

        // Create HTML for PDF with both images side by side
        const html = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body {
                margin: 0;
                padding: 20px;
                font-family: Arial, sans-serif;
                background-color: white;
              }
              .header {
                text-align: center;
                margin-bottom: 30px;
              }
              .logo {
                max-width: 200px;
                max-height: 80px;
                margin-bottom: 10px;
              }
              .title {
                font-size: 18px;
                font-weight: bold;
                color: #333;
                margin-bottom: 20px;
              }
              .id-container {
                display: flex;
                justify-content: space-between;
                gap: 20px;
                margin-bottom: 20px;
              }
              .id-side {
                flex: 1;
                text-align: center;
              }
              .id-side h3 {
                margin: 0 0 10px 0;
                font-size: 14px;
                color: #666;
              }
              .id-image {
                width: 100%;
                max-width: 300px;
                height: auto;
                border: 2px solid #ddd;
                border-radius: 8px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
              }
              .footer {
                text-align: center;
                margin-top: 30px;
                font-size: 12px;
                color: #666;
                border-top: 1px solid #ddd;
                padding-top: 20px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              ${logoBase64 ? `<img src="${logoBase64}" class="logo" alt="AuricRX Logo">` : ''}
              <div class="title">AuricRX Medical ID Document</div>
            </div>
            
            <div class="id-container">
              <div class="id-side">
                <h3>Front Side</h3>
                <img src="${frontBase64}" class="id-image" alt="ID Front">
              </div>
              <div class="id-side">
                <h3>Back Side</h3>
                <img src="${backBase64}" class="id-image" alt="ID Back">
              </div>
            </div>
            
            <div class="footer">
              Generated by AuricRX MedCoach - ${new Date().toLocaleDateString()}
            </div>
          </body>
          </html>
        `;

        // Generate PDF using expo-print
        console.log('📄 About to generate PDF with expo-print...');
        console.log('📄 HTML length:', html.length);
        console.log('📄 Print.printToFileAsync available:', !!Print?.printToFileAsync);
        
        const { uri } = await Print.printToFileAsync({
          html: html,
          base64: false,
        });
        
        console.log('📄 PDF generated successfully at:', uri);
        
        // Copy PDF to a more accessible location for sharing
        const shareableUri = `${FileSystem.documentDirectory}Combined_ID_Document_${Date.now()}.pdf`;
        await FileSystem.copyAsync({
          from: uri,
          to: shareableUri,
        });
        
        // Share the PDF
        console.log('📤 Attempting to share combined ID PDF:', shareableUri);
        try {
          const { isAvailable } = await Sharing.isAvailableAsync();
          console.log('📤 Sharing availability check:', isAvailable);
          
          if (isAvailable) {
            await Sharing.shareAsync(shareableUri, {
              mimeType: 'application/pdf',
              dialogTitle: `Share Combined ID Document`,
            });
            console.log('✅ Combined ID PDF shared successfully');
          } else {
            console.log('⚠️ Sharing not available, trying direct share anyway...');
            // Try sharing anyway - sometimes the availability check fails in dev builds
            await Sharing.shareAsync(shareableUri, {
              mimeType: 'application/pdf',
              dialogTitle: `Share Combined ID Document`,
            });
            console.log('✅ Combined ID PDF shared successfully (fallback)');
          }
        } catch (shareError) {
          console.error('❌ Combined ID PDF sharing failed:', shareError);
          Alert.alert('❌ Error', `Failed to share PDF: ${shareError.message || 'Unknown error'}`);
        }
      } else if (docs.length === 1) {
        console.log('🔄 Creating PDF with single ID document...');
        
        const singleDoc = docs[0];
        console.log('📄 Converting single image:', singleDoc.uri);
        const imageBase64 = await convertImageToDataUri(singleDoc.uri);
        
        if (!imageBase64) {
          console.error('❌ Failed to convert single image to base64');
          Alert.alert('❌ ' + t('error'), t('failedToProcessImages'));
          return;
        }

        // Try to load the AuricRX logo
        let logoBase64 = null;
        try {
          const logoSource = require('../../assets/AuricRX Document Logo.png');
          const logoAssetInfo = Image.resolveAssetSource(logoSource);
          console.log('📄 Loading logo for single ID PDF:', logoAssetInfo.uri);
          
          // Download asset to cache and convert to base64
          const logoDownload = await FileSystem.downloadAsync(
            logoAssetInfo.uri,
            FileSystem.cacheDirectory + 'auricrx-single-logo-temp.png'
          );
          
          const logoBase64Data = await FileSystem.readAsStringAsync(logoDownload.uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          
          // Create data URI
          logoBase64 = `data:image/png;base64,${logoBase64Data}`;
          console.log('✅ Logo loaded successfully for single ID PDF');
        } catch (logoError) {
          console.log('⚠️ Failed to load logo, proceeding without it:', logoError);
        }

        // Create HTML for PDF with single image
        const html = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body {
                margin: 0;
                padding: 20px;
                font-family: Arial, sans-serif;
                background-color: white;
              }
              .header {
                text-align: center;
                margin-bottom: 30px;
              }
              .logo {
                max-width: 200px;
                max-height: 80px;
                margin-bottom: 10px;
              }
              .title {
                font-size: 18px;
                font-weight: bold;
                color: #333;
                margin-bottom: 20px;
              }
              .id-container {
                display: flex;
                justify-content: center;
                margin-bottom: 20px;
              }
              .id-side {
                text-align: center;
              }
              .id-side h3 {
                margin: 0 0 10px 0;
                font-size: 14px;
                color: #666;
              }
              .id-image {
                max-width: 400px;
                height: auto;
                border: 2px solid #ddd;
                border-radius: 8px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
              }
              .footer {
                text-align: center;
                margin-top: 30px;
                font-size: 12px;
                color: #666;
                border-top: 1px solid #ddd;
                padding-top: 20px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              ${logoBase64 ? `<img src="${logoBase64}" class="logo" alt="AuricRX Logo">` : ''}
              <div class="title">AuricRX Medical ID Document</div>
            </div>
            
            <div class="id-container">
              <div class="id-side">
                <h3>ID Document</h3>
                <img src="${imageBase64}" class="id-image" alt="ID Document">
              </div>
            </div>
            
            <div class="footer">
              Generated by AuricRX MedCoach - ${new Date().toLocaleDateString()}
            </div>
          </body>
          </html>
        `;

        // Generate PDF using expo-print
        console.log('📄 About to generate single ID PDF with expo-print...');
        console.log('📄 HTML length:', html.length);
        console.log('📄 Print.printToFileAsync available:', !!Print?.printToFileAsync);
        
        const { uri } = await Print.printToFileAsync({
          html: html,
          base64: false,
        });
        
        console.log('📄 Single ID PDF generated successfully at:', uri);
        
        // Copy PDF to a more accessible location for sharing
        const shareableUri = `${FileSystem.documentDirectory}Single_ID_Document_${Date.now()}.pdf`;
        await FileSystem.copyAsync({
          from: uri,
          to: shareableUri,
        });
        
        // Share the PDF
        console.log('📤 Attempting to share single ID PDF (duplicate section):', shareableUri);
        try {
          const { isAvailable } = await Sharing.isAvailableAsync();
          console.log('📤 Sharing availability check (duplicate section):', isAvailable);
          
          if (isAvailable) {
            await Sharing.shareAsync(shareableUri, {
              mimeType: 'application/pdf',
              dialogTitle: `Share ID Document`,
            });
            console.log('✅ Single ID PDF shared successfully (duplicate section)');
          } else {
            console.log('⚠️ Sharing not available, trying direct share anyway (duplicate section)...');
            await Sharing.shareAsync(shareableUri, {
              mimeType: 'application/pdf',
              dialogTitle: `Share ID Document`,
            });
            console.log('✅ Single ID PDF shared successfully (duplicate section fallback)');
          }
        } catch (shareError) {
          console.error('❌ Single ID PDF sharing failed (duplicate section):', shareError);
          Alert.alert('❌ Error', `Failed to share PDF: ${shareError.message || 'Unknown error'}`);
        }
      } else if (docs.length === 1) {
        console.log('🔄 Creating PDF with single ID document...');
        
        const singleDoc = docs[0];
        console.log('📄 Converting single image:', singleDoc.uri);
        const imageBase64 = await convertImageToDataUri(singleDoc.uri);
        
        if (!imageBase64) {
          console.error('❌ Failed to convert single image to base64');
          Alert.alert('❌ ' + t('error'), t('failedToProcessImages'));
          return;
        }

        // Try to load the AuricRX logo
        let logoBase64 = null;
        try {
          const logoSource = require('../../assets/AuricRX Document Logo.png');
          const logoAssetInfo = Image.resolveAssetSource(logoSource);
          console.log('📄 Loading logo for single ID PDF:', logoAssetInfo.uri);
          
          // Download asset to cache and convert to base64
          const logoDownload = await FileSystem.downloadAsync(
            logoAssetInfo.uri,
            FileSystem.cacheDirectory + 'auricrx-single-logo-temp.png'
          );
          
          const logoBase64Data = await FileSystem.readAsStringAsync(logoDownload.uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          
          // Create data URI
          logoBase64 = `data:image/png;base64,${logoBase64Data}`;
          console.log('✅ Logo loaded successfully for single ID PDF');
        } catch (logoError) {
          console.log('⚠️ Failed to load logo, proceeding without it:', logoError);
        }

        // Create HTML for PDF with single image
        const html = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body {
                margin: 0;
                padding: 20px;
                font-family: Arial, sans-serif;
                background-color: white;
              }
              .header {
                text-align: center;
                margin-bottom: 30px;
              }
              .logo {
                max-width: 200px;
                max-height: 80px;
                margin-bottom: 10px;
              }
              .title {
                font-size: 18px;
                font-weight: bold;
                color: #333;
                margin-bottom: 20px;
              }
              .id-container {
                display: flex;
                justify-content: center;
                margin-bottom: 20px;
              }
              .id-side {
                text-align: center;
              }
              .id-side h3 {
                margin: 0 0 10px 0;
                font-size: 14px;
                color: #666;
              }
              .id-image {
                max-width: 400px;
                height: auto;
                border: 2px solid #ddd;
                border-radius: 8px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
              }
              .footer {
                text-align: center;
                margin-top: 30px;
                font-size: 12px;
                color: #666;
                border-top: 1px solid #ddd;
                padding-top: 20px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              ${logoBase64 ? `<img src="${logoBase64}" class="logo" alt="AuricRX Logo">` : ''}
              <div class="title">AuricRX Medical ID Document</div>
            </div>
            
            <div class="id-container">
              <div class="id-side">
                <h3>ID Document</h3>
                <img src="${imageBase64}" class="id-image" alt="ID Document">
              </div>
            </div>
            
            <div class="footer">
              Generated by AuricRX MedCoach - ${new Date().toLocaleDateString()}
            </div>
          </body>
          </html>
        `;

        // Generate PDF using expo-print
        console.log('📄 About to generate single ID PDF with expo-print...');
        console.log('📄 HTML length:', html.length);
        console.log('📄 Print.printToFileAsync available:', !!Print?.printToFileAsync);
        
        const { uri } = await Print.printToFileAsync({
          html: html,
          base64: false,
        });
        
        console.log('📄 Single ID PDF generated successfully at:', uri);
        
        // Copy PDF to a more accessible location for sharing
        const shareableUri = `${FileSystem.documentDirectory}Single_ID_Document_${Date.now()}.pdf`;
        await FileSystem.copyAsync({
          from: uri,
          to: shareableUri,
        });
        
        // Share the PDF
        console.log('📤 Attempting to share single ID PDF:', shareableUri);
        try {
          const { isAvailable } = await Sharing.isAvailableAsync();
          console.log('📤 Sharing availability check:', isAvailable);
          
          if (isAvailable) {
            await Sharing.shareAsync(shareableUri, {
              mimeType: 'application/pdf',
              dialogTitle: `Share ID Document`,
            });
            console.log('✅ Single ID PDF shared successfully');
          } else {
            console.log('⚠️ Sharing not available, trying direct share anyway...');
            // Try sharing anyway - sometimes the availability check fails in dev builds
            await Sharing.shareAsync(shareableUri, {
              mimeType: 'application/pdf',
              dialogTitle: `Share ID Document`,
            });
            console.log('✅ Single ID PDF shared successfully (fallback)');
          }
        } catch (shareError) {
          console.error('❌ Single ID PDF sharing failed:', shareError);
          Alert.alert('❌ Error', `Failed to share PDF: ${shareError.message || 'Unknown error'}`);
        }
      } else {
        console.log('⚠️ No valid documents found for PDF creation');
        Alert.alert('❌ ' + t('error'), 'No valid documents to create PDF');
      }
        
    } catch (error) {
      console.error('❌ Failed to create combined ID PDF:', error);
      // Fallback to individual sharing
      await shareMultipleFiles(docs);
    }
  };

  const shareMultipleFiles = async (docs: DocumentItem[]) => {
    try {
      // Convert all documents to shareable URIs
      const shareableUris = await Promise.all(
        docs.map(async (doc) => {
          const shareableUri = await convertToShareableUri(doc.uri);
          return {
            uri: shareableUri,
            mimeType: doc.mimeType || 'application/octet-stream',
            name: doc.name
          };
        })
      );

      // Use Android's multiple file sharing intent
      if (Platform.OS === 'android') {
        try {
          await IntentLauncher.startActivityAsync('android.intent.action.SEND_MULTIPLE', {
            type: 'application/octet-stream',
            extra: {
              'android.intent.extra.STREAM': shareableUris.map(item => item.uri),
              'android.intent.extra.TEXT': `Sharing ${docs.length} documents from AuricRX Medical Coach`,
              'android.intent.extra.SUBJECT': 'Medical Documents'
            }
          });
          console.log('✅ Multiple files shared via Android intent');
          return;
        } catch (intentError) {
          console.log('⚠️ Android intent failed, falling back to individual sharing:', intentError);
        }
      }

      // Fallback: Share first document and show alert for others
      if (docs.length > 0) {
        await shareDocument(docs[0]);
        if (docs.length > 1) {
          Alert.alert(
            'Multiple Documents',
            `Shared first document. ${docs.length - 1} more documents available. Please share them individually.`,
            [{ text: 'OK' }]
          );
        }
      }
    } catch (error) {
      console.error('❌ Failed to share multiple files:', error);
      throw error;
    }
  };

  const getDocumentsForCategory = (category: DocumentCategory) => {
    return documents.filter(doc => doc.category === category);
  };

  const renderDocumentItem = (document: DocumentItem) => {
    const isPDF = document.name.toLowerCase().includes('pdf') || 
                 document.uri.toLowerCase().includes('.pdf');
    const isID = isIDDocument(document);
    
    // For ID documents, check if this is part of a pair
    if (isID) {
      const pair = findIDPair(document);
      const isFront = pair && pair.front && pair.front.uri === document.uri;
      const isBack = pair && pair.back && pair.back.uri === document.uri;
      
      console.log('🔍 ID Document rendering check:', {
        documentName: document.name,
        hasPair: !!pair,
        isFront,
        isBack,
        pair: pair ? { front: pair.front?.name, back: pair.back?.name } : null
      });
      
      // Only render the front document, skip the back to avoid duplication
      if (isBack) {
        console.log('⏭️ Skipping back document to avoid duplication');
        return null;
      }
      
      // Render merged ID card for front document or single ID document
      const hasBackSide = pair && pair.back !== null;
      const displayName = document.name
        .replace(/\.(pdf|jpg|jpeg|png|gif)$/i, '')
        .replace(/_/g, ' ')
        .replace(/\s+(front|back|side)\s*/gi, ' ')
        .trim();
      
      return (
        <View key={`id-${document.id}`} style={dynamicStyles.documentItem}>
          {/* Selection checkbox */}
          {isSelectionMode && (
            <TouchableOpacity
              style={dynamicStyles.checkbox}
              onPress={() => toggleDocumentSelection(document.id)}
            >
              <Text style={dynamicStyles.checkboxText}>
                {selectedDocuments.has(document.id) ? '☑️' : '☐'}
              </Text>
            </TouchableOpacity>
          )}
          
          {/* Dual image preview for ID documents */}
          <View style={[dynamicStyles.documentImage, { flexDirection: 'row', padding: 2 }]}>
      <Image 
        source={{ uri: document.uri }} 
              style={[dynamicStyles.documentImage, { flex: 1, marginRight: hasBackSide ? 1 : 0, borderRadius: 4 }]}
        onError={(error) => {
                console.error('Failed to load front ID thumbnail:', error);
              }}
            />
            {hasBackSide && pair && pair.back && (
              <Image 
                source={{ uri: pair.back.uri }} 
                style={[dynamicStyles.documentImage, { flex: 1, marginLeft: 1, borderRadius: 4 }]}
                onError={(error) => {
                  console.error('Failed to load back ID thumbnail:', error);
                }}
              />
            )}
          </View>
          
      <View style={dynamicStyles.documentInfo}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <DynamicText type="card" style={dynamicStyles.documentName} numberOfLines={1}>
                {displayName}
              </DynamicText>
            </View>
        <DynamicText type="card" style={dynamicStyles.documentType}>
          {new Date(document.createdAt).toLocaleDateString()}
        </DynamicText>
        <DynamicText type="card" style={[dynamicStyles.documentType, { fontSize: 10, opacity: 0.7 }]}>
              🆔 {hasBackSide ? 'Front & Back ID' : 'Photo Id'}
        </DynamicText>
          </View>
          
          <TouchableOpacity
            style={[dynamicStyles.actionButton, { backgroundColor: '#3B82F6' + 'CC' }]}
            onPress={() => viewDocument(document)}
          >
            <DynamicText type="card" style={dynamicStyles.actionButtonText}>👁️</DynamicText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[dynamicStyles.actionButton, { backgroundColor: '#10B981' + 'CC' }]}
            onPress={() => {
              console.log('🔘 Merge/Share button pressed:', {
                documentName: document.name,
                hasBackSide,
                hasPair: !!pair,
                pairInfo: pair ? { front: pair.front?.name, back: pair.back?.name } : null
              });
              
              if (hasBackSide && pair) {
                console.log('📄 Calling shareCombinedIDDocuments with both documents');
                // Create combined PDF for ID documents with both sides
                shareCombinedIDDocuments([pair.front!, pair.back!]);
              } else {
                console.log('📄 Calling shareCombinedIDDocuments with single document');
                // Single ID document - also create PDF for consistency
                shareCombinedIDDocuments([document]);
              }
            }}
          >
            <DynamicText type="card" style={[dynamicStyles.actionButtonText, { fontSize: 10 }]}>
              📤 Share
            </DynamicText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[dynamicStyles.actionButton, { backgroundColor: '#dc2626' + 'CC' }]}
            onPress={() => {
              if (hasBackSide) {
                Alert.alert(
                  'Delete ID Documents',
                  'Are you sure you want to delete both front and back ID documents?',
                  [
                    { text: t('cancel'), style: 'cancel' },
                    { 
                      text: 'Delete', 
                      style: 'destructive',
                      onPress: () => {
                        deleteDocument(document.id);
                        if (pair && pair.back) deleteDocument(pair.back.id);
                      }
                    }
                  ]
                );
              } else {
                deleteDocument(document.id);
              }
            }}
          >
            <DynamicText type="card" style={dynamicStyles.actionButtonText}>🗑️</DynamicText>
        </TouchableOpacity>
      </View>
      );
    }
    
    // Regular document rendering for non-ID documents
    return (
      <View key={document.id} style={dynamicStyles.documentItem}>
        {/* Selection checkbox */}
        {isSelectionMode && (
          <TouchableOpacity
            style={dynamicStyles.checkbox}
            onPress={() => toggleDocumentSelection(document.id)}
          >
            <Text style={dynamicStyles.checkboxText}>
              {selectedDocuments.has(document.id) ? '☑️' : '☐'}
            </Text>
          </TouchableOpacity>
        )}
        
        {isPDF ? (
          <View style={[dynamicStyles.documentImage, { backgroundColor: '#DC2626', justifyContent: 'center', alignItems: 'center' }]}>
            <DynamicText type="card" style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>PDF</DynamicText>
          </View>
        ) : (
          <Image 
            source={{ uri: document.uri }} 
            style={dynamicStyles.documentImage}
            onError={(error) => {
              console.error('Failed to load document thumbnail:', error);
            }}
          />
        )}
        <View style={dynamicStyles.documentInfo}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <DynamicText type="card" style={dynamicStyles.documentName} numberOfLines={1}>
              {document.name.replace(/\.(pdf|jpg|jpeg|png|gif)$/i, '').replace(/_/g, ' ')}
            </DynamicText>
          </View>
          <DynamicText type="card" style={dynamicStyles.documentType}>
            {new Date(document.createdAt).toLocaleDateString()}
          </DynamicText>
          <DynamicText type="card" style={[dynamicStyles.documentType, { fontSize: 10, opacity: 0.7 }]}>
            {document.category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </DynamicText>
      </View>
      <TouchableOpacity
        style={[dynamicStyles.actionButton, { backgroundColor: '#3B82F6' + 'CC' }]}
        onPress={() => viewDocument(document)}
      >
        <DynamicText type="card" style={dynamicStyles.actionButtonText}>👁️</DynamicText>
      </TouchableOpacity>
      <TouchableOpacity
        style={dynamicStyles.actionButton}
        onPress={() => shareDocument(document)}
      >
        <DynamicText type="card" style={dynamicStyles.actionButtonText}>📤</DynamicText>
      </TouchableOpacity>
      <TouchableOpacity
        style={[dynamicStyles.actionButton, { backgroundColor: '#dc2626' + 'CC' }]}
        onPress={() => deleteDocument(document.id)}
      >
        <DynamicText type="card" style={dynamicStyles.actionButtonText}>🗑️</DynamicText>
      </TouchableOpacity>
    </View>
  );
  };

  const renderCategoryCard = (category: DocumentCategory) => {
    const categoryInfo = DOCUMENT_CATEGORIES[category];
    const categoryDocuments = getDocumentsForCategory(category);
    
    return (
      <Animated.View 
        key={category}
        style={[
          dynamicStyles.categoryCard,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <View style={dynamicStyles.categoryHeader}>
          <View style={dynamicStyles.categoryTitleContainer}>
            <DynamicText type="card" style={dynamicStyles.categoryIcon}>{categoryInfo.icon}</DynamicText>
            <DynamicText type="card" style={dynamicStyles.categoryTitle}>{categoryInfo.title}</DynamicText>
          </View>
          <TouchableOpacity
            style={dynamicStyles.scanButton}
            onPress={() => {
              setSelectedCategory(category);
              setShowUploadModal(true);
              triggerHaptic('light');
            }}
          >
            <DynamicText type="card" style={dynamicStyles.scanButtonText}>{t('addDocument')}</DynamicText>
          </TouchableOpacity>
        </View>
        
        <DynamicText type="card" style={dynamicStyles.categoryDescription}>
          {categoryInfo.description}
        </DynamicText>
        
        {categoryDocuments.length > 0 ? (
          categoryDocuments.map(renderDocumentItem)
        ) : (
          <View style={dynamicStyles.emptyState}>
            <DynamicText type="secondary" style={dynamicStyles.emptyStateText}>
              {t('noDocumentsUploaded')}
            </DynamicText>
          </View>
        )}
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      <View style={styles.container}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
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
                source={require('../../assets/AuricRX_home_button_across_screens.png')} 
                style={styles.homeButtonIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>
            
            {/* Selection Mode Controls in Header */}
            <View style={styles.headerSelectionControls}>
              <TouchableOpacity
                style={[styles.selectionButton, isSelectionMode && styles.selectionButtonActive]}
                onPress={toggleSelectionMode}
              >
                <Text style={[styles.selectionButtonText, isSelectionMode && styles.selectionButtonTextActive]}>
                  {isSelectionMode ? t('cancel') : t('multiSelectDoc')}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Selection Actions (below header when in selection mode) */}
          {isSelectionMode && (
            <View style={styles.selectionActions}>
              <TouchableOpacity
                style={styles.selectionActionButton}
                onPress={selectAllDocuments}
              >
                <Text style={styles.selectionActionButtonText}>{t('selectAll')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.selectionActionButton}
                onPress={clearSelection}
              >
                <Text style={styles.selectionActionButtonText}>{t('clear')}</Text>
              </TouchableOpacity>
              
              {selectedDocuments.size > 0 && (
                <TouchableOpacity
                  style={[styles.selectionActionButton, styles.shareSelectedButton]}
                  onPress={shareSelectedDocuments}
                >
                  <Text style={styles.shareSelectedButtonText}>
                    {t('share')} ({selectedDocuments.size})
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Title */}
          <Animated.View 
            style={[
              styles.titleSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <DynamicText type="primary" style={styles.title}>
              🏥 {t('medicalDocuments')}
            </DynamicText>
            <DynamicText type="secondary" style={styles.subtitle}>
              {t('organizeDocuments')}
            </DynamicText>
          </Animated.View>

          {/* Document Categories */}
          {Object.keys(DOCUMENT_CATEGORIES).map(category => 
            renderCategoryCard(category as DocumentCategory)
          )}
        </ScrollView>

        {/* Upload Modal */}
        {showUploadModal && selectedCategory && (
          <View style={dynamicStyles.modalOverlay}>
            <View style={dynamicStyles.modalContent}>
              <DynamicText type="primary" style={dynamicStyles.modalTitle}>
                {t('addDocument')} {DOCUMENT_CATEGORIES[selectedCategory].title}
              </DynamicText>
              
              {DOCUMENT_CATEGORIES[selectedCategory].supportsDualSides ? (
                <>
                  <TouchableOpacity
                    style={dynamicStyles.modalButton}
                    onPress={() => {
                      setShowUploadModal(false);
                      takePhoto(selectedCategory, 'front');
                    }}
                  >
                    <DynamicText type="card" style={dynamicStyles.modalButtonText}>
                      📷 {t('takePhoto')} - {DOCUMENT_CATEGORIES[selectedCategory].frontLabel}
                    </DynamicText>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={dynamicStyles.modalButton}
                    onPress={() => {
                      setShowUploadModal(false);
                      takePhoto(selectedCategory, 'back');
                    }}
                  >
                    <DynamicText type="card" style={dynamicStyles.modalButtonText}>
                      📷 {t('takePhoto')} - {DOCUMENT_CATEGORIES[selectedCategory].backLabel}
                    </DynamicText>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={dynamicStyles.modalButton}
                    onPress={() => {
                      setShowUploadModal(false);
                      uploadDocument(selectedCategory, 'front');
                    }}
                  >
                    <DynamicText type="card" style={dynamicStyles.modalButtonText}>
                      🖼️ {t('uploadFromGallery')} - {DOCUMENT_CATEGORIES[selectedCategory].frontLabel}
                    </DynamicText>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={dynamicStyles.modalButton}
                    onPress={() => {
                      setShowUploadModal(false);
                      uploadDocument(selectedCategory, 'back');
                    }}
                  >
                    <DynamicText type="card" style={dynamicStyles.modalButtonText}>
                      🖼️ {t('uploadFromGallery')} - {DOCUMENT_CATEGORIES[selectedCategory].backLabel}
                    </DynamicText>
                  </TouchableOpacity>
                  
                  {/* PDF upload only for non-photo ID categories */}
                  {selectedCategory !== 'photo_id' && (
                    <>
                      <TouchableOpacity
                        style={[dynamicStyles.modalButton, { backgroundColor: '#8B5CF6' + 'CC' }]}
                        onPress={() => {
                          setShowUploadModal(false);
                          uploadPDF(selectedCategory, 'front');
                        }}
                      >
                        <DynamicText type="card" style={dynamicStyles.modalButtonText}>
                          📄 Upload PDF - {DOCUMENT_CATEGORIES[selectedCategory].frontLabel}
                        </DynamicText>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[dynamicStyles.modalButton, { backgroundColor: '#8B5CF6' + 'CC' }]}
                        onPress={() => {
                          setShowUploadModal(false);
                          uploadPDF(selectedCategory, 'back');
                        }}
                      >
                        <DynamicText type="card" style={dynamicStyles.modalButtonText}>
                          📄 Upload PDF - {DOCUMENT_CATEGORIES[selectedCategory].backLabel}
                        </DynamicText>
                      </TouchableOpacity>
                    </>
                  )}
                </>
              ) : (
                <>
                  <TouchableOpacity
                    style={dynamicStyles.modalButton}
                    onPress={() => {
                      setShowUploadModal(false);
                      takePhoto(selectedCategory, 'single');
                    }}
                  >
                    <DynamicText type="card" style={dynamicStyles.modalButtonText}>
                      📷 {t('takePhoto')}
                    </DynamicText>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={dynamicStyles.modalButton}
                    onPress={() => {
                      setShowUploadModal(false);
                      uploadDocument(selectedCategory, 'single');
                    }}
                  >
                    <DynamicText type="card" style={dynamicStyles.modalButtonText}>
                      🖼️ {t('uploadFromGallery')}
                    </DynamicText>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[dynamicStyles.modalButton, { backgroundColor: '#8B5CF6' + 'CC' }]}
                    onPress={() => {
                      setShowUploadModal(false);
                      uploadPDF(selectedCategory, 'single');
                    }}
                  >
                    <DynamicText type="card" style={dynamicStyles.modalButtonText}>
                      📄 {t('uploadPDF')}
                    </DynamicText>
                  </TouchableOpacity>
                </>
              )}
              
              <TouchableOpacity
                style={dynamicStyles.modalCancelButton}
                onPress={() => {
                  setShowUploadModal(false);
                  setSelectedCategory(null);
                  triggerHaptic('light');
                }}
              >
                <DynamicText type="card" style={dynamicStyles.modalCancelButtonText}>{t('cancel')}</DynamicText>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* View Document Modal */}
        {showViewModal && selectedDocument && (
          <Modal
            visible={showViewModal}
            transparent
            animationType="fade"
            onRequestClose={() => {
              // Clear any pending timeout
              if (imageTimeoutRef.current) {
                clearTimeout(imageTimeoutRef.current);
                imageTimeoutRef.current = null;
              }
              setShowViewModal(false);
              setSelectedDocument(null);
              setImageLoading(false);
              setImageError(false);
            }}
          >
            <View style={dynamicStyles.modalOverlay}>
              <View style={[dynamicStyles.modalContent, { width: '95%', height: '90%' }]}>
                <View style={dynamicStyles.modalHeader}>
                  <DynamicText type="primary" style={dynamicStyles.modalTitle}>
                    {selectedDocument.name}
                  </DynamicText>
                  <TouchableOpacity
                    style={dynamicStyles.closeModalButton}
                    onPress={() => {
                      setShowViewModal(false);
                      setSelectedDocument(null);
                      setImageLoading(false);
                      setImageError(false);
                    }}
                  >
                    <DynamicText type="card" style={dynamicStyles.closeModalButtonText}>✕</DynamicText>
                  </TouchableOpacity>
                </View>
                
                <ScrollView 
                  style={dynamicStyles.documentViewer}
                  contentContainerStyle={dynamicStyles.documentViewerContent}
                >
                  {isPDFFile(selectedDocument) ? (
                    <View style={dynamicStyles.pdfViewer}>
                      <DynamicText type="secondary" style={dynamicStyles.pdfMessage}>
                        PDF Document
                      </DynamicText>
                      <DynamicText type="card" style={dynamicStyles.pdfInfo}>
                        {selectedDocument.name}
                      </DynamicText>
                      <DynamicText type="card" style={dynamicStyles.pdfInfo}>
                        Created: {new Date(selectedDocument.createdAt).toLocaleDateString()}
                      </DynamicText>
                      <DynamicText type="card" style={dynamicStyles.pdfInfo}>
                        URI: {selectedDocument.uri}
                      </DynamicText>
                      
                      <TouchableOpacity
                        style={[dynamicStyles.modalButton, { marginTop: 10, backgroundColor: '#6B7280' + 'CC' }]}
                        onPress={async () => {
                          try {
                            console.log('=== DEBUG INFO ===');
                            console.log('Document URI:', selectedDocument.uri);
                            console.log('Document name:', selectedDocument.name);
                            
                            const fileInfo = await FileSystem.getInfoAsync(selectedDocument.uri);
                            console.log('File info:', fileInfo);
                            
                            // Test different approaches - prioritize Google Drive
                            const approaches = [
                              `https://drive.google.com/viewer?url=${encodeURIComponent(selectedDocument.uri)}&embedded=true`,
                              `https://docs.google.com/gview?url=${encodeURIComponent(selectedDocument.uri)}&embedded=true`,
                              `content://${selectedDocument.uri.replace(/^(file:\/\/|content:\/\/)/, '')}`,
                              selectedDocument.uri
                            ];
                            
                            for (const approach of approaches) {
                              try {
                                const canOpen = await Linking.canOpenURL(approach);
                                console.log(`Approach "${approach}" can open:`, canOpen);
                              } catch (approachError) {
                                console.log(`Approach "${approach}" failed:`, approachError);
                              }
                            }
                            
                            Alert.alert(
                              'Debug Info', 
                              `URI: ${selectedDocument.uri}\nExists: ${fileInfo.exists}\nSize: ${fileInfo.size}\n\nCheck console for detailed logs.`,
                              [{ text: 'OK' }]
                            );
                          } catch (error) {
                            console.error('Debug failed:', error);
                            Alert.alert('Debug Error', error.message);
                          }
                        }}
                      >
                        <DynamicText type="card" style={dynamicStyles.modalButtonText}>
                          🔍 Debug Info
                        </DynamicText>
                      </TouchableOpacity>
                        <TouchableOpacity
                          style={[dynamicStyles.modalButton, { marginTop: 20, backgroundColor: '#ff6b6b' }]}
                          onPress={async () => {
                            try {
                              console.log('=== MODAL PDF FILE DEBUG INFO ===');
                              console.log('Document name:', selectedDocument.name);
                              console.log('Document URI:', selectedDocument.uri);
                              console.log('Document type:', selectedDocument.type);
                              console.log('Document category:', selectedDocument.category);
                              console.log('Document size:', selectedDocument.size);
                              console.log('Document created:', selectedDocument.createdAt);
                              
                              const fileInfo = await FileSystem.getInfoAsync(selectedDocument.uri);
                              console.log('File system info:', fileInfo);
                              console.log('File exists:', fileInfo.exists);
                              console.log('File size:', fileInfo.size);
                              console.log('File URI:', fileInfo.uri);
                              console.log('===================================');
                              
                              Alert.alert(
                                '🔍 File Debug Info',
                                `Name: ${selectedDocument.name}\nURI: ${selectedDocument.uri}\nSize: ${fileInfo.size} bytes\nExists: ${fileInfo.exists}\n\nCheck console for full details.`,
                                [{ text: 'OK' }]
                              );
                            } catch (error) {
                              console.error('Debug failed:', error);
                              Alert.alert('Debug Error', String(error));
                            }
                          }}
                        >
                          <DynamicText type="card" style={dynamicStyles.modalButtonText}>
                            🔍 Debug File Info
                          </DynamicText>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[dynamicStyles.modalButton, { marginTop: 20, backgroundColor: '#4CAF50' }]}
                          onPress={async () => {
                            try {
                              console.log('Attempting to share PDF:', selectedDocument.uri);
                              
                              // Copy the original file to a temporary location
                              const tempFileName = `temp_${Date.now()}_${selectedDocument.name.replace(/[^a-zA-Z0-9.-]/g, '_')}.pdf`;
                              const tempUri = `${FileSystem.cacheDirectory}${tempFileName}`;
                              
                              await FileSystem.copyAsync({
                                from: selectedDocument.uri,
                                to: tempUri,
                              });
                              
                              console.log('Temp PDF file created at:', tempUri);
                              
                 // Use FileProvider to share the PDF
                 try {
                   console.log('Sharing PDF with FileProvider...');
                   
                   // Check if sharing is available
                   const isAvailable = await Sharing.isAvailableAsync();
                   if (!isAvailable) {
                     throw new Error(t('sharingNotAvailablePlatform'));
                   }
                   
                   // Create a content URI using FileProvider
                   const contentUri = `content://com.auricrx.medcoach.fileprovider/cache/${tempFileName}`;
                   
                   // Share the PDF file directly - this will show the app chooser
                   // but it will be filtered to PDF-compatible apps
                   await Sharing.shareAsync(contentUri, {
                     mimeType: 'application/pdf',
                     dialogTitle: `Share ${selectedDocument.name}`,
                   });
                   
                   console.log('PDF shared successfully with FileProvider');
                   setShowViewModal(false);
                   
                   // Clean up temp file after sharing
                   setTimeout(async () => {
                     try {
                       await FileSystem.deleteAsync(tempUri);
                       console.log('Temp file cleaned up');
                     } catch (cleanupError) {
                       console.log('Failed to clean up temp file:', cleanupError);
                     }
                   }, 10000);
                   
                   return;
                   
                 } catch (shareError) {
                   console.log('FileProvider sharing failed:', shareError);
                   
                   // Final fallback - show error
                   Alert.alert('❌ ' + t('error'), 'Failed to share PDF file. Please try a different app.');
                 }
                              
                            } catch (error) {
                              console.error('Failed to share PDF:', error);
                              Alert.alert('❌ ' + t('error'), 'Failed to share PDF file');
                            }
                          }}
                        >
                          <DynamicText type="card" style={dynamicStyles.modalButtonText}>
                            📤 Share PDF
                          </DynamicText>
                        </TouchableOpacity>

                      <TouchableOpacity
                        style={[dynamicStyles.modalButton, { marginTop: 20 }]}
                        onPress={async () => {
                          try {
                              console.log('Attempting to open PDF:', selectedDocument.uri);
                              const fileInfo = await FileSystem.getInfoAsync(selectedDocument.uri);
                              console.log('File info:', fileInfo);
                            
                            if (fileInfo.exists) {
                              // Try direct opening with different URI formats for maximum compatibility
                              const uriFormats = [
                                // Try content:// URI first (most compatible with Android)
                                `content://${selectedDocument.uri.replace(/^(file:\/\/|content:\/\/)/, '')}`,
                                // Try original URI
                                selectedDocument.uri,
                                // Try file:// format
                                `file://${selectedDocument.uri.replace('file://', '')}`
                              ];
                              
                              let opened = false;
                              for (const uri of uriFormats) {
                                try {
                                  console.log('Trying to open PDF from modal with URI:', uri);
                                  const canOpen = await Linking.canOpenURL(uri);
                                  console.log('Can open:', canOpen);
                                  
                            if (canOpen) {
                                    await Linking.openURL(uri);
                                    console.log('PDF opened successfully from modal with URI:', uri);
                                    setShowViewModal(false);
                                    opened = true;
                                    break;
                                  }
                                } catch (error) {
                                  console.log('URI failed:', uri, error);
                                }
                              }
                              
                              if (!opened) {
                                console.log('Direct opening from modal failed, trying IntentLauncher with VIEW action');
                                
                                // Fallback to IntentLauncher with VIEW action for direct opening
                                try {
                                  await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
                                    data: selectedDocument.uri,
                                    type: 'application/pdf',
                                    flags: 1, // FLAG_ACTIVITY_NEW_TASK
                                  });
                                  
                                  console.log('PDF opened successfully from modal with IntentLauncher VIEW');
                                  setShowViewModal(false);
                                  return;
                                  
                                } catch (intentError) {
                                  console.log('IntentLauncher VIEW from modal failed:', intentError);
                                  
                                  // Final fallback - show error
                                  Alert.alert(
                                    '❌ Cannot Open PDF', 
                                    'Unable to open PDF file. Please make sure you have a PDF viewer app installed.',
                                    [{ text: 'OK' }]
                                  );
                                }
                              }
                            } else {
                              Alert.alert('❌ ' + t('error'), 'PDF file not found. Please try uploading again.');
                            }
                          } catch (error) {
                            console.error('Failed to open PDF:', error);
                            Alert.alert('❌ ' + t('error'), 'Failed to open PDF file. Please try again.');
                          }
                        }}
                      >
                        <DynamicText type="card" style={dynamicStyles.modalButtonText}>
                          📄 Open PDF
                        </DynamicText>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={dynamicStyles.imageViewer}>
                      <DynamicText type="card" style={[dynamicStyles.pdfInfo, { marginBottom: 10, textAlign: 'center' }]}>
                        📷 {selectedDocument.name.replace(/\.(jpg|jpeg|png|gif|webp|bmp)$/i, '').replace(/_/g, ' ')}
                      </DynamicText>
                      
                      {imageLoading && !imageError && (
                        <View style={dynamicStyles.loadingContainer}>
                          <DynamicText type="card" style={dynamicStyles.loadingText}>
                            📷 Loading image...
                          </DynamicText>
                          <TouchableOpacity
                            style={[dynamicStyles.modalButton, { marginTop: 10, backgroundColor: '#6B7280' }]}
                            onPress={() => {
                              console.log('⏰ Manual timeout triggered by user');
                              setImageLoading(false);
                              setImageError(true);
                            }}
                          >
                            <DynamicText type="card" style={dynamicStyles.modalButtonText}>
                              ⏰ Stop Loading
                            </DynamicText>
                          </TouchableOpacity>
                        </View>
                      )}
                      
                      {imageError && (
                        <View style={dynamicStyles.loadingContainer}>
                          <DynamicText type="card" style={[dynamicStyles.loadingText, { color: '#EF4444' }]}>
                            ❌ Failed to load image
                          </DynamicText>
                          <DynamicText type="card" style={[dynamicStyles.pdfInfo, { marginTop: 10, textAlign: 'center' }]}>
                            The image file may be corrupted or in an unsupported format.
                          </DynamicText>
                          <TouchableOpacity
                            style={[dynamicStyles.modalButton, { marginTop: 10, backgroundColor: '#3B82F6' }]}
                            onPress={async () => {
                              try {
                                console.log('🔍 Retrying image conversion to data URI...');
                                
                                setImageError(false);
                                setImageLoading(true);
                                setImageDataUri(null);
                                
                                // Convert image to data URI
                                const dataUri = await convertImageToDataUri(selectedDocument.uri);
                                if (dataUri) {
                                  setImageDataUri(dataUri);
                                  setImageLoading(false);
                                  setImageError(false);
                                  console.log('✅ Image retry successful - converted to data URI');
                                } else {
                                  console.log('❌ Failed to convert image to data URI on retry');
                                  setImageLoading(false);
                                  setImageError(true);
                                }
                                
                              } catch (error) {
                                console.error('❌ Retry failed:', error);
                                setImageLoading(false);
                                setImageError(true);
                                Alert.alert('❌ Error', 'Failed to retry: ' + (error as Error).message);
                              }
                            }}
                          >
                            <DynamicText type="card" style={dynamicStyles.modalButtonText}>
                              🔄 Retry
                            </DynamicText>
                          </TouchableOpacity>
                        </View>
                      )}
                      
                      {!imageLoading && !imageError && (
                      <Image 
                          source={{ uri: imageDataUri || decodeURIComponent(decodeURIComponent(selectedDocument.uri)) }} 
                        style={dynamicStyles.fullSizeImage}
                        resizeMode="contain"
                          onLoadStart={() => {
                            console.log('🖼️ Image loading started');
                            console.log('🖼️ Using URI:', imageDataUri ? 'Data URI' : 'Original URI');
                            setImageLoading(true);
                            setImageError(false);
                          }}
                          onLoad={() => {
                            console.log('✅ Image loaded successfully');
                            console.log('✅ Data URI length:', imageDataUri?.length || 'N/A');
                            // Clear timeout if image loads successfully
                            if (imageTimeoutRef.current) {
                              clearTimeout(imageTimeoutRef.current);
                              imageTimeoutRef.current = null;
                            }
                            setImageLoading(false);
                            setImageError(false);
                          }}
                        onError={(error) => {
                            console.error('❌ Failed to load image:', error);
                            console.error('❌ Image URI:', selectedDocument.uri);
                            console.error('❌ Error details:', JSON.stringify(error, null, 2));
                            
                            // Try different URI formats
                            const originalUri = selectedDocument.uri;
                            const singleDecoded = decodeURIComponent(originalUri);
                            const doubleDecoded = decodeURIComponent(singleDecoded);
                            
                            console.log('🔍 Trying different URI formats:');
                            console.log('🔍 Original:', originalUri);
                            console.log('🔍 Single decoded:', singleDecoded);
                            console.log('🔍 Double decoded:', doubleDecoded);
                            
                            // Check if file exists with different URI formats
                            FileSystem.getInfoAsync(originalUri).then(info => {
                              console.log('📁 Original URI exists:', info.exists);
                            });
                            FileSystem.getInfoAsync(singleDecoded).then(info => {
                              console.log('📁 Single decoded URI exists:', info.exists);
                            });
                            FileSystem.getInfoAsync(doubleDecoded).then(info => {
                              console.log('📁 Double decoded URI exists:', info.exists);
                            });
                            
                            // Clear timeout if image fails to load
                            if (imageTimeoutRef.current) {
                              clearTimeout(imageTimeoutRef.current);
                              imageTimeoutRef.current = null;
                            }
                            setImageLoading(false);
                            setImageError(true);
                            // Don't show error alert for PDFs being displayed as images
                            if (!isPDFFile(selectedDocument)) {
                          Alert.alert('❌ ' + t('error'), 'Failed to load image. The file may be corrupted or in an unsupported format.');
                            }
                          }}
                          onLoadEnd={() => {
                            console.log('🔄 Image load ended (success or failure):', selectedDocument.uri);
                            // Don't automatically reset loading state here - let timeout handle it
                            // setImageLoading(false);
                          }}
                        />
                      )}
                      
                      {/* Debug URI display */}
                      <DynamicText type="card" style={[dynamicStyles.pdfInfo, { marginTop: 10, fontSize: 10, opacity: 0.5 }]}>
                        Debug - Original: {selectedDocument.uri}
                      </DynamicText>
                      <DynamicText type="card" style={[dynamicStyles.pdfInfo, { marginTop: 2, fontSize: 10, opacity: 0.5 }]}>
                        Debug - Decoded: {decodeURIComponent(selectedDocument.uri)}
                      </DynamicText>
                      <DynamicText type="card" style={[dynamicStyles.pdfInfo, { marginTop: 2, fontSize: 10, opacity: 0.5 }]}>
                        Debug - Data URI: {imageDataUri ? 'Available (' + imageDataUri.length + ' chars)' : 'Not available'}
                      </DynamicText>
                      <DynamicText type="card" style={[dynamicStyles.pdfInfo, { marginTop: 2, fontSize: 10, opacity: 0.5 }]}>
                        Debug - Loading: {imageLoading ? 'Yes' : 'No'}, Error: {imageError ? 'Yes' : 'No'}
                      </DynamicText>
                      
                      {isPDFFile(selectedDocument) && (
                        <DynamicText type="card" style={[dynamicStyles.pdfInfo, { marginTop: 10, color: '#6B7280' }]}>
                          Note: PDF preview not available. Use "Open PDF" button below to view.
                        </DynamicText>
                      )}
                    </View>
                  )}
                </ScrollView>
                
                <View style={dynamicStyles.modalActions}>
                  <TouchableOpacity
                    style={[dynamicStyles.modalButton, { flex: 1, marginRight: 8 }]}
                    onPress={() => shareDocument(selectedDocument)}
                  >
                    <DynamicText type="card" style={dynamicStyles.modalButtonText}>📤 Share</DynamicText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[dynamicStyles.modalButton, { flex: 1, marginLeft: 8, backgroundColor: '#dc2626' + 'CC' }]}
                    onPress={() => {
                      setShowViewModal(false);
                      setSelectedDocument(null);
                      deleteDocument(selectedDocument.id);
                    }}
                  >
                    <DynamicText type="card" style={dynamicStyles.modalButtonText}>🗑️ Delete</DynamicText>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}

        {/* PDF Viewer Modal */}
        {showPDFViewer && selectedDocument && (
          <Modal
            visible={showPDFViewer}
            animationType="slide"
            presentationStyle="fullScreen"
            onRequestClose={() => setShowPDFViewer(false)}
          >
            <PDFViewer
              uri={selectedDocument.uri}
              name={selectedDocument.name}
              onClose={() => setShowPDFViewer(false)}
              theme={currentTheme}
            />
          </Modal>
        )}

        {/* Dual ID Viewer Modal */}
        {showDualIDViewer && (
          <Modal
            visible={showDualIDViewer}
            animationType="slide"
            presentationStyle="fullScreen"
            onRequestClose={() => setShowDualIDViewer(false)}
          >
            <View style={[dynamicStyles.modalContainer, { backgroundColor: '#F8F9FA', paddingTop: Platform.OS === 'ios' ? 50 : 25 }]}>
              <View style={[dynamicStyles.modalHeader, { paddingTop: 10, paddingBottom: 10, position: 'relative' }]}>
                <TouchableOpacity
                  style={[dynamicStyles.closeButton, { position: 'absolute', left: 20, zIndex: 1 }]}
                  onPress={() => setShowDualIDViewer(false)}
                >
                  <DynamicText type="card" style={dynamicStyles.closeButtonText}>✕</DynamicText>
                </TouchableOpacity>
                <DynamicText type="card" style={[dynamicStyles.modalTitle, { fontSize: 16, textAlign: 'center', flex: 1 }]}>
                  ID Document - Front & Back
                </DynamicText>
      </View>
              
              <View style={[dynamicStyles.dualIDContainer, { flex: 1 }]}>
                <ScrollView 
                  style={[dynamicStyles.dualIDScrollView, { flex: 1 }]} 
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 80 }}
                >
                  {/* Front Side */}
                  <View style={dynamicStyles.idSideContainer}>
                    <DynamicText type="card" style={dynamicStyles.idSideLabel}>
                      📷 Front Side
                    </DynamicText>
                    <View style={dynamicStyles.idImageContainer}>
                      {imageLoading ? (
                        <View style={dynamicStyles.loadingContainer}>
                          <ActivityIndicator size="large" color="#3B82F6" />
                          <DynamicText type="card" style={dynamicStyles.loadingText}>
                            Loading front image...
                          </DynamicText>
    </View>
                      ) : imageError || !imageDataUri ? (
                        <View style={dynamicStyles.emptyIDContainer}>
                          <DynamicText type="card" style={dynamicStyles.emptyIDText}>
                            📷 No front image available
                          </DynamicText>
                          <DynamicText type="card" style={[dynamicStyles.pdfInfo, { marginTop: 10, textAlign: 'center' }]}>
                            Upload a front image to see it here
                          </DynamicText>
                        </View>
                      ) : (
                        <Image 
                          source={{ uri: imageDataUri }} 
                          style={dynamicStyles.idImage}
                          resizeMode="contain"
                          onLoad={() => console.log('✅ Front ID image loaded')}
                          onError={(e) => console.log('❌ Front ID image failed:', e.nativeEvent.error)}
                        />
                      )}
                    </View>
                  </View>

                  {/* Back Side */}
                  <View style={dynamicStyles.idSideContainer}>
                    <DynamicText type="card" style={dynamicStyles.idSideLabel}>
                      📷 Back Side
                    </DynamicText>
                    <View style={dynamicStyles.idImageContainer}>
                      {imageLoading ? (
                        <View style={dynamicStyles.loadingContainer}>
                          <ActivityIndicator size="large" color="#3B82F6" />
                          <DynamicText type="card" style={dynamicStyles.loadingText}>
                            Loading back image...
                          </DynamicText>
                        </View>
                      ) : imageError || !backImageDataUri ? (
                        <View style={dynamicStyles.emptyIDContainer}>
                          <DynamicText type="card" style={dynamicStyles.emptyIDText}>
                            📷 No back image available
                          </DynamicText>
                          <DynamicText type="card" style={[dynamicStyles.pdfInfo, { marginTop: 10, textAlign: 'center' }]}>
                            Upload a back image to see it here
                          </DynamicText>
                        </View>
                      ) : (
                        <Image 
                          source={{ uri: backImageDataUri }} 
                          style={dynamicStyles.idImage}
                          resizeMode="contain"
                          onLoad={() => console.log('✅ Back ID image loaded')}
                          onError={(e) => console.log('❌ Back ID image failed:', e.nativeEvent.error)}
                        />
                      )}
                    </View>
                  </View>
                </ScrollView>

                {/* Action Buttons - Fixed at bottom */}
                <View style={[dynamicStyles.dualIDActions, { 
                  paddingBottom: Platform.OS === 'ios' ? 20 : 10,
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                }]}>
                  <TouchableOpacity
                    style={[dynamicStyles.modalButton, { 
                      backgroundColor: '#F59E0B', 
                      marginRight: 8,
                      paddingVertical: 10,
                      paddingHorizontal: 16,
                      width: 100,
                      height: 42,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }]}
                    onPress={async () => {
                      try {
                        setShowDualIDViewer(false);
                        
        if (!idPair || !idPair.front || !idPair.back) {
          Alert.alert('❌ Error', 'Both front and back images are required');
          return;
        }

                        console.log('🔄 Creating PDF with both ID images and AuricRX logo...');
                        
                        // Convert images to base64 for embedding in PDF
                        const frontBase64 = await convertImageToDataUri(idPair.front.uri);
                        const backBase64 = await convertImageToDataUri(idPair.back.uri);
                        
                        if (!frontBase64 || !backBase64) {
                          Alert.alert('❌ ' + t('error'), t('failedToProcessImages'));
                          return;
                        }

                        // Try to load the AuricRX logo using fetch approach
                        let logoBase64 = null;
                        try {
                          console.log('🔄 Loading AuricRX logo...');
                          
                          // Get the logo URI - using the document logo
                          const logoSource = require('../../assets/AuricRX Document Logo.png');
                          const logoUri = Image.resolveAssetSource(logoSource).uri;
                          console.log('🔄 Logo URI:', logoUri);
                          
                          // Try using fetch to get the image as blob, then convert to base64
                          const response = await fetch(logoUri);
                          const blob = await response.blob();
                          console.log('🔄 Blob size:', blob.size);
                          
                          // Convert blob to base64
                          const reader = new FileReader();
                          const base64Promise = new Promise((resolve, reject) => {
                            reader.onload = () => resolve(reader.result);
                            reader.onerror = reject;
                          });
                          reader.readAsDataURL(blob);
                          const dataUrl = await base64Promise;
                          
                          logoBase64 = dataUrl;
                          console.log('✅ Logo loaded successfully via fetch, length:', dataUrl.length);
                        } catch (error) {
                          console.log('❌ Logo loading failed:', error.message);
                          console.log('🔄 Will use text fallback instead');
                          logoBase64 = null;
                        }
                        
                        // Create a professional HTML template with the AuricRX logo
                        const htmlContent = `
                          <html>
                          <head>
                            <title>AuricRX ID Document</title>
                            <style>
                              body { 
                                font-family: Arial, sans-serif; 
                                margin: 0; 
                                padding: 20px; 
                                background: white;
                              }
                              .header { 
                                text-align: center; 
                                margin-bottom: 20px; 
                                padding: 20px;
                                background: transparent;
                                color: #333;
                              }
                              .logo-container {
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                margin-bottom: 10px;
                              }
                              .logo-text { 
                                font-size: 28px; 
                                font-weight: bold; 
                                color: white;
                                text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
                              }
                              .ar-text {
                                font-size: 36px;
                                font-weight: 900;
                                letter-spacing: 2px;
                              }
                              .subtitle { 
                                font-size: 16px; 
                                color: rgba(255,255,255,0.9);
                                margin-top: 5px;
                              }
                              .document-title {
                                text-align: center;
                                font-size: 20px;
                                font-weight: bold;
                                color: #333;
                                margin: 20px 0;
                                padding: 10px;
                                border-bottom: 2px solid #C5860A;
                              }
                              .id-section { 
                                margin: 30px 0; 
                                text-align: center;
                                page-break-inside: avoid;
                              }
                              .id-label { 
                                font-weight: bold; 
                                margin-bottom: 15px;
                                font-size: 18px;
                                color: #333;
                                background: #f8f9fa;
                                padding: 10px;
                                border-radius: 8px;
                                border-left: 4px solid #C5860A;
                              }
                              .id-image { 
                                max-width: 100%; 
                                height: auto; 
                                margin: 15px 0;
                                border-radius: 8px;
                                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                                border: 2px solid #e9ecef;
                              }
                              .footer {
                                text-align: center;
                                margin-top: 40px;
                                padding-top: 20px;
                                border-top: 2px solid #C5860A;
                                font-size: 12px;
                                color: #666;
                              }
                              .single-page-layout {
                                margin: 30px 0;
                                page-break-inside: avoid;
                              }
                              .id-images-container {
                                display: flex;
                                justify-content: space-between;
                                gap: 20px;
                                margin-top: 20px;
                              }
                              .id-image-wrapper {
                                flex: 1;
                                text-align: center;
                              }
                              .id-side-label {
                                font-weight: bold;
                                margin-bottom: 10px;
                                font-size: 16px;
                                color: #333;
                                background: #f8f9fa;
                                padding: 8px;
                                border-radius: 6px;
                                border-left: 3px solid #C5860A;
                              }
                              .id-image-side {
                                max-width: 100%;
                                height: auto;
                                border-radius: 8px;
                                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                                border: 2px solid #e9ecef;
                              }
                            </style>
                          </head>
                          <body>
                            <div class="header">
                              ${logoBase64 ? `
                                <img src="${logoBase64}" style="max-width: 120px; height: auto; margin: 10px auto; display: block;" alt="AuricRX Logo" />
                              ` : `
                                <div style="text-align: center; margin: 20px 0;">
                                  <div style="font-size: 32px; font-weight: 700; color: #333;">
                                    AURIC<span style="color: #C5860A;">RX</span>
                                  </div>
                                  <div style="font-size: 14px; color: #666; margin-top: 5px;">Medical Coach App</div>
                                </div>
                              `}
                            </div>
                            
                            <div class="document-title">
                              📋 Medical ID Document
                            </div>
                            
                            <!-- Single page layout with both IDs side by side -->
                            <div class="single-page-layout">
                              <div class="id-label">🆔 Front & Back ID Document</div>
                              <div class="id-images-container">
                                <div class="id-image-wrapper">
                                  <div class="id-side-label">Front</div>
                                  <img src="${frontBase64}" class="id-image-side" alt="ID Front" />
                                </div>
                                <div class="id-image-wrapper">
                                  <div class="id-side-label">Back</div>
                                  <img src="${backBase64}" class="id-image-side" alt="ID Back" />
                                </div>
                              </div>
                            </div>
                            
                            <div class="footer">
                              <div style="font-weight: bold; color: #C5860A;">Generated by AuricRX Medical Coach App</div>
                              <div style="margin-top: 5px;">Secure • Professional • Reliable</div>
                              <div style="margin-top: 10px; font-size: 10px;">
                                Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
                              </div>
                            </div>
                          </body>
                          </html>
                        `;

                        // Try a different approach - create HTML file first, then convert
                        const htmlFileUri = `${FileSystem.documentDirectory}auricrx_id_${Date.now()}.html`;
                        console.log('📄 Creating HTML file first...');
                        
                        await FileSystem.writeAsStringAsync(htmlFileUri, htmlContent);
                        
                        // Generate PDF using expo-print with the HTML file
                        console.log('📄 Generating PDF from HTML file...');
                        const { uri } = await Print.printToFileAsync({
                          html: htmlContent,
                          base64: false,
                          width: 8.5 * 72, // 8.5 inches in points (72 points per inch)
                          height: 11 * 72, // 11 inches in points
                        });

                        console.log('✅ PDF created successfully:', uri);
                        
                        // Check if the PDF file exists
                        const fileInfo = await FileSystem.getInfoAsync(uri);
                        console.log('🔍 PDF file exists:', fileInfo.exists);
                        console.log('🔍 PDF file size:', fileInfo.size);
                        console.log('🔍 PDF file URI:', fileInfo.uri);
                        
                        if (!fileInfo.exists) {
                          Alert.alert('❌ ' + t('error'), t('pdfNotCreated'));
                          return;
                        }
                        
                        // Try to determine if it's actually a PDF by checking the file
                        const fileContent = await FileSystem.readAsStringAsync(uri, {
                          encoding: FileSystem.EncodingType.Base64,
                        });
                        console.log('🔍 File content starts with:', fileContent.substring(0, 50));
                        
                        // Check if it starts with PDF header
                        const isPDF = fileContent.startsWith('JVBERi0') || fileContent.startsWith('iVBORw0KGgo');
                        console.log('🔍 Is PDF format:', isPDF);
                        
                        if (!isPDF) {
                          console.log('⚠️ File is not a PDF, trying different approach...');
                          
                          // Try creating a simple PDF manually
                          const simplePdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 100
>>
stream
BT
/F1 12 Tf
100 700 Td
(AuricRX ID Document) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000204 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
354
%%EOF`;
                          
                          const manualPdfUri = `${FileSystem.documentDirectory}auricrx_id_manual_${Date.now()}.pdf`;
                          await FileSystem.writeAsStringAsync(manualPdfUri, simplePdfContent);
                          
                          console.log('✅ Manual PDF created:', manualPdfUri);
                          
                          // Share the manual PDF
                          const isAvailable = await Sharing.isAvailableAsync();
                          if (isAvailable) {
                            await Sharing.shareAsync(manualPdfUri, {
                              mimeType: 'application/pdf',
                              dialogTitle: `Share AuricRX ID Document: ${idPair && idPair.front ? idPair.front.name : 'ID Document'}`,
                            });
                            console.log('✅ Manual PDF shared successfully');
                          } else {
                            await Share.share({
                              message: `AuricRX ID Document: ${idPair && idPair.front ? idPair.front.name : 'ID Document'} (Front & Back)`,
                              url: manualPdfUri,
                              title: 'ID Document PDF',
                            });
                            console.log('✅ Manual PDF shared successfully with Share API');
                          }
                        } else {
                          // Share the PDF using expo-sharing
                          console.log('📤 Sharing PDF with expo-sharing...');
                          const isAvailable = await Sharing.isAvailableAsync();
                          if (isAvailable) {
                            await Sharing.shareAsync(uri, {
                              mimeType: 'application/pdf',
                              dialogTitle: `Share AuricRX ID Document: ${idPair && idPair.front ? idPair.front.name : 'ID Document'}`,
                            });
                            console.log('✅ ID PDF shared successfully with expo-sharing');
                          } else {
                            // Fallback to React Native Share API
                            await Share.share({
                              message: `AuricRX ID Document: ${idPair && idPair.front ? idPair.front.name : 'ID Document'} (Front & Back)`,
                              url: uri,
                              title: 'ID Document PDF',
                            });
                            console.log('✅ ID PDF shared successfully with Share API');
                          }
                        }
                        
                      } catch (error) {
                        console.error('❌ Error creating/sharing PDF:', error);
                        Alert.alert('❌ Error', 'Failed to create or share PDF: ' + error.message);
                      }
                    }}
                  >
                    <DynamicText type="card" style={[dynamicStyles.modalButtonText, { fontSize: 12, textAlign: 'center' }]}>
                      📤 Share
                    </DynamicText>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[dynamicStyles.modalButton, { 
                      backgroundColor: '#EF4444',
                      paddingVertical: 10,
                      paddingHorizontal: 16,
                      width: 100,
                      height: 42,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }]}
                    onPress={() => {
                      Alert.alert(
                        'Delete ID Documents',
                        'Are you sure you want to delete both front and back ID documents?',
                        [
                          { text: t('cancel'), style: 'cancel' },
                          { 
                            text: 'Delete', 
                            style: 'destructive',
                            onPress: () => {
                              if (idPair && idPair.front) deleteDocument(idPair.front);
                              if (idPair && idPair.back) deleteDocument(idPair.back);
                              setShowDualIDViewer(false);
                            }
                          }
                        ]
                      );
                    }}
                  >
                    <DynamicText type="card" style={[dynamicStyles.modalButtonText, { fontSize: 12, textAlign: 'center' }]}>
                      🗑️ Delete
                    </DynamicText>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}

        {/* Removed Sharing Options Modal - now using direct sharing */}

        {/* Removed Doctor Selection Modal - no longer using doctor contacts */}
      </View>
    </View>
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
    justifyContent: 'space-between',
    marginBottom: 24,
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
  // Header selection controls
  headerSelectionControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleSection: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  // Doctor Selection Modal Styles
  doctorCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  doctorInfo: {
    marginBottom: 8,
  },
  doctorName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  doctorSpecialty: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  doctorClinic: {
    fontSize: 12,
    color: '#9ca3af',
  },
  doctorContactInfo: {
    flexDirection: 'row',
    gap: 16,
  },
  doctorContactButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
    gap: 10,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  contactButtonIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  contactButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  contactMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  contactIcon: {
    fontSize: 14,
  },
  contactText: {
    fontSize: 12,
    color: '#6b7280',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 20,
    textAlign: 'center',
  },
  // Selection controls styles
  selectionControls: {
    marginBottom: 16,
  },
  selectionButton: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    minWidth: 120,
  },
  selectionButtonActive: {
    backgroundColor: '#3b82f6',
  },
  selectionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  selectionButtonTextActive: {
    color: '#ffffff',
  },
  selectionActions: {
    flexDirection: 'row',
    marginTop: 12,
    marginBottom: 16,
    gap: 8,
    flexWrap: 'wrap',
  },
  selectionActionButton: {
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  selectionActionButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
  },
  shareSelectedButton: {
    backgroundColor: '#10b981',
  },
  shareSelectedButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  // Checkbox styles
  checkbox: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 10,
    width: 24,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  checkboxText: {
    fontSize: 16,
  },
});
