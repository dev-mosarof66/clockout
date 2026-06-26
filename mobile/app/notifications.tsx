import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { EmptyState } from '../components/EmptyState';
import { useStats, timeAgo } from '../lib/stats';
import { useOnboarding } from '../lib/onboarding';
import { colors } from '../theme/colors';

type Item = {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  title: string;
  body: string;
  ts: number;
  onPress?: () => void;
};

export default function Notifications() {
  const { events } = useStats();
  const { data } = useOnboarding();

  const items: Item[] = [];

  if (!data.protectionSetupDone) {
    items.push({
      id: 'setup',
      icon: 'shield-checkmark-outline',
      tint: colors.warning,
      title: 'Finish setting up protection',
      body: 'Grant a few permissions so Clockout can guard your evenings.',
      ts: Date.now(),
      onPress: () => router.replace('/protection'),
    });
  }

  for (const e of events) {
    const reclaimed = e.action === 'reclaimed';
    items.push({
      id: e.id,
      icon: reclaimed ? 'checkmark-circle' : 'open-outline',
      tint: reclaimed ? colors.success : colors.warning,
      title: reclaimed ? 'Evening reclaimed 🎉' : 'Opened after hours',
      body: reclaimed
        ? `You closed ${e.app} and reclaimed your evening.`
        : `You opened ${e.app} after work hours.`,
      ts: e.ts,
    });
  }

  items.sort((a, b) => b.ts - a.ts);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View className="flex-row items-center gap-3 px-6 pb-2 pt-1">
        <Pressable onPress={() => router.back()} hitSlop={10} className="active:opacity-70">
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text className="text-xl font-extrabold text-foreground">Notifications</Text>
      </View>

      {items.length === 0 ? (
        <View className="flex-1 justify-center px-6">
          <EmptyState message="No notifications yet. Your reclaimed evenings will show up here." />
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          alwaysBounceVertical
          overScrollMode="always"
          contentContainerStyle={{ paddingHorizontal: 24, gap: 10, paddingBottom: 24 }}>
          {items.map((n) => (
            <Pressable
              key={n.id}
              onPress={n.onPress}
              disabled={!n.onPress}
              className="flex-row items-center gap-3 rounded-2xl border border-border bg-card p-4 active:opacity-80">
              <View
                className="h-10 w-10 items-center justify-center rounded-full"
                style={{ backgroundColor: n.tint + '22' }}>
                <Ionicons name={n.icon} size={19} color={n.tint} />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold text-foreground">{n.title}</Text>
                <Text className="text-[12px] leading-snug text-muted">{n.body}</Text>
                <Text className="mt-0.5 text-[10px] text-subtle">{timeAgo(n.ts)}</Text>
              </View>
              {n.onPress && <Ionicons name="chevron-forward" size={16} color={colors.subtle} />}
            </Pressable>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
