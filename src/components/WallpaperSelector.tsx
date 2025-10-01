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
import { useWallpaper } from '../contexts/WallpaperContext';
import DynamicText from './DynamicText';

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
  S?: any;
  onWallpaperChange?: (wallpaper: WallpaperOption) => void;
}

export default function WallpaperSelector({ onClose, theme, S, onWallpaperChange }: WallpaperSelectorProps) {
  const { getCardBackgroundColor, getCardBorderColor, getCardTextColor } = useWallpaper();
  const [selectedWallpaper, setSelectedWallpaper] = useState<WallpaperOption | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Use S object for translations, fallback to key if not available
  const t = (key: string) => S?.[key] || key;
  
  // Function to get translated wallpaper name
  const getTranslatedWallpaperName = (wallpaper: WallpaperOption) => {
    const nameMap: { [key: string]: string } = {
      'solid_white': t('white'),
      'solid_black': t('black'),
      'black_gold_dr': t('blackGoldDr'),
      'black_gold': t('blackGold'),
      'black_silver': t('blackSilver'),
      'bold_cream': t('boldCream'),
      'cream_wallpaper': t('creamWallpaper'),
      'dark_cream': t('darkCream'),
      'dark_green_gold': t('darkGreenGold'),
      'white_gold_dr': t('whiteGoldDr'),
    };
    return nameMap[wallpaper.id] || wallpaper.name;
  };

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
      
      Alert.alert('✅ ' + t('wallpaperSuccess'), t('wallpaperChangedSuccessfully'));
    } catch (error) {
      console.error('Failed to save wallpaper:', error);
      Alert.alert('❌ ' + t('wallpaperError'), t('failedToSaveWallpaper'));
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
            backgroundColor: getCardBackgroundColor() + 'CC',
            borderColor: isSelected ? (theme?.accent || '#D4AF37') : getCardBorderColor(),
            borderWidth: isSelected ? 2 : 1,
          }
        ]}
        onPress={() => selectWallpaper(wallpaper)}
      >
        <View style={styles.previewContainer}>
          {getWallpaperPreview(wallpaper)}
        </View>
        <DynamicText 
          type="card"
          style={[
            styles.wallpaperName,
            { 
              fontFamily: isSelected ? 'Inter_600SemiBold' : 'Inter_400Regular'
            }
          ]}
        >
          {getTranslatedWallpaperName(wallpaper)}
        </DynamicText>
        {isSelected && (
          <View style={[styles.selectedIndicator, { backgroundColor: theme?.accent || '#D4AF37' }]}>
            <Text style={styles.checkmark}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <DynamicText type="card" style={styles.loadingText}>
          {t('loadingWallpapers')}
        </DynamicText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
        >
          <Image 
            source={require('../../assets/dashboard Emojies/close Window.png')} 
            style={{ 
              width: 32, 
              height: 32,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.8,
              shadowRadius: 4,
              elevation: 5,
            }}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <DynamicText type="primary" style={styles.title}>
          {t('chooseWallpaper')}
        </DynamicText>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <DynamicText type="card" style={[styles.sectionTitle, { opacity: 0.7 }]}>
          {t('solidColors')}
        </DynamicText>
        <View style={styles.wallpaperGrid}>
          {WALLPAPER_OPTIONS.filter(w => w.type === 'color').map(renderWallpaperOption)}
        </View>

        <DynamicText type="card" style={[styles.sectionTitle, { opacity: 0.7 }]}>
          {t('wallpaperImages')}
        </DynamicText>
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
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter_800ExtraBold',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
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
    borderRadius: 18,
    padding: 10,
    alignItems: 'center',
    position: 'relative',
  },
  previewContainer: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
  },
  colorPreview: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
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
    fontFamily: 'Inter_400Regular',
  },
});
