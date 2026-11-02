import { useWallpaper } from '../contexts/WallpaperContext';
export function useDynamicTheme() {
  const { getTextColor, getSubTextColor, getAccentColor, getCardBackgroundColor, getCardBorderColor } = useWallpaper();
  return { text: getTextColor(), subText: getSubTextColor(), accent: getAccentColor(), card: getCardBackgroundColor(), chip: getCardBorderColor() };
}
