import React from 'react';
import { Image } from 'react-native';

const ASPECT = 312 / 276;

export default function ShuttlecockIllustration({ size = 190 }: { size?: number }) {
  return (
    <Image
      source={require('../../assets/illustrations/shuttlecock.png')}
      style={{ width: size, height: size * ASPECT }}
      resizeMode="contain"
    />
  );
}
