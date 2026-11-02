import { premiumTheme } from '../theme/colors';
import React from 'react';
import { View, ImageBackground, StyleSheet } from 'react-native';
import { useWallpaper } from '../contexts/WallpaperContext';
export default function WallpaperWrapper({ children, style }: { children: React.ReactNode; style?: any }) {
  const { getWallpaperStyle, getTextColor } = useWallpaper();
  const wallpaper = getWallpaperStyle();
  const surface = premiumTheme(getTextColor() === '#FFF5E4').bg;
  if (wallpaper.imageSource) return <ImageBackground source={wallpaper.imageSource} style={[{ flex: 1, backgroundColor: surface }, style]} resizeMode="cover"><View style={[StyleSheet.absoluteFill, { backgroundColor: surface, opacity: 0.94 }]} />{children}</ImageBackground>;
  return <View style={[{ flex: 1, backgroundColor: surface }, style]}>{children}</View>;
}
