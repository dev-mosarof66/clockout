import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components/Button';
import { useOnboarding } from '../../lib/onboarding';
import { colors } from '../../theme/colors';

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const fmt = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const ap = h >= 12 ? 'PM' : 'AM';
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${m.toString().padStart(2, '0')} ${ap}`;
};
const wrap = (mins: number) => ((mins % 1440) + 1440) % 1440;

function TimeCard({
  icon,
  tint,
  label,
  value,
  onChange,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  label: string;
  value: number;
  onChange: (next: number) => void;
}) {
  return (
    <View className="flex-1 items-center gap-2 rounded-3xl border border-border bg-card p-4">
      <View
        className="h-10 w-10 items-center justify-center rounded-full"
        style={{ backgroundColor: tint + '22' }}>
        <Ionicons name={icon} size={20} color={tint} />
      </View>
      <Text className="text-[10px] font-bold uppercase tracking-widest text-muted">{label}</Text>
      <Text className="text-xl font-black text-foreground">{fmt(value)}</Text>
      <View className="mt-1 flex-row items-center gap-3">
        <Pressable
          onPress={() => onChange(wrap(value - 30))}
          hitSlop={8}
          className="h-9 w-9 items-center justify-center rounded-full border border-border active:opacity-70">
          <Text className="text-lg font-black text-foreground">−</Text>
        </Pressable>
        <Pressable
          onPress={() => onChange(wrap(value + 30))}
          hitSlop={8}
          className="h-9 w-9 items-center justify-center rounded-full border border-border active:opacity-70">
          <Text className="text-lg font-black text-foreground">+</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View className="flex-row items-center gap-1.5">
      <View className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      <Text className="text-[10px] font-semibold text-muted">{label}</Text>
    </View>
  );
}

export default function WorkHours() {
  const inset = useSafeAreaInsets();
  const { data, update } = useOnboarding();
  const [start, setStart] = useState(data.schedule?.start ?? 9 * 60); // 9:00 AM
  const [end, setEnd] = useState(data.schedule?.end ?? 18 * 60); // 6:00 PM
  const [days, setDays] = useState<number[]>(data.schedule?.days ?? [1, 2, 3, 4, 5]); // Mon–Fri

  const toggleDay = (i: number) =>
    setDays((d) => (d.includes(i) ? d.filter((x) => x !== i) : [...d, i].sort()));

  const startPct = (start / 1440) * 100;
  const workPct = Math.max(0, end - start) / 1440 * 100;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <View className="flex-1 px-6 pt-2">
        {/* Header */}
        <View className="gap-1.5 pb-5">
          <View className="flex-row items-center gap-1.5">
            <View className="h-1.5 w-6 rounded-full bg-primary" />
            <View className="h-1.5 w-6 rounded-full bg-primary" />
            <View className="h-1.5 w-6 rounded-full bg-border" />
            <Text className="ml-1 text-[11px] font-bold uppercase tracking-widest text-muted">
              Step 2 of 3
            </Text>
          </View>
          <Text className="text-2xl font-extrabold text-foreground">When do you work?</Text>
          <Text className="text-sm leading-relaxed text-muted">
            Clockout guards your time outside these hours. You can fine-tune this later.
          </Text>
        </View>

        {/* Time cards */}
        <View className="flex-row gap-3">
          <TimeCard icon="sunny" tint={colors.warning} label="Starts" value={start} onChange={setStart} />
          <TimeCard icon="moon" tint={colors.primary} label="Ends" value={end} onChange={setEnd} />
        </View>

        {/* 24h boundary timeline */}
        <View className="mt-3 gap-3 rounded-3xl border border-border bg-card p-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-[10px] font-bold uppercase tracking-widest text-muted">
              Your day
            </Text>
            <View className="flex-row gap-3">
              <Legend color={colors.warning} label="Work" />
              <Legend color={colors.success} label="Guarded" />
            </View>
          </View>

          <View
            className="h-3 w-full overflow-hidden rounded-full"
            style={{ backgroundColor: colors.success + '33' }}>
            <View
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: `${startPct}%`,
                width: `${workPct}%`,
                backgroundColor: colors.warning,
                borderRadius: 999,
              }}
            />
          </View>

          <View className="flex-row justify-between">
            {['12a', '6a', '12p', '6p', '12a'].map((t, i) => (
              <Text key={i} className="text-[9px] text-subtle">
                {t}
              </Text>
            ))}
          </View>

          <Text className="text-[11px] leading-relaxed text-muted">
            Guarded{' '}
            <Text className="font-bold text-foreground">
              {fmt(end)} → {fmt(start)}
            </Text>
            {' · '}
            {days.length === 0 ? 'no days' : `${days.length} day${days.length > 1 ? 's' : ''}`}
          </Text>
        </View>

        {/* Days */}
        <View className="mt-6 gap-3">
          <Text className="text-xs font-bold uppercase tracking-widest text-muted">Working days</Text>
          <View className="flex-row justify-between">
            {DAYS.map((d, i) => {
              const on = days.includes(i);
              return (
                <Pressable
                  key={i}
                  onPress={() => toggleDay(i)}
                  className={`h-11 w-11 items-center justify-center rounded-full active:opacity-80 ${
                    on ? 'bg-primary' : 'border border-border bg-card'
                  }`}>
                  <Text
                    className={`text-sm font-black ${on ? 'text-primary-foreground' : 'text-muted'}`}>
                    {d}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="flex-1" />

        <View className="gap-2" style={{ paddingBottom: inset.bottom - 50 }}>
          <Button
            label="Continue"
            disabled={days.length === 0}
            onPress={() => {
              update({ schedule: { start, end, days } });
              router.push('/paywall');
            }}
          />
          <Button label="Back" variant="ghost" onPress={() => router.back()} />
        </View>
      </View>
    </SafeAreaView>
  );
}
