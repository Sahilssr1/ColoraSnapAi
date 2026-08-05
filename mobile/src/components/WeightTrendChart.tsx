import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop, Line, Text as SvgText } from 'react-native-svg';
import { Colors } from '../theme/colors';

interface WeightEntry {
  date: string;
  weight: number;
}

interface WeightChartProps {
  data: WeightEntry[];
  currentWeight?: number;
}

export const WeightTrendChart: React.FC<WeightChartProps> = ({ data, currentWeight = 70 }) => {
  const screenWidth = Dimensions.get('window').width - 64;
  const chartHeight = 140;

  if (!data || data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Log your weight daily to visualize your progress curve</Text>
      </View>
    );
  }

  const weights = data.map((d) => d.weight);
  const minW = Math.min(...weights) - 1;
  const maxW = Math.max(...weights) + 1;
  const range = maxW - minW || 1;

  const points = data.map((d, index) => {
    const x = (index / (data.length - 1 || 1)) * (screenWidth - 30) + 15;
    const y = chartHeight - ((d.weight - minW) / range) * (chartHeight - 30) - 15;
    return { x, y, weight: d.weight, date: d.date };
  });

  // Construct SVG Path
  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    pathD += ` L ${points[i].x} ${points[i].y}`;
  }

  // Closed area path for gradient
  const areaD = `${pathD} L ${points[points.length - 1].x} ${chartHeight} L ${points[0].x} ${chartHeight} Z`;

  return (
    <View style={styles.container}>
      <Svg width={screenWidth} height={chartHeight}>
        <Defs>
          <LinearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#10B981" stopOpacity="0.35" />
            <Stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
          </LinearGradient>
        </Defs>

        {/* Gradient fill */}
        <Path d={areaD} fill="url(#weightGrad)" />

        {/* Trend Line */}
        <Path d={pathD} fill="none" stroke="#10B981" strokeWidth="3" strokeLinecap="round" />

        {/* Data points */}
        {points.map((pt, idx) => (
          <React.Fragment key={`pt-${idx}`}>
            <Circle cx={pt.x} cy={pt.y} r="5" fill="#10B981" />
            <Circle cx={pt.x} cy={pt.y} r="2.5" fill="#FFFFFF" />
          </React.Fragment>
        ))}
      </Svg>

      <View style={styles.metricsRow}>
        <View>
          <Text style={styles.metricLabel}>Current</Text>
          <Text style={styles.metricVal}>{currentWeight} kg</Text>
        </View>
        <View>
          <Text style={styles.metricLabel}>Min / Max</Text>
          <Text style={styles.metricVal}>
            {Math.min(...weights)} - {Math.max(...weights)} kg
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 12,
    paddingHorizontal: 8,
  },
  metricLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  metricVal: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
});
