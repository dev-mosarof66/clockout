import { Pressable, Text, ActivityIndicator, View } from 'react-native';
import type { ReactNode } from 'react';
import { colors } from '../theme/colors';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'md' | 'sm';

type ButtonProps = {
  label?: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  /** Defaults to full width; set false for inline/auto width. */
  fullWidth?: boolean;
  /** Extra NativeWind classes on the container (e.g. margins). */
  className?: string;
  /** Custom content instead of `label` (e.g. icon + text). */
  children?: ReactNode;
};

const CONTAINER: Record<Variant, string> = {
  primary: 'bg-primary active:opacity-90',
  secondary: 'border border-border bg-card active:opacity-80',
  ghost: 'active:opacity-70',
};
const LABEL: Record<Variant, string> = {
  primary: 'text-primary-foreground font-black uppercase tracking-wider',
  secondary: 'text-foreground font-bold',
  ghost: 'text-muted font-bold',
};
const SIZE: Record<Size, string> = {
  md: 'py-4 px-5',
  sm: 'py-2.5 px-4',
};
const SPINNER: Record<Variant, string> = {
  primary: colors.primaryForeground,
  secondary: colors.foreground,
  ghost: colors.muted,
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = true,
  className = '',
  children,
}: ButtonProps) {
  const inactive = disabled || loading;
  return (
    <Pressable
      onPress={inactive ? undefined : onPress}
      disabled={inactive}
      accessibilityRole="button"
      className={[
        'items-center justify-center rounded-2xl',
        SIZE[size],
        fullWidth ? 'w-full' : 'self-start',
        inactive ? 'bg-elevated' : CONTAINER[variant],
        className,
      ].join(' ')}>
      {loading ? (
        <ActivityIndicator color={SPINNER[variant]} />
      ) : children ? (
        <View className="flex-row items-center gap-2">{children}</View>
      ) : (
        <Text className={`text-sm ${inactive ? 'text-subtle font-bold uppercase tracking-wider' : LABEL[variant]}`}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}
