import { View, Text } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import appIcons from '../data/appIcons.json';

const ICONS = appIcons as Record<string, string>;

type AppIconProps = {
  id: string;
  name: string;
  color: string;
  size?: number;
  radius?: number;
};

// Shows the app's brand glyph (Simple Icons paths) on its brand-colored tile;
// falls back to the first letter for custom apps with no icon.
export function AppIcon({ id, name, color, size = 40, radius = 12 }: AppIconProps) {
  const path = ICONS[id];
  const glyph = size * 0.56;
  return (
    <View className='flex flex-col items-center justify-center gap-2'>
      <View
        className="items-center justify-center border border-border"
        style={{ width: size, height: size, borderRadius: radius, backgroundColor: color }}>
        {path && (
          <Svg width={glyph} height={glyph} viewBox="0 0 24 24">
            <Path d={path} fill="#FFFFFF" />
          </Svg>
        )}
      </View>
      <Text className="font-black text-white text-xs">
        {name}
      </Text>
    </View>
  );
}
