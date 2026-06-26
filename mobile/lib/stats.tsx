import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

  const add = (app: string, action: NudgeAction) =>
    setEvents((cur) => {
      const next = [
        { id: `${Date.now()}-${Math.round(Math.random() * 1e6)}`, ts: Date.now(), app, action },
        ...cur,
      ].slice(0, 500);
      AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });

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

export function timeAgo(ts: number): string {
  const s = (Date.now() - ts) / 1000;
  if (s < 60) return 'just now';
  const m = s / 60;
  if (m < 60) return `${Math.floor(m)}m ago`;
  const h = m / 60;
  if (h < 24) return `${Math.floor(h)}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
