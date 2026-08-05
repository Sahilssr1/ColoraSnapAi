import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/useTheme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
}) => {
  const { theme, isDark } = useTheme();

  const handlePress = () => {
    if (disabled || loading) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Haptics fallback on web/unsupported
    }
    onPress();
  };

  const getButtonHeight = () => {
    switch (size) {
      case 'small':
        return 38;
      case 'large':
        return 54;
      default:
        return 48;
    }
  };

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handlePress}
        disabled={disabled || loading}
        style={[styles.baseButton, { height: getButtonHeight(), opacity: disabled ? 0.6 : 1 }, style]}
      >
        <LinearGradient
          colors={['#FF3B30', '#FF9500']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.gradientContainer, { height: getButtonHeight() }]}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              {icon && <>{icon}</>}
              <Text style={[styles.primaryText, textStyle, icon ? { marginLeft: 8 } : null]}>
                {title}
              </Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  const getVariantStyles = (): { container: ViewStyle; text: TextStyle } => {
    switch (variant) {
      case 'secondary':
        return {
          container: {
            backgroundColor: isDark ? '#2C2C2E' : '#E5E5EA',
            borderWidth: 1,
            borderColor: theme.cardBorder,
          },
          text: { color: theme.textPrimary },
        };
      case 'outline':
        return {
          container: {
            backgroundColor: 'transparent',
            borderWidth: 1.5,
            borderColor: '#FF3B30',
          },
          text: { color: '#FF3B30' },
        };
      case 'danger':
        return {
          container: {
            backgroundColor: isDark ? 'rgba(255, 69, 58, 0.15)' : '#FFEBEA',
            borderWidth: 1,
            borderColor: '#FF453A',
          },
          text: { color: '#FF453A' },
        };
      case 'ghost':
      default:
        return {
          container: { backgroundColor: 'transparent' },
          text: { color: theme.textSecondary },
        };
    }
  };

  const vStyles = getVariantStyles();

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={handlePress}
      disabled={disabled || loading}
      style={[
        styles.baseButton,
        { height: getButtonHeight(), opacity: disabled ? 0.6 : 1 },
        vStyles.container,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={theme.textPrimary} size="small" />
      ) : (
        <>
          {icon && <>{icon}</>}
          <Text style={[styles.baseText, vStyles.text, textStyle, icon ? { marginLeft: 8 } : null]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  baseButton: {
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  gradientContainer: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 20,
    borderRadius: 14,
  },
  primaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  baseText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
