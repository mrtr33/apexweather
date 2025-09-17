import { NextRequest, NextResponse } from 'next/server';
import { getSeriesById } from '@/app/lib/sampleData';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // In the new Next.js version, params is a Promise, so we await it
    const resolvedParams = await params;
    const seriesId = resolvedParams.id;
    const series = getSeriesById(seriesId);
    
    if (!series) {
      return NextResponse.json(
        { error: 'Series not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(series);
  } catch (error) {
    console.error('Error fetching series data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
