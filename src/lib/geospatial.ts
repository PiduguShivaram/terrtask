import { TrackPoint } from './types';

// Mean Earth radius in kilometers (WGS84 spherical approximation)
const EARTH_RADIUS_KM = 6371.0;

/**
 * Calculates great-circle distance between two points in km using the standard Haversine formula.
 * Formula: a = sin²(Δφ/2) + cos(φ1)⋅cos(φ2)⋅sin²(Δλ/2); c = 2⋅atan2(√a, √(1-a)); d = R⋅c
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const dPhi = ((lat2 - lat1) * Math.PI) / 180;
  const dLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dPhi / 2) * Math.sin(dPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) * Math.sin(dLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Calculates initial forward bearing in degrees from point 1 to point 2 (0° to 360° clockwise from True North).
 */
export function calculateBearingDeg(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const dLambda = ((lon2 - lon1) * Math.PI) / 180;

  const y = Math.sin(dLambda) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLambda);
  const b = (Math.atan2(y, x) * 180) / Math.PI;
  return (b + 360) % 360;
}

/**
 * Maps observed 3-minute sustained wind speed (kts) to the official India Meteorological Department (IMD) scale.
 * Source: IMD Cyclone Warning Services Manual & Guidelines.
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
 * Derives translational forward speed and vector bearing between consecutive best-track coordinates.
 * Calculation: Haversine distance / Δt (hours).
 * Assumption: Constant speed along great-circle path between discrete best-track fixes.
 */
export function enrichTrackPoints(points: TrackPoint[]): TrackPoint[] {
  return points.map((p, idx) => {
    let forwardSpeedKmh: number | null = null;
    let bearingDeg: number | null = null;
    let derivationMethod = '';

    if (idx < points.length - 1) {
      const next = points[idx + 1];
      const distKm = calculateHaversineDistanceKm(p.lat, p.lon, next.lat, next.lon);
      const t1 = new Date(p.isoTime).getTime();
      const t2 = new Date(next.isoTime).getTime();
      const dtHours = Math.abs(t2 - t1) / (1000 * 60 * 60);

      if (dtHours > 0) {
        forwardSpeedKmh = Math.round((distKm / dtHours) * 10) / 10;
        derivationMethod = `Haversine distance (${Math.round(distKm)} km) divided by elapsed time (${dtHours.toFixed(1)} h) to fix ${next.isoTime}`;
      }
      bearingDeg = Math.round(calculateBearingDeg(p.lat, p.lon, next.lat, next.lon));
    } else if (idx > 0) {
      const prev = points[idx - 1];
      const distKm = calculateHaversineDistanceKm(prev.lat, prev.lon, p.lat, p.lon);
      const t1 = new Date(prev.isoTime).getTime();
      const t2 = new Date(p.isoTime).getTime();
      const dtHours = Math.abs(t2 - t1) / (1000 * 60 * 60);
      if (dtHours > 0) {
        forwardSpeedKmh = Math.round((distKm / dtHours) * 10) / 10;
        derivationMethod = `Haversine distance (${Math.round(distKm)} km) divided by elapsed time (${dtHours.toFixed(1)} h) from fix ${prev.isoTime}`;
      }
      bearingDeg = Math.round(calculateBearingDeg(prev.lat, prev.lon, p.lat, p.lon));
    }

    return {
      ...p,
      forwardSpeedKmh,
      bearingDeg,
      intensityCategory: categorizeImdIntensity(p.windKts),
      derivationMethod: derivationMethod || undefined,
    };
  });
}

/**
 * Authoritative Indian coastal reference coordinates for geospatial bounding.
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
    description: 'Coastal district in Odisha on the Bay of Bengal; direct landfall location of Cyclone Fani on May 3, 2019.',
  },
  bhubaneswar: {
    name: 'Bhubaneswar',
    lat: 20.2961,
    lon: 85.8245,
    state: 'Odisha',
    description: 'Capital of Odisha, inland coastal plains (~55 km inland from Puri coast).',
  },
  paradip: {
    name: 'Paradip',
    lat: 20.316,
    lon: 86.611,
    state: 'Odisha',
    description: 'Major deepwater commercial port on Odisha coast; historic landfall area of 1999 Odisha Super Cyclone and Cyclone Dana (2024).',
  },
  gopalpur: {
    name: 'Gopalpur',
    lat: 19.26,
    lon: 84.91,
    state: 'Odisha',
    description: 'Southern Odisha coastal port; direct landfall site of Cyclone Phailin (October 2013).',
  },
  visakhapatnam: {
    name: 'Visakhapatnam',
    lat: 17.6868,
    lon: 83.2185,
    state: 'Andhra Pradesh',
    description: 'Port city on northern Andhra coast; direct landfall site of Cyclone Hudhud (October 2014).',
  },
  machilipatnam: {
    name: 'Machilipatnam',
    lat: 16.18,
    lon: 81.13,
    state: 'Andhra Pradesh',
    description: 'Vulnerable low-lying delta coast in Krishna district, Andhra Pradesh.',
  },
  chennai: {
    name: 'Chennai',
    lat: 13.0827,
    lon: 80.2707,
    state: 'Tamil Nadu',
    description: 'Major metropolitan coast on southern Bay of Bengal; impacted by Cyclone Vardah (2016) and Cyclone Michaung (2023).',
  },
  kolkata: {
    name: 'Kolkata',
    lat: 22.5726,
    lon: 88.3639,
    state: 'West Bengal',
    description: 'Ganges delta region; impacted by Cyclone Amphan (May 2020) and Cyclone Remal (May 2024).',
  },
  digha: {
    name: 'Digha',
    lat: 21.6266,
    lon: 87.5074,
    state: 'West Bengal',
    description: 'Coastal sea resort on West Bengal coast near Odisha border.',
  },
};
