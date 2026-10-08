export const COLORS = {
  primary: '#8B2FC9',
  accent: '#F04F9D',
  background: '#FBF6FF',
  card: '#FFFFFF',
  textPrimary: '#261332',
  textSecondary: '#765B82',
  textOnPrimary: '#FFFFFF',
  surface: '#F3DDFB',
  surfaceLight: '#FFF0F8',
  border: '#E9D5F0',
  textTertiary: '#A487AE',
  shadow: '#6B238F',
} as const;

export const DARK_COLORS: { [Key in keyof typeof COLORS]: string } = {
  primary: '#C084FC',
  accent: '#F472B6',
  background: '#17121D',
  card: '#241B2D',
  textPrimary: '#F7EDFF',
  textSecondary: '#C0AEC9',
  textOnPrimary: '#261332',
  surface: '#382642',
  surfaceLight: '#2D2238',
  border: '#493653',
  textTertiary: '#A890B4',
  shadow: '#000000',
};

export type ThemePalette = 'purple' | 'blue' | 'green' | 'orange';
export type ThemeColors = { [Key in keyof typeof COLORS]: string };

export const THEME_PALETTES: {
  id: ThemePalette;
  label: string;
  swatch: string;
  light: Pick<ThemeColors, 'primary' | 'accent' | 'textOnPrimary' | 'surface' | 'surfaceLight' | 'border' | 'shadow'>;
  dark: Pick<ThemeColors, 'primary' | 'accent' | 'textOnPrimary' | 'surface' | 'surfaceLight' | 'border' | 'shadow'>;
}[] = [
  {
    id: 'purple',
    label: 'Purple',
    swatch: '#8B2FC9',
    light: {
      primary: '#8B2FC9', accent: '#F04F9D', textOnPrimary: '#FFFFFF',
      surface: '#F3DDFB', surfaceLight: '#FFF0F8', border: '#E9D5F0', shadow: '#6B238F',
    },
    dark: {
      primary: '#C084FC', accent: '#F472B6', textOnPrimary: '#261332',
      surface: '#382642', surfaceLight: '#2D2238', border: '#493653', shadow: '#000000',
    },
  },
  {
    id: 'blue',
    label: 'Blue',
    swatch: '#2563EB',
    light: {
      primary: '#2563EB', accent: '#0891B2', textOnPrimary: '#FFFFFF',
      surface: '#DBEAFE', surfaceLight: '#EFF6FF', border: '#BFDBFE', shadow: '#1D4ED8',
    },
    dark: {
      primary: '#93C5FD', accent: '#67E8F9', textOnPrimary: '#172554',
      surface: '#1E3A5F', surfaceLight: '#1B2D46', border: '#345578', shadow: '#000000',
    },
  },
  {
    id: 'green',
    label: 'Green',
    swatch: '#15803D',
    light: {
      primary: '#15803D', accent: '#0F766E', textOnPrimary: '#FFFFFF',
      surface: '#DCFCE7', surfaceLight: '#F0FDF4', border: '#BBF7D0', shadow: '#166534',
    },
    dark: {
      primary: '#86EFAC', accent: '#5EEAD4', textOnPrimary: '#052E16',
      surface: '#1B4332', surfaceLight: '#17352B', border: '#2B5C46', shadow: '#000000',
    },
  },
  {
    id: 'orange',
    label: 'Orange',
    swatch: '#C2410C',
    light: {
      primary: '#C2410C', accent: '#BE185D', textOnPrimary: '#FFFFFF',
      surface: '#FFEDD5', surfaceLight: '#FFF7ED', border: '#FED7AA', shadow: '#9A3412',
    },
    dark: {
      primary: '#FDBA74', accent: '#FDA4AF', textOnPrimary: '#431407',
      surface: '#5B3420', surfaceLight: '#3C291F', border: '#70472E', shadow: '#000000',
    },
  },
];

export function getThemeColors(theme: 'light' | 'dark', palette: ThemePalette): ThemeColors {
  const base = theme === 'dark' ? DARK_COLORS : COLORS;
  const colors = THEME_PALETTES.find((option) => option.id === palette);
  return { ...base, ...(theme === 'dark' ? colors?.dark : colors?.light) };
}
