import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface MacroBarProps {
  label: string;
  consumed: number;
  target: number;
  unit?: string;
  gradient: [string, string];
  color: string;
}

export const MacroBar: React.FC<MacroBarProps> = ({
  label,
  consumed,
  target,
  unit = 'g',
  gradient,
  color,
}) => {
  const percentage = Math.min(100, Math.round((consumed / target) * 100)) || 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.labelRow}>
          <View style={[styles.dot, { backgroundColor: color }]} />
          <Text style={styles.label}>{label}</Text>
        </View>
        <Text style={styles.valueText}>
          <Text style={styles.current}>{consumed.toFixed(0)}</Text>
          <Text style={styles.target}> / {target}{unit}</Text>
        </Text>
      </View>

      <View style={styles.track}>
        <View style={[styles.fill, { width: `${percentage}%` }]}>
          <LinearGradient
            colors={gradient}
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
  container: {
    marginVertical: 6,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  label: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '600',
  },
  valueText: {
    fontSize: 13,
  },
  current: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  target: {
    color: '#64748B',
    fontWeight: '500',
  },
  track: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
  gradientFill: {
    flex: 1,
    borderRadius: 4,
  },
});
