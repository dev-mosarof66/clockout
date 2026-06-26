import { Modal, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from './Button';
import { colors } from '../theme/colors';

type NotificationPrimerProps = {
  visible: boolean;
  onEnable: () => void;
  onDismiss: () => void;
};

// Branded pre-permission popup, shown before the OS dialog.
export function NotificationPrimer({ visible, onEnable, onDismiss }: NotificationPrimerProps) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onDismiss} statusBarTranslucent>
      <View className="flex-1 items-center justify-center px-8" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
        <View className="w-full items-center gap-4 rounded-2xl border border-border bg-card p-6">
          <View className="h-16 w-16 items-center justify-center rounded-2xl bg-primary/15">
            <Ionicons name="notifications" size={30} color={colors.primary} />
          </View>

          <Text className="text-center text-xl font-extrabold text-foreground">
            Know when you’re clocked out
          </Text>
          <Text className="text-center text-sm leading-relaxed text-muted">
            When your workday ends, Clockout sends one gentle reminder —{' '}
            <Text className="font-bold text-foreground">“You’re clocked out 🎉”</Text> — so you
            actually log off. No spam, just the one.
          </Text>
          <Text className="text-center text-[11px] text-subtle">
            Turn on notifications for Clockout in your settings.
          </Text>

          <View className="mt-1 w-full gap-2">
            <Button label="Open settings" onPress={onEnable} />
            <Button label="Not now" variant="ghost" onPress={onDismiss} />
          </View>
        </View>
      </View>
    </Modal>
  );
}
