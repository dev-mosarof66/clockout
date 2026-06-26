import { config, isConfigured } from './config';

// ─── Analytics ───────────────────────────────────────────────────────────────
// Thin wrapper over Plausible. Loads the script once if a domain is configured,
// and exposes track() for the custom WTP events that map to the Phase 0 decision
// gates: email_signup (curiosity), pro_click (paid intent), prepay_click
// (strongest signal). With no domain set, events are logged to the console so
// you can still see them firing in dev.

let loaded = false;

type PlausibleFn = ((event: string, opts?: { props?: Record<string, unknown> }) => void) & {
  q?: unknown[];
};

declare global {
  interface Window {
    plausible?: PlausibleFn;
  }
}

export function initAnalytics() {
  if (loaded || !isConfigured.analytics || typeof document === 'undefined') return;
  loaded = true;

  // Queue stub so events fired before the script loads aren't lost.
  window.plausible =
    window.plausible ||
    function (...args: unknown[]) {
      (window.plausible!.q = window.plausible!.q || []).push(args);
    };

  const script = document.createElement('script');
  script.defer = true;
  script.dataset.domain = config.plausibleDomain;
  script.src = 'https://plausible.io/js/script.js';
  document.head.appendChild(script);
}

export type WtpEvent =
  | 'email_signup'
  | 'pro_click'
  | 'reserve_submit'
  | 'prepay_click';

export function track(event: WtpEvent, props?: Record<string, unknown>) {
  if (isConfigured.analytics && window.plausible) {
    window.plausible(event, props ? { props } : undefined);
  } else {
    // Dev fallback — make the signal visible even without analytics wired.
    console.debug(`[wtp] ${event}`, props ?? {});
  }
}

// ─── Waitlist capture ────────────────────────────────────────────────────────

export interface WaitlistPayload {
  email: string;
  name?: string;
  role?: string;
  tier?: 'monthly' | 'yearly';
  /** 'free' = email-only curiosity; 'pro' = clicked the paid early-bird door. */
  intent: 'free' | 'pro';
}

export interface SubmitResult {
  ok: boolean;
  /** true when no endpoint is configured and we only recorded locally. */
  localOnly: boolean;
}

// POST the capture to the configured endpoint (Formspree/Tally/Apps Script/etc.).
// Returns localOnly:true when nothing is wired so the UI can warn in dev without
// fabricating a "success" that never reached a backend.
export async function submitWaitlist(payload: WaitlistPayload): Promise<SubmitResult> {
  track(payload.intent === 'pro' ? 'reserve_submit' : 'email_signup', { tier: payload.tier });

  if (!isConfigured.capture) {
    console.warn('[waitlist] VITE_WAITLIST_ENDPOINT not set — captured locally only:', payload);
    return { ok: true, localOnly: true };
  }

  const body = JSON.stringify({ ...payload, source: 'clockout-phase0', ts: new Date().toISOString() });

  try {
    // Google Apps Script web apps don't return CORS headers, so a JSON fetch
    // would be blocked. Send a "simple" request (text/plain → no preflight) in
    // no-cors mode; the response is opaque, so a resolved fetch = success.
    if (config.waitlistEndpoint.includes('script.google.com')) {
      await fetch(config.waitlistEndpoint, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body,
      });
      return { ok: true, localOnly: false };
    }

    // Formspree / Tally / custom: standard JSON POST with a readable response.
    const res = await fetch(config.waitlistEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body,
    });
    return { ok: res.ok, localOnly: false };
  } catch (err) {
    console.error('[waitlist] submit failed', err);
    return { ok: false, localOnly: false };
  }
}
