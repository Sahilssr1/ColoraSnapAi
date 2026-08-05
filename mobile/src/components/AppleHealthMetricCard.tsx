import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { useTheme } from '../theme/useTheme';
import { GlassCard } from './GlassCard';

interface AppleHealthMetricCardProps {
  icon: React.ReactNode;
  categoryTitle: string;
  categoryColor?: string;
  timestamp?: string;
  mainValue: string;
  mainUnit?: string;
  statusLabel?: string;
  statusColor?: string;
  subMetrics?: Array<{ label: string; value: string; color?: string }>;
  rightElement?: React.ReactNode;
  onPress?: () => void;
}

export const AppleHealthMetricCard: React.FC<AppleHealthMetricCardProps> = ({
  icon,
  categoryTitle,
  categoryColor,
  timestamp = 'Today',
  mainValue,
  mainUnit,
  statusLabel,
  statusColor,
  subMetrics,
  rightElement,
  onPress,
}) => {
  const { theme } = useTheme();

  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.75 : 1}
      onPress={onPress}
      disabled={!onPress}
    >
      <GlassCard style={styles.card}>
        {/* Top Header: Icon + Title + Timestamp & Chevron */}
        <View style={styles.headerRow}>
          <View style={styles.categoryLeft}>
            <View style={styles.iconWrapper}>{icon}</View>
            <Text
              style={[
                styles.categoryTitle,
                { color: categoryColor || theme.textPrimary },
              ]}
            >
              {categoryTitle}
            </Text>
          </View>

          <View style={styles.timestampRow}>
            <Text style={[styles.timestampText, { color: theme.textMuted }]}>
              {timestamp}
            </Text>
            {onPress && (
              <ChevronRight color={theme.textMuted} size={14} strokeWidth={2.5} />
            )}
          </View>
        </View>

        {/* Center Main Value Row + Right Graphic */}
        <View style={styles.bodyRow}>
          <View style={styles.valueContainer}>
            <View style={styles.mainValueRow}>
              <Text style={[styles.mainValueText, { color: theme.textPrimary }]}>
                {mainValue}
              </Text>
              {mainUnit && (
                <Text style={[styles.mainUnitText, { color: theme.textSecondary }]}>
                  {' '}{mainUnit}
                </Text>
              )}
            </View>

            {statusLabel && (
              <Text
                style={[
                  styles.statusLabelText,
                  { color: statusColor || theme.textSecondary },
                ]}
              >
                {statusLabel}
              </Text>
            )}

            {/* Sub Metrics */}
            {subMetrics && subMetrics.length > 0 && (
              <View style={styles.subMetricsRow}>
                {subMetrics.map((item, idx) => (
                  <View key={idx} style={styles.subMetricItem}>
                    <Text style={[styles.subMetricLabel, { color: theme.textMuted }]}>
                      {item.label}
                    </Text>
                    <Text
                      style={[
                        styles.subMetricValue,
                        { color: item.color || theme.textPrimary },
                      ]}
                    >
                      {item.value}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Right Visual Element */}
          {rightElement && (
            <View style={styles.rightElementContainer}>{rightElement}</View>
          )}
        </View>
      </GlassCard>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    marginVertical: 6,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  timestampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  timestampText: {
    fontSize: 12,
    fontWeight: '500',
  },
  bodyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  valueContainer: {
    flex: 1,
  },
  mainValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  mainValueText: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  mainUnitText: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusLabelText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  subMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 16,
  },
  subMetricItem: {
    flexDirection: 'column',
  },
  subMetricLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 2,
  },
  subMetricValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  rightElementContainer: {
    marginLeft: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
