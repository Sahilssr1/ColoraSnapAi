import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { apiClient } from '../../api/client';
import { useAppDispatch } from '../../redux/hooks';
import { setCredentials, updateUser, setAuthLoading } from '../../redux/slices/authSlice';
import { AppLogo } from '../../components/AppLogo';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

export const SplashScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      try {
        const [token, refreshToken, savedUserJson, hasOnboarded] = await Promise.all([
          AsyncStorage.getItem('calora_access_token'),
          AsyncStorage.getItem('calora_refresh_token'),
          AsyncStorage.getItem('calora_user_profile'),
          AsyncStorage.getItem('calora_onboarded'),
        ]);

        // 1. Fast-path: User has active session cached locally -> INSTANT LAUNCH
        if (token && savedUserJson) {
          try {
            const user = JSON.parse(savedUserJson);
            dispatch(
              setCredentials({
                user,
                accessToken: token,
                refreshToken: refreshToken || '',
              })
            );

            // Navigate to MainTabs immediately (<200ms)
            if (isMounted) {
              navigation.replace('MainTabs');
            }

            // Silent background profile refresh (does NOT block app opening)
            apiClient
              .get('/user/profile')
              .then((res) => {
                if (res.data?.success && res.data?.data) {
                  dispatch(updateUser(res.data.data));
                  AsyncStorage.setItem('calora_user_profile', JSON.stringify(res.data.data)).catch(() => {});
                }
              })
              .catch(() => {
                // Ignore network errors or cold starts in background
              });

            return;
          } catch (parseErr) {
            // Corrupted JSON profile, fallback to remote profile fetch below
          }
        }

        // 2. Token exists but profile wasn't cached yet: quick fetch with 5s timeout
        if (token) {
          try {
            const res = await apiClient.get('/user/profile', { timeout: 6000 });
            if (res.data?.success && res.data?.data) {
              const user = res.data.data;
              dispatch(
                setCredentials({
                  user,
                  accessToken: token,
                  refreshToken: refreshToken || '',
                })
              );
              await AsyncStorage.setItem('calora_user_profile', JSON.stringify(user));
              if (isMounted) {
                navigation.replace('MainTabs');
              }
              return;
            }
          } catch (profileErr: any) {
            // Only if explicitly 401 unauthorized do we clear session
            if (profileErr.response?.status === 401) {
              await AsyncStorage.removeItem('calora_access_token');
              await AsyncStorage.removeItem('calora_refresh_token');
              await AsyncStorage.removeItem('calora_user_profile');
            }
          }
        }

        // 3. No active session: route to Login or Onboarding
        dispatch(setAuthLoading(false));
        if (isMounted) {
          if (hasOnboarded) {
            navigation.replace('Login');
          } else {
            navigation.replace('Onboarding');
          }
        }
      } catch (err) {
        dispatch(setAuthLoading(false));
        if (isMounted) {
          navigation.replace('Login');
        }
      }
    };

    // Quick, smooth 350ms transition so logo renders crisply before navigating
    const timer = setTimeout(checkAuth, 350);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [dispatch, navigation]);

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
          textColor="#111827"
          taglineColor="#6B7280"
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
    paddingHorizontal: 24,
  },
  footerLoader: {
    position: 'absolute',
    bottom: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
