import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Platform, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Info, FileText, Globe } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme/useTheme';
import { GlassCard } from '../../components/GlassCard';

export const AboutScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
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
          About SnapCalora AI
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoContainer}>
          <View style={[styles.logoPlaceholder, { backgroundColor: theme.pillBackground }]}>
            <Text style={[styles.logoText, { color: theme.textPrimary }]}>SC</Text>
          </View>
          <Text style={[styles.appName, { color: theme.textPrimary }]}>
            SnapCalora AI
          </Text>
          <Text style={[styles.version, { color: theme.textMuted }]}>
            Version 1.0.2
          </Text>
        </View>

        <GlassCard style={styles.card}>
          <Text style={[styles.description, { color: theme.textSecondary }]}>
            SnapCalora AI is your intelligent nutrition companion. Using advanced computer vision and machine learning, it instantly identifies foods from your camera to help you seamlessly track calories, macronutrients, and maintain your health goals.
          </Text>
        </GlassCard>

        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
          Legal & Information
        </Text>

        <GlassCard style={styles.linksCard}>
          <TouchableOpacity 
            style={styles.linkRow} 
            onPress={() => navigation.navigate('PrivacyPolicy')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconBox, { backgroundColor: isDark ? '#2C2C2E' : '#E5E5EA' }]}>
              <FileText color={theme.textPrimary} size={18} />
            </View>
            <Text style={[styles.linkText, { color: theme.textPrimary }]}>Privacy Policy</Text>
          </TouchableOpacity>
          
          <View style={[styles.divider, { backgroundColor: theme.separator }]} />

          <TouchableOpacity style={styles.linkRow} activeOpacity={0.7}>
            <View style={[styles.iconBox, { backgroundColor: isDark ? '#2C2C2E' : '#E5E5EA' }]}>
              <Info color={theme.textPrimary} size={18} />
            </View>
            <Text style={[styles.linkText, { color: theme.textPrimary }]}>Terms of Service</Text>
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: theme.separator }]} />

          <TouchableOpacity style={styles.linkRow} activeOpacity={0.7}>
            <View style={[styles.iconBox, { backgroundColor: isDark ? '#2C2C2E' : '#E5E5EA' }]}>
              <Globe color={theme.textPrimary} size={18} />
            </View>
            <Text style={[styles.linkText, { color: theme.textPrimary }]}>Visit Website</Text>
          </TouchableOpacity>
        </GlassCard>

        <View style={styles.footer}>
          <Text style={[styles.copyright, { color: theme.textMuted }]}>
            © 2026 SnapCalora AI. All rights reserved.
          </Text>
        </View>

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
  logoContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 32,
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '800',
  },
  appName: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  version: {
    fontSize: 14,
    marginTop: 4,
  },
  card: {
    padding: 20,
    marginBottom: 24,
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    marginLeft: 4,
  },
  linksCard: {
    padding: 8,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  linkText: {
    fontSize: 16,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    marginLeft: 60,
    marginRight: 16,
  },
  footer: {
    marginTop: 40,
    marginBottom: 20,
    alignItems: 'center',
  },
  copyright: {
    fontSize: 12,
  },
});
