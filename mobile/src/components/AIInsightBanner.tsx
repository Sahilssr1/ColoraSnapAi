import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NutritionAlert } from '../types';
import { Colors } from '../theme/colors';

interface AIInsightBannerProps {
  score: number;
  summary: string;
  alerts: NutritionAlert[];
  swaps: Array<{
    originalFood: string;
    healthierAlternative: string;
    benefit: string;
  }>;
  onPressDetails?: () => void;
}

export const AIInsightBanner: React.FC<AIInsightBannerProps> = ({
  score,
  summary,
  alerts,
  swaps,
  onPressDetails,
}) => {
  const topAlert = alerts[0];
  const topSwap = swaps[0];

  return (
    <LinearGradient
      colors={['#1E1528', '#141724']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.sparkle}>✨</Text>
          <Text style={styles.title}>SnapCalora AI Advisor</Text>
        </View>

        <View style={styles.scoreBadge}>
          <Text style={styles.scoreText}>{score} / 100</Text>
        </View>
      </View>

      <Text style={styles.summaryText}>{summary}</Text>

      {topAlert && (
        <View style={styles.alertBox}>
          <Text style={styles.alertIcon}>⚠️</Text>
          <View style={styles.alertContent}>
            <Text style={styles.alertMsg}>{topAlert.message}</Text>
            <Text style={styles.alertRec}>{topAlert.recommendation}</Text>
          </View>
        </View>
      )}

      {topSwap && (
        <View style={styles.swapBox}>
          <Text style={styles.swapBadge}>Smart Food Swap</Text>
          <Text style={styles.swapTitle}>
            Swap <Text style={styles.bold}>{topSwap.originalFood}</Text> for{' '}
            <Text style={styles.greenText}>{topSwap.healthierAlternative}</Text>
          </Text>
          <Text style={styles.swapBenefit}>{topSwap.benefit}</Text>
        </View>
      )}

      {onPressDetails && (
        <TouchableOpacity
          onPress={onPressDetails}
          activeOpacity={0.7}
          style={styles.viewMoreButton}
        >
          <Text style={styles.viewMoreText}>View Full Micronutrient Breakdown →</Text>
        </TouchableOpacity>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    padding: 18,
    marginVertical: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(138, 35, 135, 0.35)',
    shadowColor: '#8A2387',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sparkle: {
    fontSize: 18,
    marginRight: 6,
  },
  title: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  scoreBadge: {
    backgroundColor: 'rgba(255, 94, 58, 0.2)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 94, 58, 0.4)',
  },
  scoreText: {
    color: '#FF5E3A',
    fontSize: 12,
    fontWeight: '700',
  },
  summaryText: {
    color: '#CBD5E1',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  alertBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    marginBottom: 8,
  },
  alertIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  alertContent: {
    flex: 1,
  },
  alertMsg: {
    color: '#FCA5A5',
    fontSize: 12,
    fontWeight: '700',
  },
  alertRec: {
    color: '#E2E8F0',
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  swapBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    marginBottom: 8,
  },
  swapBadge: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  swapTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  bold: {
    fontWeight: '700',
    color: '#F87171',
  },
  greenText: {
    color: '#34D399',
    fontWeight: '700',
  },
  swapBenefit: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 3,
  },
  viewMoreButton: {
    alignItems: 'center',
    paddingTop: 8,
  },
  viewMoreText: {
    color: '#A78BFA',
    fontSize: 12,
    fontWeight: '600',
  },
});
