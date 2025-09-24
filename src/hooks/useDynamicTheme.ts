import { useWallpaper } from '../contexts/WallpaperContext';

export function useDynamicTheme() {
  const { getTextColor, getSubTextColor, getAccentColor } = useWallpaper();

  return {
    text: getTextColor(),
    subText: getSubTextColor(),
    accent: getAccentColor(),
    // Add more theme properties as needed
    card: '#ffffff',
    chip: '#f0f0f0',
  };
}

