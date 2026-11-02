import { useDynamicTheme } from '../hooks/useDynamicTheme';
import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'gradient';
  colors?: [string, string, ...string[]];
}

export default function Card({ 
  children, 
  style, 
  variant = 'default',
  colors
}: CardProps) {
  const theme = useDynamicTheme();
  const surface = { backgroundColor: theme.card, borderColor: theme.chip }; 
  if (variant === 'gradient') {
    return (
      <LinearGradient
        colors={colors || [theme.card, theme.card]}
        style={[styles.card, styles.gradientCard, surface, style]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {children}
      </LinearGradient>
    );
  }

  return (
    <View style={[styles.card, surface, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#151517',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2A2A2D',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  gradientCard: {
    borderWidth: 1,
  },
});
