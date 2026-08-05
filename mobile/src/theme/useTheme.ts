import { useColorScheme } from 'react-native';
import { useAppSelector, useAppDispatch } from '../redux/hooks';
import { setThemeMode, toggleTheme, ThemeMode } from '../redux/slices/themeSlice';
import { AppleHealthThemes, ThemeColors, Colors } from './colors';

export interface UseThemeReturn {
  theme: ThemeColors;
  isDark: boolean;
  themeMode: ThemeMode;
  setTheme: (mode: ThemeMode) => void;
  toggle: () => void;
  colors: typeof Colors;
}

export const useTheme = (): UseThemeReturn => {
  const systemScheme = useColorScheme();
  const themeMode = useAppSelector((state) => state.theme.themeMode);
  const dispatch = useAppDispatch();

  const isDark =
    themeMode === 'system'
      ? systemScheme === 'dark'
      : themeMode === 'dark';

  const theme = isDark ? AppleHealthThemes.dark : AppleHealthThemes.light;

  return {
    theme,
    isDark,
    themeMode,
    setTheme: (mode: ThemeMode) => dispatch(setThemeMode(mode)),
    toggle: () => dispatch(toggleTheme()),
    colors: Colors,
  };
};
