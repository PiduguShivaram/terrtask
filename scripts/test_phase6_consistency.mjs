// Phase 6 Data Consistency & Semantic Separation Test Suite
// Verifies internal consistency across Chennai/Vardah, Puri/Fani, IBTrACS vs ERA5, and units.

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

async function runConsistencyTests() {
  console.log("=== PHASE 6 CONSISTENCY & NUMERICAL REPRODUCIBILITY TEST SUITE ===\n");

  // 1. Chennai / Vardah Exact Consistency Test
  console.log("--- 1. Testing Chennai & Cyclone Vardah Numerical Consistency ---");
  const resChennai = await fetch(`${BASE_URL}/api/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: "Which cyclone came closest to Chennai?" })
  });

  if (!resChennai.ok) throw new Error(`Chennai query failed: ${resChennai.status}`);
  const dataChennai = await resChennai.json();

  console.log("Target storm:", dataChennai.storm?.name);
  if (dataChennai.storm?.name !== "VARDAH") {
    throw new Error(`Expected Vardah as closest to Chennai, got ${dataChennai.storm?.name}`);
  }

  const directAnswerChennai = dataChennai.decisionAnswer?.directAnswer || "";
  console.log("Direct Answer snippet:", directAnswerChennai.slice(0, 160));

  // Verify distance is strictly 13.4 km everywhere (no 13.7 km discrepancy)
  if (!directAnswerChennai.includes("13.4 km")) {
    throw new Error(`Expected direct answer to report 13.4 km, got: ${directAnswerChennai}`);
  }
  if (directAnswerChennai.includes("13.7 km")) {
    throw new Error(`DISCREPANCY DETECTED: 13.7 km found in direct answer! Must be 13.4 km.`);
  }

  const vardahEvidence = dataChennai.evidence.find(e => e.id === "ev-closest-storm");
  if (!vardahEvidence) throw new Error("Missing ev-closest-storm evidence item");
  if (vardahEvidence.rawValue !== "13.4 km") {
    throw new Error(`Evidence rawValue expected 13.4 km, got ${vardahEvidence.rawValue}`);
  }
  console.log("Closest distance confirmed: exactly 13.4 km (Haversine from 13.0827°N, 80.2707°E to 13.2°N, 80.3°E)");

  // Verify Vardah observed intensity at closest fix
  const vardahWind = dataChennai.evidence.find(e => e.id === "ev-wind-intensity");
  const vardahPres = dataChennai.evidence.find(e => e.id === "ev-pressure");
  console.log(`Vardah closest fix intensity: Wind = ${vardahWind?.rawValue} kt, Pressure = ${vardahPres?.rawValue} hPa`);
  if (vardahWind?.rawValue !== 60) throw new Error(`Expected Vardah wind 60 kt, got ${vardahWind?.rawValue}`);
  if (vardahPres?.rawValue !== 975) throw new Error(`Expected Vardah pressure 975 hPa, got ${vardahPres?.rawValue}`);
  console.log("PASS: Chennai & Cyclone Vardah numerical consistency verified!\n");

  // 2. Puri / Fani Exact Consistency Test
  console.log("--- 2. Testing Puri & Cyclone Fani Numerical Consistency ---");
  const resPuri = await fetch(`${BASE_URL}/api/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: "How strong was Fani near Puri?" })
  });

  if (!resPuri.ok) throw new Error(`Puri query failed: ${resPuri.status}`);
  const dataPuri = await resPuri.json();

  if (dataPuri.storm?.name !== "FANI") {
    throw new Error(`Expected Fani, got ${dataPuri.storm?.name}`);
  }

  const directAnswerPuri = dataPuri.decisionAnswer?.directAnswer || "";
  console.log("Direct Answer snippet:", directAnswerPuri.slice(0, 160));
  if (!directAnswerPuri.includes("100 kt") || !directAnswerPuri.includes("952 hPa")) {
    throw new Error(`Expected 100 kt and 952 hPa in direct answer`);
  }

  const faniWind = dataPuri.evidence.find(e => e.id === "ev-wind-intensity");
  const faniPres = dataPuri.evidence.find(e => e.id === "ev-pressure");
  if (faniWind?.rawValue !== 100 || faniPres?.rawValue !== 952) {
    throw new Error(`Expected 100 kt and 952 hPa in evidence items`);
  }
  console.log("Puri/Fani intensity verified: 100 kt (~185 km/h) sustained wind, 952 hPa central pressure");
  console.log("PASS: Puri & Cyclone Fani numerical consistency verified!\n");

  // 3. IBTrACS vs ERA5 Semantic Separation Test
  console.log("--- 3. Testing IBTrACS vs ERA5 Semantic Separation ---");
  const resEvidence = await fetch(`${BASE_URL}/api/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: "What evidence supports Fani's intensity?" })
  });

  const dataEvidence = await resEvidence.json();
  const obsPressure = dataEvidence.evidence.find(e => e.id === "ev-pressure");
  const era5Item = dataEvidence.evidence.find(e => e.id === "ev-era5-reanalysis");

  if (!obsPressure || obsPressure.category !== "Observed") {
    throw new Error("FAIL: IBTrACS pressure must be classified strictly as 'Observed'");
  }
  if (!era5Item || era5Item.category !== "Model-based") {
    throw new Error("FAIL: ERA5 must be classified strictly as 'Model-based'");
  }

  console.log(`Observed Pressure [${obsPressure.category}]: ${obsPressure.displayValue} (Source: ${obsPressure.source})`);
  console.log(`Model-based ERA5 [${era5Item.category}]: ${era5Item.displayValue} (Source: ${era5Item.source})`);

  if (era5Item.description.includes("direct station anemometer") && !era5Item.description.includes("not a direct")) {
    throw new Error("FAIL: ERA5 description must explicitly state it is not a direct station reading");
  }
  console.log("PASS: Semantic separation between IBTrACS (Observed) and ERA5 (Model-based) strictly maintained!\n");

  // 4. Unit Conversion & Precision Audit
  console.log("--- 4. Testing Unit Conversion & Format Consistency ---");
  if (!faniWind?.displayValue.includes("100 kt (185 km/h)")) {
    throw new Error(`Expected '100 kt (185 km/h)', got '${faniWind?.displayValue}'`);
  }
  if (!vardahWind?.displayValue.includes("60 kt (111 km/h)")) {
    throw new Error(`Expected '60 kt (111 km/h)', got '${vardahWind?.displayValue}'`);
  }
  console.log("Verified: 100 kt = 185 km/h (100 * 1.852 = 185.2 rounded)");
  console.log("Verified: 60 kt = 111 km/h (60 * 1.852 = 111.12 rounded)");
  console.log("PASS: Unit conversions are deterministic and retain original source values!\n");

  console.log(">>> ALL PHASE 6 CONSISTENCY & NUMERICAL REPRODUCIBILITY CHECKS PASSED!\n");
}

runConsistencyTests().catch(err => {
  console.error("CONSISTENCY TEST FAILED:", err);
  process.exit(1);
});
