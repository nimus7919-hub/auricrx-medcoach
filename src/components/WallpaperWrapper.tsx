import React from 'react';
import { View, ImageBackground, StyleSheet } from 'react-native';
import { useWallpaper } from '../contexts/WallpaperContext';
export default function WallpaperWrapper({ children, style }: { children: React.ReactNode; style?: any }) {
  const { getWallpaperStyle } = useWallpaper();
  const wallpaper = getWallpaperStyle();
  
  if (wallpaper.imageSource) {
    return (
      <ImageBackground 
        source={wallpaper.imageSource} 
        style={[{ flex: 1, backgroundColor: wallpaper.backgroundColor }, style]} 
        resizeMode="cover"
      >
        <View style={[StyleSheet.absoluteFill, { backgroundColor: wallpaper.backgroundColor, opacity: 0.94 }]} />
        {children}
      </ImageBackground>
    );
  }
  
  return <View style={[{ flex: 1, backgroundColor: wallpaper.backgroundColor }, style]}>{children}</View>;
}
