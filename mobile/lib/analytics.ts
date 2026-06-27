import AsyncStorage from '@react-native-async-storage/async-storage';

// Privacy-respecting product analytics (Build Spec §7.1). A thin, fetch-based
// PostHog client — no native SDK, no autocapture, no session replay. We send
// only anonymous funnel events with non-identifying properties. **Usage data
// (which apps, when) never leaves the device** — that's the brand promise; only
// the coarse product events below are sent, and only if a key is set + opted in.

const KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY ?? '';
const HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com';
const ID_KEY = 'clockout.analytics.id';

// Allow-list of events — keeps us honest about exactly what's tracked.
export type AnalyticsEvent =
  | 'app_opened'
  | 'onboarding_completed'
  | 'work_apps_selected'
  | 'schedule_set'
  | 'paywall_viewed'
  | 'checkout_started'
  | 'trial_started'
  | 'continued_free'
  | 'protection_setup_done'
  | 'reclaim_logged'
  | 'open_anyway_logged'
  | 'app_limit_hit'
  | 'upgrade_pressed';

let distinctId: string | null = null;
let optedIn = true; // mirrors data.analytics; gated by setAnalyticsOptIn

function uuid(): string {
  // Non-cryptographic anonymous id — fine for an opaque analytics handle.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Load (or create) the anonymous id. Call once at startup.
export async function configureAnalytics() {
  if (!KEY) return;
  try {
    let id = await AsyncStorage.getItem(ID_KEY);
    if (!id) {
      id = uuid();
      await AsyncStorage.setItem(ID_KEY, id);
    }
    distinctId = id;
  } catch {
    // leave disabled
  }
}

export function setAnalyticsOptIn(value: boolean) {
  optedIn = value;
}

// Fire-and-forget a funnel event. No-ops without a key, when opted out, or in
// the brief window before the id loads. Properties must be non-identifying.
export function capture(event: AnalyticsEvent, properties?: Record<string, string | number | boolean>) {
  if (!KEY || !optedIn || !distinctId) return;
  fetch(`${HOST.replace(/\/$/, '')}/capture/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: KEY,
      event,
      distinct_id: distinctId,
      properties: { ...properties, $lib: 'clockout-mobile' },
    }),
  }).catch(() => {});
}
