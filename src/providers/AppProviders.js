
import { WallpaperProvider } from '../contexts/WallpaperContext';
import WallpaperWrapper from '../components/WallpaperWrapper';

export default function AppProviders({ theme, children }) {
  return (
    <WallpaperProvider theme={theme}>
      <WallpaperWrapper>{children}</WallpaperWrapper>
    </WallpaperProvider>
  );
}
