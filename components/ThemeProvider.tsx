import * as SecureStore from 'expo-secure-store';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

import { getThemeColors, THEME_PALETTES, type ThemeColors, type ThemePalette } from '@/constants/colors';

export type Theme = 'light' | 'dark';

type ThemeContextValue = {
  theme: Theme;
  palette: ThemePalette;
  colors: ThemeColors;
  loading: boolean;
  setTheme: (theme: Theme) => Promise<void>;
  setPalette: (palette: ThemePalette) => Promise<void>;
  storageError: string | null;
};

const STORAGE_KEY = 'app-theme';
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

type Preferences = { theme: Theme; palette: ThemePalette };
const DEFAULT_PREFERENCES: Preferences = { theme: 'light', palette: 'purple' };

function isTheme(value: unknown): value is Theme {
  return value === 'light' || value === 'dark';
}

function isPalette(value: unknown): value is ThemePalette {
  return THEME_PALETTES.some((palette) => palette.id === value);
}

async function loadSavedPreferences(): Promise<Preferences> {
  const value = Platform.OS === 'web'
    ? localStorage.getItem(STORAGE_KEY)
    : await SecureStore.getItemAsync(STORAGE_KEY);
  if (!value) return DEFAULT_PREFERENCES;
  if (isTheme(value)) return { ...DEFAULT_PREFERENCES, theme: value };

  const saved = JSON.parse(value) as { theme?: unknown; palette?: unknown };
  if (!isTheme(saved.theme) || !isPalette(saved.palette)) {
    throw new Error('Saved appearance settings are invalid.');
  }
  return { theme: saved.theme, palette: saved.palette };
}

async function savePreferences(preferences: Preferences): Promise<void> {
  const value = JSON.stringify(preferences);
  if (Platform.OS === 'web') {
    localStorage.setItem(STORAGE_KEY, value);
  } else {
    await SecureStore.setItemAsync(STORAGE_KEY, value);
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<Preferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [storageError, setStorageError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    loadSavedPreferences()
      .then((savedPreferences) => {
        if (active) setPreferences(savedPreferences);
      })
      .catch((error: unknown) => {
        if (active) {
          setStorageError(error instanceof Error ? error.message : 'Could not load the saved theme.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const updatePreferences = async (nextPreferences: Preferences) => {
    await savePreferences(nextPreferences);
    setPreferences(nextPreferences);
    setStorageError(null);
  };

  const setTheme = async (nextTheme: Theme) => {
    await updatePreferences({ ...preferences, theme: nextTheme });
  };

  const setPalette = async (nextPalette: ThemePalette) => {
    await updatePreferences({ ...preferences, palette: nextPalette });
  };

  const value = useMemo(
    () => ({
      theme: preferences.theme,
      palette: preferences.palette,
      colors: getThemeColors(preferences.theme, preferences.palette),
      loading,
      setTheme,
      setPalette,
      storageError,
    }),
    [preferences, loading, storageError]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used inside ThemeProvider');
  return value;
}
