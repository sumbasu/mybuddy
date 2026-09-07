import React from 'react';
import { View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';

// Stylized "phone + call" illustration for the phone-number entry screen —
// a tilted handset with two lime ribbon accents behind it.
export default function PhoneIllustration({ size = 140 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 140 140" style={{ position: 'absolute' }}>
        <Rect x={6} y={58} width={68} height={20} rx={9} fill="#C5E637" transform="rotate(-16 40 68)" />
        <Rect x={66} y={54} width={66} height={18} rx={9} fill="#C5E637" transform="rotate(16 99 63)" />
        <Rect
          x={42} y={20} width={56} height={100} rx={15}
          fill="#BFE3FA" stroke="#16213E" strokeWidth={3}
          transform="rotate(-9 70 70)"
        />
        <Rect x={58} y={104} width={18} height={3.5} rx={1.75} fill="#16213E" opacity={0.35} transform="rotate(-9 70 70)" />
      </Svg>
      <View style={{
        width: 36, height: 36, borderRadius: 18, backgroundColor: '#16213E',
        alignItems: 'center', justifyContent: 'center', marginTop: -6,
      }}>
        <Ionicons name="call" size={17} color="#FFFFFF" />
      </View>
    </View>
  );
}
