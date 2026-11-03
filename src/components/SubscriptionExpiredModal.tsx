import uiI18n from "../i18n";
import { useTranslation as useUILanguage } from "react-i18next";
import { gold as GOLD } from '../theme/colors';
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
import { useWallpaper } from '../contexts/WallpaperContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');



interface SubscriptionExpiredModalProps {
  visible: boolean;
  onSubscribe: () => void;
  onDismiss?: () => void;
  theme: any;
  lang: string;
}

export default function SubscriptionExpiredModal({ 
  visible, 
  onSubscribe, 
  onDismiss,
  theme,
  lang 
}: SubscriptionExpiredModalProps) {
  useUILanguage();
  const { getCardBackgroundColor, getCardTextColor } = useWallpaper();

  

  const t = uiI18n.t('subscriptionExpired', { returnObjects: true }) as Record<string, string>;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onDismiss}
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
            
            {/* Inner container matching theme */}
            <View style={[styles.innerContainer, { backgroundColor: getCardBackgroundColor() }]}>
              {/* Title */}
              <Text style={[styles.title, { color: getCardTextColor() }]}>{t.title}</Text>
              
              {/* Message */}
              <Text style={[styles.message, { color: getCardTextColor(), opacity: 0.9 }]}>
                {t.message}
              </Text>
              
              {/* Buttons */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.button}
                  onPress={onSubscribe}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[GOLD.a300, GOLD.y400, GOLD.a500]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.buttonGradient}
                  >
                    <Text style={styles.buttonText}>{t.subscribeButton}</Text>
                  </LinearGradient>
                </TouchableOpacity>

                {onDismiss && (
                  <TouchableOpacity
                    style={[styles.dismissButton, { borderColor: getCardTextColor() + '40' }]}
                    onPress={onDismiss}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.dismissButtonText, { color: getCardTextColor() }]}>
                      {t.dismissButton}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
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
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
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
    margin: 2,
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  message: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
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
  dismissButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  dismissButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});









