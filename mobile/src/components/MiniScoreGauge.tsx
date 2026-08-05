import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../theme/useTheme';

interface MiniScoreGaugeProps {
  score?: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
}

export const MiniScoreGauge: React.FC<MiniScoreGaugeProps> = ({
  score = 97,
  size = 46,
  strokeWidth = 5,
}) => {
  const { theme, isDark } = useTheme();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - Math.min(score, 100) / 100);

  // Gradient-like color based on score
  const strokeColor =
    score >= 85 ? '#30D158' : score >= 70 ? '#FFD60A' : '#FF453A';

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Track background */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'}
          strokeWidth={strokeWidth}
          fill="transparent"
        />

        {/* Progress Arc */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>

      <View style={styles.scoreTextContainer}>
        <Text style={[styles.scoreNumber, { color: theme.textPrimary }]}>
          {score}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  scoreTextContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreNumber: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
});
