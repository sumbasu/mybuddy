import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../constants/theme';

interface Props {
  rating: number;           // current value (0–5, can be decimal for display)
  max?: number;             // default 5
  size?: number;
  interactive?: boolean;    // true = tappable
  onChange?: (value: number) => void;
  showLabel?: boolean;
  reviewCount?: number;
}

export default function StarRating({
  rating, max = 5, size = 16, interactive = false,
  onChange, showLabel = false, reviewCount,
}: Props) {
  return (
    <View style={styles.row}>
      {Array.from({ length: max }).map((_, i) => {
        const filled = i < Math.floor(rating);
        const half   = !filled && i < rating;
        const name   = filled ? 'star' : half ? 'star-half' : 'star-outline';
        const color  = filled || half ? '#F59E0B' : COLORS.textMuted;

        return interactive ? (
          <TouchableOpacity key={i} onPress={() => onChange?.(i + 1)} activeOpacity={0.7}>
            <Ionicons name={name} size={size} color={color} />
          </TouchableOpacity>
        ) : (
          <Ionicons key={i} name={name} size={size} color={color} />
        );
      })}
      {showLabel && rating > 0 && (
        <Text style={[styles.label, { fontSize: size * 0.85 }]}>
          {rating.toFixed(1)}{reviewCount !== undefined ? ` (${reviewCount})` : ''}
        </Text>
      )}
      {showLabel && rating === 0 && (
        <Text style={[styles.noRating, { fontSize: size * 0.85 }]}>No ratings yet</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  label: { color: COLORS.textSecondary, fontWeight: '600', marginLeft: SPACING.xs },
  noRating: { color: COLORS.textMuted, marginLeft: SPACING.xs },
});
