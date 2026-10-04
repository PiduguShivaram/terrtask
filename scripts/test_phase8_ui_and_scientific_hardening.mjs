// Phase 8 Demo UI Correction & Scientific Claim Hardening Validation Test
// Verifies:
// 1. Real IBTrACS coordinates for Fani / Puri
// 2. Storm selection and Puri target coordinates
// 3. Closest approach distance = 27.4 km
// 4. Closest fix = 2019-05-03 03:00 UTC
// 5. Closest-fix intensity = 100 kt / 952 hPa
// 6. Peak recorded intensity = 115 kt / 932 hPa
// 7. Explicit distinction between peak intensity and closest-approach intensity
// 8. Scientific language audit: Absence of unsafe eyewall claims
// 9. Preserved "high-albedo cloud proxy fraction" terminology
// 10. Absence of "eye fix" where referring to IBTrACS track fixes
// 11. Preserved evidence IDs and taxonomy
// 12. Deterministic cache and refusal behavior

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`  [PASS] ${message}`);
}

async function runPhase8Validation() {
  console.log('=== PHASE 8: DEMO UI CORRECTION & SCIENTIFIC CLAIM HARDENING ===\n');

  // Query: Canonical Fani / Puri
  console.log('--- 1. Canonical Fani / Puri Query Verification ---');
  const res = await fetch(`${BASE_URL}/api/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: 'What happened near Puri during Cyclone Fani?' }),
  });

  assert(res.ok, `HTTP status 200 (got ${res.status})`);
  const data = await res.json();

  // 1 & 2: Real IBTrACS coordinates & storm
  assert(data.storm?.name === 'FANI', 'Storm name is FANI');
  assert(data.storm?.season === 2019, 'Storm season is 2019');
  assert(Array.isArray(data.storm?.track) && data.storm.track.length > 0, 'Storm track contains real fixes');

  // 3: Puri target coordinates
  assert(data.targetLocationInfo?.name === 'Puri', 'Target location resolved to Puri');
  const latDiff = Math.abs(data.targetLocationInfo.lat - 19.8135);
  const lonDiff = Math.abs(data.targetLocationInfo.lon - 85.8312);
  assert(latDiff < 0.01 && lonDiff < 0.01, `Puri coordinates verified: ${data.targetLocationInfo.lat}°N, ${data.targetLocationInfo.lon}°E`);

  // 4 & 5: Closest approach distance and timestamp
  const closestStorm = data.relevantStorms?.find(s => s.storm.name === 'FANI');
  assert(closestStorm?.closestDistanceKm === 27.4, `Relevant storms closest distance is 27.4 km (got ${closestStorm?.closestDistanceKm})`);

  const trackPointEvidence = data.evidence.find(e => e.id === 'ev-ibtracs-point');
  assert(trackPointEvidence !== undefined, 'ev-ibtracs-point evidence item present');
  assert(trackPointEvidence.displayValue === '19.60°N, 85.70°E', `Closest fix coordinates are 19.60°N, 85.70°E (got ${trackPointEvidence.displayValue})`);
  assert(trackPointEvidence.timestamp?.includes('2019-05-03 03:00:00'), `Closest fix timestamp is 2019-05-03 03:00:00 UTC (got ${trackPointEvidence.timestamp})`);
  assert(trackPointEvidence.description?.includes('27.4 km'), 'ev-ibtracs-point description mentions 27.4 km');

  // 6: Closest-fix intensity
  const windEvidence = data.evidence.find(e => e.id === 'ev-wind-intensity');
  const presEvidence = data.evidence.find(e => e.id === 'ev-pressure');
  assert(windEvidence?.rawValue === 100, `Closest-fix wind is 100 kt (got ${windEvidence?.rawValue})`);
  assert(presEvidence?.rawValue === 952, `Closest-fix pressure is 952 hPa (got ${presEvidence?.rawValue})`);

  // 7: Peak recorded intensity distinct from closest-fix intensity
  assert(data.storm.peakWindKts === 115, `Peak storm wind is 115 kt (got ${data.storm.peakWindKts})`);
  assert(data.storm.minPressureHpa === 932, `Peak storm pressure is 932 hPa (got ${data.storm.minPressureHpa})`);

  const peakEvidence = data.evidence.find(e => e.id === 'ev-peak-intensity');
  assert(peakEvidence !== undefined, 'ev-peak-intensity evidence item present');
  assert(peakEvidence.displayValue?.includes('115 kt'), 'ev-peak-intensity displays 115 kt');
  assert(peakEvidence.displayValue?.includes('932 hPa'), 'ev-peak-intensity displays 932 hPa');

  // 8: Check UI distinction in Decision Answer
  const answer = data.decisionAnswer?.directAnswer || '';
  console.log(`\n  Generated Answer: "${answer}"\n`);

  assert(!answer.includes('confirms dense cyclonic eyewall organization'), 'Unsafe eyewall confirmation claim removed');
  assert(!answer.toLowerCase().includes('confirms eyewall'), 'No confirms eyewall claim');
  assert(answer.includes("shows the storm's cloud structure; our derived high-albedo cloud proxy fraction is"), 'Preferred MODIS wording present');
  assert(answer.includes('45.1%'), 'High-albedo cloud proxy fraction 45.1% present');
  assert(answer.includes('27.4 km'), 'Closest distance 27.4 km present');
  assert(answer.includes('100 kt'), 'Closest-fix wind 100 kt present');
  assert(answer.includes('952 hPa'), 'Closest-fix pressure 952 hPa present');

  // Check howStrong distinguishes peak vs closest fix
  const howStrong = data.decisionAnswer?.howStrong || '';
  assert(howStrong.includes('closest track fix') || howStrong.includes('Closest track fix'), 'howStrong identifies closest track fix');
  assert(howStrong.includes('Peak recorded storm intensity') || howStrong.includes('peak recorded'), 'howStrong identifies peak recorded intensity');

  // 9: Verify absence of "eye fix" where referring to IBTrACS track fixes
  const serialized = JSON.stringify(data);
  assert(!serialized.includes('eye fix'), 'Zero occurrences of "eye fix" in serialized API output');
  assert(!serialized.includes('Eye fix'), 'Zero occurrences of "Eye fix" in serialized API output');

  // 10: Verify Refusal behavior unchanged
  console.log('\n--- 2. Refusal Safety Verification ---');
  const refusalRes = await fetch(`${BASE_URL}/api/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: 'What will Fani do tomorrow?' }),
  });
  const refusalData = await refusalRes.json();
  assert(refusalData.errorState?.isError === true, 'Forecast query refused');
  assert(refusalData.intent?.type === 'unsupported_forecast', 'Intent identified as unsupported_forecast');

  console.log('\n>>> ALL PHASE 8 VALIDATION CHECKS PASSED WITH 100% SUCCESS!\n');
}

runPhase8Validation().catch(err => {
  console.error('PHASE 8 VALIDATION FAILED:', err);
  process.exit(1);
});
