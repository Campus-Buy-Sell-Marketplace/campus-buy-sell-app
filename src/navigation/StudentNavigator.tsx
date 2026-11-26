import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { StudentTabParamList, StudentStackParamList } from '../types';
import { Colors } from '../constants/colors';
import { useNotifications } from '../context/NotificationContext';

// Screens
import HomeScreen from '../screens/student/HomeScreen';
import BrowseScreen from '../screens/student/BrowseScreen';
import ProductDetailScreen from '../screens/student/ProductDetailScreen';
import CartScreen from '../screens/student/CartScreen';
import WishlistScreen from '../screens/student/WishlistScreen';
import ChatListScreen from '../screens/student/ChatListScreen';
import ChatRoomScreen from '../screens/student/ChatRoomScreen';
import ProfileScreen from '../screens/student/ProfileScreen';
import EditProfileScreen from '../screens/student/EditProfileScreen';
import SettingsScreen from '../screens/student/SettingsScreen';
import NotificationsScreen from '../screens/student/NotificationsScreen';
import SellerOnboardingScreen from '../screens/student/SellerOnboardingScreen';
import OrdersScreen from '../screens/student/OrdersScreen';
import PaymentWebViewScreen from '../screens/student/PaymentWebViewScreen';
import SellerProfileScreen from '../screens/student/SellerProfileScreen';

const Tab = createBottomTabNavigator<StudentTabParamList>();
const HomeStack = createNativeStackNavigator<StudentStackParamList>();
const BrowseStack = createNativeStackNavigator<StudentStackParamList>();
const ChatStack = createNativeStackNavigator<StudentStackParamList>();
const WishlistStack = createNativeStackNavigator<StudentStackParamList>();
const ProfileStack = createNativeStackNavigator<StudentStackParamList>();

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="StudentTabs" component={HomeScreen} />
      <HomeStack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <HomeStack.Screen name="CartScreen" component={CartScreen} />
      <HomeStack.Screen name="SellerProfile" component={SellerProfileScreen} />
      <HomeStack.Screen name="Notifications" component={NotificationsScreen} />
      <HomeStack.Screen name="PaymentWebView" component={PaymentWebViewScreen} />
    </HomeStack.Navigator>
  );
}

function BrowseStackNavigator() {
  return (
    <BrowseStack.Navigator screenOptions={{ headerShown: false }}>
      <BrowseStack.Screen name="StudentTabs" component={BrowseScreen} />
      <BrowseStack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <BrowseStack.Screen name="CartScreen" component={CartScreen} />
      <BrowseStack.Screen name="SellerProfile" component={SellerProfileScreen} />
      <BrowseStack.Screen name="PaymentWebView" component={PaymentWebViewScreen} />
    </BrowseStack.Navigator>
  );
}

function ChatStackNavigator() {
  return (
    <ChatStack.Navigator screenOptions={{ headerShown: false }}>
      <ChatStack.Screen name="StudentTabs" component={ChatListScreen} />
      <ChatStack.Screen name="ChatRoom" component={ChatRoomScreen} />
    </ChatStack.Navigator>
  );
}

function WishlistStackNavigator() {
  return (
    <WishlistStack.Navigator screenOptions={{ headerShown: false }}>
      <WishlistStack.Screen name="StudentTabs" component={WishlistScreen} />
      <WishlistStack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <WishlistStack.Screen name="CartScreen" component={CartScreen} />
    </WishlistStack.Navigator>
  );
}

function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="StudentTabs" component={ProfileScreen} />
      <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} />
      <ProfileStack.Screen name="Settings" component={SettingsScreen} />
      <ProfileStack.Screen name="Notifications" component={NotificationsScreen} />
      <ProfileStack.Screen name="SellerOnboarding" component={SellerOnboardingScreen} />
      <ProfileStack.Screen name="OrdersScreen" component={OrdersScreen} />
      <ProfileStack.Screen name="PaymentWebView" component={PaymentWebViewScreen} />
    </ProfileStack.Navigator>
  );
}

export const StudentNavigator: React.FC = () => {
  const { unreadCount } = useNotifications();

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
        name="HomeTab"
        component={HomeStackNavigator}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="BrowseTab"
        component={BrowseStackNavigator}
        options={{
          tabBarLabel: 'Browse',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'search' : 'search-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ChatTab"
        component={ChatStackNavigator}
        options={{
          tabBarLabel: 'Chat',
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'chatbubbles' : 'chatbubbles-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="WishlistTab"
        component={WishlistStackNavigator}
        options={{
          tabBarLabel: 'Wishlist',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'heart' : 'heart-outline'} size={22} color={color} />
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

export default StudentNavigator;
