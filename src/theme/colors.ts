/** Shared premium palette. Gold fills always use ink text; accent text adapts to mode. */
export const gold = { hi: '#FFF0C2', a200: '#F2D994', a300: '#E8C675', y400: '#DBB65C', a400: '#D4AD50', a500: '#C49A45', y600: '#896321', accent: '#DBB65C' };
export const goldGradient = [gold.a200, gold.y400, gold.a500] as const;

export const darkColors = {
  mode: 'dark', bg: '#080E1B', bgStart: '#080E1B', bgEnd: '#131E32',
  card: '#172235', text: '#FFF5E4', sub: '#C8BEAD', accent: '#E8C675',
  chip: '#394156', muted: '#263249', border: '#756340', onAccent: '#17130B', gold: '#DBB65C',
};

export const lightColors = {
  mode: 'light', bg: '#F7F1E5', bgStart: '#FCF8EF', bgEnd: '#EDE2CF',
  card: '#FFFBF2', text: '#192235', sub: '#605747', accent: '#78551A',
  chip: '#E8D9BA', muted: '#EDE3D2', border: '#AA8A50', onAccent: '#17130B', gold: '#DBB65C',
};

// Rose Gold Theme: Elegant blush/soft pink with gold accents
export const roseGoldColors = {
  mode: 'dark', bg: '#1A0E13', bgStart: '#1A0E13', bgEnd: '#2D1A24',
  card: '#2D1A24', text: '#FFF0F5', sub: '#E5C5D3', accent: '#E8A87C',
  chip: '#4A2F3D', muted: '#3D2433', border: '#C98E76', onAccent: '#2D1A24', gold: '#D4A574',
};

export const roseGoldLightColors = {
  mode: 'light', bg: '#FFF5F7', bgStart: '#FFF5F7', bgEnd: '#FFE8F0',
  card: '#FFF0F5', text: '#4A1F35', sub: '#8B5A6F', accent: '#D4738E',
  chip: '#FFD6E5', muted: '#FFE8F0', border: '#D4A574', onAccent: '#FFF5F7', gold: '#D4A574',
};

// Sea Glass / Wellness Teal Theme: Calming teal with cream, premium health feel
export const seaGlassColors = {
  mode: 'dark', bg: '#0A1419', bgStart: '#0A1419', bgEnd: '#152530',
  card: '#1A2F38', text: '#F0F5F7', sub: '#B8CDD6', accent: '#7DB8C4',
  chip: '#2A4450', muted: '#1F3642', border: '#5A8A96', onAccent: '#0A1419', gold: '#A8C5B5',
};

export const seaGlassLightColors = {
  mode: 'light', bg: '#F5F9F7', bgStart: '#FDFEFE', bgEnd: '#EDF5F2',
  card: '#FDFEFE', text: '#1A3D3A', sub: '#527370', accent: '#3A7A7F',
  chip: '#D4E8E6', muted: '#E6F2F0', border: '#6BA59E', onAccent: '#FDFEFE', gold: '#8AB8A8',
};

export const premiumTheme = (dark: boolean) => dark ? darkColors : lightColors;
