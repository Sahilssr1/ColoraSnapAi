import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { FoodItem } from '../types';
import { Colors } from '../theme/colors';

interface FoodCardProps {
  food: FoodItem;
  onPress: () => void;
  onAddPress?: () => void;
  showAddButton?: boolean;
}

export const FoodCard: React.FC<FoodCardProps> = ({
  food,
  onPress,
  onAddPress,
  showAddButton = true,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={styles.card}
    >
      <View style={styles.imageContainer}>
        {food.image ? (
          <Image source={{ uri: food.image }} style={styles.image} />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderEmoji}>🥗</Text>
          </View>
        )}
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.title} numberOfLines={1}>
          {food.name}
        </Text>
        <Text style={styles.brand} numberOfLines={1}>
          {food.brand || `${food.servingSize} ${food.servingUnit}`}
        </Text>

        <View style={styles.macroPills}>
          <Text style={[styles.macroPill, { color: Colors.macros.calories }]}>
            {food.calories.toFixed(0)} kcal
          </Text>
          <Text style={[styles.macroPill, { color: Colors.macros.protein }]}>
            P: {food.protein.toFixed(1)}g
          </Text>
          <Text style={[styles.macroPill, { color: Colors.macros.carbs }]}>
            C: {food.carbs.toFixed(1)}g
          </Text>
          <Text style={[styles.macroPill, { color: Colors.macros.fat }]}>
            F: {food.fat.toFixed(1)}g
          </Text>
        </View>
      </View>

      {showAddButton && (
        <TouchableOpacity
          style={styles.addButton}
          onPress={onAddPress || onPress}
          activeOpacity={0.7}
        >
          <Text style={styles.addIcon}>+</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#12141D',
    borderRadius: 16,
    padding: 12,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  imageContainer: {
    width: 52,
    height: 52,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#181B26',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderEmoji: {
    fontSize: 24,
  },
  infoContainer: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  brand: {
    color: '#64748B',
    fontSize: 12,
    marginBottom: 6,
  },
  macroPills: {
    flexDirection: 'row',
    gap: 8,
  },
  macroPill: {
    fontSize: 11,
    fontWeight: '700',
  },
  addButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 94, 58, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 94, 58, 0.3)',
  },
  addIcon: {
    color: Colors.brand.primary,
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 22,
  },
});
