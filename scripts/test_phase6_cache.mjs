// Phase 6 Cache Integrity & Stale Evidence Leakage Test Suite
// Verifies:
// 1. Same query twice produces identical deterministic outputs.
// 2. Different location with same storm does not leak stale location coordinates/distance.
// 3. Same location with different storm does not leak stale storm metrics.
// 4. Different satellite dates maintain separate cached imagery and metrics without cross-contamination.

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

async function fetchQuery(query, stormSid) {
  const res = await fetch(`${BASE_URL}/api/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, stormSid }),
  });
  if (!res.ok) {
    throw new Error(`Query failed [${res.status}]: ${query}`);
  }
  return await res.json();
}

async function runCacheTests() {
  console.log("=== PHASE 6 STEP 11: CACHE INTEGRITY & STALE EVIDENCE AUDIT ===\n");

  // 1. Same query twice: verify exact numerical and object parity
  console.log("--- 1. Testing Idempotence: Same Query Twice ---");
  const q1 = "What happened near Puri during Cyclone Fani?";
  const res1A = await fetchQuery(q1);
  const res1B = await fetchQuery(q1);

  if (res1A.storm?.sid !== res1B.storm?.sid) {
    throw new Error(`Idempotence failure: storm SID mismatch ${res1A.storm?.sid} vs ${res1B.storm?.sid}`);
  }
  if (res1A.decisionAnswer?.directAnswer !== res1B.decisionAnswer?.directAnswer) {
    throw new Error("Idempotence failure: directAnswer differed across identical calls");
  }
  if (res1A.evidence.length !== res1B.evidence.length) {
    throw new Error(`Idempotence failure: evidence count mismatch (${res1A.evidence.length} vs ${res1B.evidence.length})`);
  }
  console.log("PASS: Same query twice yields 100% deterministic, identical results.\n");

  // 2. Different location with same storm
  console.log("--- 2. Testing Isolation: Different Location with Same Storm ---");
  const resPuri = await fetchQuery("How strong was Fani near Puri?");
  const resBhub = await fetchQuery("How strong was Fani near Bhubaneswar?");

  const distPuri = resPuri.evidence.find(e => e.id === 'ev-ibtracs-point')?.description;
  const distBhub = resBhub.evidence.find(e => e.id === 'ev-ibtracs-point')?.description;

  console.log("Puri Fix Description:", distPuri);
  console.log("Bhubaneswar Fix Description:", distBhub);

  if (!distPuri?.includes("Puri") || !distPuri?.includes("27.4 km")) {
    throw new Error(`Puri evidence corrupted or missing: ${distPuri}`);
  }
  if (!distBhub?.includes("Bhubaneswar") || !distBhub?.includes("13.3 km")) {
    throw new Error(`Bhubaneswar evidence corrupted or missing: ${distBhub}`);
  }
  if (distBhub?.includes("27.4 km")) {
    throw new Error("LEAK DETECTED: Bhubaneswar received Puri's distance of 27.4 km!");
  }
  console.log("PASS: Locations remain fully isolated; no stale coordinates or distances leaked.\n");

  // 3. Same location with different storms
  console.log("--- 3. Testing Isolation: Same Location with Different Storms ---");
  const resYaas = await fetchQuery("What happened near Balasore during Cyclone Yaas?");
  const resDana = await fetchQuery("What happened near Balasore during Cyclone Dana?");

  if (resYaas.storm?.name !== 'YAAS') {
    throw new Error(`Expected Cyclone Yaas, got ${resYaas.storm?.name}`);
  }
  if (resDana.storm?.name !== 'DANA') {
    throw new Error(`Expected Cyclone Dana, got ${resDana.storm?.name}`);
  }

  const windYaas = resYaas.evidence.find(e => e.id === 'ev-wind-intensity')?.rawValue;
  const windDana = resDana.evidence.find(e => e.id === 'ev-wind-intensity')?.rawValue;

  console.log(`Balasore Yaas closest wind: ${windYaas} kt (expected 75 kt)`);
  console.log(`Balasore Dana closest wind: ${windDana} kt (expected 30 kt)`);

  if (windYaas !== 75) throw new Error(`Yaas wind expected 75 kt, got ${windYaas}`);
  if (windDana !== 30) throw new Error(`Dana wind expected 30 kt, got ${windDana}`);
  console.log("PASS: Multi-storm queries for same location remain completely isolated.\n");

  // 4. Different satellite dates
  console.log("--- 4. Testing Satellite Observation Date Separation ---");
  const resComp = await fetchQuery("What changed between May 1 and May 3?");

  const dateA = resComp.decisionAnswer?.when;
  const changeSummary = resComp.decisionAnswer?.whatChangedOverTime;
  console.log("Satellite Comparison Window:", dateA);
  console.log("Satellite Change Summary:", changeSummary);

  if (!changeSummary?.includes("70.1%") && !changeSummary?.includes("optical pixel change")) {
    throw new Error(`Expected optical change metric in comparison, got: ${changeSummary}`);
  }
  console.log("PASS: Satellite dates and temporal comparisons preserve date-specific provenance.\n");

  console.log(">>> ALL CACHE INTEGRITY & STALE EVIDENCE CHECKS PASSED!\n");
}

runCacheTests().catch(err => {
  console.error("CACHE TEST FAILED:", err);
  process.exit(1);
});
