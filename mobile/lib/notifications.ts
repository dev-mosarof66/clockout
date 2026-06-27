import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import type { Schedule } from './onboarding';

const CHANNEL_ID = 'clockout';

// Importing expo-notifications eagerly runs a push-token auto-registration side
// effect (DevicePushTokenAutoRegistration.fx) that ERRORS in Expo Go (SDK 53+),
// which crashes startup. So load it lazily and skip it entirely in Expo Go —
// notifications only function in a dev/production build anyway.
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

export const notificationsAvailable = !isExpoGo;

function getNotifications(): typeof import('expo-notifications') | null {
  if (isExpoGo) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-notifications');
  } catch {
    return null;
  }
}

// Create the Android channel + show notifications while foregrounded.
export async function configureNotifications() {
  const N = getNotifications();
  if (!N) return;
  N.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
  if (Platform.OS === 'android') {
    await N.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Clock-out reminders',
      importance: N.AndroidImportance.DEFAULT,
    });
  }
}

export async function getNotificationStatus(): Promise<{ status: string; canAskAgain: boolean }> {
  const N = getNotifications();
  if (!N) return { status: 'undetermined', canAskAgain: true };
  const p = await N.getPermissionsAsync();
  return { status: p.status, canAskAgain: p.canAskAgain };
}

// Route when a notification carrying a `data.url` is tapped — both while running
// and on cold start. Returns an unsubscribe. No-ops in Expo Go.
export function addNotificationResponseListener(handler: (url: string) => void): () => void {
  const N = getNotifications();
  if (!N) return () => {};
  const urlOf = (resp: import('expo-notifications').NotificationResponse | null) => {
    const url = resp?.notification.request.content.data?.url;
    return typeof url === 'string' ? url : null;
  };
  N.getLastNotificationResponseAsync()
    .then((resp) => {
      const url = urlOf(resp);
      if (url) handler(url);
    })
    .catch(() => {});
  const sub = N.addNotificationResponseReceivedListener((resp) => {
    const url = urlOf(resp);
    if (url) handler(url);
  });
  return () => sub.remove();
}

// Triggers the real OS permission dialog. Returns whether it was granted.
export async function requestNotificationPermission() {
  const N = getNotifications();
  if (!N) return false;
  const p = await N.requestPermissionsAsync();
  return p.status === 'granted';
}

// Single source of truth for scheduled local notifications. Cancels everything,
// then re-schedules the enabled ones together (so clock-out + weekly don't
// clobber each other). Only schedules when permission is already granted — it
// never prompts (the branded primer handles the request).
export async function syncNotifications(opts: {
  schedule: Schedule | null;
  clockout: boolean;
  weekly: boolean;
}) {
  const N = getNotifications();
  if (!N) return;
  await N.cancelAllScheduledNotificationsAsync();

  const perm = await N.getPermissionsAsync();
  if (perm.status !== 'granted') return;

  const { schedule, clockout, weekly } = opts;

  // One "you're clocked out 🎉" per working day at the work-end time.
  if (clockout && schedule && schedule.days.length > 0) {
    const hour = Math.floor(schedule.end / 60);
    const minute = schedule.end % 60;
    await Promise.all(
      schedule.days.map((day) =>
        N.scheduleNotificationAsync({
          content: {
            title: 'You’re clocked out 🎉',
            body: 'Work’s done for today. Enjoy your evening.',
          },
          trigger: {
            type: N.SchedulableTriggerInputTypes.WEEKLY,
            weekday: day + 1, // expo: 1=Sun … 7=Sat (our days are 0=Sun … 6=Sat)
            hour,
            minute,
            channelId: CHANNEL_ID,
          },
        }),
      ),
    );
  }

  // Weekly report nudge — Sunday 6pm — deep-links into the report screen.
  if (weekly) {
    await N.scheduleNotificationAsync({
      content: {
        title: 'Your week, reclaimed 📊',
        body: 'See how many evenings you won back this week.',
        data: { url: '/weekly-report' },
      },
      trigger: {
        type: N.SchedulableTriggerInputTypes.WEEKLY,
        weekday: 1, // Sunday
        hour: 18,
        minute: 0,
        channelId: CHANNEL_ID,
      },
    });
  }
}
