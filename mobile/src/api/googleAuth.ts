import { Alert } from 'react-native';
import { GOOGLE_AUTH_CONFIG } from '../constants/config';

let GoogleSigninModule: any = null;
let statusCodesModule: any = {};
let isConfigured = false;

try {
  const gSignin = require('@react-native-google-signin/google-signin');
  GoogleSigninModule = gSignin.GoogleSignin;
  statusCodesModule = gSignin.statusCodes || {};
  if (GoogleSigninModule && typeof GoogleSigninModule.configure === 'function') {
    GoogleSigninModule.configure({
      webClientId: GOOGLE_AUTH_CONFIG.webClientId,
      iosClientId: GOOGLE_AUTH_CONFIG.iosClientId,
      offlineAccess: false,
      scopes: ['profile', 'email'],
    });
    isConfigured = true;
  }
} catch (e) {
  // Native module is not available in standard Expo Go
}

export const isGoogleAuthAvailable = (): boolean => {
  return isConfigured && Boolean(GoogleSigninModule);
};

export const signInWithGoogle = async (): Promise<{
  id: string;
  email: string;
  name: string;
  picture?: string;
} | null> => {
  if (!isGoogleAuthAvailable()) {
    Alert.alert(
      'Expo Go Limitation',
      'Google Sign-In requires native binaries (standalone APK or Dev Build).\n\nTo test in Expo Go, please use Email/Password sign in.'
    );
    return null;
  }

  try {
    await GoogleSigninModule.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const userInfo = await GoogleSigninModule.signIn();
    if (userInfo?.user) {
      return {
        id: userInfo.user.id,
        email: userInfo.user.email,
        name: userInfo.user.name || 'Calora User',
        picture: userInfo.user.photo || undefined,
      };
    }
    return null;
  } catch (err: any) {
    if (err.code === statusCodesModule.SIGN_IN_CANCELLED) {
      return null;
    }
    throw err;
  }
};

export const statusCodes = statusCodesModule;
