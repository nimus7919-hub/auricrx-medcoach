import { AppRegistry } from 'react-native';

import App from './App';

// Register the component as 'main' to match Android MainActivity
AppRegistry.registerComponent('main', () => App);

console.log('✅ Component registered as "main"');
