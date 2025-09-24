import React from 'react';
import { Text, TextProps } from 'react-native';
import { useWallpaper } from '../contexts/WallpaperContext';

interface DynamicTextProps extends TextProps {
  type?: 'primary' | 'secondary' | 'accent' | 'card';
  children: React.ReactNode;
}

export default function DynamicText({ 
  type = 'primary', 
  style, 
  children, 
  ...props 
}: DynamicTextProps) {
  const { getTextColor, getSubTextColor, getAccentColor, getCardTextColor } = useWallpaper();

  const getColor = () => {
    switch (type) {
      case 'primary':
        return getTextColor();
      case 'secondary':
        return getSubTextColor();
      case 'accent':
        return getAccentColor();
      case 'card':
        return getCardTextColor();
      default:
        return getTextColor();
    }
  };

  return (
    <Text 
      style={[
        { color: getColor() },
        style
      ]} 
      {...props}
    >
      {children}
    </Text>
  );
}
