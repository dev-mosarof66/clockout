import * as IntentLauncher from 'expo-intent-launcher';
import * as Notifications from 'expo-notifications';
import { Linking, Platform } from 'react-native';

const PKG = 'com.clockout.app';

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
  const p = await Notifications.getPermissionsAsync();
  return p.status === 'granted';
}

// Usage-access and overlay status can only be read natively (the clockout-engine
// module exposes these in Phase C). Until then we report 'unknown'.
export type PermStatus = 'granted' | 'unknown';
