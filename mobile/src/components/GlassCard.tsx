import React from 'react';
import { View, StyleSheet, ViewStyle, Platform } from 'react-native';
import { useTheme } from '../theme/useTheme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  variant?: 'default' | 'elevated' | 'glow';
  elevated?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  variant = 'default',
  elevated = false,
}) => {
  const { theme, isDark } = useTheme();
  const isElevated = elevated || variant === 'elevated';

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isElevated ? theme.cardElevated : theme.card,
          borderColor: theme.cardBorder,
          shadowColor: isDark ? '#000000' : '#8E8E93',
          shadowOpacity: isDark ? 0.35 : 0.08,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginVertical: 6,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 3,
  },
});
