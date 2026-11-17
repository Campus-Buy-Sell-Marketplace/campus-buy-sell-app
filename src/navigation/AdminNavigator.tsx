import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { AdminTabParamList } from '../types';
import { Colors } from '../constants/colors';

// Screens
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminUsersScreen from '../screens/admin/AdminUsersScreen';
import AdminListingsScreen from '../screens/admin/AdminListingsScreen';
import AdminPayoutsScreen from '../screens/admin/AdminPayoutsScreen';

const Tab = createBottomTabNavigator<AdminTabParamList>();

export const AdminNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.black,
        tabBarInactiveTintColor: Colors.secondary,
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tab.Screen
        name="DashboardTab"
        component={AdminDashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'speedometer' : 'speedometer-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="UsersTab"
        component={AdminUsersScreen}
        options={{
          tabBarLabel: 'Users',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'people' : 'people-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ListingsTab"
        component={AdminListingsScreen}
        options={{
          tabBarLabel: 'Listings',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'albums' : 'albums-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="PayoutsTab"
        component={AdminPayoutsScreen}
        options={{
          tabBarLabel: 'Payouts',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'card' : 'card-outline'} size={22} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    height: Platform.OS === 'ios' ? 80 : 60,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingTop: 8,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
});

export default AdminNavigator;
