import React from 'react';
import { Text, TextProps } from 'react-native';
import { useWallpaper } from '../contexts/WallpaperContext';

interface DynamicTextProps extends TextProps {
  type?: 'primary' | 'secondary' | 'accent' | 'card' | 'sub';
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
    const color = (() => {
      switch (type) {
        case 'primary':
          return getTextColor();
        case 'secondary':
          return getSubTextColor();
        case 'accent':
          return getAccentColor();
        case 'card':
          return getCardTextColor();
        case 'sub':
          return getSubTextColor();
        default:
          return getTextColor();
      }
    })();
    
    // Debug logging for DynamicText
    console.log(`🎨 DynamicText - type: ${type}, color: ${color}`);
    return color;
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
