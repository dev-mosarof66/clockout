import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

const EFFECTIVE = 'Effective: on first publish'; // update before store launch

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="gap-2.5">
      <Text className="text-sm font-black uppercase tracking-widest text-primary">{title}</Text>
      {children}
    </View>
  );
}

function Para({ children }: { children: React.ReactNode }) {
  return <Text className="text-sm leading-relaxed text-muted">{children}</Text>;
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <View className="flex-row gap-2.5">
      <View className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
      <Text className="flex-1 text-sm leading-relaxed text-muted">{children}</Text>
    </View>
  );
}

function PermRow({
  icon,
  label,
  why,
  required,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  why: string;
  required: string;
}) {
  return (
    <View className="flex-row items-center gap-3 rounded-2xl border border-border bg-card p-3.5">
      <View
        className="h-9 w-9 items-center justify-center rounded-xl"
        style={{ backgroundColor: colors.muted + '22' }}>
        <Ionicons name={icon} size={17} color={colors.muted} />
      </View>
      <View className="flex-1">
        <Text className="text-sm font-bold text-foreground">{label}</Text>
        <Text className="text-xs leading-snug text-muted">{why}</Text>
      </View>
      <Text className="text-xs font-bold text-subtle">{required}</Text>
    </View>
  );
}

export default function Privacy() {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View className="flex-row items-center gap-3 px-6 pb-2 pt-1">
        <Pressable onPress={() => router.back()} hitSlop={10} className="active:opacity-70">
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text className="text-xl font-extrabold text-foreground">Privacy policy</Text>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, gap: 24, paddingTop: 8, paddingBottom: 40 }}>
        {/* Intro */}
        <View className="gap-3 rounded-2xl border border-border bg-card p-5">
          <View className="flex-row items-center gap-2">
            <Ionicons name="shield-checkmark" size={20} color={colors.success} />
            <Text className="text-base font-extrabold text-foreground">Your usage stays on your phone</Text>
          </View>
          <Para>
            Clockout helps you disconnect after hours. The short version: the data about which apps
            you use and when is processed <Text className="font-bold text-foreground">only on your
            device</Text> and is never uploaded.
          </Para>
          <Text className="text-xs text-subtle">{EFFECTIVE}</Text>
        </View>

        <Section title="On your device — never transmitted">
          <Bullet>
            <Text className="font-semibold text-foreground">App-usage signals</Text> — which app is
            in the foreground and when, read in the moment to detect a work app opened after hours.
            Not stored, not uploaded.
          </Bullet>
          <Bullet>
            <Text className="font-semibold text-foreground">Your settings</Text> — work apps,
            schedule, extra boundaries, Strict Mode — stored locally.
          </Bullet>
          <Bullet>
            <Text className="font-semibold text-foreground">Your reclaim history</Text> — stored
            locally to power your stats and weekly report.
          </Bullet>
          <Bullet>
            <Text className="font-semibold text-foreground">Calendar (optional, Pro)</Text> — event
            times are read on-device to skip the nudge during real meetings. Nothing is transmitted.
          </Bullet>
          <Para>Uninstalling, or using Reset in Settings, deletes this local data.</Para>
        </Section>

        <Section title="What we collect — only if you allow it">
          <Bullet>
            <Text className="font-semibold text-foreground">Anonymous analytics (opt-out)</Text> —
            if left on, Clockout sends anonymous app events (e.g. “app opened”, “evening reclaimed”)
            to PostHog, tied only to a random ID — never your name, account, or which apps you use.
            Turn it off in Settings → Privacy & about.
          </Bullet>
          <Bullet>
            <Text className="font-semibold text-foreground">Subscriptions</Text> — Google Play
            processes payment and RevenueCat validates your Pro entitlement via an anonymous ID. We
            never see your card.
          </Bullet>
          <Para>We don’t sell your data, show ads, or require an account.</Para>
        </Section>

        <Section title="Permissions & why">
          <PermRow icon="stats-chart-outline" label="Usage access" why="Detect which app opened" required="Core" />
          <PermRow icon="layers-outline" label="Display over other apps" why="Show the nudge over the work app" required="Core" />
          <PermRow icon="notifications-outline" label="Notifications" why="Clock-out & weekly reminders" required="Optional" />
          <PermRow icon="calendar-outline" label="Calendar" why="Skip the nudge during meetings" required="Pro" />
          <PermRow icon="battery-charging-outline" label="Battery exemption" why="Keep the guard alive overnight" required="Optional" />
        </Section>

        <Section title="Retention & deletion">
          <Para>
            On-device data lives only on your device until you reset or uninstall. Anonymous
            analytics are retained by PostHog per their settings; contact us to request deletion of
            events tied to your random ID.
          </Para>
        </Section>

        <Section title="Children">
          <Para>
            Clockout is for adults managing their own work-life boundaries and is not directed at
            children under 13.
          </Para>
        </Section>

        <Section title="Changes">
          <Para>We’ll update this page and the effective date when our practices change.</Para>
        </Section>

        <Text className="text-center text-xs text-subtle">Questions? Reach us at the support email in the listing.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
