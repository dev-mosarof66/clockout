// Clockout "Signature" palette — single source of truth for native APIs
// (StatusBar, navigation theme, gradients, charts) where NativeWind classes
// can't reach. Keep in sync with tailwind.config.js.
export const colors = {
  background: '#0A0A0A',
  card: '#171717',
  elevated: '#1F1F1F',
  border: '#262626',
  foreground: '#FAFAFA',
  muted: '#A3A3A3',
  subtle: '#525252',
  primary: '#F97316',
  primaryForeground: '#0A0A0A',
  primaryPressed: '#EA580C',
  success: '#4ADE80',
  warning: '#F59E0B',
  destructive: '#EF4444',
} as const;

export type ColorName = keyof typeof colors;
