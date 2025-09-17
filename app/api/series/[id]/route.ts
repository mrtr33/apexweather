import { NextRequest, NextResponse } from 'next/server';
import { getSeriesById } from '@/app/lib/sampleData';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const seriesId = params.id;
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
