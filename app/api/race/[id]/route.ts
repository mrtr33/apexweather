import { NextRequest, NextResponse } from 'next/server';
import { getRaceById, updateRaceWeather } from '@/app/lib/raceService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const raceId = resolvedParams.id;
    const race = getRaceById(raceId);
    
    if (!race) {
      return NextResponse.json(
        { error: 'Race not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(race);
  } catch (error) {
    console.error('Error fetching race data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const raceId = resolvedParams.id;
    
    // Check if race exists
    const existingRace = getRaceById(raceId);
    if (!existingRace) {
      return NextResponse.json(
        { error: 'Race not found' },
        { status: 404 }
      );
    }
    
    // Update the race weather
    const updatedRace = await updateRaceWeather(raceId);
    
    if (!updatedRace) {
      return NextResponse.json(
        { error: 'Failed to update race weather' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(updatedRace);
  } catch (error) {
    console.error('Error updating race data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 