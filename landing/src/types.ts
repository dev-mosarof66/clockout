export interface WorkApp {
  id: string;
  name: string;
  iconName: string;
  category: string;
  isSelected: boolean;
  isSuggested?: boolean;
}

export interface WorkSchedule {
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  days: number[]; // 0 = Sun, 1 = Mon, ..., 6 = Sat
}

export interface WaitlistEntry {
  id: string;
  name: string;
  email: string;
  role: string;
  tier: 'monthly' | 'yearly';
  timestamp: string;
  isCustom?: boolean;
}

export interface AppLog {
  id: string;
  appName: string;
  action: 'reclaimed' | 'opened';
  timestamp: Date;
  mockTime: string;
}

export interface SimulatorStats {
  eveningsReclaimed: number;
  opensAvoided: number;
  streak: number;
  totalNudges: number;
}
