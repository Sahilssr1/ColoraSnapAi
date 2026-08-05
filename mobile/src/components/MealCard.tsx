import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MealType, MealLogItem } from '../types';
import { Colors } from '../theme/colors';

interface MealCardProps {
  mealType: MealType;
  title: string;
  emoji: string;
  items: MealLogItem[];
  totalCalories: number;
  onAddPress: () => void;
  onItemPress?: (item: MealLogItem) => void;
  onDeletePress?: (id: string) => void;
}

export const MealCard: React.FC<MealCardProps> = ({
  title,
  emoji,
  items,
  totalCalories,
  onAddPress,
  onItemPress,
  onDeletePress,
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.emoji}>{emoji}</Text>
          <View>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.caloriesSubtitle}>{totalCalories} kcal</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={onAddPress}
          activeOpacity={0.7}
          style={styles.addMealButton}
        >
          <Text style={styles.addMealText}>+ Add Food</Text>
        </TouchableOpacity>
      </View>

      {items.length > 0 ? (
        <View style={styles.itemsList}>
          {items.map((item) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.7}
              onPress={() => onItemPress && onItemPress(item)}
              style={styles.itemRow}
            >
              <View style={styles.itemLeft}>
                <Text style={styles.itemName} numberOfLines={1}>
                  {item.food?.name || 'Food item'}
                </Text>
                <Text style={styles.itemServing}>
                  {item.quantity}x serving • P: {item.protein.toFixed(0)}g • C:{' '}
                  {item.carbs.toFixed(0)}g • F: {item.fat.toFixed(0)}g
                </Text>
              </View>

              <View style={styles.itemRight}>
                <Text style={styles.itemCalories}>{item.calories} kcal</Text>
                {onDeletePress && (
                  <TouchableOpacity
                    onPress={() => onDeletePress(item.id)}
                    style={styles.deleteButton}
                  >
                    <Text style={styles.deleteText}>×</Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No food logged for {title.toLowerCase()} yet</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#12141D',
    borderRadius: 20,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 24,
    marginRight: 10,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  caloriesSubtitle: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },
  addMealButton: {
    backgroundColor: 'rgba(255, 94, 58, 0.12)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 94, 58, 0.25)',
  },
  addMealText: {
    color: Colors.brand.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  itemsList: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 8,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.03)',
  },
  itemLeft: {
    flex: 1,
    paddingRight: 10,
  },
  itemName: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '600',
  },
  itemServing: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemCalories: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  deleteButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: 'bold',
    lineHeight: 16,
  },
  emptyState: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  emptyText: {
    color: '#475569',
    fontSize: 12,
    fontStyle: 'italic',
  },
});
