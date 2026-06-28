import { requireOptionalNativeModule } from 'expo';

type Native = {
  hasUsageAccess(): boolean;
  hasOverlayPermission(): boolean;
  isRunning(): boolean;
  writeConfig(configJson: string): void;
  drainEvents(): string;
  startMonitoring(): void;
  stopMonitoring(): void;
  isIgnoringBatteryOptimizations(): boolean;
  requestIgnoreBatteryOptimizations(): void;
  topPackages(days: number): string;
  usagePattern(packagesJson: string, days: number): string;
  writeWidgetData(json: string): void;
};

export type SuggestedApp = {
  pkg: string;
  label: string;
  minutes: number;
  icon?: string; // real installed-app launcher icon as a PNG data URI
};
export type UsagePattern = {
  start: number; // minutes from midnight
  end: number;
  days: number[]; // 0=Sun … 6=Sat
  samples: number; // distinct days with data
  confidence: number; // 0..1
};

export type EngineConfig = {
  packages: string[];
  start: number;
  end: number;
  days: number[];
  strict: boolean;
  // Extra guarded windows (Pro): guard work apps *inside* these even during work
  // hours (lunch breaks, deep-work blocks).
  extra?: { start: number; end: number; days: number[] }[];
  // Calendar busy windows (Pro, absolute ms): suppress the nudge during a real
  // obligation. Self-expiring — refreshed whenever the app runs.
  busy?: { start: number; end: number }[];
};

export type EngineEvent = { ts: number; app: string; action: 'reclaimed' | 'opened' };

// null in Expo Go / web / before the native dev build — every call no-ops, so
// the JS app keeps working without the engine.
const engine = requireOptionalNativeModule<Native>('ClockoutEngine');

export const engineAvailable = engine != null;

export const hasUsageAccess = () => engine?.hasUsageAccess() ?? false;
export const hasOverlayPermission = () => engine?.hasOverlayPermission() ?? false;
export const isMonitoring = () => engine?.isRunning() ?? false;

// Battery-optimization exemption — without it, aggressive OEMs doze-kill the
// guard overnight. Recommended (not strictly required) during setup.
export const hasBatteryExemption = () => engine?.isIgnoringBatteryOptimizations() ?? false;
export const requestBatteryExemption = () => engine?.requestIgnoreBatteryOptimizations();

// Start/stop monitoring + push config. `canRun` gates on permissions being granted.
export function syncEngine(config: EngineConfig | null, canRun: boolean) {
  if (!engine) return;
  if (!canRun || !config || config.packages.length === 0) {
    engine.stopMonitoring();
    return;
  }
  engine.writeConfig(JSON.stringify(config));
  engine.startMonitoring();
}

// Smart-suggest: most-used launchable apps over the last `days`. [] in Expo Go,
// without Usage access, or on a build that predates this method.
export function topPackages(days = 7): SuggestedApp[] {
  if (!engine?.topPackages) return [];
  try {
    return JSON.parse(engine.topPackages(days)) as SuggestedApp[];
  } catch {
    return [];
  }
}

// Auto-learn: infer a work schedule from how the given packages are used. null
// when unavailable or there's too little usage history to suggest from.
export function usagePattern(packages: string[], days = 14): UsagePattern | null {
  if (!engine?.usagePattern) return null;
  try {
    const raw = JSON.parse(engine.usagePattern(JSON.stringify(packages), days)) as Partial<UsagePattern>;
    if (typeof raw.start !== 'number' || typeof raw.end !== 'number') return null;
    return raw as UsagePattern;
  } catch {
    return null;
  }
}

// Push streak / reclaimed totals to the native home-screen widget.
export function writeWidgetData(d: { streak: number; reclaimed: number }) {
  engine?.writeWidgetData?.(JSON.stringify(d));
}

// Pull + clear nudge outcomes recorded by the native overlay.
export function drainEvents(): EngineEvent[] {
  if (!engine) return [];
  try {
    return JSON.parse(engine.drainEvents() || '[]') as EngineEvent[];
  } catch {
    return [];
  }
}
