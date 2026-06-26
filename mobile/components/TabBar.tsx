import { useEffect } from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { colors } from '../theme/colors';

/** Vertical space the floating bar occupies — screens pad their content by this. */
export const TAB_BAR_SPACE = 96;

type IconPair = { on: keyof typeof Ionicons.glyphMap; off: keyof typeof Ionicons.glyphMap };

const ICONS: Record<string, IconPair> = {
  home: { on: 'home', off: 'home-outline' },
  nudge: { on: 'moon', off: 'moon-outline' },
  settings: { on: 'settings', off: 'settings-outline' },
};

function TabItem({
  focused,
  icon,
  label,
  onPress,
}: {
  focused: boolean;
  icon: IconPair;
  label: string;
  onPress: () => void;
}) {
  const v = useSharedValue(focused ? 1 : 0);
  useEffect(() => {
    v.value = withTiming(focused ? 1 : 0, { duration: 260 });
  }, [focused, v]);

  const lift = useAnimatedStyle(() => ({
    transform: [{ translateY: -22 * v.value }],
  }));

  return (
    <Pressable onPress={onPress} className="flex-1 items-center justify-center">
      <Animated.View style={lift} className="items-center">
        <View
          className={`h-12 w-12 items-center justify-center`}>
          <Ionicons name={focused ? icon.on : icon.off} size={22} color={focused ? colors.primary: colors.muted} />
        </View>
        {focused && (
          <Text className="text-[10px] font-black uppercase tracking-wider text-primary">
            {label}
          </Text>
        )}
      </Animated.View>
    </Pressable>
  );
}

// Floating glass tab bar: the active tab lifts above the others into an orange
// puck; inactive tabs are muted icons sitting in the blurred bar.
export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      pointerEvents="box-none"
      style={{ position: 'absolute', left: 24, right: 24, bottom: insets.bottom + 12 }}>
      <View style={{ height: 64 }} className="justify-center">
        <BlurView
          intensity={36}
          tint="dark"
          experimentalBlurMethod="dimezisBlurView"
          style={[StyleSheet.absoluteFill, styles.glass]}
        />
        <View style={StyleSheet.absoluteFill} className="flex-row items-center">
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const label = typeof options.title === 'string' ? options.title : route.name;
            const focused = state.index === index;
            const icon = ICONS[route.name] ?? { on: 'ellipse', off: 'ellipse-outline' };

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
            };

            return (
              <TabItem
                key={route.key}
                focused={focused}
                icon={icon}
                label={label}
                onPress={onPress}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  glass: {
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(23,23,23,0.55)', // fallback tint if blur is weak
  },
  activeGlow: {
    shadowColor: colors.primary,
    shadowOpacity: 0.45,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
});
