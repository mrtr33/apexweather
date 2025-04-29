'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { RaceEvent } from '../types';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Icon } from 'leaflet';
import dynamic from 'next/dynamic';
import WeatherForecast from './WeatherForecast';

// Fix Leaflet marker icon issue in Next.js
const customIcon = new Icon({
  iconUrl: '/images/marker-icon.png',
  shadowUrl: '/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Dynamically import MapContainer to avoid SSR issues
const Map = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);

interface RaceDetailProps {
  race: RaceEvent;
  onSeriesChange: (seriesId: string) => void;
  onRaceChange: (raceId: string) => void;
  availableSeries: { id: string; name: string }[];
  availableRaces: { id: string; name: string }[];
  currentSeriesId: string;
}

export default function RaceDetail({
  race,
  onSeriesChange,
  onRaceChange,
  availableSeries,
  availableRaces,
  currentSeriesId,
}: RaceDetailProps) {
  const [mapReady, setMapReady] = useState(false);
  // Always show real-time forecast by default
  const [showStaticWeather, setShowStaticWeather] = useState(false);

  useEffect(() => {
    // Set mapReady to true after component mounts to handle SSR
    setMapReady(true);
  }, []);

  const handleSeriesChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onSeriesChange(e.target.value);
  };

  const handleRaceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onRaceChange(e.target.value);
  };

  const getWeatherIcon = (rainChance: number) => {
    if (rainChance > 50) return '🌧️';
    if (rainChance > 20) return '🌦️';
    return '☀️';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-6xl mx-auto">
      <div className="mb-8 flex flex-col sm:flex-row items-center justify-between">
        <h1 className="text-3xl font-bold mb-4 sm:mb-0">{race.name}</h1>
        <div className="flex flex-col sm:flex-row gap-4">
          <select 
            value={currentSeriesId} 
            onChange={handleSeriesChange}
            className="bg-gray-100 border border-gray-300 rounded-md px-4 py-2"
          >
            {availableSeries.map((series) => (
              <option key={series.id} value={series.id}>
                {series.name}
              </option>
            ))}
          </select>
          <select 
            value={race.id} 
            onChange={handleRaceChange}
            className="bg-gray-100 border border-gray-300 rounded-md px-4 py-2"
          >
            {availableRaces.map((raceOption) => (
              <option key={raceOption.id} value={raceOption.id}>
                {raceOption.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-gray-50 rounded-lg p-4 h-[400px] relative">
          {mapReady && race.location.coordinates ? (
            <Map
              center={[race.location.coordinates.lat, race.location.coordinates.lng]}
              zoom={13}
              scrollWheelZoom={false}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker 
                position={[race.location.coordinates.lat, race.location.coordinates.lng]}
                icon={customIcon}
              >
                <Popup>
                  {race.name} <br /> {race.location.name}
                </Popup>
              </Marker>
            </Map>
          ) : (
            <div className="flex items-center justify-center h-full w-full bg-gray-200 rounded-lg">
              <p>Map loading or coordinates unavailable</p>
            </div>
          )}
        </div>

        <div className="bg-gray-50 rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Race Details</h2>
          
          <div className="mb-6">
            <p className="text-gray-600 mb-1">Date</p>
            <p className="text-lg font-medium">
              {new Date(race.date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
          
          <div className="mb-6">
            <p className="text-gray-600 mb-1">Venue</p>
            <p className="text-lg font-medium">{race.location.name}</p>
            <p className="text-gray-500">{race.location.city}, {race.location.country}</p>
          </div>
          
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xl font-semibold">Weather</h3>
              <button 
                onClick={() => setShowStaticWeather(!showStaticWeather)}
                className="text-blue-600 text-sm font-medium hover:text-blue-800"
              >
                {showStaticWeather ? 'Show real-time forecast' : 'Show sample data'}
              </button>
            </div>
            
            {showStaticWeather ? (
              <div className="bg-blue-50 rounded-lg p-4 flex justify-between items-center">
                <div>
                  <p className="text-3xl font-bold">{race.weatherData?.temperature}°C</p>
                  <p className="text-gray-600">
                    {race.weatherData?.rainChance}% chance of rain
                  </p>
                </div>
                <div className="text-5xl">
                  {getWeatherIcon(race.weatherData?.rainChance || 0)}
                </div>
              </div>
            ) : (
              <WeatherForecast 
                lat={race.location.coordinates.lat} 
                lng={race.location.coordinates.lng}
                locationName={`${race.location.name}, ${race.location.city}`}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 