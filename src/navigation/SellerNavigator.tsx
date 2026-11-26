import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SellerTabParamList, SellerStackParamList } from '../types';
import { Colors } from '../constants/colors';

// Screens
import SellerDashboardScreen from '../screens/seller/SellerDashboardScreen';
import SellerProductsScreen from '../screens/seller/SellerProductsScreen';
import SellerOrdersScreen from '../screens/seller/SellerOrdersScreen';
import SellerPayoutsScreen from '../screens/seller/SellerPayoutsScreen';
import AddEditProductScreen from '../screens/seller/AddEditProductScreen';
import ProfileScreen from '../screens/student/ProfileScreen';
import ChatRoomScreen from '../screens/student/ChatRoomScreen';
import EditProfileScreen from '../screens/student/EditProfileScreen';
import SettingsScreen from '../screens/student/SettingsScreen';
import NotificationsScreen from '../screens/student/NotificationsScreen';
import OrdersScreen from '../screens/student/OrdersScreen';

const Tab = createBottomTabNavigator<SellerTabParamList>();
const ProductsStack = createNativeStackNavigator<SellerStackParamList>();
const OrdersStack = createNativeStackNavigator<SellerStackParamList>();
const ProfileStack = createNativeStackNavigator<SellerStackParamList>();

function ProductsStackNavigator() {
  return (
    <ProductsStack.Navigator screenOptions={{ headerShown: false }}>
      <ProductsStack.Screen name="SellerTabs" component={SellerProductsScreen} />
      <ProductsStack.Screen name="AddEditProduct" component={AddEditProductScreen} />
    </ProductsStack.Navigator>
  );
}

function OrdersStackNavigator() {
  return (
    <OrdersStack.Navigator screenOptions={{ headerShown: false }}>
      <OrdersStack.Screen name="SellerTabs" component={SellerOrdersScreen} />
      <OrdersStack.Screen name="ChatRoom" component={ChatRoomScreen} />
    </OrdersStack.Navigator>
  );
}

function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="SellerTabs" component={ProfileScreen} />
      <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} />
      <ProfileStack.Screen name="Settings" component={SettingsScreen} />
      <ProfileStack.Screen name="Notifications" component={NotificationsScreen} />
      <ProfileStack.Screen name="OrdersScreen" component={OrdersScreen} />
    </ProfileStack.Navigator>
  );
}

export const SellerNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tab.Screen
        name="DashboardTab"
        component={SellerDashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'grid' : 'grid-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ProductsTab"
        component={ProductsStackNavigator}
        options={{
          tabBarLabel: 'Products',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'pricetags' : 'pricetags-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="OrdersTab"
        component={OrdersStackNavigator}
        options={{
          tabBarLabel: 'Orders',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'receipt' : 'receipt-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="PayoutsTab"
        component={SellerPayoutsScreen}
        options={{
          tabBarLabel: 'Payouts',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'cash' : 'cash-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackNavigator}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={22} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.surface,
    borderTopWidth: 0,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    height: Platform.OS === 'ios' ? 80 : 65,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    paddingTop: 5,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
});

export default SellerNavigator;
