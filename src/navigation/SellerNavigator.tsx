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

const Tab = createBottomTabNavigator<SellerTabParamList>();
const ProductsStack = createNativeStackNavigator<SellerStackParamList>();
const OrdersStack = createNativeStackNavigator<SellerStackParamList>();

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

export const SellerNavigator: React.FC = () => {
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
        component={ProfileScreen}
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

export default SellerNavigator;
