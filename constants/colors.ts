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

export type ThemePalette =
  | 'purple'
  | 'blue'
  | 'green'
  | 'orange'
  | 'teal'
  | 'rose'
  | 'indigo'
  | 'red'
  | 'yellow'
  | 'cyan'
  | 'navy'
  | 'mint'
  | 'coral'
  | 'gold'
  | 'slate'
  | 'lavender';
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
  {
    id: 'teal',
    label: 'Teal',
    swatch: '#0F766E',
    light: {
      primary: '#0F766E', accent: '#0284C7', textOnPrimary: '#FFFFFF',
      surface: '#CCFBF1', surfaceLight: '#F0FDFA', border: '#99F6E4', shadow: '#115E59',
    },
    dark: {
      primary: '#5EEAD4', accent: '#7DD3FC', textOnPrimary: '#042F2E',
      surface: '#134E4A', surfaceLight: '#123A39', border: '#24645F', shadow: '#000000',
    },
  },
  {
    id: 'rose',
    label: 'Rose',
    swatch: '#E11D48',
    light: {
      primary: '#E11D48', accent: '#C026D3', textOnPrimary: '#FFFFFF',
      surface: '#FFE4E6', surfaceLight: '#FFF1F2', border: '#FECDD3', shadow: '#BE123C',
    },
    dark: {
      primary: '#FDA4AF', accent: '#F0ABFC', textOnPrimary: '#4C0519',
      surface: '#5F2536', surfaceLight: '#40202C', border: '#713446', shadow: '#000000',
    },
  },
  {
    id: 'indigo',
    label: 'Indigo',
    swatch: '#4F46E5',
    light: {
      primary: '#4F46E5', accent: '#7C3AED', textOnPrimary: '#FFFFFF',
      surface: '#E0E7FF', surfaceLight: '#EEF2FF', border: '#C7D2FE', shadow: '#3730A3',
    },
    dark: {
      primary: '#A5B4FC', accent: '#C4B5FD', textOnPrimary: '#1E1B4B',
      surface: '#312E67', surfaceLight: '#252449', border: '#45427F', shadow: '#000000',
    },
  },
  {
    id: 'red',
    label: 'Red',
    swatch: '#B91C1C',
    light: {
      primary: '#B91C1C', accent: '#EA580C', textOnPrimary: '#FFFFFF',
      surface: '#FEE2E2', surfaceLight: '#FEF2F2', border: '#FECACA', shadow: '#991B1B',
    },
    dark: {
      primary: '#FCA5A5', accent: '#FDBA74', textOnPrimary: '#450A0A',
      surface: '#5C2727', surfaceLight: '#402020', border: '#713737', shadow: '#000000',
    },
  },
  {
    id: 'yellow',
    label: 'Yellow',
    swatch: '#A16207',
    light: {
      primary: '#A16207', accent: '#CA8A04', textOnPrimary: '#FFFFFF',
      surface: '#FEF3C7', surfaceLight: '#FFFBEB', border: '#FDE68A', shadow: '#854D0E',
    },
    dark: {
      primary: '#FDE047', accent: '#FACC15', textOnPrimary: '#422006',
      surface: '#514313', surfaceLight: '#332D18', border: '#675719', shadow: '#000000',
    },
  },
  {
    id: 'cyan',
    label: 'Cyan',
    swatch: '#0E7490',
    light: {
      primary: '#0E7490', accent: '#0891B2', textOnPrimary: '#FFFFFF',
      surface: '#CFFAFE', surfaceLight: '#ECFEFF', border: '#A5F3FC', shadow: '#155E75',
    },
    dark: {
      primary: '#67E8F9', accent: '#22D3EE', textOnPrimary: '#083344',
      surface: '#164E63', surfaceLight: '#163743', border: '#246275', shadow: '#000000',
    },
  },
  {
    id: 'navy',
    label: 'Navy',
    swatch: '#1E3A8A',
    light: {
      primary: '#1E3A8A', accent: '#2563EB', textOnPrimary: '#FFFFFF',
      surface: '#DBEAFE', surfaceLight: '#EFF6FF', border: '#BFDBFE', shadow: '#172554',
    },
    dark: {
      primary: '#93C5FD', accent: '#60A5FA', textOnPrimary: '#172554',
      surface: '#1E3A5F', surfaceLight: '#1B2D46', border: '#345578', shadow: '#000000',
    },
  },
  {
    id: 'mint',
    label: 'Mint',
    swatch: '#047857',
    light: {
      primary: '#047857', accent: '#059669', textOnPrimary: '#FFFFFF',
      surface: '#D1FAE5', surfaceLight: '#ECFDF5', border: '#A7F3D0', shadow: '#065F46',
    },
    dark: {
      primary: '#6EE7B7', accent: '#34D399', textOnPrimary: '#022C22',
      surface: '#164E3D', surfaceLight: '#15372E', border: '#28634E', shadow: '#000000',
    },
  },
  {
    id: 'coral',
    label: 'Coral',
    swatch: '#C2413B',
    light: {
      primary: '#C2413B', accent: '#EA580C', textOnPrimary: '#FFFFFF',
      surface: '#FFE4DE', surfaceLight: '#FFF4F0', border: '#FECACA', shadow: '#9F302B',
    },
    dark: {
      primary: '#FDA4A0', accent: '#FDBA74', textOnPrimary: '#431407',
      surface: '#5C302C', surfaceLight: '#402724', border: '#713D38', shadow: '#000000',
    },
  },
  {
    id: 'gold',
    label: 'Gold',
    swatch: '#B45309',
    light: {
      primary: '#B45309', accent: '#D97706', textOnPrimary: '#FFFFFF',
      surface: '#FFEDD5', surfaceLight: '#FFF7ED', border: '#FED7AA', shadow: '#9A3412',
    },
    dark: {
      primary: '#FDBA74', accent: '#FCD34D', textOnPrimary: '#431407',
      surface: '#5B3823', surfaceLight: '#3D2B21', border: '#70482D', shadow: '#000000',
    },
  },
  {
    id: 'slate',
    label: 'Slate',
    swatch: '#475569',
    light: {
      primary: '#475569', accent: '#0F766E', textOnPrimary: '#FFFFFF',
      surface: '#E2E8F0', surfaceLight: '#F8FAFC', border: '#CBD5E1', shadow: '#334155',
    },
    dark: {
      primary: '#CBD5E1', accent: '#5EEAD4', textOnPrimary: '#1E293B',
      surface: '#334155', surfaceLight: '#273444', border: '#475569', shadow: '#000000',
    },
  },
  {
    id: 'lavender',
    label: 'Lavender',
    swatch: '#7E22CE',
    light: {
      primary: '#7E22CE', accent: '#A855F7', textOnPrimary: '#FFFFFF',
      surface: '#F3E8FF', surfaceLight: '#FAF5FF', border: '#E9D5FF', shadow: '#6B21A8',
    },
    dark: {
      primary: '#D8B4FE', accent: '#C084FC', textOnPrimary: '#3B0764',
      surface: '#4C1D6B', surfaceLight: '#352348', border: '#633B82', shadow: '#000000',
    },
  },
];

export function getThemeColors(theme: 'light' | 'dark', palette: ThemePalette): ThemeColors {
  const base = theme === 'dark' ? DARK_COLORS : COLORS;
  const colors = THEME_PALETTES.find((option) => option.id === palette);
  return { ...base, ...(theme === 'dark' ? colors?.dark : colors?.light) };
}
