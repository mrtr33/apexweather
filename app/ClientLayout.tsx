'use client';

import { ReactNode, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Navigation from './components/Navigation';
import { SpeedInsights } from '@vercel/speed-insights/next';

interface ClientLayoutProps {
  children: ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  // Use Next.js usePathname hook for more reliable path detection
  const pathname = usePathname();
  const isRacePage = pathname?.startsWith('/race/') || false;
  
  // Add a class to the body element when on race pages
  useEffect(() => {
    if (isRacePage) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
    
    return () => {
      document.body.classList.remove('dark');
    };
  }, [isRacePage]);

  return (
    <>
      {/* Always show navigation, with different styling based on page type */}
      <Navigation isCompact={isRacePage} darkMode={isRacePage} />
      
      {/* Apply different container styling based on page type */}
      {isRacePage ? (
        // Full-screen layout for race pages
        <main className="w-full h-screen p-0 m-0 overflow-hidden bg-gray-900">
          {children}
        </main>
      ) : (
        // Standard layout for other pages
        <>
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
          <footer className="mt-12 py-6 border-t border-gray-200 dark:border-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <p className="text-center text-sm text-gray-500">
                &copy; {new Date().getFullYear()} ApexWeather. All rights reserved.
              </p>
            </div>
          </footer>
        </>
      )}
      
      {/* Add Vercel Speed Insights */}
      <SpeedInsights />
    </>
  );
} 