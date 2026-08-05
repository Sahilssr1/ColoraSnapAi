import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Camera,
  TrendingUp,
  Droplets,
  ShieldCheck,
  Sparkles,
  ChevronRight,
  Flame,
  Scale,
  Dumbbell,
  ArrowRight,
  Lock,
} from 'lucide-react-native';
import { RootStackParamList } from '../../navigation/types';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { GlassCard } from '../../components/GlassCard';
import { useTheme } from '../../theme/useTheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoalType, ActivityLevel, Gender } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const { width } = Dimensions.get('window');

export const OnboardingScreen: React.FC<Props> = ({ navigation }) => {
  const { theme, isDark } = useTheme();

  // Mode: 'SHOWCASE' -> 'GOAL' -> 'BIOMETRICS' -> 'ACTIVITY'
  const [stage, setStage] = useState<'SHOWCASE' | 'SETUP'>('SHOWCASE');
  const [step, setStep] = useState(1);

  const [goal, setGoal] = useState<GoalType>('MAINTAIN');
  const [gender, setGender] = useState<Gender>('MALE');
  const [activity, setActivity] = useState<ActivityLevel>('MODERATE');
  const [age, setAge] = useState('25');
  const [height, setHeight] = useState('175');
  const [weight, setWeight] = useState('70');

  const showcaseFeatures = [
    {
      id: 'scanner',
      title: 'Visual AI Food Recognition',
      subtitle: 'Snap your meal to instantly detect calories, protein, carbs, and micronutrients in 1.2s.',
      icon: <Camera color="#FF3B30" size={22} strokeWidth={2.2} />,
      badge: '99.4% Accuracy',
      color: '#FF3B30',
      bgColor: 'rgba(255, 59, 48, 0.10)',
    },
    {
      id: 'metabolic',
      title: 'Clinical Metabolic Insights',
      subtitle: 'Seamless Apple Health sync tracking resting energy expenditure & caloric deficit curves.',
      icon: <TrendingUp color="#34C759" size={22} strokeWidth={2.2} />,
      badge: 'Apple Health Sync',
      color: '#34C759',
      bgColor: 'rgba(52, 199, 89, 0.10)',
    },
    {
      id: 'hydration',
      title: 'Smart Hydration & Fasting',
      subtitle: 'Adaptive water logging milestones and circadian fasting window countdowns.',
      icon: <Droplets color="#007AFF" size={22} strokeWidth={2.2} />,
      badge: 'Circadian Timers',
      color: '#007AFF',
      bgColor: 'rgba(0, 122, 255, 0.10)',
    },
  ];

  const goals = [
    { type: 'LOSE_WEIGHT' as GoalType, title: 'Lose Fat', subtitle: 'Targeted caloric deficit & high protein', icon: <Flame color="#FF3B30" size={20} /> },
    { type: 'MAINTAIN' as GoalType, title: 'Maintain & Tone', subtitle: 'Balanced macros for peak metabolic health', icon: <Scale color="#007AFF" size={20} /> },
    { type: 'GAIN_WEIGHT' as GoalType, title: 'Build Muscle', subtitle: 'Caloric surplus with optimal hypertrophy macros', icon: <Dumbbell color="#34C759" size={20} /> },
  ];

  const activityLevels = [
    { level: 'SEDENTARY' as ActivityLevel, title: 'Sedentary', subtitle: 'Desk job, little to no daily workouts' },
    { level: 'LIGHT' as ActivityLevel, title: 'Light Activity', subtitle: '1-3 days of exercise / walking per week' },
    { level: 'MODERATE' as ActivityLevel, title: 'Moderate Activity', subtitle: '3-5 days of high intensity training / week' },
    { level: 'VERY_ACTIVE' as ActivityLevel, title: 'Very Active', subtitle: '6-7 days of heavy training or endurance' },
  ];

  const handleFinishSetup = async () => {
    await AsyncStorage.setItem('calora_onboarded', 'true');
    await AsyncStorage.setItem(
      'calora_pending_profile',
      JSON.stringify({
        goal,
        gender,
        activityLevel: activity,
        age: parseInt(age, 10) || 25,
        height: parseFloat(height) || 175,
        weight: parseFloat(weight) || 70,
      })
    );
    navigation.replace('Register');
  };

  // ----------------------------------------------------
  // 1. FEATURE SHOWCASE HERO (PRE-LOGIN STAGE)
  // ----------------------------------------------------
  if (stage === 'SHOWCASE') {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.showcaseScroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Top Gradient Header Aura */}
          <LinearGradient
            colors={theme.headerGlow}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.topAura}
          />

          {/* Calora AI Brand Hero */}
          <View style={styles.brandHero}>
            <LinearGradient
              colors={['#FF3B30', '#FF2D55']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoBadge}
            >
              <Sparkles color="#FFFFFF" size={28} strokeWidth={2.5} />
            </LinearGradient>

            <Text style={[styles.brandTitle, { color: theme.textPrimary }]}>
              Calora AI
            </Text>
            <Text style={[styles.brandTagline, { color: theme.textSecondary }]}>
              Intelligent Nutrition & Metabolic Precision
            </Text>
          </View>

          {/* Feature Showcase Cards */}
          <View style={styles.cardsList}>
            {showcaseFeatures.map((feat) => (
              <GlassCard key={feat.id} style={styles.featureCard}>
                <View style={styles.featureRow}>
                  <View style={[styles.featureIconBadge, { backgroundColor: feat.bgColor }]}>
                    {feat.icon}
                  </View>
                  <View style={styles.featureContent}>
                    <View style={styles.featureTitleRow}>
                      <Text style={[styles.featureTitle, { color: theme.textPrimary }]}>
                        {feat.title}
                      </Text>
                    </View>
                    <Text style={[styles.featureSubtitle, { color: theme.textSecondary }]}>
                      {feat.subtitle}
                    </Text>
                    <View style={[styles.pillBadge, { backgroundColor: feat.bgColor }]}>
                      <Text style={[styles.pillBadgeText, { color: feat.color }]}>
                        {feat.badge}
                      </Text>
                    </View>
                  </View>
                </View>
              </GlassCard>
            ))}
          </View>

          {/* Trust Badges */}
          <View style={styles.trustBadgesRow}>
            <View style={[styles.trustBadge, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <ShieldCheck color="#34C759" size={16} strokeWidth={2.2} />
              <Text style={[styles.trustBadgeText, { color: theme.textSecondary }]}>
                99.4% Macro Accuracy
              </Text>
            </View>

            <View style={[styles.trustBadge, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
              <Lock color="#007AFF" size={15} strokeWidth={2.2} />
              <Text style={[styles.trustBadgeText, { color: theme.textSecondary }]}>
                Private & Encrypted
              </Text>
            </View>
          </View>

          {/* Action CTAs */}
          <View style={styles.showcaseActions}>
            <TouchableOpacity
              style={styles.primaryGetStartedBtn}
              activeOpacity={0.88}
              onPress={() => setStage('SETUP')}
            >
              <LinearGradient
                colors={['#FF3B30', '#FF2D55']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.primaryGradient}
              >
                <Text style={styles.primaryBtnText}>Get Started Free</Text>
                <ArrowRight color="#FFFFFF" size={18} strokeWidth={2.5} />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.secondaryLoginBtn,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.cardBorder,
                },
              ]}
              activeOpacity={0.75}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={[styles.secondaryBtnText, { color: theme.textPrimary }]}>
                I already have an account • Log In
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ----------------------------------------------------
  // 2. INTERACTIVE GOAL & BIOMETRICS SETUP
  // ----------------------------------------------------
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <View style={styles.setupContainer}>
        {/* Step Indicator */}
        <View style={styles.stepHeader}>
          <View style={styles.stepTitleRow}>
            <TouchableOpacity
              onPress={() => {
                if (step === 1) setStage('SHOWCASE');
                else setStep(step - 1);
              }}
              style={styles.backPill}
            >
              <Text style={[styles.backPillText, { color: theme.tabBarActive }]}>‹ Back</Text>
            </TouchableOpacity>

            <Text style={[styles.stepText, { color: theme.textMuted }]}>
              Step {step} of 3
            </Text>
          </View>

          <View style={[styles.progressBar, { backgroundColor: isDark ? '#2C2C2E' : '#E5E5EA' }]}>
            <View style={[styles.progressFill, { width: `${(step / 3) * 100}%` }]} />
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {step === 1 && (
            <View>
              <Text style={[styles.heading, { color: theme.textPrimary }]}>
                What is your primary goal?
              </Text>
              <Text style={[styles.subheading, { color: theme.textSecondary }]}>
                Calora AI personalizes your daily calories, protein targets, and metabolic health curves.
              </Text>

              {goals.map((g) => {
                const isSelected = goal === g.type;
                return (
                  <TouchableOpacity
                    key={g.type}
                    activeOpacity={0.8}
                    onPress={() => setGoal(g.type)}
                    style={[
                      styles.optionCard,
                      {
                        backgroundColor: theme.card,
                        borderColor: isSelected ? '#FF3B30' : theme.cardBorder,
                      },
                      isSelected && {
                        backgroundColor: isDark ? 'rgba(255, 59, 48, 0.12)' : '#FFF0EF',
                      },
                    ]}
                  >
                    <View style={[styles.goalIconBadge, { backgroundColor: isDark ? '#2C2C2E' : '#E5E5EA' }]}>
                      {g.icon}
                    </View>
                    <View style={styles.optionTextContainer}>
                      <Text style={[styles.optionTitle, { color: theme.textPrimary }]}>
                        {g.title}
                      </Text>
                      <Text style={[styles.optionSubtitle, { color: theme.textSecondary }]}>
                        {g.subtitle}
                      </Text>
                    </View>
                    <ChevronRight color={isSelected ? '#FF3B30' : theme.textMuted} size={18} strokeWidth={2} />
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {step === 2 && (
            <View>
              <Text style={[styles.heading, { color: theme.textPrimary }]}>
                Biometric Profile
              </Text>
              <Text style={[styles.subheading, { color: theme.textSecondary }]}>
                Calculates your Basal Metabolic Rate (BMR) with clinical precision.
              </Text>

              {/* Gender selector */}
              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
                GENDER
              </Text>
              <View style={styles.genderRow}>
                {(['MALE', 'FEMALE', 'OTHER'] as Gender[]).map((gen) => (
                  <TouchableOpacity
                    key={gen}
                    onPress={() => setGender(gen)}
                    style={[
                      styles.genderButton,
                      {
                        backgroundColor: theme.card,
                        borderColor: gender === gen ? '#FF3B30' : theme.cardBorder,
                      },
                      gender === gen && {
                        backgroundColor: isDark ? 'rgba(255, 59, 48, 0.12)' : '#FFF0EF',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.genderText,
                        { color: gender === gen ? '#FF3B30' : theme.textSecondary },
                      ]}
                    >
                      {gen}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Input
                label="Age (Years)"
                value={age}
                onChangeText={setAge}
                keyboardType="numeric"
                placeholder="25"
              />

              <Input
                label="Height (cm)"
                value={height}
                onChangeText={setHeight}
                keyboardType="numeric"
                placeholder="175"
              />

              <Input
                label="Current Weight (kg)"
                value={weight}
                onChangeText={setWeight}
                keyboardType="numeric"
                placeholder="70"
              />
            </View>
          )}

          {step === 3 && (
            <View>
              <Text style={[styles.heading, { color: theme.textPrimary }]}>
                Activity Level
              </Text>
              <Text style={[styles.subheading, { color: theme.textSecondary }]}>
                Used to determine your Total Daily Energy Expenditure (TDEE).
              </Text>

              {activityLevels.map((a) => {
                const isSelected = activity === a.level;
                return (
                  <TouchableOpacity
                    key={a.level}
                    activeOpacity={0.8}
                    onPress={() => setActivity(a.level)}
                    style={[
                      styles.optionCard,
                      {
                        backgroundColor: theme.card,
                        borderColor: isSelected ? '#FF3B30' : theme.cardBorder,
                      },
                      isSelected && {
                        backgroundColor: isDark ? 'rgba(255, 59, 48, 0.12)' : '#FFF0EF',
                      },
                    ]}
                  >
                    <View style={styles.optionTextContainer}>
                      <Text style={[styles.optionTitle, { color: theme.textPrimary }]}>
                        {a.title}
                      </Text>
                      <Text style={[styles.optionSubtitle, { color: theme.textSecondary }]}>
                        {a.subtitle}
                      </Text>
                    </View>
                    <ChevronRight color={isSelected ? '#FF3B30' : theme.textMuted} size={18} strokeWidth={2} />
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>

        {/* Bottom Navigation Buttons */}
        <View style={styles.bottomButtons}>
          <Button
            title={step === 3 ? 'Create My Account' : 'Continue'}
            variant="primary"
            onPress={() => {
              if (step < 3) setStep(step + 1);
              else handleFinishSetup();
            }}
            style={styles.fullButton}
          />
        </View>
      </View>
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
  showcaseScroll: {
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
  brandHero: {
    alignItems: 'center',
    marginBottom: 28,
    marginTop: 10,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  brandTagline: {
    fontSize: 15,
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
  },
  cardsList: {
    gap: 12,
    marginBottom: 20,
  },
  featureCard: {
    padding: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  featureIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureContent: {
    flex: 1,
  },
  featureTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  featureSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 3,
    marginBottom: 8,
  },
  pillBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  pillBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  trustBadgesRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    marginBottom: 28,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  trustBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  showcaseActions: {
    gap: 12,
  },
  primaryGetStartedBtn: {
    height: 52,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryLoginBtn: {
    height: 50,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  setupContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    justifyContent: 'space-between',
  },
  stepHeader: {
    marginBottom: 16,
  },
  stepTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  backPill: {
    paddingVertical: 4,
  },
  backPillText: {
    fontSize: 15,
    fontWeight: '600',
  },
  stepText: {
    fontSize: 13,
    fontWeight: '600',
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF3B30',
    borderRadius: 2,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  heading: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 8,
  },
  subheading: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
  },
  goalIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  optionSubtitle: {
    fontSize: 13,
    marginTop: 3,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  genderButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  genderText: {
    fontWeight: '600',
    fontSize: 13,
  },
  bottomButtons: {
    paddingVertical: 16,
  },
  fullButton: {
    width: '100%',
  },
});
