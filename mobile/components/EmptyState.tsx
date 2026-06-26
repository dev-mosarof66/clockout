import { View, Text } from 'react-native';
import LottieView from 'lottie-react-native';

type EmptyStateProps = {
  message: string;
  size?: number;
};

// Friendly no-data placeholder with an empty-box Lottie.
export function EmptyState({ message, size = 120 }: EmptyStateProps) {
  return (
    <View className="items-center gap-1 rounded-3xl border border-border bg-card px-5 py-6">
      <LottieView
        source={require('../assets/lottie/empty.json')}
        autoPlay
        loop
        style={{ width: size, height: size }}
      />
      <Text className="text-center text-sm text-muted">{message}</Text>
    </View>
  );
}
