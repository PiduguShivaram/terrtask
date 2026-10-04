import { NextRequest, NextResponse } from 'next/server';
import { processTerraAskQuery } from '@/lib/ai-pipeline';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const query = body?.query;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'A natural language query string is required.' },
        { status: 400 }
      );
    }

    const result = await processTerraAskQuery(query.trim());
    return NextResponse.json(result);
  } catch (error) {
    console.error('API query processing error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process climate query with Earth-observation pipeline.',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
