import { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Button } from '../../components/Button';
import { Nudge } from '../../components/Nudge';
import { TAB_BAR_SPACE } from '../../components/TabBar';
import { useOnboarding } from '../../lib/onboarding';
import { useStats, computeSummary } from '../../lib/stats';
import { WORK_APPS } from '../../data/workApps';
import { colors } from '../../theme/colors';

const APP_NAME = Object.fromEntries(WORK_APPS.map((a) => [a.id, a.name]));
const resolveName = (id: string) =>
  APP_NAME[id] ?? id.replace(/^custom-/, '').replace(/-/g, ' ');
const nowTime = () => {
  const d = new Date();
  const h = d.getHours();
  const m = d.getMinutes();
  const ap = h >= 12 ? 'PM' : 'AM';
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${m.toString().padStart(2, '0')} ${ap}`;
};

function HowRow({
  icon,
  title,
  desc,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  desc: string;
}) {
  return (
    <View className="flex-row items-start gap-3">
      <View className="h-8 w-8 items-center justify-center rounded-lg bg-primary/15">
        <Ionicons name={icon} size={16} color={colors.primary} />
      </View>
      <View className="flex-1">
        <Text className="text-sm font-bold text-foreground">{title}</Text>
        <Text className="text-[12px] leading-snug text-muted">{desc}</Text>
      </View>
    </View>
  );
}

export default function NudgeTab() {
  const { data } = useOnboarding();
  const { add, events } = useStats();
  const summary = computeSummary(events);
  const [open, setOpen] = useState(false);
  const [howOpen, setHowOpen] = useState(true);

  const strict = data.strict && data.pro;

  // Use the user's real guarded apps + current time so the preview isn't fake.
  const apps = data.workApps.map(resolveName);
  const time = nowTime();
  const [previewApp, setPreviewApp] = useState(() => apps[0] ?? 'Slack');

  const launch = () => {
    if (apps.length) setPreviewApp(apps[Math.floor(Math.random() * apps.length)]);
    setOpen(true);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center gap-3 px-6 pb-3 pt-1">
        <View
          className="h-11 w-11 items-center justify-center rounded-full border border-border bg-card"
          style={{ borderColor: colors.primary + '55' }}>
          <Ionicons name="moon" size={20} color={colors.primary} />
        </View>
        <View>
          <Text className="text-xl font-extrabold text-foreground">After-hours nudge</Text>
          <Text className="text-xs text-muted">A calm breath before you slip back in</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 6, gap: 18, paddingBottom: TAB_BAR_SPACE + 50 }}>
        {/* How it works (collapsible) */}
        <View className="overflow-hidden rounded-2xl border border-border bg-card">
          <Pressable
            onPress={() => setHowOpen((v) => !v)}
            className="flex-row items-center justify-between p-4 active:opacity-80">
            <View className="flex-row items-center gap-2">
              <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
              <Text className="text-sm font-bold text-foreground">How it works</Text>
            </View>
            <Ionicons
              name="chevron-down"
              size={18}
              color={colors.muted}
              style={{ transform: [{ rotate: howOpen ? '180deg' : '0deg' }] }}
            />
          </Pressable>
          {howOpen && (
            <Animated.View entering={FadeIn.duration(180)} className="gap-3.5 px-4 pb-4">
              <HowRow
                icon="pause-circle-outline"
                title="A 3-second pause"
                desc="A short breath interrupts the autopilot reach for Slack."
              />
              <HowRow
                icon="hand-left-outline"
                title="A gentle choice"
                desc="Reclaim your evening, or open anyway — your call, never a hard wall."
              />
              <HowRow
                icon="trending-down-outline"
                title="Proven to work"
                desc="A brief pause cuts after-hours app opens by ~57% (PNAS 2023)."
              />
            </Animated.View>
          )}
        </View>

        {/* Nudge preview card (launcher) */}
        <Pressable
          onPress={launch}
          className="overflow-hidden rounded-2xl border border-border active:opacity-90">
          <View className="items-center gap-3 bg-background px-6 py-7">
            <Text className="text-[10px] font-black uppercase tracking-[3px] text-primary">
              Boundary enforced
            </Text>
            <Text className="text-center text-xl font-extrabold text-foreground">
              It’s {time}. Work’s done.
            </Text>
            <Text className="text-center text-xs text-muted">
              Sure you want to open {previewApp}?
            </Text>

            <View className="my-1 h-28 w-28 items-center justify-center">
              <LottieView
                source={require('../../assets/lottie/breathe.json')}
                autoPlay
                loop
                style={{ width: '100%', height: '100%' }}
              />
            </View>

            <View className="w-full gap-2">
              <View className="items-center rounded-2xl bg-primary py-3">
                <Text className="text-xs font-black uppercase tracking-wider text-primary-foreground">
                  Close &amp; reclaim my evening
                </Text>
              </View>
              <View className="items-center py-1">
                <Text className="text-[11px] font-bold text-muted">Open anyway</Text>
              </View>
            </View>
          </View>

          <View className="flex-row items-center justify-center gap-1.5 border-t border-border bg-card py-2.5">
            <Ionicons name="play-circle" size={14} color={colors.primary} />
            <Text className="text-[11px] font-bold text-primary">Tap to preview the full nudge</Text>
          </View>
        </Pressable>

        {/* Live reclaim stat */}
        {summary.total > 0 && (
          <View className="flex-row items-center gap-3 rounded-2xl border border-border bg-card p-4">
            <View className="h-9 w-9 items-center justify-center rounded-full bg-success/15">
              <Ionicons name="moon" size={18} color={colors.success} />
            </View>
            <Text className="flex-1 text-sm text-foreground">
              You’ve reclaimed <Text className="font-black text-success">{summary.total}</Text> evening
              {summary.total === 1 ? '' : 's'} so far.
            </Text>
          </View>
        )}

        {/* Strict mode */}
        <View className="flex-row items-center gap-3 rounded-2xl border border-border bg-card p-4">
          <Ionicons
            name={strict ? 'lock-closed' : 'lock-open-outline'}
            size={18}
            color={strict ? colors.primary : colors.muted}
          />
          <Text className="flex-1 text-xs leading-relaxed text-muted">
            Strict Mode is <Text className="font-bold text-foreground">{strict ? 'on' : 'off'}</Text>
            {strict
              ? ' — “open anyway” is hidden during the nudge.'
              : ' — toggle it in Settings (Pro) to remove the escape hatch.'}
          </Text>
        </View>

        {/* CTA */}
        <Button label="Preview the nudge" onPress={launch} />
      </ScrollView>

      <Nudge
        visible={open}
        appName={previewApp}
        time={time}
        strict={strict}
        onClose={(action) => {
          setOpen(false);
          if (action) add(previewApp, action);
        }}
      />
    </SafeAreaView>
  );
}
