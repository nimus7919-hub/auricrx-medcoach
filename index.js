import { registerRootComponent } from 'expo';
import { AppRegistry } from 'react-native';

import App from './App';

// Explicitly register the component as 'main' to match Android MainActivity
AppRegistry.registerComponent('main', () => App);

// Also register with Expo for compatibility
registerRootComponent(App);
