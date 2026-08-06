import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { apiClient } from '../../api/client';
import { useAppDispatch } from '../../redux/hooks';
import { setCredentials, setAuthLoading } from '../../redux/slices/authSlice';
import { AppLogo } from '../../components/AppLogo';

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
    <View style={styles.container}>
      {/* Top Header Glow */}
      <LinearGradient
        colors={['rgba(34, 197, 94, 0.22)', 'rgba(249, 115, 22, 0.12)', 'rgba(249, 250, 251, 0)']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.topAura}
        pointerEvents="none"
      />

      <View style={styles.centerContent}>
        <AppLogo
          size="xlarge"
          showText={true}
          showTagline={true}
        />
      </View>

      {/* Subtle loader */}
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#22C55E" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB', // ⚪ Clean Light theme #F9FAFB
    justifyContent: 'center',
    alignItems: 'center',
  },
  topAura: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 320,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerLoader: {
    position: 'absolute',
    bottom: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
