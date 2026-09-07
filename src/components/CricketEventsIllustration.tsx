import React from 'react';
import { Image } from 'react-native';

const ASPECT = 277 / 313;

export default function CricketEventsIllustration({ size = 200 }: { size?: number }) {
  return (
    <Image
      source={require('../../assets/illustrations/cricket_events.png')}
      style={{ width: size, height: size * ASPECT }}
      resizeMode="contain"
    />
  );
}
