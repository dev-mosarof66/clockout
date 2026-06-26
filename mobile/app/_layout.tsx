import '../global.css';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { colors } from '../theme/colors';
import { OnboardingProvider, useOnboarding } from '../lib/onboarding';
import { StatsProvider } from '../lib/stats';
import { PurchasesProvider } from '../lib/purchases';
import { ProSync } from '../components/ProSync';
import { configureNotifications } from '../lib/notifications';
import { NotificationSync } from '../components/NotificationSync';
import { EngineSync } from '../components/EngineSync';

// Show expo-router's error screen instead of hanging if a screen throws.
export { ErrorBoundary } from 'expo-router';

// setOptions (and the custom splash image) only apply in dev/production builds —
// Expo Go uses its own splash, so guard it to avoid the "cannot be used" warning.
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

SplashScreen.preventAutoHideAsync();
if (!isExpoGo) {
  SplashScreen.setOptions({ duration: 350, fade: true });
}

function RootNavigator() {
  const { ready } = useOnboarding();

  // Keep the splash up until persisted onboarding state has loaded, so the entry
  // route can decide (onboarding vs home) without a flash.
  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return null;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.foreground,
        headerTitleStyle: { color: colors.foreground },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="protection" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="notifications" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    configureNotifications().catch(() => {});
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <OnboardingProvider>
          <StatsProvider>
            <PurchasesProvider>
              <StatusBar style="light" />
              <NotificationSync />
              <EngineSync />
              <ProSync />
              <RootNavigator />
            </PurchasesProvider>
          </StatsProvider>
        </OnboardingProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
