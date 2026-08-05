import { Platform } from 'react-native';

// Standard local development URLs
// Android Emulator uses 10.0.2.2, iOS Simulator uses localhost
const LOCAL_IP = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

export const API_BASE_URL = `http://${LOCAL_IP}:5000/api/v1`;

export const GOOGLE_AUTH_CONFIG = {
  webClientId: '523607561287-ck3d4v5gf4rmtr02o9a54jac9coampvh.apps.googleusercontent.com',
  androidClientId: '523607561287-ck3d4v5gf4rmtr02o9a54jac9coampvh.apps.googleusercontent.com',
  iosClientId: '523607561287-ck3d4v5gf4rmtr02o9a54jac9coampvh.apps.googleusercontent.com',
};

export const APP_CONFIG = {
  appName: 'Calora AI',
  version: '1.0.0',
  defaultWaterGoalMl: 2500,
  defaultCalorieGoal: 2000,
  supportEmail: 'support@calora.ai',
};
