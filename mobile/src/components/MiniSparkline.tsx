import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../theme/useTheme';

interface MiniSparklineProps {
  data?: number[];
  barColor?: string;
  height?: number;
  width?: number;
}

export const MiniSparkline: React.FC<MiniSparklineProps> = ({
  data = [35, 60, 45, 80, 50, 95, 70, 85, 65, 90, 100, 40],
  barColor,
  height = 36,
  width = 64,
}) => {
  const { theme } = useTheme();
  const maxVal = Math.max(...data, 1);
  const color = barColor || theme.tabBarActive;

  return (
    <View style={[styles.container, { height, width }]}>
      {data.map((val, idx) => {
        const barHeight = Math.max(4, (val / maxVal) * height);
        const isHighlight = idx >= data.length - 3;

        return (
          <View
            key={idx}
            style={[
              styles.bar,
              {
                height: barHeight,
                backgroundColor: isHighlight
                  ? color
                  : theme.isDark
                  ? 'rgba(255,255,255,0.18)'
                  : 'rgba(0,0,0,0.12)',
              },
            ]}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  bar: {
    width: 3,
    borderRadius: 2,
    marginHorizontal: 1,
  },
});
