'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { seriesData } from './lib/sampleData';
import { RaceEvent, SeriesData } from './types';
import dynamic from 'next/dynamic';
import WeatherForecast from './components/WeatherForecast';
import TrackInfo from './components/TrackInfo';

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
  const [isInfoMinimized, setIsInfoMinimized] = useState(false);

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
      <div className={`${isInfoMinimized ? 'h-full' : 'h-[40vh]'} md:h-full md:flex-grow border-b md:border-b-0 md:border-r border-gray-700 transition-all duration-300`}>
        {currentRace && currentRace.location && currentRace.location.coordinates && (
          <div className="w-full h-full flex items-center justify-center text-center">
            <TrackMap 
              race={currentRace} 
              height="100%"
              mapStyle="dark"
              key={`map-${currentRace.id}`}
              showPrecipitation={false}
              showClouds={false}
              defer
            />
          </div>
        )}
      </div>
      
      {/* Mobile Panel - Completely separate from desktop */}
      <div className={`md:hidden fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 transition-transform duration-300 z-30 ${isInfoMinimized ? 'translate-y-full' : 'translate-y-0'}`}>
        <div className="h-[60vh] flex flex-col">
          {/* Mobile Header */}
          <div className="p-3 border-b border-gray-700 flex-shrink-0">
            <div className="flex items-center justify-center">
              <h1 className="text-xl font-bold">ApexWeather</h1>
            </div>
          </div>
          
          {/* Mobile Series Selection */}
          <div className="p-3 border-b border-gray-700 flex-shrink-0">
            <select 
              value={selectedSeriesId}
              onChange={(e) => handleSeriesSelect(e.target.value)}
              className="w-full bg-gray-800 text-white py-3 px-3 rounded-md text-center text-base"
              aria-label="Select racing series"
            >
              {allSeries.map(series => (
                <option key={series.id} value={series.id}>
                  {series.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* Mobile Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Race Information */}
            <div className="p-3 border-b border-gray-700">
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
                  </>
                )}
                <p>
                  <span className="text-gray-400">Date:</span> {new Date(currentRace.date).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            {/* Weather Information */}
            <div className="p-3 space-y-4">
              <h2 className="text-lg font-semibold mb-2">Weather Information</h2>
              {currentRace && currentRace.location && currentRace.location.coordinates && (
                <WeatherForecast 
                  lat={currentRace.location.coordinates.lat}
                  lng={currentRace.location.coordinates.lng}
                  locationName={`${currentRace.location.name}, ${currentRace.location.city}`}
                  darkMode={true}
                  existingWeather={currentRace.weatherData}
                />
              )}
              <TrackInfo race={currentRace} />
            </div>
          </div>
          
          {/* Mobile Ko-fi Support Button */}
          <div className="p-3 border-t border-gray-700 flex justify-center flex-shrink-0">
            <a 
              href='https://ko-fi.com/E1E61DD630' 
              target='_blank' 
              rel="noreferrer noopener"
              aria-label="Support on Ko-fi"
            >
              <img 
                src='https://storage.ko-fi.com/cdn/kofi6.png?v=6' 
                alt='Buy Me a Coffee at ko-fi.com' 
                width="143" 
                height="36" 
                style={{ border: 0, width: 143, height: 36 }}
              />
            </a>
          </div>
        </div>
      </div>
      
      {/* Desktop Panel - Completely separate from mobile */}
      <div className={`hidden md:flex ${isInfoMinimized ? 'md:w-[64px]' : 'md:w-[480px]'} md:h-full flex-col bg-gray-900 border-l border-gray-700 transition-all duration-300`}>
        {/* Desktop Header */}
        <div className="p-4 border-b border-gray-700 flex-shrink-0">
          <div className="flex items-center justify-center gap-3">
            {!isInfoMinimized ? (
              <>
                <h1 className="text-2xl font-bold">ApexWeather</h1>
                <button
                  onClick={() => setIsInfoMinimized(!isInfoMinimized)}
                  className="h-8 w-8 flex items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-colors"
                  aria-label="Minimize panel"
                  title="Minimize panel"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsInfoMinimized(!isInfoMinimized)}
                className="h-8 w-8 flex items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-colors"
                aria-label="Expand panel"
                title="Expand panel"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
          </div>
        </div>
        
        {/* Desktop Content - Only show when not minimized */}
        {!isInfoMinimized && (
          <>
            {/* Desktop Series Selection */}
            <div className="p-4 border-b border-gray-700 flex-shrink-0">
              <select 
                value={selectedSeriesId}
                onChange={(e) => handleSeriesSelect(e.target.value)}
                className="w-full bg-gray-800 text-white py-3 px-3 rounded-md text-center text-base"
                aria-label="Select racing series"
              >
                {allSeries.map(series => (
                  <option key={series.id} value={series.id}>
                    {series.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Desktop Content */}
            <div className="flex-1 overflow-y-auto">
              {/* Race Information */}
              <div className="p-4 border-b border-gray-700">
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
                    </>
                  )}
                  <p>
                    <span className="text-gray-400">Date:</span> {new Date(currentRace.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              {/* Weather Information */}
              <div className="p-4 space-y-4">
                <h2 className="text-lg font-semibold mb-4">Weather Information</h2>
                {currentRace && currentRace.location && currentRace.location.coordinates && (
                  <WeatherForecast 
                    lat={currentRace.location.coordinates.lat}
                    lng={currentRace.location.coordinates.lng}
                    locationName={`${currentRace.location.name}, ${currentRace.location.city}`}
                    darkMode={true}
                    existingWeather={currentRace.weatherData}
                  />
                )}
                <TrackInfo race={currentRace} />
              </div>
            </div>
            
            {/* Desktop Ko-fi Support Button */}
            <div className="p-4 border-t border-gray-700 flex justify-center flex-shrink-0">
              <a 
                href='https://ko-fi.com/E1E61DD630' 
                target='_blank' 
                rel="noreferrer noopener"
                aria-label="Support on Ko-fi"
              >
                <img 
                  src='https://storage.ko-fi.com/cdn/kofi6.png?v=6' 
                  alt='Buy Me a Coffee at ko-fi.com' 
                  width="143" 
                  height="36" 
                  style={{ border: 0, width: 143, height: 36 }}
                />
              </a>
            </div>
          </>
        )}
      </div>
      
      {/* Mobile Floating Button - Only visible on mobile */}
      <button
        onClick={() => setIsInfoMinimized(!isInfoMinimized)}
        className="md:hidden fixed bottom-4 right-4 z-[9999] h-12 w-12 flex items-center justify-center rounded-full bg-blue-600 text-white shadow-2xl hover:bg-blue-700 transition-colors"
        style={{ zIndex: 9999 }}
        aria-label={isInfoMinimized ? 'Expand panel' : 'Minimize panel'}
        title={isInfoMinimized ? 'Expand panel' : 'Minimize panel'}
      >
        {isInfoMinimized ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>
    </div>
  );
}
