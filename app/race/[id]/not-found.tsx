'use client';

import Link from 'next/link';

export default function RaceNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
      <h1 className="text-3xl font-bold mb-6">Race Not Found</h1>
      <p className="text-lg mb-8">
        The race you're looking for doesn't exist or has been removed.
      </p>
      <Link 
        href="/"
        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
      >
        Return Home
      </Link>
    </div>
  );
} 