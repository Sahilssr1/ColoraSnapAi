import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Footprints, Play, Pause, Square, Activity } from 'lucide-react-native';
import { useTheme } from '../theme/useTheme';
import { GlassCard } from './GlassCard';
import { useWalkRunSession, formatDuration } from '../hooks/useWalkRunSession';

/**
 * User-facing Walk / Run tracker card (used on the Home screen).
 * Live tracking runs while the app is open; see useWalkRunSession for
 * the background limit, which is also stated in the card's note below
 * so the user is not misled about steps taken while the app is closed.
 */
export const WalkRunTracker: React.FC = () => {
  const { theme } = useTheme();
  const {
    session,
    history,
    error,
    elapsedSeconds,
    steps,
    distanceKm,
    calories,
    paceMinPerKm,
    startSession,
    pauseSession,
    resumeSession,
    stopSession,
  } = useWalkRunSession();

  const isActive = session?.status === 'active';
  const isPaused = session?.status === 'paused';

  return (
    <GlassCard style={styles.card}>
      <View style={styles.headerRow}>
        <Activity color="#34C759" size={18} strokeWidth={2.5} />
        <Text style={[styles.title, { color: theme.textPrimary }]}>Walk / Run Tracker</Text>
        {session && (
          <Text style={[styles.status, { color: isActive ? '#34C759' : '#FF9500' }]}>
            {isActive ? '● Tracking' : '❚❚ Paused'}
          </Text>
        )}
      </View>

      {session ? (
        <>
          <Text style={[styles.sessionType, { color: theme.textSecondary }]}>
            {session.type === 'walk' ? 'Walking' : 'Running'}
            {session.wasInterrupted
              ? ' — app was closed, so steps taken while closed were not counted. Resume to continue.'
              : ''}
          </Text>
          <Text style={[styles.timer, { color: theme.textPrimary }]}>{formatDuration(elapsedSeconds)}</Text>
          <View style={styles.metricsRow}>
            <View style={styles.metric}>
              <Text style={[styles.metricValue, { color: theme.textPrimary }]}>{steps.toLocaleString()}</Text>
              <Text style={[styles.metricLabel, { color: theme.textMuted }]}>steps</Text>
            </View>
            <View style={styles.metric}>
              <Text style={[styles.metricValue, { color: theme.textPrimary }]}>{distanceKm} km</Text>
              <Text style={[styles.metricLabel, { color: theme.textMuted }]}>distance*</Text>
            </View>
            <View style={styles.metric}>
              <Text style={[styles.metricValue, { color: theme.textPrimary }]}>{calories}</Text>
              <Text style={[styles.metricLabel, { color: theme.textMuted }]}>kcal*</Text>
            </View>
            <View style={styles.metric}>
              <Text style={[styles.metricValue, { color: theme.textPrimary }]}>
                {paceMinPerKm ? `${paceMinPerKm.toFixed(1)}` : '—'}
              </Text>
              <Text style={[styles.metricLabel, { color: theme.textMuted }]}>min/km</Text>
            </View>
          </View>
          <View style={styles.buttonsRow}>
            {isActive ? (
              <TouchableOpacity style={[styles.btn, styles.pauseBtn]} onPress={pauseSession} activeOpacity={0.7}>
                <Pause color="#FFFFFF" size={16} strokeWidth={2.5} />
                <Text style={styles.btnText}>Pause</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={[styles.btn, styles.startBtn]} onPress={resumeSession} activeOpacity={0.7}>
                <Play color="#FFFFFF" size={16} strokeWidth={2.5} />
                <Text style={styles.btnText}>Resume</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[styles.btn, styles.stopBtn]} onPress={stopSession} activeOpacity={0.7}>
              <Square color="#FFFFFF" size={14} strokeWidth={2.5} />
              <Text style={styles.btnText}>Stop &amp; Save</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Start a session to track a walk or run live — steps, time, distance and calories.
          </Text>
          <View style={styles.buttonsRow}>
            <TouchableOpacity style={[styles.btn, styles.startBtn]} onPress={() => startSession('walk')} activeOpacity={0.7}>
              <Footprints color="#FFFFFF" size={16} strokeWidth={2.5} />
              <Text style={styles.btnText}>Start Walk</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.runBtn]} onPress={() => startSession('run')} activeOpacity={0.7}>
              <Activity color="#FFFFFF" size={16} strokeWidth={2.5} />
              <Text style={styles.btnText}>Start Run</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Text style={[styles.note, { color: theme.textMuted }]}>
        * Distance and calories are estimates from steps. Live tracking counts while the app is open —
        on Android, steps taken while the app is fully closed are not counted (Expo pedometer limit),
        so keep the app open during a session.
      </Text>

      {history.length > 0 && (
        <View style={styles.historyBlock}>
          <Text style={[styles.historyTitle, { color: theme.textPrimary }]}>Recent sessions</Text>
          {history.slice(0, 5).map((item) => (
            <View key={item.id} style={styles.historyRow}>
              <Text style={[styles.historyText, { color: theme.textPrimary }]}>
                {item.type === 'walk' ? 'Walk' : 'Run'} • {new Date(item.endedAt).toLocaleDateString()}
              </Text>
              <Text style={[styles.historyText, { color: theme.textSecondary }]}>
                {formatDuration(item.durationSeconds)} • {item.steps.toLocaleString()} steps • {item.distanceKm} km • {item.calories} kcal
              </Text>
            </View>
          ))}
        </View>
      )}
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  card: { marginBottom: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  title: { fontSize: 16, fontWeight: '700', flex: 1 },
  status: { fontSize: 12, fontWeight: '700' },
  sessionType: { fontSize: 13, fontWeight: '600', marginBottom: 4 },
  subtitle: { fontSize: 13, lineHeight: 19, marginBottom: 12 },
  timer: { fontSize: 32, fontWeight: '800', letterSpacing: -0.5, marginBottom: 10 },
  metricsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  metric: { alignItems: 'center', flex: 1 },
  metricValue: { fontSize: 16, fontWeight: '700' },
  metricLabel: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  buttonsRow: { flexDirection: 'row', gap: 10 },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 46,
    borderRadius: 14,
  },
  startBtn: { backgroundColor: '#34C759' },
  runBtn: { backgroundColor: '#FF3B30' },
  pauseBtn: { backgroundColor: '#FF9500' },
  stopBtn: { backgroundColor: '#1C1C1E' },
  btnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  errorText: { color: '#FF3B30', fontSize: 12, fontWeight: '600', marginTop: 10, textAlign: 'center' },
  note: { fontSize: 11, lineHeight: 16, marginTop: 12 },
  historyBlock: { marginTop: 14, gap: 6 },
  historyTitle: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  historyRow: { gap: 1 },
  historyText: { fontSize: 12 },
});
