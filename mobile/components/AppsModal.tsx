import { useEffect, useState } from 'react';
import { Modal, View, Text, Pressable, ScrollView, TextInput } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useOnboarding, FREE_APP_LIMIT } from '../lib/onboarding';
import { WORK_APPS, type WorkApp } from '../data/workApps';
import { Button } from './Button';
import { AppIcon } from './AppIcon';
import { colors } from '../theme/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const buildApps = (workApps: string[]): WorkApp[] => {
  const extra = workApps
    .filter((id) => !WORK_APPS.some((a) => a.id === id))
    .map((id) => ({
      id,
      name: id.replace(/^custom-/, '').replace(/-/g, ' '),
      category: 'Custom',
      color: '#525252',
    }));
  return [...WORK_APPS, ...extra];
};

export function AppsModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const inset = useSafeAreaInsets()
  const { data, update } = useOnboarding();
  const [apps, setApps] = useState<WorkApp[]>(() => buildApps(data.workApps));
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [draft, setDraft] = useState('');
  const [limitHit, setLimitHit] = useState(false);

  useEffect(() => {
    if (visible) {
      setApps(buildApps(data.workApps));
      const base: Record<string, boolean> = {};
      data.workApps.forEach((id) => (base[id] = true));
      setSelected(base);
      setDraft('');
      setLimitHit(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const count = Object.values(selected).filter(Boolean).length;
  const atFreeLimit = !data.pro && count >= FREE_APP_LIMIT;

  const toggle = (id: string) =>
    setSelected((s) => {
      const turningOn = !s[id];
      if (turningOn && !data.pro) {
        const cur = Object.values(s).filter(Boolean).length;
        if (cur >= FREE_APP_LIMIT) {
          setLimitHit(true);
          return s;
        }
      }
      return { ...s, [id]: !s[id] };
    });

  const addCustom = () => {
    const name = draft.trim();
    if (!name) return;
    if (atFreeLimit) {
      setLimitHit(true);
      return;
    }
    const id = `custom-${name.toLowerCase().replace(/\s+/g, '-')}`;
    if (!apps.some((a) => a.id === id)) {
      setApps((a) => [...a, { id, name, category: 'Custom', color: '#525252' }]);
      setSelected((s) => ({ ...s, [id]: true }));
    }
    setDraft('');
  };

  const save = () => {
    update({ workApps: apps.filter((a) => selected[a.id]).map((a) => a.id) });
    onClose();
  };

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end"  style={{paddingVertical: inset.bottom - 20}}>
        <Pressable className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onPress={onClose} />
        <View className="gap-3 rounded-t-3xl border-t border-border bg-background px-6 pb-8 pt-3" style={{ maxHeight: '85%' }}>
          <View className="items-center">
            <View className="h-1 w-10 rounded-full bg-border" />
          </View>
          <View className="flex-row items-center justify-between">
            <Text className="text-lg font-extrabold text-foreground">Guarded apps</Text>
            <Text className="text-xs font-bold text-primary">{count} selected</Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 4 }}>
            {apps.map((app) => {
              const on = !!selected[app.id];
              return (
                <Pressable
                  key={app.id}
                  onPress={() => toggle(app.id)}
                  className={`flex-row items-center gap-3 rounded-2xl border p-3 active:opacity-80 ${
                    on ? 'border-primary bg-primary/10' : 'border-border bg-card'
                  }`}>
                  <AppIcon id={app.id} name={app.name} color={app.color} size={38} />
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-foreground">{app.name}</Text>
                    <Text className="text-xs text-muted">{app.category}</Text>
                  </View>
                  <View
                    className={`h-6 w-6 items-center justify-center rounded-full border ${
                      on ? 'border-primary bg-primary' : 'border-border'
                    }`}>
                    {on && <Text className="text-xs font-black text-primary-foreground">✓</Text>}
                  </View>
                </Pressable>
              );
            })}

            {/* Add custom */}
            <View className="flex-row items-center gap-2">
              <TextInput
                value={draft}
                onChangeText={setDraft}
                onSubmitEditing={addCustom}
                returnKeyType="done"
                placeholder="Add another app (e.g. Asana)"
                placeholderTextColor="#525252"
                className="flex-1 rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground"
              />
              <Pressable
                onPress={addCustom}
                className="h-11 w-11 items-center justify-center rounded-xl border border-border bg-card active:opacity-80">
                <Text className="text-lg font-black text-primary">+</Text>
              </Pressable>
            </View>
          </ScrollView>

          {(limitHit || atFreeLimit) && (
            <Pressable
              onPress={() => {
                onClose();
                router.push('/paywall');
              }}
              className="flex-row items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-3 py-2.5 active:opacity-80">
              <Ionicons name="sparkles-outline" size={15} color={colors.primary} />
              <Text className="flex-1 text-xs leading-snug text-muted">
                Free guards <Text className="font-bold text-foreground">{FREE_APP_LIMIT} apps</Text>.
                <Text className="font-bold text-primary"> Go Pro</Text> for unlimited.
              </Text>
              <Ionicons name="chevron-forward" size={14} color={colors.primary} />
            </Pressable>
          )}

          <Button label="Save" disabled={count === 0} onPress={save} />
        </View>
      </View>
    </Modal>
  );
}
