import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type {
  CustomerInfo,
  PurchasesOffering,
  PurchasesPackage,
} from 'react-native-purchases';

// Public RevenueCat Android SDK key (goog_…). Set in .env.local:
//   EXPO_PUBLIC_RC_ANDROID_KEY="goog_xxx"
const RC_KEY = process.env.EXPO_PUBLIC_RC_ANDROID_KEY ?? '';
const ENTITLEMENT = 'pro';

// Lazy-require so Expo Go (no native module) doesn't crash on import.
function getPurchases(): typeof import('react-native-purchases').default | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('react-native-purchases').default;
  } catch {
    return null;
  }
}

type Ctx = {
  available: boolean; // native module present AND key configured
  ready: boolean;
  isPro: boolean;
  offering: PurchasesOffering | null;
  purchasePlan: (plan: 'monthly' | 'yearly') => Promise<boolean>;
  restore: () => Promise<boolean>;
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

  const purchasePkg = async (pkg: PurchasesPackage | null): Promise<boolean> => {
    if (!Purchases || !pkg) return false;
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      const ok = !!customerInfo.entitlements.active[ENTITLEMENT];
      setIsPro(ok);
      return ok;
    } catch {
      return false; // user cancelled or error
    }
  };

  const purchasePlan = (plan: 'monthly' | 'yearly') =>
    purchasePkg(plan === 'yearly' ? (offering?.annual ?? null) : (offering?.monthly ?? null));

  const restore = async (): Promise<boolean> => {
    if (!Purchases) return false;
    try {
      const info = await Purchases.restorePurchases();
      const ok = !!info.entitlements.active[ENTITLEMENT];
      setIsPro(ok);
      return ok;
    } catch {
      return false;
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
