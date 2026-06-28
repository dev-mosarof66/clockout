import { Modal, View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

type Props = {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  onConfirm: () => void;
  onCancel: () => void;
};

// Branded, centered confirmation popup — replaces the OS Alert so confirmations
// match the app's dark theme. Tap the scrim or Cancel to dismiss.
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  icon,
  onConfirm,
  onCancel,
}: Props) {
  const accent = destructive ? colors.destructive : colors.primary;
  return (
    <Modal transparent visible={visible} animationType="fade" statusBarTranslucent onRequestClose={onCancel}>
      <View className="flex-1 items-center justify-center px-8">
        <Pressable
          className="absolute inset-0"
          style={{ backgroundColor: 'rgba(0,0,0,0.65)' }}
          onPress={onCancel}
        />
        <View className="w-full gap-4 rounded-3xl border border-border bg-background p-6">
          {icon && (
            <View
              className="h-12 w-12 items-center justify-center self-center rounded-2xl"
              style={{ backgroundColor: accent + '22' }}>
              <Ionicons name={icon} size={24} color={accent} />
            </View>
          )}
          <View className="gap-1.5">
            <Text className="text-center text-lg font-extrabold text-foreground">{title}</Text>
            {message && (
              <Text className="text-center text-sm leading-relaxed text-muted">{message}</Text>
            )}
          </View>
          <View className="mt-1 flex-row gap-3">
            <Pressable
              onPress={onCancel}
              className="flex-1 items-center justify-center rounded-2xl border border-border bg-card py-3.5 active:opacity-80">
              <Text className="text-sm font-bold text-foreground">{cancelLabel}</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              className="flex-1 items-center justify-center rounded-2xl py-3.5 active:opacity-90"
              style={{ backgroundColor: accent }}>
              <Text
                className="text-sm font-black uppercase tracking-wider"
                style={{ color: destructive ? '#FFFFFF' : colors.primaryForeground }}>
                {confirmLabel}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
