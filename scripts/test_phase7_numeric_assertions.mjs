// Phase 7 Strict Numerical Assertion & Balasore/Dana Audit Test Suite
// Asserts exact calculated values with explicit expected vs actual reporting:
// 1. Puri / Cyclone Fani (distance, wind, pressure, landfall timestamp)
// 2. Chennai / Cyclone Vardah (distance, wind, pressure, closest timestamp)
// 3. Balasore / Cyclone Dana (distance, wind, pressure, closest fix timestamp)
// 4. NASA GIBS MODIS Terra satellite imagery (dimensions, pixel count, luminance, albedo fraction)
// 5. NASA Temporal Difference (MAD, optical pixel change)

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_PATH = path.join(__dirname, '..', 'src', 'data', 'ibtracs_ni_modern.json');
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371.0;
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dp = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function assertNumber(name, expected, actual, unit = '', tolerance = 0.05) {
  const diff = Math.abs(expected - actual);
  const pass = diff <= tolerance;
  console.log(`  Assertion: ${name}`);
  console.log(`    Expected: ${expected}${unit}`);
  console.log(`    Actual:   ${actual}${unit}`);
  console.log(`    Result:   [${pass ? 'PASS' : 'FAIL'}]`);
  if (!pass) {
    throw new Error(`Numerical assertion failed for ${name}: expected ${expected}${unit}, got ${actual}${unit}`);
  }
}

function assertString(name, expected, actual) {
  const pass = expected === actual;
  console.log(`  Assertion: ${name}`);
  console.log(`    Expected: "${expected}"`);
  console.log(`    Actual:   "${actual}"`);
  console.log(`    Result:   [${pass ? 'PASS' : 'FAIL'}]`);
  if (!pass) {
    throw new Error(`String assertion failed for ${name}: expected "${expected}", got "${actual}"`);
  }
}

async function runNumericAssertions() {
  console.log("=== PHASE 7 STEP 17: STRICT NUMERICAL ASSERTION AUDIT ===\n");

  // Load authoritative dataset
  const storms = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));

  // 1. Independent Calculation: Balasore -> Cyclone Dana Track Fixes
  console.log("--- 1. Independent Verification: Balasore / Cyclone Dana Closest Fix ---");
  const balasoreLat = 21.4934;
  const balasoreLon = 86.9135;
  const dana = storms.find(s => s.name === 'DANA');
  if (!dana) throw new Error("Cyclone Dana not found in dataset");

  let minDanaDist = Infinity;
  let closestDanaFix = null;

  for (const fix of dana.track) {
    const d = haversineKm(balasoreLat, balasoreLon, fix.lat, fix.lon);
    if (d < minDanaDist) {
      minDanaDist = d;
      closestDanaFix = fix;
    }
  }

  const roundedDanaDist = Math.round(minDanaDist * 10) / 10;
  console.log(`  Balasore Coordinates: ${balasoreLat}°N, ${balasoreLon}°E`);
  console.log(`  Dana Closest Track Fix: ${closestDanaFix.lat}°N, ${closestDanaFix.lon}°E at ${closestDanaFix.isoTime} UTC`);
  assertNumber("Dana Min Distance to Balasore", 38.9, roundedDanaDist, " km");
  assertString("Dana Closest Fix Timestamp", "2024-10-25 09:00:00", closestDanaFix.isoTime);
  assertNumber("Dana Closest Fix Wind", 30, closestDanaFix.windKts, " kt");
  assertNumber("Dana Closest Fix Pressure", 998, closestDanaFix.pressureHpa, " hPa");
  console.log("  Note: Landfall occurred earlier near Dhamra at 2024-10-24 21:00:00 UTC (55 kt, 988 hPa, 88.7 km from Balasore, 11.3 km from Dhamra).");
  console.log("  Inland tracking brought the decaying storm to its closest fix to Balasore (38.9 km) with 30 kt sustained wind.");
  console.log("PASS: Balasore / Cyclone Dana numerical verification complete.\n");

  // 2. Independent Calculation: Puri / Cyclone Fani
  console.log("--- 2. Independent Verification: Puri / Cyclone Fani ---");
  const puriLat = 19.8135;
  const puriLon = 85.8312;
  const fani = storms.find(s => s.name === 'FANI');
  if (!fani) throw new Error("Cyclone Fani not found in dataset");

  let minFaniDist = Infinity;
  let closestFaniFix = null;
  for (const fix of fani.track) {
    const d = haversineKm(puriLat, puriLon, fix.lat, fix.lon);
    if (d < minFaniDist) {
      minFaniDist = d;
      closestFaniFix = fix;
    }
  }
  const roundedFaniDist = Math.round(minFaniDist * 10) / 10;
  assertNumber("Fani Min Distance to Puri", 27.4, roundedFaniDist, " km");
  assertString("Fani Closest Fix Timestamp", "2019-05-03 03:00:00", closestFaniFix.isoTime);
  assertNumber("Fani Closest Fix Wind", 100, closestFaniFix.windKts, " kt");
  assertNumber("Fani Closest Fix Pressure", 952, closestFaniFix.pressureHpa, " hPa");
  console.log("PASS: Puri / Cyclone Fani numerical verification complete.\n");

  // 3. Independent Calculation: Chennai / Cyclone Vardah
  console.log("--- 3. Independent Verification: Chennai / Cyclone Vardah ---");
  const chennaiLat = 13.0827;
  const chennaiLon = 80.2707;
  const vardah = storms.find(s => s.name === 'VARDAH');
  if (!vardah) throw new Error("Cyclone Vardah not found in dataset");

  let minVardahDist = Infinity;
  let closestVardahFix = null;
  for (const fix of vardah.track) {
    const d = haversineKm(chennaiLat, chennaiLon, fix.lat, fix.lon);
    if (d < minVardahDist) {
      minVardahDist = d;
      closestVardahFix = fix;
    }
  }
  const roundedVardahDist = Math.round(minVardahDist * 10) / 10;
  assertNumber("Vardah Min Distance to Chennai", 13.4, roundedVardahDist, " km");
  assertString("Vardah Closest Fix Timestamp", "2016-12-12 09:00:00", closestVardahFix.isoTime);
  assertNumber("Vardah Closest Fix Wind", 60, closestVardahFix.windKts, " kt");
  assertNumber("Vardah Closest Fix Pressure", 975, closestVardahFix.pressureHpa, " hPa");
  console.log("PASS: Chennai / Cyclone Vardah numerical verification complete.\n");

  // 4. Satellite Pixel Analysis Metrics Verification via Live API
  console.log("--- 4. Live API Numerical Assertion: Fani Satellite Analysis ---");
  const resFani = await fetch(`${BASE_URL}/api/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: "What did the satellite imagery show before and during landfall?" }),
  });
  if (!resFani.ok) throw new Error(`Query failed: ${resFani.status}`);
  const dataFani = await resFani.json();

  const satAnalysis = dataFani.satelliteAnalysis;
  if (!satAnalysis) throw new Error("Missing satelliteAnalysis object in API response");

  assertNumber("Satellite Width", 450, satAnalysis.dimensions.width, " px");
  assertNumber("Satellite Height", 300, satAnalysis.dimensions.height, " px");
  assertNumber("Satellite Total Decoded Pixels", 135000, satAnalysis.dimensions.totalPixels, " pixels");
  assertNumber("Mean Optical Brightness", 173.3, satAnalysis.meanBrightness, " / 255");
  assertNumber("High-Albedo Cloud Proxy Fraction", 45.1, satAnalysis.denseCloudFractionPct, "%");
  assertNumber("High-Albedo Cloud Centroid Lat", 20.63, satAnalysis.cloudCentroidGeo[0], "°N");
  assertNumber("High-Albedo Cloud Centroid Lon", 86.58, satAnalysis.cloudCentroidGeo[1], "°E");
  assertNumber("Centroid Offset to Storm Center", 147.1, satAnalysis.cloudCentroidOffsetKm, " km");
  console.log("PASS: Satellite visual pixel metrics verified.\n");

  // 5. Satellite Temporal Comparison Numerical Verification
  console.log("--- 5. Live API Numerical Assertion: Temporal Comparison ---");
  const satComp = dataFani.satelliteComparison;
  if (!satComp) throw new Error("Missing satelliteComparison object in API response");

  assertNumber("Temporal Mean Absolute Difference (MAD)", 86.8, satComp.meanAbsoluteDifference, " / 255");
  assertNumber("Optical Pixel Change Percentage", 70.1, satComp.changedAreaPct, "%");
  console.log("PASS: Temporal comparison metrics verified.\n");

  console.log(">>> ALL NUMERICAL ASSERTIONS PASSED WITH ZERO TOLERANCE FAILURES!\n");
}

runNumericAssertions().catch(err => {
  console.error("NUMERICAL ASSERTION FAILED:", err);
  process.exit(1);
});
