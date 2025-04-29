import { WeatherData } from '../types';

// Use server-side environment variables only
const API_KEY = process.env.OPENWEATHERMAP_API_KEY || '';
const BASE_URL = 'https://api.openweathermap.org/data/3.0/onecall';

type Coordinates = {
  lat: number;
  lng: number;
};

// One Call API 3.0 response types
type WeatherCondition = {
  id: number;
  main: string;
  description: string;
  icon: string;
};

type CurrentWeather = {
  dt: number;
  sunrise: number;
  sunset: number;
  temp: number;
  feels_like: number;
  pressure: number;
  humidity: number;
  dew_point: number;
  uvi: number;
  clouds: number;
  visibility: number;
  wind_speed: number;
  wind_deg: number;
  wind_gust?: number;
  weather: WeatherCondition[];
  rain?: { '1h': number };
  snow?: { '1h': number };
};

type MinutelyForecast = {
  dt: number;
  precipitation: number;
};

type HourlyForecast = {
  dt: number;
  temp: number;
  feels_like: number;
  pressure: number;
  humidity: number;
  dew_point: number;
  uvi: number;
  clouds: number;
  visibility: number;
  wind_speed: number;
  wind_deg: number;
  wind_gust?: number;
  weather: WeatherCondition[];
  pop: number; // Probability of precipitation
  rain?: { '1h': number };
  snow?: { '1h': number };
};

type DailyTemperature = {
  day: number;
  min: number;
  max: number;
  night: number;
  eve: number;
  morn: number;
};

type DailyFeelsLike = {
  day: number;
  night: number;
  eve: number;
  morn: number;
};

type DailyForecast = {
  dt: number;
  sunrise: number;
  sunset: number;
  moonrise: number;
  moonset: number;
  moon_phase: number;
  summary: string;
  temp: DailyTemperature;
  feels_like: DailyFeelsLike;
  pressure: number;
  humidity: number;
  dew_point: number;
  wind_speed: number;
  wind_deg: number;
  wind_gust?: number;
  weather: WeatherCondition[];
  clouds: number;
  pop: number;
  rain?: number;
  snow?: number;
  uvi: number;
};

type Alert = {
  sender_name: string;
  event: string;
  start: number;
  end: number;
  description: string;
  tags: string[];
};

type OpenWeatherResponse = {
  lat: number;
  lon: number;
  timezone: string;
  timezone_offset: number;
  current: CurrentWeather;
  minutely?: MinutelyForecast[];
  hourly?: HourlyForecast[];
  daily?: DailyForecast[];
  alerts?: Alert[];
};

type ApiError = {
  cod: number;
  message: string;
  parameters?: string[];
};

/**
 * Fetches weather data from OpenWeatherMap One Call API 3.0
 * @param coordinates The latitude and longitude of the location
 * @param exclude Optional parts to exclude from the response
 * @returns Promise with weather data
 */
export async function fetchWeatherData(
  coordinates: Coordinates, 
  exclude?: string[]
): Promise<WeatherData> {
  try {
    const url = new URL(BASE_URL);
    url.searchParams.append('lat', coordinates.lat.toString());
    url.searchParams.append('lon', coordinates.lng.toString());
    url.searchParams.append('units', 'metric'); // Use Celsius
    
    if (exclude && exclude.length > 0) {
      url.searchParams.append('exclude', exclude.join(','));
    }
    
    url.searchParams.append('appid', API_KEY);
    
    // Add a cache-busting parameter to ensure fresh data
    url.searchParams.append('_', Date.now().toString());

    const response = await fetch(url.toString(), {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json() as ApiError;
      throw new Error(`Weather API error: ${errorData.message || response.statusText}`);
    }

    const data = await response.json() as OpenWeatherResponse;
    
    // Get rain chance from the hourly forecast (first hour)
    const rainChance = data.hourly && data.hourly.length > 0 
      ? Math.round(data.hourly[0].pop * 100) 
      : (data.daily && data.daily.length > 0 
        ? Math.round(data.daily[0].pop * 100) 
        : 0);
    
    // Get rainfall amount from the hourly forecast first hour if available
    let rainfallAmount: number | undefined;
    if (data.hourly && data.hourly.length > 0 && data.hourly[0].rain) {
      rainfallAmount = data.hourly[0].rain['1h'];
    } else if (data.current.rain) {
      rainfallAmount = data.current.rain['1h'];
    }
    
    // Convert API response to WeatherData format
    const weatherData: WeatherData = {
      temperature: Math.round(data.current.temp),
      rainChance,
      windSpeed: Math.round(data.current.wind_speed),
      airPressure: data.current.pressure,
      humidity: data.current.humidity,
      updatedAt: new Date().toISOString(),
      rainfallAmount
    };

    return weatherData;
  } catch (error) {
    console.error('Error fetching weather data:', error);
    // Return default weather data in case of error
    return {
      temperature: 20,
      rainChance: 0,
      windSpeed: 10,
      airPressure: 1013,
      humidity: 60,
      updatedAt: new Date().toISOString(),
    };
  }
}

/**
 * Updates weather data for a specific race location
 * @param raceId The ID of the race to update weather for
 * @param coordinates The coordinates of the race location
 * @returns Promise with updated weather data
 */
export async function updateRaceWeather(raceId: string, coordinates: Coordinates): Promise<WeatherData> {
  try {
    // For race forecasts, we only need current and daily data
    const weatherData = await fetchWeatherData(coordinates, ['minutely', 'hourly', 'alerts']);
    
    // Here you would typically save this data to your database
    // For now, we just return the fetched data
    console.log(`Updated weather for race ${raceId} at coordinates ${coordinates.lat},${coordinates.lng}`);
    
    return weatherData;
  } catch (error) {
    console.error(`Failed to update weather for race ${raceId}:`, error);
    throw error;
  }
}

/**
 * Fetches historical weather data for a specific date
 * @param coordinates The coordinates of the location
 * @param date The date to fetch weather for (Unix timestamp)
 * @returns Promise with historical weather data
 */
export async function fetchHistoricalWeather(coordinates: Coordinates, date: number): Promise<WeatherData> {
  try {
    const url = new URL(`${BASE_URL}/timemachine`);
    url.searchParams.append('lat', coordinates.lat.toString());
    url.searchParams.append('lon', coordinates.lng.toString());
    url.searchParams.append('dt', date.toString());
    url.searchParams.append('units', 'metric');
    url.searchParams.append('appid', API_KEY);

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      const errorData = await response.json() as ApiError;
      throw new Error(`Weather API error: ${errorData.message || response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.data || data.data.length === 0) {
      throw new Error('No historical weather data available');
    }
    
    const historicalData = data.data[0];
    
    return {
      temperature: Math.round(historicalData.temp),
      rainChance: 0, // Historical data doesn't include rain chance
      windSpeed: Math.round(historicalData.wind_speed),
      airPressure: historicalData.pressure,
      humidity: historicalData.humidity,
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error fetching historical weather data:', error);
    throw error;
  }
}

/**
 * Bulk updates weather data for multiple races
 * @param races Array of race IDs and coordinates
 * @returns Promise with a map of race IDs to weather data
 */
export async function bulkUpdateWeather(
  races: Array<{ id: string; coordinates: Coordinates }>
): Promise<Map<string, WeatherData>> {
  const results = new Map<string, WeatherData>();
  
  await Promise.all(
    races.map(async (race) => {
      try {
        const weatherData = await updateRaceWeather(race.id, race.coordinates);
        results.set(race.id, weatherData);
      } catch (error) {
        console.error(`Failed to update weather for race ${race.id}:`, error);
        // Continue with other races even if one fails
      }
    })
  );
  
  return results;
} 