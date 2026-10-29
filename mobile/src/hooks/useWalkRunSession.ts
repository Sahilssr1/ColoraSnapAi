import { useState, useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Pedometer } from 'expo-sensors';
import {
  isNativeStepTrackerAvailable,
  getNativeSteps,
  startNativeSession,
  pauseNativeSession,
  resumeNativeSession,
  stopNativeSession,
} from '../native/stepTracker';

/**
 * Walk / Run session tracker.
 *
 * Background tracking, by platform (this is the whole point of the
 * native service added with this change):
 * - Android dev build: a foreground service (StepTrackerService) keeps
 *   the hardware step counter listener alive when the app is minimised
 *   or the screen is locked, and writes session steps to
 *   SharedPreferences. A session that was active when the app closed is
 *   therefore restored as ACTIVE, not paused, and its steps include
 *   steps taken while the app was closed.
 * - iOS: there is no equivalent Expo background pedometer. The system
 *   Health app still counts while the app is backgrounded, and
 *   Pedometer.getStepCountAsync (iOS-only) recovers the steps taken
 *   between the last JS update and reopen, so an active session is
 *   restored as ACTIVE with that delta added.
 * - Expo Go / no native service: the old behaviour remains — the
 *   session is restored as PAUSED, because steps taken while closed
 *   genuinely were not counted.
 *
 * Session steps are NOT posted to /analytics/steps again here — they
 * are already part of the daily total via usePedometer (native service
 * or foreground watch), so posting them again would double-count.
 * The backend API is unchanged.
 */

export type SessionType = 'walk' | 'run';

export interface ActiveSession {
  type: SessionType;
  status: 'active' | 'paused';
  /** ms timestamp when the current active period started (null when paused) */
  startedAt: number | null;
  /** seconds accumulated before the current active period */
  accumulatedSeconds: number;
  /** steps accumulated (including steps saved before a pause / reopen) */
  sessionSteps: number;
  /** true when the app was closed mid-session and the session came back paused */
  wasInterrupted?: boolean;
  /** ms timestamp of the last step update — used for iOS background recovery */
  lastStepUpdateAt?: number;
}

export interface SessionRecord {
  id: string;
  type: SessionType;
  startedAt: number;
  endedAt: number;
  durationSeconds: number;
  steps: number;
  distanceKm: number;
  calories: number;
}

const ACTIVE_KEY = '@calora_active_session';
const HISTORY_KEY = '@calora_session_history';

const STRIDE_M: Record<SessionType, number> = { walk: 0.762, run: 1.0 };
const CAL_PER_STEP: Record<SessionType, number> = { walk: 0.04, run: 0.06 };

export const formatDuration = (totalSeconds: number): string => {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
};

export const useWalkRunSession = () => {
  const [session, setSession] = useState<ActiveSession | null>(null);
  const [history, setHistory] = useState<SessionRecord[]>([]);
  const [isAvailable, setIsAvailable] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const subscriptionRef = useRef<Pedometer.Subscription | null>(null);
  const savedStepsRef = useRef<number>(0);
  const sessionRef = useRef<ActiveSession | null>(null);
  sessionRef.current = session;
  // True only when this session is being counted by the native service
  // (not the Expo watch). It is a ref, not state, because it must not
  // trigger a re-render and must survive inside callbacks.
  const nativeSessionRef = useRef<boolean>(false);

  const persistActive = useCallback(async (value: ActiveSession | null) => {
    try {
      if (value) await AsyncStorage.setItem(ACTIVE_KEY, JSON.stringify(value));
      else await AsyncStorage.removeItem(ACTIVE_KEY);
    } catch {}
  }, []);

  const stopWatch = useCallback(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current.remove();
      subscriptionRef.current = null;
    }
  }, []);

  const startWatch = useCallback(
    async (baseSteps: number) => {
      stopWatch();
      try {
        const { status } = await Pedometer.requestPermissionsAsync();
        if (status !== 'granted') {
          setIsAvailable(false);
          setError('Motion permission not granted. Allow Physical Activity in Settings to track steps.');
          return false;
        }
        const available = await Pedometer.isAvailableAsync();
        setIsAvailable(available);
        if (!available) {
          setError('Step sensor is not available on this device.');
          return false;
        }
        savedStepsRef.current = baseSteps;
        subscriptionRef.current = Pedometer.watchStepCount((result) => {
          const next = savedStepsRef.current + result.steps;
          setSession((prev) => {
            if (!prev) return prev;
            const updated = { ...prev, sessionSteps: next, lastStepUpdateAt: Date.now() };
            // Persist so a reopen restores the count (as paused, see below).
            AsyncStorage.setItem(ACTIVE_KEY, JSON.stringify(updated)).catch(() => {});
            return updated;
          });
        });
        return true;
      } catch (e) {
        setError('Could not start step tracking on this device.');
        return false;
      }
    },
    [stopWatch]
  );

  // Load saved session + history on mount, recovering background steps
  // wherever the platform actually counted them:
  // 1. Android native service: the service kept counting, so restore
  //    as ACTIVE with the service's session steps and elapsed time.
  // 2. iOS: HealthKit counted while backgrounded; getStepCountAsync
  //    (iOS-only) recovers steps since the last JS update, so restore
  //    as ACTIVE with that delta added.
  // 3. Anything else (Expo Go, no sensor): restore as PAUSED, because
  //    steps taken while closed genuinely were not counted — resuming
  //    must not pretend they were.
  useEffect(() => {
    const load = async () => {
      try {
        const rawHistory = await AsyncStorage.getItem(HISTORY_KEY);
        if (rawHistory) setHistory(JSON.parse(rawHistory));
        const rawActive = await AsyncStorage.getItem(ACTIVE_KEY);
        if (rawActive) {
          const saved: ActiveSession = JSON.parse(rawActive);
          if (saved.status === 'active') {
            if (isNativeStepTrackerAvailable) {
              const status = await getNativeSteps();
              if (status?.sessionActive) {
                nativeSessionRef.current = true;
                const restored: ActiveSession = {
                  ...saved,
                  type: status.sessionType ?? saved.type,
                  status: status.sessionPaused ? 'paused' : 'active',
                  startedAt: status.sessionPaused ? null : Date.now(),
                  accumulatedSeconds: status.elapsedSeconds,
                  sessionSteps: status.sessionSteps,
                  wasInterrupted: false,
                };
                setSession(restored);
                await persistActive(restored);
                return;
              }
            }
            if (Platform.OS === 'ios' && saved.lastStepUpdateAt) {
              try {
                const result = await Pedometer.getStepCountAsync(
                  new Date(saved.lastStepUpdateAt),
                  new Date()
                );
                const delta = result?.steps ?? 0;
                const elapsedBeforeBackground =
                  saved.accumulatedSeconds +
                  (saved.startedAt ? (saved.lastStepUpdateAt - saved.startedAt) / 1000 : 0);
                const restored: ActiveSession = {
                  ...saved,
                  status: 'active',
                  startedAt: Date.now(),
                  accumulatedSeconds: elapsedBeforeBackground,
                  sessionSteps: saved.sessionSteps + delta,
                  wasInterrupted: false,
                };
                setSession(restored);
                await persistActive(restored);
                return;
              } catch {
                // Fall through to the paused restore below.
              }
            }
            const interrupted: ActiveSession = {
              ...saved,
              status: 'paused',
              startedAt: null,
              wasInterrupted: true,
            };
            setSession(interrupted);
            await persistActive(interrupted);
          } else {
            setSession(saved);
          }
        }
      } catch {}
    };
    load();
    return () => stopWatch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // While a native session is active, poll the service for its steps
  // (1s, matching the timer tick). Only set state when the count
  // changed, so a tick with no new steps does not re-render.
  useEffect(() => {
    if (session?.status !== 'active' || !nativeSessionRef.current) return;
    const id = setInterval(async () => {
      const status = await getNativeSteps();
      if (!status?.sessionActive) return;
      setSession((prev) =>
        prev && prev.sessionSteps !== status.sessionSteps
          ? { ...prev, sessionSteps: status.sessionSteps, lastStepUpdateAt: Date.now() }
          : prev
      );
    }, 1000);
    return () => clearInterval(id);
  }, [session?.status]);

  // Live timer tick while active.
  const [now, setNow] = useState<number>(Date.now());
  useEffect(() => {
    if (session?.status !== 'active') return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [session?.status]);

  const startSession = useCallback(
    async (type: SessionType) => {
      setError('');
      // Prefer the native service: it keeps counting in the background.
      // Only fall back to the Expo watch if the service is unavailable.
      if (isNativeStepTrackerAvailable) {
        const ok = await startNativeSession(type);
        if (ok) {
          nativeSessionRef.current = true;
          const next: ActiveSession = {
            type,
            status: 'active',
            startedAt: Date.now(),
            accumulatedSeconds: 0,
            sessionSteps: 0,
          };
          setSession(next);
          await persistActive(next);
          return;
        }
      }
      const ok = await startWatch(0);
      if (!ok) return;
      const next: ActiveSession = {
        type,
        status: 'active',
        startedAt: Date.now(),
        accumulatedSeconds: 0,
        sessionSteps: 0,
      };
      setSession(next);
      await persistActive(next);
    },
    [startWatch, persistActive]
  );

  const pauseSession = useCallback(async () => {
    const current = sessionRef.current;
    if (!current || current.status !== 'active') return;
    stopWatch();
    let elapsed = current.startedAt
      ? current.accumulatedSeconds + (Date.now() - current.startedAt) / 1000
      : current.accumulatedSeconds;
    if (nativeSessionRef.current) {
      await pauseNativeSession();
      // Trust the service's elapsed time over the JS timer, which stops
      // advancing while the JS process is suspended.
      const status = await getNativeSteps();
      if (status) elapsed = status.elapsedSeconds;
    }
    const next: ActiveSession = { ...current, status: 'paused', startedAt: null, accumulatedSeconds: elapsed };
    setSession(next);
    await persistActive(next);
  }, [stopWatch, persistActive]);

  const resumeSession = useCallback(async () => {
    const current = sessionRef.current;
    if (!current || current.status !== 'paused') return;
    setError('');
    // Only resume natively if this session was started natively. A session
    // started with the Expo watch must resume with the watch, or its
    // accumulated steps (which the service never saw) would reset to 0.
    if (nativeSessionRef.current) {
      const ok = await resumeNativeSession();
      if (ok) {
        nativeSessionRef.current = true;
        const status = await getNativeSteps();
        const next: ActiveSession = {
          ...current,
          status: 'active',
          startedAt: Date.now(),
          wasInterrupted: false,
          sessionSteps: status?.sessionSteps ?? current.sessionSteps,
        };
        setSession(next);
        await persistActive(next);
        return;
      }
    }
    const ok = await startWatch(current.sessionSteps);
    if (!ok) return;
    const next: ActiveSession = { ...current, status: 'active', startedAt: Date.now(), wasInterrupted: false };
    setSession(next);
    await persistActive(next);
  }, [startWatch, persistActive]);

  const stopSession = useCallback(async () => {
    const current = sessionRef.current;
    if (!current) return;
    stopWatch();
    let finalSteps = current.sessionSteps;
    if (nativeSessionRef.current) {
      const nativeSteps = await stopNativeSession();
      if (nativeSteps != null) finalSteps = nativeSteps;
      nativeSessionRef.current = false;
    }
    const elapsed = current.startedAt
      ? current.accumulatedSeconds + (Date.now() - current.startedAt) / 1000
      : current.accumulatedSeconds;
    const durationSeconds = Math.floor(elapsed);
    const distanceKm = Number(((finalSteps * STRIDE_M[current.type]) / 1000).toFixed(2));
    const calories = Math.round(finalSteps * CAL_PER_STEP[current.type]);
    const record: SessionRecord = {
      id: `${Date.now()}`,
      type: current.type,
      startedAt: current.startedAt ? current.startedAt - current.accumulatedSeconds * 1000 : Date.now() - durationSeconds * 1000,
      endedAt: Date.now(),
      durationSeconds,
      steps: finalSteps,
      distanceKm,
      calories,
    };
    const nextHistory = [record, ...history].slice(0, 50);
    setHistory(nextHistory);
    try {
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(nextHistory));
    } catch {}
    setSession(null);
    await persistActive(null);
  }, [stopWatch, history, persistActive]);

  const elapsedSeconds = session
    ? session.status === 'active' && session.startedAt
      ? session.accumulatedSeconds + (now - session.startedAt) / 1000
      : session.accumulatedSeconds
    : 0;

  const steps = session?.sessionSteps ?? 0;
  const distanceKm = session ? Number(((steps * STRIDE_M[session.type]) / 1000).toFixed(2)) : 0;
  const calories = session ? Math.round(steps * CAL_PER_STEP[session.type]) : 0;
  const paceMinPerKm =
    session && distanceKm > 0 ? elapsedSeconds / 60 / distanceKm : null;

  return {
    session,
    history,
    isAvailable,
    error,
    elapsedSeconds: Math.floor(elapsedSeconds),
    steps,
    distanceKm,
    calories,
    paceMinPerKm,
    startSession,
    pauseSession,
    resumeSession,
    stopSession,
  };
};
