import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useAuth } from '../context/AuthContext';

import SplashScreen from '../screens/auth/SplashScreen';
import AuthNavigator from './AuthNavigator';
import StudentNavigator from './StudentNavigator';
import SellerNavigator from './SellerNavigator';
import AdminNavigator from './AdminNavigator';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const { isLoading, isAuthenticated, user } = useAuth();

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' ? (
          <Stack.Screen name="AdminApp" component={AdminNavigator} />
        ) : user?.role === 'SELLER' ? (
          <Stack.Screen name="SellerApp" component={SellerNavigator} />
        ) : (
          <Stack.Screen name="StudentApp" component={StudentNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;
