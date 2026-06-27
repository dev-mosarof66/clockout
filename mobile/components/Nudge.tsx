import { useEffect, useState } from 'react';
import { View, Text, Modal } from 'react-native';
import LottieView from 'lottie-react-native';
import { Button } from './Button';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type NudgeAction = 'reclaimed' | 'opened';

type NudgeProps = {
  visible: boolean;
  appName: string;
  time: string; // e.g. "9:42 PM"
  /** When true, hides "Open anyway" (Strict Mode). */
  strict?: boolean;
  onClose: (action: NudgeAction | null) => void;
};

const PAUSE_SECONDS = 3;

// The after-hours nudge: a short breathing pause, then a gentle choice.
// Reused by the engine (real interception) and the Nudge tab (preview/test).
export function Nudge({ visible, appName, time, strict = false, onClose }: NudgeProps) {
  const inset = useSafeAreaInsets()
  const [count, setCount] = useState(PAUSE_SECONDS);
  const [done, setDone] = useState<NudgeAction | null>(null);

  // Reset each time the nudge opens.
  useEffect(() => {
    if (visible) {
      setCount(PAUSE_SECONDS);
      setDone(null);
    }
  }, [visible]);

  // Countdown the breathing pause.
  useEffect(() => {
    if (!visible || done) return;
    if (count <= 0) return;
    const id = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [visible, count, done]);

  const choose = (action: NudgeAction) => {
    setDone(action);
    setTimeout(() => onClose(action), 1100);
  };

  const ready = count <= 0;

  return (
    <Modal visible={visible} animationType="fade" transparent={false} statusBarTranslucent onRequestClose={() => onClose(null)}>
      <View className="flex-1 bg-background">
        <View className="flex-1 items-center justify-between px-8 pb-12 pt-20">
          {/* Top: context */}
          <View className="items-center gap-2">
            <Text className="text-xs font-black uppercase tracking-[3px] text-primary">
              Boundary enforced
            </Text>
            <Text className="text-center text-2xl font-extrabold text-foreground">
              It’s {time}. Work’s done.
            </Text>
            {!done && (
              <Text className="text-center text-sm text-muted">
                Sure you want to open <Text className="font-bold text-foreground">{appName}</Text>?
              </Text>
            )}
          </View>

          {/* Middle: breathing */}
          <View className="items-center gap-3">
            <View className="h-44 w-44 items-center justify-center">
              <LottieView
                source={require('../assets/lottie/breathe.json')}
                autoPlay
                loop={!done}
                style={{ width: '100%', height: '100%' }}
              />
            </View>
            <Text className="text-xs font-semibold uppercase tracking-widest text-muted">
              {done === 'reclaimed'
                ? 'Evening reclaimed 🎉'
                : done === 'opened'
                  ? 'Opened — logged'
                  : ready
                    ? 'Ready to decide'
                    : `Take a breath… ${count}`}
            </Text>
          </View>

          {/* Bottom: choices */}
          <View className="w-full gap-3" style={{paddingBottom: inset.bottom}}>
            {!done && (
              <>
                <Button
                  label="Close & reclaim my evening"
                  onPress={() => choose('reclaimed')}
                  disabled={!ready}
                />
                {strict ? (
                  <Text className="text-center text-xs text-subtle">
                    Strict Mode is on — locked until your next workday.
                  </Text>
                ) : (
                  <Button
                    label="Open anyway"
                    variant="ghost"
                    onPress={() => choose('opened')}
                    disabled={!ready}
                  />
                )}
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}
