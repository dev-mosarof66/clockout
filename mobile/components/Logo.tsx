import Svg, { Rect, Path, Circle, G } from 'react-native-svg';
import { colors } from '../theme/colors';

type LogoProps = {
  size?: number;
  /** 'tile' = glyph on the orange Signature tile; 'glyph' = just the mark. */
  variant?: 'tile' | 'glyph';
  tileColor?: string;
  glyphColor?: string;
};

/**
 * Clockout "Power-Clock" mark — a power symbol with clock ticks ("clock OFF").
 * Single source of the in-app logo; matches assets/logo-icon.svg.
 */
export function Logo({ size = 48, variant = 'tile', tileColor = colors.primary, glyphColor }: LogoProps) {
  const ink = glyphColor ?? (variant === 'tile' ? colors.primaryForeground : colors.primary);
  return (
    <Svg width={size} height={size} viewBox="0 0 1024 1024">
      {variant === 'tile' && <Rect width={1024} height={1024} rx={230} fill={tileColor} />}
      <G fill="none" stroke={ink} strokeWidth={72} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M360 352 A300 300 0 1 0 664 352" />
        <Path d="M512 260 V500" />
      </G>
      <G fill={ink}>
        <Circle cx={512} cy={824} r={26} />
        <Circle cx={824} cy={512} r={26} />
        <Circle cx={200} cy={512} r={26} />
      </G>
    </Svg>
  );
}
