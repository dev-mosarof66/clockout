import { useEffect, useState } from 'react';
import { Modal, View, Text, Pressable, ScrollView, TextInput } from 'react-native';
import { useOnboarding } from '../lib/onboarding';
import { WORK_APPS, type WorkApp } from '../data/workApps';
import { Button } from './Button';
import { AppIcon } from './AppIcon';

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
  const { data, update } = useOnboarding();
  const [apps, setApps] = useState<WorkApp[]>(() => buildApps(data.workApps));
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [draft, setDraft] = useState('');

  useEffect(() => {
    if (visible) {
      setApps(buildApps(data.workApps));
      const base: Record<string, boolean> = {};
      data.workApps.forEach((id) => (base[id] = true));
      setSelected(base);
      setDraft('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const count = Object.values(selected).filter(Boolean).length;
  const toggle = (id: string) => setSelected((s) => ({ ...s, [id]: !s[id] }));

  const addCustom = () => {
    const name = draft.trim();
    if (!name) return;
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
      <View className="flex-1 justify-end">
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
                    <Text className="text-[11px] text-muted">{app.category}</Text>
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

          <Button label="Save" disabled={count === 0} onPress={save} />
        </View>
      </View>
    </Modal>
  );
}
