import DynamicText from './DynamicText';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, TouchableOpacityProps, TextProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { darkColors, goldGradient } from '../theme/colors';
/** Keeps each caller's sizing and interaction while sharing the premium fill. */
export default function PremiumButton({ children, style, ...props }: TouchableOpacityProps) {
  return <TouchableOpacity accessibilityRole="button" activeOpacity={0.85} {...props} style={[style, { backgroundColor: goldGradient[1], overflow: 'hidden', borderRadius: 14 }]}>
    <LinearGradient pointerEvents="none" colors={goldGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
    {React.Children.map(children, child => {
      if (!React.isValidElement<any>(child)) return typeof child === 'string' ? <Text style={{ color: darkColors.onAccent }}>{child}</Text> : child;
      if (child.type === Text || child.type === DynamicText) { const textChild = child as React.ReactElement<TextProps>; return React.cloneElement(textChild, { style: [textChild.props.style, { color: darkColors.onAccent }] }); }
      return child;
    })}
  </TouchableOpacity>;
}
