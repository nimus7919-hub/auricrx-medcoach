import React from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';

// Android uses adjustResize (app.json); iOS needs padding to shrink the form viewport.
export default function KeyboardForm({ children, style = undefined }) {
  return <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    style={[{ flex: 1 }, style]}>{children}</KeyboardAvoidingView>;
}
