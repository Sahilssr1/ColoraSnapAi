import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Plus, Info, Sparkles, Footprints, Moon, Flame, Utensils } from 'lucide-react-native';
import { useTheme } from '../../theme/useTheme';
import { useDashboardQuery, useTrendsQuery } from '../../api/queries';
import { GlassCard } from '../../components/GlassCard';
import { MiniScoreGauge } from '../../components/MiniScoreGauge';

type TimeRange = 'D' | 'W' | 'M' | '6M' | 'Y';

const { width } = Dimensions.get('window');

export const AnalyticsScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const [selectedRange, setSelectedRange] = useState<TimeRange>('W');

  const periodMap: Record<TimeRange, string> = {
    D: 'day',
    W: 'week',
    M: 'month',
    '6M': '6month',
    Y: 'year',
  };

  const { data: dashboard } = useDashboardQuery();
  const { data: trendsData, isLoading: isTrendsLoading } = useTrendsQuery(periodMap[selectedRange]);

  const ranges: TimeRange[] = ['D', 'W', 'M', '6M', 'Y'];

  const consumedCalories = dashboard?.summary?.caloriesConsumed ?? 0;
  const targetCalories = trendsData?.targetCalories || dashboard?.goals?.targetCalories || 2000;
  const proteinConsumed = dashboard?.summary?.proteinConsumed ?? 0;
  const carbsConsumed = dashboard?.summary?.carbsConsumed ?? 0;
  const fatConsumed = dashboard?.summary?.fatConsumed ?? 0;

  // Dynamic recovery score based on goals achievement
  const calorieScore = targetCalories > 0 ? Math.min(100, Math.round((consumedCalories / targetCalories) * 100)) : 0;
  const overallScore = dashboard?.aiAnalysis?.overallScore ?? (calorieScore > 0 ? Math.min(99, Math.max(70, calorieScore)) : 85);

  const stepHistory = trendsData?.stepHistory || [];
  const dailyTrends = trendsData?.dailyTrends || [];
  const sleepHistory = trendsData?.sleepHistory || [];
  const avgSteps = trendsData?.averages?.steps || 0;
  const avgCalories = trendsData?.averages?.calories || 0;

  const topInset = Math.max(insets.top, Platform.OS === 'android' ? 12 : 8);

  // Dynamic label configs depending on range
  const getRangeConfig = () => {
    switch (selectedRange) {
      case 'D':
        return {
          title: "TODAY'S ACTIVITY",
          subLabel: 'Hourly activity synced from device motion tracking',
          avgLabel: 'Total: ',
          unit: 'steps today',
          barWidth: 18,
          barRadius: 6,
          showAllLabels: true,
        };
      case 'W':
        return {
          title: 'PAST 7 DAYS ACTIVITY',
          subLabel: 'Daily counts automatically synced from your phone pedometer',
          avgLabel: 'Avg: ',
          unit: 'steps/day',
          barWidth: 14,
          barRadius: 5,
          showAllLabels: true,
        };
      case 'M':
        return {
          title: 'PAST 30 DAYS ACTIVITY',
          subLabel: 'Daily walking consistency over the past month',
          avgLabel: 'Avg: ',
          unit: 'steps/day',
          barWidth: 4.5,
          barRadius: 2,
          showAllLabels: false,
        };
      case '6M':
        return {
          title: 'PAST 6 MONTHS ACTIVITY',
          subLabel: 'Monthly walking activity and movement trend',
          avgLabel: 'Avg: ',
          unit: 'steps/day',
          barWidth: 22,
          barRadius: 6,
          showAllLabels: true,
        };
      case 'Y':
        return {
          title: 'PAST 12 MONTHS ACTIVITY',
          subLabel: 'Long-term annual activity and movement trajectory',
          avgLabel: 'Avg: ',
          unit: 'steps/day',
          barWidth: 10,
          barRadius: 4,
          showAllLabels: true,
        };
    }
  };

  const rangeConfig = getRangeConfig();

  // Calculate highest step count for dynamic chart scaling
  const maxStepVal = Math.max(10000, ...stepHistory.map((s) => s.steps));
  const maxChartSteps = Math.max(12000, Math.ceil(maxStepVal / 2000) * 2000);

  // Calculate highest calorie count for calorie chart
  const maxCalVal = Math.max(targetCalories, ...dailyTrends.map((d) => d.calories));
  const maxChartCalories = Math.max(2500, Math.ceil(maxCalVal / 500) * 500);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Safe Area Top Header */}
      <View
        style={[
          styles.headerContainer,
          {
            paddingTop: topInset + 6,
            backgroundColor: theme.background,
          },
        ]}
      >
        <View style={styles.navBar}>
          <TouchableOpacity
            style={styles.navBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
          >
            <ChevronLeft color={theme.tabBarActive} size={24} strokeWidth={2.5} />
            <Text style={[styles.navBtnText, { color: theme.tabBarActive }]}>Summary</Text>
          </TouchableOpacity>
          <Text
            numberOfLines={1}
            style={[styles.navTitle, { color: theme.textPrimary }]}
          >
            Nutrition & Biometrics
          </Text>
          <TouchableOpacity
            style={styles.navAddBtn}
            onPress={() => navigation.navigate('Search')}
            activeOpacity={0.7}
            hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
          >
            <Plus color={theme.tabBarActive} size={22} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
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

        {/* 1. Steps & Walking Activity Card */}
        <GlassCard style={styles.chartCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Footprints color="#FF9500" size={18} strokeWidth={2.5} />
              <Text style={[styles.rangeLabel, { color: '#FF9500', marginBottom: 0 }]}>
                {rangeConfig.title}
              </Text>
            </View>
            <Text style={[styles.avgStepsBadge, { color: theme.textSecondary }]}>
              {rangeConfig.avgLabel}{avgSteps.toLocaleString()} {rangeConfig.unit}
            </Text>
          </View>

          <Text style={[styles.rangeValueText, { color: theme.textPrimary }]}>
            {stepHistory.length > 0
              ? `${stepHistory[stepHistory.length - 1].steps.toLocaleString()} steps`
              : `${(dashboard?.steps?.count ?? 0).toLocaleString()} steps`}
          </Text>
          <Text style={[styles.dateSubLabel, { color: theme.textSecondary }]}>
            {rangeConfig.subLabel}
          </Text>

          {/* Step History Bar Chart */}
          <View style={styles.chartArea}>
            <View style={[styles.gridLine, { top: '0%', borderColor: theme.separator }]} />
            <View style={[styles.gridLine, { top: '50%', borderColor: theme.separator }]} />

            {isTrendsLoading ? (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator color="#FF9500" />
              </View>
            ) : (
              <View style={styles.chartColumnsRow}>
                {stepHistory.map((item, i) => {
                  const barHeightPct = Math.min(100, Math.max(6, (item.steps / maxChartSteps) * 100));
                  const isGoalMet = item.steps >= 10000;

                  // In Month view (30 days), only render key periodic day milestone labels to prevent overlap
                  const showLabel =
                    rangeConfig.showAllLabels ||
                    i === 0 ||
                    i === 7 ||
                    i === 14 ||
                    i === 21 ||
                    i === stepHistory.length - 1;

                  return (
                    <View key={i} style={styles.columnContainer}>
                      <View
                        style={[
                          styles.stepHistoryBar,
                          {
                            width: rangeConfig.barWidth,
                            height: `${barHeightPct}%`,
                            backgroundColor: isGoalMet ? '#34C759' : '#FF9500',
                            borderRadius: rangeConfig.barRadius,
                          },
                        ]}
                      />
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.hourAxisText,
                          {
                            color: showLabel ? theme.textMuted : 'transparent',
                            fontSize: selectedRange === 'Y' ? 9 : 11,
                          },
                        ]}
                      >
                        {showLabel ? item.day : ''}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}
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

        {/* 2. Nutrition & Calorie Intake Trend Card */}
        <GlassCard style={styles.chartCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Flame color="#FF3B30" size={18} strokeWidth={2.5} />
              <Text style={[styles.rangeLabel, { color: '#FF3B30', marginBottom: 0 }]}>
                CALORIE & NUTRITION INTAKE
              </Text>
            </View>
            <Text style={[styles.avgStepsBadge, { color: theme.textSecondary }]}>
              Avg: {Math.round(avgCalories)} kcal/day
            </Text>
          </View>

          <Text style={[styles.rangeValueText, { color: theme.textPrimary }]}>
            {selectedRange === 'D'
              ? `${Math.round(consumedCalories)} kcal`
              : `${Math.round(avgCalories)} kcal avg`}
          </Text>
          <Text style={[styles.dateSubLabel, { color: theme.textSecondary }]}>
            Nutritional intake and target balance across {selectedRange === 'D' ? 'today' : selectedRange === 'W' ? 'the past 7 days' : selectedRange === 'M' ? 'the past 30 days' : selectedRange === '6M' ? 'the past 6 months' : 'the past 12 months'}
          </Text>

          {/* Calorie History Bar Chart */}
          <View style={styles.chartArea}>
            <View style={[styles.gridLine, { top: '0%', borderColor: theme.separator }]} />
            <View style={[styles.gridLine, { top: '50%', borderColor: theme.separator }]} />

            {isTrendsLoading ? (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator color="#FF3B30" />
              </View>
            ) : (
              <View style={styles.chartColumnsRow}>
                {dailyTrends.map((item, i) => {
                  const barHeightPct = Math.min(100, Math.max(6, (item.calories / maxChartCalories) * 100));
                  const isWithinTarget = item.calories <= targetCalories && item.calories > 0;

                  const showLabel =
                    rangeConfig.showAllLabels ||
                    i === 0 ||
                    i === 7 ||
                    i === 14 ||
                    i === 21 ||
                    i === dailyTrends.length - 1;

                  return (
                    <View key={i} style={styles.columnContainer}>
                      <View
                        style={[
                          styles.stepHistoryBar,
                          {
                            width: rangeConfig.barWidth,
                            height: `${barHeightPct}%`,
                            backgroundColor: isWithinTarget ? '#34C759' : '#FF3B30',
                            borderRadius: rangeConfig.barRadius,
                          },
                        ]}
                      />
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.hourAxisText,
                          {
                            color: showLabel ? theme.textMuted : 'transparent',
                            fontSize: selectedRange === 'Y' ? 9 : 11,
                          },
                        ]}
                      >
                        {showLabel ? item.day : ''}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          <View style={[styles.chartFooter, { borderTopColor: theme.separator }]}>
            <Text style={[styles.latestText, { color: theme.textSecondary }]}>
              Target Calorie Goal:
            </Text>
            <Text style={[styles.latestValText, { color: '#FF9500' }]}>
              {targetCalories} kcal / day
            </Text>
          </View>
        </GlassCard>

        {/* 3. Sleep & Clinical Rest History Card */}
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

        {/* 4. Nutrition & Biomarkers Score Breakdown */}
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
              About Step Tracking & Activity
            </Text>
          </View>
          <Text style={[styles.aboutText, { color: theme.textSecondary }]}>
            SnapCalora Ai reads your device motion sensors in real time to calculate footsteps, distance, and active calorie burn throughout the day, preserving your past activity trends for long-term health tracking.
          </Text>
        </GlassCard>

        <View style={{ height: 110 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    zIndex: 10,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingRight: 8,
    marginLeft: -4,
  },
  navBtnText: {
    fontSize: 17,
    fontWeight: '600',
    marginLeft: 2,
  },
  navTitle: {
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    flexShrink: 1,
  },
  navAddBtn: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
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
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: '100%',
    paddingHorizontal: 2,
  },
  columnContainer: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  stepHistoryBar: {
    width: 14,
    borderRadius: 6,
  },
  hourAxisText: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
    height: 16,
    textAlign: 'center',
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
