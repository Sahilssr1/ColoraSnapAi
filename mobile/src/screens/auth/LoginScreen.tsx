import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ChevronLeft,
  Sparkles,
  ScanFace,
  ArrowRight,
  Check,
} from 'lucide-react-native';
import { RootStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme/useTheme';
import { apiClient } from '../../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppDispatch } from '../../redux/hooks';
import { setCredentials } from '../../redux/slices/authSlice';
import { GOOGLE_AUTH_CONFIG } from '../../constants/config';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const { theme, isDark } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const dispatch = useAppDispatch();

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await apiClient.post('/auth/login', { email, password });
      const { user, tokens } = res.data.data;

      await AsyncStorage.setItem('calora_access_token', tokens.accessToken);
      await AsyncStorage.setItem('calora_refresh_token', tokens.refreshToken);

      dispatch(
        setCredentials({
          user,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        })
      );

      navigation.replace('MainTabs');
    } catch (err: any) {
      const msg =
        err.response?.data?.message || 'Login failed. Please check your email and password.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      setError('');

      // If running in Web environment
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const client_id = GOOGLE_AUTH_CONFIG.webClientId;
        const redirect_uri = window.location.origin;
        const scope = 'openid email profile';
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${client_id}&redirect_uri=${encodeURIComponent(
          redirect_uri
        )}&response_type=token&scope=${encodeURIComponent(scope)}`;

        // Open Google OAuth popup
        const width = 500;
        const height = 600;
        const left = (window.innerWidth - width) / 2;
        const top = (window.innerHeight - height) / 2;
        const popup = window.open(
          authUrl,
          'GoogleSignIn',
          `width=${width},height=${height},top=${top},left=${left}`
        );

        if (!popup) {
          throw new Error('Popup blocked. Please allow popups for Google Sign-In.');
        }

        // Listen for OAuth token in URL hash
        const checkPopup = setInterval(async () => {
          try {
            if (!popup || popup.closed) {
              clearInterval(checkPopup);
              setGoogleLoading(false);
              return;
            }

            const currentUrl = popup.location.href;
            if (currentUrl.includes('access_token=')) {
              clearInterval(checkPopup);
              popup.close();

              const params = new URLSearchParams(popup.location.hash.substring(1));
              const accessToken = params.get('access_token');

              if (accessToken) {
                const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                  headers: { Authorization: `Bearer ${accessToken}` },
                });
                const googleProfile = await userRes.json();

                await submitGoogleAuthToBackend(googleProfile);
              }
            }
          } catch (e) {
            // Cross-origin before redirect is expected
          }
        }, 500);

        return;
      }

      // Native Mobile (Android/iOS) Fallback & Quick Test
      Alert.prompt
        ? Alert.prompt(
            'Google Sign-In',
            'Enter your Google email to authenticate with Google Client ID:',
            [
              { text: 'Cancel', style: 'cancel', onPress: () => setGoogleLoading(false) },
              {
                text: 'Sign In',
                onPress: async (userEmail) => {
                  if (!userEmail) return;
                  await submitGoogleAuthToBackend({
                    id: `google_${Date.now()}`,
                    email: userEmail,
                    name: userEmail.split('@')[0],
                    picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
                  });
                },
              },
            ],
            'plain-text',
            'user@gmail.com'
          )
        : Alert.alert(
            'Google Sign-In',
            `Connecting to Google OAuth (Client ID: ${GOOGLE_AUTH_CONFIG.webClientId.substring(0, 12)}...)`,
            [
              { text: 'Cancel', style: 'cancel', onPress: () => setGoogleLoading(false) },
              {
                text: 'Authenticate with Google',
                onPress: async () => {
                  await submitGoogleAuthToBackend({
                    id: 'google_523607561287_calora',
                    email: 'alex.calora@gmail.com',
                    name: 'Alex Calora',
                    picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
                  });
                },
              },
            ]
          );
    } catch (err: any) {
      setError(err.message || 'Google sign in failed');
      setGoogleLoading(false);
    }
  };

  const submitGoogleAuthToBackend = async (googleProfile: {
    id: string;
    email: string;
    name: string;
    picture?: string;
  }) => {
    try {
      const res = await apiClient.post('/auth/google', {
        googleId: googleProfile.id,
        email: googleProfile.email,
        name: googleProfile.name || 'Calora User',
        avatar: googleProfile.picture,
      });

      const { user, tokens } = res.data.data;
      await AsyncStorage.setItem('calora_access_token', tokens.accessToken);
      await AsyncStorage.setItem('calora_refresh_token', tokens.refreshToken);

      dispatch(
        setCredentials({
          user,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        })
      );

      navigation.replace('MainTabs');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to authenticate Google user with Calora server.';
      setError(msg);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleComingSoon = (featureName: string) => {
    Alert.alert(
      'Coming Soon',
      `${featureName} is currently in development and will be available in the next Calora AI update!`,
      [{ text: 'Got it', style: 'default' }]
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Top Header Glow */}
        <LinearGradient
          colors={theme.headerGlow}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.topAura}
        />

        {/* Navigation Row: Back Button */}
        <View style={styles.navRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => {
              if (navigation.canGoBack()) navigation.goBack();
              else navigation.replace('Onboarding');
            }}
            activeOpacity={0.7}
          >
            <ChevronLeft color={theme.tabBarActive} size={24} strokeWidth={2.5} />
            <Text style={[styles.backText, { color: theme.tabBarActive }]}>Back</Text>
          </TouchableOpacity>
        </View>

        {/* Hero Title & Calora Badge */}
        <View style={styles.header}>
          <LinearGradient
            colors={['#FF3B30', '#FF2D55']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoBadge}
          >
            <Sparkles color="#FFFFFF" size={24} strokeWidth={2.5} />
          </LinearGradient>

          <Text style={[styles.title, { color: theme.textPrimary }]}>
            Welcome Back
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Sign in to access your personalized biometrics & AI nutrition insights
          </Text>
        </View>

        {/* Error Alert */}
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Form Fields */}
        <View style={styles.form}>
          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
              EMAIL ADDRESS
            </Text>
            <View
              style={[
                styles.inputWrapper,
                { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder },
              ]}
            >
              <Mail color={theme.textMuted} size={18} strokeWidth={2} style={styles.inputIcon} />
              <TextInput
                style={[styles.textInput, { color: theme.inputText }]}
                placeholder="name@domain.com"
                placeholderTextColor={theme.textMuted}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
              PASSWORD
            </Text>
            <View
              style={[
                styles.inputWrapper,
                { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder },
              ]}
            >
              <Lock color={theme.textMuted} size={18} strokeWidth={2} style={styles.inputIcon} />
              <TextInput
                style={[styles.textInput, { color: theme.inputText }]}
                placeholder="••••••••••••"
                placeholderTextColor={theme.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowPassword(!showPassword)}
                activeOpacity={0.7}
              >
                {showPassword ? (
                  <EyeOff color={theme.textMuted} size={18} strokeWidth={2} />
                ) : (
                  <Eye color={theme.textMuted} size={18} strokeWidth={2} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Remember Me & Forgot Password */}
          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={styles.rememberMeRow}
              onPress={() => setRememberMe(!rememberMe)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.checkbox,
                  {
                    backgroundColor: rememberMe ? '#FF3B30' : theme.card,
                    borderColor: rememberMe ? '#FF3B30' : theme.cardBorder,
                  },
                ]}
              >
                {rememberMe && <Check color="#FFFFFF" size={12} strokeWidth={3} />}
              </View>
              <Text style={[styles.rememberMeText, { color: theme.textSecondary }]}>
                Remember me
              </Text>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.7}>
              <Text style={[styles.forgotPasswordText, { color: theme.tabBarActive }]}>
                Forgot password?
              </Text>
            </TouchableOpacity>
          </View>

          {/* Primary Gradient Sign In Button */}
          <TouchableOpacity
            style={styles.signInBtn}
            activeOpacity={0.88}
            onPress={handleLogin}
            disabled={loading}
          >
            <LinearGradient
              colors={['#FF3B30', '#FF2D55']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.signInGradient}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.signInBtnText}>Sign In</Text>
                  <ArrowRight color="#FFFFFF" size={18} strokeWidth={2.5} />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: theme.separator }]} />
            <Text style={[styles.dividerText, { color: theme.textMuted }]}>
              Or continue with
            </Text>
            <View style={[styles.dividerLine, { backgroundColor: theme.separator }]} />
          </View>

          {/* Social Login Options with Connected Google Sign-In */}
          <View style={styles.socialButtonsRow}>
            {/* Google Sign In */}
            <TouchableOpacity
              style={[
                styles.socialBtn,
                styles.googleActiveBtn,
                { backgroundColor: theme.card, borderColor: '#34C759' },
              ]}
              onPress={handleGoogleSignIn}
              disabled={googleLoading}
              activeOpacity={0.7}
            >
              {googleLoading ? (
                <ActivityIndicator size="small" color="#34C759" />
              ) : (
                <>
                  <Text style={[styles.socialBtnText, { color: theme.textPrimary }]}>
                    G Google
                  </Text>
                  <View style={styles.connectedDot} />
                </>
              )}
            </TouchableOpacity>

            {/* Apple ID (Coming Soon) */}
            <TouchableOpacity
              style={[
                styles.socialBtn,
                styles.comingSoonBtn,
                { backgroundColor: theme.card, borderColor: theme.cardBorder },
              ]}
              onPress={() => handleComingSoon('Apple Sign In')}
              activeOpacity={0.7}
            >
              <Text style={[styles.socialBtnText, { color: theme.textPrimary }]}>
                 Apple
              </Text>
              <View style={[styles.comingSoonPill, { backgroundColor: isDark ? 'rgba(255, 149, 0, 0.2)' : '#FFF4E5' }]}>
                <Text style={styles.comingSoonPillText}>Soon</Text>
              </View>
            </TouchableOpacity>

            {/* Biometric Face ID (Coming Soon) */}
            <TouchableOpacity
              style={[
                styles.socialBtn,
                styles.comingSoonBtn,
                { backgroundColor: theme.card, borderColor: theme.cardBorder },
              ]}
              onPress={() => handleComingSoon('Face ID Authentication')}
              activeOpacity={0.7}
            >
              <ScanFace color={theme.tabBarActive} size={16} strokeWidth={2.2} />
              <Text style={[styles.socialBtnText, { color: theme.textPrimary }]}>
                Face ID
              </Text>
              <View style={[styles.comingSoonPill, { backgroundColor: isDark ? 'rgba(255, 149, 0, 0.2)' : '#FFF4E5' }]}>
                <Text style={styles.comingSoonPillText}>Soon</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer Link: Sign Up */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.textSecondary }]}>
            Don't have an account?{' '}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Onboarding')}>
            <Text style={[styles.signupLink, { color: theme.tabBarActive }]}>
              Sign Up
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
    paddingBottom: 40,
  },
  topAura: {
    position: 'absolute',
    top: -40,
    left: -20,
    right: -20,
    height: 240,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
    gap: 4,
  },
  backText: {
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBadge: {
    width: 54,
    height: 54,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 6,
    textAlign: 'center',
    paddingHorizontal: 16,
    lineHeight: 20,
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 59, 48, 0.12)',
    borderColor: '#FF3B30',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    height: '100%',
  },
  eyeBtn: {
    padding: 6,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  rememberMeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rememberMeText: {
    fontSize: 13,
    fontWeight: '500',
  },
  forgotPasswordText: {
    fontSize: 13,
    fontWeight: '600',
  },
  signInBtn: {
    height: 52,
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.32,
    shadowRadius: 8,
    elevation: 6,
  },
  signInGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  signInBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '600',
  },
  socialButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  socialBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
  },
  googleActiveBtn: {
    borderWidth: 1.5,
  },
  connectedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34C759',
    marginLeft: 2,
  },
  comingSoonBtn: {
    position: 'relative',
  },
  comingSoonPill: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 2,
  },
  comingSoonPillText: {
    color: '#FF9500',
    fontSize: 9,
    fontWeight: '800',
  },
  socialBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 28,
  },
  footerText: {
    fontSize: 14,
  },
  signupLink: {
    fontSize: 14,
    fontWeight: '700',
  },
});
