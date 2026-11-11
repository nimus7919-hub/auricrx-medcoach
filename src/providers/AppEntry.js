import '../services/privacyLogging';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import AppController from './AppController';
import { RegionProvider } from './RegionProvider';

// Last-resort guard: a render error at startup shows a visible retry screen instead of a blank window.
class StartupErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error) { try { console.error('[StartupErrorBoundary]', error?.message || error); } catch {} }
  render() {
    if (!this.state.error) return this.props.children;
    return <View style={{ flex: 1, backgroundColor: '#020D1B', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <Text style={{ color: '#FFE5A2', fontSize: 22, fontWeight: '700', marginBottom: 12, textAlign: 'center' }}>AuricRX MedCoach</Text>
      <Text style={{ color: '#F6F5F2', fontSize: 15, textAlign: 'center', marginBottom: 20 }}>Algo salió mal al iniciar. / Something went wrong while starting.</Text>
      <TouchableOpacity accessibilityRole="button" onPress={() => this.setState({ error: null })} style={{ backgroundColor: '#E8BF80', borderRadius: 14, paddingHorizontal: 24, paddingVertical: 12 }}>
        <Text style={{ color: '#17130B', fontWeight: '700' }}>Reintentar / Retry</Text>
      </TouchableOpacity>
    </View>;
  }
}

export default function AppEntry() {
  return <StartupErrorBoundary><RegionProvider><AppController /></RegionProvider></StartupErrorBoundary>;
}
