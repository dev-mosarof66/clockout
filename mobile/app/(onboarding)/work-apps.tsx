import { useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { WORK_APPS, type WorkApp } from '../../data/workApps';
import { Button } from '../../components/Button';
import { AppIcon } from '../../components/AppIcon';
import { useOnboarding } from '../../lib/onboarding';

export default function WorkApps() {
    const inset = useSafeAreaInsets()
  const { data, update } = useOnboarding();

  // Hydrate from persisted selections (incl. any previously-added custom apps).
  const [apps, setApps] = useState<WorkApp[]>(() => {
    const extra = data.workApps
      .filter((id) => !WORK_APPS.some((a) => a.id === id))
      .map((id) => ({
        id,
        name: id.replace(/^custom-/, '').replace(/-/g, ' '),
        category: 'Custom',
        color: '#525252',
      }));
    return [...WORK_APPS, ...extra];
  });
  const [selected, setSelected] = useState<Record<string, boolean>>(() => {
    if (data.workApps.length) {
      const base: Record<string, boolean> = {};
      data.workApps.forEach((id) => (base[id] = true));
      return base;
    }
    return Object.fromEntries(WORK_APPS.map((a) => [a.id, !!a.preselected]));
  });
  const [draft, setDraft] = useState('');

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

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <View className="flex-1 px-6 pt-2">
        {/* Header */}
        <View className="gap-1.5 pb-4">
          <View className="flex-row items-center gap-1.5">
            <View className="h-1.5 w-6 rounded-full bg-primary" />
            <View className="h-1.5 w-6 rounded-full bg-border" />
            <View className="h-1.5 w-6 rounded-full bg-border" />
            <Text className="ml-1 text-[11px] font-bold uppercase tracking-widest text-muted">
              Step 1 of 3
            </Text>
          </View>
          <Text className="text-2xl font-extrabold text-foreground">What are your work apps?</Text>
          <Text className="text-base leading-relaxed text-muted">
            Pick the apps Clockout should clock you out of after hours. You can change these anytime.
          </Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
          <View className="gap-2.5">
            {apps.map((app) => {
              const on = !!selected[app.id];
              return (
                <Pressable
                  key={app.id}
                  onPress={() => toggle(app.id)}
                  className={`flex-row items-center gap-3 rounded-2xl border p-3 active:opacity-80 ${
                    on ? 'border-primary bg-primary/10' : 'border-border bg-card'
                  }`}>
                  <AppIcon id={app.id} name={app.name} color={app.color} size={40} />
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
            <View className="mt-1 flex-row items-center gap-2">
              <TextInput
                value={draft}
                onChangeText={setDraft}
                onSubmitEditing={addCustom}
                returnKeyType="done"
                placeholder="Add another app (e.g. Asana, Discord)"
                placeholderTextColor="#525252"
                className="flex-1 rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground"
              />
              <Pressable
                onPress={addCustom}
                className="h-11 w-11 items-center justify-center rounded-xl bg-card border border-border active:opacity-80">
                <Text className="text-lg font-black text-primary">+</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>

        {/* Footer */}
        <View className="gap-2 pt-3" style={{paddingBottom: inset.bottom - 20}}>
          <Button
            disabled={count === 0}
            onPress={() => {
              update({ workApps: apps.filter((a) => selected[a.id]).map((a) => a.id) });
              router.push('/work-hours');
            }}
            label={count === 0 ? 'Select at least one app' : `Continue with ${count} app${count > 1 ? 's' : ''}`}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
