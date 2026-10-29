import { createNavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from './types';

// Global navigation ref so code outside screens (e.g. the API client,
// which runs when a refresh token expires) can send the user back to Login
// instead of leaving them stuck inside MainTabs with a dead session.
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export const resetToLogin = () => {
  if (navigationRef.isReady()) {
    navigationRef.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  }
};
