import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import type {
  CustomerInfo,
  PurchasesOffering,
  PurchasesPackage,
} from 'react-native-purchases';

// Public RevenueCat Android SDK key (goog_…). Set in .env.local:
//   EXPO_PUBLIC_RC_ANDROID_KEY="goog_xxx"
const RC_KEY = process.env.EXPO_PUBLIC_RC_ANDROID_KEY ?? '';
const ENTITLEMENT = 'pro';

// RevenueCat's native module simply isn't present in Expo Go — and unlike Expo
// modules, calling into it there can hang the bridge rather than fail cleanly.
// So hard-disable purchases in Expo Go regardless of whether a key is set.
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// Lazy-require so Expo Go (no native module) doesn't crash on import.
function getPurchases(): typeof import('react-native-purchases').default | null {
  if (isExpoGo) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('react-native-purchases').default;
  } catch {
    return null;
  }
}

// Richer result so the UI can tell "user cancelled" apart from a real failure
// (and show the reason) instead of every path collapsing to a silent `false`.
export type PurchaseResult =
  | { ok: true }
  | { ok: false; cancelled: boolean; reason?: string };

type Ctx = {
  available: boolean; // native module present AND key configured
  ready: boolean;
  isPro: boolean;
  offering: PurchasesOffering | null;
  purchasePlan: (plan: 'monthly' | 'yearly') => Promise<PurchaseResult>;
  restore: () => Promise<PurchaseResult>;
};

const PurchasesContext = createContext<Ctx | null>(null);

export function PurchasesProvider({ children }: { children: ReactNode }) {
  const Purchases = getPurchases();
  const available = !!Purchases && !!RC_KEY;

  const [ready, setReady] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);

  useEffect(() => {
    if (!available || !Purchases) {
      setReady(true);
      return;
    }
    (async () => {
      try {
        Purchases.configure({ apiKey: RC_KEY });
        const info = await Purchases.getCustomerInfo();
        setIsPro(!!info.entitlements.active[ENTITLEMENT]);
        const offerings = await Purchases.getOfferings();
        setOffering(offerings.current ?? null);
        Purchases.addCustomerInfoUpdateListener((ci: CustomerInfo) => {
          setIsPro(!!ci.entitlements.active[ENTITLEMENT]);
        });
      } catch {
        // leave defaults
      }
      setReady(true);
    })();
  }, [available]);

  const purchasePkg = async (pkg: PurchasesPackage | null): Promise<PurchaseResult> => {
    if (!Purchases) return { ok: false, cancelled: false, reason: 'In-app purchases are unavailable.' };
    if (!pkg) {
      // No package for the selected plan → the offering has no annual/monthly,
      // or no "current" offering is configured in RevenueCat.
      if (__DEV__) {
        console.warn(
          `[purchases] No package for this plan. offering=${offering?.identifier ?? 'null'} ` +
            `packages=${offering?.availablePackages?.map((p) => p.identifier).join(',') ?? 'none'}`,
        );
      }
      return { ok: false, cancelled: false, reason: 'No product is configured for this plan yet (check your RevenueCat offering).' };
    }
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      const active = customerInfo.entitlements.active;
      const ok = !!active[ENTITLEMENT];
      setIsPro(ok);
      if (!ok && __DEV__) {
        console.warn(
          `[purchases] Purchase completed but "${ENTITLEMENT}" entitlement is NOT active. ` +
            `Active entitlements: [${Object.keys(active).join(', ') || 'none'}]. ` +
            `Attach the product to the "${ENTITLEMENT}" entitlement in RevenueCat.`,
        );
      }
      return ok
        ? { ok: true }
        : {
            ok: false,
            cancelled: false,
            reason: `Purchase went through but the "${ENTITLEMENT}" entitlement isn't active. Check the RevenueCat entitlement mapping.`,
          };
    } catch (e) {
      const err = e as { userCancelled?: boolean; message?: string };
      if (!err?.userCancelled && __DEV__) console.warn('[purchases] purchase error', e);
      return { ok: false, cancelled: !!err?.userCancelled, reason: err?.message };
    }
  };

  const purchasePlan = (plan: 'monthly' | 'yearly') =>
    purchasePkg(plan === 'yearly' ? (offering?.annual ?? null) : (offering?.monthly ?? null));

  const restore = async (): Promise<PurchaseResult> => {
    if (!Purchases) return { ok: false, cancelled: false, reason: 'In-app purchases are unavailable.' };
    try {
      const info = await Purchases.restorePurchases();
      const ok = !!info.entitlements.active[ENTITLEMENT];
      setIsPro(ok);
      return ok
        ? { ok: true }
        : { ok: false, cancelled: false, reason: 'No active subscription found to restore.' };
    } catch (e) {
      const err = e as { userCancelled?: boolean; message?: string };
      return { ok: false, cancelled: !!err?.userCancelled, reason: err?.message };
    }
  };

  return (
    <PurchasesContext.Provider value={{ available, ready, isPro, offering, purchasePlan, restore }}>
      {children}
    </PurchasesContext.Provider>
  );
}

export function usePurchases() {
  const ctx = useContext(PurchasesContext);
  if (!ctx) throw new Error('usePurchases must be used within PurchasesProvider');
  return ctx;
}
