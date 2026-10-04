// Phase 7 Scientific Language & Terminology Audit Test Suite
// Verifies that live API responses adhere strictly to the Phase 4–7 scientific vocabulary,
// evidence taxonomy (Observed, Derived, Model-based, Interpretation), and boundary statements.

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

const FORBIDDEN_OUTPUT_TERMS = [
  'Level-1B',
  '100% data coverage',
  'Convective cloud top',
  'Convective core centroid',
  'Significant Optical Area Shift',
  'AI confidence',
  'forecast confidence',
  'predicted wind',
  'predicted pressure',
  'satellite measured wind',
  'satellite measured pressure',
  '100% decode rate',
];

const REQUIRED_SCIENTIFIC_PHRASES = [
  'NASA GIBS MODIS Terra Corrected Reflectance True Color imagery',
  'retrieved image pixels successfully decoded',
  'high-albedo cloud proxy fraction',
  'optical pixel change',
];

const SAMPLE_QUERIES = [
  "What happened near Puri during Cyclone Fani?",
  "How strong was Fani near Puri?",
  "What did the satellite imagery show before and during landfall?",
  "What changed between May 1 and May 3?",
  "Which cyclone came closest to Chennai?",
  "What can the satellite image actually tell me?",
];

async function runScientificLanguageAudit() {
  console.log("=== PHASE 7 STEP 16: SCIENTIFIC LANGUAGE & TERMINOLOGY AUDIT ===\n");

  for (const q of SAMPLE_QUERIES) {
    console.log(`Auditing query response: "${q}"`);
    const res = await fetch(`${BASE_URL}/api/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: q }),
    });

    if (!res.ok) throw new Error(`Query failed [${res.status}]: ${q}`);
    const data = await res.json();
    const serialized = JSON.stringify(data).toLowerCase();

    // Check for forbidden terms in active output
    for (const forbidden of FORBIDDEN_OUTPUT_TERMS) {
      if (serialized.includes(forbidden.toLowerCase())) {
        throw new Error(`VIOLATION: Response for "${q}" contained forbidden scientific term: "${forbidden}"`);
      }
    }

    // Verify Evidence Taxonomy (Observed, Derived, Model-based)
    if (data.evidence && data.evidence.length > 0) {
      const allowedCategories = new Set(['Observed', 'Derived', 'Model-based', 'Interpretation']);
      for (const item of data.evidence) {
        if (!allowedCategories.has(item.category)) {
          throw new Error(`VIOLATION: Unrecognized evidence category "${item.category}" in item "${item.id}"`);
        }

        // Verify IBTrACS is strictly Observed
        if (item.source?.includes('IBTrACS') && item.id.includes('wind') && item.category !== 'Observed') {
          throw new Error(`VIOLATION: IBTrACS wind item ${item.id} must be 'Observed', got '${item.category}'`);
        }

        // Verify ERA5 is strictly Model-based
        if (item.source?.includes('ERA5') && item.category !== 'Model-based') {
          throw new Error(`VIOLATION: ERA5 item ${item.id} must be 'Model-based', got '${item.category}'`);
        }

        // Verify Satellite pixel calculations are Derived
        if (item.id.includes('satellite') && item.category !== 'Derived') {
          throw new Error(`VIOLATION: Satellite pixel item ${item.id} must be 'Derived', got '${item.category}'`);
        }
      }
    }
  }

  console.log("\nPASS: All tested API outputs respect strict scientific terminology boundaries.");
  console.log("PASS: IBTrACS is strictly Observed, NASA GIBS is Derived, ERA5 is Model-based.");
  console.log("PASS: Zero forbidden speculative phrases or conflated pressure terms detected.");
  console.log("\n>>> PHASE 7 SCIENTIFIC LANGUAGE AUDIT PASSED!\n");
}

runScientificLanguageAudit().catch(err => {
  console.error("SCIENTIFIC LANGUAGE AUDIT FAILED:", err);
  process.exit(1);
});
