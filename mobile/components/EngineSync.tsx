import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useOnboarding } from '../lib/onboarding';
import { useStats, computeSummary } from '../lib/stats';
import { getBusyWindows } from '../lib/calendar';
import { WORK_APPS } from '../data/workApps';
import {
  engineAvailable,
  hasUsageAccess,
  hasOverlayPermission,
  syncEngine,
  drainEvents,
  writeWidgetData,
  type EngineConfig,
} from '../lib/engine';

const APP_PKG: Record<string, string> = Object.fromEntries(
  WORK_APPS.filter((a) => a.pkg).map((a) => [a.id, a.pkg as string]),
);

// Drives the native engine: pushes config + start/stop, and pulls recorded
// nudge outcomes into the stats store. No-ops entirely in Expo Go.
export function EngineSync() {
  const { data, ready } = useOnboarding();
  const { add, events } = useStats();

  // Keep the engine config in sync with apps/schedule/strict + permission state.
  useEffect(() => {
    if (!ready || !engineAvailable) return;

    const sync = async () => {
      const packages = data.workApps.map((id) => APP_PKG[id]).filter(Boolean) as string[];
      // Calendar-awareness + extra boundaries are Pro features.
      const busy = data.pro && data.respectCalendar ? await getBusyWindows(36) : [];
      const config: EngineConfig | null = data.schedule
        ? {
            packages,
            start: data.schedule.start,
            end: data.schedule.end,
            days: data.schedule.days,
            strict: data.strict && data.pro,
            extra: data.pro
              ? data.extraWindows.map((w) => ({ start: w.start, end: w.end, days: w.days }))
              : [],
            busy,
          }
        : null;
      const canRun = hasUsageAccess() && hasOverlayPermission();
      syncEngine(config, canRun);
    };

    sync();
    const sub = AppState.addEventListener('change', (s) => s === 'active' && sync());
    return () => sub.remove();
  }, [
    ready,
    data.workApps,
    data.schedule,
    data.strict,
    data.pro,
    data.extraWindows,
    data.respectCalendar,
  ]);

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

  // Keep the home-screen widget's streak / reclaimed totals fresh.
  useEffect(() => {
    if (!engineAvailable) return;
    const sum = computeSummary(events);
    writeWidgetData({ streak: sum.streak, reclaimed: sum.total });
  }, [events]);

  return null;
}
