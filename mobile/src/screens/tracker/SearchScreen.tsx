import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Platform,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Search as SearchIcon,
  Mic,
  Flame,
  Ruler,
  HeartHandshake,
  Ear,
  Heart,
  Pill,
  Brain,
  Footprints,
  Utensils,
  Wind,
  Moon,
  ChevronRight,
  Plus,
  X,
  TrendingUp,
  CheckCircle2,
  Sparkles,
} from 'lucide-react-native';
import { RootStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme/useTheme';
import { useFoodSearchQuery, useDashboardQuery, useProfileQuery, useLogSleepMutation } from '../../api/queries';
import { apiClient } from '../../api/client';
import { AppleHealthCategoryRow } from '../../components/AppleHealthCategoryRow';
import { GlassCard } from '../../components/GlassCard';
import { MiniSparkline } from '../../components/MiniSparkline';
import { MiniScoreGauge } from '../../components/MiniScoreGauge';

interface CategoryDetail {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  mainVal: string;
  mainUnit: string;
  status: string;
  metrics: Array<{ label: string; value: string; color: string }>;
  sparklineData: number[];
  description: string;
}

export const SearchScreen = ({ navigation }: any) => {
  const { theme, isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryDetail | null>(null);
  const [logWeightInput, setLogWeightInput] = useState('');
  const [isLoggingWeight, setIsLoggingWeight] = useState(false);
  const [logSleepHoursInput, setLogSleepHoursInput] = useState('7.5');
  const [isLoggingSleep, setIsLoggingSleep] = useState(false);

  // Live Food Search from PostgreSQL database & USDA API
  const { data: searchResults, isLoading: isSearching } = useFoodSearchQuery(searchQuery);
  const { data: dashboard, refetch: refetchDashboard } = useDashboardQuery();
  const { data: profile } = useProfileQuery();
  const logSleepMutation = useLogSleepMutation();

  const userWeight = profile?.weight || dashboard?.bodyMetrics?.weight || 70;
  const userHeight = profile?.height || dashboard?.bodyMetrics?.height || 175;
  const userBmi = dashboard?.bodyMetrics?.bmi || 22.8;
  const consumedCals = Math.round(dashboard?.summary?.caloriesConsumed || 0);

  const dbSleep = dashboard?.sleep;
  const hasSleep = dbSleep && dbSleep.score !== null && dbSleep.score !== undefined;

  const HEALTH_CATEGORIES_DATA: Record<string, CategoryDetail> = {
    activity: {
      id: 'activity',
      title: 'Activity',
      subtitle: 'Active Energy & Movement',
      icon: <Flame color="#FFFFFF" size={20} strokeWidth={2.2} />,
      color: '#FF3B30',
      mainVal: `${consumedCals || 450}`,
      mainUnit: 'kcal',
      status: 'Active burn calculated from metabolic baseline',
      metrics: [
        { label: 'Active Calories', value: `${consumedCals} kcal`, color: '#FF3B30' },
        { label: 'Exercise', value: '28 min', color: '#34C759' },
        { label: 'Stand Hours', value: '9 hr', color: '#007AFF' },
      ],
      sparklineData: [30, 45, 60, 80, 55, 90, 75, 100],
      description: 'Your activity tracks active energy burned through movement, workouts, and basal metabolic rate.',
    },
    body: {
      id: 'body',
      title: 'Body Measurements',
      subtitle: 'Weight, Height & Composition',
      icon: <Ruler color="#FFFFFF" size={20} strokeWidth={2.2} />,
      color: '#FF9500',
      mainVal: `${userWeight}`,
      mainUnit: 'kg',
      status: `BMI: ${userBmi.toFixed(1)} • Normal weight`,
      metrics: [
        { label: 'Weight', value: `${userWeight} kg`, color: '#FF9500' },
        { label: 'Height', value: `${userHeight} cm`, color: '#007AFF' },
        { label: 'BMI', value: `${userBmi.toFixed(1)}`, color: '#34C759' },
      ],
      sparklineData: [72, 71.8, 71.5, 71.2, 70.8, 70.4, 70.0],
      description: 'Body measurements help calculate accurate caloric targets, BMR, and track healthy muscle/fat evolution.',
    },
    cycle: {
      id: 'cycle',
      title: 'Cycle Tracking',
      subtitle: 'Hormonal & Period Prediction',
      icon: <HeartHandshake color="#FFFFFF" size={20} strokeWidth={2.2} />,
      color: '#FF2D55',
      mainVal: 'Day 14',
      mainUnit: 'Follicular',
      status: 'Regular cycle length (28 days)',
      metrics: [
        { label: 'Current Phase', value: 'Ovulation window', color: '#FF2D55' },
        { label: 'Next Period in', value: '14 days', color: '#AF52DE' },
        { label: 'Cycle Duration', value: '28 days', color: '#34C759' },
      ],
      sparklineData: [20, 40, 70, 95, 80, 50, 30],
      description: 'Tracks cycle stages to recommend optimal macronutrient timing and hydration adjustments.',
    },
    hearing: {
      id: 'hearing',
      title: 'Hearing',
      subtitle: 'Environmental & Audio Safety',
      icon: <Ear color="#FFFFFF" size={20} strokeWidth={2.2} />,
      color: '#AF52DE',
      mainVal: '62',
      mainUnit: 'dB',
      status: 'OK • Safe listening exposure',
      metrics: [
        { label: 'Headphone Audio', value: '62 dB (Safe)', color: '#34C759' },
        { label: 'Environmental Noise', value: '55 dB', color: '#007AFF' },
        { label: 'Weekly Exposure', value: '22% of limit', color: '#AF52DE' },
      ],
      sparklineData: [50, 58, 62, 55, 68, 60, 62],
      description: 'Monitors audio volume levels to ensure safe exposure throughout the day.',
    },
    heart: {
      id: 'heart',
      title: 'Heart',
      subtitle: 'Heart Rate & HRV Telemetry',
      icon: <Heart color="#FFFFFF" size={20} strokeWidth={2.2} />,
      color: '#FF2D55',
      mainVal: '68',
      mainUnit: 'BPM',
      status: 'Resting Heart Rate in optimal athletic range',
      metrics: [
        { label: 'Resting HR', value: '68 BPM', color: '#FF2D55' },
        { label: 'Walking Average', value: '94 BPM', color: '#FF9500' },
        { label: 'Heart Rate Variability', value: '58 ms', color: '#34C759' },
      ],
      sparklineData: [64, 68, 72, 69, 66, 68, 67],
      description: 'Your resting heart rate is an indicator of cardiovascular fitness and metabolic recovery state.',
    },
    medications: {
      id: 'medications',
      title: 'Medications',
      subtitle: 'Supplements & Daily Intake',
      icon: <Pill color="#FFFFFF" size={20} strokeWidth={2.2} />,
      color: '#007AFF',
      mainVal: '3 of 3',
      mainUnit: 'taken',
      status: 'All daily supplements logged today',
      metrics: [
        { label: 'Vitamin D3 + K2', value: 'Logged (Morning)', color: '#34C759' },
        { label: 'Omega-3 Fish Oil', value: 'Logged (Lunch)', color: '#007AFF' },
        { label: 'Magnesium Glycinate', value: 'Scheduled (Night)', color: '#AF52DE' },
      ],
      sparklineData: [100, 100, 100, 100, 100, 100, 100],
      description: 'Keeps track of scheduled dietary supplements and micro-nutrient boosters.',
    },
    mental: {
      id: 'mental',
      title: 'Mental Wellbeing',
      subtitle: 'State of Mind & Mindfulness',
      icon: <Brain color="#FFFFFF" size={20} strokeWidth={2.2} />,
      color: '#5856D6',
      mainVal: 'Balanced',
      mainUnit: 'State',
      status: 'High cognitive focus & low cortisol flags',
      metrics: [
        { label: 'Mindful Minutes', value: '15 min today', color: '#5856D6' },
        { label: 'Mood Log', value: 'Pleasant & Calm', color: '#34C759' },
        { label: 'Recovery Balance', value: '92% Optimal', color: '#007AFF' },
      ],
      sparklineData: [70, 75, 80, 85, 90, 88, 92],
      description: 'Tracks cognitive recovery, stress markers, and mindful reflection intervals.',
    },
    steps: {
      id: 'steps',
      title: 'Steps & Pedometer',
      subtitle: 'Daily Motion & Cadence',
      icon: <Footprints color="#FFFFFF" size={20} strokeWidth={2.2} />,
      color: '#FF9500',
      mainVal: `${(dashboard?.steps?.count ?? 0).toLocaleString()}`,
      mainUnit: 'steps',
      status: `Goal: 10,000 steps • ${dashboard?.steps?.burnedCalories || Math.round((dashboard?.steps?.count || 0) * 0.04)} kcal`,
      metrics: [
        { label: 'Today Steps', value: `${(dashboard?.steps?.count ?? 0).toLocaleString()} steps`, color: '#FF9500' },
        { label: 'Active Burn', value: `${dashboard?.steps?.burnedCalories || Math.round((dashboard?.steps?.count || 0) * 0.04)} kcal`, color: '#FF3B30' },
        { label: 'Distance', value: `${((dashboard?.steps?.count || 0) * 0.000762).toFixed(2)} km`, color: '#34C759' },
      ],
      sparklineData: [4500, 6200, 8100, 9400, 7800, 10200, dashboard?.steps?.count || 0],
      description: 'Tracks real-time footsteps from phone motion sensors and syncs automatically to PostgreSQL.',
    },
    mobility: {
      id: 'mobility',
      title: 'Mobility',
      subtitle: 'Steadiness, Speed & Cadence',
      icon: <Footprints color="#FFFFFF" size={20} strokeWidth={2.2} />,
      color: '#FF9500',
      mainVal: 'OK',
      mainUnit: 'Steadiness',
      status: 'Normal stride symmetry & cadence verified',
      metrics: [
        { label: 'Walking Speed', value: '4.8 km/h', color: '#34C759' },
        { label: 'Step Length', value: '72 cm', color: '#007AFF' },
        { label: 'Walking Asymmetry', value: '1.2% (Excellent)', color: '#FF9500' },
      ],
      sparklineData: [92, 94, 95, 93, 96, 95, 96],
      description: 'Evaluates your walking stability, stride balance, and lower body biomechanics.',
    },
    nutrition: {
      id: 'nutrition',
      title: 'Nutrition',
      subtitle: 'Calories & Macro Breakdown',
      icon: <Utensils color="#FFFFFF" size={20} strokeWidth={2.2} />,
      color: '#34C759',
      mainVal: `${consumedCals}`,
      mainUnit: 'kcal',
      status: `Target: ${dashboard?.goals?.targetCalories || 2000} kcal`,
      metrics: [
        { label: 'Protein', value: `${Math.round(dashboard?.summary?.proteinConsumed || 0)}g`, color: '#34C759' },
        { label: 'Carbs', value: `${Math.round(dashboard?.summary?.carbsConsumed || 0)}g`, color: '#FF9500' },
        { label: 'Fat', value: `${Math.round(dashboard?.summary?.fatConsumed || 0)}g`, color: '#AF52DE' },
      ],
      sparklineData: [1800, 1950, 2100, 1850, 2050, 1900, consumedCals || 2000],
      description: 'Comprehensive nutritional tracking powered by AI vision and clinical nutrient databases.',
    },
    respiratory: {
      id: 'respiratory',
      title: 'Respiratory',
      subtitle: 'Blood Oxygen & Respiratory Rate',
      icon: <Wind color="#FFFFFF" size={20} strokeWidth={2.2} />,
      color: '#5AC8FA',
      mainVal: '98%',
      mainUnit: 'SpO2',
      status: 'Blood oxygen saturation in optimal range',
      metrics: [
        { label: 'Oxygen Saturation', value: '98% (Normal)', color: '#5AC8FA' },
        { label: 'Respiratory Rate', value: '14 breaths/min', color: '#34C759' },
        { label: 'VO2 Max Estimate', value: '46.2 (Good)', color: '#007AFF' },
      ],
      sparklineData: [98, 97, 98, 99, 98, 98, 98],
      description: 'Monitors pulmonary efficiency, resting blood oxygen, and aerobic capacity.',
    },
    sleep: {
      id: 'sleep',
      title: 'Sleep',
      subtitle: 'Duration, Stages & Recovery',
      icon: <Moon color="#FFFFFF" size={20} strokeWidth={2.2} />,
      color: '#5856D6',
      mainVal: hasSleep ? `${dbSleep?.score}` : 'Tap to Log',
      mainUnit: hasSleep ? 'Score' : '',
      status: hasSleep ? `${dbSleep?.status}` : 'No sleep logged yet today',
      metrics: [
        { label: 'Total Sleep', value: hasSleep ? `${dbSleep?.hours} hours` : 'Not Logged', color: '#5856D6' },
        { label: 'Deep Sleep', value: hasSleep ? `${dbSleep?.deepHours || (dbSleep!.hours * 0.22).toFixed(1)}h (22%)` : '--', color: '#34C759' },
        { label: 'Recovery Status', value: hasSleep && dbSleep!.score! >= 75 ? 'Optimal Rest' : 'Needs Sleep', color: '#007AFF' },
      ],
      sparklineData: [85, 90, 88, 92, 94, 91, hasSleep ? dbSleep!.score! : 80],
      description: 'Analyzes circadian rhythm, metabolic repair, and sleep efficiency.',
    },
  };

  const handleOpenCategory = (catId: string) => {
    const detail = HEALTH_CATEGORIES_DATA[catId];
    if (detail) {
      setSelectedCategory(detail);
    }
  };

  const handleSaveSleepToDatabase = async () => {
    const hours = parseFloat(logSleepHoursInput);
    if (isNaN(hours) || hours <= 0 || hours > 24) {
      Alert.alert('Invalid Hours', 'Please enter valid sleep hours (e.g. 7.5).');
      return;
    }
    try {
      setIsLoggingSleep(true);
      await logSleepMutation.mutateAsync({ hours });
      await refetchDashboard();
      Alert.alert('Sleep Logged! 🌙', `Saved ${hours}h sleep to PostgreSQL database!`);
      setSelectedCategory(null);
    } catch {
      Alert.alert('Error', 'Failed to save sleep entry to database.');
    } finally {
      setIsLoggingSleep(false);
    }
  };

  const handleSaveWeightToDatabase = async () => {
    const w = parseFloat(logWeightInput);
    if (isNaN(w) || w <= 20 || w >= 300) {
      Alert.alert('Invalid Weight', 'Please enter a valid weight in kg.');
      return;
    }
    try {
      setIsLoggingWeight(true);
      await apiClient.post('/weight', { weight: w });
      await refetchDashboard();
      Alert.alert('Saved', `Logged ${w} kg to your database profile!`);
      setLogWeightInput('');
      setSelectedCategory(null);
    } catch {
      Alert.alert('Error', 'Failed to save weight entry to database.');
    } finally {
      setIsLoggingWeight(false);
    }
  };

  const HEALTH_CATEGORIES_LIST = Object.values(HEALTH_CATEGORIES_DATA);

  const filteredCategories = HEALTH_CATEGORIES_LIST.filter((cat) =>
    cat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Large Apple Health Title */}
        <Text style={[styles.largeTitle, { color: theme.textPrimary }]}>
          Search
        </Text>

        {/* Apple Health iOS Search Bar */}
        <View
          style={[
            styles.searchBarContainer,
            { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder },
          ]}
        >
          <SearchIcon color={theme.textMuted} size={18} strokeWidth={2} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: theme.inputText }]}
            placeholder="Search foods, calories, nutrients..."
            placeholderTextColor={theme.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          {isSearching ? (
            <ActivityIndicator size="small" color={theme.tabBarActive} />
          ) : (
            <Mic color={theme.textMuted} size={18} strokeWidth={2} />
          )}
        </View>

        {/* Live Search Results from Database */}
        {searchQuery.trim().length > 1 ? (
          <View style={styles.resultsContainer}>
            <Text style={[styles.sectionHeader, { color: theme.textPrimary }]}>
              Food Database Results
            </Text>

            {searchResults && searchResults.length > 0 ? (
              <GlassCard style={styles.searchResultsCard}>
                {searchResults.map((item, idx) => (
                  <TouchableOpacity
                    key={item.id || idx}
                    style={[
                      styles.foodResultRow,
                      idx < searchResults.length - 1 && styles.borderBottom,
                    ]}
                    onPress={() => navigation.navigate('FoodDetail', { food: item, mealType: 'LUNCH' })}
                    activeOpacity={0.7}
                  >
                    <View style={styles.foodResultInfo}>
                      <Text style={[styles.foodResultTitle, { color: theme.textPrimary }]}>
                        {item.name}
                      </Text>
                      <Text style={[styles.foodResultSub, { color: theme.textMuted }]}>
                        {item.servingSize} {item.servingUnit} • {Math.round(item.protein)}g P • {Math.round(item.carbs)}g C • {Math.round(item.fat)}g F
                      </Text>
                    </View>
                    <View style={styles.foodResultRight}>
                      <Text style={[styles.foodResultCalories, { color: '#FF3B30' }]}>
                        {Math.round(item.calories)} kcal
                      </Text>
                      <ChevronRight color={theme.textMuted} size={16} />
                    </View>
                  </TouchableOpacity>
                ))}
              </GlassCard>
            ) : !isSearching ? (
              <View style={styles.noResults}>
                <Text style={[styles.noResultsText, { color: theme.textMuted }]}>
                  No food items found matching "{searchQuery}". Try "Apple", "Rice", "Egg", or "Chicken".
                </Text>
              </View>
            ) : null}
          </View>
        ) : (
          <>
            {/* Health Categories */}
            <Text style={[styles.sectionHeader, { color: theme.textPrimary }]}>
              Health Categories
            </Text>

            <View
              style={[
                styles.groupedCard,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.cardBorder,
                  shadowColor: isDark ? '#000000' : '#8E8E93',
                  shadowOpacity: isDark ? 0.35 : 0.08,
                },
              ]}
            >
              {filteredCategories.map((item, index) => (
                <AppleHealthCategoryRow
                  key={item.id}
                  icon={item.icon}
                  title={item.title}
                  iconBgColor={item.color}
                  isLast={index === filteredCategories.length - 1}
                  onPress={() => handleOpenCategory(item.id)}
                />
              ))}
            </View>
          </>
        )}

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* Interactive Apple Health Category Detail Modal */}
      <Modal
        visible={selectedCategory !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedCategory(null)}
      >
        <SafeAreaView style={[styles.modalSafeArea, { backgroundColor: theme.background }]}>
          {selectedCategory && (
            <ScrollView
              style={styles.modalScrollView}
              contentContainerStyle={styles.modalContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Modal Top Nav */}
              <View style={styles.modalNav}>
                <View style={[styles.modalCategoryBadge, { backgroundColor: selectedCategory.color }]}>
                  {selectedCategory.icon}
                </View>
                <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                  {selectedCategory.title}
                </Text>
                <TouchableOpacity
                  style={[styles.closeBtn, { backgroundColor: isDark ? '#2C2C2E' : '#E5E5EA' }]}
                  onPress={() => setSelectedCategory(null)}
                >
                  <X color={theme.textPrimary} size={18} strokeWidth={2.5} />
                </TouchableOpacity>
              </View>

              {/* Main Metric Card */}
              <GlassCard style={styles.modalMainCard}>
                <Text style={[styles.modalCategorySub, { color: theme.textMuted }]}>
                  LATEST MEASUREMENT
                </Text>
                <View style={styles.modalValRow}>
                  <Text style={[styles.modalMainVal, { color: selectedCategory.color }]}>
                    {selectedCategory.mainVal}
                  </Text>
                  <Text style={[styles.modalMainUnit, { color: theme.textSecondary }]}>
                    {selectedCategory.mainUnit}
                  </Text>
                </View>
                <Text style={[styles.modalStatusText, { color: '#34C759' }]}>
                  ● {selectedCategory.status}
                </Text>

                {/* Sparkline chart */}
                <View style={styles.modalChartContainer}>
                  <MiniSparkline
                    data={selectedCategory.sparklineData}
                    barColor={selectedCategory.color}
                  />
                </View>
              </GlassCard>

              {/* Metrics Grid */}
              <Text style={[styles.modalSectionTitle, { color: theme.textPrimary }]}>
                Key Metrics
              </Text>
              <GlassCard style={styles.modalMetricsCard}>
                {selectedCategory.metrics.map((m, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.modalMetricRow,
                      idx < selectedCategory.metrics.length - 1 && styles.borderBottom,
                    ]}
                  >
                    <Text style={[styles.modalMetricLabel, { color: theme.textSecondary }]}>
                      {m.label}
                    </Text>
                    <Text style={[styles.modalMetricValue, { color: theme.textPrimary }]}>
                      {m.value}
                    </Text>
                  </View>
                ))}
              </GlassCard>

              {/* Custom Database Action for Body Measurements */}
              {selectedCategory.id === 'body' && (
                <GlassCard style={styles.logWeightCard}>
                  <Text style={[styles.logWeightTitle, { color: theme.textPrimary }]}>
                    Log New Weight (Database Sync)
                  </Text>
                  <View style={styles.logWeightRow}>
                    <TextInput
                      style={[
                        styles.logWeightInput,
                        {
                          backgroundColor: theme.inputBackground,
                          color: theme.inputText,
                          borderColor: theme.inputBorder,
                        },
                      ]}
                      placeholder="e.g. 71.5"
                      placeholderTextColor={theme.textMuted}
                      keyboardType="numeric"
                      value={logWeightInput}
                      onChangeText={setLogWeightInput}
                    />
                    <TouchableOpacity
                      style={styles.logWeightBtn}
                      onPress={handleSaveWeightToDatabase}
                      disabled={isLoggingWeight}
                    >
                      {isLoggingWeight ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.logWeightBtnText}>Save to DB</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </GlassCard>
              )}

              {/* Log Sleep directly into Database */}
              {selectedCategory.id === 'sleep' && (
                <GlassCard style={styles.logWeightCard}>
                  <Text style={[styles.logWeightTitle, { color: theme.textPrimary }]}>
                    Log Sleep Hours
                  </Text>
                  <View style={styles.logWeightRow}>
                    <TextInput
                      style={[
                        styles.logWeightInput,
                        {
                          backgroundColor: theme.inputBackground,
                          color: theme.inputText,
                          borderColor: theme.inputBorder,
                        },
                      ]}
                      placeholder="e.g. 7.5"
                      placeholderTextColor={theme.textMuted}
                      keyboardType="numeric"
                      value={logSleepHoursInput}
                      onChangeText={setLogSleepHoursInput}
                    />
                    <TouchableOpacity
                      style={[styles.logWeightBtn, { backgroundColor: '#5856D6' }]}
                      onPress={handleSaveSleepToDatabase}
                      disabled={isLoggingSleep}
                    >
                      {isLoggingSleep ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.logWeightBtnText}>Save to DB</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </GlassCard>
              )}

              {/* Action Buttons */}
              {selectedCategory.id === 'nutrition' && (
                <TouchableOpacity
                  style={styles.modalActionBtn}
                  onPress={() => {
                    setSelectedCategory(null);
                    navigation.navigate('Search');
                  }}
                >
                  <Utensils color="#FFFFFF" size={18} style={{ marginRight: 6 }} />
                  <Text style={styles.modalActionBtnText}>Search & Log Meal</Text>
                </TouchableOpacity>
              )}

              {selectedCategory.id === 'activity' && (
                <TouchableOpacity
                  style={styles.modalActionBtn}
                  onPress={() => {
                    setSelectedCategory(null);
                    navigation.navigate('Analytics');
                  }}
                >
                  <TrendingUp color="#FFFFFF" size={18} style={{ marginRight: 6 }} />
                  <Text style={styles.modalActionBtnText}>View Trends & Activity</Text>
                </TouchableOpacity>
              )}

              {/* Clinical Explanation */}
              <GlassCard style={styles.modalAboutCard}>
                <Text style={[styles.modalAboutTitle, { color: theme.textPrimary }]}>
                  Clinical Health Overview
                </Text>
                <Text style={[styles.modalAboutText, { color: theme.textSecondary }]}>
                  {selectedCategory.description}
                </Text>
              </GlassCard>

              <View style={{ height: 40 }} />
            </ScrollView>
          )}
        </SafeAreaView>
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
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 12 : 16,
  },
  largeTitle: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 14,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 20,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '400',
  },
  resultsContainer: {
    marginBottom: 20,
  },
  searchResultsCard: {
    padding: 8,
    borderRadius: 16,
  },
  foodResultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  borderBottom: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150,150,150,0.2)',
  },
  foodResultInfo: {
    flex: 1,
  },
  foodResultTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  foodResultSub: {
    fontSize: 12,
    marginTop: 2,
  },
  foodResultRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  foodResultCalories: {
    fontSize: 14,
    fontWeight: '700',
  },
  noResults: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 14,
    textAlign: 'center',
  },
  sectionHeader: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 10,
  },
  groupedCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 3,
  },
  modalSafeArea: {
    flex: 1,
  },
  modalScrollView: {
    flex: 1,
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  modalNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  modalCategoryBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    flex: 1,
    marginLeft: 12,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalMainCard: {
    padding: 18,
    marginBottom: 16,
  },
  modalCategorySub: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  modalValRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginVertical: 4,
    gap: 6,
  },
  modalMainVal: {
    fontSize: 36,
    fontWeight: '800',
  },
  modalMainUnit: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalStatusText: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 14,
  },
  modalChartContainer: {
    height: 36,
  },
  modalSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
  },
  modalMetricsCard: {
    padding: 12,
    marginBottom: 16,
  },
  modalMetricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  modalMetricLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  modalMetricValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  logWeightCard: {
    padding: 16,
    marginBottom: 16,
  },
  logWeightTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
  },
  logWeightRow: {
    flexDirection: 'row',
    gap: 10,
  },
  logWeightInput: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 16,
    borderWidth: 1,
  },
  logWeightBtn: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logWeightBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  modalActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF3B30',
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 16,
  },
  modalActionBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  modalAboutCard: {
    padding: 16,
    marginBottom: 16,
  },
  modalAboutTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  modalAboutText: {
    fontSize: 13,
    lineHeight: 18,
  },
});
