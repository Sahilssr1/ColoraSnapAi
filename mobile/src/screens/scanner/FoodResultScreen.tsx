import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { Button } from '../../components/Button';
import { GlassCard } from '../../components/GlassCard';
import { Colors } from '../../theme/colors';
import { useLogMealMutation } from '../../api/queries';

type Props = NativeStackScreenProps<RootStackParamList, 'FoodResult'>;

export const FoodResultScreen: React.FC<Props> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, Platform.OS === 'android' ? 12 : 8);
  const { scanResult, mealType } = route.params;
  const [multiplier, setMultiplier] = useState(1.0);
  const logMealMutation = useLogMealMutation();

  const food = scanResult.primaryFood;
  const foodId = scanResult.savedFoodId || food.id;

  const currentCalories = Math.round(food.calories * multiplier);
  const currentProtein = (food.protein * multiplier).toFixed(1);
  const currentCarbs = (food.carbs * multiplier).toFixed(1);
  const currentFat = (food.fat * multiplier).toFixed(1);
  const currentFiber = (food.fiber * multiplier).toFixed(1);
  const currentSugar = (food.sugar * multiplier).toFixed(1);

  const confidencePct = Math.round((scanResult.overallConfidence || 0.9) * 100);

  const handleLogMeal = async () => {
    try {
      await logMealMutation.mutateAsync({
        foodId,
        mealType,
        quantity: multiplier,
      });

      Alert.alert('Meal Logged! 🎉', `${food.name} added to your ${mealType.toLowerCase()}.`, [
        {
          text: 'View Dashboard',
          onPress: () => navigation.navigate('MainTabs'),
        },
      ]);
    } catch (err: any) {
      Alert.alert('Error', 'Could not log meal. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: topInset + 8 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header */}
        <View style={styles.topHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.screenTitle}>AI Scan Result</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Plate Card */}
        <GlassCard elevated style={styles.mainCard}>
          <View style={styles.cardHeader}>
            <View style={styles.plateInfo}>
              <Text style={styles.plateTitle}>{scanResult.identifiedPlateName || food.name}</Text>
              <Text style={styles.portionInfo}>
                {Math.round(food.servingSize * multiplier)} {food.servingUnit}
              </Text>
            </View>

            <View style={styles.confidenceBadge}>
              <Text style={styles.confidenceText}>{confidencePct}% Match</Text>
            </View>
          </View>

          {/* Calorie Large Counter */}
          <View style={styles.calorieRow}>
            <Text style={styles.calorieValue}>{currentCalories}</Text>
            <Text style={styles.calorieUnit}>KCAL</Text>
          </View>

          {/* Macro Badges */}
          <View style={styles.macroRow}>
            <View style={styles.macroCol}>
              <Text style={[styles.macroVal, { color: Colors.macros.protein }]}>
                {currentProtein}g
              </Text>
              <Text style={styles.macroLabel}>Protein</Text>
            </View>
            <View style={styles.macroCol}>
              <Text style={[styles.macroVal, { color: Colors.macros.carbs }]}>
                {currentCarbs}g
              </Text>
              <Text style={styles.macroLabel}>Carbs</Text>
            </View>
            <View style={styles.macroCol}>
              <Text style={[styles.macroVal, { color: Colors.macros.fat }]}>
                {currentFat}g
              </Text>
              <Text style={styles.macroLabel}>Fat</Text>
            </View>
            <View style={styles.macroCol}>
              <Text style={[styles.macroVal, { color: '#06B6D4' }]}>
                {currentFiber}g
              </Text>
              <Text style={styles.macroLabel}>Fiber</Text>
            </View>
          </View>
        </GlassCard>

        {/* Portion Multiplier Selector */}
        <View style={styles.portionSelectorContainer}>
          <Text style={styles.sectionTitle}>Adjust Serving Size</Text>
          <View style={styles.portionButtons}>
            {[0.5, 1.0, 1.5, 2.0].map((val) => (
              <TouchableOpacity
                key={val}
                onPress={() => setMultiplier(val)}
                style={[
                  styles.portionButton,
                  multiplier === val && styles.portionButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.portionButtonText,
                    multiplier === val && styles.portionButtonTextActive,
                  ]}
                >
                  {val}x
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* AI Identified Ingredients Breakdown */}
        {scanResult.detectedIngredients && scanResult.detectedIngredients.length > 0 && (
          <View style={styles.ingredientsContainer}>
            <Text style={styles.sectionTitle}>Detected Plate Ingredients</Text>
            {scanResult.detectedIngredients.map((item, idx) => (
              <View key={idx} style={styles.ingredientRow}>
                <View style={styles.ingredientLeft}>
                  <Text style={styles.ingredientDot}>•</Text>
                  <Text style={styles.ingredientName}>{item.name}</Text>
                </View>
                <Text style={styles.ingredientMacros}>
                  {item.servingSize}g • {item.calories} kcal • P: {item.protein}g
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* AI Clinical Explanation */}
        {scanResult.aiExplanation ? (
          <View style={styles.aiExplanationBox}>
            <Text style={styles.aiExplanationTitle}>🤖 AI Nutrition Insights</Text>
            <Text style={styles.aiExplanationText}>{scanResult.aiExplanation}</Text>
          </View>
        ) : null}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button
            title={`Log to ${mealType}`}
            variant="primary"
            loading={logMealMutation.isPending}
            onPress={handleLogMeal}
          />

          <TouchableOpacity
            style={styles.detailButton}
            onPress={() => navigation.navigate('FoodDetail', { food, mealType })}
          >
            <Text style={styles.detailButtonText}>
              View Comprehensive 30+ Micronutrient Sheet →
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
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
  topHeader: {
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
  screenTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  placeholder: {
    width: 40,
  },
  mainCard: {
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  plateInfo: {
    flex: 1,
  },
  plateTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  portionInfo: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 2,
  },
  confidenceBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  confidenceText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '700',
  },
  calorieRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginVertical: 14,
  },
  calorieValue: {
    color: '#FFFFFF',
    fontSize: 44,
    fontWeight: '900',
    letterSpacing: -1,
  },
  calorieUnit: {
    color: '#FF5E3A',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#181B26',
    borderRadius: 14,
    padding: 12,
  },
  macroCol: {
    alignItems: 'center',
  },
  macroVal: {
    fontSize: 16,
    fontWeight: '700',
  },
  macroLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  portionSelectorContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  portionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  portionButton: {
    flex: 1,
    backgroundColor: '#12141D',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  portionButtonActive: {
    borderColor: '#22C55E',
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
  },
  portionButtonText: {
    color: '#94A3B8',
    fontWeight: '600',
    fontSize: 14,
  },
  portionButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  ingredientsContainer: {
    backgroundColor: '#12141D',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  ingredientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  ingredientLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  ingredientDot: {
    color: '#22C55E',
    fontSize: 16,
    marginRight: 6,
  },
  ingredientName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  ingredientMacros: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '500',
  },
  aiExplanationBox: {
    backgroundColor: 'rgba(34, 197, 94, 0.10)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.25)',
    marginBottom: 20,
  },
  aiExplanationTitle: {
    color: '#22C55E',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  aiExplanationText: {
    color: '#E2E8F0',
    fontSize: 12,
    lineHeight: 18,
  },
  actionButtons: {
    gap: 12,
  },
  detailButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailButtonText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
});
