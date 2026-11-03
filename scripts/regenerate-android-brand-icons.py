"""Regenerate committed Android branding without prebuild (requires Pillow)."""
from pathlib import Path
import re
from PIL import Image, ImageChops, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
RES = ROOT / 'android/app/src/main/res'
BACKGROUND = '#0d1019'
icon = Image.open(ROOT / 'assets/icon-auric.png').convert('RGBA')
foreground = Image.open(ROOT / 'assets/adaptive-icon-auric.png').convert('RGBA')
# White silhouette of the A/pill artwork on transparency for Android status bars.
mask = icon.convert('L').point(lambda value: 255 if value > 110 else 0)
notification = Image.new('RGBA', icon.size, 'white')
notification.putalpha(mask)
notification.save(ROOT / 'assets/notification-icon-auric.png')
# Retain the splash path used by existing configs, replacing the old AR artwork.
splash = Image.new('RGBA', icon.size, BACKGROUND)
splash.alpha_composite(icon)
splash.convert('RGB').save(ROOT / 'assets/splash.png')
for density, scale in [('mdpi', 1), ('hdpi', 1.5), ('xhdpi', 2), ('xxhdpi', 3), ('xxxhdpi', 4)]:
    mipmap = RES / f'mipmap-{density}'
    mipmap.mkdir(parents=True, exist_ok=True)
    size = int(48 * scale)
    legacy = Image.new('RGBA', (size, size), BACKGROUND)
    legacy.alpha_composite(icon.resize((size, size), Image.Resampling.LANCZOS))
    legacy.save(mipmap / 'ic_launcher.webp', lossless=True)
    circle = Image.new('L', (size * 4, size * 4), 0)
    ImageDraw.Draw(circle).ellipse((0, 0, size * 4 - 1, size * 4 - 1), fill=255)
    rounded = legacy.copy()
    rounded.putalpha(ImageChops.multiply(legacy.getchannel('A'), circle.resize((size, size), Image.Resampling.LANCZOS)))
    rounded.save(mipmap / 'ic_launcher_round.webp', lossless=True)
    adaptive_size = int(108 * scale)
    foreground.resize((adaptive_size, adaptive_size), Image.Resampling.LANCZOS).save(mipmap / 'ic_launcher_foreground.webp', lossless=True)
    drawable = RES / f'drawable-{density}'
    drawable.mkdir(parents=True, exist_ok=True)
    splash_path = drawable / 'splashscreen_logo.png'
    dimensions = Image.open(splash_path).size if splash_path.exists() else (int(288 * scale),) * 2
    splash.resize(dimensions, Image.Resampling.LANCZOS).save(splash_path)
    notification.resize((int(24 * scale),) * 2, Image.Resampling.LANCZOS).save(drawable / 'notification_icon.png')
colors = RES / 'values/colors.xml'
text = colors.read_text(encoding='utf-8')
for name in ['iconBackground', 'splashscreen_background']:
    text = re.sub(rf'(<color name="{name}">)[^<]+', rf'\g<1>{BACKGROUND}', text)
colors.write_text(text, encoding='utf-8')
print('Regenerated launcher, adaptive, splash, and notification icons for all five densities.')
