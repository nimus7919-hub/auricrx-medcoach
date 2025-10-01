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
}

export function WallpaperProvider({ children }: WallpaperProviderProps) {
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
        // Set default wallpaper to match the app's default theme
        const defaultWallpaper = {
          id: 'default_gold',
          name: 'Default Gold',
          type: 'color',
          value: '#faf8f5'
        };
        setCurrentWallpaper(defaultWallpaper);
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load wallpaper:', error);
      // Set default wallpaper even on error
      const defaultWallpaper = {
        id: 'default_gold',
        name: 'Default Gold',
        type: 'color',
        value: '#faf8f5'
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
        backgroundColor: '#faf8f5', // Default background
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

  // Get optimal text color based on wallpaper
  const getTextColor = (): string => {
    if (!currentWallpaper) {
      return '#2c2c2c'; // Default dark text
    }

    if (currentWallpaper.type === 'color') {
      return isLightColor(currentWallpaper.value) ? '#2c2c2c' : '#ffffff';
    } else {
      // For image wallpapers, use a smart default based on common patterns
      const imageName = currentWallpaper.value.toLowerCase();
      if (imageName.includes('black') || imageName.includes('dark')) {
        return '#ffffff'; // White text for dark images
      } else if (imageName.includes('white') || imageName.includes('cream')) {
        return '#2c2c2c'; // Dark text for light images
      } else {
        return '#ffffff'; // Default to white for complex images
      }
    }
  };

  const getSubTextColor = (): string => {
    const textColor = getTextColor();
    const subColor = textColor === '#ffffff' ? '#e0e0e0' : '#666666';
    console.log('🎨 getSubTextColor - textColor:', textColor, 'returning:', subColor);
    return subColor; // Medium gray for placeholder text visibility
  };

  const getAccentColor = (): string => {
    if (!currentWallpaper) {
      return '#d4af37'; // Default gold
    }

    if (currentWallpaper.type === 'color') {
      return isLightColor(currentWallpaper.value) ? '#d4af37' : '#ffd700';
    } else {
      // For image wallpapers, use gold variants
      const imageName = currentWallpaper.value.toLowerCase();
      if (imageName.includes('black') || imageName.includes('dark')) {
        return '#ffd700'; // Brighter gold for dark backgrounds
      } else {
        return '#d4af37'; // Standard gold for light backgrounds
      }
    }
  };

  const getCardTextColor = (): string => {
    // Get the actual card background color to determine text color
    const cardBgColor = getCardBackgroundColor();
    
    // If card background is dark, use light text
    // If card background is light, use dark text
    if (cardBgColor === '#2a2a2a' || cardBgColor === '#1a1a1a' || cardBgColor === '#0d2424' || cardBgColor === '#121a33') {
      console.log('🎨 getCardTextColor - Dark card, returning white text');
      return '#ffffff'; // Light text for dark cards
    } else {
      console.log('🎨 getCardTextColor - Light card, returning black text');
      return '#000000'; // Pure black text for light cards for better visibility
    }
  };

  const getCardBackgroundColor = (): string => {
    if (!currentWallpaper) {
      return '#ffffff'; // Default white
    }

    if (currentWallpaper.type === 'color') {
      // For the default gold theme, use white cards
      if (currentWallpaper.id === 'default_gold') {
        return '#ffffff';
      }
      return isLightColor(currentWallpaper.value) ? '#ffffff' : '#2a2a2a';
    } else {
      // For image wallpapers, use smart defaults
      const imageName = currentWallpaper.value.toLowerCase();
      if (imageName.includes('black') || imageName.includes('dark')) {
        return '#2a2a2a'; // Dark card for dark wallpapers
      } else if (imageName.includes('white') || imageName.includes('cream')) {
        return '#ffffff'; // White card for light wallpapers
      } else {
        return '#ffffff'; // Default to white for complex images
      }
    }
  };

  const getCardBorderColor = (): string => {
    if (!currentWallpaper) {
      return '#e8e3d8'; // Default light border
    }

    if (currentWallpaper.type === 'color') {
      // For the default gold theme, use light border
      if (currentWallpaper.id === 'default_gold') {
        return '#e8e3d8';
      }
      return isLightColor(currentWallpaper.value) ? '#e8e3d8' : '#404040';
    } else {
      // For image wallpapers, use smart defaults
      const imageName = currentWallpaper.value.toLowerCase();
      if (imageName.includes('black') || imageName.includes('dark')) {
        return '#404040'; // Dark border for dark wallpapers
      } else {
        return '#e8e3d8'; // Light border for light wallpapers
      }
    }
  };

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
