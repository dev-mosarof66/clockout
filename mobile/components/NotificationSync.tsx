import { useEffect, useState } from 'react';
import { Linking, AppState } from 'react-native';
import { useOnboarding } from '../lib/onboarding';
import { syncClockoutNotifications, getNotificationStatus } from '../lib/notifications';
import { NotificationPrimer } from './NotificationPrimer';

// Keeps scheduled clock-out reminders in sync with the saved schedule + toggle,
// and shows the branded permission primer (instead of the bare OS alert). The
// primer sends the user to system settings to grant notifications.
export function NotificationSync() {
  const { data, update, ready } = useOnboarding();
  const [primer, setPrimer] = useState(false);

  // Sync / decide whether to prompt when state changes.
  useEffect(() => {
    if (!ready) return;
    let alive = true;
    (async () => {
      if (!data.notifyClockout) {
        await syncClockoutNotifications(data.schedule, false);
        return;
      }
      const { status } = await getNotificationStatus();
      if (!alive) return;
      if (status === 'granted') {
        await syncClockoutNotifications(data.schedule, true);
      } else {
        setPrimer(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, [ready, data.notifyClockout, data.schedule]);

  // Re-check when returning from system settings (permission may have changed).
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active' || !ready || !data.notifyClockout) return;
      getNotificationStatus().then(({ status }) => {
        if (status === 'granted') {
          setPrimer(false);
          syncClockoutNotifications(data.schedule, true).catch(() => {});
        }
      });
    });
    return () => sub.remove();
  }, [ready, data.notifyClockout, data.schedule]);

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
