import React from 'react';
import { View } from 'react-native';
import Svg, { Path, Rect, Circle } from 'react-native-svg';

// Empty-state illustration for "Your posts" — a phone mockup showing a post
// preview, in front of a lime arch, matching the reference screen.
export default function NoPostsIllustration({ size = 200 }: { size?: number }) {
  const h = size * 1.32;
  return (
    <View style={{ width: size, height: h, alignItems: 'center', justifyContent: 'flex-end' }}>
      <Svg width={size} height={h} viewBox="0 0 200 264" style={{ position: 'absolute', bottom: 0 }}>
        {/* Lime arch */}
        <Path
          d="M 8 264 L 8 130 A 92 92 0 0 1 192 130 L 192 264 Z"
          fill="#C5E637"
        />
        {/* Phone body */}
        <Rect x="62" y="30" width="76" height="220" rx="16" fill="#FFFFFF" stroke="#3D2E7C" strokeWidth="5" />
        {/* Notch */}
        <Rect x="90" y="42" width="20" height="4" rx="2" fill="#3D2E7C" />
        {/* Title bar */}
        <Rect x="76" y="62" width="34" height="6" rx="3" fill="#8BC34A" />
        {/* Avatar dots */}
        <Circle cx="82" cy="86" r="7" fill="#4B3B8C" />
        <Circle cx="97" cy="86" r="7" fill="#6C5CA6" />
        <Circle cx="112" cy="86" r="7" fill="#C5E637" />
        {/* Text line */}
        <Rect x="76" y="102" width="48" height="6" rx="3" fill="#E3E1EC" />
        {/* Second row */}
        <Circle cx="82" cy="128" r="6" fill="#C7BFE8" />
        <Rect x="94" y="125" width="30" height="6" rx="3" fill="#E3E1EC" />
        {/* Heart + line */}
        <Path
          d="M 78 148 c -2 -2 -5 -1 -5 2 c 0 3 5 6 5 6 s 5 -3 5 -6 c 0 -3 -3 -4 -5 -2 Z"
          fill="none" stroke="#B7B2C4" strokeWidth="1.4"
        />
        <Rect x="90" y="150" width="24" height="4.5" rx="2.25" fill="#EDEBF3" />
      </Svg>
    </View>
  );
}
