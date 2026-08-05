import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { SplashScreen } from '../screens/auth/SplashScreen';
import { OnboardingScreen } from '../screens/auth/OnboardingScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { TabNavigator } from './TabNavigator';
import { CameraScreen } from '../screens/scanner/CameraScreen';
import { BarcodeScreen } from '../screens/scanner/BarcodeScreen';
import { FoodResultScreen } from '../screens/scanner/FoodResultScreen';
import { FoodDetailScreen } from '../screens/tracker/FoodDetailScreen';
import { SearchScreen } from '../screens/tracker/SearchScreen';
import { AIInsightsScreen } from '../screens/analytics/AIInsightsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#090A0F' },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      <Stack.Screen
        name="Camera"
        component={CameraScreen}
        options={{ animation: 'fade' }}
      />
      <Stack.Screen
        name="Barcode"
        component={BarcodeScreen}
        options={{ animation: 'fade' }}
      />
      <Stack.Screen name="FoodResult" component={FoodResultScreen} />
      <Stack.Screen name="FoodDetail" component={FoodDetailScreen} />
      <Stack.Screen name="Search" component={SearchScreen as any} />
      <Stack.Screen name="AIInsights" component={AIInsightsScreen} />
    </Stack.Navigator>
  );
};
