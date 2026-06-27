import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, AppState, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../components/Button';
import { useOnboarding } from '../lib/onboarding';
import {
  openUsageAccessSettings,
  openOverlaySettings,
  openNotificationSettings,
  notificationsGranted,
} from '../lib/permissions';
import {
  engineAvailable,
  hasUsageAccess,
  hasOverlayPermission,
  hasBatteryExemption,
  requestBatteryExemption,
} from '../lib/engine';
import { capture } from '../lib/analytics';
import { colors } from '../theme/colors';

function PermCard({
  icon,
  tint,
  title,
  desc,
  granted,
  onEnable,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  title: string;
  desc: string;
  granted?: boolean;
  onEnable: () => void;
}) {
  return (
    <View className="gap-3 rounded-2xl border border-border bg-card p-5">
      <View className="flex-row items-center gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: tint + '22' }}>
          <Ionicons name={icon} size={19} color={tint} />
        </View>
        <View className="flex-1">
          <Text className="text-sm font-bold text-foreground">{title}</Text>
          <Text className="text-xs leading-snug text-muted">{desc}</Text>
        </View>
        {granted && <Ionicons name="checkmark-circle" size={22} color={colors.success} />}
      </View>
      <Button
        label={granted ? 'Enabled' : 'Open settings'}
        variant={granted ? 'secondary' : 'primary'}
        size="sm"
        onPress={onEnable}
      />
    </View>
  );
}

export default function Protection() {
  const { update } = useOnboarding();
  const [notif, setNotif] = useState(false);
  const [usage, setUsage] = useState(false);
  const [overlay, setOverlay] = useState(false);
  const [battery, setBattery] = useState(false);

  useEffect(() => {
    const refresh = () => {
      notificationsGranted().then(setNotif).catch(() => {});
      setUsage(hasUsageAccess());
      setOverlay(hasOverlayPermission());
      setBattery(hasBatteryExemption());
    };
    refresh();
    const sub = AppState.addEventListener('change', (s) => s === 'active' && refresh());
    return () => sub.remove();
  }, []);

  const done = () => {
    capture('protection_setup_done', { usage, overlay, notif, battery });
    update({ protectionSetupDone: true });
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View className="flex-row items-center gap-3 px-6 pb-2 pt-1">
        <Pressable onPress={() => router.back()} hitSlop={10} className="active:opacity-70">
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text className="text-xl font-extrabold text-foreground">Set up protection</Text>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, gap: 16, paddingBottom: 24 }}>
        <Text className="text-sm leading-relaxed text-muted">
          Clockout needs a few permissions to actually guard your evenings. Everything stays
          on-device — these just let it watch for work apps after hours.
        </Text>

        <PermCard
          icon="stats-chart-outline"
          tint={colors.warning}
          title="Usage access"
          desc="So Clockout can tell which app you’ve opened."
          granted={usage}
          onEnable={openUsageAccessSettings}
        />
        <PermCard
          icon="layers-outline"
          tint={colors.primary}
          title="Display over other apps"
          desc="So the nudge can appear over the work app."
          granted={overlay}
          onEnable={openOverlaySettings}
        />
        <PermCard
          icon="notifications-outline"
          tint={colors.success}
          title="Notifications"
          desc="For the gentle “You’re clocked out 🎉” reminder."
          granted={notif}
          onEnable={openNotificationSettings}
        />
        <PermCard
          icon="battery-charging-outline"
          tint={colors.success}
          title="Keep running in background"
          desc="Recommended — so the guard isn’t killed overnight."
          granted={battery}
          onEnable={requestBatteryExemption}
        />

        {/* OEM autostart guidance — Samsung/Xiaomi/OPPO etc. */}
        <View className="gap-3 rounded-2xl border border-border bg-card p-5">
          <View className="flex-row items-center gap-3">
            <View
              className="h-10 w-10 items-center justify-center rounded-xl"
              style={{ backgroundColor: colors.muted + '22' }}>
              <Ionicons name="hardware-chip-outline" size={19} color={colors.muted} />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-bold text-foreground">Some phones need one more step</Text>
              <Text className="text-xs leading-snug text-muted">
                On Samsung, Xiaomi, OPPO &amp; others, also allow{' '}
                <Text className="font-semibold text-foreground">Auto-start</Text> and set battery to{' '}
                <Text className="font-semibold text-foreground">Unrestricted</Text> for Clockout —
                otherwise the guard can stop after a while.
              </Text>
            </View>
          </View>
          <Button
            label="Open app settings"
            variant="secondary"
            size="sm"
            onPress={() => Linking.openSettings().catch(() => {})}
          />
        </View>

        {!engineAvailable && (
          <View className="flex-row items-start gap-2 px-1">
            <Ionicons name="shield-checkmark-outline" size={14} color={colors.muted} />
            <Text className="flex-1 text-xs leading-relaxed text-muted">
              Usage & overlay status will confirm automatically once the engine build is installed.
            </Text>
          </View>
        )}
      </ScrollView>

      <View className="px-6 pb-2 pt-3">
        <Button label="Done" onPress={done} />
      </View>
    </SafeAreaView>
  );
}
