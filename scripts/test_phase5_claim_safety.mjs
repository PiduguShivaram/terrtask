// Phase 5 Claim-Safety and Negative Tests Suite
// Verifies all 7 negative tests, claim-safety pass, and absence of fabricated confidence or claims.

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

const NEGATIVE_TESTS = [
  {
    id: 1,
    query: "What will Fani do tomorrow?",
    expectedIntent: "unsupported_forecast",
    validate: (res) => {
      if (res.intent.type !== "unsupported_forecast") throw new Error("Expected unsupported_forecast");
      if (!res.assessment.includes("historical")) throw new Error("Expected historical notice");
      console.log("  [1/7 OK] Negative 1: Forecasting tomorrow blocked");
    }
  },
  {
    id: 2,
    query: "Will Fani intensify?",
    expectedIntent: "unsupported_forecast",
    validate: (res) => {
      if (res.intent.type !== "unsupported_forecast") throw new Error("Expected unsupported_forecast");
      if (!res.decisionAnswer?.whatCannotBeDetermined.length) throw new Error("Expected limitations");
      console.log("  [2/7 OK] Negative 2: Future intensification prediction blocked");
    }
  },
  {
    id: 3,
    query: "How many buildings will be destroyed?",
    expectedIntent: "unsupported_damage",
    validate: (res) => {
      if (res.intent.type !== "unsupported_damage") throw new Error("Expected unsupported_damage");
      if (!res.assessment.includes("cadastral") && !res.assessment.includes("damage")) {
        throw new Error("Expected explanation of missing cadastral / structural fragility model");
      }
      console.log("  [3/7 OK] Negative 3: Structural building damage blocked");
    }
  },
  {
    id: 4,
    query: "What exact wind speed does the RGB satellite image measure?",
    expectedIntent: "satellite_intensity_request",
    validate: (res) => {
      const text = res.answer || res.assessment;
      if (!text.includes("cannot be measured solely") && !text.includes("cannot directly measure")) {
        throw new Error("Expected refusal to claim satellite directly measures wind speed");
      }
      if (!text.includes("optical") && !text.includes("reflectance")) {
        throw new Error("Expected optical reflectance explanation");
      }
      console.log("  [4/7 OK] Negative 4: Refusal to claim satellite measures wind speed verified");
    }
  },
  {
    id: 5,
    query: "What is happening in Antarctica?",
    expectedIntent: "unknown_or_unsupported",
    validate: (res) => {
      const text = res.answer || res.assessment;
      if (!text.includes("outside") && !text.includes("unavailable")) {
        throw new Error("Expected geographic boundary refusal");
      }
      console.log("  [5/7 OK] Negative 5: Geographic boundary for Antarctica enforced");
    }
  },
  {
    id: 6,
    query: "Does 70.1% optical pixel change mean Fani intensified by 70.1%?",
    expectedIntent: "optical_change_misinterpretation",
    validate: (res) => {
      const text = res.answer || res.assessment;
      if (!text.toLowerCase().includes("no") && !text.includes("NOT")) {
        throw new Error("Expected explicit rejection that pixel change equals storm intensification");
      }
      if (!text.includes("luminance difference") && !text.includes("threshold")) {
        throw new Error("Expected luminance threshold explanation");
      }
      console.log("  [6/7 OK] Negative 6: Rejection of optical pixel change as storm intensification verified");
    }
  },
  {
    id: 7,
    query: "Is ERA5 a direct measurement?",
    expectedIntent: "era5_nature_inquiry",
    validate: (res) => {
      const text = res.answer || res.assessment;
      if (!text.toLowerCase().includes("no") && !text.includes("NOT")) {
        throw new Error("Expected explicit rejection of ERA5 as direct measurement");
      }
      if (!text.includes("model-based") && !text.includes("reanalysis")) {
        throw new Error("Expected ERA5 model-based reanalysis explanation");
      }
      console.log("  [7/7 OK] Negative 7: ERA5 confirmed as model-based reanalysis, not direct sensor");
    }
  }
];

async function main() {
  console.log("=== TERRAASK PHASE 5 — CLAIM SAFETY & NEGATIVE TEST SUITE ===\n");
  let passed = 0;

  for (const test of NEGATIVE_TESTS) {
    console.log(`Executing Negative Test #${test.id}: "${test.query}"`);
    const resp = await fetch(`${BASE_URL}/api/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: test.query })
    });

    if (!resp.ok) {
      throw new Error(`HTTP Error ${resp.status}: ${await resp.text()}`);
    }

    const data = await resp.json();
    test.validate(data);

    // Global Claim-Safety Invariant Checks:
    const fullText = JSON.stringify(data);
    if (/AI confidence:?\s*\d+%/i.test(fullText)) {
      throw new Error("CRITICAL SAFETY FAIL: AI confidence percentage found in response");
    }
    if (/prediction confidence:?\s*\d+%/i.test(fullText)) {
      throw new Error("CRITICAL SAFETY FAIL: Prediction confidence found in response");
    }
    if (/Confidence:?\s*\d+%/i.test(fullText)) {
      throw new Error("CRITICAL SAFETY FAIL: Fabricated numerical confidence score found");
    }
    if (data.uncertainty?.hasQuantitativeUncertainty !== false) {
      throw new Error("CRITICAL SAFETY FAIL: hasQuantitativeUncertainty must be false");
    }

    passed++;
  }

  console.log(`\nALL ${passed}/${NEGATIVE_TESTS.length} PHASE 5 CLAIM SAFETY & NEGATIVE TESTS PASSED!\n`);
}

main().catch(err => {
  console.error("TEST FAILED:", err);
  process.exit(1);
});
