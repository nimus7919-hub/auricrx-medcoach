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
export const premiumTheme = (dark: boolean) => dark ? darkColors : lightColors;
