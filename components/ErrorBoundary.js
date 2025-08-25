import React from 'react';
import { View, Text, Pressable } from 'react-native';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, info: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.log('[ErrorBoundary] Caught error:', error?.message, error, info?.componentStack);
    this.setState({ info });
    if (this.props.onError) this.props.onError(error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <View style={{ padding:16, backgroundColor:'#330000', borderRadius:12, margin:16 }}>
          <Text style={{ color:'#ffb3b3', fontWeight:'700', marginBottom:8 }}>Refill Module Error</Text>
          <Text style={{ color:'#ffd7d7', fontSize:12 }}>{String(this.state.error.message || this.state.error)}</Text>
          {this.state.info?.componentStack ? (
            <Text selectable style={{ color:'#ffa4a4', fontSize:10, marginTop:8 }}>{this.state.info.componentStack}</Text>
          ) : null}
          <Pressable onPress={()=> this.setState({ error:null, info:null })} style={{ marginTop:12, backgroundColor:'#fff', paddingHorizontal:14, paddingVertical:8, borderRadius:8 }}>
            <Text style={{ color:'#000', fontWeight:'600' }}>Retry</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}
