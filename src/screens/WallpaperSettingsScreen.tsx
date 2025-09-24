import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useWallpaper } from '../contexts/WallpaperContext';
import WallpaperSelector from '../components/WallpaperSelector';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface WallpaperSettingsScreenProps {
  onClose: () => void;
  theme?: any;
}

export default function WallpaperSettingsScreen({ onClose, theme }: WallpaperSettingsScreenProps) {
  const { currentWallpaper, setWallpaper } = useWallpaper();
  const [showSelector, setShowSelector] = useState(false);

  const defaultTheme = {
    card: '#ffffff',
    text: '#2c2c2c',
    sub: '#6b6b6c',
    accent: '#d4af37',
    chip: '#e8e3d8',
    bgStart: '#faf8f5',
    bgEnd: '#f5f2ed',
  };

  const currentTheme = theme || defaultTheme;

  const handleWallpaperChange = async (wallpaper: any) => {
    try {
      await setWallpaper(wallpaper);
      setShowSelector(false);
    } catch (error) {
      console.error('Failed to change wallpaper:', error);
    }
  };

  if (showSelector) {
    return (
      <WallpaperSelector
        onClose={() => setShowSelector(false)}
        theme={currentTheme}
        onWallpaperChange={handleWallpaperChange}
      />
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.homeButton} onPress={onClose}>
            <Text style={[styles.homeButtonText, { color: currentTheme.text }]}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: currentTheme.text }]}>
            🎨 Wallpaper Settings
          </Text>
          <View style={styles.placeholder} />
        </View>

        {/* Content */}
        <View style={[styles.content, { backgroundColor: currentTheme.card }]}>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>
              Current Wallpaper
            </Text>
            <View style={[styles.currentWallpaper, { backgroundColor: currentTheme.chip }]}>
              <Text style={[styles.currentWallpaperText, { color: currentTheme.sub }]}>
                {currentWallpaper ? currentWallpaper.name : 'Default'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.changeButton, { backgroundColor: currentTheme.accent }]}
            onPress={() => setShowSelector(true)}
          >
            <Text style={[styles.changeButtonText, { color: currentTheme.text }]}>
              Change Wallpaper
            </Text>
          </TouchableOpacity>

          <View style={styles.infoSection}>
            <Text style={[styles.infoTitle, { color: currentTheme.text }]}>
              About Wallpapers
            </Text>
            <Text style={[styles.infoText, { color: currentTheme.sub }]}>
              Choose from our collection of beautiful wallpapers or select a solid color. 
              Your wallpaper choice will be applied throughout the app to personalize your experience.
            </Text>
          </View>

          <View style={styles.featuresList}>
            <Text style={[styles.featureItem, { color: currentTheme.sub }]}>
              • 8 unique wallpaper designs
            </Text>
            <Text style={[styles.featureItem, { color: currentTheme.sub }]}>
              • Solid color options (white/black)
            </Text>
            <Text style={[styles.featureItem, { color: currentTheme.sub }]}>
              • Instant preview and application
            </Text>
            <Text style={[styles.featureItem, { color: currentTheme.sub }]}>
              • Settings are saved automatically
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 20,
  },
  homeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  homeButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    margin: 20,
    borderRadius: 20,
    padding: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  currentWallpaper: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  currentWallpaperText: {
    fontSize: 16,
    fontWeight: '500',
  },
  changeButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  changeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  infoSection: {
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
  featuresList: {
    marginTop: 10,
  },
  featureItem: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 4,
  },
});
