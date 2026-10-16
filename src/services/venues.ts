// Nearby-venue search via OpenStreetMap's Overpass API — free, no API key,
// consistent with the Nominatim geocoding already used in CityPicker
// (src/services/geocoding.ts). Overpass has no official rate-limit doc like
// Nominatim's, but the public instance asks for restraint, so this is used
// on-demand only (one query per "Choose an activity" pick), never polled.
const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const RADIUS_METERS = 5000;

export interface Venue {
  id: string;
  name: string;
  lat: number;
  lng: number;
  distanceKm: number;
  address?: string;
}

// OSM `leisure` values that plausibly host each activity, and the `sport`
// value (OSM's own vocabulary, https://wiki.openstreetmap.org/wiki/Key:sport)
// to prefer among them when present. Activities with no realistic venue
// search (e.g. a neighborhood walk) are left out — the caller should hide
// "Find venue" for those rather than show an empty, confusing query.
const VENUE_QUERY: Record<string, { leisure: string[]; sport?: string }> = {
  tennis:      { leisure: ['sports_centre', 'pitch'], sport: 'tennis' },
  badminton:   { leisure: ['sports_centre', 'pitch'], sport: 'badminton' },
  cricket:     { leisure: ['pitch', 'sports_centre'], sport: 'cricket' },
  football:    { leisure: ['pitch', 'sports_centre', 'stadium'], sport: 'soccer' },
  basketball:  { leisure: ['pitch', 'sports_centre'], sport: 'basketball' },
  swimming:    { leisure: ['swimming_pool'] },
  cycling:     { leisure: ['track'], sport: 'cycling' },
  squash:      { leisure: ['sports_centre'], sport: 'squash' },
  tabletennis: { leisure: ['sports_centre', 'pitch'], sport: 'table_tennis' },
  pickleball:  { leisure: ['sports_centre', 'pitch'], sport: 'pickleball' },
  paddle:      { leisure: ['sports_centre', 'pitch'], sport: 'padel' },
  horseriding: { leisure: ['horse_riding'] },
  hockey:      { leisure: ['pitch', 'sports_centre'], sport: 'hockey' },
  kayaking:    { leisure: ['sports_centre'], sport: 'canoe' },
  running:     { leisure: ['track'], sport: 'running' },
  jogging:     { leisure: ['track'], sport: 'running' },
  gym:         { leisure: ['fitness_centre'] },
  yoga:        { leisure: ['fitness_centre'], sport: 'yoga' },
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

function formatAddress(tags: Record<string, string>): string | undefined {
  const parts = [tags['addr:housenumber'] && tags['addr:street'] ? `${tags['addr:housenumber']} ${tags['addr:street']}` : tags['addr:street'], tags['addr:suburb'] || tags['addr:neighbourhood']]
    .filter(Boolean);
  return parts.length ? parts.join(', ') : undefined;
}

async function runQuery(ql: string): Promise<any[]> {
  const res = await fetch(OVERPASS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain',
      // Overpass's nginx front-end 406s requests with a generic/missing
      // User-Agent — same requirement as Nominatim (see geocoding.ts).
      'User-Agent': 'SweatBud/1.0 (https://sweatbud.com)',
    },
    body: ql,
  });
  if (!res.ok) throw new Error(`Overpass error ${res.status}`);
  const data = await res.json();
  return data.elements || [];
}

export async function searchVenues(activityId: string, lat: number, lng: number): Promise<Venue[]> {
  const spec = VENUE_QUERY[activityId];
  if (!spec) return [];

  const leisureFilter = spec.leisure.join('|');
  const around = `(around:${RADIUS_METERS},${lat},${lng})`;

  // Sport-specific first (e.g. a pitch actually tagged sport=cricket); OSM
  // tagging is sparse outside major cities, so fall back to any venue of
  // the right leisure type nearby if that comes back empty.
  const specificQuery = spec.sport
    ? `[out:json][timeout:20];
(
  nwr["leisure"~"^(${leisureFilter})$"]["sport"~"(^|;)${spec.sport}(;|$)"]${around};
);
out center 30;`
    : null;

  const fallbackQuery = `[out:json][timeout:20];
(
  nwr["leisure"~"^(${leisureFilter})$"]${around};
);
out center 30;`;

  let elements: any[] = [];
  if (specificQuery) {
    elements = await runQuery(specificQuery);
  }
  if (elements.length === 0) {
    elements = await runQuery(fallbackQuery);
  }

  const venues: Venue[] = elements
    .map((el): Venue | null => {
      const elLat = el.lat ?? el.center?.lat;
      const elLng = el.lon ?? el.center?.lon;
      if (elLat == null || elLng == null) return null;
      const tags = el.tags || {};
      return {
        id: `${el.type}/${el.id}`,
        name: tags.name || 'Unnamed venue',
        lat: elLat,
        lng: elLng,
        distanceKm: haversineKm(lat, lng, elLat, elLng),
        address: formatAddress(tags),
      };
    })
    .filter((v): v is Venue => v !== null)
    .sort((a, b) => a.distanceKm - b.distanceKm);

  return venues;
}
