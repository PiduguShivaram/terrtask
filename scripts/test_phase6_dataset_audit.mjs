// Phase 6 Dataset & Location Audit Test Suite
// Inspects authoritative IBTrACS dataset and validates deterministic geospatial resolution.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_PATH = path.join(__dirname, '..', 'src', 'data', 'ibtracs_ni_modern.json');

const INDIAN_COASTAL_LOCATIONS = {
  puri: { name: 'Puri', lat: 19.8135, lon: 85.8312 },
  paradip: { name: 'Paradip', lat: 20.3160, lon: 86.6110 },
  visakhapatnam: { name: 'Visakhapatnam', lat: 17.6868, lon: 83.2185 },
  chennai: { name: 'Chennai', lat: 13.0827, lon: 80.2707 },
  kolkata: { name: 'Kolkata', lat: 22.5726, lon: 88.3639 },
  bhubaneswar: { name: 'Bhubaneswar', lat: 20.2961, lon: 85.8245 },
  digha: { name: 'Digha', lat: 21.6266, lon: 87.5074 },
  gopalpur: { name: 'Gopalpur', lat: 19.2600, lon: 84.9100 },
  kakinada: { name: 'Kakinada', lat: 16.9891, lon: 82.2475 },
  machilipatnam: { name: 'Machilipatnam', lat: 16.1800, lon: 81.1300 },
  balasore: { name: 'Balasore', lat: 21.4934, lon: 86.9135 },
  dhamra: { name: 'Dhamra', lat: 20.7944, lon: 86.9600 }
};

function calculateHaversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371.0;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const dPhi = ((lat2 - lat1) * Math.PI) / 180;
  const dLambda = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dPhi / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function runDatasetAudit() {
  console.log("=== PHASE 6 STEP 1: AUTHORITATIVE DATASET AUDIT ===\n");

  const raw = fs.readFileSync(DATA_PATH, 'utf8');
  const storms = JSON.parse(raw);

  console.log(`1. Total Storms Count: ${storms.length}`);
  if (storms.length !== 65) {
    throw new Error(`Expected exactly 65 modern storms, found ${storms.length}`);
  }

  const seasons = storms.map(s => s.season);
  const minSeason = Math.min(...seasons);
  const maxSeason = Math.max(...seasons);
  console.log(`2. Season Range: ${minSeason} – ${maxSeason}`);
  if (minSeason !== 2013 || maxSeason !== 2025) {
    throw new Error(`Expected season range 2013-2025, found ${minSeason}-${maxSeason}`);
  }

  const sids = new Set();
  for (const s of storms) {
    if (sids.has(s.sid)) {
      throw new Error(`Duplicate SID found: ${s.sid}`);
    }
    sids.add(s.sid);
  }
  console.log(`3. Unique Storm SIDs: ${sids.size} (0 duplicate identifiers)`);

  const basins = new Set(storms.map(s => s.subbasin));
  console.log(`4. Subbasins: [ ${Array.from(basins).join(', ')} ] (All North Indian Ocean)`);

  console.log("\n=== PHASE 6 STEP 2 & 3: LOCATION & DETERMINISTIC RANKING AUDIT ===\n");

  for (const [key, loc] of Object.entries(INDIAN_COASTAL_LOCATIONS)) {
    const stormDistances = [];
    for (const s of storms) {
      let minD = Infinity;
      let closestPt = null;
      for (const p of s.track) {
        const d = calculateHaversineKm(loc.lat, loc.lon, p.lat, p.lon);
        if (d < minD) {
          minD = d;
          closestPt = p;
        }
      }
      stormDistances.push({
        storm: s,
        distanceKm: Math.round(minD * 10) / 10,
        closestPoint: closestPt,
      });
    }

    stormDistances.sort((a, b) => {
      const distDiff = a.distanceKm - b.distanceKm;
      if (Math.abs(distDiff) > 0.1) return distDiff;
      const windDiff = (b.storm.peakWindKts || 0) - (a.storm.peakWindKts || 0);
      if (windDiff !== 0) return windDiff;
      return a.storm.sid.localeCompare(b.storm.sid);
    });

    const top = stormDistances[0];
    console.log(`  Location: ${loc.name.padEnd(14)} -> Closest: ${top.storm.name.padEnd(9)} (${top.storm.season}) | Distance: ${top.distanceKm.toFixed(1)} km | Fix: ${top.closestPoint.isoTime} | Wind: ${top.closestPoint.windKts} kt | Pres: ${top.closestPoint.pressureHpa} hPa`);

    if (key === 'chennai') {
      if (top.storm.name !== 'VARDAH' || top.distanceKm !== 13.4) {
        throw new Error(`Chennai closest storm audit failed: expected VARDAH at 13.4 km, got ${top.storm.name} at ${top.distanceKm} km`);
      }
    }
    if (key === 'puri') {
      if (top.storm.name !== 'FANI' || top.distanceKm !== 27.4) {
        throw new Error(`Puri closest storm audit failed: expected FANI at 27.4 km, got ${top.storm.name} at ${top.distanceKm} km`);
      }
    }
  }

  console.log("\n>>> PHASE 6 DATASET & LOCATION AUDIT COMPLETED SUCCESSFULLY!\n");
}

runDatasetAudit().catch(err => {
  console.error("DATASET AUDIT FAILED:", err);
  process.exit(1);
});
