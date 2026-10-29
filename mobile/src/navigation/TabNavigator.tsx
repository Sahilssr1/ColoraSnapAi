import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Activity, Search, Camera, TrendingUp, Users } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MainTabParamList } from './types';
import { HomeScreen } from '../screens/tracker/HomeScreen';
import { SearchScreen } from '../screens/tracker/SearchScreen';
import { AnalyticsScreen } from '../screens/analytics/AnalyticsScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { useTheme } from '../theme/useTheme';

const Tab = createBottomTabNavigator<MainTabParamList>();

// The centre button is a custom tabBarButton that opens the Camera screen,
// so this tab is never actually focused. It previously rendered HomeScreen
// as its component, which meant HomeScreen mounted TWICE on launch — two
// pedometer subscriptions, two walk/run timers, two dashboard queries and
// two backend step syncs racing each other, with the whole screen (header
// included) re-rendering on every step and every timer tick. That is the
// header flicker and the jumping step counts. A null component removes
// the duplicate mount entirely.
const NullScreen: React.FC = () => null;

export const TabNavigator: React.FC = () => {
  const { theme, isDark } = useTheme();

  const tabBg = isDark ? '#1C1C1E' : '#FFFFFF';
  const tabBorder = isDark ? 'rgba(255, 255, 255, 0.10)' : '#E5E5EA';

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: Platform.OS === 'ios' ? 88 : 68,
          backgroundColor: tabBg,
          borderTopColor: tabBorder,
          borderTopWidth: StyleSheet.hairlineWidth,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          elevation: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: isDark ? 0.3 : 0.06,
          shadowRadius: 10,
        },
        tabBarActiveTintColor: '#FF3B30',
        tabBarInactiveTintColor: isDark ? '#8E8E93' : '#8E8E93',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
          letterSpacing: -0.2,
        },
      }}
    >
      {/* 1. Summary (Apple Health Home) */}
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Summary',
          tabBarIcon: ({ color, size, focused }) => (
            <Activity
              color={color}
              size={22}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />

      {/* 2. Search (Apple Health Categories) */}
      <Tab.Screen
        name="SearchTab"
        component={SearchScreen}
        options={{
          tabBarLabel: 'Search',
          tabBarIcon: ({ color, size, focused }) => (
            <Search
              color={color}
              size={22}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />

      {/* 3. Center Floating Modern AI Scanner */}
      <Tab.Screen
        name="ScanTab"
        component={NullScreen}
        options={({ navigation }) => ({
          tabBarLabel: '',
          tabBarButton: () => (
            <View style={styles.floatingScanContainer}>
              <TouchableOpacity
                style={[
                  styles.floatingScanButton,
                  {
                    borderColor: isDark ? '#000000' : '#F2F2F7',
                  },
                ]}
                activeOpacity={0.88}
                onPress={() => navigation.navigate('Camera', { mealType: 'LUNCH' })}
              >
                <LinearGradient
                  colors={['#FF3B30', '#FF2D55']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradientCircle}
                >
                  <Camera color="#FFFFFF" size={24} strokeWidth={2.2} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ),
        })}
      />

      {/* 4. Trends / Analytics */}
      <Tab.Screen
        name="AnalyticsTab"
        component={AnalyticsScreen}
        options={{
          tabBarLabel: 'Trends',
          tabBarIcon: ({ color, size, focused }) => (
            <TrendingUp
              color={color}
              size={22}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />

      {/* 5. Profile / Sharing */}
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Sharing',
          tabBarIcon: ({ color, size, focused }) => (
            <Users
              color={color}
              size={22}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  floatingScanContainer: {
    top: -20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingScanButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 4,
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.38,
    shadowRadius: 12,
    elevation: 10,
    backgroundColor: '#FF3B30',
  },
  gradientCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
