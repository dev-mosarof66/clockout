/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WAITLIST_ENDPOINT?: string;
  readonly VITE_STRIPE_PAYMENT_LINK?: string;
  readonly VITE_PLAUSIBLE_DOMAIN?: string;
  readonly VITE_WAITLIST_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
