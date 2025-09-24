import React from 'react';
import { View, ImageBackground } from 'react-native';
import { useWallpaper } from '../contexts/WallpaperContext';

interface WallpaperWrapperProps {
  children: React.ReactNode;
  style?: any;
}

export default function WallpaperWrapper({ children, style }: WallpaperWrapperProps) {
  const { currentWallpaper, getWallpaperStyle, isLoading } = useWallpaper();

  // Debug logging
  console.log('🎨 WallpaperWrapper - isLoading:', isLoading);
  console.log('🎨 WallpaperWrapper - currentWallpaper:', currentWallpaper);

  if (isLoading) {
    console.log('🎨 WallpaperWrapper - Loading state, using default background');
    return (
      <View style={[{ flex: 1, backgroundColor: '#faf8f5' }, style]}>
        {children}
      </View>
    );
  }

  const wallpaperStyle = getWallpaperStyle();
  console.log('🎨 WallpaperWrapper - wallpaperStyle:', wallpaperStyle);

  // If it's a color wallpaper
  if (wallpaperStyle.backgroundColor) {
    console.log('🎨 WallpaperWrapper - Applying color wallpaper:', wallpaperStyle.backgroundColor);
    return (
      <View style={[{ flex: 1, backgroundColor: wallpaperStyle.backgroundColor }, style]}>
        {children}
      </View>
    );
  }

  // If it's an image wallpaper
  if (wallpaperStyle.imageSource) {
    console.log('🎨 WallpaperWrapper - Applying image wallpaper:', wallpaperStyle.imageSource);
    return (
      <ImageBackground
        source={wallpaperStyle.imageSource}
        style={[{ flex: 1 }, style]}
        resizeMode="cover"
      >
        {children}
      </ImageBackground>
    );
  }

  // Default fallback
  console.log('🎨 WallpaperWrapper - Using default fallback background');
  return (
    <View style={[{ flex: 1, backgroundColor: '#faf8f5' }, style]}>
      {children}
    </View>
  );
}
