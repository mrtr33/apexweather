/**
 * Server-side proxy for OpenWeatherMap cloud map tiles
 * This prevents exposing the API key to clients
 */
export async function GET(
  request: Request
) {
  try {
    // Parse z, x, y directly from the URL path
    const url = new URL(request.url);
    const path = url.pathname;
    const segments = path.split('/').filter(Boolean);
    
    // The last three segments should be z, x, y - we can safely get them from the path
    // Format: /api/map/clouds/{z}/{x}/{y}
    const zRaw = segments[segments.length - 3];
    const xRaw = segments[segments.length - 2];
    const yRaw = segments[segments.length - 1];
    
    if (!zRaw || !xRaw || !yRaw) {
      console.error('Missing map parameters:', { z, x, y, path });
      return new Response('Invalid map parameters', { status: 400 });
    }
    
    // Validate strictly numeric and within tile coordinate bounds
    const isDigits = (s: string) => /^[0-9]+$/.test(s);
    if (!isDigits(zRaw) || !isDigits(xRaw) || !isDigits(yRaw)) {
      return new Response('Invalid map parameters', { status: 400 });
    }
    
    const z = Number(zRaw);
    const x = Number(xRaw);
    const y = Number(yRaw);
    
    // Reasonable zoom range for OpenWeather tiles
    if (z < 0 || z > 18) {
      return new Response('Zoom out of range', { status: 400 });
    }
    const maxIndex = Math.pow(2, z) - 1;
    if (x < 0 || y < 0 || x > maxIndex || y > maxIndex) {
      return new Response('Tile coordinates out of range', { status: 400 });
    }
    
    // Log request for debugging
    console.log(`Cloud tile request: z=${z}, x=${x}, y=${y}`);
    
    // Get API key from server environment
    const API_KEY = process.env.OPENWEATHERMAP_API_KEY;
    
    if (!API_KEY) {
      console.error('API key not configured');
      return new Response('Server configuration error', { status: 500 });
    }
    
    // Proxy the request to OpenWeatherMap
    const response = await fetch(
      `https://tile.openweathermap.org/map/clouds_new/${z}/${x}/${y}.png?appid=${API_KEY}`,
      {
        headers: {
          'Accept': 'image/png',
          'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
        }
      }
    );
    
    if (!response.ok) {
      console.error('Map tile API error:', response.status);
      return new Response('Failed to fetch map tile', { status: response.status });
    }
    
    // Get the image data
    const imageData = await response.arrayBuffer();
    
    // Return the image with appropriate headers
    return new Response(imageData, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
      }
    });
    
  } catch (error) {
    console.error('Error in map tile proxy:', error);
    return new Response('Internal server error', { status: 500 });
  }
} 