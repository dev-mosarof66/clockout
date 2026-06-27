import { useEffect, useRef } from 'react';
import { useOnboarding } from '../lib/onboarding';
import { setAnalyticsOptIn, capture } from '../lib/analytics';

// Mirrors the opt-in flag into the analytics module and fires one app_opened
// per launch once persisted state is ready.
export function AnalyticsSync() {
  const { data, ready } = useOnboarding();
  const opened = useRef(false);

  useEffect(() => {
    setAnalyticsOptIn(data.analytics);
  }, [data.analytics]);

  useEffect(() => {
    if (!ready || opened.current) return;
    opened.current = true;
    setAnalyticsOptIn(data.analytics);
    capture('app_opened', { onboarded: data.onboarded, pro: data.pro });
  }, [ready]);

  return null;
}
