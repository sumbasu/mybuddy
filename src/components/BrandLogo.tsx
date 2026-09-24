import React from 'react';
import { Image } from 'react-native';

const ASPECT = 497 / 656;

// The Sweatbud mark — cropped straight from the app icon artwork, so it's pixel-identical everywhere it appears.
export default function BrandLogo({ size = 72 }: { size?: number }) {
  return (
    <Image
      source={require('../../assets/illustrations/brand-ball.png')}
      style={{ width: size, height: size * ASPECT }}
      resizeMode="contain"
    />
  );
}
