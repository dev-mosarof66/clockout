import { requireOptionalNativeModule } from 'expo';

export type ClockoutEngineNative = {
  hasUsageAccess(): boolean;
  hasOverlayPermission(): boolean;
  isRunning(): boolean;
  writeConfig(appsJson: string, scheduleJson: string): void;
  startMonitoring(): void;
  stopMonitoring(): void;
};

// Returns null in Expo Go / before the native dev build exists.
export default requireOptionalNativeModule<ClockoutEngineNative>('ClockoutEngine');
