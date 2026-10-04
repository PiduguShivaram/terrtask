// Phase 8.1 Map Basemap Fix & Scientific Observation/Classification Validation Test
import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`  [PASS] ${message}`);
}

async function runPhase81Validation() {
  console.log('=== PHASE 8.1: MAP BASEMAP FIX & SCIENTIFIC WORDING VALIDATION ===\n');

  // --- 1. Static Audit of Leaflet Map Component ---
  console.log('--- 1. Static Audit of Leaflet Map Component (src/components/Map.tsx) ---');
  const mapPath = path.resolve('src/components/Map.tsx');
  const mapCode = fs.readFileSync(mapPath, 'utf8');

  // Assert NO Carto tile URLs or Carto strings that produce API key errors
  assert(!mapCode.includes('cartocdn.com'), 'Zero references to cartocdn.com');
  assert(!mapCode.includes('dark_all'), 'Zero references to Carto dark_all layer');
  assert(!mapCode.includes('Dark Carto'), 'Zero references to Dark Carto button/layer');
  assert(!mapCode.includes('API KEY REQUIRED'), 'Zero references to API KEY REQUIRED');

  // Assert default basemap is OSM
  assert(mapCode.includes("useState<'osm' | 'satellite'>('osm')"), "activeBaseLayer state defaults to 'osm'");
  assert(mapCode.includes('https://tile.openstreetmap.org/{z}/{x}/{y}.png'), 'OpenStreetMap tile URL is configured');

  // Assert attribution includes OSM, NASA GIBS, and IBTrACS
  assert(mapCode.includes('OpenStreetMap</a> contributors'), 'OpenStreetMap attribution included');
  assert(mapCode.includes('NASA GIBS'), 'NASA GIBS attribution included');
  assert(mapCode.includes('NOAA IBTrACS'), 'NOAA IBTrACS attribution included');

  // Assert 34-kt Gale Radii is clearly identified as IBTrACS
  assert(mapCode.includes('34-kt Gale Radii Field (IBTrACS)'), '34-kt Gale Radii Field explicitly labeled with (IBTrACS)');
  assert(mapCode.includes('Observed 34-kt Gale Radius (IBTrACS)'), 'Gale radius tooltip explicitly labeled with (IBTrACS)');

  // --- 2. Live API Validation for Canonical Puri / Fani Demo ---
  console.log('\n--- 2. Canonical Demo Query: "What is happening near Puri?" ---');
  const res = await fetch(`${BASE_URL}/api/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: 'What is happening near Puri?' }),
  });

  assert(res.ok, `HTTP status 200 (got ${res.status})`);
  const data = await res.json();

  // Target Location & Coordinates
  assert(data.targetLocationInfo?.name === 'Puri', 'Target resolved to Puri');
  const latDiff = Math.abs(data.targetLocationInfo.lat - 19.8135);
  const lonDiff = Math.abs(data.targetLocationInfo.lon - 85.8312);
  assert(latDiff < 0.01 && lonDiff < 0.01, `Target coordinates verified: ${data.targetLocationInfo.lat}°N, ${data.targetLocationInfo.lon}°E`);

  // Storm Selection & Real Track
  assert(data.storm?.name === 'FANI', 'Storm resolved to FANI');
  assert(Array.isArray(data.storm?.track) && data.storm.track.length > 0, 'Real IBTrACS track fixes present');
  const closestStorm = data.relevantStorms?.find(s => s.storm.name === 'FANI');
  assert(closestStorm?.closestDistanceKm === 27.4, `Closest distance is 27.4 km (got ${closestStorm?.closestDistanceKm})`);

  // Closest-Fix Intensity
  const windEv = data.evidence.find(e => e.id === 'ev-wind-intensity');
  const presEv = data.evidence.find(e => e.id === 'ev-pressure');
  assert(windEv?.rawValue === 100, `Closest-fix sustained wind is 100 kt (got ${windEv?.rawValue})`);
  assert(presEv?.rawValue === 952, `Closest-fix minimum pressure is 952 hPa (got ${presEv?.rawValue})`);

  // Peak Intensity
  assert(data.storm.peakWindKts === 115, `Peak sustained wind is 115 kt (got ${data.storm.peakWindKts})`);
  assert(data.storm.minPressureHpa === 932, `Peak minimum pressure is 932 hPa (got ${data.storm.minPressureHpa})`);

  // Direct Answer Phrasing Audit
  const directAnswer = data.decisionAnswer?.directAnswer || '';
  console.log(`\n  directAnswer: "${directAnswer}"\n`);

  // Scientific observation vs classification sentence
  const expectedClassificationSentence = 'At this fix, NOAA IBTrACS records a sustained wind of 100 kt (~185 km/h) and a minimum central pressure of 952 hPa. This intensity corresponds to the Extremely Severe Cyclonic Storm (ESCS) category.';
  assert(directAnswer.includes(expectedClassificationSentence), 'Exact classification distinction sentence present');

  // MODIS Cloud proxy wording
  const expectedModisSentence = "NASA MODIS Terra True Color imagery shows the storm's cloud structure; our derived high-albedo cloud proxy fraction is 45.1%.";
  assert(directAnswer.includes(expectedModisSentence), 'Exact MODIS cloud structure & proxy wording present');

  // Unsafe wording absence
  assert(!directAnswer.toLowerCase().includes('eyewall'), 'Zero occurrences of "eyewall"');
  assert(!directAnswer.toLowerCase().includes('eye fix'), 'Zero occurrences of "eye fix"');
  assert(!directAnswer.toLowerCase().includes('vortex center'), 'Zero occurrences of "vortex center"');

  // --- 3. Switching Storm and Location Integrity Test ---
  console.log('\n--- 3. Multi-Storm & Multi-Location Switching Integrity ---');
  // Switch to Phailin at Gopalpur
  const resPhailin = await fetch(`${BASE_URL}/api/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: 'What happened near Gopalpur during Cyclone Phailin?' }),
  });
  assert(resPhailin.ok, 'Phailin query returned HTTP 200');
  const dataPhailin = await resPhailin.json();
  assert(dataPhailin.storm?.name === 'PHAILIN', 'Storm resolved to PHAILIN');
  assert(dataPhailin.targetLocationInfo?.name === 'Gopalpur', 'Target resolved to Gopalpur');
  assert(dataPhailin.storm.track.length > 0, 'Phailin has real track points');
  assert(dataPhailin.evidence?.length > 0, 'Phailin has verified evidence lineage');

  // Switch to Amphan at Kolkata
  const resAmphan = await fetch(`${BASE_URL}/api/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: 'What happened near Kolkata during Cyclone Amphan?' }),
  });
  assert(resAmphan.ok, 'Amphan query returned HTTP 200');
  const dataAmphan = await resAmphan.json();
  assert(dataAmphan.storm?.name === 'AMPHAN', 'Storm resolved to AMPHAN');
  assert(dataAmphan.targetLocationInfo?.name === 'Kolkata', 'Target resolved to Kolkata');
  assert(dataAmphan.storm.track.length > 0, 'Amphan has real track points');
  assert(dataAmphan.evidence?.length > 0, 'Amphan has verified evidence lineage');

  console.log('\n=== ALL PHASE 8.1 VALIDATIONS PASSED SUCCESSFULLY ===\n');
}

runPhase81Validation().catch((err) => {
  console.error('\nPhase 8.1 Validation Failed:', err);
  process.exit(1);
});
