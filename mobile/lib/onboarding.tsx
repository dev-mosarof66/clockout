import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Schedule = { start: number; end: number; days: number[] };

export type OnboardingData = {
  onboarded: boolean;
  workApps: string[]; // selected app ids
  schedule: Schedule | null; // minutes-from-midnight start/end + day indices
  plan: 'monthly' | 'yearly';
  founder: boolean; // early-bird code applied
  pro: boolean; // started the Pro trial (vs continued free)
  strict: boolean; // Strict Mode (no "open anyway") — Pro feature
  celebrated: boolean; // confetti shown on first home visit
  notifyClockout: boolean; // end-of-workday "you're clocked out" notification
  protectionSetupDone: boolean; // user has gone through the engine permission setup
};

const KEY = 'clockout.onboarding.v1';

const DEFAULT: OnboardingData = {
  onboarded: false,
  workApps: [],
  schedule: null,
  plan: 'yearly',
  founder: false,
  pro: false,
  strict: false,
  celebrated: false,
  notifyClockout: true,
  protectionSetupDone: false,
};

type Ctx = {
  data: OnboardingData;
  ready: boolean; // true once persisted state has loaded
  update: (patch: Partial<OnboardingData>) => void;
  reset: () => void;
};

const OnboardingContext = createContext<Ctx | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<OnboardingData>(DEFAULT);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (alive && raw) setData({ ...DEFAULT, ...(JSON.parse(raw) as Partial<OnboardingData>) });
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setReady(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  const persist = (next: OnboardingData) => {
    setData(next);
    AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
  };

  const update = (patch: Partial<OnboardingData>) => setData((cur) => {
    const next = { ...cur, ...patch };
    AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
    return next;
  });

  const reset = () => persist(DEFAULT);

  return (
    <OnboardingContext.Provider value={{ data, ready, update, reset }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding must be used within OnboardingProvider');
  return ctx;
}
