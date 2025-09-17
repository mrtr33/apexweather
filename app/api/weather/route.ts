import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT_RESET_INTERVAL = 60 * 1000; // 1 minute
const RATE_LIMIT = 5; // 5 requests per minute

// Regularly clean up expired rate limit entries to prevent memory leaks
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of rateLimitMap.entries()) {
      if (now - data.lastReset > RATE_LIMIT_RESET_INTERVAL * 2) {
        rateLimitMap.delete(ip);
      }
    }
  }, RATE_LIMIT_RESET_INTERVAL * 10); // Clean up every 10 minutes
}

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

// Input validation function
function validateCoordinates(lat: string | null, lng: string | null): { valid: boolean; sanitizedLat?: number; sanitizedLng?: number; error?: string } {
  if (!lat || !lng) {
    return { valid: false, error: 'Missing required parameters: lat and lng are required' };
  }

  const parsedLat = parseFloat(lat);
  const parsedLng = parseFloat(lng);

  if (isNaN(parsedLat) || isNaN(parsedLng)) {
    return { valid: false, error: 'Invalid coordinates: lat and lng must be valid numbers' };
  }

  // Validate coordinate ranges
  if (parsedLat < -90 || parsedLat > 90) {
    return { valid: false, error: 'Invalid latitude: must be between -90 and 90' };
  }

  if (parsedLng < -180 || parsedLng > 180) {
    return { valid: false, error: 'Invalid longitude: must be between -180 and 180' };
  }

  // Sanitize by limiting decimal precision
  const sanitizedLat = parseFloat(parsedLat.toFixed(6));
  const sanitizedLng = parseFloat(parsedLng.toFixed(6));

  return { valid: true, sanitizedLat, sanitizedLng };
}

export async function GET(request: NextRequest) {
  try {
    // Get parameters from query
    const searchParams = request.nextUrl.searchParams;
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');

    // Validate and sanitize coordinates
    const validation = validateCoordinates(lat, lng);
    if (!validation.valid) {
      console.error(validation.error);
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Apply rate limiting - use client IP plus a fingerprint of the request
    const requestFingerprint = `${validation.sanitizedLat}-${validation.sanitizedLng}`;
    const ip = (request.headers.get('x-forwarded-for') || 'unknown') + `-${requestFingerprint}`;
    
    if (!checkRateLimit(ip)) {
      console.error(`Rate limit exceeded for IP: ${ip}`);
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { 
          status: 429,
          headers: {
            'Retry-After': '60',
            'X-RateLimit-Limit': RATE_LIMIT.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': (Math.floor(Date.now() / 1000) + 60).toString()
          }
        }
      );
    }

    // Check API key
    const apiKey = process.env.OPENWEATHERMAP_API_KEY;
    if (!apiKey) {
      console.error('OpenWeatherMap API key not configured in environment variables');
      return NextResponse.json(
        { error: 'Weather API configuration error. Please contact support.' },
        { status: 500 }
      );
    }

    // Build OpenWeatherMap API URL using URL object for proper encoding
    const url = new URL('https://api.openweathermap.org/data/3.0/onecall');
    url.searchParams.append('lat', validation.sanitizedLat!.toString());
    url.searchParams.append('lon', validation.sanitizedLng!.toString());
    url.searchParams.append('appid', apiKey);
    url.searchParams.append('units', 'metric');
    url.searchParams.append('exclude', 'minutely,daily,alerts');
    
    // Set cache options
    const cacheOptions = {
      next: { revalidate: 300 }, // Cache for 5 minutes
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
      }
    };

    console.log(`Fetching weather data for coordinates: ${validation.sanitizedLat},${validation.sanitizedLng}`);
    
    // Fetch data from OpenWeatherMap with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    try {
      const response = await fetch(url.toString(), { 
        signal: controller.signal,
        ...cacheOptions 
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        let errorMessage = `Weather API error: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
          console.error(errorMessage, errorData);
        } catch (e) {
          // If we can't parse the JSON, just use the status text
          console.error(`OpenWeatherMap API error: ${response.status} ${response.statusText}`);
        }
        
        return NextResponse.json(
          { error: `Weather data unavailable: ${response.statusText}` },
          { status: response.status }
        );
      }
      
      const data = await response.json();
      console.log('Successfully fetched weather data');
      
      // Return the data with caching headers
      return NextResponse.json(data, {
        headers: {
          'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
          'Expires': new Date(Date.now() + 300 * 1000).toUTCString(),
        },
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error('Weather API request timed out');
        return NextResponse.json(
          { error: 'Weather data request timed out' },
          { status: 504 }
        );
      }
      throw fetchError; // Re-throw to be caught by outer catch
    }
  } catch (error) {
    console.error('Error fetching weather data:', error);
    return NextResponse.json(
      { error: 'Internal server error fetching weather data' },
      { status: 500 }
    );
  }
} 