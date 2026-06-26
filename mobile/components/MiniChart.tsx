import Svg, { Path, Defs, LinearGradient, Stop, Circle } from 'react-native-svg';
import { colors } from '../theme/colors';

type MiniChartProps = {
  data: number[];
  width: number;
  height: number;
  color?: string;
};

// Real area + line chart (SVG): smooth-ish line, gradient fill, point markers,
// with today's point emphasized.
export function MiniChart({ data, width, height, color = colors.primary }: MiniChartProps) {
  const n = data.length;
  const max = Math.max(1, ...data);
  const padX = 4;
  const padY = 12;

  const x = (i: number) => (n <= 1 ? width / 2 : padX + (i / (n - 1)) * (width - padX * 2));
  const y = (v: number) => height - padY - (v / max) * (height - padY * 2);

  const pts = data.map((v, i) => [x(i), y(v)] as const);
  const line = pts.map(([px, py], i) => `${i ? 'L' : 'M'} ${px.toFixed(1)} ${py.toFixed(1)}`).join(' ');
  const area = `${line} L ${x(n - 1).toFixed(1)} ${height} L ${x(0).toFixed(1)} ${height} Z`;

  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id="miniFill" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity={0.32} />
          <Stop offset="1" stopColor={color} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Path d={area} fill="url(#miniFill)" />
      <Path d={line} stroke={color} strokeWidth={2.5} fill="none" strokeLinejoin="round" strokeLinecap="round" />
      {pts.map(([px, py], i) => {
        const today = i === n - 1;
        return (
          <Circle
            key={i}
            cx={px}
            cy={py}
            r={today ? 4.5 : 3}
            fill={today ? color : colors.card}
            stroke={color}
            strokeWidth={2}
          />
        );
      })}
    </Svg>
  );
}
