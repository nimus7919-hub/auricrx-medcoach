import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  buttonText: string;
  onPress: () => void;
}

const GOLD = {
  hi: "#FFF3D2",
  a200: "#FDE68A",
  a300: "#FCD34D",
  y400: "#FACC15",
  a400: "#FBBF24",
  a500: "#F59E0B",
  y600: "#CA8A04",
  accent: "#FFB020",
};

export default function CustomAlert({ visible, title, message, buttonText, onPress }: CustomAlertProps) {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onPress}
    >
      <View style={styles.overlay}>
        <BlurView intensity={20} style={styles.blurContainer}>
          <View style={styles.alertContainer}>
            {/* Gold gradient background */}
            <LinearGradient
              colors={[GOLD.a200, GOLD.y400, GOLD.a500]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.goldBackground}
            />
            
            {/* Inner black container */}
            <View style={styles.innerContainer}>
              {/* Title */}
              <Text style={styles.title}>{title}</Text>
              
              {/* Message */}
              <Text style={styles.message}>{message}</Text>
              
              {/* Button */}
              <TouchableOpacity
                style={styles.button}
                onPress={onPress}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[GOLD.a300, GOLD.y400, GOLD.a500]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.buttonText}>{buttonText}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  blurContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  alertContainer: {
    width: SCREEN_WIDTH * 0.85,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: GOLD.a400,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 20,
  },
  goldBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
  },
  innerContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    margin: 2,
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: GOLD.a200,
    textAlign: 'center',
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  message: {
    fontSize: 16,
    color: '#E9C978',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  button: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: GOLD.a400,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonGradient: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0b0b0b',
    textShadowColor: 'rgba(255, 255, 255, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
