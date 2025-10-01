import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  Platform,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useWallpaper } from '../contexts/WallpaperContext';
import WallpaperSelector from '../components/WallpaperSelector';
import DynamicText from '../components/DynamicText';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface WallpaperSettingsScreenProps {
  onClose: () => void;
  theme?: any;
  S?: any;
  onNavigateToSettings?: () => void;
}

export default function WallpaperSettingsScreen({ onClose, theme, S, onNavigateToSettings }: WallpaperSettingsScreenProps) {
  const { currentWallpaper, setWallpaper, getCardBackgroundColor, getCardBorderColor, getCardTextColor } = useWallpaper();
  const [showSelector, setShowSelector] = useState(false);
  
  // Use S object for translations, fallback to key if not available
  const t = (key: string) => S?.[key] || key;
  
  // Function to get translated wallpaper name
  const getTranslatedWallpaperName = (wallpaper: any) => {
    if (!wallpaper) return t('default');
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
        theme={theme}
        S={S}
        onWallpaperChange={handleWallpaperChange}
      />
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      <View style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { borderColor: theme?.chip || '#e8e3d8' }]}>
        <TouchableOpacity style={[styles.homeButton, { backgroundColor: getCardBackgroundColor() + 'CC', borderColor: getCardBorderColor(), borderWidth: 2 }]} onPress={onNavigateToSettings || onClose}>
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
            {t('wallpaperTitle')}
          </DynamicText>
          <View style={styles.placeholder} />
        </View>

        {/* Content */}
        <View style={[styles.content, { backgroundColor: getCardBackgroundColor() + 'CC', borderColor: getCardBorderColor(), borderWidth: 2 }]}>
          <View style={styles.section}>
            <DynamicText type="card" style={styles.sectionTitle}>
              {t('currentWallpaper')}
            </DynamicText>
            <View style={[styles.currentWallpaper, { backgroundColor: getCardBackgroundColor() + '80', borderColor: getCardBorderColor(), borderWidth: 1 }]}>
              <DynamicText type="card" style={[styles.currentWallpaperText, { opacity: 0.7 }]}>
                {getTranslatedWallpaperName(currentWallpaper)}
              </DynamicText>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.changeButton, { backgroundColor: theme?.accent || '#D4AF37' }]}
            onPress={() => setShowSelector(true)}
          >
            <DynamicText type="card" style={[styles.changeButtonText, { color: theme?.bg === '#ffffff' || theme?.bg === '#fefefe' ? '#000000' : '#ffffff' }]}>
              {t('changeWallpaper')}
            </DynamicText>
          </TouchableOpacity>

          <View style={styles.infoSection}>
            <DynamicText type="card" style={styles.infoTitle}>
              {t('aboutWallpapers')}
            </DynamicText>
            <DynamicText type="card" style={[styles.infoText, { opacity: 0.7 }]}>
              {t('aboutWallpapersDescription')}
            </DynamicText>
          </View>

          <View style={styles.featuresList}>
            <DynamicText type="card" style={[styles.featureItem, { opacity: 0.7 }]}>
              • {t('uniqueWallpaperDesigns')}
            </DynamicText>
            <DynamicText type="card" style={[styles.featureItem, { opacity: 0.7 }]}>
              • {t('solidColorOptions')}
            </DynamicText>
            <DynamicText type="card" style={[styles.featureItem, { opacity: 0.7 }]}>
              • {t('instantPreviewAndApplication')}
            </DynamicText>
            <DynamicText type="card" style={[styles.featureItem, { opacity: 0.7 }]}>
              • {t('settingsSavedAutomatically')}
            </DynamicText>
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
    justifyContent: 'center',
    alignItems: 'center',
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
    borderRadius: 18,
    padding: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    marginBottom: 12,
  },
  currentWallpaper: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  currentWallpaperText: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
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
    fontFamily: 'Inter_600SemiBold',
  },
  infoSection: {
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Inter_400Regular',
  },
  featuresList: {
    marginTop: 10,
  },
  featureItem: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 4,
    fontFamily: 'Inter_400Regular',
  },
});
