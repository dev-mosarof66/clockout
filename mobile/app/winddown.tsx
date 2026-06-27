import { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { colors } from '../theme/colors';

type Step = { icon: keyof typeof Ionicons.glyphMap; title: string; desc: string };

const STEPS: Step[] = [
  { icon: 'laptop-outline', title: 'Close the laptop', desc: 'Physically shut the lid. The day is over.' },
  { icon: 'chatbubble-ellipses-outline', title: 'Set yourself to away', desc: 'Flip Slack / Teams status — no one expects you now.' },
  { icon: 'moon-outline', title: 'Turn on Do Not Disturb', desc: 'Mute work pings until tomorrow morning.' },
  { icon: 'walk-outline', title: 'Step away', desc: 'Leave the desk. Go be a person.' },
];

export default function WindDown() {
  const [done, setDone] = useState<Record<number, boolean>>({});
  const completed = Object.values(done).filter(Boolean).length;
  const toggle = (i: number) => setDone((d) => ({ ...d, [i]: !d[i] }));

  const finish = () => router.replace('/home');

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View className="flex-row items-center gap-3 px-6 pb-1 pt-1">
        <Pressable onPress={() => router.back()} hitSlop={10} className="active:opacity-70">
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text className="text-xl font-extrabold text-foreground">Wind down</Text>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}>
        {/* Breathing intro */}
        <Animated.View entering={FadeIn.duration(400)} className="items-center gap-2 pb-2 pt-2">
          <View className="h-36 w-36 items-center justify-center">
            <LottieView
              source={require('../assets/lottie/breathe.json')}
              autoPlay
              loop
              style={{ width: '100%', height: '100%' }}
            />
          </View>
          <Text className="text-xs font-black uppercase tracking-[3px] text-primary">
            Clock out for real
          </Text>
          <Text className="text-center text-2xl font-extrabold text-foreground">
            A few small things to let go.
          </Text>
          <Text className="text-center text-sm leading-relaxed text-muted">
            Not a checklist to ace — just gentle cues to close the workday in your body, not only
            your calendar.
          </Text>
        </Animated.View>

        {/* Steps */}
        <View className="gap-2.5 pt-4">
          {STEPS.map((s, i) => {
            const on = !!done[i];
            return (
              <Pressable
                key={i}
                onPress={() => toggle(i)}
                className={`flex-row items-center gap-3 rounded-2xl border p-3.5 active:opacity-80 ${
                  on ? 'border-primary/40 bg-primary/10' : 'border-border bg-card'
                }`}>
                <View
                  className="h-10 w-10 items-center justify-center rounded-xl"
                  style={{ backgroundColor: (on ? colors.primary : colors.muted) + '22' }}>
                  <Ionicons name={s.icon} size={19} color={on ? colors.primary : colors.muted} />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-foreground">{s.title}</Text>
                  <Text className="text-xs leading-snug text-muted">{s.desc}</Text>
                </View>
                <View
                  className={`h-6 w-6 items-center justify-center rounded-full border ${
                    on ? 'border-primary bg-primary' : 'border-border'
                  }`}>
                  {on && <Ionicons name="checkmark" size={14} color={colors.primaryForeground} />}
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* Footer */}
      <Animated.View entering={FadeInDown.duration(300)} className="gap-2 px-6 pb-2 pt-3">
        <Pressable
          onPress={finish}
          className="items-center rounded-2xl bg-primary py-4 active:opacity-90">
          <Text className="text-sm font-black uppercase tracking-wider text-primary-foreground">
            {completed === STEPS.length ? 'Good night 🌙' : "I'm done for today"}
          </Text>
        </Pressable>
        <Text className="text-center text-xs text-subtle">
          {completed}/{STEPS.length} done · your evening is yours now
        </Text>
      </Animated.View>
    </SafeAreaView>
  );
}
