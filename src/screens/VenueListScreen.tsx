import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Linking, Platform, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import { searchVenues, Venue } from '../services/venues';
import InterestIcon from '../components/InterestIcon';
import { FONTS, SPACING } from '../constants/theme';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'VenueList'>;
  route: RouteProp<RootStackParamList, 'VenueList'>;
};

const C = {
  brand: '#695DA1',
  purple: '#3D3081',
  lime: '#C9E24B',
  bg: '#F7F7F9',
  surface: '#FFFFFF',
  border: '#E6E6EC',
  heading: '#3D3081',
  textMuted: '#6E6E80',
  textSubtle: '#9A9AAB',
  tint: '#ECEBF4',
};

type Status = 'loading' | 'denied' | 'error' | 'ready';

export default function VenueListScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { activityId, activityLabel } = route.params;

  const [status, setStatus] = useState<Status>('loading');
  const [venues, setVenues] = useState<Venue[]>([]);

  const load = async () => {
    setStatus('loading');
    try {
      const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
      let permission = existingStatus;
      if (permission !== 'granted') {
        const req = await Location.requestForegroundPermissionsAsync();
        permission = req.status;
      }
      if (permission !== 'granted') {
        setStatus('denied');
        return;
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const results = await searchVenues(activityId, position.coords.latitude, position.coords.longitude);
      setVenues(results);
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openDirections = (venue: Venue) => {
    const label = encodeURIComponent(venue.name);
    const url = Platform.OS === 'ios'
      ? `https://maps.apple.com/?daddr=${venue.lat},${venue.lng}&q=${label}`
      : `https://www.google.com/maps/dir/?api=1&destination=${venue.lat},${venue.lng}`;
    Linking.openURL(url);
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color={C.brand} />
        </TouchableOpacity>
        <View style={styles.titleRow}>
          <View style={styles.titleIconWrap}>
            <InterestIcon id={activityId} size={20} color={C.purple} />
          </View>
          <View>
            <Text style={styles.title}>{activityLabel} venues</Text>
            <Text style={styles.subtitle}>Within 5 km of you</Text>
          </View>
        </View>
      </View>

      {status === 'loading' && (
        <View style={styles.center}>
          <ActivityIndicator color={C.brand} size="large" />
        </View>
      )}

      {status === 'denied' && (
        <View style={styles.center}>
          <Ionicons name="location-outline" size={40} color={C.textSubtle} />
          <Text style={styles.messageTitle}>Location access needed</Text>
          <Text style={styles.messageSub}>Turn on location so we can find venues near you.</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => (Platform.OS === 'ios' ? Linking.openURL('app-settings:') : Linking.openSettings())}
            activeOpacity={0.85}
          >
            <Text style={styles.retryBtnText}>Open Settings</Text>
          </TouchableOpacity>
        </View>
      )}

      {status === 'error' && (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={40} color={C.textSubtle} />
          <Text style={styles.messageTitle}>Couldn't load venues</Text>
          <Text style={styles.messageSub}>Check your connection and try again.</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={load} activeOpacity={0.85}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {status === 'ready' && venues.length === 0 && (
        <View style={styles.center}>
          <Ionicons name="compass-outline" size={40} color={C.textSubtle} />
          <Text style={styles.messageTitle}>No venues found nearby</Text>
          <Text style={styles.messageSub}>
            We couldn't find any {activityLabel.toLowerCase()} venues within 5 km. Try again later as our map data grows.
          </Text>
        </View>
      )}

      {status === 'ready' && venues.length > 0 && (
        <ScrollView
          contentContainerStyle={{ padding: SPACING.lg, paddingBottom: insets.bottom + SPACING.xl }}
          showsVerticalScrollIndicator={false}
        >
          {venues.map((venue) => (
            <View key={venue.id} style={styles.card}>
              <View style={styles.cardIconWrap}>
                <InterestIcon id={activityId} size={20} color={C.purple} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardName} numberOfLines={2}>{venue.name}</Text>
                {venue.address && <Text style={styles.cardAddress} numberOfLines={1}>{venue.address}</Text>}
                <Text style={styles.cardDistance}>{venue.distanceKm.toFixed(1)} km away</Text>
              </View>
              <TouchableOpacity style={styles.directionsBtn} onPress={() => openDirections(venue)} hitSlop={8}>
                <Ionicons name="navigate" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, paddingHorizontal: SPACING.xl },

  header: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.md },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
    marginBottom: SPACING.md,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  titleIconWrap: {
    width: 40, height: 40, borderRadius: 14, backgroundColor: C.tint,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontFamily: FONTS.extraBold, fontSize: 20, color: C.heading },
  subtitle: { fontFamily: FONTS.regular, fontSize: 13, color: C.textMuted, marginTop: 2 },

  messageTitle: { fontFamily: FONTS.bold, fontSize: 16, color: C.heading, marginTop: SPACING.sm, textAlign: 'center' },
  messageSub: { fontFamily: FONTS.regular, fontSize: 13.5, color: C.textMuted, textAlign: 'center', lineHeight: 19 },
  retryBtn: {
    marginTop: SPACING.md, backgroundColor: C.brand, borderRadius: 999,
    paddingHorizontal: SPACING.xl, height: 46, alignItems: 'center', justifyContent: 'center',
  },
  retryBtnText: { fontFamily: FONTS.bold, fontSize: 14, color: '#fff' },

  card: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    backgroundColor: C.surface, borderRadius: 18, borderWidth: 1, borderColor: C.border,
    padding: SPACING.md, marginBottom: SPACING.sm + 2,
  },
  cardIconWrap: {
    width: 44, height: 44, borderRadius: 14, backgroundColor: C.tint,
    alignItems: 'center', justifyContent: 'center',
  },
  cardName: { fontFamily: FONTS.semiBold, fontSize: 15, color: C.heading },
  cardAddress: { fontFamily: FONTS.regular, fontSize: 12.5, color: C.textMuted, marginTop: 2 },
  cardDistance: { fontFamily: FONTS.medium, fontSize: 12.5, color: C.brand, marginTop: 3 },
  directionsBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: C.brand,
    alignItems: 'center', justifyContent: 'center',
  },
});
