'use client';

import { ReactNode, useState, useEffect, useRef, useCallback, memo } from 'react';
import Draggable from 'react-draggable';

interface DraggablePanelProps {
  children: ReactNode;
  defaultPosition?: { x: number, y: number };
  width?: string;
  height?: string;
  className?: string;
  title?: string;
}

function DraggablePanel({ 
  children, 
  defaultPosition,
  width = '320px',
  height = 'calc(100vh - 64px)',
  className = '',
  title = 'Panel'
}: DraggablePanelProps) {
  // For SSR compatibility
  const [mounted, setMounted] = useState(false);
  // For keeping track of whether the panel is being dragged
  const [isDragging, setIsDragging] = useState(false);
  // For minimized state
  const [isMinimized, setIsMinimized] = useState(false);
  // Create a ref for the Draggable component to fix findDOMNode deprecation
  // Using 'any' type as a temporary workaround for TypeScript compatibility issues with react-draggable
  const nodeRef = useRef<any>(null);
  // Store position in a ref to avoid unnecessary re-renders
  const positionRef = useRef({ x: 0, y: 32 });

  // Toggle minimized state - memoized to avoid recreation between renders
  const toggleMinimized = useCallback(() => {
    setIsMinimized(prev => !prev);
  }, []);

  // Memoized handlers for drag events
  const handleDragStart = useCallback(() => setIsDragging(true), []);
  const handleDragStop = useCallback(() => setIsDragging(false), []);

  useEffect(() => {
    setMounted(true);
    
    // Set default position on the client side
    if (!defaultPosition) {
      positionRef.current = { x: window.innerWidth - 320, y: 32 };
    } else {
      positionRef.current = defaultPosition;
    }
  }, [defaultPosition]);

  if (!mounted) {
    return null; // Prevent rendering during SSR
  }

  return (
    <Draggable
      nodeRef={nodeRef}
      defaultPosition={positionRef.current}
      bounds="parent"
      handle=".drag-handle"
      onStart={handleDragStart}
      onStop={handleDragStop}
    >
      <div 
        ref={nodeRef}
        className={`absolute bg-gray-900/90 shadow-xl rounded-lg z-10 overflow-hidden ${className} ${isDragging ? 'cursor-grabbing' : ''}`}
        style={{ 
          width: isMinimized ? '200px' : width, 
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
          <div className="w-full h-full drag-handle cursor-grab flex items-center justify-center px-2 truncate">
            <span className="text-white text-sm font-medium">{title}</span>
          </div>
        )}
      </div>
    </Draggable>
  );
}

// Memoize the component to prevent unnecessary re-renders
export default memo(DraggablePanel); 