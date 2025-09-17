'use client';

import { useState } from 'react';
import { RaceEvent } from '../types';
import RaceCard from './RaceCard';

interface RaceListProps {
  races: RaceEvent[];
  isLoading?: boolean;
}

export default function RaceList({ races, isLoading = false }: RaceListProps) {
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  
  const filteredRaces = races.filter(race => {
    const raceDate = new Date(race.date);
    const today = new Date();
    
    if (filter === 'upcoming') {
      return raceDate >= today;
    } else if (filter === 'past') {
      return raceDate < today;
    }
    return true;
  });
  
  // Sort races by date (newest first for past, soonest first for upcoming)
  const sortedRaces = [...filteredRaces].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    
    if (filter === 'past') {
      return dateB.getTime() - dateA.getTime(); // newest first for past events
    }
    return dateA.getTime() - dateB.getTime(); // soonest first for upcoming or all
  });
  
  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mt-4"></div>
          </div>
        ))}
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Race Schedule
        </h1>
        <div className="inline-flex rounded-md shadow-sm">
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium rounded-l-lg border ${
              filter === 'all' 
                ? 'bg-primary text-white border-primary' 
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600'
            }`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium border-t border-b ${
              filter === 'upcoming' 
                ? 'bg-primary text-white border-primary' 
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600'
            }`}
            onClick={() => setFilter('upcoming')}
          >
            Upcoming
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium rounded-r-lg border ${
              filter === 'past' 
                ? 'bg-primary text-white border-primary' 
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600'
            }`}
            onClick={() => setFilter('past')}
          >
            Past
          </button>
        </div>
      </div>
      
      {sortedRaces.length > 0 ? (
        <div className="space-y-4">
          {sortedRaces.map(race => (
            <RaceCard key={race.id} race={race} />
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
          <p className="text-gray-700 dark:text-gray-300">
            No races found for the selected filter.
          </p>
        </div>
      )}
    </div>
  );
} 