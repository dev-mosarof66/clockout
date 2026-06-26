import { requireOptionalNativeModule } from 'expo';

type Native = {
  hasUsageAccess(): boolean;
  hasOverlayPermission(): boolean;
  isRunning(): boolean;
  writeConfig(configJson: string): void;
  drainEvents(): string;
  startMonitoring(): void;
  stopMonitoring(): void;
};

export type EngineConfig = {
  packages: string[];
  start: number;
  end: number;
  days: number[];
  strict: boolean;
};

export type EngineEvent = { ts: number; app: string; action: 'reclaimed' | 'opened' };

// null in Expo Go / web / before the native dev build — every call no-ops, so
// the JS app keeps working without the engine.
const engine = requireOptionalNativeModule<Native>('ClockoutEngine');

export const engineAvailable = engine != null;

export const hasUsageAccess = () => engine?.hasUsageAccess() ?? false;
export const hasOverlayPermission = () => engine?.hasOverlayPermission() ?? false;
export const isMonitoring = () => engine?.isRunning() ?? false;

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

// Pull + clear nudge outcomes recorded by the native overlay.
export function drainEvents(): EngineEvent[] {
  if (!engine) return [];
  try {
    return JSON.parse(engine.drainEvents() || '[]') as EngineEvent[];
  } catch {
    return [];
  }
}
