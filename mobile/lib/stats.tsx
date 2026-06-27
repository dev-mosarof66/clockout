import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { capture } from './analytics';

export type NudgeAction = 'reclaimed' | 'opened';
export type NudgeEvent = { id: string; ts: number; app: string; action: NudgeAction };

const KEY = 'clockout.events.v1';
const DAY_INITIALS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

type Ctx = {
  events: NudgeEvent[];
  add: (app: string, action: NudgeAction) => void;
  clear: () => void;
};

const StatsContext = createContext<Ctx | null>(null);

export function StatsProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<NudgeEvent[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (raw) setEvents(JSON.parse(raw) as NudgeEvent[]);
      })
      .catch(() => {});
  }, []);

  const add = (app: string, action: NudgeAction) => {
    // Anonymous funnel signal only — never the app name (that stays on-device).
    capture(action === 'reclaimed' ? 'reclaim_logged' : 'open_anyway_logged');
    setEvents((cur) => {
      const next = [
        { id: `${Date.now()}-${Math.round(Math.random() * 1e6)}`, ts: Date.now(), app, action },
        ...cur,
      ].slice(0, 500);
      AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  };

  const clear = () => {
    setEvents([]);
    AsyncStorage.removeItem(KEY).catch(() => {});
  };

  return <StatsContext.Provider value={{ events, add, clear }}>{children}</StatsContext.Provider>;
}

export function useStats() {
  const ctx = useContext(StatsContext);
  if (!ctx) throw new Error('useStats must be used within StatsProvider');
  return ctx;
}

export type Summary = {
  total: number; // all-time reclaimed
  reclaimedThisWeek: number; // last 7 days
  streak: number; // consecutive days with a reclaim (today optional)
  last7: { label: string; count: number }[]; // oldest → today
};

// Derive dashboard numbers from the raw event log.
export function computeSummary(events: NudgeEvent[]): Summary {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const counts = new Map<number, number>();
  for (const e of events) {
    if (e.action !== 'reclaimed') continue;
    const d = new Date(e.ts);
    d.setHours(0, 0, 0, 0);
    counts.set(d.getTime(), (counts.get(d.getTime()) ?? 0) + 1);
  }

  const last7: { label: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    last7.push({ label: DAY_INITIALS[d.getDay()], count: counts.get(d.getTime()) ?? 0 });
  }

  let streak = 0;
  for (let i = 0; i < 366; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const c = counts.get(d.getTime()) ?? 0;
    if (c > 0) streak++;
    else if (i === 0) continue; // grace: today may not have a reclaim yet
    else break;
  }

  return {
    total: events.filter((e) => e.action === 'reclaimed').length,
    reclaimedThisWeek: last7.reduce((a, b) => a + b.count, 0),
    streak,
    last7,
  };
}

// Estimated personal time won back per reclaimed evening. We don't measure
// session length, so this is a deliberate, clearly-labelled estimate.
export const MIN_PER_RECLAIM = 25;

export type WeeklyReport = {
  reclaimed: number; // reclaims in the last 7 days
  avoided: number; // same as reclaimed (after-hours opens avoided) — alias for clarity
  opened: number; // "open anyway" in the last 7 days
  totalNudges: number; // reclaimed + opened
  reclaimRate: number; // 0..1
  hours: number; // estimated hours reclaimed (reclaimed × MIN_PER_RECLAIM)
  prevReclaimed: number; // reclaims in the 7 days before that
  delta: number; // reclaimed − prevReclaimed
  byDay: { label: string; count: number }[]; // last 7 days, oldest → today
  bestDayLabel: string | null; // weekday with the most reclaims this week
};

// Derive the weekly "evenings reclaimed" report from the raw event log.
export function computeWeeklyReport(events: NudgeEvent[]): WeeklyReport {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayMs = 86_400_000;
  const weekAgo = today.getTime() - 6 * dayMs; // start of the 7-day window
  const twoWeeksAgo = weekAgo - 7 * dayMs;

  let reclaimed = 0;
  let opened = 0;
  let prevReclaimed = 0;
  const perDay = new Map<number, number>();

  for (const e of events) {
    const d = new Date(e.ts);
    d.setHours(0, 0, 0, 0);
    const t = d.getTime();
    if (t >= weekAgo) {
      if (e.action === 'reclaimed') {
        reclaimed++;
        perDay.set(t, (perDay.get(t) ?? 0) + 1);
      } else if (e.action === 'opened') {
        opened++;
      }
    } else if (t >= twoWeeksAgo && t < weekAgo && e.action === 'reclaimed') {
      prevReclaimed++;
    }
  }

  const byDay: { label: string; count: number }[] = [];
  let bestCount = 0;
  let bestDayLabel: string | null = null;
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const count = perDay.get(d.getTime()) ?? 0;
    const label = DAY_INITIALS[d.getDay()];
    byDay.push({ label, count });
    if (count > bestCount) {
      bestCount = count;
      bestDayLabel = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][
        d.getDay()
      ];
    }
  }

  const totalNudges = reclaimed + opened;
  return {
    reclaimed,
    avoided: reclaimed,
    opened,
    totalNudges,
    reclaimRate: totalNudges > 0 ? reclaimed / totalNudges : 0,
    hours: (reclaimed * MIN_PER_RECLAIM) / 60,
    prevReclaimed,
    delta: reclaimed - prevReclaimed,
    byDay,
    bestDayLabel,
  };
}

export function timeAgo(ts: number): string {
  const s = (Date.now() - ts) / 1000;
  if (s < 60) return 'just now';
  const m = s / 60;
  if (m < 60) return `${Math.floor(m)}m ago`;
  const h = m / 60;
  if (h < 24) return `${Math.floor(h)}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
