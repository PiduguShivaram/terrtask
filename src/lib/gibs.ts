export interface GibsLayerConfig {
  id: string;
  name: string;
  description: string;
  satellite: string;
  instrument: string;
  tileUrlTemplate: (date: string) => string;
  getSnapshotUrl: (date: string, bbox: [number, number, number, number], width?: number, height?: number) => string;
  attribution: string;
}

export const GIBS_LAYERS: Record<string, GibsLayerConfig> = {
  MODIS_TERRA_TRUE_COLOR: {
    id: 'MODIS_Terra_CorrectedReflectance_TrueColor',
    name: 'NASA MODIS Terra (True Color)',
    description: 'Direct corrected reflectance from MODIS instrument aboard NASA Terra satellite (morning overpass ~10:30 AM local time).',
    satellite: 'Terra',
    instrument: 'MODIS',
    tileUrlTemplate: (date: string) =>
      `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/${date}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`,
    getSnapshotUrl: (date: string, bbox: [number, number, number, number], width = 800, height = 600) => {
      // bbox: [minLon, minLat, maxLon, maxLat] in EPSG:4326
      const [minLon, minLat, maxLon, maxLat] = bbox;
      return `https://wvs.earthdata.nasa.gov/api/v1/snapshot?REQUEST=GetSnapshot&TIME=${date}&BBOX=${minLat},${minLon},${maxLat},${maxLon}&CRS=EPSG:4326&LAYERS=MODIS_Terra_CorrectedReflectance_TrueColor,Coastlines_15m&WRAP=day,none&FORMAT=image/jpeg&WIDTH=${width}&HEIGHT=${height}`;
    },
    attribution: 'NASA EOSDIS Global Imagery Browse Services (GIBS)',
  },
  MODIS_AQUA_TRUE_COLOR: {
    id: 'MODIS_Aqua_CorrectedReflectance_TrueColor',
    name: 'NASA MODIS Aqua (True Color)',
    description: 'Direct corrected reflectance from MODIS instrument aboard NASA Aqua satellite (afternoon overpass ~1:30 PM local time).',
    satellite: 'Aqua',
    instrument: 'MODIS',
    tileUrlTemplate: (date: string) =>
      `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Aqua_CorrectedReflectance_TrueColor/default/${date}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`,
    getSnapshotUrl: (date: string, bbox: [number, number, number, number], width = 800, height = 600) => {
      const [minLon, minLat, maxLon, maxLat] = bbox;
      return `https://wvs.earthdata.nasa.gov/api/v1/snapshot?REQUEST=GetSnapshot&TIME=${date}&BBOX=${minLat},${minLon},${maxLat},${maxLon}&CRS=EPSG:4326&LAYERS=MODIS_Aqua_CorrectedReflectance_TrueColor,Coastlines_15m&WRAP=day,none&FORMAT=image/jpeg&WIDTH=${width}&HEIGHT=${height}`;
    },
    attribution: 'NASA EOSDIS Global Imagery Browse Services (GIBS)',
  },
  VIIRS_SNPP_TRUE_COLOR: {
    id: 'VIIRS_SNPP_CorrectedReflectance_TrueColor',
    name: 'NASA/NOAA Suomi NPP VIIRS (True Color)',
    description: 'Visible Infrared Imaging Radiometer Suite (VIIRS) Day/Night band and true color imagery from Suomi NPP.',
    satellite: 'Suomi NPP',
    instrument: 'VIIRS',
    tileUrlTemplate: (date: string) =>
      `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_SNPP_CorrectedReflectance_TrueColor/default/${date}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`,
    getSnapshotUrl: (date: string, bbox: [number, number, number, number], width = 800, height = 600) => {
      const [minLon, minLat, maxLon, maxLat] = bbox;
      return `https://wvs.earthdata.nasa.gov/api/v1/snapshot?REQUEST=GetSnapshot&TIME=${date}&BBOX=${minLat},${minLon},${maxLat},${maxLon}&CRS=EPSG:4326&LAYERS=VIIRS_SNPP_CorrectedReflectance_TrueColor,Coastlines_15m&WRAP=day,none&FORMAT=image/jpeg&WIDTH=${width}&HEIGHT=${height}`;
    },
    attribution: 'NASA EOSDIS GIBS / NOAA',
  },
};

/**
 * Extracts YYYY-MM-DD from an ISO timestamp.
 */
export function extractDateString(isoTime: string): string {
  const parts = isoTime.split('T')[0].split(' ')[0];
  return parts;
}
