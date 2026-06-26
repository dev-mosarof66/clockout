import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useOnboarding } from '../lib/onboarding';
import { useStats } from '../lib/stats';
import { WORK_APPS } from '../data/workApps';
import {
  engineAvailable,
  hasUsageAccess,
  hasOverlayPermission,
  syncEngine,
  drainEvents,
  type EngineConfig,
} from '../lib/engine';

const APP_PKG: Record<string, string> = Object.fromEntries(
  WORK_APPS.filter((a) => a.pkg).map((a) => [a.id, a.pkg as string]),
);

// Drives the native engine: pushes config + start/stop, and pulls recorded
// nudge outcomes into the stats store. No-ops entirely in Expo Go.
export function EngineSync() {
  const { data, ready } = useOnboarding();
  const { add } = useStats();

  // Keep the engine config in sync with apps/schedule/strict + permission state.
  useEffect(() => {
    if (!ready || !engineAvailable) return;

    const sync = () => {
      const packages = data.workApps.map((id) => APP_PKG[id]).filter(Boolean) as string[];
      const config: EngineConfig | null = data.schedule
        ? {
            packages,
            start: data.schedule.start,
            end: data.schedule.end,
            days: data.schedule.days,
            strict: data.strict && data.pro,
          }
        : null;
      const canRun = hasUsageAccess() && hasOverlayPermission();
      syncEngine(config, canRun);
    };

    sync();
    const sub = AppState.addEventListener('change', (s) => s === 'active' && sync());
    return () => sub.remove();
  }, [ready, data.workApps, data.schedule, data.strict, data.pro]);

  // Pull engine-recorded nudge outcomes into stats when the app comes forward.
  useEffect(() => {
    if (!engineAvailable) return;
    const pull = () => {
      for (const e of drainEvents()) add(e.app, e.action);
    };
    pull();
    const sub = AppState.addEventListener('change', (s) => s === 'active' && pull());
    return () => sub.remove();
  }, [add]);

  return null;
}
