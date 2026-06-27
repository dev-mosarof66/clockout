import { useEffect, useState } from 'react';
import { Modal, View, Text, Pressable, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from './Button';
import { useOnboarding, type GuardWindow } from '../lib/onboarding';
import { colors } from '../theme/colors';

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const WEEKDAYS = [1, 2, 3, 4, 5];

const fmt = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const ap = h >= 12 ? 'PM' : 'AM';
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${m.toString().padStart(2, '0')} ${ap}`;
};
const wrap = (mins: number) => ((mins % 1440) + 1440) % 1440;

type Preset = { label: string; start: number; end: number };
const PRESETS: Preset[] = [
  { label: 'Lunch', start: 12 * 60, end: 13 * 60 },
  { label: 'Deep work', start: 9 * 60, end: 11 * 60 },
  { label: 'No early mtgs', start: 0, end: 10 * 60 },
];

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

export function BoundaryModal({
  visible,
  editIndex,
  onClose,
}: {
  visible: boolean;
  editIndex: number | null;
  onClose: () => void;
}) {
  const inset = useSafeAreaInsets();
  const { data, update } = useOnboarding();
  const editing = editIndex != null ? data.extraWindows[editIndex] : null;

  const [label, setLabel] = useState('Lunch');
  const [start, setStart] = useState(12 * 60);
  const [end, setEnd] = useState(13 * 60);
  const [days, setDays] = useState<number[]>(WEEKDAYS);

  useEffect(() => {
    if (!visible) return;
    if (editing) {
      setLabel(editing.label);
      setStart(editing.start);
      setEnd(editing.end);
      setDays(editing.days);
    } else {
      setLabel('Lunch');
      setStart(12 * 60);
      setEnd(13 * 60);
      setDays(WEEKDAYS);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const toggleDay = (i: number) =>
    setDays((d) => (d.includes(i) ? d.filter((x) => x !== i) : [...d, i].sort()));

  const applyPreset = (p: Preset) => {
    setLabel(p.label);
    setStart(p.start);
    setEnd(p.end);
  };

  const save = () => {
    const w: GuardWindow = { label: label.trim() || 'Boundary', start, end, days };
    const next = [...data.extraWindows];
    if (editIndex != null) next[editIndex] = w;
    else next.push(w);
    update({ extraWindows: next });
    onClose();
  };

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end" style={{ paddingVertical: inset.bottom }}>
        <Pressable className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onPress={onClose} />
        <View className="gap-4 rounded-t-2xl border-t border-border bg-background px-6 pb-8 pt-3">
          <View className="items-center">
            <View className="h-1 w-10 rounded-full bg-border" />
          </View>
          <Text className="text-lg font-extrabold text-foreground">
            {editIndex != null ? 'Edit boundary' : 'New boundary'}
          </Text>

          {/* Presets */}
          <View className="flex-row flex-wrap gap-2">
            {PRESETS.map((p) => (
              <Pressable
                key={p.label}
                onPress={() => applyPreset(p)}
                className="rounded-full border border-border bg-card px-3 py-1.5 active:opacity-80">
                <Text className="text-xs font-bold text-muted">{p.label}</Text>
              </Pressable>
            ))}
          </View>

          {/* Label */}
          <TextInput
            value={label}
            onChangeText={setLabel}
            placeholder="Name (e.g. Lunch, Deep work)"
            placeholderTextColor={colors.subtle}
            className="rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground"
          />

          <Stepper label="From" icon="play-outline" tint={colors.success} value={start} onChange={setStart} />
          <Stepper label="Until" icon="stop-outline" tint={colors.warning} value={end} onChange={setEnd} />

          <View className="gap-2">
            <Text className="text-xs font-bold uppercase tracking-widest text-muted">Days</Text>
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

          <Button label="Save boundary" disabled={days.length === 0 || end <= start} onPress={save} />
        </View>
      </View>
    </Modal>
  );
}
