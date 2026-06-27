export type BusyWindow = { start: number; end: number }; // absolute ms

// Lazy-require so a build without the module (or Expo Go quirks) can't crash.
function getCalendar(): typeof import('expo-calendar') | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-calendar');
  } catch {
    return null;
  }
}

export const calendarAvailable = getCalendar() != null;

export async function calendarGranted(): Promise<boolean> {
  const C = getCalendar();
  if (!C) return false;
  try {
    const { status } = await C.getCalendarPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

export async function requestCalendarPermission(): Promise<boolean> {
  const C = getCalendar();
  if (!C) return false;
  try {
    const { status } = await C.requestCalendarPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

// Timed, busy events in the next `hours` — used to suppress the nudge during a
// genuine obligation. Returns [] without permission / on a build without the
// module. Absolute timestamps; refreshed by the app, so they self-expire.
export async function getBusyWindows(hours = 36): Promise<BusyWindow[]> {
  const C = getCalendar();
  if (!C) return [];
  try {
    const { status } = await C.getCalendarPermissionsAsync();
    if (status !== 'granted') return [];
    const cals = await C.getCalendarsAsync(C.EntityTypes.EVENT);
    const ids = cals.map((c) => c.id);
    if (!ids.length) return [];
    const now = Date.now();
    const events = await C.getEventsAsync(ids, new Date(now), new Date(now + hours * 3_600_000));
    return events
      .filter((e) => !e.allDay)
      .filter((e) => String(e.availability).toLowerCase() !== 'free') // busy/tentative count
      .map((e) => ({
        start: new Date(e.startDate).getTime(),
        end: new Date(e.endDate).getTime(),
      }))
      .filter((w) => w.end > now && w.end > w.start);
  } catch {
    return [];
  }
}
