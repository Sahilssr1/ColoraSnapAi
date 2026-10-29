import { useState, useEffect, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Pedometer } from 'expo-sensors';

/**
 * Walk / Run session tracker.
 *
 * HONEST BACKGROUND LIMIT (do not promise more than this):
 * Expo's Pedometer does NOT deliver updates while the app is in the
 * background ("Pedometer updates will not be delivered while the app is
 * in the background" — Expo docs), and getStepCountAsync is iOS-only,
 * so on Android steps taken while the app is fully closed cannot be
 * recovered by this code. A session therefore counts live while the app
 * is open. If the app is closed mid-session, the session is restored as
 * PAUSED on reopen (steps taken while closed are not counted), and the
 * user taps Resume to keep tracking. A true always-on background step
 * counter on Android needs a native foreground service or Health
 * Connect — that is a separate native build, not a JS change.
 *
 * What this hook does give the user: an explicit Start Walk / Start Run
 * session with live steps, time, distance and calorie estimates, a
 * pause/resume, a saved session history, and steps that are already
 * part of the daily total via usePedometer (so session steps are NOT
 * posted to /analytics/steps again here — that would double-count).
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
            const updated = { ...prev, sessionSteps: next };
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

  // Load saved session + history on mount. A session that was 'active'
  // when the app closed is restored as PAUSED: its steps were not counted
  // while the app was closed, so resuming must not pretend they were.
  useEffect(() => {
    const load = async () => {
      try {
        const rawHistory = await AsyncStorage.getItem(HISTORY_KEY);
        if (rawHistory) setHistory(JSON.parse(rawHistory));
        const rawActive = await AsyncStorage.getItem(ACTIVE_KEY);
        if (rawActive) {
          const saved: ActiveSession = JSON.parse(rawActive);
          if (saved.status === 'active') {
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
    const elapsed = current.startedAt
      ? current.accumulatedSeconds + (Date.now() - current.startedAt) / 1000
      : current.accumulatedSeconds;
    const next: ActiveSession = { ...current, status: 'paused', startedAt: null, accumulatedSeconds: elapsed };
    setSession(next);
    await persistActive(next);
  }, [stopWatch, persistActive]);

  const resumeSession = useCallback(async () => {
    const current = sessionRef.current;
    if (!current || current.status !== 'paused') return;
    setError('');
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
    const elapsed = current.startedAt
      ? current.accumulatedSeconds + (Date.now() - current.startedAt) / 1000
      : current.accumulatedSeconds;
    const durationSeconds = Math.floor(elapsed);
    const distanceKm = Number(((current.sessionSteps * STRIDE_M[current.type]) / 1000).toFixed(2));
    const calories = Math.round(current.sessionSteps * CAL_PER_STEP[current.type]);
    const record: SessionRecord = {
      id: `${Date.now()}`,
      type: current.type,
      startedAt: current.startedAt ? current.startedAt - current.accumulatedSeconds * 1000 : Date.now() - durationSeconds * 1000,
      endedAt: Date.now(),
      durationSeconds,
      steps: current.sessionSteps,
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
