import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator,
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { searchCities, isValidCity } from '../constants/cities';
import { searchRoadsAndLandmarks } from '../services/geocoding';
import { COLORS, SPACING, RADIUS, SHADOW } from '../constants/theme';

interface Props {
  value: string;
  onChange: (city: string) => void;
  label?: string;
  placeholder?: string;
  // 'dark' (default) matches the purple-gradient onboarding screens this
  // component was built for. 'light' is for white-card screens (Edit
  // Profile's redesign) where the dark variant's cream-on-translucent
  // colors would be unreadable.
  variant?: 'dark' | 'light';
}

const THEME = {
  dark: {
    label: COLORS.textSecondary,
    inputBg: COLORS.surface,
    inputBorder: COLORS.border,
    text: COLORS.textPrimary,
    placeholder: COLORS.textMuted,
    icon: COLORS.textMuted,
    dropdownBg: COLORS.surface,
    dropdownBorder: COLORS.border,
    suggestionBorder: COLORS.border,
  },
  light: {
    label: '#6E6E80',
    inputBg: '#FFFFFF',
    inputBorder: '#E6E6EC',
    text: '#1B1F3B',
    placeholder: '#9A9AAB',
    icon: '#9A9AAB',
    dropdownBg: '#FFFFFF',
    dropdownBorder: '#E6E6EC',
    suggestionBorder: '#E6E6EC',
  },
};

export default function CityPicker({ value, onChange, label = 'Location', placeholder = 'Search location...', variant = 'dark' }: Props) {
  const t = THEME[variant];
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [focused, setFocused] = useState(false);
  // Only flips true once the user actually edits the field — an existing
  // saved value that predates the current location list (e.g. a bare
  // "Bengaluru" from before neighborhood-level picking existed) shouldn't
  // show as an error the moment the screen opens.
  const [dirty, setDirty] = useState(false);
  // Best-effort device city, used only to sort suggestions — never requests
  // permission itself, so this stays silent if location isn't already on.
  const [priorityCity, setPriorityCity] = useState<string | undefined>(undefined);
  const [remoteLoading, setRemoteLoading] = useState(false);
  // A road/landmark pick (e.g. "MG Road, Bangalore") comes from Nominatim,
  // not the static list, so isValidCity() alone won't recognize it as valid.
  const [explicitlySelected, setExplicitlySelected] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
        const [place] = await Location.reverseGeocodeAsync({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        const city = place?.city || place?.subregion || place?.region;
        if (!cancelled && city) setPriorityCity(city);
      } catch {
        // Silent — falls back to the unsorted result order.
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const valid = explicitlySelected || isValidCity(value);
  // Whether to show the dropdown/error depends only on whether there are
  // matches — not on the `focused` flag, which can lag a beat behind the
  // real keyboard state and was hiding valid suggestions while still typing.
  const showDropdown = suggestions.length > 0;
  const showNoMatch = dirty && !showDropdown && !remoteLoading && query.trim().length > 1 && !valid;

  const handleChange = (text: string) => {
    setDirty(true);
    setExplicitlySelected(false);
    setQuery(text);
    onChange(''); // clear valid selection while typing

    const localMatches = searchCities(text, priorityCity);
    setSuggestions(localMatches);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = text.trim();
    if (trimmed.length < 3) {
      setRemoteLoading(false);
      return;
    }

    // Debounced so we stay well under Nominatim's 1 req/sec usage policy.
    const requestId = ++requestIdRef.current;
    setRemoteLoading(true);
    debounceRef.current = setTimeout(async () => {
      const remoteMatches = await searchRoadsAndLandmarks(trimmed);
      if (requestId !== requestIdRef.current) return; // stale — a newer keystroke superseded this
      setRemoteLoading(false);
      setSuggestions((prev) => {
        const seen = new Set(prev.map((c) => c.toLowerCase()));
        const merged = [...prev];
        for (const c of remoteMatches) {
          const key = c.toLowerCase();
          if (seen.has(key)) continue;
          seen.add(key);
          merged.push(c);
        }
        return merged.slice(0, 8);
      });
    }, 500);
  };

  const select = (city: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    requestIdRef.current++; // invalidate any in-flight remote search
    setRemoteLoading(false);
    setExplicitlySelected(true);
    setQuery(city);
    onChange(city);
    setSuggestions([]);
    setFocused(false);
  };

  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  const borderColor = !focused
    ? t.inputBorder
    : valid
    ? '#C8DB2E'
    : COLORS.primary;

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={[styles.label, { color: t.label }]}>{label}</Text> : null}

      <View style={[styles.inputRow, { borderColor, backgroundColor: t.inputBg }]}>
        <Ionicons
          name="location-outline"
          size={18}
          color={valid ? '#C8DB2E' : focused ? COLORS.primary : t.icon}
        />
        <TextInput
          style={[styles.input, { color: t.text }]}
          value={query}
          onChangeText={handleChange}
          placeholder={placeholder}
          placeholderTextColor={t.placeholder}
          onFocus={() => {
            setFocused(true);
            setSuggestions(searchCities(query, priorityCity));
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
        {remoteLoading && <ActivityIndicator size="small" color={t.icon} />}
        {valid && <Ionicons name="checkmark-circle" size={18} color={'#C8DB2E'} />}
        {showNoMatch && (
          <Ionicons name="alert-circle" size={18} color={COLORS.error} />
        )}
        {query.length > 0 && (
          <TouchableOpacity onPress={() => { setQuery(''); onChange(''); setSuggestions([]); }} hitSlop={12}>
            <Ionicons name="close-circle" size={18} color={t.icon} />
          </TouchableOpacity>
        )}
      </View>

      {/* Validation hint — only when there are genuinely no matches left to pick from */}
      {showNoMatch && (
        <Text style={styles.errorHint}>
          No matches for "{query}". Try a nearby area or road name.
        </Text>
      )}

      {/* Suggestions dropdown */}
      {showDropdown && (
        <View style={[styles.dropdown, { backgroundColor: t.dropdownBg, borderColor: t.dropdownBorder }]}>
          <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled>
            {suggestions.map((city) => (
              <TouchableOpacity key={city} style={[styles.suggestion, { borderBottomColor: t.suggestionBorder }]} onPress={() => select(city)}>
                <Ionicons name="location-outline" size={14} color={COLORS.primary} />
                <Text style={[styles.suggestionText, { color: t.text }]}>{city}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: SPACING.sm },
  label: {
    fontSize: 12, fontWeight: '600',
    textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: SPACING.xs,
  },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    borderWidth: 1.5, borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md, paddingVertical: 11,
  },
  input: { flex: 1, fontSize: 15 },
  errorHint: { fontSize: 11, color: COLORS.error, marginTop: 4, marginLeft: 2 },
  dropdown: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    maxHeight: 220, marginTop: 4, ...SHADOW.md,
  },
  suggestion: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    minHeight: 44,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
  },
  suggestionText: { fontSize: 14 },
  noResultText: { fontSize: 13, color: COLORS.textMuted, fontStyle: 'italic' },
});
