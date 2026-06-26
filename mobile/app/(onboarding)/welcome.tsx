import { useRef, useState } from 'react';
import { View, Text, Pressable, FlatList, useWindowDimensions } from 'react-native';
import type { ListRenderItemInfo, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import LottieView from 'lottie-react-native';
import { Button } from '../../components/Button';

type Slide = {
  key: string;
  lottie: unknown;
  eyebrow: string;
  title: string;
  body: string;
  size?: number; // animation render size in px; defaults to 240
};

const SLIDES: Slide[] = [
  {
    key: 'apps',
    lottie: require('../../assets/lottie/apps.json'),
    eyebrow: 'Step 1',
    title: 'It knows your work apps',
    body: 'Slack, Teams, Gmail, Jira — Clockout learns which apps are work. You confirm in seconds.',
  },
  {
    key: 'clock',
    lottie: require('../../assets/lottie/clock.json'),
    eyebrow: 'Step 2',
    title: 'It knows when you’re off',
    body: 'Set your hours once. Clockout watches for work apps opening after hours.',
    size: 170,
  },
  {
    key: 'breathe',
    lottie: require('../../assets/lottie/breathe.json'),
    eyebrow: 'Step 3',
    title: 'It gently clocks you out',
    body: 'Open Slack at 9:40pm and Clockout pauses you with a breath. One tap to reclaim your evening.',
  },
];

export default function Welcome() {
  const inset = useSafeAreaInsets()
  const { width } = useWindowDimensions();
  const listRef = useRef<FlatList<Slide>>(null);
  const [index, setIndex] = useState(0);
  const isLast = index === SLIDES.length - 1;

  const finish = () => router.replace('/work-apps');

  const onNext = () => {
    if (isLast) return finish();
    listRef.current?.scrollToIndex({ index: index + 1, animated: true });
  };

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIndex(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  const renderItem = ({ item }: ListRenderItemInfo<Slide>) => (
    <View style={{ width }} className="flex-1 items-center justify-center px-8">
      <View style={{ height: 200, width: 200 }} className="items-center justify-center">
        <LottieView
          source={item.lottie as any}
          autoPlay
          loop
          style={{ width: item.size ?? 200, height: item.size ?? 200 }}
        />
      </View>
      <Text className="mt-8 text-sm font-bold uppercase tracking-[3px] text-primary">
        {item.eyebrow}
      </Text>
      <Text className="mt-2 text-center text-3xl font-extrabold text-foreground">{item.title}</Text>
      <Text className="mt-3 text-center text-lg leading-relaxed text-muted">{item.body}</Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      {/* Header */}
      <View className="h-12 flex-row items-center justify-between px-6">
        <View className="flex-row items-center">
          <LottieView
            source={require('../../assets/lottie/logo.json')}
            autoPlay
            loop
            style={{ width: 38, height: 38 }}
          />
        </View>
        {!isLast && (
          <Pressable hitSlop={12} onPress={finish}>
            <Text className="text-base font-semibold text-muted">Skip</Text>
          </Pressable>
        )}
      </View>

      {/* Slides */}
      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(s) => s.key}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
      />

      {/* Dots + CTA */}
      <View className="gap-5 px-6" style={{paddingBottom: inset.bottom - 20}}>
        <View className="flex-row justify-center gap-2">
          {SLIDES.map((s, i) => (
            <View
              key={s.key}
              className={`h-2 rounded-full ${i === index ? 'w-6 bg-primary' : 'w-2 bg-border'}`}
            />
          ))}
        </View>
        <Button label={isLast ? 'Set up my boundaries' : 'Next'} onPress={onNext} />
      </View>
    </SafeAreaView>
  );
}
