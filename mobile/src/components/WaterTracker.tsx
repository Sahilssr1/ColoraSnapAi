import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors } from '../theme/colors';

interface WaterTrackerProps {
  consumedMl: number;
  targetMl: number;
  onAddWater: (amountMl: number) => void;
}

export const WaterTracker: React.FC<WaterTrackerProps> = ({
  consumedMl,
  targetMl,
  onAddWater,
}) => {
  const percentage = Math.min(100, Math.round((consumedMl / targetMl) * 100)) || 0;

  const handleAdd = (amount: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onAddWater(amount);
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.icon}>💧</Text>
          <View>
            <Text style={styles.title}>Hydration Tracker</Text>
            <Text style={styles.subtitle}>
              {consumedMl} / {targetMl} ml ({percentage}%)
            </Text>
          </View>
        </View>

        <View style={styles.quickButtons}>
          <TouchableOpacity
            style={styles.quickButton}
            onPress={() => handleAdd(250)}
            activeOpacity={0.7}
          >
            <Text style={styles.quickButtonText}>+250 ml</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickButton}
            onPress={() => handleAdd(500)}
            activeOpacity={0.7}
          >
            <Text style={styles.quickButtonText}>+500 ml</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Progress Track */}
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${percentage}%` }]}>
          <LinearGradient
            colors={['#00C6FF', '#0072FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientFill}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#12141D',
    borderRadius: 20,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 24,
    marginRight: 10,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    color: '#00C6FF',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  quickButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  quickButton: {
    backgroundColor: 'rgba(0, 198, 255, 0.15)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 198, 255, 0.3)',
  },
  quickButtonText: {
    color: '#00C6FF',
    fontSize: 12,
    fontWeight: '700',
  },
  track: {
    height: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 5,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 5,
  },
  gradientFill: {
    flex: 1,
    borderRadius: 5,
  },
});
