import React from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';

// Exact radial gradient from the Figma "Home screen design" file (WelcomeScreen node 1:21/1:11),
// reproduced with react-native-svg. viewBox + preserveAspectRatio="none" mirror Figma's own
// technique for stretching the ellipse to fill any screen size.
export default function GradientBackground() {
  return (
    <Svg
      style={StyleSheet.absoluteFillObject}
      viewBox="0 0 310.49 695.64"
      preserveAspectRatio="none"
      pointerEvents="none"
    >
      <Defs>
        <RadialGradient
          id="base"
          gradientUnits="userSpaceOnUse"
          cx="0" cy="0" r="10"
          gradientTransform="matrix(0 -49.189 -21.955 0 155.25 347.82)"
        >
          <Stop offset="0" stopColor="#2E2260" stopOpacity={1} />
          <Stop offset="0.5" stopColor="#4B3B8C" stopOpacity={1} />
          <Stop offset="0.75" stopColor="#6353A6" stopOpacity={1} />
          <Stop offset="1" stopColor="#7B6BBF" stopOpacity={1} />
        </RadialGradient>
        <RadialGradient
          id="vignette"
          gradientUnits="userSpaceOnUse"
          cx="0" cy="0" r="10"
          gradientTransform="matrix(0 -48.695 -24.839 0 155.25 347.82)"
        >
          <Stop offset="0.4" stopColor="#140A32" stopOpacity={0} />
          <Stop offset="1" stopColor="#140A32" stopOpacity={0.25} />
        </RadialGradient>
      </Defs>
      <Rect x={0} y={0} width={310.49} height={695.64} fill="url(#base)" />
      <Rect x={0} y={0} width={310.49} height={695.64} fill="url(#vignette)" />
    </Svg>
  );
}
