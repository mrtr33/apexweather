'use client';

import { useEffect, useState } from 'react';
import { notFound, useParams } from 'next/navigation';
import { getSeriesById } from '@/app/lib/sampleData';
import { SeriesData } from '@/app/types';
import RaceList from '@/app/components/RaceList';

export default function SeriesPage() {
  const params = useParams();
  const seriesId = params.id as string;
  const [seriesData, setSeriesData] = useState<SeriesData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API fetch with a small delay to show loading state
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // In a real app, this would be an API call
        const data = getSeriesById(seriesId);
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        if (!data) {
          notFound();
        }
        
        setSeriesData(data);
      } catch (error) {
        console.error('Failed to fetch series data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [seriesId]);

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-6"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-8"></div>
        <RaceList races={[]} isLoading={true} />
      </div>
    );
  }

  if (!seriesData) {
    return notFound();
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {seriesData.name}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {seriesData.currentSeason} Season · {seriesData.races.length} Races
        </p>
      </div>

      <RaceList races={seriesData.races} />
    </div>
  );
} 