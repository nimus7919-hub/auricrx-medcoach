import { AppRegistry } from 'react-native';
import React from 'react';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';

// Root App component wrapped in ErrorBoundary to catch crashes
class RootApp extends React.Component {
  render() {
    return (
      <ErrorBoundary onError={(error, info) => {
        console.error('🚨 App crashed:', error);
        console.error('🚨 Error info:', info);
      }}>
        <App />
      </ErrorBoundary>
    );
  }
}

// Register the component as 'main' to match Android MainActivity
AppRegistry.registerComponent('main', () => RootApp);

console.log('✅ Component registered as "main"');
