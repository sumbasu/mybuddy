import React from 'react';
import Svg, { Defs, RadialGradient, Stop, Circle, Path, Ellipse } from 'react-native-svg';

export default function TennisBall({ size = 140 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 140 140">
      <Defs>
        <RadialGradient id="ballFill" cx="35%" cy="30%" r="75%">
          <Stop offset="0" stopColor="#DCEB7E" />
          <Stop offset="0.5" stopColor="#C3D94A" />
          <Stop offset="1" stopColor="#8CB52E" />
        </RadialGradient>
      </Defs>
      <Circle cx={70} cy={70} r={68} fill="url(#ballFill)" />
      <Path d="M 8 45 Q 70 8 132 45" stroke="#FFFFFF" strokeWidth={5} fill="none" strokeLinecap="round" opacity={0.95} />
      <Path d="M 8 95 Q 70 132 132 95" stroke="#FFFFFF" strokeWidth={5} fill="none" strokeLinecap="round" opacity={0.95} />
      <Ellipse cx={50} cy={42} rx={18} ry={11} fill="#FFFFFF" opacity={0.3} />
    </Svg>
  );
}
