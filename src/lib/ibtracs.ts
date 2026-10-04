import modernStorms from '../data/ibtracs_ni_modern.json';
import { CycloneEvent, TrackPoint, RelevantStormMatch } from './types';
import { calculateHaversineDistanceKm, enrichTrackPoints } from './geospatial';

const rawStorms: CycloneEvent[] = (modernStorms as any[]).map(s => {
  const enrichedTrack = enrichTrackPoints(s.track);
  
  // Find landfall point (landfallKm === 0 or point with minimum dist2LandKm)
  let landfallPoint: TrackPoint | null = null;
  const zeroLandfall = enrichedTrack.find(t => t.landfallKm === 0);
  if (zeroLandfall) {
    landfallPoint = zeroLandfall;
  } else {
    // Find point with minimum dist2LandKm when dist2LandKm < 50
    const nearLandPoints = enrichedTrack.filter(t => t.dist2LandKm !== null && t.dist2LandKm < 50);
    if (nearLandPoints.length > 0) {
      landfallPoint = nearLandPoints.reduce((min, p) => 
        (p.dist2LandKm! < min.dist2LandKm!) ? p : min, nearLandPoints[0]);
    }
  }

  const validWinds = enrichedTrack.map(t => t.windKts).filter((w): w is number => w !== null);
  const validPressures = enrichedTrack.map(t => t.pressureHpa).filter((p): p is number => p !== null);

  return {
    ...s,
    track: enrichedTrack,
    landfallPoint,
    peakWindKts: validWinds.length > 0 ? Math.max(...validWinds) : undefined,
    minPressureHpa: validPressures.length > 0 ? Math.min(...validPressures) : undefined,
    startDate: enrichedTrack[0]?.isoTime,
    endDate: enrichedTrack[enrichedTrack.length - 1]?.isoTime,
  };
});

/**
 * Retrieves all modern North Indian Ocean storms.
 */
export function getAllStorms(): CycloneEvent[] {
  return rawStorms;
}

/**
 * Finds a storm by name (case-insensitive) or SID.
 */
export function findStormByNameOrSid(nameOrSid: string): CycloneEvent | undefined {
  const norm = nameOrSid.trim().toUpperCase();
  return rawStorms.find(s => 
    s.name.toUpperCase() === norm || 
    s.sid.toUpperCase() === norm ||
    s.name.toUpperCase().includes(norm)
  );
}

/**
 * Searches real IBTrACS tracks for cyclones that approached within radiusKm of coordinates.
 * Ranks storms by closest approach distance (km).
 */
export function findStormsNearLocation(
  lat: number,
  lon: number,
  radiusKm = 250
): RelevantStormMatch[] {
  const results: RelevantStormMatch[] = [];

  for (const storm of rawStorms) {
    let minDistanceKm = Infinity;
    let closestPoint: TrackPoint | null = null;

    for (const point of storm.track) {
      const dist = calculateHaversineDistanceKm(lat, lon, point.lat, point.lon);
      if (dist < minDistanceKm) {
        minDistanceKm = dist;
        closestPoint = point;
      }
    }

    if (closestPoint && minDistanceKm <= radiusKm) {
      results.push({
        storm,
        closestDistanceKm: Math.round(minDistanceKm * 10) / 10,
        closestFixTime: closestPoint.isoTime,
        closestPoint,
        peakWindKts: storm.peakWindKts ?? null,
        minPressureHpa: storm.minPressureHpa ?? null,
      });
    }
  }

  // Rank by proximity, then by wind intensity
  return results.sort((a, b) => {
    if (Math.abs(a.closestDistanceKm - b.closestDistanceKm) > 25) {
      return a.closestDistanceKm - b.closestDistanceKm;
    }
    return (b.peakWindKts || 0) - (a.peakWindKts || 0);
  });
}
