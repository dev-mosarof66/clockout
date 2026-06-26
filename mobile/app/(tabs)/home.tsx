import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import LottieView from 'lottie-react-native';
import { useOnboarding } from '../../lib/onboarding';
import { useStats, computeSummary, timeAgo } from '../../lib/stats';
import { WORK_APPS } from '../../data/workApps';
import { colors } from '../../theme/colors';
import { TAB_BAR_SPACE } from '../../components/TabBar';
import { MiniChart } from '../../components/MiniChart';
import { AppIcon } from '../../components/AppIcon';
import { EmptyState } from '../../components/EmptyState';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const fmt = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const ap = h >= 12 ? 'PM' : 'AM';
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${m.toString().padStart(2, '0')} ${ap}`;
};
const fmtDur = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};
const greeting = (h: number) =>
  h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';

const APP_LOOKUP = Object.fromEntries(WORK_APPS.map((a) => [a.id, a]));
const resolveApp = (id: string) =>
  APP_LOOKUP[id] ?? {
    id,
    name: id.replace(/^custom-/, '').replace(/-/g, ' '),
    category: 'Custom',
    color: '#525252',
  };

function Ring({
  progress,
  accent,
  size = 104,
  stroke = 6,
  children,
}: {
  progress: number;
  accent: string;
  size?: number;
  stroke?: number;
  children: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(1, progress));
  return (
    <View style={{ width: size, height: size }} className="items-center justify-center">
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.elevated}
          strokeWidth={stroke}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={accent}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - p)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {children}
    </View>
  );
}

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
    <View className="h-24 flex-1 flex-row items-center justify-between gap-1.5 rounded-2xl border border-border bg-card p-3">
      <View className="flex h-full justify-between">
        <Text className="text-[10px] font-bold uppercase tracking-wider text-muted">{label}</Text>
        <Text className="text-2xl font-black" style={{ color: tint }}>
          {value}
        </Text>
      </View>
      <View
        className="flex items-center justify-center rounded-full p-1"
        style={{
          backgroundColor: tint + '20',
          borderWidth: 1,
          borderColor: tint + '50',
        }}>
        <Ionicons name={icon} size={16} color={tint} />
      </View>
    </View>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <Text className="text-sm font-bold uppercase tracking-widest text-muted">{children}</Text>;
}

function Chip({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-1 flex-col items-center justify-center gap-4 rounded-2xl border border-border bg-card py-3.5 active:opacity-80">
      <Ionicons name={icon} size={18} color={colors.primary} />
      <Text className="text-sm font-bold text-foreground">{label}</Text>
    </Pressable>
  );
}

export default function Home() {
  const { width } = useWindowDimensions();
  const { data, update } = useOnboarding();
  const sched = data.schedule;

  // First-visit confetti.
  const [confetti, setConfetti] = useState(false);
  useEffect(() => {
    if (!data.celebrated) {
      setConfetti(true);
      update({ celebrated: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep live status fresh.
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(id);
  }, []);

  const now = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();
  const day = now.getDay();
  const isWorkDay = !!sched?.days.includes(day);
  const working = !!sched && isWorkDay && mins >= sched.start && mins < sched.end;
  const accent = working ? colors.warning : colors.success;

  const nextStart = () => {
    if (!sched) return '—';
    for (let i = 0; i < 8; i++) {
      const d = (day + i) % 7;
      if (!sched.days.includes(d)) continue;
      if (i === 0 && mins >= sched.start) continue;
      const when = i === 0 ? 'today' : i === 1 ? 'tomorrow' : DAY_NAMES[d];
      return `${when} ${fmt(sched.start)}`;
    }
    return '—';
  };

  const progress =
    working && sched ? (mins - sched.start) / Math.max(1, sched.end - sched.start) : 1;

  const { events } = useStats();
  const summary = computeSummary(events);
  const recent = events.slice(0, 3);
  const guarded = data.workApps.map(resolveApp);
  const chartWidth = width - 24 * 2 - 20 * 2; // screen padding + card padding

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 pb-3 pt-1">
        <View className="flex-row items-center gap-3">
          <View
            className="h-11 w-11 items-center justify-center rounded-full border border-border bg-card"
            style={{ borderColor: accent + '55' }}>
            <Ionicons name="person" size={20} color={colors.muted} />
          </View>
          <View>
            <Text className="text-base font-extrabold text-foreground">
              {greeting(now.getHours())}
            </Text>
            <Text className="text-xs text-muted">
              {working ? 'You’re on the clock' : 'You’re clocked out'}
            </Text>
          </View>
        </View>
        <Pressable
          onPress={() => router.push('/notifications')}
          className="h-11 w-11 items-center justify-center rounded-full border border-border bg-card active:opacity-80">
          <Ionicons name="notifications-outline" size={20} color={colors.foreground} />
          {(events.length > 0 || !data.protectionSetupDone) && (
            <View className="absolute right-3 top-3 h-2 w-2 rounded-full bg-primary" />
          )}
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        alwaysBounceVertical
        overScrollMode="always"
        contentContainerStyle={{
          paddingHorizontal: 24,
          gap: 24,
          paddingBottom: TAB_BAR_SPACE + 50,
        }}>
        {/* Setup banner */}
        {!data.protectionSetupDone && (
          <Pressable
            onPress={() => router.push('/protection')}
            className="flex-row items-center gap-3 rounded-2xl border p-4 active:opacity-80"
            style={{ borderColor: colors.warning + '40', backgroundColor: colors.warning + '12' }}>
            <Ionicons name="warning-outline" size={18} color={colors.warning} />
            <View className="flex-1">
              <Text className="text-sm font-bold text-foreground">Finish setting up protection</Text>
              <Text className="text-[11px] text-muted">
                Grant a few permissions so Clockout can guard your evenings.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.warning} />
          </Pressable>
        )}

        {/* Hero card */}
        <View className="flex-row items-center gap-5 overflow-hidden rounded-2xl border border-border bg-card p-5">
          <LinearGradient
            colors={[accent + '22', 'transparent']}
            style={styles.heroGlow}
            pointerEvents="none"
          />
          <Ring progress={progress} accent={accent}>
            <Ionicons name={working ? 'sunny' : 'moon'} size={26} color={accent} />
          </Ring>
          <View className="flex-1 gap-1">
            <View
              className="self-start rounded-full px-2.5 py-1"
              style={{ backgroundColor: accent + '1A' }}>
              <Text
                className="text-[9px] font-black uppercase tracking-widest"
                style={{ color: accent }}>
                {working ? 'Work mode' : 'Boundary on'}
              </Text>
            </View>
            <Text className="text-2xl font-black text-foreground">
              {working && sched ? fmtDur(sched.end - mins) : 'Clocked out'}
            </Text>
            <Text className="text-[11px] font-bold uppercase tracking-wider text-muted">
              {working ? 'until clock-out' : 'guarded'}
            </Text>
            <Text className="text-xs leading-snug text-muted">
              {!sched
                ? 'No schedule set'
                : working
                  ? `Activates ${fmt(sched.end)}`
                  : `Resumes ${nextStart()}`}
            </Text>
          </View>
        </View>

        {/* 3 stats */}
        <View className="flex-row gap-3">
          <StatCard
            icon="moon"
            tint={colors.success}
            value={`${summary.reclaimedThisWeek}`}
            label="This week"
          />
          <StatCard icon="flame" tint={colors.primary} value={`${summary.streak}`} label="Streak" />
          <StatCard
            icon="trophy"
            tint={colors.warning}
            value={`${summary.total}`}
            label="All-time"
          />
        </View>

        {/* Activity graph */}
        <View className="gap-3 rounded-2xl border border-border bg-card p-5">
          <View className="flex-row items-start justify-between">
            <View>
              <SectionTitle>Evenings reclaimed</SectionTitle>
              <Text className="mt-0.5 text-[11px] text-subtle">Last 7 days</Text>
            </View>
            <Text className="text-2xl font-black text-primary">{summary.reclaimedThisWeek}</Text>
          </View>
          <MiniChart
            data={summary.last7.map((d) => d.count)}
            width={chartWidth}
            height={120}
            color={colors.primary}
          />
          <View className="flex-row justify-between">
            {summary.last7.map((d, i) => (
              <Text key={i} className="flex-1 text-center text-[10px] font-semibold text-subtle">
                {d.label}
              </Text>
            ))}
          </View>
        </View>

        {/* Quick actions */}
        <View className="gap-3">
          <SectionTitle>Quick actions</SectionTitle>
          <View className="flex-row gap-3">
            <Chip icon="moon" label="Test nudge" onPress={() => router.push('/nudge')} />
            <Chip
              icon="settings-outline"
              label="Settings"
              onPress={() => router.push('/settings')}
            />
          </View>
        </View>

        {/* Guarded apps */}
        <View className="gap-3">
          <View className="flex-row items-center justify-between">
            <SectionTitle>Guarded apps</SectionTitle>
            <Text className="text-xs font-bold text-primary">{guarded.length}</Text>
          </View>
          <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
            <View className="py-6">
              {guarded.length === 0 ? (
                <Text className="text-sm text-muted">No apps selected.</Text>
              ) : (
                <View className="flex-row flex-wrap gap-4">
                  {guarded.map((app) => (
                    <AppIcon key={app.id} id={app.id} name={app.name} color={app.color} size={40} />
                  ))}
                </View>
              )}
            </View>
          </ScrollView>
        </View>

        {/* Recent activity */}
        <View className="gap-3">
          <SectionTitle>Recent activity</SectionTitle>
          {recent.length === 0 ? (
            <EmptyState message="No activity yet. Try the nudge to get started." />
          ) : (
            <View className="gap-2.5">
              {recent.map((e) => {
                const reclaimed = e.action === 'reclaimed';
                return (
                  <View
                    key={e.id}
                    className="flex-row items-center gap-3 rounded-2xl border border-border bg-card p-3">
                    <View
                      className="h-8 w-8 items-center justify-center rounded-full"
                      style={{
                        backgroundColor: (reclaimed ? colors.success : colors.warning) + '22',
                      }}>
                      <Text
                        className="text-xs font-black"
                        style={{ color: reclaimed ? colors.success : colors.warning }}>
                        {reclaimed ? '✓' : '!'}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-foreground">
                        {reclaimed ? 'Reclaimed' : 'Opened'} {e.app}
                      </Text>
                      <Text className="text-[11px] text-muted">{timeAgo(e.ts)}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* First-visit confetti */}
      {confetti && (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <LottieView
            source={require('../../assets/lottie/confetti.json')}
            autoPlay
            loop={false}
            resizeMode="cover"
            style={StyleSheet.absoluteFill}
            onAnimationFinish={() => setConfetti(false)}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  heroGlow: { position: 'absolute', top: 0, left: 0, right: 0, height: 120 },
});
