
import { SafeAreaProvider } from 'react-native-safe-area-context';
import SuccessToast from '../components/SuccessToast';
import { WallpaperProvider } from '../contexts/WallpaperContext';
import WallpaperWrapper from '../components/WallpaperWrapper';

export default function AppProviders({ theme, children }) {
  return (
    <SafeAreaProvider><WallpaperProvider theme={theme}>
      <WallpaperWrapper>{children}<SuccessToast /></WallpaperWrapper>
    </WallpaperProvider></SafeAreaProvider>
  );
}
