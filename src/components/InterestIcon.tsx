import React from 'react';
import { StyleProp, TextStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { INTERESTS } from '../constants/interests';
import { COLORS } from '../constants/theme';

type Props = {
  id?: string;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
};

export default function InterestIcon({ id, size = 20, color = COLORS.textPrimary, style }: Props) {
  const icon = INTERESTS.find((i) => i.id === id)?.icon || 'shape-outline';
  return <MaterialCommunityIcons name={icon as any} size={size} color={color} style={style} />;
}
