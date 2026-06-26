import { useEffect, useState } from 'react';
import { Modal, View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from './Button';
import { useOnboarding } from '../lib/onboarding';
import { colors } from '../theme/colors';

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const fmt = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const ap = h >= 12 ? 'PM' : 'AM';
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${m.toString().padStart(2, '0')} ${ap}`;
};
const wrap = (mins: number) => ((mins % 1440) + 1440) % 1440;

function Stepper({
  label,
  icon,
  tint,
  value,
  onChange,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <View className="flex-row items-center justify-between rounded-2xl border border-border bg-card p-3.5">
      <View className="flex-row items-center gap-2">
        <View className="h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: tint + '22' }}>
          <Ionicons name={icon} size={16} color={tint} />
        </View>
        <Text className="text-sm font-bold text-foreground">{label}</Text>
      </View>
      <View className="flex-row items-center gap-3">
        <Pressable
          onPress={() => onChange(wrap(value - 30))}
          hitSlop={8}
          className="h-8 w-8 items-center justify-center rounded-full border border-border active:opacity-70">
          <Text className="text-base font-black text-foreground">−</Text>
        </Pressable>
        <Text className="w-20 text-center text-base font-extrabold text-foreground">{fmt(value)}</Text>
        <Pressable
          onPress={() => onChange(wrap(value + 30))}
          hitSlop={8}
          className="h-8 w-8 items-center justify-center rounded-full border border-border active:opacity-70">
          <Text className="text-base font-black text-foreground">+</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function ScheduleModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { data, update } = useOnboarding();
  const [start, setStart] = useState(data.schedule?.start ?? 9 * 60);
  const [end, setEnd] = useState(data.schedule?.end ?? 18 * 60);
  const [days, setDays] = useState<number[]>(data.schedule?.days ?? [1, 2, 3, 4, 5]);

  // Re-sync to the saved schedule each time the sheet opens.
  useEffect(() => {
    if (visible) {
      setStart(data.schedule?.start ?? 9 * 60);
      setEnd(data.schedule?.end ?? 18 * 60);
      setDays(data.schedule?.days ?? [1, 2, 3, 4, 5]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const toggleDay = (i: number) =>
    setDays((d) => (d.includes(i) ? d.filter((x) => x !== i) : [...d, i].sort()));

  const save = () => {
    update({ schedule: { start, end, days } });
    onClose();
  };

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        <Pressable className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onPress={onClose} />
        <View className="gap-4 rounded-t-2xl border-t border-border bg-background px-6 pb-8 pt-3">
          <View className="items-center">
            <View className="h-1 w-10 rounded-full bg-border" />
          </View>
          <Text className="text-lg font-extrabold text-foreground">Work hours</Text>

          <Stepper label="Starts" icon="sunny" tint={colors.warning} value={start} onChange={setStart} />
          <Stepper label="Ends" icon="moon" tint={colors.primary} value={end} onChange={setEnd} />

          <View className="gap-2">
            <Text className="text-xs font-bold uppercase tracking-widest text-muted">Working days</Text>
            <View className="flex-row justify-between">
              {DAYS.map((d, i) => {
                const on = days.includes(i);
                return (
                  <Pressable
                    key={i}
                    onPress={() => toggleDay(i)}
                    className={`h-10 w-10 items-center justify-center rounded-full active:opacity-80 ${
                      on ? 'bg-primary' : 'border border-border bg-card'
                    }`}>
                    <Text className={`text-sm font-black ${on ? 'text-primary-foreground' : 'text-muted'}`}>
                      {d}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <Button label="Save" disabled={days.length === 0} onPress={save} />
        </View>
      </View>
    </Modal>
  );
}
