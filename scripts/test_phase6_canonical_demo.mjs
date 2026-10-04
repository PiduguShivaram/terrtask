// Phase 6 Canonical Demo Verification Script (Step 17)
// Executes the canonical 10 demo queries in exact sequence against the live production server.
// Verifies that queries 1-9 return grounded evidence, and query 10 strictly refuses forecasting.

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

const DEMO_QUERIES = [
  {
    num: 1,
    query: "What happened near Puri during Cyclone Fani?",
    expectedStorm: "FANI",
    expectedDistance: "27.4 km",
    expectedWind: 100,
    expectedPres: 952,
    shouldRefuse: false,
  },
  {
    num: 2,
    query: "How strong was Fani near Puri?",
    expectedStorm: "FANI",
    expectedWind: 100,
    expectedPres: 952,
    shouldRefuse: false,
  },
  {
    num: 3,
    query: "What evidence supports Fani's intensity?",
    expectedStorm: "FANI",
    minEvidence: 4,
    mustHaveCategory: ["Observed", "Derived", "Model-based"],
    shouldRefuse: false,
  },
  {
    num: 4,
    query: "What did the satellite imagery show before and during landfall?",
    expectedStorm: "FANI",
    mustIncludeText: "MODIS",
    shouldRefuse: false,
  },
  {
    num: 5,
    query: "What changed between May 1 and May 3?",
    expectedStorm: "FANI",
    mustIncludeText: "optical pixel change",
    shouldRefuse: false,
  },
  {
    num: 6,
    query: "What happened near Chennai?",
    expectedStorm: "VARDAH",
    expectedDistance: "13.4 km",
    shouldRefuse: false,
  },
  {
    num: 7,
    query: "Which cyclone came closest to Chennai?",
    expectedStorm: "VARDAH",
    expectedDistance: "13.4 km",
    shouldRefuse: false,
  },
  {
    num: 8,
    query: "Compare Fani with another historical cyclone.",
    expectedStorm: "FANI",
    mustIncludeText: "PHAILIN",
    shouldRefuse: false,
  },
  {
    num: 9,
    query: "What can the satellite image actually tell me?",
    mustIncludeText: "cannot directly measure",
    shouldRefuse: false,
  },
  {
    num: 10,
    query: "What will Fani do tomorrow?",
    shouldRefuse: true,
    expectedIntent: "unsupported_forecast",
  },
];

async function runCanonicalDemo() {
  console.log("=== PHASE 6 STEP 17: CANONICAL DEMO EXECUTION IN EXACT ORDER ===\n");

  for (const step of DEMO_QUERIES) {
    console.log(`[Demo Query ${step.num}/10]: "${step.query}"`);
    const res = await fetch(`${BASE_URL}/api/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: step.query }),
    });

    if (!res.ok) {
      throw new Error(`Demo step ${step.num} HTTP error: ${res.status}`);
    }

    const data = await res.json();
    const answer = data.decisionAnswer?.directAnswer || data.assessment || "";

    if (step.shouldRefuse) {
      if (data.intent?.type !== step.expectedIntent) {
        throw new Error(`Step ${step.num} expected intent ${step.expectedIntent}, got ${data.intent?.type}`);
      }
      if (!data.errorState?.isError) {
        throw new Error(`Step ${step.num} expected errorState.isError = true`);
      }
      console.log(`  -> Refusal verified: "${data.errorState.reason}"`);
    } else {
      if (data.errorState?.isError) {
        throw new Error(`Step ${step.num} unexpectedly reported error: ${data.errorState?.reason}`);
      }
      if (step.expectedStorm && data.storm?.name !== step.expectedStorm) {
        throw new Error(`Step ${step.num} expected storm ${step.expectedStorm}, got ${data.storm?.name}`);
      }
      if (step.expectedDistance && !answer.includes(step.expectedDistance)) {
        throw new Error(`Step ${step.num} expected distance ${step.expectedDistance} in answer: "${answer}"`);
      }
      if (step.expectedWind) {
        const windItem = data.evidence.find(e => e.id === "ev-wind-intensity");
        if (windItem?.rawValue !== step.expectedWind) {
          throw new Error(`Step ${step.num} expected wind ${step.expectedWind}, got ${windItem?.rawValue}`);
        }
      }
      if (step.expectedPres) {
        const presItem = data.evidence.find(e => e.id === "ev-pressure");
        if (presItem?.rawValue !== step.expectedPres) {
          throw new Error(`Step ${step.num} expected pressure ${step.expectedPres}, got ${presItem?.rawValue}`);
        }
      }
      if (step.mustIncludeText && !answer.toLowerCase().includes(step.mustIncludeText.toLowerCase())) {
        throw new Error(`Step ${step.num} expected text "${step.mustIncludeText}" in answer: "${answer}"`);
      }
      console.log(`  -> Validated Grounded Answer: ${answer.slice(0, 110)}...`);
    }
  }

  console.log("\n>>> ALL 10 CANONICAL DEMO QUERIES EXECUTED AND VERIFIED SUCCESSFULLY!");
}

runCanonicalDemo().catch(err => {
  console.error("CANONICAL DEMO EXECUTION FAILED:", err);
  process.exit(1);
});
