import React from 'react';
import Svg, { Circle, Ellipse, Path, Line, G } from 'react-native-svg';

// Flat sport-ball composition over a tennis court diagram — used on the Welcome screen.
export default function WelcomeHero({ width = 270, height = 233 }: { width?: number; height?: number }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 320 276">
      {/* Court lines */}
      <G stroke="rgba(255,255,255,0.28)" strokeWidth={1.6} fill="none">
        <Path d="M 113 34 L 207 34 L 257 241 L 63 241 Z" />
        <Line x1={89} y1={76} x2={231} y2={76} />
        <Line x1={160} y1={34} x2={160} y2={241} />
      </G>

      {/* Shuttlecock — top left */}
      <G>
        <Path d="M 30 74 Q 58 54 86 74 L 60 130 Q 58 133 56 130 Z" fill="#FFFFFF" />
        <Path d="M 41 79 L 52 124" stroke="#C9C4D6" strokeWidth={1.2} fill="none" />
        <Path d="M 58 70 L 58 128" stroke="#C9C4D6" strokeWidth={1.2} fill="none" />
        <Path d="M 75 79 L 64 124" stroke="#C9C4D6" strokeWidth={1.2} fill="none" />
        <Path d="M 30 74 Q 58 82 86 74" stroke="#C9C4D6" strokeWidth={1.2} fill="none" />
        <Ellipse cx={58} cy={130} rx={7} ry={8} fill="#C8DB2E" />
      </G>

      {/* Top-right ball */}
      <G>
        <Circle cx={262} cy={79} r={25} fill="#FFFFFF" />
        <Circle cx={262} cy={79} r={4.5} fill="#1A1A1A" />
        {[0, 72, 144, 216, 288].map((deg) => {
          const rad = (deg * Math.PI) / 180;
          const x1 = 262 + 5 * Math.cos(rad);
          const y1 = 79 + 5 * Math.sin(rad);
          const x2 = 262 + 18 * Math.cos(rad);
          const y2 = 79 + 18 * Math.sin(rad);
          return <Line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#1A1A1A" strokeWidth={1.4} strokeLinecap="round" />;
        })}
      </G>

      {/* Tennis ball — center (brand mark) */}
      <G>
        <Path d="M 193 117 L 226 75 L 181 105 Z" fill="#C8DB2E" stroke="#3A3A3A" strokeWidth={4} strokeLinejoin="round" />
        <Path d="M 197 131 L 219 99 L 183 121 Z" fill="#C8DB2E" stroke="#3A3A3A" strokeWidth={4} strokeLinejoin="round" />
        <Circle cx={160} cy={149} r={55} fill="#C8DB2E" stroke="#3A3A3A" strokeWidth={5} />
        <Path d="M 160 94 C 193 112 193 132 160 149 C 127 166 127 186 160 204" stroke="#3A3A3A" strokeWidth={4} fill="none" strokeLinecap="round" />
        <Path d="M 133 117 A 42 42 0 0 1 157 97" stroke="#FFFFFF" strokeOpacity={0.45} strokeWidth={5} fill="none" strokeLinecap="round" />
      </G>

      {/* Basketball — bottom left */}
      <G>
        <Circle cx={68} cy={219} r={20} fill="#E8963C" />
        <Line x1={68} y1={199} x2={68} y2={239} stroke="#1A1A1A" strokeWidth={1.4} />
        <Path d="M 48 219 L 88 219" stroke="#1A1A1A" strokeWidth={1.4} />
        <Path d="M 51 204 Q 68 219 51 234" stroke="#1A1A1A" strokeWidth={1.4} fill="none" />
        <Path d="M 85 204 Q 68 219 85 234" stroke="#1A1A1A" strokeWidth={1.4} fill="none" />
      </G>

      {/* Cricket ball — bottom right */}
      <G>
        <Circle cx={247} cy={223} r={21} fill="#C85A4E" />
        <Path d="M 247 202 A 21 21 0 0 1 247 244 Z" fill="#8B332B" />
        <Line x1={247} y1={205} x2={247} y2={241} stroke="#FFFFFF" strokeWidth={1.8} />
        {[207, 213, 219, 223, 229, 235, 241].map((y) => (
          <Line key={y} x1={242} y1={y} x2={252} y2={y} stroke="#FFFFFF" strokeWidth={1.2} />
        ))}
      </G>
    </Svg>
  );
}
