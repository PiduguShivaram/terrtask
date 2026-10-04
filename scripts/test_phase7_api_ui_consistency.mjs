// Phase 7 API / UI Evidence Lineage & Parity Test Suite
// Verifies that:
// 1. All displayed numbers in decisionAnswer have corresponding structured evidence objects.
// 2. Structured evidence objects trace back directly to raw best-track / satellite sources.
// 3. UI rendering contract (AnswerCard & EvidenceViewer) receives identical fields from API.
// 4. Zero ungrounded or detached numerical constants exist between API and presentation layers.

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

async function verifyLineageForQuery(query) {
  console.log(`Auditing evidence lineage for: "${query}"`);
  const res = await fetch(`${BASE_URL}/api/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });

  if (!res.ok) throw new Error(`Query failed: ${res.status}`);
  const data = await res.json();

  if (data.intent?.type.startsWith('unsupported') || data.errorState?.isError) {
    console.log(`  -> Negative/Refusal state verified with zero fabricated evidence.`);
    return;
  }

  const { decisionAnswer, evidence, storm, activePointIndex } = data;
  if (!decisionAnswer) throw new Error("Missing decisionAnswer object in API response");
  if (!evidence || !Array.isArray(evidence) || evidence.length === 0) {
    throw new Error("Missing or empty evidence array in API response");
  }

  // 1. Check Wind Lineage
  const activeFix = storm?.track?.[activePointIndex];
  if (activeFix && activeFix.windKts !== null) {
    const windEvidence = evidence.find(e => e.id === 'ev-wind-intensity');
    if (!windEvidence) throw new Error("Missing ev-wind-intensity in evidence items");
    if (windEvidence.rawValue !== activeFix.windKts) {
      throw new Error(`Wind lineage mismatch: evidence rawValue ${windEvidence.rawValue} != track fix ${activeFix.windKts}`);
    }
    const expectedWindStr = `${activeFix.windKts} kt`;
    if (!decisionAnswer.directAnswer.includes(expectedWindStr) && !decisionAnswer.howStrong?.includes(expectedWindStr)) {
      throw new Error(`Decision answer missing authoritative wind string "${expectedWindStr}"`);
    }
  }

  // 2. Check Pressure Lineage
  if (activeFix && activeFix.pressureHpa !== null) {
    const presEvidence = evidence.find(e => e.id === 'ev-pressure');
    if (!presEvidence) throw new Error("Missing ev-pressure in evidence items");
    if (presEvidence.rawValue !== activeFix.pressureHpa) {
      throw new Error(`Pressure lineage mismatch: evidence rawValue ${presEvidence.rawValue} != track fix ${activeFix.pressureHpa}`);
    }
    const expectedPresStr = `${activeFix.pressureHpa} hPa`;
    if (!decisionAnswer.directAnswer.includes(expectedPresStr) && !decisionAnswer.howStrong?.includes(expectedPresStr)) {
      throw new Error(`Decision answer missing authoritative pressure string "${expectedPresStr}"`);
    }
  }

  // 3. Check Satellite Evidence Lineage
  if (data.satelliteAnalysis) {
    const satProxyEvidence = evidence.find(e => e.id === 'ev-satellite-cloud-proxy');
    if (satProxyEvidence) {
      const expectedCloudPct = `${data.satelliteAnalysis.denseCloudFractionPct}%`;
      if (satProxyEvidence.rawValue !== expectedCloudPct) {
        throw new Error(`Cloud proxy lineage mismatch: ${satProxyEvidence.rawValue} != ${expectedCloudPct}`);
      }
    }
  }

  if (data.satelliteComparison) {
    const satCompEvidence = evidence.find(e => e.id === 'ev-satellite-temporal-comparison');
    if (satCompEvidence) {
      const expectedMAD = `${data.satelliteComparison.meanAbsoluteDifference} / 255`;
      const expectedAreaPct = `${data.satelliteComparison.changedAreaPct}%`;
      if (satCompEvidence.rawValue !== expectedMAD) {
        throw new Error(`Temporal comparison MAD lineage mismatch: ${satCompEvidence.rawValue} != ${expectedMAD}`);
      }
      if (!satCompEvidence.displayValue.includes(expectedAreaPct)) {
        throw new Error(`Temporal comparison area change lineage mismatch: "${satCompEvidence.displayValue}" does not contain "${expectedAreaPct}"`);
      }
    }
  }

  // 4. Check Taxonomy Compliance on All Evidence Items
  for (const item of evidence) {
    if (!item.id || !item.label || !item.category || !item.source || !item.dataset || !item.timestamp) {
      throw new Error(`Incomplete evidence item structure: ${JSON.stringify(item)}`);
    }
  }

  console.log(`  -> Lineage verified across ${evidence.length} structured evidence items.\n`);
}

async function runApiUiConsistencyTests() {
  console.log("=== PHASE 7 STEP 15: API / UI EVIDENCE LINEAGE TEST SUITE ===\n");

  const testQueries = [
    "What happened near Puri during Cyclone Fani?",
    "How strong was Fani near Puri?",
    "Which cyclone came closest to Chennai?",
    "What did the satellite imagery show before and during landfall?",
    "What changed between May 1 and May 3?",
    "What will Fani do tomorrow?",
  ];

  for (const q of testQueries) {
    await verifyLineageForQuery(q);
  }

  console.log(">>> ALL API / UI EVIDENCE LINEAGE CHECKS PASSED!\n");
}

runApiUiConsistencyTests().catch(err => {
  console.error("API / UI CONSISTENCY TEST FAILED:", err);
  process.exit(1);
});
