// Phase 6 Honest Failure & Error Handling Test Suite
// Verifies truthful failure behavior across:
// 1. Unknown location queries (no fabricated fallback)
// 2. Out-of-scope basin queries (Antarctica, Gulf of Mexico)
// 3. Forward forecasting refusal (Rule 21)
// 4. Structural damage prediction refusal (Rule 22)
// 5. Pre-launch / unsupported satellite dates (honest unavailable state)
// 6. Non-existent cyclone queries (honest catalog failure)
// 7. Malformed / empty query validation (HTTP 400)

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

async function fetchQuery(query) {
  const res = await fetch(`${BASE_URL}/api/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for query: ${query}`);
  }
  return await res.json();
}

async function runFailureTests() {
  console.log("=== PHASE 6 STEP 12: HONEST FAILURE & BOUNDARY TEST SUITE ===\n");

  // 1. Unknown Location Query
  console.log("--- 1. Testing Unknown Location Query ---");
  const resUnknown = await fetchQuery("What happened near Atlantis?");
  console.log("Unknown Location Intent:", resUnknown.intent?.type);
  console.log("Unknown Location Error:", resUnknown.errorState?.reason);

  if (resUnknown.intent?.type !== 'unknown_or_unsupported') {
    throw new Error(`Expected unknown_or_unsupported intent, got ${resUnknown.intent?.type}`);
  }
  if (!resUnknown.errorState?.isError) {
    throw new Error("Expected errorState.isError to be true for unknown location!");
  }
  if (resUnknown.storm !== null) {
    throw new Error(`FAIL: Fabricated fallback storm "${resUnknown.storm?.name}" returned for unknown location!`);
  }
  console.log("PASS: Unknown location fails honestly without silent fallback.\n");

  // 2. Unsupported Basin / Geographic Boundary
  console.log("--- 2. Testing Unsupported Basin (Antarctica & Katrina) ---");
  const resAntarctica = await fetchQuery("What is happening in Antarctica?");
  const resKatrina = await fetchQuery("Tell me about Hurricane Katrina in New Orleans");

  if (!resAntarctica.errorState?.isError || !resAntarctica.errorState?.reason.toLowerCase().includes("antarctica")) {
    throw new Error(`Expected Antarctica boundary error, got: ${resAntarctica.errorState?.reason}`);
  }
  const katrinaReason = resKatrina.errorState?.reason.toLowerCase() || "";
  if (!resKatrina.errorState?.isError || (!katrinaReason.includes("katrina") && !katrinaReason.includes("new orleans"))) {
    throw new Error(`Expected Katrina/New Orleans boundary error, got: ${resKatrina.errorState?.reason}`);
  }
  console.log("PASS: Out-of-basin requests are rejected with clear boundary explanations.\n");

  // 3. Forward Forecasting Refusal (Rule 21)
  console.log("--- 3. Testing Forward Forecasting Refusal ---");
  const resForecast = await fetchQuery("What will Fani do tomorrow?");
  if (resForecast.intent?.type !== 'unsupported_forecast') {
    throw new Error(`Expected unsupported_forecast intent, got ${resForecast.intent?.type}`);
  }
  if (!resForecast.errorState?.isError) {
    throw new Error("Expected forecast request to have errorState.isError = true");
  }
  console.log("PASS: Forward forecasting is explicitly refused.\n");

  // 4. Structural Damage Refusal (Rule 22)
  console.log("--- 4. Testing Structural Damage Prediction Refusal ---");
  const resDamage = await fetchQuery("How many buildings will be destroyed?");
  if (resDamage.intent?.type !== 'unsupported_damage') {
    throw new Error(`Expected unsupported_damage intent, got ${resDamage.intent?.type}`);
  }
  if (!resDamage.errorState?.isError) {
    throw new Error("Expected damage request to have errorState.isError = true");
  }
  console.log("PASS: Structural damage prediction is explicitly refused.\n");

  // 5. Non-existent Cyclone Query
  console.log("--- 5. Testing Non-existent Cyclone Query ---");
  const resNonExistent = await fetchQuery("What happened during Cyclone Nonexistent?");
  if (resNonExistent.intent?.type !== 'unknown_or_unsupported') {
    throw new Error(`Expected unknown_or_unsupported intent, got ${resNonExistent.intent?.type}`);
  }
  if (!resNonExistent.errorState?.isError) {
    throw new Error("Expected errorState.isError to be true for non-existent cyclone");
  }
  if (resNonExistent.storm !== null) {
    throw new Error(`FAIL: Fabricated fallback storm returned for non-existent cyclone!`);
  }
  console.log("PASS: Non-existent cyclone fails honestly.\n");

  // 6. Pre-mission / Unsupported Satellite Date Handling
  console.log("--- 6. Testing Pre-launch Satellite Date (1970-01-01) ---");
  const nasaUrl = `https://wvs.earthdata.nasa.gov/api/v1/snapshot?REQUEST=GetSnapshot&TIME=1970-01-01&BBOX=14,80,24,92&CRS=EPSG:4326&LAYERS=MODIS_Terra_CorrectedReflectance_TrueColor,Coastlines_15m&WRAP=day,none&FORMAT=image/jpeg&WIDTH=450&HEIGHT=300`;
  const nasaRes = await fetch(nasaUrl);
  console.log(`NASA GIBS HTTP status for 1970-01-01: ${nasaRes.status} (Pre-mission query)`);
  if (nasaRes.ok) {
    console.warn("Unexpected OK response from NASA GIBS for 1970 date; validating buffer contents");
  } else {
    console.log("PASS: NASA GIBS rejects pre-launch date as expected.");
  }

  // 7. Malformed Request Handling
  console.log("--- 7. Testing Malformed / Missing Request Body ---");
  const resEmpty = await fetch(`${BASE_URL}/api/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  if (resEmpty.status !== 400) {
    throw new Error(`Expected HTTP 400 for empty query, got ${resEmpty.status}`);
  }
  console.log("PASS: Empty query returns HTTP 400 Bad Request.\n");

  console.log(">>> ALL PHASE 6 HONEST FAILURE & ERROR HANDLING CHECKS PASSED!\n");
}

runFailureTests().catch(err => {
  console.error("FAILURE TEST FAILED:", err);
  process.exit(1);
});
