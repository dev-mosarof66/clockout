import { useEffect } from 'react';
import { usePurchases } from '../lib/purchases';
import { useOnboarding } from '../lib/onboarding';

// Mirrors the real RevenueCat "pro" entitlement into the local pro flag that all
// the gates read. When billing is available we sync BOTH ways, so an expired or
// cancelled trial actually revokes Pro (RevenueCat caches entitlements, so this
// stays correct offline). When billing is NOT available (Expo Go / no key) we
// leave `data.pro` untouched — that's the local/dev escape hatch.
export function ProSync() {
  const { available, ready, isPro } = usePurchases();
  const { data, update } = useOnboarding();

  useEffect(() => {
    if (available && ready && data.pro !== isPro) {
      update({ pro: isPro });
    }
  }, [available, ready, isPro, data.pro]);

  return null;
}
