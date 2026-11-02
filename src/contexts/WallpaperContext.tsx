import { darkColors } from '../theme/colors';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface WallpaperOption {
  id: string;
  name: string;
  type: 'image' | 'color';
  value: string;
}

interface WallpaperContextType {
  currentWallpaper: WallpaperOption | null;
  setWallpaper: (wallpaper: WallpaperOption) => Promise<void>;
  getWallpaperStyle: () => any;
  getTextColor: () => string;
  getSubTextColor: () => string;
  getAccentColor: () => string;
  getCardTextColor: () => string;
  getCardBackgroundColor: () => string;
  getCardBorderColor: () => string;
  isLoading: boolean;
}

const WallpaperContext = createContext<WallpaperContextType | undefined>(undefined);

interface WallpaperProviderProps {
  children: ReactNode;
  theme?: typeof darkColors;
}

export function WallpaperProvider({ children, theme = darkColors }: WallpaperProviderProps) {
  const [currentWallpaper, setCurrentWallpaper] = useState<WallpaperOption | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadWallpaper();
  }, []);

  const loadWallpaper = async () => {
    try {
      console.log('🎨 WallpaperContext - Loading wallpaper from storage...');
      const savedWallpaper = await AsyncStorage.getItem('selectedWallpaper');
      console.log('🎨 WallpaperContext - Saved wallpaper data:', savedWallpaper);
      if (savedWallpaper) {
        const wallpaper = JSON.parse(savedWallpaper);
        console.log('🎨 WallpaperContext - Parsed wallpaper:', wallpaper);
        setCurrentWallpaper(wallpaper);
      } else {
        console.log('🎨 WallpaperContext - No saved wallpaper found, setting default');
        // Set default wallpaper to Black Silver for new users
        const defaultWallpaper: WallpaperOption = {
          id: 'black_silver',
          name: 'Black Silver',
          type: 'image',
          value: 'Black Silver.png'
        };
        setCurrentWallpaper(defaultWallpaper);
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load wallpaper:', error);
      // Set default wallpaper even on error
      const defaultWallpaper: WallpaperOption = {
        id: 'black_silver',
        name: 'Black Silver',
        type: 'image',
        value: 'Black Silver.png'
      };
      setCurrentWallpaper(defaultWallpaper);
      setIsLoading(false);
    }
  };

  const setWallpaper = async (wallpaper: WallpaperOption) => {
    try {
      console.log('🎨 WallpaperContext - Setting wallpaper:', wallpaper);
      await AsyncStorage.setItem('selectedWallpaper', JSON.stringify(wallpaper));
      setCurrentWallpaper(wallpaper);
      console.log('🎨 WallpaperContext - Wallpaper saved and set successfully');
    } catch (error) {
      console.error('Failed to save wallpaper:', error);
      throw error;
    }
  };

  const getWallpaperStyle = () => {
    console.log('🎨 WallpaperContext - getWallpaperStyle called, currentWallpaper:', currentWallpaper);
    
    if (!currentWallpaper) {
      console.log('🎨 WallpaperContext - No wallpaper, using default background');
      return {
        backgroundColor: theme.bg, // Dark background to match Black Silver theme
      };
    }

    if (currentWallpaper.type === 'color') {
      console.log('🎨 WallpaperContext - Color wallpaper:', currentWallpaper.value);
      return {
        backgroundColor: currentWallpaper.value,
      };
    } else {
      console.log('🎨 WallpaperContext - Image wallpaper:', currentWallpaper.value);
      const imageSource = getWallpaperImageSource(currentWallpaper.value);
      console.log('🎨 WallpaperContext - Image source:', imageSource);
      return {
        imageSource: imageSource,
      };
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

  // Utility function to determine if a color is light or dark
  const isLightColor = (color: string): boolean => {
    // Remove # if present
    const hex = color.replace('#', '');
    
    // Convert to RGB
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    return luminance > 0.5;
  };

  // Opaque card colors keep text readable over every custom wallpaper.
  const getTextColor = () => theme.text;
  const getSubTextColor = () => theme.sub;
  const getAccentColor = () => theme.accent;
  const getCardTextColor = () => theme.text;
  const getCardBackgroundColor = () => theme.card;
  const getCardBorderColor = () => theme.border;

  const value: WallpaperContextType = {
    currentWallpaper,
    setWallpaper,
    getWallpaperStyle,
    getTextColor,
    getSubTextColor,
    getAccentColor,
    getCardTextColor,
    getCardBackgroundColor,
    getCardBorderColor,
    isLoading,
  };

  return (
    <WallpaperContext.Provider value={value}>
      {children}
    </WallpaperContext.Provider>
  );
}

export function useWallpaper() {
  const context = useContext(WallpaperContext);
  if (context === undefined) {
    throw new Error('useWallpaper must be used within a WallpaperProvider');
  }
  return context;
}
