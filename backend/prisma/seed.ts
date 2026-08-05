import { PrismaClient, GoalType, ActivityLevel, Gender, FoodSource, MealType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Calora AI Database Seeding...');

  // 1. Clean existing records
  await prisma.dailyAnalytics.deleteMany();
  await prisma.favoriteFood.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.weightLog.deleteMany();
  await prisma.waterLog.deleteMany();
  await prisma.mealLog.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.user.deleteMany();
  await prisma.food.deleteMany();

  // 2. Create Demo User
  const hashedPassword = await bcrypt.hash('CaloraSecure2026!', 10);
  const demoUser = await prisma.user.create({
    data: {
      email: 'demo@calora.ai',
      password: hashedPassword,
      name: 'Alex Rivera',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
      height: 180, // cm
      weight: 76.5, // kg
      age: 28,
      gender: Gender.MALE,
      goal: GoalType.LOSE_WEIGHT,
      activityLevel: ActivityLevel.MODERATE,
      isEmailVerified: true,
      goals: {
        create: {
          targetCalories: 2150,
          targetProtein: 165,
          targetCarbs: 210,
          targetFat: 60,
          targetWater: 3000,
          targetFiber: 35,
          targetSodium: 2200,
          targetSugar: 45,
        },
      },
    },
  });

  console.log(`👤 Created Demo User: ${demoUser.email} (ID: ${demoUser.id})`);

  // 3. Seed Comprehensive Nutritional Foods Database
  const foodsData = [
    {
      name: 'Grilled Chicken Breast',
      brand: 'USDA Choice',
      barcode: '011110001001',
      image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600',
      servingSize: 100,
      servingUnit: 'g',
      calories: 165,
      protein: 31.0,
      carbs: 0.0,
      fat: 3.6,
      fiber: 0.0,
      sugar: 0.0,
      sodium: 74,
      cholesterol: 85,
      potassium: 256,
      vitaminA: 6,
      vitaminB: 0.6,
      vitaminC: 0.0,
      vitaminD: 0.1,
      vitaminE: 0.3,
      vitaminK: 0.3,
      calcium: 15,
      iron: 1.04,
      magnesium: 29,
      zinc: 1.0,
      copper: 0.05,
      phosphorus: 228,
      omega3: 0.08,
      omega6: 0.58,
      waterContent: 65.0,
      glycemicLoad: 0,
      confidenceScore: 0.98,
      source: FoodSource.USDA,
    },
    {
      name: 'Organic Hass Avocado',
      brand: 'Fresh Produce',
      barcode: '011110001002',
      image: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=600',
      servingSize: 100,
      servingUnit: 'g',
      calories: 160,
      protein: 2.0,
      carbs: 8.5,
      fat: 14.7,
      fiber: 6.7,
      sugar: 0.7,
      sodium: 7,
      cholesterol: 0,
      potassium: 485,
      vitaminA: 7,
      vitaminB: 0.3,
      vitaminC: 10.0,
      vitaminD: 0.0,
      vitaminE: 2.07,
      vitaminK: 21.0,
      calcium: 12,
      iron: 0.55,
      magnesium: 29,
      zinc: 0.64,
      copper: 0.19,
      phosphorus: 52,
      omega3: 0.11,
      omega6: 1.69,
      waterContent: 73.2,
      glycemicLoad: 1,
      confidenceScore: 0.99,
      source: FoodSource.USDA,
    },
    {
      name: 'Wild Atlantic Salmon Fillet',
      brand: 'Ocean Fresh',
      barcode: '011110001003',
      image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600',
      servingSize: 100,
      servingUnit: 'g',
      calories: 208,
      protein: 22.0,
      carbs: 0.0,
      fat: 13.0,
      fiber: 0.0,
      sugar: 0.0,
      sodium: 59,
      cholesterol: 55,
      potassium: 363,
      vitaminA: 40,
      vitaminB: 0.8,
      vitaminC: 3.9,
      vitaminD: 10.9,
      vitaminE: 3.55,
      vitaminK: 0.1,
      calcium: 9,
      iron: 0.34,
      magnesium: 27,
      zinc: 0.36,
      copper: 0.05,
      phosphorus: 240,
      omega3: 2.26,
      omega6: 0.66,
      waterContent: 68.5,
      glycemicLoad: 0,
      confidenceScore: 0.97,
      source: FoodSource.USDA,
    },
    {
      name: 'Steamed White Rice (Jasmine)',
      brand: 'Hom Mali',
      barcode: '011110001004',
      image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600',
      servingSize: 100,
      servingUnit: 'g',
      calories: 130,
      protein: 2.7,
      carbs: 28.2,
      fat: 0.3,
      fiber: 0.4,
      sugar: 0.1,
      sodium: 1,
      cholesterol: 0,
      potassium: 35,
      vitaminA: 0,
      vitaminB: 0.2,
      vitaminC: 0.0,
      vitaminD: 0.0,
      vitaminE: 0.04,
      vitaminK: 0.1,
      calcium: 10,
      iron: 1.2,
      magnesium: 12,
      zinc: 0.49,
      copper: 0.07,
      phosphorus: 43,
      omega3: 0.01,
      omega6: 0.08,
      waterContent: 68.4,
      glycemicLoad: 24,
      confidenceScore: 0.95,
      source: FoodSource.USDA,
    },
    {
      name: 'Organic Rolled Oats',
      brand: "Bob's Red Mill",
      barcode: '039978001153',
      image: 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=600',
      servingSize: 40,
      servingUnit: 'g',
      calories: 150,
      protein: 5.0,
      carbs: 27.0,
      fat: 2.5,
      fiber: 4.0,
      sugar: 1.0,
      sodium: 0,
      cholesterol: 0,
      potassium: 140,
      vitaminA: 0,
      vitaminB: 0.15,
      vitaminC: 0.0,
      vitaminD: 0.0,
      vitaminE: 0.3,
      vitaminK: 0.8,
      calcium: 20,
      iron: 1.5,
      magnesium: 55,
      zinc: 1.2,
      copper: 0.15,
      phosphorus: 180,
      omega3: 0.04,
      omega6: 0.95,
      waterContent: 8.0,
      glycemicLoad: 11,
      confidenceScore: 0.99,
      source: FoodSource.OPEN_FOOD_FACTS,
    },
    {
      name: 'Greek Yogurt (0% Non-Fat Plain)',
      brand: 'Chobani',
      barcode: '894700010014',
      image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600',
      servingSize: 170,
      servingUnit: 'g',
      calories: 100,
      protein: 18.0,
      carbs: 6.0,
      fat: 0.0,
      fiber: 0.0,
      sugar: 5.0,
      sodium: 65,
      cholesterol: 10,
      potassium: 240,
      vitaminA: 0,
      vitaminB: 0.9,
      vitaminC: 0.0,
      vitaminD: 0.0,
      vitaminE: 0.0,
      vitaminK: 0.0,
      calcium: 200,
      iron: 0.1,
      magnesium: 19,
      zinc: 0.89,
      copper: 0.03,
      phosphorus: 230,
      omega3: 0.0,
      omega6: 0.0,
      waterContent: 85.0,
      glycemicLoad: 2,
      confidenceScore: 0.99,
      source: FoodSource.OPEN_FOOD_FACTS,
    },
    {
      name: 'Fresh Blueberries',
      brand: "Nature's Promise",
      barcode: '011110001005',
      image: 'https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=600',
      servingSize: 100,
      servingUnit: 'g',
      calories: 57,
      protein: 0.7,
      carbs: 14.5,
      fat: 0.3,
      fiber: 2.4,
      sugar: 9.96,
      sodium: 1,
      cholesterol: 0,
      potassium: 77,
      vitaminA: 3,
      vitaminB: 0.05,
      vitaminC: 9.7,
      vitaminD: 0.0,
      vitaminE: 0.57,
      vitaminK: 19.3,
      calcium: 6,
      iron: 0.28,
      magnesium: 6,
      zinc: 0.16,
      copper: 0.06,
      phosphorus: 12,
      omega3: 0.06,
      omega6: 0.09,
      waterContent: 84.2,
      glycemicLoad: 5,
      confidenceScore: 0.98,
      source: FoodSource.USDA,
    },
    {
      name: 'Raw Almonds',
      brand: 'Blue Diamond',
      barcode: '041570054238',
      image: 'https://images.unsplash.com/photo-1508061252966-ef7fe9f5085f?w=600',
      servingSize: 30,
      servingUnit: 'g',
      calories: 170,
      protein: 6.0,
      carbs: 6.0,
      fat: 15.0,
      fiber: 3.5,
      sugar: 1.2,
      sodium: 0,
      cholesterol: 0,
      potassium: 210,
      vitaminA: 0,
      vitaminB: 0.1,
      vitaminC: 0.0,
      vitaminD: 0.0,
      vitaminE: 7.3,
      vitaminK: 0.0,
      calcium: 75,
      iron: 1.1,
      magnesium: 80,
      zinc: 0.9,
      copper: 0.3,
      phosphorus: 140,
      omega3: 0.0,
      omega6: 3.7,
      waterContent: 4.4,
      glycemicLoad: 0,
      confidenceScore: 0.99,
      source: FoodSource.OPEN_FOOD_FACTS,
    },
    {
      name: 'Fresh Large Egg (Boiled/Poached)',
      brand: 'Vital Farms Pasture-Raised',
      barcode: '855799002010',
      image: 'https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=600',
      servingSize: 50,
      servingUnit: 'g',
      calories: 72,
      protein: 6.3,
      carbs: 0.4,
      fat: 4.8,
      fiber: 0.0,
      sugar: 0.2,
      sodium: 71,
      cholesterol: 186,
      potassium: 69,
      vitaminA: 80,
      vitaminB: 0.5,
      vitaminC: 0.0,
      vitaminD: 1.1,
      vitaminE: 0.5,
      vitaminK: 0.2,
      calcium: 28,
      iron: 0.9,
      magnesium: 6,
      zinc: 0.6,
      copper: 0.04,
      phosphorus: 99,
      omega3: 0.11,
      omega6: 0.68,
      waterContent: 75.0,
      glycemicLoad: 0,
      confidenceScore: 0.99,
      source: FoodSource.USDA,
    },
    {
      name: 'Steamed Broccoli Florets',
      brand: 'Fresh Market',
      barcode: '011110001006',
      image: 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=600',
      servingSize: 100,
      servingUnit: 'g',
      calories: 35,
      protein: 2.4,
      carbs: 7.2,
      fat: 0.4,
      fiber: 3.3,
      sugar: 1.4,
      sodium: 41,
      cholesterol: 0,
      potassium: 293,
      vitaminA: 77,
      vitaminB: 0.2,
      vitaminC: 65.0,
      vitaminD: 0.0,
      vitaminE: 1.45,
      vitaminK: 141.0,
      calcium: 40,
      iron: 0.67,
      magnesium: 21,
      zinc: 0.45,
      copper: 0.06,
      phosphorus: 67,
      omega3: 0.09,
      omega6: 0.05,
      waterContent: 89.0,
      glycemicLoad: 1,
      confidenceScore: 0.98,
      source: FoodSource.USDA,
    },
  ];

  const createdFoods = [];
  for (const food of foodsData) {
    const created = await prisma.food.create({ data: food });
    createdFoods.push(created);
  }
  console.log(`🍎 Seeded ${createdFoods.length} nutritious foods.`);

  // 4. Create Today's Sample Meal Logs
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Breakfast: Oats + Blueberries + Greek Yogurt
  await prisma.mealLog.create({
    data: {
      userId: demoUser.id,
      foodId: createdFoods[4].id, // Oats
      mealType: MealType.BREAKFAST,
      quantity: 1.5,
      servingSize: 40,
      calories: 225,
      protein: 7.5,
      carbs: 40.5,
      fat: 3.75,
      fiber: 6.0,
      sugar: 1.5,
      sodium: 0,
      date: today,
    },
  });

  await prisma.mealLog.create({
    data: {
      userId: demoUser.id,
      foodId: createdFoods[5].id, // Greek Yogurt
      mealType: MealType.BREAKFAST,
      quantity: 1.0,
      servingSize: 170,
      calories: 100,
      protein: 18.0,
      carbs: 6.0,
      fat: 0.0,
      fiber: 0.0,
      sugar: 5.0,
      sodium: 65,
      date: today,
    },
  });

  await prisma.mealLog.create({
    data: {
      userId: demoUser.id,
      foodId: createdFoods[6].id, // Blueberries
      mealType: MealType.BREAKFAST,
      quantity: 0.8,
      servingSize: 100,
      calories: 45.6,
      protein: 0.56,
      carbs: 11.6,
      fat: 0.24,
      fiber: 1.92,
      sugar: 7.97,
      sodium: 0.8,
      date: today,
    },
  });

  // Lunch: Grilled Chicken + Jasmine Rice + Broccoli + Avocado
  await prisma.mealLog.create({
    data: {
      userId: demoUser.id,
      foodId: createdFoods[0].id, // Chicken
      mealType: MealType.LUNCH,
      quantity: 1.8,
      servingSize: 100,
      calories: 297,
      protein: 55.8,
      carbs: 0.0,
      fat: 6.48,
      fiber: 0.0,
      sugar: 0.0,
      sodium: 133.2,
      date: today,
    },
  });

  await prisma.mealLog.create({
    data: {
      userId: demoUser.id,
      foodId: createdFoods[3].id, // Rice
      mealType: MealType.LUNCH,
      quantity: 1.5,
      servingSize: 100,
      calories: 195,
      protein: 4.05,
      carbs: 42.3,
      fat: 0.45,
      fiber: 0.6,
      sugar: 0.15,
      sodium: 1.5,
      date: today,
    },
  });

  await prisma.mealLog.create({
    data: {
      userId: demoUser.id,
      foodId: createdFoods[9].id, // Broccoli
      mealType: MealType.LUNCH,
      quantity: 1.2,
      servingSize: 100,
      calories: 42,
      protein: 2.88,
      carbs: 8.64,
      fat: 0.48,
      fiber: 3.96,
      sugar: 1.68,
      sodium: 49.2,
      date: today,
    },
  });

  // 5. Water Logs
  await prisma.waterLog.createMany({
    data: [
      { userId: demoUser.id, amount: 500, date: today },
      { userId: demoUser.id, amount: 750, date: today },
      { userId: demoUser.id, amount: 500, date: today },
    ],
  });

  // 6. Weight Logs
  await prisma.weightLog.createMany({
    data: [
      { userId: demoUser.id, weight: 77.2, date: new Date(Date.now() - 7 * 86400000), notes: 'Starting weekly check-in' },
      { userId: demoUser.id, weight: 76.8, date: new Date(Date.now() - 3 * 86400000), notes: 'Good progress' },
      { userId: demoUser.id, weight: 76.5, date: today, notes: 'Target on track' },
    ],
  });

  // 7. Favorite Foods
  await prisma.favoriteFood.createMany({
    data: [
      { userId: demoUser.id, foodId: createdFoods[0].id },
      { userId: demoUser.id, foodId: createdFoods[1].id },
      { userId: demoUser.id, foodId: createdFoods[2].id },
    ],
  });

  console.log('✅ Calora AI Database Seeding Complete!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
