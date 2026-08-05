import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { useTheme } from '../theme/useTheme';

interface AppleHealthCategoryRowProps {
  icon: React.ReactNode;
  title: string;
  iconBgColor: string;
  isLast?: boolean;
  onPress?: () => void;
}

export const AppleHealthCategoryRow: React.FC<AppleHealthCategoryRowProps> = ({
  icon,
  title,
  iconBgColor,
  isLast = false,
  onPress,
}) => {
  const { theme } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: theme.card }]}
      activeOpacity={0.7}
      onPress={onPress}
    >
      {/* Colorful squircle icon badge */}
      <View style={[styles.iconBadge, { backgroundColor: iconBgColor }]}>
        {icon}
      </View>

      {/* Title & Chevron */}
      <View
        style={[
          styles.contentRow,
          !isLast && { borderBottomColor: theme.separator, borderBottomWidth: StyleSheet.hairlineWidth },
        ]}
      >
        <Text style={[styles.title, { color: theme.textPrimary }]}>{title}</Text>
        <ChevronRight color={theme.textMuted} size={18} strokeWidth={2} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    height: 54,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  contentRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '100%',
    paddingRight: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
});
