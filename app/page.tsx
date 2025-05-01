'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { seriesData } from './lib/sampleData';
import { RaceEvent, SeriesData } from './types';
import dynamic from 'next/dynamic';
import WeatherForecast from './components/WeatherForecast';

// Dynamically import the TrackMap to handle SSR issues
const TrackMap = dynamic(() => import('./components/TrackMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-800 text-gray-400">
      Loading map...
    </div>
  )
});

// Convert allSeries to constant since it doesn't change - moved outside component
const allSeries: SeriesData[] = seriesData;

export default function Home() {
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>('f1');
  const [selectedRaceId, setSelectedRaceId] = useState<string | null>(null);
  const [currentRace, setCurrentRace] = useState<RaceEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Pre-calculate upcoming races - memoize to avoid recalculation
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
  }, []);

  // Load default race on component mount
  useEffect(() => {
    // Set dark mode for body
    document.body.classList.add('dark');

    // Always prioritize F1 series first
    const f1Series = allSeries.find(s => s.id === 'f1');
    
    // If no race is selected, find the next upcoming F1 race or any upcoming race
    if (!selectedRaceId) {
      if (f1Series) {
        // Find upcoming F1 races
        const now = new Date();
        const upcomingF1Races = f1Series.races
          .filter(race => new Date(race.date) >= now)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        if (upcomingF1Races.length > 0) {
          setSelectedRaceId(upcomingF1Races[0].id);
        } else if (f1Series.races.length > 0) {
          setSelectedRaceId(f1Series.races[0].id);
        } else if (upcomingRaces.length > 0) {
          setSelectedRaceId(upcomingRaces[0].race.id);
          setSelectedSeriesId(upcomingRaces[0].seriesId);
        }
      } else if (upcomingRaces.length > 0) {
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
  }, [selectedRaceId, selectedSeriesId]);

  // Memoize event handlers to prevent unnecessary re-renders
  const handleSeriesSelect = useCallback((seriesId: string) => {
    setSelectedSeriesId(seriesId);
    
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
  }, []);

  // Memoize expensive calculations
  const selectedSeries = useMemo(() => 
    allSeries.find(s => s.id === selectedSeriesId), 
    [selectedSeriesId]
  );
  
  // Loading placeholder
  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }
  
  // Error placeholder
  if (!currentRace) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-900 text-white">
        <p>No race found. Please check the data.</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col md:flex-row h-screen w-screen bg-gray-900 text-gray-100">
      {/* Left side - Map (taking full width on mobile, about 70% on larger screens) */}
      <div className="h-[40vh] md:h-full md:flex-grow border-b md:border-b-0 md:border-r border-gray-700">
        {currentRace && currentRace.location && currentRace.location.coordinates && (
          <div className="w-full h-full flex items-center justify-center text-center">
            <TrackMap 
              race={currentRace} 
              height="100%"
              mapStyle="dark"
              key={`map-${currentRace.id}`}
              showPrecipitation={true}
              showClouds={true}
            />
          </div>
        )}
      </div>
      
      {/* Right side - Information panels (full width on mobile, fixed width on desktop) */}
      <div className="h-[60vh] md:h-full w-full md:w-[450px] flex flex-col bg-gray-900 overflow-hidden">
        {/* Header */}
        <div className="p-3 md:p-4 border-b border-gray-700 flex-shrink-0">
          <h1 className="text-xl font-bold text-center">TrackWeather</h1>
        </div>
        
        {/* Series Selection */}
        <div className="p-3 md:p-4 border-b border-gray-700 flex-shrink-0">
          <select 
            value={selectedSeriesId}
            onChange={(e) => handleSeriesSelect(e.target.value)}
            className="w-full bg-gray-800 text-white py-2 px-3 rounded-md text-center"
            aria-label="Select racing series"
          >
            {allSeries.map(series => (
              <option key={series.id} value={series.id}>
                {series.name}
              </option>
            ))}
          </select>
        </div>
        
        {/* Scrollable content container */}
        <div className="flex-1 overflow-y-auto">
          {/* Race Information */}
          <div className="p-3 md:p-4 border-b border-gray-700">
            <h2 className="text-lg font-semibold mb-2">Race Information</h2>
            <div className="space-y-2 text-sm">
              <p>
                <span className="text-gray-400">Event:</span> {currentRace.name}
              </p>
              {currentRace.location && (
                <>
                  <p>
                    <span className="text-gray-400">Location:</span> {currentRace.location.name}, {currentRace.location.city}, {currentRace.location.country}
                  </p>
                  <p>
                    <span className="text-gray-400">Circuit:</span> {currentRace.location.name}
                  </p>
                  {currentRace.location.coordinates && (
                    <p>
                      <span className="text-gray-400">Coordinates:</span> {currentRace.location.coordinates.lat.toFixed(4)}, {currentRace.location.coordinates.lng.toFixed(4)}
                    </p>
                  )}
                </>
              )}
              <p>
                <span className="text-gray-400">Date:</span> {new Date(currentRace.date).toLocaleDateString()}
              </p>
            </div>
          </div>
          
          {/* Weather Information */}
          <div className="p-3 md:p-4">
            <h2 className="text-lg font-semibold mb-2 md:mb-4">Weather Information</h2>
            {currentRace && currentRace.location && currentRace.location.coordinates && (
              <WeatherForecast 
                lat={currentRace.location.coordinates.lat}
                lng={currentRace.location.coordinates.lng}
                locationName={`${currentRace.location.name}, ${currentRace.location.city}`}
                darkMode={true}
                existingWeather={currentRace.weatherData}
              />
            )}
          </div>
        </div>
        
        {/* Ko-fi Support Button */}
        <div className="p-3 md:p-4 border-t border-gray-700 flex justify-center flex-shrink-0">
          <a 
            href='https://ko-fi.com/E1E61DD630' 
            target='_blank' 
            rel="noreferrer noopener"
            aria-label="Support on Ko-fi"
          >
            <img 
              height='36' 
              style={{border: 0, height: 36}} 
              src='https://storage.ko-fi.com/cdn/kofi6.png?v=6' 
              alt='Buy Me a Coffee at ko-fi.com' 
            />
          </a>
        </div>
      </div>
    </div>
  );
}
