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
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ChevronLeft, Plus, Info, Sparkles, Footprints, Moon, Flame } from 'lucide-react-native';
import { RootStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme/useTheme';
import { useDashboardQuery, useTrendsQuery } from '../../api/queries';
import { GlassCard } from '../../components/GlassCard';
import { MiniScoreGauge } from '../../components/MiniScoreGauge';

type Props = NativeStackScreenProps<RootStackParamList, 'Analytics'>;
type TimeRange = 'D' | 'W' | 'M' | '6M' | 'Y';

const { width } = Dimensions.get('window');

export const AnalyticsScreen: React.FC<Props> = ({ navigation }) => {
  const { theme, isDark } = useTheme();
  const [selectedRange, setSelectedRange] = useState<TimeRange>('W');

  const { data: dashboard } = useDashboardQuery();
  const { data: trendsData, isLoading: isTrendsLoading } = useTrendsQuery(
    selectedRange === 'M' || selectedRange === '6M' || selectedRange === 'Y' ? 'month' : 'week'
  );

  const ranges: TimeRange[] = ['D', 'W', 'M', '6M', 'Y'];

  const consumedCalories = dashboard?.summary?.caloriesConsumed ?? 0;
  const targetCalories = dashboard?.goals?.targetCalories ?? 2000;
  const proteinConsumed = dashboard?.summary?.proteinConsumed ?? 0;
  const carbsConsumed = dashboard?.summary?.carbsConsumed ?? 0;
  const fatConsumed = dashboard?.summary?.fatConsumed ?? 0;

  // Dynamic recovery score based on goals achievement
  const calorieScore = targetCalories > 0 ? Math.min(100, Math.round((consumedCalories / targetCalories) * 100)) : 0;
  const overallScore = dashboard?.aiAnalysis?.overallScore ?? (calorieScore > 0 ? Math.min(99, Math.max(70, calorieScore)) : 85);

  const stepHistory = trendsData?.stepHistory || [];
  const sleepHistory = trendsData?.sleepHistory || [];
  const avgSteps = trendsData?.averages?.steps || 0;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Navigation Top Bar: Back, Title, Add */}
        <View style={styles.navBar}>
          <TouchableOpacity
            style={styles.navBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <ChevronLeft color={theme.tabBarActive} size={22} strokeWidth={2.5} />
            <Text style={[styles.navBtnText, { color: theme.tabBarActive }]}>Summary</Text>
          </TouchableOpacity>
          <Text style={[styles.navTitle, { color: theme.textPrimary }]}>
            Nutrition & Biometrics
          </Text>
          <TouchableOpacity
            style={styles.navAddBtn}
            onPress={() => navigation.navigate('Search')}
            activeOpacity={0.7}
          >
            <Plus color={theme.tabBarActive} size={20} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        {/* Range Selector: D W M 6M Y */}
        <View style={[styles.rangeContainer, { backgroundColor: theme.pillBackground }]}>
          {ranges.map((range) => {
            const isSelected = selectedRange === range;
            return (
              <TouchableOpacity
                key={range}
                style={[
                  styles.rangePill,
                  isSelected && {
                    backgroundColor: theme.pillActive,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.12,
                    shadowRadius: 2,
                    elevation: 2,
                  },
                ]}
                onPress={() => setSelectedRange(range)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.rangePillText,
                    {
                      color: isSelected ? theme.pillActiveText : theme.textMuted,
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}
                >
                  {range}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 1. Dedicated Walking Steps & Movement History Card (PostgreSQL) */}
        <GlassCard style={styles.chartCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Footprints color="#FF9500" size={18} strokeWidth={2.5} />
              <Text style={[styles.rangeLabel, { color: '#FF9500', marginBottom: 0 }]}>
                STEPS ACTIVITY (POSTGRESQL HISTORY)
              </Text>
            </View>
            <Text style={[styles.avgStepsBadge, { color: theme.textSecondary }]}>
              Avg: {avgSteps.toLocaleString()} steps/day
            </Text>
          </View>

          <Text style={[styles.rangeValueText, { color: theme.textPrimary }]}>
            {stepHistory.length > 0
              ? `${stepHistory[stepHistory.length - 1].steps.toLocaleString()} steps`
              : `${(dashboard?.steps?.count ?? 0).toLocaleString()} steps`}
          </Text>
          <Text style={[styles.dateSubLabel, { color: theme.textSecondary }]}>
            Daily counts automatically synced from your phone pedometer
          </Text>

          {/* Step History Bar Chart */}
          <View style={styles.chartArea}>
            <View style={[styles.gridLine, { top: '0%', borderColor: theme.separator }]} />
            <View style={[styles.gridLine, { top: '50%', borderColor: theme.separator }]} />

            <View style={styles.chartColumnsRow}>
              {stepHistory.length > 0 ? (
                stepHistory.map((item, i) => {
                  const maxChartSteps = 12000;
                  const barHeightPct = Math.min(100, Math.max(8, (item.steps / maxChartSteps) * 100));
                  const isGoalMet = item.steps >= 10000;

                  return (
                    <View key={i} style={styles.columnContainer}>
                      <View
                        style={[
                          styles.stepHistoryBar,
                          {
                            height: `${barHeightPct}%`,
                            backgroundColor: isGoalMet ? '#34C759' : '#FF9500',
                          },
                        ]}
                      />
                      <Text style={[styles.hourAxisText, { color: theme.textMuted }]}>
                        {item.day || item.date.slice(5)}
                      </Text>
                    </View>
                  );
                })
              ) : (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                  <ActivityIndicator color="#FF9500" />
                </View>
              )}
            </View>
          </View>

          <View style={[styles.chartFooter, { borderTopColor: theme.separator }]}>
            <Text style={[styles.latestText, { color: theme.textSecondary }]}>
              Daily Target:
            </Text>
            <Text style={[styles.latestValText, { color: '#34C759' }]}>
              10,000 steps • 400 active kcal
            </Text>
          </View>
        </GlassCard>

        {/* 2. Sleep & Clinical Rest History Card */}
        {sleepHistory.length > 0 && (
          <GlassCard style={styles.chartCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <Moon color="#5856D6" size={18} strokeWidth={2.5} />
              <Text style={[styles.rangeLabel, { color: '#5856D6', marginBottom: 0 }]}>
                SLEEP & RECOVERY (CLINICAL SCORE)
              </Text>
            </View>

            <View style={styles.sleepHistoryGrid}>
              {sleepHistory.slice(-5).map((slp, idx) => (
                <View key={idx} style={[styles.sleepHistoryItem, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' }]}>
                  <Text style={[styles.sleepItemDay, { color: theme.textPrimary }]}>{slp.day}</Text>
                  <Text style={[styles.sleepItemHours, { color: '#5856D6' }]}>
                    {slp.hours > 0 ? `${slp.hours}h` : '–'}
                  </Text>
                  <Text style={[styles.sleepItemScore, { color: slp.score >= 75 ? '#34C759' : theme.textMuted }]}>
                    {slp.score > 0 ? `${slp.score} pts` : 'No log'}
                  </Text>
                </View>
              ))}
            </View>
          </GlassCard>
        )}

        {/* 3. Nutrition & Biomarkers Score Breakdown */}
        <GlassCard style={styles.scoreBreakdownCard}>
          <View style={styles.scoreHeaderRow}>
            <MiniScoreGauge score={overallScore} size={64} strokeWidth={7} />
            <View style={styles.scoreHeaderContent}>
              <Text style={[styles.scoreTitle, { color: theme.textPrimary }]}>
                {overallScore >= 80 ? 'Optimal Status' : 'Moderate Balance'}
              </Text>
              <Text style={[styles.scoreSubtitle, { color: theme.textSecondary }]}>
                {dashboard?.aiAnalysis?.summary || 'Metabolic rate and daily nutrition alignment from your personal biometrics.'}
              </Text>
            </View>
          </View>

          {/* Metric Sub-bars */}
          <View style={styles.metricsList}>
            {[
              {
                label: `• Protein Goal: ${Math.round(proteinConsumed)}g / ${dashboard?.goals?.targetProtein ?? 150}g`,
                score: `${Math.min(100, Math.round((proteinConsumed / (dashboard?.goals?.targetProtein || 150)) * 100))}%`,
                pct: Math.min(100, Math.round((proteinConsumed / (dashboard?.goals?.targetProtein || 150)) * 100)),
                color: '#30D158',
              },
              {
                label: `• Carbs Goal: ${Math.round(carbsConsumed)}g / ${dashboard?.goals?.targetCarbs ?? 200}g`,
                score: `${Math.min(100, Math.round((carbsConsumed / (dashboard?.goals?.targetCarbs || 200)) * 100))}%`,
                pct: Math.min(100, Math.round((carbsConsumed / (dashboard?.goals?.targetCarbs || 200)) * 100)),
                color: '#FF9500',
              },
              {
                label: `• Hydration: ${dashboard?.summary?.waterConsumed ?? 0}ml / ${dashboard?.goals?.targetWater ?? 2500}ml`,
                score: `${Math.min(100, Math.round(((dashboard?.summary?.waterConsumed ?? 0) / (dashboard?.goals?.targetWater || 2500)) * 100))}%`,
                pct: Math.min(100, Math.round(((dashboard?.summary?.waterConsumed ?? 0) / (dashboard?.goals?.targetWater || 2500)) * 100)),
                color: '#007AFF',
              },
            ].map((item, idx) => (
              <View key={idx} style={styles.metricItem}>
                <View style={styles.metricItemTop}>
                  <Text style={[styles.metricItemLabel, { color: theme.textPrimary }]}>
                    {item.label}
                  </Text>
                  <Text style={[styles.metricItemScore, { color: theme.textSecondary }]}>
                    {item.score}
                  </Text>
                </View>
                <View style={[styles.subBarBg, { backgroundColor: isDark ? '#2C2C2E' : '#E5E5EA' }]}>
                  <View
                    style={[
                      styles.subBarFill,
                      { width: `${item.pct}%`, backgroundColor: item.color },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>
        </GlassCard>

        {/* AI Smart Advisor Action */}
        <TouchableOpacity
          style={[styles.aiBanner, { backgroundColor: isDark ? 'rgba(255, 59, 48, 0.14)' : '#FFEBEA' }]}
          onPress={() => navigation.navigate('AIInsights')}
          activeOpacity={0.7}
        >
          <Sparkles color="#FF3B30" size={20} strokeWidth={2.2} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.aiBannerTitle, { color: '#FF3B30' }]}>
              AI Clinical Nutritionist Insights
            </Text>
            <Text style={[styles.aiBannerSub, { color: theme.textSecondary }]}>
              View micronutrient deficiencies, food swap recommendations & predictions
            </Text>
          </View>
        </TouchableOpacity>

        {/* About Section */}
        <GlassCard style={styles.aboutCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Info color={theme.tabBarActive} size={18} strokeWidth={2.2} />
            <Text style={[styles.aboutTitle, { color: theme.textPrimary }]}>
              About Step Tracking & PostgreSQL Persistence
            </Text>
          </View>
          <Text style={[styles.aboutText, { color: theme.textSecondary }]}>
            Calora reads motion sensors in real time to calculate footsteps, distance, and active calorie burn. Every stride automatically updates your daily record in the PostgreSQL database, preserving past days' history for long-term health trends.
          </Text>
        </GlassCard>

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
    paddingTop: Platform.OS === 'ios' ? 10 : 14,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: -6,
  },
  navBtnText: {
    fontSize: 17,
    fontWeight: '500',
  },
  navTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  navAddBtn: {
    padding: 4,
  },
  rangeContainer: {
    flexDirection: 'row',
    borderRadius: 9,
    padding: 2,
    marginBottom: 16,
  },
  rangePill: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rangePillText: {
    fontSize: 13,
  },
  chartCard: {
    padding: 16,
    marginBottom: 16,
  },
  rangeLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  avgStepsBadge: {
    fontSize: 12,
    fontWeight: '600',
  },
  rangeValueText: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  dateSubLabel: {
    fontSize: 13,
    marginTop: 2,
    marginBottom: 16,
  },
  chartArea: {
    height: 130,
    position: 'relative',
    justifyContent: 'flex-end',
    marginBottom: 12,
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  chartColumnsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: '100%',
    paddingHorizontal: 4,
  },
  columnContainer: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
    width: 38,
  },
  stepHistoryBar: {
    width: 14,
    borderRadius: 6,
  },
  hourAxisText: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
  },
  chartFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 10,
    marginTop: 6,
  },
  latestText: {
    fontSize: 13,
  },
  latestValText: {
    fontSize: 13,
    fontWeight: '700',
  },
  sleepHistoryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
    marginTop: 8,
  },
  sleepHistoryItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  sleepItemDay: {
    fontSize: 12,
    fontWeight: '600',
  },
  sleepItemHours: {
    fontSize: 14,
    fontWeight: '800',
    marginVertical: 2,
  },
  sleepItemScore: {
    fontSize: 10,
    fontWeight: '600',
  },
  scoreBreakdownCard: {
    padding: 16,
    marginBottom: 16,
  },
  scoreHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  scoreHeaderContent: {
    flex: 1,
  },
  scoreTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  scoreSubtitle: {
    fontSize: 13,
    marginTop: 2,
    lineHeight: 18,
  },
  metricsList: {
    gap: 12,
  },
  metricItem: {
    gap: 6,
  },
  metricItemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricItemLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  metricItemScore: {
    fontSize: 13,
    fontWeight: '700',
  },
  subBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  subBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  aiBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    marginBottom: 16,
  },
  aiBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  aiBannerSub: {
    fontSize: 12,
    marginTop: 2,
  },
  aboutCard: {
    padding: 16,
    marginBottom: 16,
  },
  aboutTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  aboutText: {
    fontSize: 13,
    lineHeight: 19,
  },
});
