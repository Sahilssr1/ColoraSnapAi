import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { apiClient } from '../../api/client';
import { useAppDispatch } from '../../redux/hooks';
import { setCredentials, setAuthLoading } from '../../redux/slices/authSlice';
import { Colors } from '../../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

export const SplashScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('calora_access_token');
        const refreshToken = await AsyncStorage.getItem('calora_refresh_token');

        if (token && refreshToken) {
          const res = await apiClient.get('/user/profile');
          if (res.data.success) {
            dispatch(
              setCredentials({
                user: res.data.data,
                accessToken: token,
                refreshToken: refreshToken,
              })
            );
            navigation.replace('MainTabs');
            return;
          }
        }
      } catch (err) {
        // Token invalid or expired
      } finally {
        dispatch(setAuthLoading(false));
      }

      // If no valid session, check if onboarded
      const hasOnboarded = await AsyncStorage.getItem('calora_onboarded');
      if (hasOnboarded) {
        navigation.replace('Login');
      } else {
        navigation.replace('Onboarding');
      }
    };

    const timer = setTimeout(checkAuth, 1800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <LinearGradient
      colors={['#090A0F', '#181124', '#090A0F']}
      style={styles.container}
    >
      <View style={styles.logoContainer}>
        <LinearGradient
          colors={Colors.brand.primaryGradient as [string, string]}
          style={styles.logoIcon}
        >
          <Text style={styles.logoEmoji}>🔥</Text>
        </LinearGradient>

        <Text style={styles.appName}>Calora AI</Text>
        <Text style={styles.tagline}>Smart Nutrition & Visual Calorie AI</Text>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoIcon: {
    width: 88,
    height: 88,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#FF5E3A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  logoEmoji: {
    fontSize: 44,
  },
  appName: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  tagline: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 6,
  },
});
