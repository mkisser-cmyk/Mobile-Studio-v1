import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';
import LoginScreen from './screens/LoginScreen';
import TwoFactorScreen from './screens/TwoFactorScreen';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

function RootLayoutNav() {
  const { isLoggedIn, isLoading, requires2FA } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f59e0b" />
      </View>
    );
  }

  // Show 2FA screen if needed
  if (requires2FA) {
    return <TwoFactorScreen />;
  }

  // Show login if not logged in
  if (!isLoggedIn) {
    return <LoginScreen />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#000000' },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen 
        name="site/[id]" 
        options={{ 
          headerShown: false,
          presentation: 'card',
        }} 
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <RootLayoutNav />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
