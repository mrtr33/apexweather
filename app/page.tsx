'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { seriesData } from './lib/sampleData';
import { RaceEvent, SeriesData } from './types';
import dynamic from 'next/dynamic';
import WeatherForecast from './components/WeatherForecast';
import DraggablePanel from './components/DraggablePanel';

// Dynamically import the TrackMap to handle SSR issues
const TrackMap = dynamic(() => import('./components/TrackMap'), {
  ssr: false
});

// Convert allSeries to constant since it doesn't change
const allSeries: SeriesData[] = seriesData;

export default function Home() {
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>('f1');
  const [selectedRaceId, setSelectedRaceId] = useState<string | null>(null);
  const [currentRace, setCurrentRace] = useState<RaceEvent | null>(null);
  const [showSeriesList, setShowSeriesList] = useState(false);
  const [showWeatherDetails, setShowWeatherDetails] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // Pre-calculate upcoming races outside of useEffect
  const upcomingRaces = useMemo(() => {
    const now = new Date();
    const races: { race: RaceEvent; seriesId: string }[] = [];
    
    allSeries.forEach(series => {
      series.races.forEach(race => {
        const raceDate = new Date(race.date);
        if (raceDate >= now) {
          races.push({ race, seriesId: series.id });
        }
      });
    });
    
    return races.sort((a, b) => 
      new Date(a.race.date).getTime() - new Date(b.race.date).getTime()
    );
  }, [allSeries]);

  // Load default race on component mount
  useEffect(() => {
    // Set dark mode for body
    document.body.classList.add('dark');

    // Always prioritize F1 series first
    const f1Series = seriesData.find(s => s.id === 'f1');
    
    // If no race is selected, find the next upcoming F1 race or any upcoming race
    if (!selectedRaceId) {
      if (f1Series) {
        // Find upcoming F1 races
        const now = new Date();
        const upcomingF1Races = f1Series.races
          .filter(race => new Date(race.date) >= now)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        if (upcomingF1Races.length > 0) {
          // Use the next upcoming F1 race
          setSelectedRaceId(upcomingF1Races[0].id);
        } else if (f1Series.races.length > 0) {
          // If no upcoming F1 races, use the first F1 race
          setSelectedRaceId(f1Series.races[0].id);
        } else if (upcomingRaces.length > 0) {
          // If no F1 races at all, fall back to any upcoming race
          setSelectedRaceId(upcomingRaces[0].race.id);
          setSelectedSeriesId(upcomingRaces[0].seriesId);
        }
      } else if (upcomingRaces.length > 0) {
        // If F1 series not found, fall back to any upcoming race
        setSelectedRaceId(upcomingRaces[0].race.id);
        setSelectedSeriesId(upcomingRaces[0].seriesId);
      }
    }

    return () => {
      document.body.classList.remove('dark');
    };
  }, [selectedRaceId, upcomingRaces]);

  // Update current race whenever selectedRaceId changes
  useEffect(() => {
    if (!selectedRaceId) return;
    
    setIsLoading(true);
    
    // Find race across all series
    let foundRace: RaceEvent | null = null;
    let seriesId = selectedSeriesId;
    
    for (const series of allSeries) {
      const found = series.races.find(r => r.id === selectedRaceId);
      if (found) {
        foundRace = found;
        seriesId = series.id;
        break;
      }
    }
    
    if (foundRace) {
      setCurrentRace(foundRace);
      setSelectedSeriesId(seriesId);
    }
    
    setIsLoading(false);
  }, [selectedRaceId, allSeries, selectedSeriesId]);

  const handleRaceChange = useCallback((newRaceId: string) => {
    setSelectedRaceId(newRaceId);
  }, []);
  
  const handleSeriesSelect = useCallback((seriesId: string) => {
    setSelectedSeriesId(seriesId);
    setShowSeriesList(false);
    
    // Find the next upcoming race in this series
    const newSeries = allSeries.find(s => s.id === seriesId);
    if (newSeries && newSeries.races.length > 0) {
      const now = new Date();
      const upcomingRaces = newSeries.races
        .filter(race => new Date(race.date) >= now)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      if (upcomingRaces.length > 0) {
        // Select the next upcoming race
        setSelectedRaceId(upcomingRaces[0].id);
      } else {
        // If no upcoming races, select the first race
        setSelectedRaceId(newSeries.races[0].id);
      }
    }
  }, [allSeries]);

  // Memoize expensive calculations
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
  
  if (!currentRace) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-900 text-white overflow-hidden">
        <p>No race found. Please check the data.</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex p-0 m-0 bg-gray-900 text-gray-100">
      {/* Full-screen map background with lighter theme */}
      <div className="absolute inset-0 z-0">
        <TrackMap 
          race={currentRace} 
          height="100vh" 
          fullscreen={true} 
          darkMode={false}
          mapStyle="dark"
          key={currentRace.id}
          showPrecipitation={true}
          showClouds={true}
        />
      </div>
      
      {/* Draggable information panel */}
      <DraggablePanel title="Race Information" width="550px">
        {/* Header and series selector */}
        <div className="p-5 border-b border-gray-800 drag-handle cursor-grab">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold text-white">
              {currentRace.name}
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
                <p className="text-base font-medium">{currentRace.location.name}</p>
                <p className="text-gray-400">{currentRace.location.city}, {currentRace.location.country}</p>
              </div>
              
              <div className="mb-4">
                <p className="text-gray-400 text-sm mb-1">Date</p>
                <p className="text-base font-medium">
                  {new Date(currentRace.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              
              <div>
                <WeatherForecast 
                  lat={currentRace.location.coordinates.lat} 
                  lng={currentRace.location.coordinates.lng}
                  locationName={`${currentRace.location.name}, ${currentRace.location.city}`}
                  existingWeather={currentRace.weatherData}
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
                      className={`p-3 rounded-md ${raceItem.id === currentRace.id ? 'bg-blue-900' : 'hover:bg-gray-800'}`}
                    >
                      <button 
                        onClick={() => handleRaceChange(raceItem.id)}
                        className="block w-full text-left"
                      >
                        <p className="font-medium text-white">{raceItem.name}</p>
                        <div className="flex justify-between text-sm text-gray-400 mt-1">
                          <p>{raceItem.location.city}, {raceItem.location.country}</p>
                          <p>{new Date(raceItem.date).toLocaleDateString()}</p>
                        </div>
                      </button>
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
        <div className="border-t border-gray-800 p-3 text-center flex flex-col items-center">
          <a href='https://ko-fi.com/E1E61DD630' target='_blank' rel="noreferrer">
            <img 
              height={36} 
              width={142}
              style={{border: 0, height: 36}} 
              src='https://storage.ko-fi.com/cdn/kofi3.png?v=6'
              alt='Buy Me a Coffee at ko-fi.com'
            />
          </a>
          <span className="text-sm text-gray-500">ApexWeather</span>
        </div>
      </DraggablePanel>
    </div>
  );
}
