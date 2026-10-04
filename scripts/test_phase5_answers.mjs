// Phase 5 Supported Demo Questions Test Suite
// Verifies all 10 supported demo queries against the production API.

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

const DEMO_TESTS = [
  {
    id: 1,
    query: "What happened near Puri during Cyclone Fani?",
    expectedIntent: "location_hazard",
    validate: (res) => {
      if (!res.decisionAnswer) throw new Error("Missing decisionAnswer");
      if (!res.decisionAnswer.directAnswer.includes("Puri")) throw new Error("Direct answer should mention Puri");
      if (!res.decisionAnswer.where || !res.decisionAnswer.when) throw new Error("Missing where/when");
      if (!res.decisionAnswer.howStrong?.includes("100 kt")) throw new Error("Expected 100 kt sustained wind");
      console.log("  [1/10 OK] What happened near Puri during Cyclone Fani");
    }
  },
  {
    id: 2,
    query: "How strong was Fani near Puri?",
    expectedIntent: "cyclone_intensity",
    validate: (res) => {
      if (!res.decisionAnswer) throw new Error("Missing decisionAnswer");
      if (!res.decisionAnswer.directAnswer.includes("100 kt")) throw new Error("Expected 100 kt in direct answer");
      if (!res.decisionAnswer.directAnswer.includes("952 hPa")) throw new Error("Expected 952 hPa in direct answer");
      if (!res.decisionAnswer.whatCannotBeDetermined.length) throw new Error("Expected limitations");
      console.log("  [2/10 OK] How strong was Fani near Puri");
    }
  },
  {
    id: 3,
    query: "What evidence supports Fani's intensity?",
    expectedIntent: "evidence_inspection",
    validate: (res) => {
      if (!res.decisionAnswer) throw new Error("Missing decisionAnswer");
      if (!res.evidence || res.evidence.length === 0) throw new Error("Expected evidence items");
      const hasObserved = res.evidence.some(e => e.category === "Observed");
      const hasDerived = res.evidence.some(e => e.category === "Derived");
      if (!hasObserved || !hasDerived) throw new Error("Expected Observed and Derived evidence categories");
      console.log("  [3/10 OK] What evidence supports Fani's intensity");
    }
  },
  {
    id: 4,
    query: "What did the satellite imagery show before and during landfall?",
    expectedIntent: "satellite_comparison",
    validate: (res) => {
      if (!res.decisionAnswer) throw new Error("Missing decisionAnswer");
      if (!res.satelliteComparison && !res.satelliteAnalysis) throw new Error("Expected satellite metrics");
      if (!res.decisionAnswer.whatSatelliteShows) throw new Error("Expected whatSatelliteShows");
      console.log("  [4/10 OK] What did the satellite imagery show before and during landfall");
    }
  },
  {
    id: 5,
    query: "What changed between May 1 and May 3?",
    expectedIntent: "satellite_comparison",
    validate: (res) => {
      if (!res.decisionAnswer) throw new Error("Missing decisionAnswer");
      if (!res.decisionAnswer.directAnswer.includes("70.1%")) throw new Error("Expected 70.1% optical pixel change");
      if (!res.decisionAnswer.whatChangedOverTime) throw new Error("Expected whatChangedOverTime");
      console.log("  [5/10 OK] What changed between May 1 and May 3");
    }
  },
  {
    id: 6,
    query: "Show me the evidence for Fani.",
    expectedIntent: "evidence_inspection",
    validate: (res) => {
      if (!res.decisionAnswer) throw new Error("Missing decisionAnswer");
      if (!res.evidence || res.evidence.length < 3) throw new Error("Expected comprehensive evidence bundle");
      if (!res.provenance || res.provenance.length === 0) throw new Error("Expected provenance records");
      console.log("  [6/10 OK] Show me the evidence for Fani");
    }
  },
  {
    id: 7,
    query: "What happened near Chennai?",
    expectedIntent: "location_hazard",
    validate: (res) => {
      if (!res.decisionAnswer) throw new Error("Missing decisionAnswer");
      if (!res.decisionAnswer.where?.includes("Chennai")) throw new Error("Expected Chennai in where");
      if (!res.storm) throw new Error("Expected storm matched near Chennai");
      console.log(`  [7/10 OK] What happened near Chennai (Found storm: ${res.storm.name})`);
    }
  },
  {
    id: 8,
    query: "Which cyclone came closest to Chennai?",
    expectedIntent: "closest_storm_query",
    validate: (res) => {
      if (!res.decisionAnswer) throw new Error("Missing decisionAnswer");
      if (!res.decisionAnswer.directAnswer.includes("Vardah") && !res.decisionAnswer.directAnswer.includes("VARDAH")) {
        throw new Error("Expected Cyclone Vardah to be identified as closest to Chennai");
      }
      if (!res.decisionAnswer.where?.includes("Chennai")) throw new Error("Expected Chennai in where field");
      console.log("  [8/10 OK] Which cyclone came closest to Chennai (Identified Vardah)");
    }
  },
  {
    id: 9,
    query: "Compare Fani with another historical cyclone.",
    expectedIntent: "historical_cyclone_comparison",
    validate: (res) => {
      if (!res.decisionAnswer) throw new Error("Missing decisionAnswer");
      const answerUpper = res.decisionAnswer.directAnswer.toUpperCase();
      if (!answerUpper.includes("FANI") || (!answerUpper.includes("PHAILIN") && !answerUpper.includes("AMPHAN"))) {
        throw new Error("Expected directAnswer to compare FANI with PHAILIN or AMPHAN");
      }
      console.log("  [9/10 OK] Compare Fani with another historical cyclone (Compared with Phailin/Amphan)");
    }
  },
  {
    id: 10,
    query: "What can the satellite image actually tell me?",
    expectedIntent: "satellite_capabilities_inquiry",
    validate: (res) => {
      if (!res.decisionAnswer) throw new Error("Missing decisionAnswer");
      const answer = res.decisionAnswer.directAnswer;
      if (!answer.includes("CANNOT directly measure") && !answer.includes("cannot directly measure")) {
        throw new Error("Expected explicit statement of what satellite cannot measure");
      }
      if (!res.decisionAnswer.whatCannotBeDetermined.length) throw new Error("Expected limitations");
      console.log("  [10/10 OK] What can the satellite image actually tell me");
    }
  }
];

async function main() {
  console.log("=== TERRATASK PHASE 5 — DEMO ANSWERS TEST SUITE ===\n");
  let passed = 0;

  for (const test of DEMO_TESTS) {
    console.log(`Executing Query #${test.id}: "${test.query}"`);
    const resp = await fetch(`${BASE_URL}/api/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: test.query })
    });

    if (!resp.ok) {
      throw new Error(`HTTP Error ${resp.status}: ${await resp.text()}`);
    }

    const data = await resp.json();
    if (data.intent.type !== test.expectedIntent) {
      throw new Error(`Intent mismatch: expected ${test.expectedIntent}, got ${data.intent.type}`);
    }

    test.validate(data);
    passed++;
  }

  console.log(`\nALL ${passed}/${DEMO_TESTS.length} PHASE 5 DEMO QUESTIONS PASSED PERFECTLY!\n`);
}

main().catch(err => {
  console.error("TEST FAILED:", err);
  process.exit(1);
});
