import { NextResponse } from 'next/server';
import { getSeriesById } from '@/app/lib/sampleData';

export async function GET(
  request: Request
) {
  try {
    const url = new URL(request.url);
    const segments = url.pathname.split('/').filter(Boolean);
    const seriesId = segments[segments.length - 1];
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
