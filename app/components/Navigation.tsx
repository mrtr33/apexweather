'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const motorsportSeries = [
  { id: 'f1', name: 'Formula 1', path: '/series/f1' },
  { id: 'wrc', name: 'WRC', path: '/series/wrc' },
  { id: 'motogp', name: 'MotoGP', path: '/series/motogp' },
];

export default function Navigation({ isCompact = false, darkMode = false }: { isCompact?: boolean, darkMode?: boolean }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Use Next.js usePathname hook for more reliable path detection
  const pathname = usePathname();
  const isRacePage = pathname?.startsWith('/race/') || false;
  
  // Use compact mode if explicitly set or if we're on a race page
  const useCompactMode = isCompact || isRacePage;

  // Styling for compact floating navigation with dark mode
  const compactNavClasses = darkMode
    ? "fixed z-50 top-4 left-4 rounded-full bg-gray-900/90 shadow-lg backdrop-blur-sm"
    : "fixed z-50 top-4 left-4 rounded-full bg-white/90 dark:bg-gray-900/90 shadow-lg backdrop-blur-sm";
    
  // Styling for standard navigation with dark mode
  const standardNavClasses = darkMode 
    ? "bg-gray-900 shadow-md"
    : "bg-white dark:bg-gray-900 shadow-md";

  // Dropdown menu colors
  const dropdownBg = darkMode
    ? "bg-gray-800/95 backdrop-blur-sm"
    : "bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm";
    
  const hoverBg = darkMode
    ? "hover:bg-gray-700"
    : "hover:bg-gray-100 dark:hover:bg-gray-800";
    
  const textColor = darkMode
    ? "text-gray-300"
    : "text-gray-700 dark:text-gray-300";
    
  const logoTextColor = darkMode 
    ? "text-white"
    : "text-primary";
  
  return (
    <nav className={useCompactMode ? compactNavClasses : standardNavClasses}>
      <div className={useCompactMode ? "px-3" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"}>
        <div className={`flex justify-between ${useCompactMode ? "h-12" : "h-16"}`}>
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="flex items-center">
                <span className={`font-bold ${logoTextColor} ${useCompactMode ? "text-lg" : "text-xl"}`}>
                  Apex<span className="text-secondary">Weather</span>
                </span>
              </Link>
            </div>
            {!useCompactMode && (
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {motorsportSeries.map((series) => (
                  <Link
                    key={series.id}
                    href={series.path}
                    className={`border-transparent hover:border-primary inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${textColor}`}
                  >
                    {series.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
          
          {/* Mobile menu button or compact menu button */}
          <div className={`flex items-center ${useCompactMode ? "" : "sm:hidden"}`}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`inline-flex items-center justify-center p-2 rounded-md ${textColor} ${hoverBg}`}
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {/* Icon for menu */}
              <svg
                className={`${isMenuOpen ? 'hidden' : 'block'} h-5 w-5`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              {/* Icon for close */}
              <svg
                className={`${isMenuOpen ? 'block' : 'hidden'} h-5 w-5`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile or compact menu */}
      <div 
        className={`${isMenuOpen ? 'block' : 'hidden'} ${useCompactMode ? `absolute top-full left-0 mt-2 rounded-lg shadow-lg ${dropdownBg}` : "sm:hidden"}`}
      >
        <div className="pt-2 pb-3 space-y-1">
          {motorsportSeries.map((series) => (
            <Link
              key={series.id}
              href={series.path}
              className={`block px-4 py-2 text-base font-medium ${textColor} ${hoverBg}`}
              onClick={() => setIsMenuOpen(false)}
            >
              {series.name}
            </Link>
          ))}
          {useCompactMode && (
            <Link
              href="/"
              className={`block px-4 py-2 text-base font-medium ${textColor} ${hoverBg}`}
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
} 