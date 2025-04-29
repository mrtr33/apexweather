'use client';

import { useState, useEffect, useMemo } from 'react';
import { WeatherData } from '../types';
import { FixedSizeList as List } from 'react-window';
import { useDebounce } from 'use-debounce';

// Remove problematic imports until we install them
// import { FixedSizeList as List } from 'react-window';
// import { useDebounce } from 'use-debounce';

interface WeatherForecastProps {
  lat: number;
  lng: number;
  locationName: string;
  existingWeather?: WeatherData;
  darkMode?: boolean;
}

interface CurrentWeather {
  temp: number;
  humidity: number;
  wind_speed: number;
  pressure: number;
  weather: { description: string; icon: string; main: string }[];
  dt: number;
  feels_like?: number;
  uvi?: number;
  visibility?: number;
  clouds?: number;
  wind_deg?: number;
}

interface HourlyForecast {
  dt: number;
  temp: number;
  humidity: number;
  weather: { description: string; icon: string; main: string }[];
  pop: number; // Probability of precipitation
  rain?: { '1h': number }; // Add rain property
}

// Interface for HourlyRow props
interface HourlyRowProps {
  index: number;
  style: React.CSSProperties;
  data: {
    hours: HourlyForecast[];
    formatTime: (timestamp: number) => string;
    textTertiary: string;
    textPrimary: string;
  };
}

// Row component for virtualized list
const HourlyRow = ({ index, style, data }: HourlyRowProps) => {
  const hour = data.hours[index];
  return (
    <div style={style} className="flex flex-col items-center min-w-[70px] mx-3">
      <div className={`text-sm font-medium ${data.textTertiary}`}>
        {data.formatTime(hour.dt)}
      </div>
      <img 
        src={`https://openweathermap.org/img/wn/${hour.weather[0].icon}.png`} 
        alt={hour.weather[0].description} 
        className="w-12 h-12"
      />
      <div className={`text-sm font-semibold ${data.textPrimary}`}>
        {Math.round(hour.temp)}°
      </div>
      <div className="flex items-center">
        <svg className="w-3 h-3 text-blue-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path d="M13 7H7v6h6V7z" />
        </svg>
        <span className="text-xs text-blue-500">
          {Math.round(hour.pop * 100)}%
        </span>
      </div>
      {hour.rain && (
        <div className="text-xs text-blue-600">
          {hour.rain['1h'].toFixed(1)} mm
        </div>
      )}
    </div>
  );
};

// Removed problematic component implementations that were causing syntax errors

export default function WeatherForecast({ lat, lng, locationName, existingWeather, darkMode }: WeatherForecastProps) {
  const [current, setCurrent] = useState<CurrentWeather | null>(null);
  const [hourly, setHourly] = useState<HourlyForecast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const [viewportWidth, setViewportWidth] = useState(1000);
  
  // Set viewport width for virtualized list
  useEffect(() => {
    // Only run on client side
    if (typeof window !== 'undefined') {
      const handleResize = () => {
        setViewportWidth(window.innerWidth);
      };
      
      // Set initial size
      setViewportWidth(window.innerWidth);
      
      // Add event listener
      window.addEventListener('resize', handleResize);
      
      // Clean up
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  // Add localStorage caching
  const cacheKey = useMemo(() => 
    `weather-${lat}-${lng}`, 
    [lat, lng]
  );

  useEffect(() => {
    try {
      const cachedData = localStorage.getItem(cacheKey);
      if (cachedData) {
        const { current: cachedCurrent, hourly: cachedHourly, timestamp } = JSON.parse(cachedData);
        // Only use cache if it's less than 30 minutes old
        if (timestamp && Date.now() - timestamp < 30 * 60 * 1000) {
          setCurrent(cachedCurrent);
          setHourly(cachedHourly);
        }
      }
    } catch (e) {
      console.error('Error reading from cache:', e);
    }
  }, [cacheKey]);

  // Update cache when data changes
  useEffect(() => {
    if (current && hourly.length > 0) {
      try {
        localStorage.setItem(cacheKey, JSON.stringify({ 
          current, 
          hourly, 
          timestamp: Date.now() 
        }));
      } catch (e) {
        console.error('Error writing to cache:', e);
      }
    }
  }, [current, hourly, cacheKey]);
  
  // Function to fetch fresh weather data
  const fetchFreshWeather = async () => {
    try {
      setLoading(true);
      
      // Use server-side API route to fetch weather data
      console.log(`Fetching weather data for ${lat},${lng}`);
      const response = await fetch(
        `/api/weather?lat=${lat}&lng=${lng}`
      );
      
      if (!response.ok) {
        // Try to parse the error response
        let errorMessage;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || `Status: ${response.status}`;
          console.error('Weather API error details:', errorData);
        } catch (e) {
          // If we can't parse the JSON, just use the status text
          errorMessage = response.statusText || `Status: ${response.status}`;
        }
        
        throw new Error(`Weather API error: ${response.status} - ${errorMessage}`);
      }
      
      const data = await response.json();
      console.log('Weather data received successfully');
      
      // Format current weather data
      if (data.current) {
        const formattedCurrent: CurrentWeather = {
          temp: data.current.temp,
          humidity: data.current.humidity,
          pressure: data.current.pressure,
          wind_speed: data.current.wind_speed,
          weather: data.current.weather.map((w: any) => ({
            description: w.description,
            icon: w.icon,
            main: w.main
          })),
          dt: data.current.dt,
          feels_like: data.current.feels_like,
          uvi: data.current.uvi,
          visibility: data.current.visibility,
          clouds: data.current.clouds,
          wind_deg: data.current.wind_deg
        };
        
        setCurrent(formattedCurrent);
      }
      
      // Process hourly forecast data (first 24 hours)
      if (data.hourly && data.hourly.length) {
        const processedHourly = data.hourly.slice(0, 24).map((item: any) => ({
          dt: item.dt,
          temp: item.temp,
          humidity: item.humidity,
          weather: item.weather.map((w: any) => ({
            description: w.description,
            icon: w.icon,
            main: w.main
          })),
          pop: item.pop || 0,
          rain: item.rain // Add rain property
        }));
        
        setHourly(processedHourly);
      }
      
      setError(null);
      setLastFetchTime(Date.now());
    } catch (err) {
      console.error('Failed to fetch weather data:', err);
      setError('Failed to load weather forecast. Using existing race data instead.');
      
      // If API call fails and we have existing data, use it as fallback
      if (existingWeather) {
        // Create a current weather object from existing data
        const fallbackCurrent: CurrentWeather = {
          temp: existingWeather.temperature,
          humidity: existingWeather.humidity,
          pressure: existingWeather.airPressure,
          wind_speed: existingWeather.windSpeed,
          weather: [{
            description: existingWeather.rainChance > 50 ? 'rain' : 
                        existingWeather.rainChance > 20 ? 'clouds' : 'clear sky',
            icon: existingWeather.rainChance > 50 ? '10d' : 
                  existingWeather.rainChance > 20 ? '03d' : '01d',
            main: existingWeather.rainChance > 50 ? 'Rain' : 
                 existingWeather.rainChance > 20 ? 'Clouds' : 'Clear'
          }],
          dt: Math.floor(Date.now() / 1000)
        };
        
        setCurrent(fallbackCurrent);
        
        // Generate simple hourly forecast based on existing data
        const now = Math.floor(Date.now() / 1000);
        const fallbackHourly: HourlyForecast[] = [];
        
        for (let i = 0; i < 24; i++) {
          const hourOffset = i; // Every hour
          const tempVariation = Math.random() * 4 - 2; // -2 to +2 degrees variation
          
          fallbackHourly.push({
            dt: now + hourOffset * 3600,
            temp: existingWeather.temperature + tempVariation,
            humidity: existingWeather.humidity,
            weather: [{
              description: existingWeather.rainChance > 50 ? 'rain' : 
                          existingWeather.rainChance > 20 ? 'clouds' : 'clear sky',
              icon: existingWeather.rainChance > 50 ? '10d' : 
                    existingWeather.rainChance > 20 ? '03d' : '01d',
              main: existingWeather.rainChance > 50 ? 'Rain' : 
                   existingWeather.rainChance > 20 ? 'Clouds' : 'Clear'
            }],
            pop: existingWeather.rainChance / 100,
            rain: existingWeather.rainfallAmount ? { '1h': existingWeather.rainfallAmount } : undefined
          });
        }
        
        setHourly(fallbackHourly);
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Initial fetch on component mount
  useEffect(() => {
    fetchFreshWeather();
    
    // Set up auto-refresh every 15 minutes
    const intervalId = setInterval(() => {
      fetchFreshWeather();
    }, 15 * 60 * 1000);
    
    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [lat, lng, existingWeather]);
  
  // Add a manual refresh button handler
  const handleRefresh = () => {
    fetchFreshWeather();
  };
  
  // Add memoization for hourly data
  const memoizedHourly = useMemo(() => hourly.map(hour => ({
    dt: hour.dt,
    temp: Math.round(hour.temp),
    humidity: hour.humidity,
    weather: hour.weather,
    pop: hour.pop,
    rain: hour.rain
  })), [hourly]);

  // Format time helper function
  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Calculate time since last fetch
  const timeAgo = () => {
    if (!lastFetchTime) return '';
    const seconds = Math.floor((Date.now() - lastFetchTime) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    return `${Math.floor(seconds / 3600)} hours ago`;
  };

  // Apply conditional styling based on dark mode
  const containerBg = darkMode 
    ? "bg-gray-800 border border-gray-700" 
    : "bg-white dark:bg-gray-800";
    
  const headerBorderClass = darkMode
    ? "border-gray-700" 
    : "border-gray-200 dark:border-gray-700";
    
  const currentWeatherBg = darkMode
    ? "bg-blue-900/20"
    : "bg-blue-50 dark:bg-blue-900/20";
    
  const textPrimary = darkMode
    ? "text-white"
    : "text-gray-900 dark:text-white";
    
  const textSecondary = darkMode
    ? "text-gray-400"
    : "text-gray-700 dark:text-gray-300";
    
  const textTertiary = darkMode
    ? "text-gray-500"
    : "text-gray-600 dark:text-gray-400";
    
  const refreshButtonColor = darkMode
    ? "text-blue-400 hover:text-blue-300"
    : "text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300";
    
  const errorTextColor = darkMode
    ? "text-red-400 bg-red-900/20"
    : "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20";

  // Add these helper functions
  const getWindDirection = (degrees?: number): string => {
    if (degrees === undefined) return "N/A";
    
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW', 'N'];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
  };

  const formatVisibility = (meters?: number): string => {
    if (meters === undefined) return "N/A";
    return meters >= 10000 ? "10+ km" : `${(meters / 1000).toFixed(1)} km`;
  };

  // Use debouncing for refresh
  const [debouncedRefresh] = useDebounce(fetchFreshWeather, 5000);

  if (loading && !current) {
    return (
      <div className={`rounded-lg p-4 animate-pulse ${darkMode ? 'bg-gray-800' : 'bg-gray-100 dark:bg-gray-800'}`}>
        <div className={`h-6 ${darkMode ? 'bg-gray-700' : 'bg-gray-200 dark:bg-gray-700'} rounded w-3/4 mb-4`}></div>
        <div className={`h-24 ${darkMode ? 'bg-gray-700' : 'bg-gray-200 dark:bg-gray-700'} rounded mb-4`}></div>
        <div className={`h-40 ${darkMode ? 'bg-gray-700' : 'bg-gray-200 dark:bg-gray-700'} rounded`}></div>
      </div>
    );
  }
  
  if (error && !current) {
    return (
      <div className={`rounded-lg p-4 ${darkMode ? 'bg-red-900/20 text-red-400' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'}`}>
        <p className="font-medium">⚠️ {error}</p>
      </div>
    );
  }

  return (
    <div className={`rounded-lg shadow-md overflow-hidden ${containerBg}`}>
      <div className={`p-4 border-b ${headerBorderClass} flex justify-between items-center`}>
        <div>
          <h3 className={`font-semibold text-lg ${textPrimary}`}>{locationName} Weather</h3>
          <p className={textTertiary}>
            {error && <span className="text-amber-500 font-medium">(Fallback data) </span>}
            Updated: {timeAgo()}
          </p>
        </div>
        <button 
          onClick={handleRefresh}
          className={`${refreshButtonColor} p-2 rounded-full`}
          disabled={loading}
        >
          {loading ? (
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          )}
        </button>
      </div>
      
      {/* Current weather */}
      {current && (
        <div className={`p-4 ${currentWeatherBg}`}>
          <div className="flex flex-col md:flex-row md:items-start md:justify-between">
            <div className="flex items-center mb-4 md:mb-0">
              <img 
                src={`https://openweathermap.org/img/wn/${current.weather[0].icon}@2x.png`} 
                alt={current.weather[0].description}
                width="80"
                height="80"
                className="mr-3"
              />
              <div>
                <div className={`text-3xl font-bold ${textPrimary}`}>{Math.round(current.temp)}°C</div>
                <div className={`${textSecondary} capitalize text-lg`}>{current.weather[0].description}</div>
                {current.feels_like !== undefined && (
                  <div className={`text-sm mt-1 ${textTertiary}`}>
                    Feels like {Math.round(current.feels_like)}°C
                  </div>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6 mt-2">
              <div className={`text-sm ${textTertiary}`}>
                <span className="inline-block w-24 font-medium">Humidity:</span>
                <span>{current.humidity}%</span>
              </div>
              
              <div className={`text-sm ${textTertiary}`}>
                <span className="inline-block w-24 font-medium">Wind:</span>
                <span>
                  {current.wind_speed.toFixed(1)} m/s {current.wind_deg !== undefined && getWindDirection(current.wind_deg)}
                </span>
              </div>
              
              <div className={`text-sm ${textTertiary}`}>
                <span className="inline-block w-24 font-medium">Pressure:</span>
                <span>{current.pressure} hPa</span>
              </div>
              
              {current.visibility !== undefined && (
                <div className={`text-sm ${textTertiary}`}>
                  <span className="inline-block w-24 font-medium">Visibility:</span>
                  <span>{formatVisibility(current.visibility)}</span>
                </div>
              )}
              
              {current.uvi !== undefined && (
                <div className={`text-sm ${textTertiary}`}>
                  <span className="inline-block w-24 font-medium">UV Index:</span>
                  <span>{current.uvi.toFixed(1)}</span>
                </div>
              )}
              
              {current.clouds !== undefined && (
                <div className={`text-sm ${textTertiary}`}>
                  <span className="inline-block w-24 font-medium">Cloud Cover:</span>
                  <span>{current.clouds}%</span>
                </div>
              )}
              
              {existingWeather?.rainfallAmount !== undefined && (
                <div className={`text-sm ${textTertiary}`}>
                  <span className="inline-block w-24 font-medium">Rainfall:</span>
                  <span>{existingWeather.rainfallAmount.toFixed(1)} mm</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Hourly forecast */}
      {hourly.length > 0 && (
        <div className="p-4">
          <h4 className={`font-medium mb-3 ${textPrimary}`}>24-Hour Forecast</h4>
          <div className="overflow-x-auto">
            <List
              height={150}
              itemCount={hourly.length}
              itemSize={80}
              layout="horizontal"
              width={Math.min(hourly.length * 80, viewportWidth - 50)}
              itemData={{
                hours: hourly,
                formatTime,
                textTertiary,
                textPrimary
              }}
            >
              {HourlyRow}
            </List>
          </div>
        </div>
      )}
    </div>
  );
} 