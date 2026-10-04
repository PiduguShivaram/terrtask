import { TrackPoint, ResolvedLocation } from './types';

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
 * Source: Survey of India Official Administrative Atlas & Natural Earth Populated Places.
 */
export const INDIAN_COASTAL_LOCATIONS: Record<string, ResolvedLocation> = {
  puri: {
    name: 'Puri',
    lat: 19.8135,
    lon: 85.8312,
    state: 'Odisha',
    source: 'Survey of India (Odisha Coast)',
    description: 'Coastal district in Odisha on the Bay of Bengal; direct landfall location of Cyclone Fani on May 3, 2019.',
  },
  paradip: {
    name: 'Paradip',
    lat: 20.3160,
    lon: 86.6110,
    state: 'Odisha',
    source: 'Survey of India / Paradip Port Authority',
    description: 'Major deepwater commercial port on Odisha coast; historic landfall area of 1999 Odisha Super Cyclone and Cyclone Dana (2024).',
  },
  visakhapatnam: {
    name: 'Visakhapatnam',
    lat: 17.6868,
    lon: 83.2185,
    state: 'Andhra Pradesh',
    source: 'Survey of India (Andhra Pradesh Coast)',
    description: 'Major industrial port city on northern Andhra coast; direct landfall site of Cyclone Hudhud (October 2014).',
  },
  chennai: {
    name: 'Chennai',
    lat: 13.0827,
    lon: 80.2707,
    state: 'Tamil Nadu',
    source: 'Survey of India (Tamil Nadu Coast)',
    description: 'Major metropolitan coast on southern Bay of Bengal; impacted by Cyclone Vardah (2016) and Cyclone Michaung (2023).',
  },
  kolkata: {
    name: 'Kolkata',
    lat: 22.5726,
    lon: 88.3639,
    state: 'West Bengal',
    source: 'Survey of India (West Bengal Ganges Delta)',
    description: 'Ganges delta region; impacted by Cyclone Amphan (May 2020) and Cyclone Remal (May 2024).',
  },
  bhubaneswar: {
    name: 'Bhubaneswar',
    lat: 20.2961,
    lon: 85.8245,
    state: 'Odisha',
    source: 'Survey of India (Odisha Capital Region)',
    description: 'Capital of Odisha, inland coastal plains (~55 km inland from Puri coast).',
  },
  digha: {
    name: 'Digha',
    lat: 21.6266,
    lon: 87.5074,
    state: 'West Bengal',
    source: 'Survey of India (West Bengal Coast)',
    description: 'Coastal sea resort on West Bengal coast near Odisha border; landfall vicinity of Cyclone Yaas (2021).',
  },
  gopalpur: {
    name: 'Gopalpur',
    lat: 19.2600,
    lon: 84.9100,
    state: 'Odisha',
    source: 'Survey of India (Southern Odisha Coast)',
    description: 'Southern Odisha coastal port; direct landfall site of Cyclone Phailin (October 2013).',
  },
  kakinada: {
    name: 'Kakinada',
    lat: 16.9891,
    lon: 82.2475,
    state: 'Andhra Pradesh',
    source: 'Survey of India (Godavari Delta Coast)',
    description: 'Godavari delta port city; landfall zone of Cyclone Phethai (2018).',
  },
  machilipatnam: {
    name: 'Machilipatnam',
    lat: 16.1800,
    lon: 81.1300,
    state: 'Andhra Pradesh',
    source: 'Survey of India (Krishna Delta Coast)',
    description: 'Vulnerable low-lying delta coast in Krishna district, Andhra Pradesh; historic surge disaster site.',
  },
  balasore: {
    name: 'Balasore',
    lat: 21.4934,
    lon: 86.9135,
    state: 'Odisha',
    source: 'Survey of India (Northern Odisha Coast)',
    description: 'Northern Odisha coastal district on the Bay of Bengal.',
  },
  dhamra: {
    name: 'Dhamra',
    lat: 20.7944,
    lon: 86.9600,
    state: 'Odisha',
    source: 'Survey of India (Bhadrak Coast)',
    description: 'Dhamra port on Bhadrak coast; direct landfall zone of Cyclone Dana (October 2024).',
  },
};

/**
 * Resolves natural-language query to an authoritative coastal geographic location.
 * Returns null if no recognized location is referenced.
 */
export function resolveLocation(query: string): ResolvedLocation | null {
  const norm = query.toLowerCase();

  // 1. Direct location key check
  for (const [key, loc] of Object.entries(INDIAN_COASTAL_LOCATIONS)) {
    if (norm.includes(key) || norm.includes(loc.name.toLowerCase())) {
      return loc;
    }
  }

  // 2. Specific regional keywords
  if (norm.includes('odisha') || norm.includes('orissa')) {
    return INDIAN_COASTAL_LOCATIONS.puri;
  }
  if (norm.includes('andhra')) {
    return INDIAN_COASTAL_LOCATIONS.visakhapatnam;
  }
  if (norm.includes('tamil nadu')) {
    return INDIAN_COASTAL_LOCATIONS.chennai;
  }
  if (norm.includes('bengal') || norm.includes('sunderbans') || norm.includes('sundarbans')) {
    return INDIAN_COASTAL_LOCATIONS.kolkata;
  }
  if (norm.includes('east coast') || norm.includes('bay of bengal')) {
    return INDIAN_COASTAL_LOCATIONS.puri; // benchmark
  }

  return null;
}
