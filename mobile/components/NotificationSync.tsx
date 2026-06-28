import { useEffect, useState } from 'react';
import { Linking, AppState } from 'react-native';
import { useOnboarding } from '../lib/onboarding';
import {
  syncNotifications,
  getNotificationStatus,
  notificationsAvailable,
} from '../lib/notifications';
import { NotificationPrimer } from './NotificationPrimer';

// Keeps scheduled clock-out reminders in sync with the saved schedule + toggle,
// and shows the branded permission primer (instead of the bare OS alert). The
// primer sends the user to system settings to grant notifications.
export function NotificationSync() {
  const { data, update, ready } = useOnboarding();
  const [primer, setPrimer] = useState(false);

  // Weekly report is a Pro feature — only schedule it for Pro users.
  const weekly = data.weeklyReport && data.pro;

  // Sync / decide whether to prompt when state changes.
  useEffect(() => {
    if (!ready || !notificationsAvailable) return;
    let alive = true;
    const wantsAny = data.notifyClockout || weekly;
    (async () => {
      if (!wantsAny) {
        await syncNotifications({ schedule: data.schedule, clockout: false, weekly: false });
        return;
      }
      const { status } = await getNotificationStatus();
      if (!alive) return;
      if (status === 'granted') {
        await syncNotifications({
          schedule: data.schedule,
          clockout: data.notifyClockout,
          weekly,
        });
      } else {
        setPrimer(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, [ready, data.notifyClockout, weekly, data.schedule]);

  // Re-check when returning from system settings (permission may have changed).
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active' || !ready || (!data.notifyClockout && !weekly)) return;
      getNotificationStatus().then(({ status }) => {
        if (status === 'granted') {
          setPrimer(false);
          syncNotifications({
            schedule: data.schedule,
            clockout: data.notifyClockout,
            weekly,
          }).catch(() => {});
        }
      });
    });
    return () => sub.remove();
  }, [ready, data.notifyClockout, weekly, data.schedule]);

  const onEnable = () => {
    setPrimer(false);
    Linking.openSettings().catch(() => {});
  };

  const onDismiss = () => {
    setPrimer(false);
    update({ notifyClockout: false });
  };

  return <NotificationPrimer visible={primer} onEnable={onEnable} onDismiss={onDismiss} />;
}
