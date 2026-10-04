import { TrackPoint } from './types';

// Earth radius in kilometers
const EARTH_RADIUS_KM = 6371;

/**
 * Calculates great-circle distance between two points in km using Haversine formula.
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Calculates initial bearing in degrees from point 1 to point 2.
 */
export function calculateBearingDeg(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const y = Math.sin(((lon2 - lon1) * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.cos(((lon2 - lon1) * Math.PI) / 180);
  const b = (Math.atan2(y, x) * 180) / Math.PI;
  return (b + 360) % 360;
}

/**
 * Categorizes cyclone according to IMD (India Meteorological Department) official scale.
 */
export function categorizeImdIntensity(windKts: number | null): string {
  if (windKts === null) return 'Uncategorized';
  if (windKts >= 120) return 'Super Cyclonic Storm (SuCS)';
  if (windKts >= 90) return 'Extremely Severe Cyclonic Storm (ESCS)';
  if (windKts >= 64) return 'Very Severe Cyclonic Storm (VSCS)';
  if (windKts >= 48) return 'Severe Cyclonic Storm (SCS)';
  if (windKts >= 34) return 'Cyclonic Storm (CS)';
  if (windKts >= 28) return 'Deep Depression (DD)';
  if (windKts >= 17) return 'Depression (D)';
  return 'Low Pressure Area (LPA)';
}

/**
 * Derives dynamic metrics for a track: forward speed, bearing, and IMD category.
 */
export function enrichTrackPoints(points: TrackPoint[]): TrackPoint[] {
  return points.map((p, idx) => {
    let forwardSpeedKmh: number | null = null;
    let bearingDeg: number | null = null;

    if (idx < points.length - 1) {
      const next = points[idx + 1];
      const distKm = calculateHaversineDistanceKm(p.lat, p.lon, next.lat, next.lon);
      const t1 = new Date(p.isoTime).getTime();
      const t2 = new Date(next.isoTime).getTime();
      const dtHours = Math.abs(t2 - t1) / (1000 * 60 * 60);

      if (dtHours > 0) {
        forwardSpeedKmh = Math.round((distKm / dtHours) * 10) / 10;
      }
      bearingDeg = Math.round(calculateBearingDeg(p.lat, p.lon, next.lat, next.lon));
    } else if (idx > 0) {
      // Use previous point for last point estimation
      const prev = points[idx - 1];
      const distKm = calculateHaversineDistanceKm(prev.lat, prev.lon, p.lat, p.lon);
      const t1 = new Date(prev.isoTime).getTime();
      const t2 = new Date(p.isoTime).getTime();
      const dtHours = Math.abs(t2 - t1) / (1000 * 60 * 60);
      if (dtHours > 0) {
        forwardSpeedKmh = Math.round((distKm / dtHours) * 10) / 10;
      }
      bearingDeg = Math.round(calculateBearingDeg(prev.lat, prev.lon, p.lat, p.lon));
    }

    return {
      ...p,
      forwardSpeedKmh,
      bearingDeg,
      intensityCategory: categorizeImdIntensity(p.windKts),
    };
  });
}

/**
 * Known coastal points along India's East Coast (Bay of Bengal).
 */
export const INDIAN_COASTAL_LOCATIONS: Record<
  string,
  { name: string; lat: number; lon: number; state: string; description: string }
> = {
  puri: {
    name: 'Puri',
    lat: 19.8135,
    lon: 85.8312,
    state: 'Odisha',
    description: 'Major coastal pilgrimage city on Bay of Bengal; direct landfall site of Cyclone Fani (May 3, 2019)',
  },
  bhubaneswar: {
    name: 'Bhubaneswar',
    lat: 20.2961,
    lon: 85.8245,
    state: 'Odisha',
    description: 'Capital of Odisha, inland coastal plains',
  },
  paradip: {
    name: 'Paradip',
    lat: 20.316,
    lon: 86.611,
    state: 'Odisha',
    description: 'Major deepwater port on Odisha coast; historic 1999 Super Cyclone landfall area',
  },
  gopalpur: {
    name: 'Gopalpur',
    lat: 19.26,
    lon: 84.91,
    state: 'Odisha',
    description: 'Southern Odisha coastal port; landfall site of Cyclone Phailin (2013)',
  },
  visakhapatnam: {
    name: 'Visakhapatnam',
    lat: 17.6868,
    lon: 83.2185,
    state: 'Andhra Pradesh',
    description: 'Major port city; landfall area of Cyclone Hudhud (2014)',
  },
  machilipatnam: {
    name: 'Machilipatnam',
    lat: 16.18,
    lon: 81.13,
    state: 'Andhra Pradesh',
    description: 'Krishna delta coast; vulnerable low-elevation surge plain',
  },
  chennai: {
    name: 'Chennai',
    lat: 13.0827,
    lon: 80.2707,
    state: 'Tamil Nadu',
    description: 'Major metropolitan coast; heavily impacted by Cyclone Vardah (2016) and Michaung (2023)',
  },
  kolkata: {
    name: 'Kolkata',
    lat: 22.5726,
    lon: 88.3639,
    state: 'West Bengal',
    description: 'Ganges delta region; impacted by Cyclone Amphan (2020) and Remal (2024)',
  },
  digha: {
    name: 'Digha',
    lat: 21.6266,
    lon: 87.5074,
    state: 'West Bengal',
    description: 'Coastal sea resort on West Bengal-Odisha border',
  },
};
