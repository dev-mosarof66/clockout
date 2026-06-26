// Phase 0 runtime configuration, read from Vite env (VITE_* vars).
// Everything is optional so the page runs in dev with no backend wired —
// but real validation requires at least `waitlistEndpoint` + analytics.

export const config = {
  waitlistEndpoint: import.meta.env.VITE_WAITLIST_ENDPOINT?.trim() || '',
  stripePaymentLink: import.meta.env.VITE_STRIPE_PAYMENT_LINK?.trim() || '',
  plausibleDomain: import.meta.env.VITE_PLAUSIBLE_DOMAIN?.trim() || '',
  waitlistBase: Number(import.meta.env.VITE_WAITLIST_BASE ?? 0) || 0,
};

export const isConfigured = {
  capture: !!config.waitlistEndpoint,
  prepay: !!config.stripePaymentLink,
  analytics: !!config.plausibleDomain,
};
