import React from 'react';
import { View } from 'react-native';
import Svg, { Path, Rect, Line, Circle, Polygon, Ellipse, ClipPath, Defs } from 'react-native-svg';

const W = 220;
const H = 135;
const R = 16;

// Rounded top corners only, flat bottom — matches the reference's cropped card shape.
const CARD_PATH = `M ${R},0 H ${W - R} A ${R},${R} 0 0 1 ${W},${R} V ${H} H 0 V ${R} A ${R},${R} 0 0 1 ${R},0 Z`;

export default function SoccerGoalIllustration({ size = 240 }: { size?: number }) {
  const displayH = (size * H) / W;
  const vLines = [56, 72, 88, 104, 120, 136, 152, 168];
  const hLines = [34, 48, 62, 76, 90, 104];

  return (
    <View style={{ width: size, height: displayH, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={displayH} viewBox={`0 0 ${W} ${H}`}>
        <Defs>
          <ClipPath id="cardClip">
            <Path d={CARD_PATH} />
          </ClipPath>
        </Defs>
        <Path d={CARD_PATH} fill="#6FB865" />

        {/* Goal frame + net, clipped to the card */}
        <Rect x="40" y="16" width="140" height="9" fill="#FFFFFF" clipPath="url(#cardClip)" />
        <Rect x="40" y="16" width="9" height={H - 16} fill="#FFFFFF" clipPath="url(#cardClip)" />
        <Rect x="171" y="16" width="9" height={H - 16} fill="#FFFFFF" clipPath="url(#cardClip)" />

        {vLines.map((x) => (
          <Line key={`v${x}`} x1={x} y1="27" x2={x} y2={H} stroke="rgba(255,255,255,0.55)" strokeWidth="1.4" clipPath="url(#cardClip)" />
        ))}
        {hLines.map((y) => (
          <Line key={`h${y}`} x1="49" y1={y} x2="171" y2={y} stroke="rgba(255,255,255,0.55)" strokeWidth="1.4" clipPath="url(#cardClip)" />
        ))}

        {/* Ball shadow */}
        <Ellipse cx="158" cy="133" rx="28" ry="5" fill="#4E9A47" opacity="0.55" clipPath="url(#cardClip)" />

        {/* Ball — positioned low and right, cropped by the card's bottom edge like the reference */}
        <Circle cx="158" cy="118" r="30" fill="#FAFAF7" stroke="#1C1B29" strokeWidth="3" clipPath="url(#cardClip)" />
        <Polygon points="158,96 172,106 167,123 149,123 144,106" fill="#1C1B29" clipPath="url(#cardClip)" />
        <Polygon points="127,112 144,106 139,123 124,130" fill="#1C1B29" clipPath="url(#cardClip)" />
        <Polygon points="189,112 172,106 177,123 192,130" fill="#1C1B29" clipPath="url(#cardClip)" />
        <Polygon points="139,123 149,123 152,136 136,140" fill="#1C1B29" clipPath="url(#cardClip)" />
        <Polygon points="167,123 177,123 180,140 164,136" fill="#1C1B29" clipPath="url(#cardClip)" />
      </Svg>
    </View>
  );
}
