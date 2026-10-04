import { HourlyMetric } from './types';

export interface OpenMeteoReanalysisResult {
  latitude: number;
  longitude: number;
  startDate: string;
  endDate: string;
  source: string;
  hourly: HourlyMetric[];
  peakWindKmh: number;
  peakWindTimestamp: string;
  minPressureHpa: number;
  minPressureTimestamp: string;
}

/**
 * Fetches real historical ERA5 reanalysis weather data from Open-Meteo.
 */
export async function fetchHistoricalReanalysis(
  lat: number,
  lon: number,
  startDate: string,
  endDate: string
): Promise<OpenMeteoReanalysisResult | null> {
  try {
    const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}&start_date=${startDate}&end_date=${endDate}&hourly=wind_speed_10m,wind_gusts_10m,surface_pressure,precipitation&timezone=UTC`;

    const res = await fetch(url, {
      next: { revalidate: 86400 }, // Cache reanalysis for 24 hours
    });

    if (!res.ok) {
      console.error(`Open-Meteo request failed: ${res.status} ${res.statusText}`);
      return null;
    }

    const data = await res.json();
    if (!data.hourly || !data.hourly.time) {
      return null;
    }

    const times: string[] = data.hourly.time;
    const winds: number[] = data.hourly.wind_speed_10m || [];
    const gusts: number[] = data.hourly.wind_gusts_10m || [];
    const pressures: number[] = data.hourly.surface_pressure || [];
    const precipitations: number[] = data.hourly.precipitation || [];

    const hourly: HourlyMetric[] = times.map((t, i) => ({
      time: t,
      windSpeedKmh: winds[i] ?? 0,
      windGustsKmh: gusts[i] ?? undefined,
      surfacePressureHpa: pressures[i] ?? 0,
      precipitationMm: precipitations[i] ?? undefined,
    }));

    // Find peak wind
    let peakWind = -Infinity;
    let peakWindTime = '';
    winds.forEach((w, i) => {
      if (w !== null && w > peakWind) {
        peakWind = w;
        peakWindTime = times[i];
      }
    });

    // Find minimum pressure
    let minPres = Infinity;
    let minPresTime = '';
    pressures.forEach((p, i) => {
      if (p !== null && p > 0 && p < minPres) {
        minPres = p;
        minPresTime = times[i];
      }
    });

    return {
      latitude: lat,
      longitude: lon,
      startDate,
      endDate,
      source: 'ECMWF ERA5 Reanalysis via Open-Meteo',
      hourly,
      peakWindKmh: Math.round(peakWind * 10) / 10,
      peakWindTimestamp: peakWindTime,
      minPressureHpa: Math.round(minPres * 10) / 10,
      minPressureTimestamp: minPresTime,
    };
  } catch (error) {
    console.error('Error fetching Open-Meteo reanalysis:', error);
    return null;
  }
}
