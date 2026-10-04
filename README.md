# TerraTask — Observational Cyclone & Geospatial Intelligence

> **TerraTask turns real satellite and geospatial evidence into explainable answers.**

TerraTask is a climate and geospatial intelligence system designed for coastal hazard verification, historical tropical cyclone audits, and multi-sensor observational evidence synthesis across the North Indian Ocean basin.

---

## Core Product Architecture

```
QUESTION
   ↓
REAL EARTH DATA (NOAA IBTrACS + NASA GIBS + ECMWF ERA5)
   ↓
STRUCTURED EVIDENCE (Observed | Derived | Model-based | Interpretation)
   ↓
DETERMINISTIC ANALYSIS (Haversine Distance + Pixel Decoding + Albedo Calculations)
   ↓
EXPLANATION (Natural-Language Decision Answer Layer)
   ↓
LIMITATIONS & PROVENANCE
```

---

## Authoritative Data Hierarchy

1. **NOAA NCEI IBTrACS v04r01** (`Observed`)
   - Official tropical cyclone best-track positions, coordinates, timestamps, WMO sustained wind speeds, central barometric pressures, and quadrant gale radii.
   - Authoritative source of storm identity and intensity.

2. **NASA EOSDIS GIBS MODIS Terra** (`Derived`)
   - Daily True Color Corrected Reflectance imagery at 450×300 resolution (135,000 decoded pixels).
   - Optical luminance analysis, high-albedo cloud proxy fraction, mathematical brightness centroid, and deterministic multi-temporal pixel change across overpasses.

3. **ECMWF ERA5 Reanalysis** (`Model-based`)
   - Contextual hourly atmospheric surface pressure and wind fields on a 0.25° grid (~28 km cell size).
   - Classified strictly as model-based reanalysis; never presented as in-situ peak eyewall intensity or official cyclone central pressure.

---

## Scientific Scope & Guardrails

- **Zero Synthetic Data**: Every displayed observation originates from authoritative scientific archives. If data is unavailable, TerraTask states that truthfully.
- **No Forward Forecasting**: TerraTask does not run forward numerical weather prediction (NWP) simulations or generate speculative forecast track cones.
- **No Structural Damage Prediction**: TerraTask does not fabricate building destruction, casualties, or financial losses without cadastral asset inventories.
- **Sensor Limitations Acknowledged**: Optical RGB reflectance imagery captures cloud albedo and visual morphology; it does NOT measure kinetic wind vectors or barometric central pressure.

---

## Verification & Testing

Run all automated test suites:

```bash
# Data audits & consistency
node scripts/test_phase6_dataset_audit.mjs
node scripts/test_phase6_consistency.mjs
node scripts/test_phase6_cache.mjs
node scripts/test_phase6_failures.mjs

# Phase 7 hardening suites
node scripts/test_phase7_branding.mjs
node scripts/test_phase7_scientific_language.mjs
node scripts/test_phase7_cache_replay.mjs
node scripts/test_phase7_numeric_assertions.mjs
node scripts/test_phase7_api_ui_consistency.mjs
```
