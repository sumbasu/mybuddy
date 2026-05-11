import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { searchCities, isValidCity } from '../constants/cities';
import { COLORS, SPACING, RADIUS, SHADOW } from '../constants/theme';

interface Props {
  value: string;
  onChange: (city: string) => void;
  label?: string;
  placeholder?: string;
}

export default function CityPicker({ value, onChange, label = 'City', placeholder = 'Search city...' }: Props) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [focused, setFocused] = useState(false);

  const valid = isValidCity(value);

  const handleChange = (text: string) => {
    setQuery(text);
    onChange(''); // clear valid selection while typing
    setSuggestions(searchCities(text));
  };

  const select = (city: string) => {
    setQuery(city);
    onChange(city);
    setSuggestions([]);
    setFocused(false);
  };

  const borderColor = !focused
    ? COLORS.border
    : valid
    ? COLORS.success
    : query.length > 0
    ? COLORS.error
    : COLORS.primary;

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View style={[styles.inputRow, { borderColor }]}>
        <Ionicons
          name="location-outline"
          size={18}
          color={valid ? COLORS.success : focused ? COLORS.primary : COLORS.textMuted}
        />
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={handleChange}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textMuted}
          onFocus={() => {
            setFocused(true);
            setSuggestions(searchCities(query));
          }}
          onBlur={() => {
            // Delay to allow tap on suggestion
            setTimeout(() => {
              setFocused(false);
              if (!valid) setSuggestions([]);
            }, 150);
          }}
          returnKeyType="done"
          autoCorrect={false}
        />
        {valid && <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />}
        {!valid && query.length > 0 && !focused && (
          <Ionicons name="alert-circle" size={18} color={COLORS.error} />
        )}
        {query.length > 0 && (
          <TouchableOpacity onPress={() => { setQuery(''); onChange(''); setSuggestions([]); }}>
            <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Validation hint */}
      {query.length > 1 && !valid && !focused && (
        <Text style={styles.errorHint}>
          "{query}" is not in our city list. Please select from suggestions.
        </Text>
      )}

      {/* Suggestions dropdown */}
      {suggestions.length > 0 && focused && (
        <View style={styles.dropdown}>
          <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled>
            {suggestions.map((city) => (
              <TouchableOpacity key={city} style={styles.suggestion} onPress={() => select(city)}>
                <Ionicons name="location-outline" size={14} color={COLORS.primary} />
                <Text style={styles.suggestionText}>{city}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* No results */}
      {focused && query.length > 1 && suggestions.length === 0 && !valid && (
        <View style={styles.dropdown}>
          <View style={styles.suggestion}>
            <Ionicons name="search-outline" size={14} color={COLORS.textMuted} />
            <Text style={styles.noResultText}>No city found. Try a different spelling.</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: SPACING.sm },
  label: {
    fontSize: 12, fontWeight: '600', color: COLORS.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: SPACING.xs,
  },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    borderWidth: 1.5, borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md, paddingVertical: 11,
    backgroundColor: COLORS.surface,
  },
  input: { flex: 1, fontSize: 15, color: COLORS.textPrimary },
  errorHint: { fontSize: 11, color: COLORS.error, marginTop: 4, marginLeft: 2 },
  dropdown: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border,
    maxHeight: 220, marginTop: 4, ...SHADOW.md,
  },
  suggestion: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    paddingHorizontal: SPACING.md, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  suggestionText: { fontSize: 14, color: COLORS.textPrimary },
  noResultText: { fontSize: 13, color: COLORS.textMuted, fontStyle: 'italic' },
});
