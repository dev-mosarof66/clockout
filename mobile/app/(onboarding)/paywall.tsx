import { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, StyleSheet, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { Button } from '../../components/Button';
import { useOnboarding } from '../../lib/onboarding';
import { usePurchases } from '../../lib/purchases';
import { capture } from '../../lib/analytics';
import { colors } from '../../theme/colors';

const FOUNDER_CODES = ['FOUNDER', 'EARLYBIRD', 'CLOCKOUT'];
const FOUNDER_PRICE = '$4.99/month';

// Format an annual price as its per-month equivalent in the product's own
// currency (e.g. 39.99 USD → "$3.33 / mo"). Returns null if Intl is unavailable.
function perMonthString(annualPrice: number, currencyCode: string): string | null {
  try {
    const formatted = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currencyCode,
    }).format(annualPrice / 12);
    return `${formatted} / mo`;
  } catch {
    return null;
  }
}

const FEATURES: {
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  title: string;
  desc: string;
}[] = [
  {
    icon: 'lock-closed',
    tint: colors.primary,
    title: 'Strict Mode',
    desc: 'Lock the “open anyway” escape during weak moments.',
  },
  {
    icon: 'sparkles',
    tint: colors.warning,
    title: 'Auto-learn your hours',
    desc: 'Clockout detects your real schedule and adapts.',
  },
  {
    icon: 'apps',
    tint: colors.success,
    title: 'Unlimited work apps',
    desc: 'Guard every app, not just three.',
  },
  {
    icon: 'bar-chart',
    tint: colors.primary,
    title: 'Weekly reclaim report',
    desc: '“You reclaimed 6.2 hours this week.”',
  },
  {
    icon: 'moon',
    tint: colors.warning,
    title: 'Wind-down routines',
    desc: 'A calm hand-off into your evening.',
  },
];

type Plan = 'monthly' | 'yearly';

function PlanCard({
  selected,
  onPress,
  name,
  price,
  sub,
  ribbon,
}: {
  selected: boolean;
  onPress: () => void;
  name: string;
  price: string;
  sub: string;
  ribbon?: string;
}) {
  return (
    <View style={selected ? styles.cardGlow : undefined} className="flex-1 rounded-3xl bg-card">
      <Pressable
        onPress={onPress}
        className={`rounded-3xl border p-4 active:opacity-90 ${
          selected ? 'border-primary bg-primary/10' : 'border-border bg-card'
        }`}>
        {ribbon && (
          <View className="absolute -top-2 right-3 rounded-full bg-primary px-2 py-0.5">
            <Text className="text-xs font-black uppercase tracking-wider text-primary-foreground">
              {ribbon}
            </Text>
          </View>
        )}
        <View className="flex-row items-center justify-between">
          <Text className="text-xs font-bold uppercase tracking-widest text-muted">{name}</Text>
          <View
            className={`h-5 w-5 items-center justify-center rounded-full border ${
              selected ? 'border-primary bg-primary' : 'border-border'
            }`}>
            {selected && <Text className="text-xs font-black text-primary-foreground">✓</Text>}
          </View>
        </View>
        <Text className="mt-2 text-2xl font-black text-foreground">{price}</Text>
        <Text className="text-xs text-muted">{sub}</Text>
      </Pressable>
    </View>
  );
}

export default function Paywall() {
  const inset = useSafeAreaInsets();
  const { data, update } = useOnboarding();
  const { available, offering, purchasePlan, restore } = usePurchases();
  const [plan, setPlan] = useState<Plan>(data.plan);
  const [promo, setPromo] = useState('');
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  // Show the REAL store prices from the active offering so the cards/footer match
  // the actual checkout sheet. Hardcoded values are only a fallback for when the
  // offering hasn't loaded (Expo Go, or before products are configured).
  const monthlyPkg = offering?.monthly ?? null;
  const annualPkg = offering?.annual ?? null;
  const monthlyPrice = monthlyPkg?.product.priceString ?? '$4.99';
  const yearlyPrice = annualPkg?.product.priceString ?? '$29.99';
  const yearlyPerMonth =
    (annualPkg ? perMonthString(annualPkg.product.price, annualPkg.product.currencyCode) : null) ??
    '$2.50 / mo';

  const priceLine = applied
    ? `${FOUNDER_PRICE} (founder, locked for life)`
    : plan === 'yearly'
      ? `${yearlyPrice}/year`
      : `${monthlyPrice}/month`;

  const apply = () => {
    if (FOUNDER_CODES.includes(promo.trim().toUpperCase())) {
      setApplied(true);
      setError(false);
    } else {
      setError(true);
    }
  };

  useEffect(() => {
    capture('paywall_viewed');
  }, []);

  const finish = (pro: boolean) => {
    capture('onboarding_completed', { plan, pro, founder: applied });
    capture(pro ? 'trial_started' : 'continued_free');
    update({ plan, founder: applied, pro, onboarded: true });
    router.replace('/processing');
  };

  // Start trial: real RevenueCat purchase when available, else fall back to the
  // local flow (so it still works in Expo Go / before Play products exist).
  const startTrial = async () => {
    capture('checkout_started', { plan });
    if (!available) return finish(true);
    setBusy(true);
    const res = await purchasePlan(plan);
    setBusy(false);
    if (res.ok) finish(true);
    else if (!res.cancelled) {
      // Don't fail silently — a completed-but-not-entitled purchase or config
      // gap should tell the user (and us) something went wrong.
      Alert.alert('Couldn’t start your trial', res.reason ?? 'Something went wrong. Please try again.');
    }
  };

  const onRestore = async () => {
    if (!available) return;
    setBusy(true);
    const res = await restore();
    setBusy(false);
    if (res.ok) finish(true);
    else if (!res.cancelled) {
      Alert.alert('Nothing to restore', res.reason ?? 'No active subscription was found.');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <View className="flex-1 pt-2">
        {/* Progress */}
        <View className="flex-row items-center gap-1.5 px-6 pb-2">
          <View className="h-1.5 w-6 rounded-full bg-primary" />
          <View className="h-1.5 w-6 rounded-full bg-primary" />
          <View className="h-1.5 w-6 rounded-full bg-primary" />
          <Text className="ml-1 text-xs font-bold uppercase tracking-widest text-muted">
            Step 3 of 3
          </Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 16 }}>
          {/* Hero */}
          <View className="items-center pb-4 pt-2">
            <LinearGradient
              colors={[colors.primary + '2E', 'transparent']}
              style={styles.heroGlow}
              pointerEvents="none"
            />
            <View className="h-20 w-20 items-center justify-center">
              <LottieView
                source={require('../../assets/lottie/logo.json')}
                autoPlay
                loop
                style={{ width: '100%', height: '100%' }}
              />
            </View>
            <View className="mt-1 rounded-full border border-primary/40 bg-primary/10 px-3 py-1">
              <Text className="text-sm font-black uppercase tracking-widest text-primary">
                Clockout Pro
              </Text>
            </View>
            <Text className="mt-3 text-center text-3xl font-black leading-tight text-foreground">
              Reclaim every evening.
            </Text>
            <Text className="mt-2 px-2 text-center text-sm leading-relaxed text-muted">
              Start a 7-day free trial. Cancel anytime — no charge until it ends.
            </Text>
          </View>

          {/* Features */}
          <View className="gap-3.5 px-6">
            {FEATURES.map((f) => (
              <View key={f.title} className="flex-row items-center gap-3">
                <View
                  className="h-9 w-9 items-center justify-center rounded-xl"
                  style={{ backgroundColor: f.tint + '22' }}>
                  <Ionicons name={f.icon} size={18} color={f.tint} />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-foreground">{f.title}</Text>
                  <Text className="text-xs leading-snug text-muted">{f.desc}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Plans */}
          <View className="mt-7 flex-row gap-3 px-6">
            <PlanCard
              selected={plan === 'monthly'}
              onPress={() => setPlan('monthly')}
              name="Monthly"
              price={monthlyPrice}
              sub="per month"
            />
            <PlanCard
              selected={plan === 'yearly'}
              onPress={() => setPlan('yearly')}
              name="Yearly"
              price={yearlyPrice}
              sub={yearlyPerMonth}
              ribbon="Save 50%"
            />
          </View>

          {/* Early-bird founder code */}
          <View className="px-6">
            <View
              className={`mt-3 rounded-2xl border p-4 ${
                applied ? 'border-primary bg-primary/10' : 'border-border bg-card'
              }`}>
              {applied ? (
                <View className="flex-row items-center gap-3">
                  <View className="h-7 w-7 items-center justify-center rounded-full bg-primary">
                    <Text className="text-xs font-black text-primary-foreground">✓</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-foreground">
                      Founder price unlocked
                    </Text>
                    <Text className="text-xs text-muted">$4.99/mo, locked in for life.</Text>
                  </View>
                  <Pressable
                    hitSlop={8}
                    onPress={() => {
                      setApplied(false);
                      setPromo('');
                    }}>
                    <Text className="text-xs font-semibold text-muted">Remove</Text>
                  </Pressable>
                </View>
              ) : (
                <>
                  <Text className="text-xs font-bold uppercase tracking-widest text-primary">
                    Early bird?
                  </Text>
                  <Text className="mt-0.5 text-xs text-muted">
                    Got a founder code? Lock in $2.99/mo for life.
                  </Text>
                  <View className="mt-3 flex-row items-center gap-2">
                    <TextInput
                      value={promo}
                      onChangeText={(t) => {
                        setPromo(t);
                        setError(false);
                      }}
                      onSubmitEditing={apply}
                      autoCapitalize="characters"
                      autoCorrect={false}
                      returnKeyType="done"
                      placeholder="FOUNDER CODE"
                      placeholderTextColor="#525252"
                      className="flex-1 rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold tracking-widest text-foreground"
                    />
                    <Button
                      label="Apply"
                      size="sm"
                      variant="secondary"
                      fullWidth={false}
                      onPress={apply}
                    />
                  </View>
                  {error && (
                    <Text className="mt-2 text-xs text-destructive">
                      That code isn’t valid.
                    </Text>
                  )}
                </>
              )}
            </View>
          </View>
        </ScrollView>

        {/* Footer */}
        <View className="gap-2 px-6 pt-3" style={{ paddingBottom: inset.bottom - 30 }}>
          <View style={styles.ctaGlow}>
            <Button label="Start 7-day free trial" onPress={startTrial} loading={busy} />
          </View>
          <View className="flex-row items-center justify-center gap-1.5">
            <Ionicons name="shield-checkmark" size={13} color={colors.success} />
            <Text className="text-center text-sm text-subtle">
              7 days free, then {priceLine}. Cancel anytime.
            </Text>
          </View>
          {available && (
            <Pressable onPress={onRestore} hitSlop={8} className="items-center py-1 active:opacity-70">
              <Text className="text-xs font-semibold text-muted">Restore purchases</Text>
            </Pressable>
          )}
          <Button label="Back" variant="ghost" onPress={() => router.back()} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  heroGlow: {
    position: 'absolute',
    top: -24,
    left: -40,
    right: -40,
    height: 200,
  },
  cardGlow: {
    shadowColor: colors.primary,
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
  ctaGlow: {
    shadowColor: colors.primary,
    shadowOpacity: 0.4,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
});
