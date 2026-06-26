import { useEffect } from 'react';
import { usePurchases } from '../lib/purchases';
import { useOnboarding } from '../lib/onboarding';

// Mirrors a real RevenueCat "pro" entitlement into the local pro flag so all the
// existing Pro gates keep working. Upgrade-only: it never downgrades a user the
// local (non-billing) flow already marked Pro.
export function ProSync() {
  const { available, ready, isPro } = usePurchases();
  const { data, update } = useOnboarding();

  useEffect(() => {
    if (available && ready && isPro && !data.pro) {
      update({ pro: true });
    }
  }, [available, ready, isPro, data.pro]);

  return null;
}
