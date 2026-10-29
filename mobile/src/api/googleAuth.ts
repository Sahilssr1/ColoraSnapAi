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
  idToken: string;
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
    // v12 returns { user, idToken, ... } at the top level; newer versions
    // nest them under .data. Handle both so a library upgrade can't silently
    // drop the token (the backend now requires idToken, not just googleId).
    const payload = userInfo?.data ?? userInfo;
    const user = payload?.user;
    const idToken = payload?.idToken;
    if (user && idToken) {
      return {
        id: user.id,
        email: user.email,
        name: user.name || 'Calora User',
        picture: user.photo || undefined,
        idToken,
      };
    }
    if (user && !idToken) {
      // webClientId missing or wrong in Google Cloud Console: Google returns
      // a profile but no token. Surface that instead of failing at the backend.
      throw new Error(
        'Google returned no ID token. Check webClientId in Google Cloud Console (it must be the WEB client, not Android).'
      );
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
