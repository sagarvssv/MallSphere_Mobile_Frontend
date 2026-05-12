// app/_layout.tsx
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { configureGoogleSignIn } from '../hooks/useGoogleAuth';
import TokenRefreshHandler from './(auth)/TokenRefreshHandler';

export default function RootLayout() {
  useEffect(() => {
    // Initialize Google Sign-In once when app starts
    configureGoogleSignIn();
    console.log('✅ Google Sign-In configured');
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <TokenRefreshHandler />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: Colors.background,
          },
          headerTintColor: Colors.text,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerShown: false,
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </SafeAreaProvider>
  );
}