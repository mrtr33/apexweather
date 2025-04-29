'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useRouter, notFound } from 'next/navigation';
import { RaceEvent, SeriesData } from '@/app/types';
import { seriesData } from '@/app/lib/sampleData';
import { updateRaceWeather } from '@/app/lib/weatherApi';
import dynamic from 'next/dynamic';
import WeatherForecast from '@/app/components/WeatherForecast';
import Link from 'next/link';
import DraggablePanel from '@/app/components/DraggablePanel';

// Dynamically import the TrackMap to handle SSR issues
const TrackMap = dynamic(() => import('@/app/components/TrackMap'), {
  ssr: false
});

// Convert allSeries to constant since it doesn't change
const allSeries: SeriesData[] = seriesData;

export default function RaceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const raceId = params.id as string;
  
  const [race, setRace] = useState<RaceEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(null);
  const [showSeriesList, setShowSeriesList] = useState(false);
  const [showWeatherDetails, setShowWeatherDetails] = useState(true);

  // Find race across all series
  useEffect(() => {
    let isMounted = true;
    
    const fetchRace = async () => {
      setIsLoading(true);
      try {
        // Find race in any series
        let foundRace: RaceEvent | null = null;
        let seriesId = null;
        
        for (const series of allSeries) {
          const found = series.races.find(r => r.id === raceId);
          if (found) {
            foundRace = found;
            seriesId = series.id;
            break;
          }
        }
        
        if (!foundRace || !isMounted) {
          if (isMounted) return notFound();
          return;
        }
        
        if (isMounted) setSelectedSeriesId(seriesId);
        
        // Update weather data if needed
        if (foundRace.weatherData) {
          try {
            const updatedWeather = await updateRaceWeather(
              foundRace.id,
              foundRace.location.coordinates
            );
            foundRace = {
              ...foundRace,
              weatherData: updatedWeather,
            };
          } catch (error) {
            // Silent fail - continue with existing weather data
          }
        }
        
        if (isMounted) setRace(foundRace);
      } catch (error) {
        // Error handling
        console.error("Error fetching race data:", error); // Keep minimal error log
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    
    fetchRace();
    
    return () => {
      isMounted = false;
    };
  }, [raceId, allSeries]);

  // Memoize handlers to prevent recreating on each render
  const handleRaceChange = useCallback((newRaceId: string) => {
    router.push(`/race/${newRaceId}`);
  }, [router]);
  
  const handleSeriesSelect = useCallback((seriesId: string) => {
    setSelectedSeriesId(seriesId);
    setShowSeriesList(false);
    
    // Navigate to the first race of the selected series
    const newSeries = allSeries.find(s => s.id === seriesId);
    if (newSeries && newSeries.races.length > 0) {
      // Find the next upcoming race in this series
      const now = new Date();
      const upcomingRaces = newSeries.races
        .filter(race => new Date(race.date) >= now)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      if (upcomingRaces.length > 0) {
        // Select the next upcoming race
        router.push(`/race/${upcomingRaces[0].id}`);
      } else {
        // If no upcoming races, select the first race
        router.push(`/race/${newSeries.races[0].id}`);
      }
    }
  }, [allSeries, router]);

  // Memoize series races to avoid recalculation on every render
  const selectedSeries = useMemo(() => 
    allSeries.find(s => s.id === selectedSeriesId), 
    [allSeries, selectedSeriesId]
  );
  
  const seriesRaces = useMemo(() => 
    selectedSeries?.races || [], 
    [selectedSeries]
  );

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-gray-900 flex overflow-hidden">
        <div className="h-full flex-grow animate-pulse bg-gray-800"></div>
        <div className="h-full w-96 bg-gray-800 animate-pulse">
          <div className="h-8 bg-gray-700 rounded w-2/3 m-6"></div>
          <div className="h-4 bg-gray-700 rounded w-1/2 mx-6 mb-8"></div>
          <div className="h-36 bg-gray-700 rounded mx-6 mb-6"></div>
          <div className="h-36 bg-gray-700 rounded mx-6"></div>
        </div>
      </div>
    );
  }

  if (!race) {
    return notFound();
  }

  return (
    <div className="fixed inset-0 flex p-0 m-0 bg-gray-900 text-gray-100">
      {/* Full-screen map background with lighter theme */}
      <div className="absolute inset-0 z-0">
        {race && <TrackMap 
          race={race} 
          height="100vh" 
          fullscreen={true} 
          darkMode={true}
          mapStyle="dark"
          key={race.id}
          showPrecipitation={true}
          showClouds={true}
        />}
      </div>
      
      {/* Draggable information panel */}
      <DraggablePanel title="Race Information" width="550px">
        {/* Header and series selector */}
        <div className="p-5 border-b border-gray-800 drag-handle cursor-grab">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold text-white">
              {race.name}
            </h1>
            <div className="relative">
              <button 
                onClick={() => setShowSeriesList(!showSeriesList)}
                className="flex items-center space-x-1 bg-gray-800 rounded-md px-3 py-1.5 text-sm"
              >
                <span>{selectedSeries?.name || 'Select Series'}</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {/* Series dropdown */}
              {showSeriesList && (
                <div className="absolute right-0 mt-1 w-48 bg-gray-800 rounded-md shadow-lg z-20">
                  <div className="py-1">
                    {allSeries.map((series) => (
                      <button
                        key={series.id}
                        onClick={() => handleSeriesSelect(series.id)}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-700"
                      >
                        {series.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Tabbed interface */}
        <div className="flex border-b border-gray-800">
          <button 
            className={`flex-1 py-3 text-center ${!showWeatherDetails ? 'bg-gray-800 text-white' : 'text-gray-400'}`}
            onClick={() => setShowWeatherDetails(false)}
          >
            Races
          </button>
          <button 
            className={`flex-1 py-3 text-center ${showWeatherDetails ? 'bg-gray-800 text-white' : 'text-gray-400'}`}
            onClick={() => setShowWeatherDetails(true)}
          >
            Weather
          </button>
        </div>
        
        {/* Scrollable content area */}
        <div className="flex-grow overflow-y-auto pb-4">
          {showWeatherDetails ? (
            /* Weather information */
            <div className="p-5">
              <div className="mb-5 bg-gray-800 rounded-lg p-4">
                <p className="text-gray-400 text-sm mb-1">Venue</p>
                <p className="text-base font-medium">{race.location.name}</p>
                <p className="text-gray-400">{race.location.city}, {race.location.country}</p>
              </div>
              
              <div className="mb-4">
                <p className="text-gray-400 text-sm mb-1">Date</p>
                <p className="text-base font-medium">
                  {new Date(race.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              
              <div>
                <WeatherForecast 
                  lat={race.location.coordinates.lat} 
                  lng={race.location.coordinates.lng}
                  locationName={`${race.location.name}, ${race.location.city}`}
                  existingWeather={race.weatherData}
                  darkMode={true}
                />
              </div>
            </div>
          ) : (
            /* Race list */
            <div className="p-2">
              {seriesRaces.length > 0 ? (
                <ul className="space-y-1">
                  {seriesRaces.map((raceItem) => (
                    <li 
                      key={raceItem.id}
                      className={`p-3 rounded-md ${raceItem.id === race.id ? 'bg-blue-900' : 'hover:bg-gray-800'}`}
                    >
                      <Link 
                        href={`/race/${raceItem.id}`}
                        className="block"
                      >
                        <p className="font-medium text-white">{raceItem.name}</p>
                        <div className="flex justify-between text-sm text-gray-400 mt-1">
                          <p>{raceItem.location.city}, {raceItem.location.country}</p>
                          <p>{new Date(raceItem.date).toLocaleDateString()}</p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-center text-gray-400 py-10">
                  No races available for this series
                </p>
              )}
            </div>
          )}
        </div>
        
        {/* Footer with branding */}
        <div className="border-t border-gray-800 p-3 text-center">
          <span className="text-sm text-gray-500">ApexWeather</span>
        </div>
      </DraggablePanel>
    </div>
  );
} 