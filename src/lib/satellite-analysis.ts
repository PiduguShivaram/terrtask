import jpeg from 'jpeg-js';

export interface SatelliteImageAnalysisResult {
  date: string;
  satellite: string;
  instrument: string;
  product: string;
  dimensions: {
    width: number;
    height: number;
    totalPixels: number;
  };
  validDataCoveragePct: number;
  meanBrightness: number;
  denseCloudFractionPct: number;
  stormCenterPixel?: [number, number] | null;
  cloudCentroidGeo?: [number, number] | null;
  cloudCentroidOffsetKm?: number | null;
  rawProcessingDetails: {
    algorithm: string;
    sourceVariables: string[];
    formula: string;
    assumptions: string;
  };
  limitations: string;
  sourceUrl: string;
}

export interface TemporalSatelliteComparisonResult {
  date1: string;
  date2: string;
  satellite: string;
  instrument: string;
  dimensions: {
    width: number;
    height: number;
  };
  validPixelsCount: number;
  meanAbsoluteDifference: number;
  changedAreaPct: number;
  processing: string;
  limitations: string;
}

// In-memory cache for downloaded satellite images to avoid duplicate downloads
const imageCache = new Map<string, Buffer>();

// Standard Bay of Bengal bounding box for coastal cyclone analysis
const DEFAULT_BBOX: [number, number, number, number] = [80.0, 14.0, 92.0, 24.0];
const ANALYSIS_WIDTH = 450;
const ANALYSIS_HEIGHT = 300;

/**
 * Downloads and decodes a real NASA GIBS MODIS Terra satellite image.
 */
async function fetchAndDecodeGibsSnapshot(date: string, bbox = DEFAULT_BBOX): Promise<{
  buffer: Buffer;
  decoded: { data: Uint8Array; width: number; height: number };
  url: string;
} | null> {
  // Date format & mission operational timeline validation (MODIS Terra operations: 2000-02-24 to present)
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    console.warn(`Invalid satellite observation date format: "${date}"`);
    return null;
  }
  const year = parseInt(date.slice(0, 4), 10);
  if (year < 2000 || year > new Date().getUTCFullYear()) {
    console.warn(`Requested satellite date ${date} is outside NASA MODIS Terra operational mission lifetime (2000-present).`);
    return null;
  }

  const [minLon, minLat, maxLon, maxLat] = bbox;
  const url = `https://wvs.earthdata.nasa.gov/api/v1/snapshot?REQUEST=GetSnapshot&TIME=${date}&BBOX=${minLat},${minLon},${maxLat},${maxLon}&CRS=EPSG:4326&LAYERS=MODIS_Terra_CorrectedReflectance_TrueColor,Coastlines_15m&WRAP=day,none&FORMAT=image/jpeg&WIDTH=${ANALYSIS_WIDTH}&HEIGHT=${ANALYSIS_HEIGHT}`;

  const cacheKey = `${date}_${bbox.join('_')}`;
  let buffer = imageCache.get(cacheKey);

  if (!buffer) {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.warn(`NASA GIBS snapshot error (${res.status}) for date ${date}`);
        return null;
      }

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('image/jpeg')) {
        console.warn(`Unexpected content type from NASA GIBS: ${contentType}`);
        return null;
      }

      const arrayBuffer = await res.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);

      // Validation: Check minimum byte size
      if (buffer.length < 1000) {
        console.warn(`Buffer too small to be a valid satellite tile (${buffer.length} bytes)`);
        return null;
      }

      imageCache.set(cacheKey, buffer);
    } catch (err) {
      console.error(`Failed to retrieve NASA GIBS satellite image for ${date}:`, err);
      return null;
    }
  }

  try {
    const decoded = jpeg.decode(buffer, { useTArray: true });
    if (!decoded || decoded.width !== ANALYSIS_WIDTH || decoded.height !== ANALYSIS_HEIGHT) {
      console.warn(`Decoded satellite image dimension mismatch: expected ${ANALYSIS_WIDTH}x${ANALYSIS_HEIGHT}, got ${decoded?.width}x${decoded?.height}`);
      return null;
    }
    return { buffer, decoded, url };
  } catch (err) {
    console.error(`JPEG decoding failed for ${date}:`, err);
    return null;
  }
}

/**
 * Analyzes real pixel data from a NASA GIBS MODIS Terra observation.
 */
export async function analyzeSatelliteImage(
  date: string,
  stormLat?: number,
  stormLon?: number,
  bbox = DEFAULT_BBOX
): Promise<SatelliteImageAnalysisResult | null> {
  const result = await fetchAndDecodeGibsSnapshot(date, bbox);
  if (!result) return null;

  const { decoded, url } = result;
  const { data, width: imgW, height: imgH } = decoded;
  const totalPixels = imgW * imgH;

  const [minLon, minLat, maxLon, maxLat] = bbox;

  let totalR = 0, totalG = 0, totalB = 0, totalLum = 0;
  let validPixels = 0;
  let highReflectanceCloudPixels = 0; // High-albedo cloud proxy

  let sumWeightedX = 0, sumWeightedY = 0, sumCloudWeight = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Exclude black borders (swath boundaries or missing data)
    if (r > 5 || g > 5 || b > 5) {
      validPixels++;
      totalR += r;
      totalG += g;
      totalB += b;
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      totalLum += lum;

      // Optical cloud threshold: high-albedo clouds appear as bright white (lum > 180)
      if (lum > 180) {
        highReflectanceCloudPixels++;
        const pixelIdx = i / 4;
        const px = pixelIdx % imgW;
        const py = Math.floor(pixelIdx / imgW);
        const weight = (lum - 180) / 75;
        sumWeightedX += px * weight;
        sumWeightedY += py * weight;
        sumCloudWeight += weight;
      }
    }
  }

  const validDataCoveragePct = Math.round((validPixels / totalPixels) * 1000) / 10;
  const meanBrightness = validPixels > 0 ? Math.round((totalLum / validPixels) * 10) / 10 : 0;
  const denseCloudFractionPct = validPixels > 0 ? Math.round((highReflectanceCloudPixels / validPixels) * 1000) / 10 : 0;

  // Storm Center Pixel Coordinates
  let stormCenterPixel: [number, number] | null = null;
  if (stormLat !== undefined && stormLon !== undefined) {
    const cx = Math.round(((stormLon - minLon) / (maxLon - minLon)) * imgW);
    const cy = Math.round(((maxLat - stormLat) / (maxLat - minLat)) * imgH);
    stormCenterPixel = [cx, cy];
  }

  // High-Albedo Cloud Centroid and Distance to Storm Center
  let cloudCentroidGeo: [number, number] | null = null;
  let cloudCentroidOffsetKm: number | null = null;

  if (sumCloudWeight > 0) {
    const centroidX = sumWeightedX / sumCloudWeight;
    const centroidY = sumWeightedY / sumCloudWeight;
    const centroidLon = minLon + (centroidX / imgW) * (maxLon - minLon);
    const centroidLat = maxLat - (centroidY / imgH) * (maxLat - minLat);
    cloudCentroidGeo = [
      Math.round(centroidLat * 100) / 100,
      Math.round(centroidLon * 100) / 100,
    ];

    if (stormLat !== undefined && stormLon !== undefined) {
      const dLat = ((centroidLat - stormLat) * Math.PI) / 180;
      const dLon = ((centroidLon - stormLon) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((stormLat * Math.PI) / 180) *
          Math.cos((centroidLat * Math.PI) / 180) *
          Math.sin(dLon / 2) ** 2;
      cloudCentroidOffsetKm = Math.round(6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
    }
  }

  return {
    date,
    satellite: 'Terra',
    instrument: 'MODIS',
    product: 'MODIS_Terra_CorrectedReflectance_TrueColor',
    dimensions: {
      width: imgW,
      height: imgH,
      totalPixels,
    },
    validDataCoveragePct,
    meanBrightness,
    denseCloudFractionPct,
    stormCenterPixel,
    cloudCentroidGeo,
    cloudCentroidOffsetKm,
    rawProcessingDetails: {
      algorithm: 'Pure JavaScript RGB pixel luminance analysis (0.299R + 0.587G + 0.114B) with high-albedo cloud threshold (> 180)',
      sourceVariables: ['Red', 'Green', 'Blue', 'IBTrACS Eye Coordinates'],
      formula: 'Luminance Y = 0.299R + 0.587G + 0.114B; Centroid = Σ(P_i · w_i) / Σ(w_i); Distance = Haversine(IBTrACS Eye, High-Albedo Centroid)',
      assumptions: 'This is a brightness-based visual proxy, not a validated cloud-top temperature, cloud-top height, or convection retrieval. The high-albedo cloud centroid is a mathematical brightness-derived location and is NOT the cyclone eye, the physical convective core, or a direct intensity estimate.',
    },
    limitations: 'Satellite-derived visual proxy only. This is a brightness-based visual proxy, not a validated cloud-top temperature, cloud-top height, or convection retrieval. Optical RGB reflectance does NOT measure kinetic wind speed or barometric pressure.',
    sourceUrl: url,
  };
}

/**
 * Computes deterministic pixel-by-pixel temporal difference between two real satellite overpasses.
 */
export async function compareSatelliteImages(
  date1: string,
  date2: string,
  bbox = DEFAULT_BBOX
): Promise<TemporalSatelliteComparisonResult | null> {
  const [img1, img2] = await Promise.all([
    fetchAndDecodeGibsSnapshot(date1, bbox),
    fetchAndDecodeGibsSnapshot(date2, bbox),
  ]);

  if (!img1 || !img2) return null;

  const dec1 = img1.decoded;
  const dec2 = img2.decoded;

  if (dec1.width !== dec2.width || dec1.height !== dec2.height) {
    return null;
  }

  let totalDiff = 0;
  let significantChangePixels = 0;
  let validPixels = 0;

  for (let i = 0; i < dec1.data.length; i += 4) {
    const r1 = dec1.data[i], g1 = dec1.data[i + 1], b1 = dec1.data[i + 2];
    const r2 = dec2.data[i], g2 = dec2.data[i + 1], b2 = dec2.data[i + 2];

    const lum1 = 0.299 * r1 + 0.587 * g1 + 0.114 * b1;
    const lum2 = 0.299 * r2 + 0.587 * g2 + 0.114 * b2;

    const diff = Math.abs(lum2 - lum1);
    totalDiff += diff;
    if (diff > 50) significantChangePixels++;
    validPixels++;
  }

  const meanAbsoluteDifference = validPixels > 0 ? Math.round((totalDiff / validPixels) * 10) / 10 : 0;
  const changedAreaPct = validPixels > 0 ? Math.round((significantChangePixels / validPixels) * 1000) / 10 : 0;

  return {
    date1,
    date2,
    satellite: 'Terra',
    instrument: 'MODIS',
    dimensions: {
      width: dec1.width,
      height: dec1.height,
    },
    validPixelsCount: validPixels,
    meanAbsoluteDifference,
    changedAreaPct,
    processing: 'Deterministic pixel-by-pixel absolute luminance difference (|L₂ - L₁|) across identical bounding box coordinates: percentage of compared pixels whose luminance difference exceeded the configured threshold (|ΔL| > 50).',
    limitations: 'Optical pixel change: percentage of compared pixels whose luminance difference exceeded the configured threshold. This visual-change metric is not, by itself, evidence of cyclone intensification. Differences may reflect cloud evolution, illumination, viewing geometry, atmospheric conditions, or other scene changes.',
  };
}
