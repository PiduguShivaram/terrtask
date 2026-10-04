// Test the 4 specific Phase 3 negative queries
async function testNegativeQueries() {
  console.log("=== TESTING PHASE 3 NEGATIVE QUERIES ===\n");

  const tests = [
    {
      name: "1. Future Forecast Refusal",
      query: "What will Fani do tomorrow?",
      expectedIntent: "unsupported_forecast",
      verify: (data) => {
        return data.intent?.type === "unsupported_forecast" &&
               data.answer.includes("does not currently provide a validated 24-hour forecast");
      }
    },
    {
      name: "2. Building Damage Refusal",
      query: "Which buildings will be destroyed?",
      expectedIntent: "unsupported_damage",
      verify: (data) => {
        return data.intent?.type === "unsupported_damage" &&
               data.answer.includes("does not have a validated building-damage or exposure model");
      }
    },
    {
      name: "3. Out of Scope Geography (Antarctica)",
      query: "What is happening in Antarctica?",
      expectedIntent: "unknown_or_unsupported",
      verify: (data) => {
        return data.answer.includes("antarctica") && 
               data.answer.includes("Observational data is unavailable") &&
               data.reasoning.includes("outside the North Indian Ocean basin");
      }
    },
    {
      name: "4. Satellite Intensity Distinction",
      query: "Give me the exact cyclone intensity from the satellite image.",
      expectedIntent: "satellite_intensity_request",
      verify: (data) => {
        return data.intent?.type === "satellite_intensity_request" &&
               data.answer.includes("Direct cyclone wind intensity cannot be measured solely from an optical RGB satellite image") &&
               data.answer.includes("NOAA IBTrACS archive");
      }
    }
  ];

  let allPassed = true;
  for (const t of tests) {
    console.log(`--- Running Negative Test: ${t.name} ---`);
    console.log(`Query: "${t.query}"`);
    const res = await fetch("http://localhost:3000/api/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: t.query }),
    });

    const data = await res.json();
    console.log("Intent detected:", data.intent?.type);
    console.log("Answer snippet:", data.answer.slice(0, 150));
    const passed = t.verify(data);
    if (passed) {
      console.log(`>>> ${t.name}: PASSED\n`);
    } else {
      console.error(`>>> ${t.name}: FAILED\n`);
      allPassed = false;
    }
  }

  console.log(`=== NEGATIVE TEST SUITE: ${allPassed ? "ALL PASSED" : "FAILED"} ===`);
  if (!allPassed) process.exit(1);
}

testNegativeQueries().catch(err => {
  console.error("Test error:", err);
  process.exit(1);
});
