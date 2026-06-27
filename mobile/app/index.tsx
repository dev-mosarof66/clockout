import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import LottieView from 'lottie-react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useOnboarding } from '../lib/onboarding';
import { colors } from '../theme/colors';

// Minimum time the branded splash stays up, so it reads as an intentional brand
// moment rather than a jarring flash when persisted state resolves instantly.
const MIN_SPLASH_MS = 1400;

// Entry gate + custom splash. We hold a branded loading screen until persisted
// onboarding state has loaded (and a minimum brand moment has elapsed), then
// route returning users straight to the app and newcomers into onboarding.
export default function Index() {
  const { data, ready } = useOnboarding();
  const [minElapsed, setMinElapsed] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMinElapsed(true), MIN_SPLASH_MS);
    return () => clearTimeout(t);
  }, []);

  if (ready && minElapsed) {
    return <Redirect href={data.onboarded ? '/home' : '/welcome'} />;
  }

  return (
    <View className="flex-1 items-center justify-center bg-background">
      <Animated.View entering={FadeIn.duration(500)} className="items-center">
        <LottieView
          source={require('../assets/lottie/logo.json')}
          autoPlay
          loop
          style={{ width: 112, height: 112 }}
        />
        <Text className="mt-6 text-4xl font-extrabold tracking-tight text-foreground">
          Clockout
        </Text>
        <Text className="mt-2 text-base font-medium text-muted">
          Reclaim your evenings.
        </Text>
      </Animated.View>

      {/* Bottom loader — spins until persisted state resolves, then we redirect. */}
      <Animated.View
        entering={FadeInDown.duration(500).delay(300)}
        className="absolute bottom-16 items-center"
      >
        <ActivityIndicator color={colors.primary} />
      </Animated.View>
    </View>
  );
}
