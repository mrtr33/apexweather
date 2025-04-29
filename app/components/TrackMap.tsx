'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { RaceEvent } from '../types';
import 'leaflet/dist/leaflet.css';

// Only import types from react-leaflet for TypeScript
import type { MapContainerProps } from 'react-leaflet';

// Components will be dynamically imported
interface TrackMapProps {
  race: RaceEvent;
  height?: string;
  fullscreen?: boolean;
  darkMode?: boolean;
  mapStyle?: 'standard' | 'dark' | 'satellite' | 'terrain' | 'light';
  markerColor?: string;
  showPrecipitation?: boolean;
  showClouds?: boolean;
}

// Create a custom overlay component for OpenWeatherMap layers
function WeatherOverlay({ map, type, enabled }: { map: any, type: 'precipitation' | 'clouds', enabled: boolean }) {
  const L = require('leaflet');
  
  useEffect(() => {
    if (!map || !enabled) return;
    
    let layer: any;
    
    try {
      console.log(`Adding ${type} layer to map`);
      
      // Create a regular tile layer
      if (type === 'precipitation') {
        // Use our server-side API proxy for precipitation
        layer = L.tileLayer(`/api/map/precipitation/{z}/{x}/{y}`, {
          opacity: 0.7,
          attribution: '&copy; <a href="https://www.rainviewer.com/">RainViewer</a>',
          zIndex: 400 // Set higher z-index to ensure it's above base layers
        });
      } else if (type === 'clouds') {
        // Use our server-side API proxy for clouds
        layer = L.tileLayer(`/api/map/clouds/{z}/{x}/{y}`, {
          opacity: 0.6,
          attribution: '&copy; <a href="https://openweathermap.org/">OpenWeatherMap</a>',
          zIndex: 401 // Set higher z-index to ensure it's above base layers
        });
      }
      
      if (layer) {
        map.addLayer(layer);
      }
    } catch (e) {
      console.error(`Failed to add ${type} layer:`, e);
    }
    
    // Cleanup on unmount
    return () => {
      if (layer && map) {
        try {
          map.removeLayer(layer);
        } catch (e) {
          console.error(`Error removing ${type} layer:`, e);
        }
      }
    };
  }, [map, type, enabled]);
  
  return null; // This component doesn't render anything directly
}

// Create an inner component that will be dynamically loaded
function LeafletMap({ race, height, fullscreen = false, darkMode = false, mapStyle = 'standard', markerColor = 'blue', showPrecipitation: initialShowPrecipitation = false, showClouds: initialShowClouds = false }: TrackMapProps) {
  // These imports are safe because this component is only rendered on client
  const { MapContainer, TileLayer, Marker, Popup, LayersControl, useMap } = require('react-leaflet');
  const L = require('leaflet');
  const [map, setMap] = useState<any>(null);
  const [showPrecipitation, setShowPrecipitation] = useState(initialShowPrecipitation);
  const [showClouds, setShowClouds] = useState(initialShowClouds);
  
  // Map setup component - runs after map is initialized
  const MapSetup = () => {
    const mapInstance = useMap();
    
    useEffect(() => {
      // First assign the map
      setMap(mapInstance);
      
      // If fullscreen, invalidate size after a small delay to ensure proper sizing
      if (fullscreen) {
        const timer = setTimeout(() => {
          mapInstance.invalidateSize();
        }, 100);
        return () => clearTimeout(timer);
      }
    }, [mapInstance]);
    
    useEffect(() => {
      // Initialize the precipitation and clouds layers with their initial values
      if (map) {
        if (initialShowPrecipitation) {
          setShowPrecipitation(true);
        }
        if (initialShowClouds) {
          setShowClouds(true);
        }
      }
    }, [map, initialShowPrecipitation, initialShowClouds]);

    return null;
  };

  // Custom icon URL based on marker color
  const getMarkerIconUrl = () => {
    // Default to blue marker if the requested color isn't available
    if (markerColor === 'red') return '/marker-icon-red.png';
    if (markerColor === 'green') return '/marker-icon-green.png';
    if (markerColor === 'gold') return '/marker-icon-gold.png';
    return '/marker-icon.png'; // default blue
  };
  
  // Icon definition (must be inside client-only section)
  const icon = L.icon({
    iconUrl: getMarkerIconUrl(),
    shadowUrl: '/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  const coordinates = [race.location.coordinates.lat, race.location.coordinates.lng] as [number, number];
  
  // Get map tile URL and attribution based on selected style
  const getMapTileConfig = () => {
    switch (mapStyle) {
      case 'dark':
        return {
          url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        };
      case 'light':
        return {
          url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        };
      case 'satellite':
        return {
          url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          attribution: "&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
        };
      case 'terrain':
        return {
          url: "https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}{r}.png",
          attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        };
      case 'standard':
      default:
        return {
          url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        };
    }
  };

  const tileConfig = getMapTileConfig();
    
  // Apply darkMode setting if it's specified (overrides mapStyle)
  const tileLayer = darkMode 
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : tileConfig.url;
    
  const tileAttribution = darkMode
    ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    : tileConfig.attribution;

  // Determine map style name for layer control
  const mapStyleName = darkMode ? "Dark Map" : 
    mapStyle.charAt(0).toUpperCase() + mapStyle.slice(1);

  return (
    <MapContainer 
      center={coordinates} 
      zoom={13} 
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={true}
      zoomControl={!fullscreen}
      className={darkMode ? 'dark-map' : ''}
    >
      <MapSetup />
      
      <LayersControl position="topleft">
        <LayersControl.BaseLayer checked name={mapStyleName}>
          <TileLayer
            attribution={tileAttribution}
            url={tileLayer}
          />
        </LayersControl.BaseLayer>
        
        <LayersControl.BaseLayer name="OpenStreetMap">
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
        </LayersControl.BaseLayer>
        
        <LayersControl.BaseLayer name="Dark">
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
        </LayersControl.BaseLayer>
        
        <LayersControl.BaseLayer name="Light">
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
        </LayersControl.BaseLayer>
        
        <LayersControl.BaseLayer name="Satellite">
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution="&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
          />
        </LayersControl.BaseLayer>
        
        <LayersControl.BaseLayer name="Terrain">
          <TileLayer
            url="https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}{r}.png"
            attribution='Map tiles by <a href="http://stamen.com">Stamen Design</a>, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
        </LayersControl.BaseLayer>
        
        <LayersControl.Overlay name="Precipitation" 
          checked={showPrecipitation}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setShowPrecipitation(e.currentTarget.checked)}>
          <TileLayer url="" attribution="" />
        </LayersControl.Overlay>
        
        <LayersControl.Overlay name="Clouds"
          checked={showClouds}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setShowClouds(e.currentTarget.checked)}>
          <TileLayer url="" attribution="" />
        </LayersControl.Overlay>
      </LayersControl>
      
      {/* Always render the overlays, they'll be hidden by map if not active */}
      {map && <WeatherOverlay map={map} type="precipitation" enabled={showPrecipitation} />}
      {map && <WeatherOverlay map={map} type="clouds" enabled={showClouds} />}
      
      <Marker position={coordinates} icon={icon}>
        <Popup>
          <div className="font-semibold">{race.name}</div>
          <div>{race.location.name}</div>
          <div>{race.location.city}, {race.location.country}</div>
        </Popup>
      </Marker>
    </MapContainer>
  );
}

// Create a client-side only component that wraps the map
function TrackMapComponent({ race, height = '400px', fullscreen = false, darkMode = false, mapStyle = 'standard', markerColor = 'blue', showPrecipitation = false, showClouds = false }: TrackMapProps) {
  const containerClasses = fullscreen ? 
    "h-full w-full" : 
    "rounded-lg overflow-hidden shadow-md";
  
  return (
    <div style={{ height, width: '100%' }} className={containerClasses}>
      <LeafletMap 
        race={race} 
        height={height} 
        fullscreen={fullscreen} 
        darkMode={darkMode} 
        mapStyle={mapStyle}
        markerColor={markerColor}
        showPrecipitation={showPrecipitation}
        showClouds={showClouds}
      />
    </div>
  );
}

// Create a loading component for the map
function LoadingMap({ height = '400px', fullscreen = false, darkMode = false }: { height?: string, fullscreen?: boolean, darkMode?: boolean }) {
  const backgroundColor = darkMode ? "bg-gray-900" : "bg-gray-200 dark:bg-gray-700";
  const textColor = darkMode ? "text-gray-400" : "text-gray-500 dark:text-gray-400";
  
  const containerClasses = fullscreen ? 
    `h-full w-full ${backgroundColor}` : 
    `rounded-lg overflow-hidden shadow-md ${backgroundColor}`;
  
  return (
    <div 
      style={{ height, width: '100%' }} 
      className={`${containerClasses} flex items-center justify-center`}
    >
      <div className={textColor}>Loading map...</div>
    </div>
  );
}

// Use dynamic import with NoSSR to ensure this component only loads on the client
const TrackMap = dynamic(() => Promise.resolve(TrackMapComponent), {
  ssr: false,
  loading: ({ error, isLoading, pastDelay }) => {
    if (error) {
      return <div>Error loading map: {error.message}</div>;
    }
    if (isLoading) {
      return <LoadingMap />;
    }
    return null;
  }
});

export default TrackMap; 