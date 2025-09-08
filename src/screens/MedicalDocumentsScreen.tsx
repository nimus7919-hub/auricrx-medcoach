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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system';
import { useTranslation } from 'react-i18next';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface MedicalDocumentsScreenProps {
  onClose: () => void;
  theme?: any;
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

const DOCUMENT_CATEGORIES = {
  photo_id: {
    title: 'Photo ID',
    icon: '🆔',
    description: 'Driver\'s License, Passport, etc.',
    supportsDualSides: true,
    frontLabel: 'Front Side',
    backLabel: 'Back Side'
  },
  birth_certificate: {
    title: 'Birth Certificate',
    icon: '📋',
    description: 'Official birth certificate',
    supportsDualSides: false
  },
  insurance: {
    title: 'Insurance Card',
    icon: '🏥',
    description: 'Health insurance information',
    supportsDualSides: true,
    frontLabel: 'Front of Card',
    backLabel: 'Back of Card'
  },
  lab_results: {
    title: 'Lab Results',
    icon: '🧪',
    description: 'Blood tests, lab work, etc.',
    supportsDualSides: false
  },
  prescriptions: {
    title: 'Prescriptions',
    icon: '💊',
    description: 'Current and past prescriptions',
    supportsDualSides: false
  },
  medical_records: {
    title: 'Medical Records',
    icon: '📄',
    description: 'Medical history, reports',
    supportsDualSides: false
  },
  other: {
    title: 'Other Documents',
    icon: '📸',
    description: 'Any other medical documents',
    supportsDualSides: false
  }
};

export default function MedicalDocumentsScreen({ onClose, theme }: MedicalDocumentsScreenProps) {
  const { t } = useTranslation();
  
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
      backgroundColor: currentTheme.card,
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: currentTheme.chip,
    },
    categoryHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    categoryIcon: {
      fontSize: 24,
      marginRight: 12,
    },
    categoryTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: currentTheme.text,
      flex: 1,
    },
    categoryDescription: {
      fontSize: 14,
      color: currentTheme.sub,
      marginBottom: 12,
    },
    documentItem: {
      backgroundColor: currentTheme.chip,
      padding: 12,
      borderRadius: 8,
      marginBottom: 8,
      flexDirection: 'row',
      alignItems: 'center',
    },
    documentImage: {
      width: 40,
      height: 40,
      borderRadius: 6,
      marginRight: 12,
    },
    documentInfo: {
      flex: 1,
    },
    documentName: {
      fontSize: 14,
      fontWeight: '500',
      color: currentTheme.text,
    },
    documentType: {
      fontSize: 12,
      color: currentTheme.sub,
    },
    actionButton: {
      backgroundColor: currentTheme.accent,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
      marginLeft: 8,
    },
    actionButtonText: {
      color: currentTheme.text,
      fontSize: 12,
      fontWeight: '600',
    },
    scanButton: {
      backgroundColor: currentTheme.accent,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
    },
    scanButtonText: {
      color: currentTheme.text,
      fontSize: 14,
      fontWeight: '600',
      marginLeft: 8,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 20,
    },
    emptyStateText: {
      fontSize: 14,
      color: currentTheme.sub,
      textAlign: 'center',
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
      width: '85%',
      alignItems: 'center',
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: currentTheme.text,
      marginBottom: 16,
    },
    modalButton: {
      backgroundColor: currentTheme.accent,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 8,
      alignItems: 'center',
      marginBottom: 12,
      width: '100%',
    },
    modalButtonText: {
      color: currentTheme.text,
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
      borderColor: currentTheme.chip,
    },
    modalCancelButtonText: {
      color: currentTheme.sub,
      fontSize: 16,
      fontWeight: '500',
    },
  });
  
  const dynamicStyles = getDynamicStyles();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
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
          '📱 Permission Required',
          'Please grant camera roll access to upload documents.',
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

  const uploadDocument = async (category: DocumentCategory, type: 'front' | 'back' | 'single' = 'single') => {
    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) return;

      triggerHaptic('light');

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: false,
        quality: 0.8,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const newDocument: DocumentItem = {
          id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: `${DOCUMENT_CATEGORIES[category].title} - ${type === 'single' ? 'Document' : type === 'front' ? DOCUMENT_CATEGORIES[category].frontLabel : DOCUMENT_CATEGORIES[category].backLabel}`,
          uri: asset.uri,
          type,
          category,
          createdAt: new Date().toISOString(),
          size: asset.fileSize,
        };

        const updatedDocuments = [...documents, newDocument];
        await saveDocuments(updatedDocuments);
        
        triggerHaptic('medium');
        Alert.alert('✅ Success', 'Document uploaded successfully!');
      }
    } catch (error) {
      console.error('Failed to upload document:', error);
      Alert.alert('❌ Error', 'Failed to upload document');
    }
  };

  const takePhoto = async (category: DocumentCategory, type: 'front' | 'back' | 'single' = 'single') => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          '📷 Permission Required',
          'Please grant camera access to take photos.',
          [{ text: 'OK' }]
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
          name: `${DOCUMENT_CATEGORIES[category].title} - ${type === 'single' ? 'Document' : type === 'front' ? DOCUMENT_CATEGORIES[category].frontLabel : DOCUMENT_CATEGORIES[category].backLabel}`,
          uri: asset.uri,
          type,
          category,
          createdAt: new Date().toISOString(),
          size: asset.fileSize,
        };

        const updatedDocuments = [...documents, newDocument];
        await saveDocuments(updatedDocuments);
        
        triggerHaptic('medium');
        Alert.alert('✅ Success', 'Photo taken successfully!');
      }
    } catch (error) {
      console.error('Failed to take photo:', error);
      Alert.alert('❌ Error', 'Failed to take photo');
    }
  };

  const deleteDocument = async (documentId: string) => {
    triggerHaptic('heavy');
    Alert.alert(
      '🗑️ Delete Document',
      'Are you sure you want to delete this document? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
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
      await Share.share({
        url: document.uri,
        title: document.name,
      });
    } catch (error) {
      console.error('Failed to share document:', error);
    }
  };

  const getDocumentsForCategory = (category: DocumentCategory) => {
    return documents.filter(doc => doc.category === category);
  };

  const renderDocumentItem = (document: DocumentItem) => (
    <View key={document.id} style={dynamicStyles.documentItem}>
      <Image source={{ uri: document.uri }} style={dynamicStyles.documentImage} />
      <View style={dynamicStyles.documentInfo}>
        <Text style={dynamicStyles.documentName}>{document.name}</Text>
        <Text style={dynamicStyles.documentType}>
          {new Date(document.createdAt).toLocaleDateString()}
        </Text>
      </View>
      <TouchableOpacity
        style={dynamicStyles.actionButton}
        onPress={() => shareDocument(document)}
      >
        <Text style={dynamicStyles.actionButtonText}>📤</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[dynamicStyles.actionButton, { backgroundColor: '#dc2626' }]}
        onPress={() => deleteDocument(document.id)}
      >
        <Text style={dynamicStyles.actionButtonText}>🗑️</Text>
      </TouchableOpacity>
    </View>
  );

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
          <Text style={dynamicStyles.categoryIcon}>{categoryInfo.icon}</Text>
          <Text style={dynamicStyles.categoryTitle}>{categoryInfo.title}</Text>
          <TouchableOpacity
            style={dynamicStyles.scanButton}
            onPress={() => {
              setSelectedCategory(category);
              setShowUploadModal(true);
              triggerHaptic('light');
            }}
          >
            <Text style={dynamicStyles.scanButtonText}>📷 Add</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={dynamicStyles.categoryDescription}>
          {categoryInfo.description}
        </Text>
        
        {categoryDocuments.length > 0 ? (
          categoryDocuments.map(renderDocumentItem)
        ) : (
          <View style={dynamicStyles.emptyState}>
            <Text style={dynamicStyles.emptyStateText}>
              No documents uploaded yet
            </Text>
          </View>
        )}
      </Animated.View>
    );
  };

  return (
    <LinearGradient colors={[currentTheme.bgStart, currentTheme.bgEnd, '#f0ede8']} style={styles.container}>
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
                source={require('../../assets/AuricRX_home_button.png')} 
                style={styles.homeButtonIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </Animated.View>

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
            <Text style={[styles.title, { color: currentTheme.text }]}>
              🏥 Medical Documents
            </Text>
            <Text style={[styles.subtitle, { color: currentTheme.sub }]}>
              Keep your important medical documents organized and ready for doctor visits
            </Text>
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
              <Text style={dynamicStyles.modalTitle}>
                Add {DOCUMENT_CATEGORIES[selectedCategory].title}
              </Text>
              
              {DOCUMENT_CATEGORIES[selectedCategory].supportsDualSides ? (
                <>
                  <TouchableOpacity
                    style={dynamicStyles.modalButton}
                    onPress={() => {
                      setShowUploadModal(false);
                      uploadDocument(selectedCategory, 'front');
                    }}
                  >
                    <Text style={dynamicStyles.modalButtonText}>
                      📷 Take Photo - {DOCUMENT_CATEGORIES[selectedCategory].frontLabel}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={dynamicStyles.modalButton}
                    onPress={() => {
                      setShowUploadModal(false);
                      uploadDocument(selectedCategory, 'back');
                    }}
                  >
                    <Text style={dynamicStyles.modalButtonText}>
                      📷 Take Photo - {DOCUMENT_CATEGORIES[selectedCategory].backLabel}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={dynamicStyles.modalButton}
                    onPress={() => {
                      setShowUploadModal(false);
                      takePhoto(selectedCategory, 'front');
                    }}
                  >
                    <Text style={dynamicStyles.modalButtonText}>
                      🖼️ Upload - {DOCUMENT_CATEGORIES[selectedCategory].frontLabel}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={dynamicStyles.modalButton}
                    onPress={() => {
                      setShowUploadModal(false);
                      takePhoto(selectedCategory, 'back');
                    }}
                  >
                    <Text style={dynamicStyles.modalButtonText}>
                      🖼️ Upload - {DOCUMENT_CATEGORIES[selectedCategory].backLabel}
                    </Text>
                  </TouchableOpacity>
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
                    <Text style={dynamicStyles.modalButtonText}>
                      📷 Take Photo
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={dynamicStyles.modalButton}
                    onPress={() => {
                      setShowUploadModal(false);
                      uploadDocument(selectedCategory, 'single');
                    }}
                  >
                    <Text style={dynamicStyles.modalButtonText}>
                      🖼️ Upload from Gallery
                    </Text>
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
                <Text style={dynamicStyles.modalCancelButtonText}>Cancel</Text>
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
});
