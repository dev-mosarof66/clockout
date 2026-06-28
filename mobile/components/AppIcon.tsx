import { View, Text, Image } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import appIcons from '../data/appIcons.json';

const ICONS = appIcons as Record<string, string>;

type AppIconProps = {
  id: string;
  name: string;
  color: string;
  size?: number;
  radius?: number;
  /** Real installed-app launcher icon (PNG data URI) — preferred when present. */
  icon?: string;
};

// Renders ONLY the icon tile — callers lay out the name themselves. Prefers the
// real installed-app launcher icon (from the engine), then our bundled brand
// glyph (Simple Icons), and finally the app's first letter.
export function AppIcon({ id, name, color, size = 40, radius = 12, icon }: AppIconProps) {
  const path = ICONS[id];
  const glyph = size * 0.56;

  // Real device icon — already a full-bleed logo, so render it edge-to-edge.
  if (icon) {
    return (
      <Image
        source={{ uri: icon }}
        style={{ width: size, height: size, borderRadius: radius }}
      />
    );
  }

  return (
    <View
      className="items-center justify-center border border-border"
      style={{ width: size, height: size, borderRadius: radius, backgroundColor: color }}>
      {path ? (
        <Svg width={glyph} height={glyph} viewBox="0 0 24 24">
          <Path d={path} fill="#FFFFFF" />
        </Svg>
      ) : (
        <Text style={{ fontSize: size * 0.44, fontWeight: '800', color: '#FFFFFF' }}>
          {(name.trim().charAt(0) || '?').toUpperCase()}
        </Text>
      )}
    </View>
  );
}
