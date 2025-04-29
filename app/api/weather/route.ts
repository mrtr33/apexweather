import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT_RESET_INTERVAL = 60 * 1000; // 1 minute
const RATE_LIMIT = 5; // 5 requests per minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const rateData = rateLimitMap.get(ip) || { count: 0, lastReset: now };

  // Reset counter if it's been more than the reset interval
  if (now - rateData.lastReset > RATE_LIMIT_RESET_INTERVAL) {
    rateData.count = 1;
    rateData.lastReset = now;
  } else {
    rateData.count += 1;
  }

  rateLimitMap.set(ip, rateData);
  return rateData.count <= RATE_LIMIT;
}

export async function GET(request: NextRequest) {
  try {
    // Get parameters from query
    const searchParams = request.nextUrl.searchParams;
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');

    // Validate parameters
    if (!lat || !lng) {
      console.error('Missing required parameters: lat and lng are required');
      return NextResponse.json(
        { error: 'Missing required parameters: lat and lng are required' },
        { status: 400 }
      );
    }

    // Apply rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(ip)) {
      console.error(`Rate limit exceeded for IP: ${ip}`);
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    // Check API key
    const apiKey = process.env.OPENWEATHERMAP_API_KEY;
    if (!apiKey) {
      console.error('OpenWeatherMap API key not configured in environment variables');
      return NextResponse.json(
        { error: 'Weather API configuration error. Please check server logs.' },
        { status: 500 }
      );
    }

    // Build OpenWeatherMap API URL
    const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric&exclude=minutely,daily,alerts`;
    
    console.log(`Fetching weather data for coordinates: ${lat},${lng}`);
    
    // Fetch data from OpenWeatherMap
    const response = await fetch(url, { next: { revalidate: 300 } }); // Cache for 5 minutes
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenWeatherMap API error: ${response.status} ${response.statusText}`, errorText);
      return NextResponse.json(
        { error: `Weather data fetch failed: ${response.statusText}` },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    console.log('Successfully fetched weather data');
    
    // Return the data
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Error fetching weather data:', error);
    return NextResponse.json(
      { error: 'Internal server error fetching weather data' },
      { status: 500 }
    );
  }
} 