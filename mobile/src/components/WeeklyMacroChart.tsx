import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Rect, Line, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Colors } from '../theme/colors';

interface DailyTrend {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface WeeklyChartProps {
  trends: DailyTrend[];
  targetCalories: number;
}

export const WeeklyMacroChart: React.FC<WeeklyChartProps> = ({ trends, targetCalories }) => {
  const screenWidth = Dimensions.get('window').width - 64;
  const chartHeight = 150;
  const maxCalories = Math.max(targetCalories * 1.25, ...trends.map((t) => t.calories));

  const barWidth = 22;
  const spacing = (screenWidth - trends.length * barWidth) / (trends.length + 1);

  const getDayName = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
    } catch {
      return '';
    }
  };

  const targetY = chartHeight - (targetCalories / maxCalories) * chartHeight;

  return (
    <View style={styles.container}>
      <Svg width={screenWidth} height={chartHeight + 30}>
        <Defs>
          <LinearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#FF5E3A" stopOpacity="1" />
            <Stop offset="100%" stopColor="#FF8E53" stopOpacity="0.4" />
          </LinearGradient>
        </Defs>

        {/* Target Line */}
        <Line
          x1="0"
          y1={targetY}
          x2={screenWidth}
          y2={targetY}
          stroke="rgba(255, 255, 255, 0.2)"
          strokeDasharray="4, 4"
          strokeWidth="1.5"
        />

        {/* Day Bars */}
        {trends.map((day, idx) => {
          const barHeight = Math.max(4, (day.calories / maxCalories) * chartHeight);
          const x = spacing + idx * (barWidth + spacing);
          const y = chartHeight - barHeight;

          return (
            <React.Fragment key={`day-${idx}`}>
              <Rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={6}
                fill="url(#barGrad)"
              />
              <SvgText
                x={x + barWidth / 2}
                y={chartHeight + 20}
                fill="#94A3B8"
                fontSize="11"
                fontWeight="600"
                textAnchor="middle"
              >
                {getDayName(day.date)}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.indicator, { backgroundColor: '#FF5E3A' }]} />
          <Text style={styles.legendText}>Daily Calories</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.indicatorLine, { borderColor: 'rgba(255,255,255,0.4)' }]} />
          <Text style={styles.legendText}>Target ({targetCalories} kcal)</Text>
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
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  indicatorLine: {
    width: 14,
    height: 0,
    borderTopWidth: 2,
    marginRight: 6,
  },
  legendText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500',
  },
});
