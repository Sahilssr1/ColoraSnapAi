import React from 'react';
import { View, Image, Text, StyleSheet, ViewStyle, ImageStyle } from 'react-native';
import { useTheme } from '../theme/useTheme';
import { APP_CONFIG } from '../constants/config';

interface AppLogoProps {
  size?: number | 'small' | 'medium' | 'large' | 'xlarge';
  showText?: boolean;
  showTagline?: boolean;
  style?: ViewStyle;
  imageStyle?: ImageStyle;
}

export const AppLogo: React.FC<AppLogoProps> = ({
  size = 'medium',
  showText = false,
  showTagline = false,
  style,
  imageStyle,
}) => {
  const { theme } = useTheme();

  const getDimension = () => {
    if (typeof size === 'number') return size;
    switch (size) {
      case 'small':
        return 38;
      case 'medium':
        return 62;
      case 'large':
        return 96;
      case 'xlarge':
        return 130;
      default:
        return 62;
    }
  };

  const dim = getDimension();
  const borderRadius = Math.round(dim * 0.22);

  return (
    <View style={[styles.container, style]}>
      <View
        style={[
          styles.imageWrapper,
          {
            width: dim,
            height: dim,
            borderRadius,
            backgroundColor: '#FFFFFF',
            shadowColor: '#22C55E',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.18,
            shadowRadius: 12,
            elevation: 6,
            borderColor: 'rgba(34, 197, 94, 0.35)',
            borderWidth: 1.5,
          },
        ]}
      >
        <Image
          source={require('../img/calora.png')}
          style={[
            styles.logoImage,
            {
              width: dim - 6,
              height: dim - 6,
              borderRadius: borderRadius - 2,
            },
            imageStyle,
          ]}
          resizeMode="contain"
        />
      </View>

      {showText && (
        <View style={styles.textBlock}>
          <Text style={[styles.appName, { color: theme.textPrimary }]}>
            SnapCalora <Text style={{ color: '#22C55E' }}>AI</Text>
          </Text>
          {showTagline && (
            <Text style={[styles.tagline, { color: theme.textSecondary }]}>
              {APP_CONFIG.tagline}
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoImage: {
    // sizing handled dynamically
  },
  textBlock: {
    alignItems: 'center',
    marginTop: 14,
  },
  appName: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 6,
    letterSpacing: 0.2,
    textAlign: 'center',
  },
});
