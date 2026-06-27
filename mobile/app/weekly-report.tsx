import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useStats, computeWeeklyReport } from '../lib/stats';
import { colors } from '../theme/colors';

function StatCard({
  icon,
  tint,
  value,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  value: string;
  label: string;
}) {
  return (
    <View className="flex-1 gap-1.5 rounded-2xl border border-border bg-card p-4">
      <View className="h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: tint + '22' }}>
        <Ionicons name={icon} size={16} color={tint} />
      </View>
      <Text className="text-xl font-extrabold text-foreground">{value}</Text>
      <Text className="text-xs leading-snug text-muted">{label}</Text>
    </View>
  );
}

export default function WeeklyReport() {
  const { events } = useStats();
  const r = computeWeeklyReport(events);
  const max = Math.max(1, ...r.byDay.map((d) => d.count));

  const trend =
    r.prevReclaimed === 0
      ? r.reclaimed > 0
        ? 'New this week'
        : null
      : r.delta > 0
        ? `↑ ${r.delta} vs last week`
        : r.delta < 0
          ? `↓ ${Math.abs(r.delta)} vs last week`
          : 'Same as last week';

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View className="flex-row items-center gap-3 px-6 pb-2 pt-1">
        <Pressable onPress={() => router.back()} hitSlop={10} className="active:opacity-70">
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text className="text-xl font-extrabold text-foreground">Weekly report</Text>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, gap: 16, paddingBottom: 32 }}>
        {/* Hero */}
        <Animated.View
          entering={FadeInDown.duration(300)}
          className="items-center gap-1 rounded-2xl border border-border bg-card px-6 py-7">
          <Text className="text-xs font-black uppercase tracking-[3px] text-primary">
            Last 7 days
          </Text>
          <Text className="text-5xl font-extrabold text-foreground">{r.reclaimed}</Text>
          <Text className="text-sm text-muted">
            evening{r.reclaimed === 1 ? '' : 's'} reclaimed
          </Text>
          {trend && (
            <View className="mt-2 rounded-full bg-elevated px-3 py-1">
              <Text className="text-xs font-bold text-success">{trend}</Text>
            </View>
          )}
        </Animated.View>

        {/* 7-day bars */}
        <View className="gap-3 rounded-2xl border border-border bg-card p-5">
          <Text className="text-sm font-bold text-foreground">This week</Text>
          <View className="h-28 flex-row items-end justify-between gap-2">
            {r.byDay.map((d, i) => (
              <View key={i} className="flex-1 items-center gap-2">
                <View className="w-full flex-1 justify-end">
                  <View
                    className="w-full rounded-md"
                    style={{
                      height: `${Math.max(6, (d.count / max) * 100)}%`,
                      backgroundColor: d.count > 0 ? colors.primary : colors.elevated,
                    }}
                  />
                </View>
                <Text className="text-xs font-semibold text-subtle">{d.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Stats */}
        <View className="flex-row gap-3">
          <StatCard
            icon="time-outline"
            tint={colors.primary}
            value={`~${r.hours.toFixed(1)}h`}
            label="personal time won back (est.)"
          />
          <StatCard
            icon="shield-checkmark-outline"
            tint={colors.success}
            value={`${Math.round(r.reclaimRate * 100)}%`}
            label="of nudges you reclaimed"
          />
        </View>
        <View className="flex-row gap-3">
          <StatCard
            icon="moon-outline"
            tint={colors.warning}
            value={`${r.opened}`}
            label="opened anyway — no judgment"
          />
          <StatCard
            icon="sparkles-outline"
            tint={colors.primary}
            value={r.bestDayLabel ? r.bestDayLabel.slice(0, 3) : '—'}
            label="your strongest day"
          />
        </View>

        {r.totalNudges === 0 && (
          <Text className="px-1 text-center text-xs leading-relaxed text-muted">
            No after-hours nudges yet this week. When Clockout catches a work app after hours,
            your reclaimed evenings show up here.
          </Text>
        )}

        <View className="flex-row items-start gap-2 px-1">
          <Ionicons name="information-circle-outline" size={14} color={colors.subtle} />
          <Text className="flex-1 text-xs leading-relaxed text-subtle">
            Hours are an estimate (~{25} min of focus protected per reclaimed evening), computed
            on-device from your nudge history.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
