import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
  Dimensions,
  Alert,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

const { width: screenWidth } = Dimensions.get('window');

interface WallpaperOption {
  id: string;
  name: string;
  type: 'image' | 'color';
  value: string;
  preview?: string;
}

const WALLPAPER_OPTIONS: WallpaperOption[] = [
  // Solid colors
  { id: 'solid_white', name: 'White', type: 'color', value: '#FFFFFF' },
  { id: 'solid_black', name: 'Black', type: 'color', value: '#000000' },
  
  // Wallpaper images
  { id: 'black_gold_dr', name: 'Black Gold Dr.', type: 'image', value: 'Black Gold Dr..png' },
  { id: 'black_gold', name: 'Black Gold', type: 'image', value: 'Black Gold.png' },
  { id: 'black_silver', name: 'Black Silver', type: 'image', value: 'Black Silver.png' },
  { id: 'bold_cream', name: 'Bold Cream', type: 'image', value: 'Bold Cream.png' },
  { id: 'cream_wallpaper', name: 'Cream Wallpaper', type: 'image', value: 'Cream Wallpaper.png' },
  { id: 'dark_cream', name: 'Dark Cream', type: 'image', value: 'Dark Cream.png' },
  { id: 'dark_green_gold', name: 'Dark Green-Gold', type: 'image', value: 'Dark Green-Gold.png' },
  { id: 'white_gold_dr', name: 'White Gold Dr.', type: 'image', value: 'White Gold Dr..png' },
];

interface WallpaperSelectorProps {
  onClose: () => void;
  theme?: any;
  onWallpaperChange?: (wallpaper: WallpaperOption) => void;
}

export default function WallpaperSelector({ onClose, theme, onWallpaperChange }: WallpaperSelectorProps) {
  const [selectedWallpaper, setSelectedWallpaper] = useState<WallpaperOption | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  useEffect(() => {
    loadCurrentWallpaper();
  }, []);

  const loadCurrentWallpaper = async () => {
    try {
      const savedWallpaper = await AsyncStorage.getItem('selectedWallpaper');
      if (savedWallpaper) {
        const wallpaper = JSON.parse(savedWallpaper);
        setSelectedWallpaper(wallpaper);
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load wallpaper:', error);
      setIsLoading(false);
    }
  };

  const selectWallpaper = async (wallpaper: WallpaperOption) => {
    try {
      await AsyncStorage.setItem('selectedWallpaper', JSON.stringify(wallpaper));
      setSelectedWallpaper(wallpaper);
      
      // Trigger haptic feedback
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      
      // Notify parent component
      if (onWallpaperChange) {
        onWallpaperChange(wallpaper);
      }
      
      Alert.alert('✅ Success', 'Wallpaper changed successfully!');
    } catch (error) {
      console.error('Failed to save wallpaper:', error);
      Alert.alert('❌ Error', 'Failed to save wallpaper');
    }
  };

  const getWallpaperImageSource = (filename: string) => {
    // Static mapping to avoid dynamic require issues
    const imageMap: { [key: string]: any } = {
      'Black Gold Dr..png': require('../../assets/Wall paper/Black Gold Dr..png'),
      'Black Gold.png': require('../../assets/Wall paper/Black Gold.png'),
      'Black Silver.png': require('../../assets/Wall paper/Black Silver.png'),
      'Bold Cream.png': require('../../assets/Wall paper/Bold Cream.png'),
      'Cream Wallpaper.png': require('../../assets/Wall paper/Cream Wallpaper.png'),
      'Dark Cream.png': require('../../assets/Wall paper/Dark Cream.png'),
      'Dark Green-Gold.png': require('../../assets/Wall paper/Dark Green-Gold.png'),
      'White Gold Dr..png': require('../../assets/Wall paper/White Gold Dr..png'),
    };
    
    return imageMap[filename] || null;
  };

  const getWallpaperPreview = (wallpaper: WallpaperOption) => {
    if (wallpaper.type === 'color') {
      return (
        <View 
          style={[
            styles.colorPreview, 
            { backgroundColor: wallpaper.value }
          ]} 
        />
      );
    } else {
      const imageSource = getWallpaperImageSource(wallpaper.value);
      return (
        <Image
          source={imageSource}
          style={styles.imagePreview}
          resizeMode="cover"
        />
      );
    }
  };

  const renderWallpaperOption = (wallpaper: WallpaperOption) => {
    const isSelected = selectedWallpaper?.id === wallpaper.id;
    
    return (
      <TouchableOpacity
        key={wallpaper.id}
        style={[
          styles.wallpaperOption,
          { 
            backgroundColor: currentTheme.card,
            borderColor: isSelected ? currentTheme.accent : currentTheme.chip,
            borderWidth: isSelected ? 2 : 1,
          }
        ]}
        onPress={() => selectWallpaper(wallpaper)}
      >
        <View style={styles.previewContainer}>
          {getWallpaperPreview(wallpaper)}
        </View>
        <Text 
          style={[
            styles.wallpaperName,
            { 
              color: currentTheme.text,
              fontWeight: isSelected ? '600' : '400'
            }
          ]}
        >
          {wallpaper.name}
        </Text>
        {isSelected && (
          <View style={[styles.selectedIndicator, { backgroundColor: currentTheme.accent }]}>
            <Text style={styles.checkmark}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: currentTheme.bgStart }]}>
        <Text style={[styles.loadingText, { color: currentTheme.text }]}>
          Loading wallpapers...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.bgStart }]}>
      <View style={[styles.header, { backgroundColor: currentTheme.card }]}>
        <Text style={[styles.title, { color: currentTheme.text }]}>
          🎨 Choose Wallpaper
        </Text>
        <TouchableOpacity
          style={[styles.closeButton, { backgroundColor: currentTheme.chip }]}
          onPress={onClose}
        >
          <Text style={[styles.closeButtonText, { color: currentTheme.text }]}>
            ✕
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={[styles.sectionTitle, { color: currentTheme.sub }]}>
          Solid Colors
        </Text>
        <View style={styles.wallpaperGrid}>
          {WALLPAPER_OPTIONS.filter(w => w.type === 'color').map(renderWallpaperOption)}
        </View>

        <Text style={[styles.sectionTitle, { color: currentTheme.sub }]}>
          Wallpaper Images
        </Text>
        <View style={styles.wallpaperGrid}>
          {WALLPAPER_OPTIONS.filter(w => w.type === 'image').map(renderWallpaperOption)}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    marginTop: 10,
  },
  wallpaperGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  wallpaperOption: {
    width: (screenWidth - 60) / 2,
    marginBottom: 15,
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    position: 'relative',
  },
  previewContainer: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 8,
  },
  colorPreview: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  wallpaperName: {
    fontSize: 14,
    textAlign: 'center',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 50,
  },
});
