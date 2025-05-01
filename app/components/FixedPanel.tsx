'use client';

import { ReactNode, useState, useEffect, memo } from 'react';

interface FixedPanelProps {
  children: ReactNode;
  width?: string;
  height?: string;
  className?: string;
  title?: string;
}

function FixedPanel({ 
  children, 
  width = '320px',
  height = 'calc(100vh - 64px)',
  className = '',
  title = 'Panel'
}: FixedPanelProps) {
  // For SSR compatibility
  const [mounted, setMounted] = useState(false);
  // For minimized state
  const [isMinimized, setIsMinimized] = useState(false);
  // For mobile view
  const [isMobile, setIsMobile] = useState(false);

  // Toggle minimized state
  const toggleMinimized = () => {
    setIsMinimized(prev => !prev);
  };

  // Check if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    setMounted(true);
    checkMobile();
    
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!mounted) {
    return null; // Prevent rendering during SSR
  }

  // On mobile, we'll use a different layout
  if (isMobile) {
    return (
      <div 
        className={`fixed bottom-0 left-0 right-0 bg-gray-900/90 shadow-xl z-10 overflow-hidden ${className}`}
        style={{ 
          height: isMinimized ? '40px' : '60vh',
          transition: 'height 0.3s'
        }}
      >
        {/* Panel controls in header */}
        <div className="absolute top-0 right-2 flex items-center h-10 z-20">
          <button 
            onClick={toggleMinimized} 
            className="text-gray-400 hover:text-white p-1"
            title={isMinimized ? "Expand" : "Minimize"}
          >
            {isMinimized ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </button>
        </div>

        {/* Actual content */}
        <div className={`flex flex-col h-full ${isMinimized ? 'invisible' : 'visible'}`}>
          {children}
        </div>

        {/* Minimized view */}
        {isMinimized && (
          <div className="w-full h-full flex items-center justify-center px-2 truncate">
            <span className="text-white text-sm font-medium">{title}</span>
          </div>
        )}
      </div>
    );
  }

  // Desktop layout - fixed on the right side
  return (
    <div 
      className={`fixed top-16 right-0 bg-gray-900/90 shadow-xl z-10 overflow-hidden ${className}`}
      style={{ 
        width: isMinimized ? '200px' : isMobile ? '100%' : width, 
        height: isMinimized ? '40px' : height,
        transition: 'width 0.3s, height 0.3s'
      }}
    >
      {/* Panel controls in header */}
      <div className="absolute top-0 right-2 flex items-center h-10 z-20">
        <button 
          onClick={toggleMinimized} 
          className="text-gray-400 hover:text-white p-1"
          title={isMinimized ? "Expand" : "Minimize"}
        >
          {isMinimized ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </button>
      </div>

      {/* Actual content */}
      <div className={`flex flex-col h-full ${isMinimized ? 'invisible' : 'visible'}`}>
        {children}
      </div>

      {/* Minimized view */}
      {isMinimized && (
        <div className="w-full h-full flex items-center justify-center px-2 truncate">
          <span className="text-white text-sm font-medium">{title}</span>
        </div>
      )}
    </div>
  );
}

// Memoize the component to prevent unnecessary re-renders
export default memo(FixedPanel); 