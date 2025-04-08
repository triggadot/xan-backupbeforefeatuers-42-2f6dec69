import { useState, useEffect } from 'react';

/**
 * Hook to detect if the current viewport is mobile-sized
 * 
 * This hook uses window resize events to determine if the current viewport
 * width is within mobile dimensions (less than or equal to 768px).
 * 
 * @returns {boolean} True if the viewport width is less than or equal to 768px
 * 
 * @example
 * ```tsx
 * const isMobile = useIsMobile();
 * 
 * return (
 *   <div>
 *     {isMobile ? (
 *       <MobileView />
 *     ) : (
 *       <DesktopView />
 *     )}
 *   </div>
 * );
 * ```
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    
    // Initial check
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return isMobile;
}
