import { useState } from 'react';
import { View, Text, ScrollView, Switch, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { Button } from '../../components/Button';
import { ScheduleModal } from '../../components/ScheduleModal';
import { AppsModal } from '../../components/AppsModal';
import { useOnboarding } from '../../lib/onboarding';
import { useStats } from '../../lib/stats';
import { colors } from '../../theme/colors';
import { TAB_BAR_SPACE } from '../../components/TabBar';

const DAY2 = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const fmt = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const ap = h >= 12 ? 'PM' : 'AM';
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${m.toString().padStart(2, '0')} ${ap}`;
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="gap-2">
      <Text className="px-1 text-sm font-bold uppercase tracking-widest text-muted">{title}</Text>
      <View className="overflow-hidden rounded-2xl border border-border bg-card">{children}</View>
    </View>
  );
}

function Row({
  icon,
  tint = colors.muted,
  label,
  value,
  onPress,
  last = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  tint?: string;
  label: string;
  value?: string;
  onPress?: () => void;
  last?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      className={`flex-row items-center gap-3 px-4 py-3.5 active:opacity-70 ${last ? '' : 'border-b border-border'}`}>
      <View className="h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: tint + '22' }}>
        <Ionicons name={icon} size={17} color={tint} />
      </View>
      <Text className="flex-1 text-sm font-semibold text-foreground">{label}</Text>
      {value && <Text className="text-sm text-muted">{value}</Text>}
      {onPress && <Ionicons name="chevron-forward" size={16} color={colors.subtle} />}
    </Pressable>
  );
}

function ToggleRow({
  icon,
  tint = colors.primary,
  label,
  desc,
  value,
  onValueChange,
  disabled,
  badge,
  last = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  tint?: string;
  label: string;
  desc?: string;
  value: boolean;
  onValueChange: () => void;
  disabled?: boolean;
  badge?: string;
  last?: boolean;
}) {
  return (
    <View className={`flex-row items-center gap-3 px-4 py-3 ${last ? '' : 'border-b border-border'}`}>
      <View className="h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: tint + '22' }}>
        <Ionicons name={icon} size={17} color={tint} />
      </View>
      <View className="flex-1">
        <View className="flex-row items-center gap-1.5">
          <Text className="text-sm font-semibold text-foreground">{label}</Text>
          {badge && (
            <Text className="text-[9px] font-black uppercase tracking-wider text-primary">{badge}</Text>
          )}
        </View>
        {desc && <Text className="text-[11px] text-muted">{desc}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: colors.elevated, true: colors.primary }}
        thumbColor={colors.foreground}
      />
    </View>
  );
}

export default function Settings() {
  const { data, update, reset } = useOnboarding();
  const { clear: clearStats } = useStats();
  const s = data.schedule;
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [appsOpen, setAppsOpen] = useState(false);

  const toggleStrict = () => {
    if (!data.pro) return;
    update({ strict: !data.strict });
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top','bottom']}>
      {/* Header */}
      <View className="px-6 pb-3 pt-1">
        <Text className="text-2xl font-extrabold text-foreground">Settings</Text>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        alwaysBounceVertical
        overScrollMode="always"
        contentContainerStyle={{ paddingHorizontal: 24, gap: 20, paddingBottom: TAB_BAR_SPACE + 24 }}>
        {/* Plan hero */}
        <View className="overflow-hidden rounded-2xl border border-border bg-card p-5">
          {data.pro && (
            <LinearGradient
              colors={[colors.primary + '24', 'transparent']}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 90 }}
              pointerEvents="none"
            />
          )}
          <View className="flex-row items-center gap-3">
            <View className="h-11 w-11 items-center justify-center">
              <LottieView
                source={require('../../assets/lottie/logo.json')}
                autoPlay
                loop
                style={{ width: 44, height: 44 }}
              />
            </View>
            <View className="flex-1">
              <Text className="text-base font-extrabold text-foreground">
                Clockout {data.pro ? 'Pro' : 'Free'}
              </Text>
              <Text className="text-xs text-muted">
                {data.pro
                  ? data.founder
                    ? 'Founder · $4.99/mo for life'
                    : 'Pro trial active'
                  : 'Free plan'}
              </Text>
            </View>
            {!data.pro && (
              <Button
                label="Upgrade"
                size="sm"
                fullWidth={false}
                onPress={() => router.push('/paywall')}
              />
            )}
          </View>
        </View>

        {/* Account */}
        <Section title="Account">
          <Row
            icon="person-circle-outline"
            tint={colors.primary}
            label="Manage account"
            onPress={() => {}}
            last
          />
        </Section>

        {/* Protection */}
        <Section title="Protection">
          <Row
            icon="shield-checkmark-outline"
            tint={colors.warning}
            label="Permissions setup"
            value={data.protectionSetupDone ? 'Done' : 'Pending'}
            onPress={() => router.push('/protection')}
            last
          />
        </Section>

        {/* Boundary */}
        <Section title="Boundary">
          <Row
            icon="time-outline"
            tint={colors.warning}
            label="Work hours"
            value={s ? `${fmt(s.start)} – ${fmt(s.end)}` : 'Not set'}
            onPress={() => setScheduleOpen(true)}
          />
          {/* Working days — overlapping 2-letter day chips */}
          <Pressable
            onPress={() => setScheduleOpen(true)}
            className="flex-row items-center gap-3 border-b border-border px-4 py-3.5 active:opacity-70">
            <View
              className="h-9 w-9 items-center justify-center rounded-xl"
              style={{ backgroundColor: colors.success + '22' }}>
              <Ionicons name="calendar-outline" size={17} color={colors.success} />
            </View>
            <Text className="flex-1 text-sm font-semibold text-foreground">Working days</Text>
            {s && s.days.length > 0 ? (
              <View className="flex-row items-center pr-1">
                {[...s.days]
                  .sort((a, b) => a - b)
                  .map((d, idx) => (
                    <View
                      key={d}
                      className="h-7 w-7 items-center justify-center rounded-full border-2 bg-primary"
                      style={{ marginLeft: idx === 0 ? 0 : -8, borderColor: colors.card }}>
                      <Text className="text-[9px] font-black text-primary-foreground">{DAY2[d]}</Text>
                    </View>
                  ))}
              </View>
            ) : (
              <Text className="text-sm text-muted">Not set</Text>
            )}
            <Ionicons name="chevron-forward" size={16} color={colors.subtle} />
          </Pressable>
          <ToggleRow
            icon={data.strict && data.pro ? 'lock-closed' : 'lock-open-outline'}
            label="Strict Mode"
            desc="Removes “open anyway” after hours."
            badge={!data.pro ? 'Pro' : undefined}
            value={data.strict && data.pro}
            onValueChange={toggleStrict}
            disabled={!data.pro}
            last
          />
        </Section>

        {/* Apps */}
        <Section title="Apps">
          <Row
            icon="apps-outline"
            tint={colors.primary}
            label="Guarded work apps"
            value={`${data.workApps.length}`}
            onPress={() => setAppsOpen(true)}
            last
          />
        </Section>

        {/* Notifications */}
        <Section title="Notifications">
          <ToggleRow
            icon="notifications-outline"
            label="Clock-out reminder"
            desc="“You’re clocked out 🎉” at end of workday."
            value={data.notifyClockout}
            onValueChange={() => update({ notifyClockout: !data.notifyClockout })}
            last
          />
        </Section>

        {/* Privacy & about */}
        <Section title="Privacy & about">
          <Row icon="shield-checkmark-outline" tint={colors.success} label="Data" value="On-device" />
          <Row icon="document-text-outline" label="Privacy policy" onPress={() => {}} />
          <Row icon="star-outline" label="Rate Clockout" onPress={() => {}} />
          <Row icon="information-circle-outline" label="Version" value="1.0.0" last />
        </Section>

        {/* Danger zone */}
        <Pressable
          onPress={() => {
            reset();
            clearStats();
            router.replace('/welcome');
          }}
          className="flex-row items-center justify-center gap-2 rounded-2xl border border-destructive/30 py-3.5 active:opacity-70">
          <Ionicons name="trash-outline" size={16} color={colors.destructive} />
          <Text className="text-sm font-bold" style={{ color: colors.destructive }}>
            Reset onboarding (dev)
          </Text>
        </Pressable>

        <Text className="text-center text-[11px] text-subtle">Clockout · on-device · private</Text>
      </ScrollView>

      <ScheduleModal visible={scheduleOpen} onClose={() => setScheduleOpen(false)} />
      <AppsModal visible={appsOpen} onClose={() => setAppsOpen(false)} />
    </SafeAreaView>
  );
}
