'use client';

import { RaceEvent } from '../types';
// This component intentionally focuses on textual track information,
// not rendering a mini map to keep the panel lightweight.

interface TrackInfoProps {
  race: RaceEvent;
}

export default function TrackInfo({ race }: TrackInfoProps) {
  const track = race.track;
  const hasCoords = Boolean(race.location?.coordinates);
  const coords = race.location?.coordinates;
  const mapsUrl = hasCoords 
    ? `https://www.google.com/maps/search/?api=1&query=${coords!.lat},${coords!.lng}`
    : undefined;
  
  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900">
      <div className="p-3 md:p-4 border-b border-gray-800 sticky top-0 bg-gray-900/90 backdrop-blur text-sm md:text-base">
        <h3 className="font-semibold">Track details</h3>
      </div>
      <div className="p-3 md:p-4 grid grid-cols-2 gap-3 text-xs md:text-sm">
        <div className="col-span-2">
          <div className="text-gray-400">Venue</div>
          <div className="font-medium">{race.location.name}</div>
          <div className="text-gray-400 text-[0.9em]">{race.location.city}, {race.location.country}</div>
        </div>
        {track?.lengthKm !== undefined && (
          <div>
            <div className="text-gray-400">Length</div>
            <div className="font-medium">{track.lengthKm.toFixed(1)} km</div>
          </div>
        )}
        {track?.turns !== undefined && (
          <div>
            <div className="text-gray-400">{race.series === 'wrc' ? 'Stages' : 'Turns'}</div>
            <div className="font-medium">{track.turns}</div>
          </div>
        )}
        {track?.elevationChangeM !== undefined && (
          <div>
            <div className="text-gray-400">Elevation</div>
            <div className="font-medium">{track.elevationChangeM} m</div>
          </div>
        )}
        {track?.direction && (
          <div>
            <div className="text-gray-400">Direction</div>
            <div className="font-medium capitalize">{track.direction}</div>
          </div>
        )}
        {track?.lapRecord && (
          <div className="col-span-2">
            <div className="text-gray-400">Lap record</div>
            <div className="font-medium">{track.lapRecord}</div>
          </div>
        )}
        {hasCoords && (
          <div className="col-span-2">
            <div className="text-gray-400">Coordinates</div>
            <div className="font-medium">
              {coords!.lat.toFixed(4)}, {coords!.lng.toFixed(4)}
              {mapsUrl && (
                <a href={mapsUrl} target="_blank" rel="noreferrer noopener" className="ml-2 text-blue-400 hover:text-blue-300 underline">Open in Maps</a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


