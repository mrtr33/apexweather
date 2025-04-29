'use client';

import { useState } from 'react';
import { RaceEvent } from '../types';
import WeatherCard from './WeatherCard';
import TrackMap from './TrackMap';
import WeatherForecast from './WeatherForecast';

interface RaceCardProps {
  race: RaceEvent;
}

export default function RaceCard({ race }: RaceCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showStaticWeather, setShowStaticWeather] = useState(false);
  
  const eventDate = new Date(race.date);
  const isPastEvent = eventDate < new Date();
  
  const formattedDate = eventDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-all duration-300 ${isExpanded ? 'shadow-lg' : ''}`}>
      <div 
        className={`px-6 py-4 cursor-pointer ${isPastEvent ? 'opacity-70' : ''}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {race.name}
          </h2>
          <div className={`rounded-full px-3 py-1 text-xs font-medium ${isPastEvent ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300' : 'bg-primary text-white'}`}>
            {isPastEvent ? 'Completed' : 'Upcoming'}
          </div>
        </div>
        
        <div className="mt-2 flex items-center text-gray-700 dark:text-gray-300 text-sm">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {formattedDate}
        </div>
        
        <div className="mt-1 flex items-center text-gray-700 dark:text-gray-300 text-sm">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {race.location.name}, {race.location.city}, {race.location.country}
        </div>
        
        <div className="mt-4 flex justify-between items-center">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {race.weatherData ? 
              `Weather: ${race.weatherData.temperature}°C` : 
              "Weather data not available"}
          </span>
          <svg 
            className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${isExpanded ? 'transform rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      
      {isExpanded && (
        <div className="px-6 pb-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200">Weather Information</h3>
            <button 
              onClick={() => setShowStaticWeather(!showStaticWeather)}
              className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:text-blue-800 dark:hover:text-blue-300"
            >
              {showStaticWeather ? 'Show real-time forecast' : 'Show sample data'}
            </button>
          </div>
          
          {showStaticWeather && race.weatherData ? (
            <WeatherCard weather={race.weatherData} />
          ) : (
            <WeatherForecast
              lat={race.location.coordinates.lat}
              lng={race.location.coordinates.lng}
              locationName={`${race.location.name}, ${race.location.city}`}
            />
          )}
          
          <div className="mt-4">
            <TrackMap race={race} height="200px" />
          </div>
        </div>
      )}
    </div>
  );
} 