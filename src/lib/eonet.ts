export interface EonetStormGeometry {
  magnitudeValue?: number;
  magnitudeUnit?: string;
  date: string;
  type: string;
  coordinates: [number, number]; // [lon, lat]
}

export interface EonetStormEvent {
  id: string;
  title: string;
  description?: string;
  link: string;
  categories: { id: string; title: string }[];
  sources: { id: string; url: string }[];
  geometry: EonetStormGeometry[];
}

/**
 * Fetches real active or recent severe storms from NASA Earth Observatory Natural Event Tracker (EONET).
 */
export async function fetchLiveEonetSevereStorms(): Promise<EonetStormEvent[]> {
  try {
    const res = await fetch('https://eonet.gsfc.nasa.gov/api/v3/events?category=severeStorms&limit=25', {
      next: { revalidate: 3600 },
    });
    if (!res.ok) {
      console.warn(`NASA EONET responded with ${res.status}`);
      return [];
    }
    const data = await res.json();
    return data.events || [];
  } catch (err) {
    console.error('Failed to fetch NASA EONET storms:', err);
    return [];
  }
}
