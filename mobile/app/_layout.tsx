import '../global.css';
import { useCallback, useEffect } from 'react';
import { Stack, router, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { colors } from '../theme/colors';
import { OnboardingProvider } from '../lib/onboarding';
import { StatsProvider } from '../lib/stats';
import { PurchasesProvider } from '../lib/purchases';
import { ProSync } from '../components/ProSync';
import { configureNotifications, addNotificationResponseListener } from '../lib/notifications';
import { configureAnalytics } from '../lib/analytics';
import { NotificationSync } from '../components/NotificationSync';
import { EngineSync } from '../components/EngineSync';
import { AnalyticsSync } from '../components/AnalyticsSync';

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
  // The native splash hands off to the custom JS splash in app/index.tsx, which
  // holds until persisted onboarding state loads, then redirects (onboarding vs
  // home). So we render the navigator immediately rather than gating on `ready`.
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
      <Stack.Screen name="weekly-report" options={{ headerShown: false }} />
      <Stack.Screen name="winddown" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="privacy" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    configureNotifications().catch(() => {});
    configureAnalytics().catch(() => {});
    // Route when a notification with a `data.url` is tapped (e.g. weekly report).
    const unsub = addNotificationResponseListener((url) => router.push(url as Href));
    return unsub;
  }, []);

  // Hand off the native splash to the JS splash (app/index.tsx) once the root
  // view has painted its first frame, so there's no white flash between them.
  const onLayoutRoot = useCallback(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRoot}>
      <SafeAreaProvider>
        <OnboardingProvider>
          <StatsProvider>
            <PurchasesProvider>
              <StatusBar style="light" />
              <NotificationSync />
              <EngineSync />
              <ProSync />
              <AnalyticsSync />
              <RootNavigator />
            </PurchasesProvider>
          </StatsProvider>
        </OnboardingProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
