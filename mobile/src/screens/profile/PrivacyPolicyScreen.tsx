import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme/useTheme';
import { GlassCard } from '../../components/GlassCard';

export const PrivacyPolicyScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { theme, isDark } = useTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { paddingTop: Platform.OS === 'android' ? 16 : 0 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <ChevronLeft color={theme.textPrimary} size={24} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
          Privacy Policy
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <GlassCard style={styles.card}>
          <Text style={[styles.lastUpdated, { color: theme.textMuted }]}>
            Last Updated: August 2026
          </Text>

          <Text style={[styles.heading, { color: theme.textPrimary }]}>
            1. Information We Collect
          </Text>
          <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
            We collect information you provide directly to us, such as when you create or modify your account, use our services to log meals and biometrics, or contact customer support. This may include your name, email address, height, weight, age, and dietary preferences.
          </Text>
          <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
            When you use the AI Food Vision feature, we process the images you capture to analyze nutritional content. We also collect pedometer and step count data from your device's native health API to track your activity.
          </Text>

          <Text style={[styles.heading, { color: theme.textPrimary }]}>
            2. How We Use Information
          </Text>
          <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
            We use the information we collect to:
            {'\n'}• Provide, maintain, and improve our services
            {'\n'}• Calculate personalized nutritional recommendations
            {'\n'}• Monitor and analyze trends, usage, and activities
            {'\n'}• Detect, investigate, and prevent malicious activity
          </Text>

          <Text style={[styles.heading, { color: theme.textPrimary }]}>
            3. Sharing of Information
          </Text>
          <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
            We do not share your personal information with third parties except as described in this policy, such as with vendors, consultants, and other service providers who need access to such information to carry out work on our behalf.
          </Text>

          <Text style={[styles.heading, { color: theme.textPrimary }]}>
            4. Data Security & Account Deletion
          </Text>
          <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
            We take reasonable measures to help protect information about you from loss, theft, misuse and unauthorized access. You have the right to request the permanent deletion of your account and all associated health and dietary data at any time through the Profile settings screen in the app.
          </Text>
        </GlassCard>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    padding: 20,
  },
  lastUpdated: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 20,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heading: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 24,
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 12,
  },
});
