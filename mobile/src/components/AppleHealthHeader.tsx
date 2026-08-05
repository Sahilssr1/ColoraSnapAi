import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Sun, Moon, Smartphone } from 'lucide-react-native';
import { useTheme } from '../theme/useTheme';

interface AppleHealthHeaderProps {
  title?: string;
  subtitle?: string;
  userName?: string;
  showEdit?: boolean;
  onEditPress?: () => void;
  onProfilePress?: () => void;
}

export const AppleHealthHeader: React.FC<AppleHealthHeaderProps> = ({
  title = 'Summary',
  subtitle,
  userName = 'Calora User',
  showEdit = true,
  onEditPress,
  onProfilePress,
}) => {
  const { theme, isDark, themeMode, setTheme } = useTheme();

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase() || 'CU';
  };

  const handleCycleTheme = () => {
    if (themeMode === 'system') {
      setTheme('light');
    } else if (themeMode === 'light') {
      setTheme('dark');
    } else {
      setTheme('system');
    }
  };

  const renderThemeIcon = () => {
    const iconColor = theme.tabBarActive;
    if (themeMode === 'system') {
      return <Smartphone color={iconColor} size={13} strokeWidth={2.2} />;
    }
    if (themeMode === 'light') {
      return <Sun color={iconColor} size={13} strokeWidth={2.2} />;
    }
    return <Moon color={iconColor} size={13} strokeWidth={2.2} />;
  };

  const todayStr =
    subtitle ||
    new Date()
      .toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      })
      .toUpperCase();

  return (
    <View style={styles.container}>
      {/* Top Apple Health Pastel Gradient Glow */}
      <LinearGradient
        colors={theme.headerGlow}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.gradientHeader}
      />

      <View style={styles.content}>
        {/* Date Subtitle & Quick Theme Switcher */}
        <View style={styles.topRow}>
          <Text style={[styles.dateText, { color: theme.textMuted }]}>
            {todayStr}
          </Text>

          {/* Modern Theme Pill */}
          <TouchableOpacity
            style={[styles.themePill, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
            onPress={handleCycleTheme}
            activeOpacity={0.7}
          >
            {renderThemeIcon()}
            <Text style={[styles.themeLabel, { color: theme.textSecondary }]}>
              {themeMode === 'system' ? 'Auto' : themeMode === 'light' ? 'Light' : 'Dark'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Large Summary Title & Avatar */}
        <View style={styles.titleRow}>
          <Text style={[styles.largeTitle, { color: theme.textPrimary }]}>
            {title}
          </Text>

          <TouchableOpacity
            style={[styles.avatarCircle, { backgroundColor: isDark ? '#2C2C2E' : '#E5E5EA' }]}
            onPress={onProfilePress}
            activeOpacity={0.8}
          >
            <Text style={[styles.avatarText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
              {getInitials(userName)}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Pinned & Edit bar */}
        {showEdit && (
          <View style={styles.pinnedRow}>
            <Text style={[styles.pinnedTitle, { color: theme.textPrimary }]}>
              Pinned
            </Text>
            <TouchableOpacity onPress={onEditPress}>
              <Text style={[styles.editText, { color: theme.tabBarActive }]}>
                Edit
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    paddingTop: Platform.OS === 'ios' ? 12 : 16,
    paddingBottom: 4,
  },
  gradientHeader: {
    position: 'absolute',
    top: -50,
    left: -20,
    right: -20,
    height: 190,
  },
  content: {
    paddingHorizontal: 20,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  themePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  themeLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  largeTitle: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
  },
  pinnedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 6,
  },
  pinnedTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  editText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
