import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { Schedule } from './onboarding';

const CHANNEL_ID = 'clockout';

// Show the notification even if the app is foregrounded.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// Create the Android channel once.
export async function configureNotifications() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Clock-out reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
}

export async function getNotificationStatus() {
  const p = await Notifications.getPermissionsAsync();
  return { status: p.status, canAskAgain: p.canAskAgain };
}

// Triggers the real OS permission dialog. Returns whether it was granted.
export async function requestNotificationPermission() {
  const p = await Notifications.requestPermissionsAsync();
  return p.status === 'granted';
}

// Schedule one weekly reminder per working day at the work-end time.
// Only schedules when permission is already granted — it never prompts (the
// branded primer handles the request).
export async function syncClockoutNotifications(schedule: Schedule | null, enabled: boolean) {
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!enabled || !schedule || schedule.days.length === 0) return;

  const perm = await Notifications.getPermissionsAsync();
  if (perm.status !== 'granted') return;

  const hour = Math.floor(schedule.end / 60);
  const minute = schedule.end % 60;

  await Promise.all(
    schedule.days.map((day) =>
      Notifications.scheduleNotificationAsync({
        content: {
          title: 'You’re clocked out 🎉',
          body: 'Work’s done for today. Enjoy your evening.',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: day + 1, // expo: 1=Sun … 7=Sat (our days are 0=Sun … 6=Sat)
          hour,
          minute,
          channelId: CHANNEL_ID,
        },
      }),
    ),
  );
}
