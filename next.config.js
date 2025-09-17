/** @type {import('next').NextConfig} */
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; media-src 'self' data:; img-src 'self'  data: https://*.openweathermap.org http://*.openweathermap.org https://openweathermap.org http://openweathermap.org https://*.storage.ko-fi.com http://*.storage.ko-fi.com https://storage.ko-fi.com http://storage.ko-fi.com https://*.basemaps.cartocdn.com http://*.basemaps.cartocdn.com https://*.tile.openstreetmap.org http://*.tile.openstreetmap.org https://*.arcgisonline.com http://*.arcgisonline.com https://*.stamen-tiles.a.ssl.fastly.net http://*.stamen-tiles.a.ssl.fastly.net https://*.a.ssl.fastly.net http://*.a.ssl.fastly.net https://*.tiles.mapbox.com http://*.tiles.mapbox.com https://*.rainviewer.com http://*.rainviewer.com; connect-src 'self' https://*.openweathermap.org http://*.openweathermap.org https://*.rainviewer.com http://*.rainviewer.com; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.cloudflareinsights.com; style-src 'self' 'unsafe-inline'; worker-src 'self' blob:;"
  },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' }
];

const nextConfig = {
  eslint: {
    // Disable ESLint during production builds
    ignoreDuringBuilds: true,
  },
  // Add standalone output for optimized production deployment
  output: 'standalone',
  images: {
    domains: ['openweathermap.org', 'storage.ko-fi.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.basemaps.cartocdn.com',
      },
      {
        protocol: 'https',
        hostname: '*.tile.openstreetmap.org',
      },
      {
        protocol: 'https',
        hostname: '*.arcgisonline.com',
      },
      {
        protocol: 'https',
        hostname: '*.stamen-tiles.a.ssl.fastly.net',
      },
      {
        protocol: 'https',
        hostname: '*.a.ssl.fastly.net',
      },
      {
        protocol: 'https',
        hostname: '*.tiles.mapbox.com',
      },
      {
        protocol: 'https',
        hostname: '*.rainviewer.com',
      },
      {
        protocol: 'https',
        hostname: 'openweathermap.org',
      },
      {
        protocol: 'https',
        hostname: 'storage.ko-fi.com',
      }
    ]
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
  // Add compression for faster load times
  compress: true,
  // Add strict mode for better error catching
  reactStrictMode: true,
  // Add productivity optimization
  productionBrowserSourceMaps: false,
};

module.exports = nextConfig; 