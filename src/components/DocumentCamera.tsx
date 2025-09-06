import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  StatusBar,
  Image,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');


interface DocumentCameraProps {
  onCapture: (uri: string) => void;
  onClose: () => void;
  enableEdgeDetection?: boolean;
  theme?: any;
}


export default function DocumentCamera({ 
  onCapture, 
  onClose, 
  enableEdgeDetection = true,
  theme
}: DocumentCameraProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraType, setCameraType] = useState<'back' | 'front'>('back');
  const [isCapturing, setIsCapturing] = useState(false);
  
  // Default theme if not provided
  const defaultTheme = {
    card: '#ffffff',
    text: '#2c2c2c',
    sub: '#6b6b6b',
    accent: '#d4af37',
    chip: '#e8e3d8',
  };
  
  const currentTheme = theme || defaultTheme;
  
  const cameraRef = useRef<CameraView>(null);

  // Request camera permission on mount
  React.useEffect(() => {
    console.log('📷 Camera permission status:', permission);
    if (!permission) {
      console.log('📷 Requesting camera permission...');
      requestPermission();
    }
  }, []);





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


  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={[styles.permissionText, { color: currentTheme.text }]}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={[styles.permissionText, { color: currentTheme.text }]}>No access to camera</Text>
        <TouchableOpacity style={[styles.closeButton, { backgroundColor: currentTheme.accent }]} onPress={requestPermission}>
          <Text style={[styles.closeButtonText, { color: currentTheme.text }]}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.closeButton, { backgroundColor: currentTheme.chip }]} onPress={onClose}>
          <Text style={[styles.closeButtonText, { color: currentTheme.text }]}>Close</Text>
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
        flash="off"
        onCameraReady={() => {
          console.log('📷 Camera is ready and should be showing feed');
        }}
      />

      {/* Top Controls */}
      <View style={styles.topControls}>
        <TouchableOpacity style={styles.homeButton} onPress={onClose}>
            <Image 
              source={require('../../assets/AuricRX_home_button.png')} 
              style={styles.homeButtonIcon}
              resizeMode="contain"
            />
        </TouchableOpacity>
        
        
        <TouchableOpacity style={[styles.controlButton, { backgroundColor: currentTheme.card }]} onPress={toggleCamera}>
          <Text style={[styles.controlButtonText, { color: currentTheme.text }]}>🔄</Text>
        </TouchableOpacity>
      </View>


      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        <TouchableOpacity style={[styles.galleryButton, { backgroundColor: currentTheme.card }]}>
          <Text style={[styles.galleryButtonText, { color: currentTheme.text }]}>📁</Text>
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
        
        <TouchableOpacity style={[styles.doneButton, { backgroundColor: currentTheme.accent }]}>
          <Text style={[styles.doneButtonText, { color: currentTheme.text }]}>Done</Text>
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
  homeButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
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
