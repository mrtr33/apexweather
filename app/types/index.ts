export type SeriesType = 'f1' | 'wrc' | 'motogp' | 'nascar';

export interface WeatherData {
  temperature: number;
  rainChance: number;
  windSpeed: number;
  airPressure: number;
  humidity: number;
  updatedAt: string;
  rainfallAmount?: number; // Amount of rainfall in mm
}

export interface RaceEvent {
  id: string;
  series: SeriesType;
  name: string;
  date: string;
  location: {
    name: string;
    city: string;
    country: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  weatherData?: WeatherData;
  updatedAt: string;
}

export interface SeriesData {
  id: SeriesType;
  name: string;
  currentSeason: string;
  races: RaceEvent[];
} 