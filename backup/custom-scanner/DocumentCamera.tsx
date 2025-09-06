import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Alert,
  StatusBar,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { RealTimeEdgeDetector, DocumentBounds, EdgeDetectionResult } from '../lib/realTimeEdgeDetection';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Helper function to get user-friendly document type labels
const getDocumentTypeLabel = (type: string): string => {
  switch (type) {
    case 'document': return 'Document';
    case 'id_card': return 'ID Card';
    case 'passport': return 'Passport';
    case 'business_card': return 'Business Card';
    default: return 'Document';
  }
};

interface DocumentCameraProps {
  onCapture: (uri: string) => void;
  onClose: () => void;
  enableEdgeDetection?: boolean;
}


export default function DocumentCamera({ 
  onCapture, 
  onClose, 
  enableEdgeDetection = true 
}: DocumentCameraProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraType, setCameraType] = useState<'back' | 'front'>('back');
  const [flashMode, setFlashMode] = useState<'off' | 'on'>('off');
  const [isCapturing, setIsCapturing] = useState(false);
  const [detectedBounds, setDetectedBounds] = useState<DocumentBounds | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionConfidence, setDetectionConfidence] = useState(0);
  const [documentType, setDocumentType] = useState<string>('unknown');
  
  const cameraRef = useRef<CameraView>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const borderAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    startDetectionAnimation();
    
    // Start real-time edge detection when component mounts
    if (enableEdgeDetection) {
      RealTimeEdgeDetector.startDetection(cameraRef, handleEdgeDetection);
    }
    
    // Cleanup on unmount
    return () => {
      RealTimeEdgeDetector.stopDetection();
    };
  }, [enableEdgeDetection]);

  const handleEdgeDetection = (result: EdgeDetectionResult) => {
    setDetectedBounds(result.bounds);
    setDetectionConfidence(result.confidence);
    setIsDetecting(result.isDetecting);
    setDocumentType(result.documentType || 'unknown');
  };

  const startDetectionAnimation = () => {
    // Pulse animation for detection indicator
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Border animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(borderAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: false,
        }),
        Animated.timing(borderAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: false,
        }),
      ])
    ).start();
  };


  const toggleFlash = () => {
    setFlashMode(flashMode === 'off' ? 'on' : 'off');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const toggleCamera = () => {
    setCameraType(cameraType === 'back' ? 'front' : 'back');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const capturePhoto = async () => {
    if (!cameraRef.current || isCapturing) return;

    setIsCapturing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.9,
        base64: false,
        skipProcessing: false,
      });

      onCapture(photo.uri);
    } catch (error) {
      console.error('Failed to capture photo:', error);
      Alert.alert('Error', 'Failed to capture photo');
    } finally {
      setIsCapturing(false);
    }
  };

  const renderDocumentBorder = () => {
    if (!detectedBounds) return null;

    const borderColor = borderAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['#3b82f6', '#1d4ed8'],
    });

    return (
      <View style={styles.documentOverlay}>
        {/* Top border */}
        <Animated.View
          style={[
            styles.borderLine,
            styles.topBorder,
            {
              left: detectedBounds.topLeft.x,
              width: detectedBounds.topRight.x - detectedBounds.topLeft.x,
              borderColor,
            },
          ]}
        />
        
        {/* Right border */}
        <Animated.View
          style={[
            styles.borderLine,
            styles.rightBorder,
            {
              top: detectedBounds.topRight.y,
              height: detectedBounds.bottomRight.y - detectedBounds.topRight.y,
              borderColor,
            },
          ]}
        />
        
        {/* Bottom border */}
        <Animated.View
          style={[
            styles.borderLine,
            styles.bottomBorder,
            {
              left: detectedBounds.bottomLeft.x,
              width: detectedBounds.bottomRight.x - detectedBounds.bottomLeft.x,
              borderColor,
            },
          ]}
        />
        
        {/* Left border */}
        <Animated.View
          style={[
            styles.borderLine,
            styles.leftBorder,
            {
              top: detectedBounds.topLeft.y,
              height: detectedBounds.bottomLeft.y - detectedBounds.topLeft.y,
              borderColor,
            },
          ]}
        />

        {/* Corner indicators */}
        <View style={[styles.cornerIndicator, styles.topLeftCorner, { 
          left: detectedBounds.topLeft.x - 10, 
          top: detectedBounds.topLeft.y - 10 
        }]} />
        <View style={[styles.cornerIndicator, styles.topRightCorner, { 
          left: detectedBounds.topRight.x - 10, 
          top: detectedBounds.topRight.y - 10 
        }]} />
        <View style={[styles.cornerIndicator, styles.bottomLeftCorner, { 
          left: detectedBounds.bottomLeft.x - 10, 
          top: detectedBounds.bottomLeft.y - 10 
        }]} />
        <View style={[styles.cornerIndicator, styles.bottomRightCorner, { 
          left: detectedBounds.bottomRight.x - 10, 
          top: detectedBounds.bottomRight.y - 10 
        }]} />
      </View>
    );
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>No access to camera</Text>
        <TouchableOpacity style={styles.closeButton} onPress={requestPermission}>
          <Text style={styles.closeButtonText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={cameraType}
        flash={flashMode}
        onCameraReady={() => {
          // Camera is ready, detection will start automatically via useEffect
          console.log('📷 Camera ready for document detection');
        }}
      />

      {/* Top Controls */}
      <View style={styles.topControls}>
        <TouchableOpacity style={styles.controlButton} onPress={onClose}>
          <Text style={styles.controlButtonText}>✕</Text>
        </TouchableOpacity>
        
        <View style={styles.centerControls}>
          <Text style={styles.autoText}>AUTO</Text>
          <TouchableOpacity style={styles.controlButton} onPress={toggleFlash}>
            <Text style={styles.controlButtonText}>
              {flashMode === 'off' ? '⚡' : '⚡'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.offText}>OFF</Text>
        </View>
        
        <TouchableOpacity style={styles.controlButton} onPress={toggleCamera}>
          <Text style={styles.controlButtonText}>🔄</Text>
        </TouchableOpacity>
      </View>

      {/* Document Detection Overlay */}
      {renderDocumentBorder()}

      {/* Detection Status */}
      {enableEdgeDetection && (
        <View style={styles.detectionStatus}>
          <Animated.View style={[styles.detectionIndicator, { transform: [{ scale: pulseAnim }] }]}>
            <Text style={styles.detectionText}>🔍</Text>
          </Animated.View>
          <Text style={styles.detectionLabel}>
            {detectedBounds ? 
              `${getDocumentTypeLabel(documentType)} detected (${Math.round(detectionConfidence * 100)}%)` : 
              'Looking for document...'
            }
          </Text>
        </View>
      )}

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        <TouchableOpacity style={styles.galleryButton}>
          <Text style={styles.galleryButtonText}>📁</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.captureButton, isCapturing && styles.captureButtonActive]}
          onPress={capturePhoto}
          disabled={isCapturing}
        >
          <View style={styles.captureButtonInner}>
            {isCapturing ? (
              <Text style={styles.captureButtonText}>📸</Text>
            ) : (
              <Text style={styles.captureButtonText}>📷</Text>
            )}
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.doneButton}>
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>
      </View>

      {/* Scan Mode Selector */}
      <View style={styles.scanModeSelector}>
        <TouchableOpacity style={styles.scanModeButton}>
          <Text style={styles.scanModeText}>Count</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.scanModeButton, styles.scanModeButtonActive]}>
          <Text style={[styles.scanModeText, styles.scanModeTextActive]}>Document</Text>
          <View style={styles.scanModeIndicator} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.scanModeButton}>
          <Text style={styles.scanModeText}>Card</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.scanModeButton}>
          <Text style={styles.scanModeText}>Passport</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  permissionText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 50,
  },
  closeButton: {
    backgroundColor: '#333',
    padding: 15,
    margin: 20,
    borderRadius: 10,
  },
  closeButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
  },
  topControls: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  controlButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  centerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  autoText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  offText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  documentOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 5,
  },
  borderLine: {
    position: 'absolute',
    borderWidth: 3,
  },
  topBorder: {
    top: 0,
    height: 0,
  },
  rightBorder: {
    right: 0,
    width: 0,
  },
  bottomBorder: {
    bottom: 0,
    height: 0,
  },
  leftBorder: {
    left: 0,
    width: 0,
  },
  cornerIndicator: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderWidth: 3,
    borderColor: '#3b82f6',
    backgroundColor: 'transparent',
  },
  topLeftCorner: {
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRightCorner: {
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeftCorner: {
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRightCorner: {
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  detectionStatus: {
    position: 'absolute',
    top: 120,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  detectionIndicator: {
    backgroundColor: 'rgba(59, 130, 246, 0.8)',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  detectionText: {
    fontSize: 20,
  },
  detectionLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 15,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 30,
    zIndex: 10,
  },
  galleryButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryButtonText: {
    fontSize: 20,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  captureButtonActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.9)',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonText: {
    fontSize: 24,
  },
  doneButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  scanModeSelector: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    zIndex: 10,
  },
  scanModeButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  scanModeButtonActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.8)',
  },
  scanModeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  scanModeTextActive: {
    fontWeight: '600',
  },
  scanModeIndicator: {
    position: 'absolute',
    bottom: -5,
    left: '50%',
    marginLeft: -5,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3b82f6',
  },
});
