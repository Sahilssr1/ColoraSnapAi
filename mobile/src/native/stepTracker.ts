import { NativeModules, Platform } from 'react-native';
import { Pedometer } from 'expo-sensors';
import * as Notifications from 'expo-notifications';

/**
 * JS bridge to the native Android foreground step service
 * (StepTrackerService / StepTrackerModule). This file is the ONLY place
 * that touches NativeModules.StepTracker, so every other hook can treat
 * it as "available or not" and fall back cleanly.
 *
 * Availability truth table:
 * - Android dev build (native code compiled in): available.
 * - Expo Go / iOS / web: NativeModules.StepTracker is undefined, so
 *   isNativeStepTrackerAvailable is false and callers use the existing
 *   foreground Expo Pedometer path. Nothing crashes, tracking just
 *   stays foreground-only there — that is a build limitation, not a bug.
 * - Android device with no TYPE_STEP_COUNTER sensor: the service reports
 *   sensorAvailable=false and callers fall back to the pedometer path.
 */
export interface NativeStepStatus {
  todaySteps: number;
  sessionSteps: number;
  sessionActive: boolean;
  sessionPaused: boolean;
  sessionType: 'walk' | 'run' | null;
  elapsedSeconds: number;
  sensorAvailable: boolean;
}

const NativeStepTracker: {
  startTracking: () => Promise<boolean>;
  stopTracking: () => Promise<boolean>;
  getSteps: () => Promise<NativeStepStatus>;
  startSession: (type: string) => Promise<boolean>;
  pauseSession: () => Promise<boolean>;
  resumeSession: () => Promise<boolean>;
  stopSession: () => Promise<number>;
} | null = Platform.OS === 'android' ? (NativeModules.StepTracker ?? null) : null;

export const isNativeStepTrackerAvailable = NativeStepTracker !== null;

export const ensureTrackingPermissions = async (): Promise<boolean> => {
  try {
    const { status } = await Pedometer.requestPermissionsAsync();
    // Notification permission is best-effort: a foreground service's
    // notification is shown by the system even without it, so a denial
    // must not block step tracking.
    try {
      await Notifications.requestPermissionsAsync();
    } catch {}
    return status === 'granted';
  } catch {
    return false;
  }
};

export const startNativeTracking = async (): Promise<boolean> => {
  if (!NativeStepTracker) return false;
  try {
    return await NativeStepTracker.startTracking();
  } catch {
    return false;
  }
};

export const stopNativeTracking = async (): Promise<boolean> => {
  if (!NativeStepTracker) return false;
  try {
    return await NativeStepTracker.stopTracking();
  } catch {
    return false;
  }
};

export const getNativeSteps = async (): Promise<NativeStepStatus | null> => {
  if (!NativeStepTracker) return null;
  try {
    const status = await NativeStepTracker.getSteps();
    if (status == null || typeof status.todaySteps !== 'number') return null;
    return {
      todaySteps: status.todaySteps,
      sessionSteps: status.sessionSteps ?? 0,
      sessionActive: !!status.sessionActive,
      sessionPaused: !!status.sessionPaused,
      sessionType: (status.sessionType as 'walk' | 'run' | null) ?? null,
      elapsedSeconds: status.elapsedSeconds ?? 0,
      sensorAvailable: status.sensorAvailable !== false,
    };
  } catch {
    return null;
  }
};

export const startNativeSession = async (type: 'walk' | 'run'): Promise<boolean> => {
  if (!NativeStepTracker) return false;
  try {
    return await NativeStepTracker.startSession(type);
  } catch {
    return false;
  }
};

export const pauseNativeSession = async (): Promise<boolean> => {
  if (!NativeStepTracker) return false;
  try {
    return await NativeStepTracker.pauseSession();
  } catch {
    return false;
  }
};

export const resumeNativeSession = async (): Promise<boolean> => {
  if (!NativeStepTracker) return false;
  try {
    return await NativeStepTracker.resumeSession();
  } catch {
    return false;
  }
};

export const stopNativeSession = async (): Promise<number | null> => {
  if (!NativeStepTracker) return null;
  try {
    const steps = await NativeStepTracker.stopSession();
    return typeof steps === 'number' ? steps : null;
  } catch {
    return null;
  }
};
