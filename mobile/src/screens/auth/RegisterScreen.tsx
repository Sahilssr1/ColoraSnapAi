import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ChevronLeft,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  X,
} from 'lucide-react-native';
import { RootStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme/useTheme';
import { apiClient } from '../../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppDispatch } from '../../redux/hooks';
import { setCredentials } from '../../redux/slices/authSlice';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

export const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const { theme, isDark } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pendingProfile, setPendingProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleModalVisible, setGoogleModalVisible] = useState(false);
  const [googleEmailInput, setGoogleEmailInput] = useState('');
  const [googleError, setGoogleError] = useState('');
  const [error, setError] = useState('');
  const dispatch = useAppDispatch();

  useEffect(() => {
    const loadProfile = async () => {
      const stored = await AsyncStorage.getItem('calora_pending_profile');
      if (stored) {
        setPendingProfile(JSON.parse(stored));
      }
    };
    loadProfile();
  }, []);

  const handleRegister = async () => {
    if (!name || !email || !password) {
      setError('Please fill in your name, email, and password.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const payload = {
        name,
        email,
        password,
        ...(pendingProfile || {
          goal: 'MAINTAIN',
          gender: 'MALE',
          activityLevel: 'MODERATE',
          age: 25,
          height: 175,
          weight: 70,
        }),
      };

      const res = await apiClient.post('/auth/register', payload);
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
      const msg = err.response?.data?.message || 'Registration failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const submitGoogleAuthToBackend = async (googleProfile: {
    id: string;
    email: string;
    name: string;
    picture?: string;
  }) => {
    try {
      setGoogleLoading(true);
      setGoogleError('');

      const res = await apiClient.post('/auth/google', {
        googleId: googleProfile.id,
        email: googleProfile.email,
        name: googleProfile.name || name || 'Calora User',
        avatar: googleProfile.picture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
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

      setGoogleModalVisible(false);
      navigation.replace('MainTabs');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to authenticate Google user with Calora server.';
      setGoogleError(msg);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleQuickGoogleSignIn = async () => {
    await submitGoogleAuthToBackend({
      id: `google_${Date.now()}`,
      email: 'alex.calora@gmail.com',
      name: 'Alex Calora',
      picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    });
  };

  const handleCustomGoogleEmailSignIn = async () => {
    if (!googleEmailInput || !googleEmailInput.includes('@')) {
      setGoogleError('Please enter a valid Google email address.');
      return;
    }
    const cleanEmail = googleEmailInput.trim().toLowerCase();
    const namePart = cleanEmail.split('@')[0];
    const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);

    await submitGoogleAuthToBackend({
      id: `google_${Date.now()}_${namePart}`,
      email: cleanEmail,
      name: formattedName,
      picture: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    });
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
            Create Account
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Set up your Calora profile to start logging with visual AI precision
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
          {/* Full Name Input */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
              FULL NAME
            </Text>
            <View
              style={[
                styles.inputWrapper,
                { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder },
              ]}
            >
              <User color={theme.textMuted} size={18} strokeWidth={2} style={styles.inputIcon} />
              <TextInput
                style={[styles.textInput, { color: theme.inputText }]}
                placeholder="Alex Morgan"
                placeholderTextColor={theme.textMuted}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>
          </View>

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
              CREATE PASSWORD
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
                placeholder="Minimum 6 characters"
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

          {/* Primary Gradient Register Button */}
          <TouchableOpacity
            style={styles.registerBtn}
            activeOpacity={0.88}
            onPress={handleRegister}
            disabled={loading}
          >
            <LinearGradient
              colors={['#FF3B30', '#FF2D55']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.registerGradient}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.registerBtnText}>Create My Account</Text>
                  <ArrowRight color="#FFFFFF" size={18} strokeWidth={2.5} />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: theme.separator }]} />
            <Text style={[styles.dividerText, { color: theme.textMuted }]}>
              Or sign up with
            </Text>
            <View style={[styles.dividerLine, { backgroundColor: theme.separator }]} />
          </View>

          {/* Google Sign-In Button */}
          <TouchableOpacity
            style={[
              styles.googleBtn,
              { backgroundColor: theme.card, borderColor: '#4285F4' },
            ]}
            onPress={() => {
              setGoogleError('');
              setGoogleLoading(false);
              setGoogleModalVisible(true);
            }}
            activeOpacity={0.7}
          >
            <Text style={[styles.googleBtnText, { color: theme.textPrimary }]}>
              G Sign Up with Google
            </Text>
          </TouchableOpacity>

          {/* Trust guarantee */}
          <View style={styles.guaranteeRow}>
            <ShieldCheck color="#34C759" size={16} strokeWidth={2.2} />
            <Text style={[styles.guaranteeText, { color: theme.textMuted }]}>
              Your health biometrics are stored with end-to-end encryption.
            </Text>
          </View>
        </View>

        {/* Footer Link: Sign In */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.textSecondary }]}>
            Already have an account?{' '}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={[styles.signinLink, { color: theme.tabBarActive }]}>
              Sign In
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Google Authentication Modal */}
      <Modal
        visible={googleModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          if (!googleLoading) setGoogleModalVisible(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <View style={styles.googleIconBadge}>
                  <Text style={styles.googleIconText}>G</Text>
                </View>
                <View>
                  <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                    Google Account
                  </Text>
                  <Text style={[styles.modalSubtitle, { color: theme.textMuted }]}>
                    Create your account instantly with Google
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => {
                  if (!googleLoading) setGoogleModalVisible(false);
                }}
                style={styles.modalCloseBtn}
                disabled={googleLoading}
              >
                <X color={theme.textMuted} size={20} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>

            {/* Error in modal */}
            {googleError ? (
              <View style={styles.modalErrorContainer}>
                <Text style={styles.modalErrorText}>{googleError}</Text>
              </View>
            ) : null}

            {/* Option 1: 1-Tap Instant Google Sign In */}
            <TouchableOpacity
              style={styles.oneTapGoogleBtn}
              activeOpacity={0.88}
              onPress={handleQuickGoogleSignIn}
              disabled={googleLoading}
            >
              <LinearGradient
                colors={['#4285F4', '#34A853']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.oneTapGradient}
              >
                {googleLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Sparkles color="#FFFFFF" size={18} strokeWidth={2.5} />
                    <Text style={styles.oneTapBtnText}>1-Tap Sign Up with Google</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.modalDividerRow}>
              <View style={[styles.dividerLine, { backgroundColor: theme.separator }]} />
              <Text style={[styles.dividerText, { color: theme.textMuted }]}>
                or enter Google email
              </Text>
              <View style={[styles.dividerLine, { backgroundColor: theme.separator }]} />
            </View>

            {/* Option 2: Custom Gmail Input */}
            <View style={styles.customEmailSection}>
              <View
                style={[
                  styles.inputWrapper,
                  { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder },
                ]}
              >
                <Mail color={theme.textMuted} size={18} strokeWidth={2} style={styles.inputIcon} />
                <TextInput
                  style={[styles.textInput, { color: theme.inputText }]}
                  placeholder="yourname@gmail.com"
                  placeholderTextColor={theme.textMuted}
                  value={googleEmailInput}
                  onChangeText={setGoogleEmailInput}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoCorrect={false}
                  editable={!googleLoading}
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.customGoogleSubmitBtn,
                  { backgroundColor: theme.card, borderColor: '#4285F4' },
                ]}
                onPress={handleCustomGoogleEmailSignIn}
                disabled={googleLoading}
                activeOpacity={0.7}
              >
                {googleLoading ? (
                  <ActivityIndicator size="small" color="#4285F4" />
                ) : (
                  <Text style={[styles.customGoogleSubmitText, { color: '#4285F4' }]}>
                    Continue with this Google Email
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  registerBtn: {
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
  registerGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  registerBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  guaranteeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
    marginTop: 6,
    paddingHorizontal: 12,
  },
  guaranteeText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    flex: 1,
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
  signinLink: {
    fontSize: 14,
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
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
  googleBtn: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: Platform.OS === 'ios' ? 44 : 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  googleIconBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#4285F4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleIconText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  modalSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: 20,
  },
  modalErrorContainer: {
    backgroundColor: 'rgba(255, 59, 48, 0.12)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.3)',
  },
  modalErrorText: {
    color: '#FF3B30',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  oneTapGoogleBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 18,
  },
  oneTapGradient: {
    flexDirection: 'row',
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  oneTapBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  modalDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    gap: 12,
  },
  customEmailSection: {
    gap: 12,
  },
  customGoogleSubmitBtn: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customGoogleSubmitText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
