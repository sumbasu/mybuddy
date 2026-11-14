// Nearby-venue search backed by a bundled snapshot of real Bengaluru venues
// (src/data/venues_bengaluru.json), scraped from District (Zomato's sports-
// booking app). Replaces an earlier OpenStreetMap/Overpass-based version —
// live testing showed the free public Overpass mirrors fail independently
// and unpredictably (one fully unresponsive, one 500ing, one serving a
// stale/incomplete dataset, sometimes all three at once), and OSM's own
// sport-venue tagging is inconsistent outside well-mapped pockets. This
// bundled data is a point-in-time snapshot (captured 2026-10-30) rather than
// a live source, so it won't reflect venues District adds, removes, or
// re-prices after that date — only Bengaluru is covered for now.
import venueData from '../data/venues_bengaluru.json';

const RADIUS_KM = 5;

export interface Venue {
  id: string;
  name: string;
  lat: number;
  lng: number;
  distanceKm: number;
  address?: string;
  rating?: number;
  ratingCount?: number;
  amenities?: string[];
  sportSummary?: string;
  bookingUrl?: string;
}

// Maps this app's interest ids (src/constants/interests.ts) to the sport
// names District's own data uses. Several District sports fold into one
// interest here (Box Cricket/Cricket/Cricket Nets -> cricket); District
// sports with no equivalent interest (Volleyball, Snooker, Pool) are left
// out, same as interests with no realistic court-booking venue (running,
// yoga, hiking, ...) were never mapped for the old OSM version either.
const SPORT_NAMES: Record<string, string[]> = {
  tennis: ['Tennis'],
  badminton: ['Badminton'],
  cricket: ['Box Cricket', 'Cricket', 'Cricket Nets'],
  football: ['Football', 'Turf Football'],
  basketball: ['Basketball'],
  swimming: ['Swimming'],
  squash: ['Squash'],
  tabletennis: ['Table Tennis'],
  pickleball: ['Pickleball'],
  paddle: ['Padel'],
};

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function searchVenues(activityId: string, lat: number, lng: number): Promise<Venue[]> {
  const sportNames = SPORT_NAMES[activityId];
  if (!sportNames) return [];

  const results: Venue[] = [];
  for (const venue of venueData.venues) {
    const match = venue.sports.find((s) => sportNames.includes(s.sport));
    if (!match) continue;

    const distanceKm = haversineKm(lat, lng, venue.lat, venue.lng);
    if (distanceKm > RADIUS_KM) continue;

    results.push({
      id: venue.id,
      name: venue.name,
      lat: venue.lat,
      lng: venue.lng,
      distanceKm,
      address: venue.address || undefined,
      rating: venue.rating ?? undefined,
      ratingCount: venue.ratingCount ?? undefined,
      amenities: venue.amenities,
      sportSummary: match.summary || undefined,
      bookingUrl: venue.shareLink || undefined,
    });
  }

  results.sort((a, b) => a.distanceKm - b.distanceKm);
  return results;
}
