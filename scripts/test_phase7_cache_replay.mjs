// Phase 7 Cache Replay & Cross-Contamination Hardening Test Suite
// Executes an interleaved A -> B -> A query replay pattern to verify complete isolation:
// A: Puri / Cyclone Fani
// B: Chennai / Cyclone Vardah
// A: Puri / Cyclone Fani (replayed)
// Validates that the final A response contains strictly A's evidence, coordinates, and metrics.
// Also tests:
// - Same location / different storm (Balasore Yaas vs Balasore Dana)
// - Different location / same storm (Puri Fani vs Bhubaneswar Fani)
// - Satellite date switching (2019-05-01 vs 2019-05-03)

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

async function fetchQuery(query, stormSid) {
  const res = await fetch(`${BASE_URL}/api/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, stormSid }),
  });
  if (!res.ok) throw new Error(`Query failed [${res.status}]: ${query}`);
  return await res.json();
}

async function runCacheReplayTests() {
  console.log("=== PHASE 7 STEP 14: CACHE REPLAY & ISOLATION HARDENING ===\n");

  // 1. Classical A -> B -> A Replay
  console.log("--- 1. Testing Interleaved Replay: A (Puri) -> B (Chennai) -> A (Puri) ---");
  const qA = "What happened near Puri during Cyclone Fani?";
  const qB = "Which cyclone came closest to Chennai?";

  console.log("Query A1: Puri / Fani");
  const resA1 = await fetchQuery(qA);

  console.log("Query B: Chennai / Vardah");
  const resB = await fetchQuery(qB);

  console.log("Query A2 (Replay): Puri / Fani");
  const resA2 = await fetchQuery(qA);

  // Assertions on A1 vs A2
  if (resA1.storm?.name !== 'FANI' || resA2.storm?.name !== 'FANI') {
    throw new Error(`Storm mismatch on A: ${resA1.storm?.name} vs ${resA2.storm?.name}`);
  }
  if (resB.storm?.name !== 'VARDAH') {
    throw new Error(`Storm mismatch on B: expected VARDAH, got ${resB.storm?.name}`);
  }

  const directA1 = resA1.decisionAnswer?.directAnswer || "";
  const directA2 = resA2.decisionAnswer?.directAnswer || "";
  const directB = resB.decisionAnswer?.directAnswer || "";

  if (directA1 !== directA2) {
    throw new Error("FAIL: Replayed query A2 produced differing answer text from A1!");
  }

  // Cross-contamination checks
  if (directA2.includes("Chennai") || directA2.includes("Vardah") || directA2.includes("13.4 km")) {
    throw new Error("LEAK DETECTED: Query A2 contains Vardah / Chennai evidence from intermediate Query B!");
  }
  if (directB.includes("Puri") || directB.includes("Fani") || directB.includes("27.4 km")) {
    throw new Error("LEAK DETECTED: Query B contains Fani / Puri evidence from preceding Query A1!");
  }
  console.log("PASS: A -> B -> A cache replay succeeded with zero cross-contamination.\n");

  // 2. Same Location / Different Storm: Balasore Yaas vs Balasore Dana
  console.log("--- 2. Testing Same Location / Different Storm Replay ---");
  const resYaas = await fetchQuery("What happened near Balasore during Cyclone Yaas?");
  const resDana = await fetchQuery("What happened near Balasore during Cyclone Dana?");
  const resYaas2 = await fetchQuery("What happened near Balasore during Cyclone Yaas?");

  const yaasWind1 = resYaas.evidence.find(e => e.id === 'ev-wind-intensity')?.rawValue;
  const yaasWind2 = resYaas2.evidence.find(e => e.id === 'ev-wind-intensity')?.rawValue;
  const danaWind = resDana.evidence.find(e => e.id === 'ev-wind-intensity')?.rawValue;

  console.log(`Yaas1 Wind: ${yaasWind1} kt | Dana Wind: ${danaWind} kt | Yaas2 Wind: ${yaasWind2} kt`);
  if (yaasWind1 !== 75 || yaasWind2 !== 75) {
    throw new Error(`Expected Yaas wind to be 75 kt, got ${yaasWind1} and ${yaasWind2}`);
  }
  if (danaWind !== 30) {
    throw new Error(`Expected Dana closest wind near Balasore to be 30 kt, got ${danaWind}`);
  }
  console.log("PASS: Multi-storm queries at identical location remain strictly isolated.\n");

  // 3. Different Location / Same Storm: Puri Fani vs Bhubaneswar Fani
  console.log("--- 3. Testing Different Location / Same Storm Replay ---");
  const resPuri = await fetchQuery("How strong was Fani near Puri?");
  const resBhub = await fetchQuery("How strong was Fani near Bhubaneswar?");
  const resPuri2 = await fetchQuery("How strong was Fani near Puri?");

  const puriWhere1 = resPuri.decisionAnswer?.where || "";
  const puriWhere2 = resPuri2.decisionAnswer?.where || "";
  const bhubWhere = resBhub.decisionAnswer?.where || "";

  console.log(`Puri1 Location: ${puriWhere1}`);
  console.log(`Bhub Location: ${bhubWhere}`);
  console.log(`Puri2 Location: ${puriWhere2}`);

  if (!puriWhere1.includes("27.4 km") || !puriWhere2.includes("27.4 km")) {
    throw new Error("Expected 27.4 km in Puri location fields");
  }
  if (!bhubWhere.includes("13.3 km")) {
    throw new Error(`Expected 13.3 km in Bhubaneswar location field: "${bhubWhere}"`);
  }
  if (bhubWhere.includes("27.4 km")) {
    throw new Error("LEAK DETECTED: Bhubaneswar answer leaked Puri distance (27.4 km)!");
  }
  console.log("PASS: Same-storm multi-location queries remain strictly isolated.\n");

  // 4. Satellite Date Replay
  console.log("--- 4. Testing Multi-Date Satellite Cache Separation ---");
  const resSatDate = await fetchQuery("What changed between May 1 and May 3?");
  const changePct = resSatDate.decisionAnswer?.whatChangedOverTime || "";
  if (!changePct.includes("70.1%") || !changePct.includes("86.8")) {
    throw new Error(`Expected 70.1% and 86.8 in satellite comparison, got: "${changePct}"`);
  }
  console.log("PASS: Multi-date satellite image cache preserves distinct temporal metrics.\n");

  console.log(">>> ALL CACHE REPLAY & HARDENING CHECKS PASSED SUCCESSFULLY!\n");
}

runCacheReplayTests().catch(err => {
  console.error("CACHE REPLAY TEST FAILED:", err);
  process.exit(1);
});
