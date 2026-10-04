import { NextRequest, NextResponse } from 'next/server';
import { GIBS_LAYERS } from '@/lib/gibs';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const layer = searchParams.get('layer') || 'MODIS_TERRA_TRUE_COLOR';
  const date = searchParams.get('date') || '2019-05-03';
  const minLon = parseFloat(searchParams.get('minLon') || '80');
  const minLat = parseFloat(searchParams.get('minLat') || '15');
  const maxLon = parseFloat(searchParams.get('maxLon') || '92');
  const maxLat = parseFloat(searchParams.get('maxLat') || '23');

  const gibsConfig = GIBS_LAYERS[layer] || GIBS_LAYERS.MODIS_TERRA_TRUE_COLOR;
  const snapshotUrl = gibsConfig.getSnapshotUrl(date, [minLon, minLat, maxLon, maxLat], 900, 600);

  return NextResponse.json({
    layer: gibsConfig.name,
    date,
    bounds: [minLon, minLat, maxLon, maxLat],
    snapshotUrl,
    attribution: gibsConfig.attribution,
    tileTemplate: gibsConfig.tileUrlTemplate(date),
  });
}
