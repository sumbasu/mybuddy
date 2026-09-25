// Road/landmark search fallback — the static INDIA_LOCATIONS list (src/constants/cities.ts)
// is derived from India Post's PO/HO directory, so it only knows postal
// localities ("Koramangala, Bangalore"), never street/road names ("MG Road").
// This hits OpenStreetMap's free Nominatim API for those cases. Per Nominatim's
// usage policy (https://operations.osmfoundation.org/policies/nominatim/):
// max 1 req/sec (enforced by the caller's debounce) and a descriptive
// User-Agent identifying the app.
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

interface NominatimResult {
  name?: string;
  address?: {
    road?: string;
    suburb?: string;
    neighbourhood?: string;
    residential?: string;
    village?: string;
    town?: string;
    city?: string;
    state_district?: string;
    county?: string;
  };
}

export async function searchRoadsAndLandmarks(query: string): Promise<string[]> {
  const q = query.trim();
  if (q.length < 3) return [];

  try {
    const url = `${NOMINATIM_URL}?format=json&addressdetails=1&countrycodes=in&limit=8&q=${encodeURIComponent(q)}`;
    const res = await fetch(url, {
      headers: {
        'Accept-Language': 'en',
        'User-Agent': 'SweatBud/1.0 (https://sweatbud.com)',
      },
    });
    if (!res.ok) return [];

    const data: NominatimResult[] = await res.json();
    const labels: string[] = [];
    const seen = new Set<string>();

    for (const item of data) {
      const a = item.address || {};
      const primary = a.road || a.suburb || a.neighbourhood || a.residential || a.village || item.name;
      const locality = a.city || a.town || a.state_district || a.county;
      if (!primary) continue;

      const label = locality && locality.toLowerCase() !== primary.toLowerCase()
        ? `${primary}, ${locality}`
        : primary;

      const key = label.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      labels.push(label);
    }
    return labels;
  } catch {
    return [];
  }
}
