import { RaceEvent, SeriesType } from '../types';
import { seriesData } from './sampleData';
import { fetchWeatherData } from './weatherApi';

/**
 * Updates the weather data for a specific race
 * Note: In a real app, this would update a database
 */
export async function updateRaceWeather(raceId: string): Promise<RaceEvent | null> {
  // Find the race in our sample data
  let targetRace: RaceEvent | undefined;
  let targetSeriesIndex: number = -1;
  let targetRaceIndex: number = -1;
  
  for (let i = 0; i < seriesData.length; i++) {
    const seriesRaces = seriesData[i].races;
    const raceIndex = seriesRaces.findIndex(race => race.id === raceId);
    
    if (raceIndex !== -1) {
      targetRace = seriesRaces[raceIndex];
      targetSeriesIndex = i;
      targetRaceIndex = raceIndex;
      break;
    }
  }
  
  if (!targetRace || targetSeriesIndex === -1 || targetRaceIndex === -1) {
    console.error(`Race with ID ${raceId} not found`);
    return null;
  }
  
  try {
    // Fetch new weather data
    const weatherData = await fetchWeatherData({
      lat: targetRace.location.coordinates.lat,
      lng: targetRace.location.coordinates.lng,
    });
    
    // Update the race (in a real app, this would update a database record)
    const updatedRace: RaceEvent = {
      ...targetRace,
      weatherData,
      updatedAt: new Date().toISOString(),
    };
    
    // Update our in-memory data (in a real app, this would be a database update)
    seriesData[targetSeriesIndex].races[targetRaceIndex] = updatedRace;
    
    return updatedRace;
  } catch (error) {
    console.error(`Error updating weather for race ${raceId}:`, error);
    return null;
  }
}

/**
 * Get all races for a specific series
 */
export function getRacesBySeries(seriesId: SeriesType): RaceEvent[] {
  const series = seriesData.find(s => s.id === seriesId);
  return series?.races || [];
}

/**
 * Get a specific race by ID
 */
export function getRaceById(raceId: string): RaceEvent | undefined {
  for (const series of seriesData) {
    const race = series.races.find(r => r.id === raceId);
    if (race) return race;
  }
  return undefined;
} 