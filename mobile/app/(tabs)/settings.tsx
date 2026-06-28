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
import { BoundaryModal } from '../../components/BoundaryModal';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { useOnboarding } from '../../lib/onboarding';
import { usePurchases } from '../../lib/purchases';
import { useStats } from '../../lib/stats';
import { drainEvents } from '../../lib/engine';
import { requestCalendarPermission } from '../../lib/calendar';
import { capture } from '../../lib/analytics';
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
  badge,
  onPress,
  last = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  tint?: string;
  label: string;
  value?: string;
  badge?: string;
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
      {badge && (
        <Text className="text-xs font-black uppercase tracking-wider text-primary">{badge}</Text>
      )}
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
            <Text className="text-xs font-black uppercase tracking-wider text-primary">{badge}</Text>
          )}
        </View>
        {desc && <Text className="text-xs text-muted">{desc}</Text>}
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
  const { data, update } = useOnboarding();
  const { available, pro, manageSubscriptions } = usePurchases();
  const { clear: clearStats } = useStats();
  const s = data.schedule;

  // Trial countdown from the RevenueCat `pro` entitlement (null when not on trial).
  const trialDaysLeft =
    pro.periodType === 'trial' && pro.expiresAt
      ? Math.max(0, Math.ceil((new Date(pro.expiresAt).getTime() - Date.now()) / 86_400_000))
      : null;

  const planSubtitle = !data.pro
    ? 'Free plan'
    : pro.periodType === 'trial'
      ? 'Pro · free trial'
      : data.founder
        ? 'Founder · $4.99/mo for life'
        : pro.periodType === 'normal' && !pro.willRenew
          ? 'Pro · cancels at period end'
          : 'Pro active';
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [appsOpen, setAppsOpen] = useState(false);
  const [boundaryOpen, setBoundaryOpen] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [cacheConfirm, setCacheConfirm] = useState(false);

  // Clears transient data (reclaim history / dashboard stats + any pending engine
  // events) while keeping the user's setup — apps, schedule, plan, and settings.
  const confirmClearCache = () => {
    drainEvents(); // discard any pending engine events so stats don't repopulate
    clearStats();
    setCacheConfirm(false);
  };

  const toggleStrict = () => {
    if (!data.pro) return;
    update({ strict: !data.strict });
  };

  const toggleCalendar = async () => {
    if (!data.pro) return;
    if (data.respectCalendar) {
      update({ respectCalendar: false });
      return;
    }
    const ok = await requestCalendarPermission();
    update({ respectCalendar: ok });
  };

  const openNewBoundary = () => {
    setEditIndex(null);
    setBoundaryOpen(true);
  };
  const openEditBoundary = (i: number) => {
    setEditIndex(i);
    setBoundaryOpen(true);
  };
  const removeBoundary = (i: number) =>
    update({ extraWindows: data.extraWindows.filter((_, idx) => idx !== i) });

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
              <Text className="text-xs text-muted">{planSubtitle}</Text>
            </View>
            {!data.pro ? (
              <Button
                label="Upgrade"
                size="sm"
                fullWidth={false}
                onPress={() => {
                  capture('upgrade_pressed');
                  router.push('/paywall');
                }}
              />
            ) : pro.isPro && available ? (
              <Button
                label="Manage"
                size="sm"
                variant="secondary"
                fullWidth={false}
                onPress={manageSubscriptions}
              />
            ) : null}
          </View>

          {/* Trial countdown */}
          {trialDaysLeft !== null && (
            <View className="mt-3 flex-row items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-3 py-2">
              <Ionicons name="hourglass-outline" size={14} color={colors.primary} />
              <Text className="flex-1 text-xs font-semibold text-foreground">
                {trialDaysLeft === 0
                  ? 'Trial ends today'
                  : `Trial ends in ${trialDaysLeft} day${trialDaysLeft === 1 ? '' : 's'}`}
              </Text>
              {pro.expiresAt && (
                <Text className="text-xs text-muted">
                  {new Date(pro.expiresAt).toLocaleDateString()}
                </Text>
              )}
            </View>
          )}
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
                      <Text className="text-xs font-black text-primary-foreground">{DAY2[d]}</Text>
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
          />
          <ToggleRow
            icon="calendar-outline"
            tint={colors.success}
            label="Respect my calendar"
            desc="Skip the nudge during real meetings."
            badge={!data.pro ? 'Pro' : undefined}
            value={data.respectCalendar && data.pro}
            onValueChange={toggleCalendar}
            disabled={!data.pro}
            last
          />
        </Section>

        {/* Extra boundaries (Pro multi-schedule) */}
        <Section title="Extra boundaries">
          {!data.pro ? (
            <Pressable
              onPress={() => router.push('/paywall')}
              className="flex-row items-center gap-3 px-4 py-3.5 active:opacity-70">
              <View
                className="h-9 w-9 items-center justify-center rounded-xl"
                style={{ backgroundColor: colors.primary + '22' }}>
                <Ionicons name="shield-half-outline" size={17} color={colors.primary} />
              </View>
              <View className="flex-1">
                <View className="flex-row items-center gap-1.5">
                  <Text className="text-sm font-semibold text-foreground">Guard lunch & deep-work</Text>
                  <Text className="text-xs font-black uppercase tracking-wider text-primary">Pro</Text>
                </View>
                <Text className="text-xs text-muted">Protect extra windows, not just after-hours.</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.subtle} />
            </Pressable>
          ) : (
            <>
              {data.extraWindows.map((w, i) => (
                <Pressable
                  key={i}
                  onPress={() => openEditBoundary(i)}
                  className="flex-row items-center gap-3 border-b border-border px-4 py-3.5 active:opacity-70">
                  <View
                    className="h-9 w-9 items-center justify-center rounded-xl"
                    style={{ backgroundColor: colors.warning + '22' }}>
                    <Ionicons name="shield-half-outline" size={17} color={colors.warning} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-foreground">{w.label}</Text>
                    <Text className="text-xs text-muted">
                      {fmt(w.start)} – {fmt(w.end)} · {w.days.length} day{w.days.length === 1 ? '' : 's'}
                    </Text>
                  </View>
                  <Pressable onPress={() => removeBoundary(i)} hitSlop={10} className="p-1 active:opacity-60">
                    <Ionicons name="trash-outline" size={16} color={colors.destructive} />
                  </Pressable>
                </Pressable>
              ))}
              <Pressable
                onPress={openNewBoundary}
                className="flex-row items-center gap-3 px-4 py-3.5 active:opacity-70">
                <View
                  className="h-9 w-9 items-center justify-center rounded-xl"
                  style={{ backgroundColor: colors.primary + '22' }}>
                  <Ionicons name="add" size={18} color={colors.primary} />
                </View>
                <Text className="flex-1 text-sm font-semibold text-primary">Add a boundary</Text>
              </Pressable>
            </>
          )}
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

        {/* Routines (Pro) */}
        <Section title="Routines">
          <Row
            icon="bar-chart-outline"
            tint={colors.primary}
            label="Weekly report"
            badge={!data.pro ? 'Pro' : undefined}
            onPress={() => router.push(data.pro ? '/weekly-report' : '/paywall')}
          />
          <Row
            icon="moon-outline"
            tint={colors.warning}
            label="Wind-down routine"
            badge={!data.pro ? 'Pro' : undefined}
            onPress={() => router.push(data.pro ? '/winddown' : '/paywall')}
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
          />
          <ToggleRow
            icon="bar-chart-outline"
            tint={colors.success}
            label="Weekly report"
            desc="Sunday recap of evenings reclaimed."
            badge={!data.pro ? 'Pro' : undefined}
            value={data.weeklyReport && data.pro}
            onValueChange={() => update({ weeklyReport: !data.weeklyReport })}
            disabled={!data.pro}
            last
          />
        </Section>

        {/* Privacy & about */}
        <Section title="Privacy & about">
          <Row
            icon="shield-checkmark-outline"
            tint={colors.success}
            label="Your usage data"
            value="On-device"
          />
          <ToggleRow
            icon="bar-chart-outline"
            tint={colors.muted}
            label="Anonymous analytics"
            desc="Share anonymous app events to improve Clockout. No personal data."
            value={data.analytics}
            onValueChange={() => update({ analytics: !data.analytics })}
          />
          <Row
            icon="document-text-outline"
            label="Privacy policy"
            onPress={() => router.push('/privacy')}
          />
          <Row icon="star-outline" label="Rate Clockout" onPress={() => {}} />
          <Row icon="information-circle-outline" label="Version" value="1.0.0" last />
        </Section>

        {/* Data */}
        <Section title="Data">
          <Row
            icon="trash-outline"
            tint={colors.destructive}
            label="Clear cache"
            onPress={() => setCacheConfirm(true)}
            last
          />
        </Section>

        <Text className="text-center text-xs text-subtle">Clockout · on-device · private</Text>
      </ScrollView>

      <ScheduleModal visible={scheduleOpen} onClose={() => setScheduleOpen(false)} />
      <AppsModal visible={appsOpen} onClose={() => setAppsOpen(false)} />
      <BoundaryModal
        visible={boundaryOpen}
        editIndex={editIndex}
        onClose={() => setBoundaryOpen(false)}
      />
      <ConfirmDialog
        visible={cacheConfirm}
        icon="trash-outline"
        destructive
        title="Clear cache?"
        message="This clears your reclaim history and dashboard stats. Your apps, schedule, and settings stay."
        confirmLabel="Clear"
        onConfirm={confirmClearCache}
        onCancel={() => setCacheConfirm(false)}
      />
    </SafeAreaView>
  );
}
