import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { GlassCard } from '../../components/GlassCard';
import { Button } from '../../components/Button';
import { Colors } from '../../theme/colors';
import { useLogMealMutation } from '../../api/queries';
import { apiClient } from '../../api/client';

type Props = NativeStackScreenProps<RootStackParamList, 'FoodDetail'>;

export const FoodDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { food, mealType = 'LUNCH' } = route.params;
  const [multiplier, setMultiplier] = useState(1.0);
  const [isFavorite, setIsFavorite] = useState(false);
  const logMealMutation = useLogMealMutation();

  const handleToggleFavorite = async () => {
    try {
      const res = await apiClient.post(`/foods/favorites/${food.id}`);
      setIsFavorite(res.data.data.isFavorite);
    } catch {
      // Toggle locally
      setIsFavorite(!isFavorite);
    }
  };

  const handleLogMeal = async () => {
    try {
      await logMealMutation.mutateAsync({
        foodId: food.id,
        mealType,
        quantity: multiplier,
      });

      Alert.alert('Success', `${food.name} added to ${mealType.toLowerCase()}`, [
        {
          text: 'Back to Home',
          onPress: () => navigation.navigate('MainTabs'),
        },
      ]);
    } catch (err: any) {
      Alert.alert('Error', 'Failed to log food item.');
    }
  };

  const nutrientRows = [
    { name: 'Calories', val: (food.calories * multiplier).toFixed(0), unit: 'kcal', color: Colors.macros.calories },
    { name: 'Protein', val: (food.protein * multiplier).toFixed(1), unit: 'g', color: Colors.macros.protein },
    { name: 'Carbohydrates', val: (food.carbs * multiplier).toFixed(1), unit: 'g', color: Colors.macros.carbs },
    { name: 'Total Fat', val: (food.fat * multiplier).toFixed(1), unit: 'g', color: Colors.macros.fat },
    { name: 'Dietary Fiber', val: ((food.fiber || 0) * multiplier).toFixed(1), unit: 'g', color: '#10B981' },
    { name: 'Total Sugars', val: ((food.sugar || 0) * multiplier).toFixed(1), unit: 'g', color: '#F59E0B' },
    { name: 'Sodium', val: ((food.sodium || 0) * multiplier).toFixed(0), unit: 'mg', color: '#EF4444' },
    { name: 'Potassium', val: ((food.potassium || 0) * multiplier).toFixed(0), unit: 'mg', color: '#06B6D4' },
    { name: 'Calcium', val: ((food.calcium || 0) * multiplier).toFixed(0), unit: 'mg', color: '#38EF7D' },
    { name: 'Iron', val: ((food.iron || 0) * multiplier).toFixed(1), unit: 'mg', color: '#EC4899' },
    { name: 'Magnesium', val: ((food.magnesium || 0) * multiplier).toFixed(0), unit: 'mg', color: '#8B5CF6' },
    { name: 'Zinc', val: ((food.zinc || 0) * multiplier).toFixed(1), unit: 'mg', color: '#F97316' },
    { name: 'Vitamin A', val: ((food.vitaminA || 0) * multiplier).toFixed(0), unit: 'mcg', color: '#FBBF24' },
    { name: 'Vitamin C', val: ((food.vitaminC || 0) * multiplier).toFixed(1), unit: 'mg', color: '#34D399' },
    { name: 'Vitamin D', val: ((food.vitaminD || 0) * multiplier).toFixed(1), unit: 'mcg', color: '#60A5FA' },
    { name: 'Omega-3', val: ((food.omega3 || 0) * multiplier).toFixed(2), unit: 'g', color: '#38BDF8' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>Nutrient Breakdown</Text>
          <TouchableOpacity style={styles.favButton} onPress={handleToggleFavorite}>
            <Text style={styles.favIcon}>{isFavorite ? '❤️' : '🤍'}</Text>
          </TouchableOpacity>
        </View>

        {/* Food Title & Source */}
        <GlassCard elevated style={styles.titleCard}>
          <Text style={styles.foodName}>{food.name}</Text>
          <Text style={styles.foodBrand}>
            {food.brand || 'Calora Nutrition Database'} • {Math.round(food.servingSize * multiplier)}{' '}
            {food.servingUnit}
          </Text>

          <View style={styles.badgesRow}>
            {food.healthRating && (
              <View style={styles.ratingBadge}>
                <Text style={styles.ratingText}>Rating: {food.healthRating}</Text>
              </View>
            )}
            {food.glycemicLoad !== undefined && (
              <View style={styles.glBadge}>
                <Text style={styles.glText}>Glycemic Load: {food.glycemicLoad}</Text>
              </View>
            )}
          </View>
        </GlassCard>

        {/* Portion Multiplier */}
        <View style={styles.portionSection}>
          <Text style={styles.sectionHeading}>Portion Multiplier</Text>
          <View style={styles.portionButtons}>
            {[0.5, 1.0, 1.5, 2.0, 3.0].map((p) => (
              <TouchableOpacity
                key={p}
                onPress={() => setMultiplier(p)}
                style={[styles.portionBtn, multiplier === p && styles.portionBtnActive]}
              >
                <Text style={[styles.portionBtnText, multiplier === p && styles.portionBtnTextActive]}>
                  {p}x
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Nutrient Matrix */}
        <Text style={styles.sectionHeading}>Detailed Micronutrients & Vitamins</Text>
        <View style={styles.nutrientTable}>
          {nutrientRows.map((n, idx) => (
            <View key={idx} style={styles.tableRow}>
              <View style={styles.nameWithDot}>
                <View style={[styles.nutrientDot, { backgroundColor: n.color }]} />
                <Text style={styles.nutrientName}>{n.name}</Text>
              </View>
              <Text style={styles.nutrientValue}>
                {n.val} {n.unit}
              </Text>
            </View>
          ))}
        </View>

        {/* Action Button */}
        <Button
          title={`Log to ${mealType}`}
          variant="primary"
          loading={logMealMutation.isPending}
          onPress={handleLogMeal}
          style={styles.logButton}
        />
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
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    maxWidth: 200,
  },
  favButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#181B26',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favIcon: {
    fontSize: 18,
  },
  titleCard: {
    marginBottom: 16,
  },
  foodName: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  foodBrand: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 4,
    marginBottom: 12,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  ratingBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  ratingText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '700',
  },
  glBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  glText: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '700',
  },
  portionSection: {
    marginBottom: 16,
  },
  sectionHeading: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  portionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  portionBtn: {
    flex: 1,
    backgroundColor: '#12141D',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  portionBtnActive: {
    borderColor: Colors.brand.primary,
    backgroundColor: '#1C1622',
  },
  portionBtnText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  portionBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  nutrientTable: {
    backgroundColor: '#12141D',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 20,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  nameWithDot: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nutrientDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  nutrientName: {
    color: '#CBD5E1',
    fontSize: 14,
    fontWeight: '500',
  },
  nutrientValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  logButton: {
    marginTop: 8,
  },
});
