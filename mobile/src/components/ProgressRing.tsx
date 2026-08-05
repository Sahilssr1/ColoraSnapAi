import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Svg, { Circle, G, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Colors } from '../theme/colors';
import { useTheme } from '../theme/useTheme';

interface ProgressRingProps {
  size?: number;
  strokeWidth?: number;
  calorieProgress: number; // 0 to 1
  proteinProgress: number; // 0 to 1
  carbsProgress: number;   // 0 to 1
  fatProgress?: number;     // 0 to 1
  caloriesRemaining?: number;
  totalCalories?: number;
  showCenterText?: boolean;
  isActivityRing?: boolean; // Apple Activity style (Move, Exercise, Stand)
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  size = 220,
  strokeWidth = 14,
  calorieProgress,
  proteinProgress,
  carbsProgress,
  fatProgress = 0,
  caloriesRemaining = 0,
  totalCalories = 2000,
  showCenterText = true,
  isActivityRing = false,
}) => {
  const { theme, isDark } = useTheme();
  const center = size / 2;
  const gap = strokeWidth + Math.max(2, size * 0.02);

  const baseRings = isActivityRing
    ? [
        {
          radius: center - strokeWidth / 2 - 2,
          progress: Math.min(calorieProgress, 1),
          color: Colors.macros.calories,
          gradient: ['#FF3B30', '#FF2D55'],
          id: `actMove_${size}`,
        },
        {
          radius: center - strokeWidth / 2 - gap - 2,
          progress: Math.min(proteinProgress, 1),
          color: Colors.macros.protein,
          gradient: ['#34C759', '#30D158'],
          id: `actExe_${size}`,
        },
        {
          radius: center - strokeWidth / 2 - gap * 2 - 2,
          progress: Math.min(carbsProgress, 1),
          color: Colors.macros.water,
          gradient: ['#007AFF', '#5AC8FA'],
          id: `actStd_${size}`,
        },
      ]
    : [
        {
          radius: center - strokeWidth / 2 - 2,
          progress: Math.min(calorieProgress, 1),
          color: Colors.macros.calories,
          gradient: ['#FF3B30', '#FF2D55'],
          id: `calGrad_${size}`,
        },
        {
          radius: center - strokeWidth / 2 - gap - 2,
          progress: Math.min(proteinProgress, 1),
          color: Colors.macros.protein,
          gradient: ['#34C759', '#30D158'],
          id: `protGrad_${size}`,
        },
        {
          radius: center - strokeWidth / 2 - gap * 2 - 2,
          progress: Math.min(carbsProgress, 1),
          color: Colors.macros.carbs,
          gradient: ['#FF9500', '#FFCC00'],
          id: `carbGrad_${size}`,
        },
        {
          radius: center - strokeWidth / 2 - gap * 3 - 2,
          progress: Math.min(fatProgress, 1),
          color: Colors.macros.fat,
          gradient: ['#AF52DE', '#5856D6'],
          id: `fatGrad_${size}`,
        },
      ];

  const trackBgColor = isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(0, 0, 0, 0.07)';

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Defs>
          {baseRings.map((r) => (
            <LinearGradient key={r.id} id={r.id} x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={r.gradient[0]} />
              <Stop offset="100%" stopColor={r.gradient[1]} />
            </LinearGradient>
          ))}
        </Defs>

        <G rotation="-90" origin={`${center}, ${center}`}>
          {baseRings.map((ring, idx) => {
            const circumference = 2 * Math.PI * ring.radius;
            const strokeDashoffset = circumference * (1 - ring.progress);

            return (
              <React.Fragment key={`ring-${idx}`}>
                {/* Track background */}
                <Circle
                  cx={center}
                  cy={center}
                  r={ring.radius}
                  stroke={trackBgColor}
                  strokeWidth={strokeWidth}
                  fill="transparent"
                />

                {/* Progress stroke */}
                <Circle
                  cx={center}
                  cy={center}
                  r={ring.radius}
                  stroke={`url(#${ring.id})`}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${circumference} ${circumference}`}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </React.Fragment>
            );
          })}
        </G>
      </Svg>

      {/* Center Label (only if requested and size is large enough) */}
      {showCenterText && size >= 140 && (
        <View style={styles.centerTextContainer}>
          <Text style={[styles.remainingNumber, { color: theme.textPrimary }]}>
            {Math.round(caloriesRemaining)}
          </Text>
          <Text style={[styles.remainingLabel, { color: theme.textMuted }]}>
            CAL REMAINING
          </Text>
          <Text style={[styles.totalGoalLabel, { color: theme.textSecondary }]}>
            of {totalCalories} kcal
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  centerTextContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  remainingNumber: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  remainingLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginTop: 2,
  },
  totalGoalLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
});
