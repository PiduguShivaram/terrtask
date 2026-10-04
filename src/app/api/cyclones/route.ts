import { NextRequest, NextResponse } from 'next/server';
import { getAllStorms, findStormByNameOrSid } from '@/lib/ibtracs';
import { fetchLiveEonetSevereStorms } from '@/lib/eonet';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const stormQuery = searchParams.get('storm');
    const includeLive = searchParams.get('live') === 'true';

    if (stormQuery) {
      const storm = findStormByNameOrSid(stormQuery);
      if (!storm) {
        return NextResponse.json(
          { error: `Cyclone "${stormQuery}" not found in modern NOAA archive.` },
          { status: 404 }
        );
      }
      return NextResponse.json({ storm });
    }

    const storms = getAllStorms();
    let liveStorms: any[] = [];
    if (includeLive) {
      liveStorms = await fetchLiveEonetSevereStorms();
    }

    // Return list of storms with essential summary metadata
    const summary = storms.map(s => ({
      sid: s.sid,
      season: s.season,
      name: s.name,
      subbasin: s.subbasin,
      peakWindKts: s.peakWindKts,
      minPressureHpa: s.minPressureHpa,
      startDate: s.startDate,
      endDate: s.endDate,
      pointsCount: s.track.length,
      hasLandfall: !!s.landfallPoint,
    }));

    return NextResponse.json({
      totalCount: storms.length,
      basin: 'North Indian Ocean (Bay of Bengal & Arabian Sea)',
      provider: 'NOAA NCEI IBTrACS v04r01',
      storms: summary,
      liveEonetStorms: liveStorms,
    });
  } catch (error) {
    console.error('API cyclones error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve cyclone dataset.' },
      { status: 500 }
    );
  }
}
