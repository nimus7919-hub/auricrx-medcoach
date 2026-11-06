import { useTranslation as useScreenTranslation } from "react-i18next";
import uiI18n from "../i18n";
import { useTranslation as useUILanguage } from "react-i18next";
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
import { darkColors, roseGoldColors, seaGlassColors } from '../theme/colors';

const { width: screenWidth } = Dimensions.get('window');

interface WallpaperOption {
  id: string;
  name: string;
  type: 'image' | 'color' | 'theme';
  value: string;
  preview?: string;
  themeColors?: typeof darkColors;
}

const WALLPAPER_OPTIONS: WallpaperOption[] = [
  // Color Themes
  { id: 'theme_vip_navy_gold', get name() { return uiI18n.t("wallpaper.vipNavyGold"); }, type: 'theme', value: 'vip_navy_gold', themeColors: darkColors },
  { id: 'theme_rose_gold', get name() { return uiI18n.t("wallpaper.roseGold"); }, type: 'theme', value: 'rose_gold', themeColors: roseGoldColors },
  { id: 'theme_sea_glass', get name() { return uiI18n.t("wallpaper.seaGlass"); }, type: 'theme', value: 'sea_glass', themeColors: seaGlassColors },
  
  // Solid colors
  { id: 'solid_white', get name() { return uiI18n.t("wallpaper.white"); }, type: 'color', value: '#FFFFFF' },
  { id: 'solid_black', get name() { return uiI18n.t("wallpaper.black"); }, type: 'color', value: '#000000' },
  
  // Wallpaper images
  { id: 'black_gold_dr', get name() { return uiI18n.t("wallpaper.blackGoldDr"); }, type: 'image', value: 'Black Gold Dr..png' },
  { id: 'black_gold', get name() { return uiI18n.t("wallpaper.blackGold"); }, type: 'image', value: 'Black Gold.png' },
  { id: 'black_silver', get name() { return uiI18n.t("wallpaper.blackSilver"); }, type: 'image', value: 'Black Silver.png' },
  { id: 'bold_cream', get name() { return uiI18n.t("wallpaper.boldCream"); }, type: 'image', value: 'Bold Cream.png' },
  { id: 'cream_wallpaper', get name() { return uiI18n.t("wallpaper.creamWallpaper"); }, type: 'image', value: 'Cream Wallpaper.png' },
  { id: 'dark_cream', get name() { return uiI18n.t("wallpaper.darkCream"); }, type: 'image', value: 'Dark Cream.png' },
  { id: 'dark_green_gold', get name() { return uiI18n.t("wallpaper.darkGreenGold"); }, type: 'image', value: 'Dark Green-Gold.png' },
  { id: 'white_gold_dr', get name() { return uiI18n.t("wallpaper.whiteGoldDr"); }, type: 'image', value: 'White Gold Dr..png' },
];

interface WallpaperSelectorProps {
  onClose: () => void;
  theme?: any;
  S?: any;
  onWallpaperChange?: (wallpaper: WallpaperOption) => void;
}

export default function WallpaperSelector({ onClose, theme, S, onWallpaperChange }: WallpaperSelectorProps) {
  useUILanguage();
  const { getCardBackgroundColor, getCardBorderColor, getCardTextColor } = useWallpaper();
  const [selectedWallpaper, setSelectedWallpaper] = useState<WallpaperOption | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Use S object for translations, fallback to key if not available
  const { t } = useScreenTranslation();
  
  // Function to get translated wallpaper name
  const getTranslatedWallpaperName = (wallpaper: WallpaperOption) => {
    const nameMap: { [key: string]: string } = {
      'theme_vip_navy_gold': t("wallpaper.vipNavyGold"),
      'theme_rose_gold': t("wallpaper.roseGold"),
      'theme_sea_glass': t("wallpaper.seaGlass"),
      'solid_white': t("wallpaper.white"),
      'solid_black': t("wallpaper.black"),
      'black_gold_dr': t("wallpaper.blackGoldDr"),
      'black_gold': t("wallpaper.blackGold"),
      'black_silver': t("wallpaper.blackSilver"),
      'bold_cream': t("wallpaper.boldCream"),
      'cream_wallpaper': t("wallpaper.creamWallpaper"),
      'dark_cream': t("wallpaper.darkCream"),
      'dark_green_gold': t("wallpaper.darkGreenGold"),
      'white_gold_dr': t("wallpaper.whiteGoldDr"),
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
      
      Alert.alert('✅ ' + t("wallpaper.success"), t("wallpaper.wallpaperChangedSuccessfully"));
    } catch (error) {
      console.error('Failed to save wallpaper:', error);
      Alert.alert('❌ ' + t("wallpaper.error"), t("wallpaper.failedToSaveWallpaper"));
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
    if (wallpaper.type === 'theme' && wallpaper.themeColors) {
      // Show a swatch with multiple colors from the theme
      const themeColors = wallpaper.themeColors;
      return (
        <View style={styles.themePreviewContainer}>
          <View style={[styles.themeColorBlock, { backgroundColor: themeColors.bg, flex: 2 }]} />
          <View style={styles.themeColorColumn}>
            <View style={[styles.themeColorBlock, { backgroundColor: themeColors.card }]} />
            <View style={[styles.themeColorBlock, { backgroundColor: themeColors.accent }]} />
          </View>
          <View style={styles.themeColorColumn}>
            <View style={[styles.themeColorBlock, { backgroundColor: themeColors.border }]} />
            <View style={[styles.themeColorBlock, { backgroundColor: themeColors.gold }]} />
          </View>
        </View>
      );
    } else if (wallpaper.type === 'color') {
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
          {t("wallpaper.loadingWallpapers")}
        </DynamicText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.closeButton, { elevation: 5 }]}
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
            }}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <DynamicText type="primary" style={styles.title}>
          {t("wallpaper.chooseWallpaper")}
        </DynamicText>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <DynamicText type="card" style={[styles.sectionTitle, { opacity: 0.7 }]}>
          {t("wallpaper.colorThemes")}
        </DynamicText>
        <View style={styles.wallpaperGrid}>
          {WALLPAPER_OPTIONS.filter(w => w.type === 'theme').map(renderWallpaperOption)}
        </View>

        <DynamicText type="card" style={[styles.sectionTitle, { opacity: 0.7 }]}>
          {t("wallpaper.solidColors")}
        </DynamicText>
        <View style={styles.wallpaperGrid}>
          {WALLPAPER_OPTIONS.filter(w => w.type === 'color').map(renderWallpaperOption)}
        </View>

        <DynamicText type="card" style={[styles.sectionTitle, { opacity: 0.7 }]}>
          {t("wallpaper.wallpaperImages")}
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
  themePreviewContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  themeColorColumn: {
    flex: 1,
    flexDirection: 'column',
  },
  themeColorBlock: {
    flex: 1,
  },
});
