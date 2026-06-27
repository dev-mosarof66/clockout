import * as IntentLauncher from 'expo-intent-launcher';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Linking, Platform } from 'react-native';

const PKG = 'com.clockout.app';

// expo-notifications can't be imported eagerly — its push-token side effect
// errors in Expo Go. Load it lazily and treat as ungranted there.
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// Deep-link into the system pages where each engine permission is granted.
// (Usage-access and overlay can't be requested with a dialog — only toggled in
//  settings — so these open the right screen directly.)

export async function openUsageAccessSettings() {
  if (Platform.OS !== 'android') return Linking.openSettings();
  await IntentLauncher.startActivityAsync(
    'android.settings.USAGE_ACCESS_SETTINGS' as IntentLauncher.ActivityAction,
  ).catch(() => Linking.openSettings());
}

export async function openOverlaySettings() {
  if (Platform.OS !== 'android') return Linking.openSettings();
  await IntentLauncher.startActivityAsync(
    'android.settings.action.MANAGE_OVERLAY_PERMISSION' as IntentLauncher.ActivityAction,
    { data: `package:${PKG}` },
  ).catch(() => Linking.openSettings());
}

export async function openNotificationSettings() {
  if (Platform.OS !== 'android') return Linking.openSettings();
  await IntentLauncher.startActivityAsync(
    'android.settings.APP_NOTIFICATION_SETTINGS' as IntentLauncher.ActivityAction,
    { extra: { 'android.provider.extra.APP_PACKAGE': PKG } },
  ).catch(() => Linking.openSettings());
}

export async function notificationsGranted(): Promise<boolean> {
  if (isExpoGo) return false;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Notifications = require('expo-notifications') as typeof import('expo-notifications');
    const p = await Notifications.getPermissionsAsync();
    return p.status === 'granted';
  } catch {
    return false;
  }
}

// Usage-access and overlay status can only be read natively (the clockout-engine
// module exposes these in Phase C). Until then we report 'unknown'.
export type PermStatus = 'granted' | 'unknown';
