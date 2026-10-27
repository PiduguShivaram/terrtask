# TerraTask — Observational Cyclone & Geospatial Intelligence

TerraTask explores evidence-grounded answers about historical tropical cyclones using official best-track records, satellite imagery, and atmospheric reanalysis.

## Data sources and interpretation

- **NOAA NCEI IBTrACS:** cyclone best-track records.
- **NASA GIBS MODIS Terra:** optical imagery and derived image metrics.
- **ECMWF ERA5:** model-based reanalysis, clearly distinguished from direct observations.

The project documents guardrails against presenting optical imagery as a direct wind measurement, unsupported damage estimates, or forecasts the system does not produce.

## Run locally

Requires Node.js and pnpm, based on the checked-in package metadata and lockfile.

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Validation

The repository contains data-audit and scientific-language scripts under `scripts/`. Run the project's documented scripts individually to validate local data and analysis behavior. No test pass or live deployment is claimed by this README.

## Repository

Browse the source code and scripts in this repository. This project is a prototype; read the source and limitations before relying on any generated interpretation.
