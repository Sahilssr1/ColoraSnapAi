import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import themeReducer from './slices/themeSlice';
import scannerReducer from './slices/scannerSlice';
import mealReducer from './slices/mealSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    theme: themeReducer,
    scanner: scannerReducer,
    meal: mealReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
