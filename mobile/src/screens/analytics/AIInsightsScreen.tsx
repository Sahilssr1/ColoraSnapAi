import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { useDashboardQuery } from '../../api/queries';
import { GlassCard } from '../../components/GlassCard';
import { MicronutrientGrid } from '../../components/MicronutrientGrid';
import { Colors } from '../../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'AIInsights'>;

export const AIInsightsScreen: React.FC<Props> = ({ navigation }) => {
  const { data: dashboard } = useDashboardQuery();
  const ai = dashboard?.aiAnalysis;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>AI Nutrition Insights</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Score Card */}
        <GlassCard elevated style={styles.scoreCard}>
          <View style={styles.scoreRow}>
            <View>
              <Text style={styles.scoreTitle}>Dietary Quality Score</Text>
              <Text style={styles.scoreSub}>Clinical micronutrient & macro balance</Text>
            </View>
            <View style={styles.scoreCircle}>
              <Text style={styles.scoreNumber}>{ai?.overallScore || 85}</Text>
              <Text style={styles.scoreTotal}>/ 100</Text>
            </View>
          </View>
          <Text style={styles.summaryText}>{ai?.summary}</Text>
        </GlassCard>

        {/* Alerts & Warnings */}
        {ai?.alerts && ai.alerts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dietary Alerts & Flags</Text>
            {ai.alerts.map((alert, idx) => (
              <View
                key={idx}
                style={[
                  styles.alertCard,
                  alert.type === 'DEFICIENCY'
                    ? styles.deficiencyAlert
                    : styles.excessAlert,
                ]}
              >
                <View style={styles.alertHeader}>
                  <Text style={styles.alertTypeBadge}>
                    {alert.type === 'DEFICIENCY' ? 'DEFICIENCY' : 'HIGH INTAKE'}
                  </Text>
                  <Text style={styles.alertNutrient}>{alert.nutrient}</Text>
                </View>
                <Text style={styles.alertMessage}>{alert.message}</Text>
                <Text style={styles.alertRec}>💡 Recommendation: {alert.recommendation}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Smart Whole-Food Swaps */}
        {ai?.suggestedFoodSwaps && ai.suggestedFoodSwaps.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Optimized Food Substitutions</Text>
            {ai.suggestedFoodSwaps.map((swap, idx) => (
              <GlassCard key={idx} style={styles.swapCard}>
                <Text style={styles.swapFrom}>
                  Instead of: <Text style={styles.strikethrough}>{swap.originalFood}</Text>
                </Text>
                <Text style={styles.swapTo}>
                  Choose: <Text style={styles.greenText}>{swap.healthierAlternative}</Text>
                </Text>
                <Text style={styles.swapBenefit}>{swap.benefit}</Text>
              </GlassCard>
            ))}
          </View>
        )}

        {/* Full Micronutrient Breakdown */}
        {ai?.micronutrientBalance && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Micronutrient & Mineral Index</Text>
            <MicronutrientGrid balance={ai.micronutrientBalance} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090A0F',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 36,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#181B26',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  placeholder: {
    width: 40,
  },
  scoreCard: {
    marginBottom: 16,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  scoreTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  scoreSub: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  scoreCircle: {
    backgroundColor: 'rgba(255, 94, 58, 0.15)',
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FF5E3A',
  },
  scoreNumber: {
    color: '#FF5E3A',
    fontSize: 22,
    fontWeight: '900',
  },
  scoreTotal: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '600',
  },
  summaryText: {
    color: '#CBD5E1',
    fontSize: 13,
    lineHeight: 19,
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  alertCard: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
  },
  deficiencyAlert: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  excessAlert: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  alertTypeBadge: {
    color: '#F87171',
    fontSize: 10,
    fontWeight: '800',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  alertNutrient: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  alertMessage: {
    color: '#E2E8F0',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  alertRec: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 6,
    lineHeight: 16,
  },
  swapCard: {
    marginBottom: 10,
  },
  swapFrom: {
    color: '#94A3B8',
    fontSize: 13,
  },
  strikethrough: {
    textDecorationLine: 'line-through',
    color: '#F87171',
    fontWeight: '600',
  },
  swapTo: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
  },
  greenText: {
    color: '#34D399',
  },
  swapBenefit: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 4,
  },
});
