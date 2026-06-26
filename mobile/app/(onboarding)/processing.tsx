import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import LottieView from 'lottie-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedReaction,
  withTiming,
  Easing,
  FadeIn,
} from 'react-native-reanimated';
import { runOnJS } from 'react-native-worklets';

const DURATION = 8000;
const STEPS = [
  'Reading your work apps',
  'Mapping your schedule',
  'Calibrating after-hours detection',
  'Tuning the breathing nudge',
  'Arming your boundary',
];

export default function Processing() {
  // One UI-thread animation drives everything (bar width, % text, checklist).
  const progress = useSharedValue(0);
  const [pct, setPct] = useState(0);
  const [step, setStep] = useState(0);

  useEffect(() => {
    progress.value = withTiming(1, { duration: DURATION, easing: Easing.linear });
  }, [progress]);

  // Mirror the shared value to JS state only when the rounded values change.
  useAnimatedReaction(
    () => Math.round(progress.value * 100),
    (cur, prev) => {
      if (cur !== prev) runOnJS(setPct)(cur);
    },
  );
  useAnimatedReaction(
    () => Math.min(STEPS.length, Math.floor(progress.value * STEPS.length)),
    (cur, prev) => {
      if (cur !== prev) runOnJS(setStep)(cur);
    },
  );


  // Block hardware back while "setting up".
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  const barStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

  // Re-enable to continue into the app after setup:
  void router;
  useEffect(() => { const t = setTimeout(() => router.replace('/home'), DURATION); return () => clearTimeout(t); }, []);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <Stack.Screen options={{ gestureEnabled: false }} />
      <View className="flex-1 justify-center gap-8 px-8">
        {/* Emblem + percent */}
        <View className="items-center gap-3">
          <View className="h-32 w-32 items-center justify-center">
            <LottieView
              source={require('../../assets/lottie/logo.json')}
              autoPlay
              loop
              style={{ width: 90, height: 90 }}
            />
          </View>
          <Text className="text-3xl font-black text-foreground">{pct}%</Text>
          <Text className="text-base font-semibold text-muted">Setting up your boundary…</Text>
        </View>



        {/* Progress bar */}
        <View className="h-2 w-full overflow-hidden rounded-full bg-elevated">
          <Animated.View className="h-full rounded-full bg-primary" style={barStyle} />
        </View>


        {/* "Generator" steps */}
        <View className="gap-3.5">
          {STEPS.map((label, i) => {
            const done = i < step;
            const active = i === step && step < STEPS.length;
            return (
              <View key={label} className="flex-row items-center gap-3">
                <View
                  className={`h-5 w-5 items-center justify-center overflow-hidden rounded-full ${
                    done ? 'bg-primary' : active ? 'bg-primary/15' : 'border border-border'
                  }`}>
                </View>
                <Text
                  className={`flex-1 text-base ${done || active ? 'font-semibold text-foreground' : 'text-subtle'}`}>
                  {label}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}
