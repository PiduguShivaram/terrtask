// Test the 4 specific Phase 3 query examples against the live production server
async function testPhase3Queries() {
  console.log("=== TESTING PHASE 3 QUERY EXAMPLES ===\n");

  const queries = [
    {
      name: "Example 1: Puri Proximity Query",
      text: "What is happening near Puri?",
      check: (data) => {
        console.log("Target Location:", data.targetLocationInfo?.name);
        console.log("Resolved Coordinates:", data.targetLocationInfo?.lat, data.targetLocationInfo?.lon);
        console.log("Target Storm:", data.storm?.name);
        console.log("Closest Distance:", data.relevantStorms?.[0]?.closestDistanceKm, "km");
        console.log("Answer snippet:", data.answer.slice(0, 180));
        return data.targetLocationInfo?.name === "Puri" && 
               data.storm?.name === "FANI" && 
               data.evidence.length > 0;
      }
    },
    {
      name: "Example 2: Intensity Evidence Query",
      text: "What evidence supports this intensity estimate?",
      check: (data) => {
        console.log("Detected Intent:", data.intent?.type);
        console.log("Storm:", data.storm?.name);
        console.log("Evidence items count:", data.evidence.length);
        const categories = [...new Set(data.evidence.map(e => e.category))];
        console.log("Categories present:", categories);
        const windItem = data.evidence.find(e => e.id === "ev-wind-intensity");
        console.log("Official Observed Wind:", windItem?.displayValue);
        const satItem = data.evidence.find(e => e.category === "Derived");
        console.log("Derived Satellite Feature:", satItem?.label);
        console.log("Limitations count:", data.limitations?.length);
        console.log("Answer snippet:", data.answer.slice(0, 180));
        return windItem && categories.includes("Observed") && categories.includes("Derived");
      }
    },
    {
      name: "Example 3: Temporal Evolution Query",
      text: "Show me how Fani evolved.",
      check: (data) => {
        console.log("Detected Intent:", data.intent?.type);
        console.log("Storm:", data.storm?.name);
        console.log("Track points count:", data.storm?.track.length);
        console.log("Timeline phases count:", data.timelinePhases?.length);
        data.timelinePhases?.forEach(p => {
          console.log(` - Phase [${p.phase}]: ${p.label} (${p.dateRange})`);
        });
        console.log("Answer snippet:", data.answer.slice(0, 180));
        return data.storm?.track.length > 10 && data.timelinePhases?.length === 3;
      }
    },
    {
      name: "Example 4: Chennai Proximity Query (Must NOT default to Fani)",
      text: "What is happening near Chennai?",
      check: (data) => {
        console.log("Target Location:", data.targetLocationInfo?.name);
        console.log("Coordinates:", data.targetLocationInfo?.lat, data.targetLocationInfo?.lon);
        console.log("Target Storm:", data.storm?.name);
        console.log("Relevant Storms for Chennai:", data.relevantStorms.map(s => `${s.storm.name} (${s.closestDistanceKm} km)`).join(", "));
        console.log("Answer snippet:", data.answer.slice(0, 180));
        return data.targetLocationInfo?.name === "Chennai" && 
               data.storm?.name !== "FANI" && 
               data.relevantStorms.length > 0;
      }
    }
  ];

  let allPassed = true;

  for (const q of queries) {
    console.log(`\n--- Running ${q.name} ---`);
    console.log(`Query: "${q.text}"`);
    const res = await fetch("http://localhost:3000/api/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: q.text }),
    });

    if (!res.ok) {
      console.error(`HTTP error ${res.status}: ${await res.text()}`);
      allPassed = false;
      continue;
    }

    const data = await res.json();
    const passed = q.check(data);
    if (passed) {
      console.log(`>>> ${q.name}: PASSED`);
    } else {
      console.error(`>>> ${q.name}: FAILED`);
      allPassed = false;
    }
  }

  console.log(`\n=== FINAL RESULT: ${allPassed ? "ALL EXAMPLES PASSED" : "FAILURES DETECTED"} ===`);
  if (!allPassed) process.exit(1);
}

testPhase3Queries().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
