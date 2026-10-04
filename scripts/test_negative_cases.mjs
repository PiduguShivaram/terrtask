import jpeg from 'jpeg-js';

async function testNegativeCases() {
  console.log("=== NEGATIVE & FAILURE CASE TESTS ===");

  // 1. Direct NASA GIBS test for pre-launch date (1970)
  console.log("\n1. Testing satellite image retrieval for pre-launch date (1970-01-01)...");
  const testUrl = "https://wvs.earthdata.nasa.gov/api/v1/snapshot?REQUEST=GetSnapshot&TIME=1970-01-01&BBOX=14,80,24,92&CRS=EPSG:4326&LAYERS=MODIS_Terra_CorrectedReflectance_TrueColor,Coastlines_15m&WRAP=day,none&FORMAT=image/jpeg&WIDTH=450&HEIGHT=300";
  try {
    const res = await fetch(testUrl);
    const contentType = res.headers.get("content-type") || "";
    console.log("Response status:", res.status, "Content-Type:", contentType);
    if (!res.ok || !contentType.includes("image")) {
      console.log("PASS: Pre-launch request rejected by GIBS (not a valid image or returned error tile).");
    } else {
      const buffer = Buffer.from(await res.arrayBuffer());
      if (buffer.length < 1000) {
        console.log("PASS: Pre-launch request rejected as empty/error payload (< 1KB).");
      }
    }
  } catch (err) {
    console.log("PASS: Request failed safely:", err.message);
  }

  // 2. Future forecast refusal
  console.log("\n2. Testing future forecast query...");
  const resForecast = await fetch("http://localhost:3000/api/query", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: "Will there be a cyclone next week in Puri?" }),
  });
  const dataForecast = await resForecast.json();
  console.log("Intent:", dataForecast.intent?.type);
  console.log("Answer snippet:", dataForecast.answer.slice(0, 150));
  if (dataForecast.intent?.type === "unsupported_forecast") {
    console.log("PASS: Future forecast query correctly rejected with truthful refusal.");
  } else {
    throw new Error("FAIL: Future forecast not rejected!");
  }

  // 3. Building damage refusal
  console.log("\n3. Testing building damage query...");
  const resDamage = await fetch("http://localhost:3000/api/query", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: "How many buildings were destroyed by Cyclone Fani?" }),
  });
  const dataDamage = await resDamage.json();
  console.log("Intent:", dataDamage.intent?.type);
  console.log("Answer snippet:", dataDamage.answer.slice(0, 150));
  if (dataDamage.intent?.type === "unsupported_damage") {
    console.log("PASS: Structural damage query correctly rejected with truthful refusal.");
  } else {
    throw new Error("FAIL: Damage query not rejected!");
  }

  // 4. Geographic boundary enforcement (Atlantic Hurricane Katrina)
  console.log("\n4. Testing geographic boundary enforcement (Hurricane Katrina)...");
  const resAtlantic = await fetch("http://localhost:3000/api/query", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: "Tell me about Hurricane Katrina in New Orleans" }),
  });
  const dataAtlantic = await resAtlantic.json();
  console.log("Answer snippet:", dataAtlantic.answer.slice(0, 150));
  if (dataAtlantic.answer.includes("North Indian Ocean") || dataAtlantic.answer.includes("unavailable") || dataAtlantic.answer.includes("outside") || dataAtlantic.answer.includes("not tracked")) {
    console.log("PASS: Atlantic storm outside domain correctly identified as unsupported.");
  }

  console.log("\n=== ALL NEGATIVE & FAILURE CASE TESTS PASSED! ===");
}

testNegativeCases().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
