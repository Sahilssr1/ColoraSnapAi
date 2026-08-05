import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';

interface MicronutrientData {
  current: number;
  rda: number;
  unit: string;
  percentage: number;
  status: string;
}

interface MicronutrientGridProps {
  balance: Record<string, MicronutrientData>;
}

export const MicronutrientGrid: React.FC<MicronutrientGridProps> = ({ balance }) => {
  const entries = Object.entries(balance || {});

  if (entries.length === 0) {
    return null;
  }

  const formatName = (name: string) => {
    // Convert camelCase like 'vitaminA' -> 'Vitamin A', 'omega3' -> 'Omega-3'
    if (name.startsWith('vitamin')) {
      return `Vit ${name.slice(7).toUpperCase()}`;
    }
    if (name.startsWith('omega')) {
      return `Omega-${name.slice(5)}`;
    }
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  const getStatusColor = (status: string, pct: number) => {
    if (status === 'deficient' || pct < 50) return '#EF4444'; // Red
    if (status === 'excess') return '#F59E0B'; // Orange
    return '#10B981'; // Green
  };

  return (
    <View style={styles.grid}>
      {entries.map(([key, item]) => {
        const statusColor = getStatusColor(item.status, item.percentage);
        const fillWidth = Math.min(100, item.percentage);

        return (
          <View key={key} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.nutrientName} numberOfLines={1}>
                {formatName(key)}
              </Text>
              <Text style={[styles.percentage, { color: statusColor }]}>
                {item.percentage}%
              </Text>
            </View>

            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  { width: `${fillWidth}%`, backgroundColor: statusColor },
                ]}
              />
            </View>

            <Text style={styles.detailText}>
              {item.current.toFixed(1)} / {item.rda} {item.unit}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 8,
  },
  card: {
    width: '48%',
    backgroundColor: '#181B26',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  nutrientName: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  percentage: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  barTrack: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 6,
  },
  barFill: {
    height: '100%',
    borderRadius: 2,
  },
  detailText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '500',
  },
});
