import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type ThemeMode = 'system' | 'light' | 'dark';

interface ThemeState {
  themeMode: ThemeMode;
  unitSystem: 'metric' | 'imperial';
}

const initialState: ThemeState = {
  themeMode: 'light', // Defaults to clean light theme (#F9FAFB)
  unitSystem: 'metric',
};

export const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setThemeMode: (state, action: PayloadAction<ThemeMode>) => {
      state.themeMode = action.payload;
    },
    toggleTheme: (state) => {
      if (state.themeMode === 'light') {
        state.themeMode = 'dark';
      } else if (state.themeMode === 'dark') {
        state.themeMode = 'system';
      } else {
        state.themeMode = 'light';
      }
    },
    setUnitSystem: (state, action: PayloadAction<'metric' | 'imperial'>) => {
      state.unitSystem = action.payload;
    },
  },
});

export const { setThemeMode, toggleTheme, setUnitSystem } = themeSlice.actions;
export default themeSlice.reducer;
