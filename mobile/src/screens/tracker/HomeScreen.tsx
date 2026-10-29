import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  Platform,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Flame,
  Footprints,
  Utensils,
  Droplets,
  Moon,
  Zap,
  Plus,
  Trash2,
  X,
  Bed,
  Clock,
  Sparkles,
  Play,
  Square,
  Calendar,
  TrendingUp,
  Activity,
} from 'lucide-react-native';
import { RootStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme/useTheme';
import { useAppSelector } from '../../redux/hooks';
import {
  useDashboardQuery,
  useLogWaterMutation,
  useDeleteMealMutation,
  useLogSleepMutation,
  useLogStepsMutation,
  useStepHistoryQuery,
} from '../../api/queries';
import { AppleHealthHeader } from '../../components/AppleHealthHeader';
import { AppleHealthMetricCard } from '../../components/AppleHealthMetricCard';
import { ProgressRing } from '../../components/ProgressRing';
import { MiniSparkline } from '../../components/MiniSparkline';
import { MiniScoreGauge } from '../../components/MiniScoreGauge';
import { GlassCard } from '../../components/GlassCard';
import { usePedometer } from '../../hooks/usePedometer';
import { WalkRunTracker } from '../../components/WalkRunTracker';

export const HomeScreen = ({ navigation }: any) => {
  const { theme, isDark } = useTheme();
  const user = useAppSelector((state) => state.auth.user);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch real live daily dashboard from backend & PostgreSQL DB
  const { data: dashboard, isLoading, refetch } = useDashboardQuery();
  const { data: stepHistoryData, refetch: refetchStepHistory } = useStepHistoryQuery(7);
  const logWaterMutation = useLogWaterMutation();
  const deleteMealMutation = useDeleteMealMutation();
  const logSleepMutation = useLogSleepMutation();
  const logStepsMutation = useLogStepsMutation();

  // Sleep Logging Modal State
  const [sleepModalVisible, setSleepModalVisible] = useState(false);
  const [sleepHoursInput, setSleepHoursInput] = useState('7.5');

  // Steps Activity & History Modal State
  const [stepsModalVisible, setStepsModalVisible] = useState(false);

  // Real-time Phone Hardware Step Counter & Auto-Sync
  const dbSteps = dashboard?.steps?.count ?? 0;
  const {
    totalSteps,
    burnedCalories: stepsBurnedCalories,
    distanceKm,
    isSensorTracking,
  } = usePedometer(dbSteps);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetch(), refetchStepHistory()]);
    setRefreshing(false);
  };

  // Real Database Metrics & Goals
  const consumedCalories = dashboard?.summary?.caloriesConsumed ?? 0;
  const targetCalories = dashboard?.goals?.targetCalories ?? user?.goals?.targetCalories ?? 2000;
  const calRemaining = dashboard?.summary?.caloriesRemaining ?? Math.max(0, targetCalories - consumedCalories);

  const proteinConsumed = dashboard?.summary?.proteinConsumed ?? 0;
  const proteinTarget = dashboard?.goals?.targetProtein ?? user?.goals?.targetProtein ?? 150;

  const carbsConsumed = dashboard?.summary?.carbsConsumed ?? 0;
  const carbsTarget = dashboard?.goals?.targetCarbs ?? user?.goals?.targetCarbs ?? 200;

  const fatConsumed = dashboard?.summary?.fatConsumed ?? 0;
  const fatTarget = dashboard?.goals?.targetFat ?? user?.goals?.targetFat ?? 65;

  const waterConsumed = dashboard?.summary?.waterConsumed ?? 0;
  const waterTarget = dashboard?.goals?.targetWater ?? user?.goals?.targetWater ?? 2500;

  // Real activity calculations
  const activeBurnedCalories = stepsBurnedCalories || (dashboard?.steps?.burnedCalories ?? 0);
  const moveGoal = 400; // 400 active kcal move goal
  const exerciseMinutes = Math.max(0, Math.round(totalSteps / 100)); // ~100 steps per min active movement — an estimate, not a sensor reading
  const exerciseGoal = 30; // 30 min daily exercise goal
  const stepsGoal = 10000;
  // NOTE: stand hours were previously derived from the clock
  // (current hour - 6), not from any sensor, so they were fake.
  // The third ring now shows real step-goal progress instead.

  // Sleep Data from DB
  const sleepData = dashboard?.sleep;
  const hasSleepLogged = sleepData && sleepData.score !== null && sleepData.score !== undefined;
  const sleepScore = hasSleepLogged ? sleepData.score! : null;
  const sleepHours = sleepData?.hours ?? 0;

  const handleSaveSleep = async () => {
    const hours = parseFloat(sleepHoursInput);
    if (isNaN(hours) || hours <= 0 || hours > 24) {
      Alert.alert('Invalid Hours', 'Please enter a valid number of sleep hours (e.g. 7.5)');
      return;
    }

    try {
      await logSleepMutation.mutateAsync({ hours });
      setSleepModalVisible(false);
      Alert.alert('Sleep Logged! 🌙', `Saved ${hours}h sleep!`);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Could not save sleep hours.');
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.tabBarActive}
          />
        }
      >
        {/* Top Header: Date, Summary Title & Profile Avatar */}
        <AppleHealthHeader
          userName={user?.name || dashboard?.user?.name || 'SnapCalora Member'}
          showEdit={true}
          onEditPress={() => navigation.navigate('ProfileTab')}
          onProfilePress={() => navigation.navigate('ProfileTab')}
        />

        {/* 1. Activity Metric Card (Move / Exercise / Steps goal) - Live Motion & DB */}
        <AppleHealthMetricCard
          icon={<Flame color="#FF3B30" size={18} strokeWidth={2.5} />}
          categoryTitle="Activity"
          categoryColor="#FF3B30"
          timestamp={new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          mainValue={`${Math.round(activeBurnedCalories)}`}
          mainUnit="cal"
          subMetrics={[
            { label: 'Move', value: `${Math.round(activeBurnedCalories)} cal`, color: '#FF3B30' },
            { label: 'Exercise', value: `${exerciseMinutes} min (est.)`, color: '#34C759' },
            { label: 'Steps goal', value: `${Math.min(100, Math.round((totalSteps / stepsGoal) * 100))}%`, color: '#007AFF' },
          ]}
          rightElement={
            <ProgressRing
              size={54}
              strokeWidth={5}
              calorieProgress={moveGoal > 0 ? activeBurnedCalories / moveGoal : 0}
              proteinProgress={exerciseGoal > 0 ? exerciseMinutes / exerciseGoal : 0}
              carbsProgress={stepsGoal > 0 ? totalSteps / stepsGoal : 0}
              showCenterText={false}
              isActivityRing={true}
            />
          }
          onPress={() => navigation.navigate('AnalyticsTab')}
        />

        {/* 2. Steps Metric Card (Real-Time Motion Sensor Tracking) */}
        <AppleHealthMetricCard
          icon={<Footprints color="#FF9500" size={18} strokeWidth={2.5} />}
          categoryTitle="Steps"
          categoryColor="#FF9500"
          timestamp={isSensorTracking ? "Live Sensor" : "Today"}
          mainValue={totalSteps.toLocaleString()}
          mainUnit="steps"
          statusLabel={`Goal: ${stepsGoal.toLocaleString()} • ${stepsBurnedCalories} kcal • ${distanceKm} km`}
          rightElement={
            <View style={{ alignItems: 'center' }}>
              <MiniSparkline
                data={[20, 35, 60, 45, 80, 55, 90, 75, 85, 100, 70, Math.min(100, Math.round((totalSteps / stepsGoal) * 100))]}
                barColor="#FF9500"
              />
            </View>
          }
          onPress={() => setStepsModalVisible(true)}
        />

        {/* 2b. Walk / Run session tracker — explicit Start Walk / Start Run.
            Daily steps above are foreground-only on Android (Expo pedometer
            does not deliver updates in the background); this card makes
            that limit visible and gives the user a session to track. */}
        <WalkRunTracker />

        {/* 3. Nutrition & Macro Target Card - Live from DB */}
        <AppleHealthMetricCard
          icon={<Utensils color="#34C759" size={18} strokeWidth={2.5} />}
          categoryTitle="Nutrition & Macros"
          categoryColor="#34C759"
          timestamp="Today"
          mainValue={`${Math.round(calRemaining)}`}
          mainUnit="kcal left"
          subMetrics={[
            {
              label: 'Protein',
              value: `${Math.round(proteinConsumed)}g / ${proteinTarget}g`,
              color: '#34C759',
            },
            {
              label: 'Carbs',
              value: `${Math.round(carbsConsumed)}g / ${carbsTarget}g`,
              color: '#FF9500',
            },
            {
              label: 'Fat',
              value: `${Math.round(fatConsumed)}g / ${fatTarget}g`,
              color: '#AF52DE',
            },
          ]}
          rightElement={
            <ProgressRing
              size={64}
              strokeWidth={6}
              calorieProgress={targetCalories > 0 ? consumedCalories / targetCalories : 0}
              proteinProgress={proteinTarget > 0 ? proteinConsumed / proteinTarget : 0}
              carbsProgress={carbsTarget > 0 ? carbsConsumed / carbsTarget : 0}
              fatProgress={fatTarget > 0 ? fatConsumed / fatTarget : 0}
              showCenterText={false}
            />
          }
          onPress={() => navigation.navigate('AnalyticsTab')}
        />

        {/* 4. Water Hydration Card - Live from DB */}
        <AppleHealthMetricCard
          icon={<Droplets color="#007AFF" size={18} strokeWidth={2.5} />}
          categoryTitle="Water"
          categoryColor="#007AFF"
          timestamp="Today"
          mainValue={`${waterConsumed}`}
          mainUnit={`/ ${waterTarget} ml`}
          statusLabel={
            waterConsumed >= waterTarget
              ? 'Target Reached! 💧'
              : `${Math.max(0, waterTarget - waterConsumed)} ml remaining`
          }
          statusColor="#007AFF"
          rightElement={
            <TouchableOpacity
              style={styles.waterQuickAddBtn}
              onPress={() => logWaterMutation.mutate({ amount: 250 })}
              activeOpacity={0.7}
              disabled={logWaterMutation.isPending}
            >
              {logWaterMutation.isPending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Plus color="#FFFFFF" size={14} strokeWidth={3} />
                  <Text style={styles.waterQuickAddText}>+250ml</Text>
                </>
              )}
            </TouchableOpacity>
          }
          onPress={() => navigation.navigate('AnalyticsTab')}
        />

        {dashboard?.mealSections && (
          <GlassCard style={styles.mealsCard}>
            <View style={styles.mealsHeader}>
              <Text style={[styles.mealsTitle, { color: theme.textPrimary }]}>Meals Logged Today</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('SearchTab')}
                style={styles.logFoodBtn}
                activeOpacity={0.7}
              >
                <Plus color="#007AFF" size={16} strokeWidth={2.5} />
                <Text style={styles.logFoodBtnText}>Log Food</Text>
              </TouchableOpacity>
            </View>

            {Object.entries(dashboard.mealSections).map(([type, sec]) => {
              if (sec.items.length === 0) return null;
              return (
                <View key={type} style={styles.mealSectionBlock}>
                  <View style={styles.mealSectionTitleRow}>
                    <Text style={[styles.mealSectionTitle, { color: theme.textPrimary }]}>
                      {type}
                    </Text>
                    <Text style={[styles.mealSectionCals, { color: theme.textSecondary }]}>
                      {Math.round(sec.calories)} kcal
                    </Text>
                  </View>

                  {sec.items.map((log) => (
                    <View key={log.id} style={styles.mealItemRow}>
                      <View style={styles.mealItemInfo}>
                        <Text style={[styles.mealFoodName, { color: theme.textPrimary }]}>
                          {log.food?.name || 'Meal Entry'}
                        </Text>
                        <Text style={[styles.mealFoodSub, { color: theme.textMuted }]}>
                          {log.quantity}x serving • {Math.round(log.protein)}g P • {Math.round(log.carbs)}g C • {Math.round(log.fat)}g F
                        </Text>
                      </View>
                      <View style={styles.mealItemRight}>
                        <Text style={[styles.mealItemCals, { color: '#FF3B30' }]}>
                          {Math.round(log.calories)} cal
                        </Text>
                        <TouchableOpacity
                          onPress={() => deleteMealMutation.mutate(log.id)}
                          style={styles.deleteBtn}
                          activeOpacity={0.7}
                        >
                          <Trash2 color={theme.textMuted} size={14} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              );
            })}

            {/* If no meals logged today yet */}
            {consumedCalories === 0 && (
              <View style={styles.emptyMealsNotice}>
                <Text style={[styles.emptyMealsText, { color: theme.textMuted }]}>
                  No meals logged today yet. Tap "Log Food" or use the Camera scanner!
                </Text>
              </View>
            )}
          </GlassCard>
        )}

        {/* 6. Sleep & Recovery Score Card - Live from DB & Interactive */}
        <AppleHealthMetricCard
          icon={<Moon color="#5856D6" size={18} strokeWidth={2.5} />}
          categoryTitle="Sleep Score"
          categoryColor="#5856D6"
          timestamp={hasSleepLogged ? `${sleepHours}h Logged` : "Not Logged"}
          mainValue={
            hasSleepLogged
              ? (sleepScore! >= 90 ? "Very High" : sleepScore! >= 75 ? "Optimal" : sleepScore! >= 60 ? "Moderate" : "Low")
              : "Tap to Log"
          }
          statusLabel={
            hasSleepLogged
              ? `${sleepScore} points • ${sleepData?.status || 'Restorative Sleep'}`
              : "Enter sleep hours to compute score"
          }
          statusColor={hasSleepLogged && sleepScore! >= 75 ? "#34C759" : "#5856D6"}
          rightElement={
            hasSleepLogged ? (
              <MiniScoreGauge score={sleepScore!} size={48} />
            ) : (
              <View style={styles.sleepLogPromptBtn}>
                <Plus color="#FFFFFF" size={14} strokeWidth={3} />
                <Text style={styles.sleepLogPromptText}>Log</Text>
              </View>
            )
          }
          onPress={() => setSleepModalVisible(true)}
        />

        {/* 7. Walking Steadiness / Vitals */}
        <AppleHealthMetricCard
          icon={<Zap color="#FF9500" size={18} strokeWidth={2.5} />}
          categoryTitle="Walking Steadiness"
          categoryColor="#FF9500"
          timestamp="Not measured"
          mainValue="—"
          statusLabel="Not measured yet — no stride sensor data is collected"
          statusColor={theme.textMuted}
          rightElement={
            <View style={[styles.okBadge, { backgroundColor: isDark ? '#2C2C2E' : '#E5E5EA' }]}>
              <Text style={[styles.okBadgeText, { color: theme.textMuted }]}>Not measured</Text>
            </View>
          }
          onPress={() => navigation.navigate('AnalyticsTab')}
        />

        {/* Bottom Padding for floating tab bar */}
        <View style={{ height: 110 }} />
      </ScrollView>

      {/* Sleep Logging Modal */}
      <Modal
        visible={sleepModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSleepModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
            <View style={styles.modalHeaderRow}>
              <View style={styles.modalTitleBadge}>
                <Moon color="#5856D6" size={20} />
                <Text style={[styles.modalTitleText, { color: theme.textPrimary }]}>
                  Log Sleep Hours
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setSleepModalVisible(false)}
                style={styles.closeBtn}
              >
                <X color={theme.textMuted} size={20} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
              Enter how many hours you slept last night. SnapCalora Ai will calculate your clinical sleep score (0–100) and update your recovery metrics.
            </Text>

            {/* Quick Selector Pills */}
            <Text style={[styles.inputLabel, { color: theme.textMuted }]}>Quick Select</Text>
            <View style={styles.pillsContainer}>
              {['6.0', '7.0', '7.5', '8.0', '8.5', '9.0'].map((val) => (
                <TouchableOpacity
                  key={val}
                  onPress={() => setSleepHoursInput(val)}
                  style={[
                    styles.pillBtn,
                    {
                      backgroundColor:
                        sleepHoursInput === val
                          ? '#5856D6'
                          : isDark
                          ? '#2C2C2E'
                          : '#F2F2F7',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.pillBtnText,
                      { color: sleepHoursInput === val ? '#FFFFFF' : theme.textPrimary },
                    ]}
                  >
                    {val} hrs
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Custom Input */}
            <Text style={[styles.inputLabel, { color: theme.textMuted, marginTop: 16 }]}>
              Exact Hours Slept
            </Text>
            <View style={[styles.inputWrapper, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' }]}>
              <Bed color="#5856D6" size={18} style={{ marginRight: 8 }} />
              <TextInput
                value={sleepHoursInput}
                onChangeText={setSleepHoursInput}
                keyboardType="decimal-pad"
                placeholder="e.g. 7.5"
                placeholderTextColor={theme.textMuted}
                style={[styles.numericInput, { color: theme.textPrimary }]}
              />
              <Text style={{ color: theme.textMuted, fontWeight: '600' }}>hours</Text>
            </View>

            {/* Save Button */}
            <TouchableOpacity
              onPress={handleSaveSleep}
              disabled={logSleepMutation.isPending}
              style={[styles.saveSleepBtn, { backgroundColor: '#5856D6' }]}
              activeOpacity={0.8}
            >
              {logSleepMutation.isPending ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Sparkles color="#FFFFFF" size={18} style={{ marginRight: 6 }} />
                  <Text style={styles.saveSleepBtnText}>Save Sleep Entry</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Steps Live Pedometer & Previous Days History Modal */}
      <Modal
        visible={stepsModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setStepsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF', maxHeight: '85%' }]}>
            {/* Header */}
            <View style={styles.modalHeaderRow}>
              <View style={styles.modalTitleBadge}>
                <Footprints color="#FF9500" size={22} strokeWidth={2.5} />
                <Text style={[styles.modalTitleText, { color: theme.textPrimary }]}>
                  Step Tracker & History
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setStepsModalVisible(false)}
                style={styles.closeBtn}
              >
                <X color={theme.textMuted} size={20} />
              </TouchableOpacity>
            </View>

            {/* Live Motion Sensor Status Card */}
            <GlassCard style={styles.pedometerStatusCard}>
              <View style={styles.pedometerStatusRow}>
                <View style={styles.livePulseContainer}>
                  <View style={[styles.pulseDot, { backgroundColor: isSensorTracking ? '#34C759' : '#FF9500' }]} />
                  <Text style={[styles.pulseText, { color: isSensorTracking ? '#34C759' : '#FF9500' }]}>
                    {isSensorTracking ? 'Live Motion Sensor Active' : 'Motion Sensor Active'}
                  </Text>
                </View>
                <View style={[styles.sensorActivePill, { backgroundColor: 'rgba(52, 199, 89, 0.12)' }]}>
                  <Activity color="#34C759" size={13} strokeWidth={2.2} style={{ marginRight: 4 }} />
                  <Text style={{ color: '#34C759', fontSize: 11, fontWeight: '700' }}>Auto-Tracking</Text>
                </View>
              </View>

              {/* Today's Step Hero Number */}
              <View style={styles.stepHeroBlock}>
                <Text style={[styles.stepHeroNumber, { color: theme.textPrimary }]}>
                  {totalSteps.toLocaleString()}
                </Text>
                <Text style={[styles.stepHeroUnit, { color: '#FF9500' }]}>steps today</Text>
              </View>

              {/* Metric Breakdown */}
              <View style={styles.stepMetricsGrid}>
                <View style={styles.stepMetricCol}>
                  <Text style={[styles.stepMetricValue, { color: theme.textPrimary }]}>
                    {stepsBurnedCalories} <Text style={{ fontSize: 12, color: theme.textMuted }}>kcal</Text>
                  </Text>
                  <Text style={[styles.stepMetricLabel, { color: theme.textMuted }]}>Calories</Text>
                </View>
                <View style={[styles.metricDivider, { backgroundColor: theme.separator }]} />
                <View style={styles.stepMetricCol}>
                  <Text style={[styles.stepMetricValue, { color: theme.textPrimary }]}>
                    {distanceKm} <Text style={{ fontSize: 12, color: theme.textMuted }}>km</Text>
                  </Text>
                  <Text style={[styles.stepMetricLabel, { color: theme.textMuted }]}>Distance</Text>
                </View>
                <View style={[styles.metricDivider, { backgroundColor: theme.separator }]} />
                <View style={styles.stepMetricCol}>
                  <Text style={[styles.stepMetricValue, { color: '#34C759' }]}>
                    {Math.min(100, Math.round((totalSteps / stepsGoal) * 100))}%
                  </Text>
                  <Text style={[styles.stepMetricLabel, { color: theme.textMuted }]}>Goal (10k)</Text>
                </View>
              </View>
            </GlassCard>

            {/* Section Header: Past Days History */}
            <View style={{ marginTop: 14, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={[styles.historyListTitle, { color: theme.textMuted, marginBottom: 0 }]}>
                PAST 7 DAYS ACTIVITY
              </Text>
              <Text style={{ fontSize: 11, fontWeight: '600', color: theme.textMuted }}>
                Previous Walks
              </Text>
            </View>

            {/* Previous Days History List */}
            <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
              {stepHistoryData?.stepHistory && stepHistoryData.stepHistory.length > 0 ? (
                stepHistoryData.stepHistory
                  .slice()
                  .reverse()
                  .map((item, idx) => {
                    const isToday = idx === 0;
                    const displaySteps = isToday ? Math.max(item.steps, totalSteps) : item.steps;
                    const displayCals = isToday ? Math.max(item.burnedCalories, stepsBurnedCalories) : item.burnedCalories;
                    const progressPct = Math.min(100, Math.round((displaySteps / 10000) * 100));

                    return (
                      <GlassCard key={`history-${idx}`} style={[styles.historyRowCard, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' }]}>
                        <View style={styles.historyRowTop}>
                          <View>
                            <Text style={[styles.historyDayText, { color: theme.textPrimary }]}>
                              {isToday ? 'Today' : `${item.day} • ${item.date}`}
                            </Text>
                            <Text style={[styles.historySubText, { color: theme.textMuted }]}>
                              {displayCals} kcal burned
                            </Text>
                          </View>
                          <View style={{ alignItems: 'flex-end' }}>
                            <Text style={[styles.historyStepCount, { color: '#FF9500' }]}>
                              {displaySteps.toLocaleString()} <Text style={{ fontSize: 13, color: theme.textMuted }}>steps</Text>
                            </Text>
                            {displaySteps >= 10000 && (
                              <Text style={styles.goalAchievedBadge}>✓ Goal Reached</Text>
                            )}
                          </View>
                        </View>

                        {/* Progress Bar */}
                        <View style={[styles.historyProgressBarBg, { backgroundColor: isDark ? '#3A3A3C' : '#E5E5EA' }]}>
                          <View
                            style={[
                              styles.historyProgressBarFill,
                              {
                                width: `${progressPct}%`,
                                backgroundColor: displaySteps >= 10000 ? '#34C759' : '#FF9500',
                              },
                            ]}
                          />
                        </View>
                      </GlassCard>
                    );
                  })
              ) : (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <ActivityIndicator color="#FF9500" />
                  <Text style={{ color: theme.textMuted, marginTop: 8 }}>Loading step records...</Text>
                </View>
              )}
            </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 8 : 4,
    paddingBottom: 24,
  },
  waterQuickAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  waterQuickAddText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  sleepLogPromptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#5856D6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  sleepLogPromptText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  mealsCard: {
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
  },
  mealsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  mealsTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  logFoodBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  logFoodBtnText: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  mealSectionBlock: {
    marginBottom: 12,
  },
  mealSectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  mealSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  mealSectionCals: {
    fontSize: 12,
    fontWeight: '600',
  },
  mealItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150, 150, 150, 0.2)',
  },
  mealItemInfo: {
    flex: 1,
    paddingRight: 8,
  },
  mealFoodName: {
    fontSize: 14,
    fontWeight: '600',
  },
  mealFoodSub: {
    fontSize: 11,
    marginTop: 2,
  },
  mealItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealItemCals: {
    fontSize: 13,
    fontWeight: '700',
    marginRight: 8,
  },
  deleteBtn: {
    padding: 4,
  },
  emptyMealsNotice: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  emptyMealsText: {
    fontSize: 13,
    textAlign: 'center',
  },
  okBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  okBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 28,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitleText: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
  },
  closeBtn: {
    padding: 4,
  },
  pedometerStatusCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 14,
  },
  pedometerStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  livePulseContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  pulseText: {
    fontSize: 12,
    fontWeight: '700',
  },
  sensorActivePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  stepHeroBlock: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginVertical: 6,
  },
  stepHeroNumber: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  stepHeroUnit: {
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 8,
  },
  stepMetricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150, 150, 150, 0.2)',
  },
  stepMetricCol: {
    flex: 1,
    alignItems: 'center',
  },
  metricDivider: {
    width: 1,
    height: 24,
  },
  stepMetricValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  stepMetricLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  historyListTitle: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  historyRowCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  historyRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyDayText: {
    fontSize: 14,
    fontWeight: '700',
  },
  historySubText: {
    fontSize: 11,
    marginTop: 2,
  },
  historyStepCount: {
    fontSize: 16,
    fontWeight: '800',
  },
  goalAchievedBadge: {
    color: '#34C759',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  historyProgressBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  historyProgressBarFill: {
    height: 6,
    borderRadius: 3,
  },
  modalSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  pillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pillBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
  },
  pillBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 20,
  },
  numericInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
  },
  saveSleepBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
  },
  saveSleepBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
