/**
 * Server-side proxy for RainViewer precipitation map tiles
 * This provides a consistent API interface and enables caching
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
    // Format: /api/map/precipitation/{z}/{x}/{y}
    const z = segments[segments.length - 3];
    const x = segments[segments.length - 2];
    const y = segments[segments.length - 1];
    
    if (!z || !x || !y) {
      console.error('Missing map parameters:', { z, x, y, path });
      return new Response('Invalid map parameters', { status: 400 });
    }
    
    // Log request for debugging
    console.log(`Precipitation tile request: z=${z}, x=${x}, y=${y}`);
    
    // The RainViewer API doesn't require an API key, but we still proxy it for consistency
    // and to allow for future authentication if needed
    const response = await fetch(
      `https://tilecache.rainviewer.com/v2/radar/latest/256/${z}/${x}/${y}/8/1_1.png`,
      {
        headers: {
          'Accept': 'image/png',
          'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
        }
      }
    );
    
    if (!response.ok) {
      console.error('Precipitation map tile API error:', response.status);
      return new Response('Failed to fetch precipitation map tile', { status: response.status });
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
    console.error('Error in precipitation map tile proxy:', error);
    return new Response('Internal server error', { status: 500 });
  }
} 