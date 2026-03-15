import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import 'react-native-reanimated';
import { LogBox } from 'react-native';

import { AuthProvider, useAuth } from '../context/AuthContext';

// Suppress non-critical development warnings
if (__DEV__) {
  LogBox.ignoreLogs([
    'Unable to activate keep awake',
    'Uncaught (in promise',
  ]);
}

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { user, employer, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === 'auth';
    const isAuthenticated = user !== null || employer !== null;

    if (!isAuthenticated && !inAuthGroup) {
      // Redirect to login if not authenticated
      router.replace('/auth/login');
    } else if (isAuthenticated && inAuthGroup) {
      // Redirect to main app if authenticated
      router.replace('/(tabs)');
    }
  }, [user, employer, loading, segments]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
