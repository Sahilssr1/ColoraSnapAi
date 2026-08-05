import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import {
  Smartphone,
  Sun,
  Moon,
  Flame,
  Scale,
  Dumbbell,
  LogOut,
} from 'lucide-react-native';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { logout, updateUser } from '../../redux/slices/authSlice';
import { ThemeMode } from '../../redux/slices/themeSlice';
import { useTheme } from '../../theme/useTheme';
import { useProfileQuery } from '../../api/queries';
import { apiClient } from '../../api/client';
import { GlassCard } from '../../components/GlassCard';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { GoalType } from '../../types';

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const { theme, isDark, themeMode, setTheme } = useTheme();
  const user = useAppSelector((state) => state.auth.user);
  const { data: profile, refetch } = useProfileQuery();

  const [isEditing, setIsEditing] = useState(false);
  const [weight, setWeight] = useState(profile?.weight?.toString() || '70');
  const [height, setHeight] = useState(profile?.height?.toString() || '175');
  const [age, setAge] = useState(profile?.age?.toString() || '25');
  const [goal, setGoal] = useState<GoalType>(profile?.goal || 'MAINTAIN');
  const [saving, setSaving] = useState(false);

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      const res = await apiClient.put('/user/profile', {
        weight: parseFloat(weight),
        height: parseFloat(height),
        age: parseInt(age, 10),
        goal,
      });

      if (res.data.success) {
        dispatch(updateUser(res.data.data));
        await refetch();
        setIsEditing(false);
        Alert.alert('Updated', 'Biometrics & nutrition goals updated!');
      }
    } catch {
      Alert.alert('Error', 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Log Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await AsyncStorage.removeItem('calora_access_token');
            await AsyncStorage.removeItem('calora_refresh_token');
            dispatch(logout());
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          } catch (e) {
            navigation.navigate('Login');
          }
        },
      },
    ]);
  };

  const themeOptions: { mode: ThemeMode; label: string; renderIcon: (active: boolean) => React.ReactNode }[] = [
    {
      mode: 'system',
      label: 'System',
      renderIcon: (active) => (
        <Smartphone color={active ? theme.pillActiveText : theme.textMuted} size={15} strokeWidth={2} />
      ),
    },
    {
      mode: 'light',
      label: 'Light',
      renderIcon: (active) => (
        <Sun color={active ? theme.pillActiveText : theme.textMuted} size={15} strokeWidth={2} />
      ),
    },
    {
      mode: 'dark',
      label: 'Dark',
      renderIcon: (active) => (
        <Moon color={active ? theme.pillActiveText : theme.textMuted} size={15} strokeWidth={2} />
      ),
    },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Large Header */}
        <Text style={[styles.largeTitle, { color: theme.textPrimary }]}>
          Health Profile
        </Text>

        {/* User Badge Card */}
        <GlassCard style={styles.userCard}>
          <View style={styles.userRow}>
            <View style={[styles.avatar, { backgroundColor: isDark ? '#2C2C2E' : '#E5E5EA' }]}>
              <Text style={[styles.avatarText, { color: theme.textPrimary }]}>
                {user?.name?.slice(0, 2).toUpperCase() || 'CU'}
              </Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={[styles.userName, { color: theme.textPrimary }]}>
                {user?.name || 'Calora Health User'}
              </Text>
              <Text style={[styles.userEmail, { color: theme.textSecondary }]}>
                {user?.email || 'user@calora.ai'}
              </Text>
            </View>
          </View>
        </GlassCard>

        {/* Appearance & Theme Preference */}
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
          Appearance
        </Text>
        <GlassCard style={styles.themeCard}>
          <Text style={[styles.settingLabel, { color: theme.textMuted }]}>
            THEME PREFERENCE
          </Text>
          <View style={[styles.themePillSelector, { backgroundColor: theme.pillBackground }]}>
            {themeOptions.map((opt) => {
              const isSelected = themeMode === opt.mode;
              return (
                <TouchableOpacity
                  key={opt.mode}
                  style={[
                    styles.themeOptionBtn,
                    isSelected && {
                      backgroundColor: theme.pillActive,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.12,
                      shadowRadius: 2,
                      elevation: 2,
                    },
                  ]}
                  onPress={() => setTheme(opt.mode)}
                  activeOpacity={0.7}
                >
                  {opt.renderIcon(isSelected)}
                  <Text
                    style={[
                      styles.themeOptionLabel,
                      {
                        color: isSelected ? theme.pillActiveText : theme.textMuted,
                        fontWeight: isSelected ? '700' : '500',
                      },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </GlassCard>

        {/* Biometrics & Goals */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            Biometrics & Nutrition Goal
          </Text>
          <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
            <Text style={[styles.editText, { color: theme.tabBarActive }]}>
              {isEditing ? 'Cancel' : 'Edit'}
            </Text>
          </TouchableOpacity>
        </View>

        <GlassCard style={styles.biometricsCard}>
          {isEditing ? (
            <View style={styles.editForm}>
              <Input
                label="Weight (kg)"
                value={weight}
                onChangeText={setWeight}
                keyboardType="numeric"
              />
              <Input
                label="Height (cm)"
                value={height}
                onChangeText={setHeight}
                keyboardType="numeric"
              />
              <Input
                label="Age"
                value={age}
                onChangeText={setAge}
                keyboardType="numeric"
              />

              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                Primary Goal
              </Text>
              <View style={styles.goalOptions}>
                {[
                  { key: 'LOSE', label: 'Lose Fat', icon: <Flame color="#FF3B30" size={16} /> },
                  { key: 'MAINTAIN', label: 'Maintain', icon: <Scale color="#007AFF" size={16} /> },
                  { key: 'BUILD', label: 'Build Muscle', icon: <Dumbbell color="#34C759" size={16} /> },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.key}
                    style={[
                      styles.goalBtn,
                      {
                        backgroundColor:
                          goal === item.key
                            ? theme.tabBarActive
                            : isDark
                            ? '#2C2C2E'
                            : '#E5E5EA',
                      },
                    ]}
                    onPress={() => setGoal(item.key as GoalType)}
                  >
                    {item.icon}
                    <Text
                      style={[
                        styles.goalBtnText,
                        {
                          color: goal === item.key ? '#FFFFFF' : theme.textPrimary,
                        },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Button
                title={saving ? 'Saving...' : 'Save Changes'}
                onPress={handleSaveProfile}
                loading={saving}
                style={{ marginTop: 16 }}
              />
            </View>
          ) : (
            <View style={styles.biometricsGrid}>
              <View style={styles.bioItem}>
                <Text style={[styles.bioLabel, { color: theme.textMuted }]}>
                  WEIGHT
                </Text>
                <Text style={[styles.bioValue, { color: theme.textPrimary }]}>
                  {profile?.weight || 70} kg
                </Text>
              </View>
              <View style={styles.bioItem}>
                <Text style={[styles.bioLabel, { color: theme.textMuted }]}>
                  HEIGHT
                </Text>
                <Text style={[styles.bioValue, { color: theme.textPrimary }]}>
                  {profile?.height || 175} cm
                </Text>
              </View>
              <View style={styles.bioItem}>
                <Text style={[styles.bioLabel, { color: theme.textMuted }]}>
                  CALORIE TARGET
                </Text>
                <Text style={[styles.bioValue, { color: '#FF3B30' }]}>
                  {profile?.calorieTarget || 2050} kcal
                </Text>
              </View>
              <View style={styles.bioItem}>
                <Text style={[styles.bioLabel, { color: theme.textMuted }]}>
                  GOAL
                </Text>
                <Text style={[styles.bioValue, { color: '#34C759' }]}>
                  {profile?.goal || 'MAINTAIN'}
                </Text>
              </View>
            </View>
          )}
        </GlassCard>

        {/* Sign Out Button */}
        <TouchableOpacity
          style={[
            styles.logoutBtn,
            { backgroundColor: isDark ? 'rgba(255, 69, 58, 0.12)' : '#FFEBEA' },
          ]}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <LogOut color="#FF3B30" size={18} strokeWidth={2.2} style={{ marginRight: 8 }} />
          <Text style={styles.logoutBtnText}>Sign Out of Calora AI</Text>
        </TouchableOpacity>

        <View style={{ height: 110 }} />
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
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 12 : 16,
  },
  largeTitle: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  userCard: {
    padding: 16,
    marginBottom: 16,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
  },
  userEmail: {
    fontSize: 13,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 10,
    marginTop: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  editText: {
    fontSize: 16,
    fontWeight: '600',
  },
  themeCard: {
    padding: 16,
    marginBottom: 16,
  },
  settingLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.0,
    marginBottom: 10,
  },
  themePillSelector: {
    flexDirection: 'row',
    borderRadius: 9,
    padding: 3,
  },
  themeOptionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 7,
    gap: 6,
  },
  themeOptionLabel: {
    fontSize: 13,
  },
  biometricsCard: {
    padding: 16,
    marginBottom: 16,
  },
  biometricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 16,
  },
  bioItem: {
    width: '50%',
  },
  bioLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  bioValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  editForm: {
    gap: 12,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 6,
  },
  goalOptions: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 4,
  },
  goalBtn: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  logoutBtn: {
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  logoutBtnText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '700',
  },
});
