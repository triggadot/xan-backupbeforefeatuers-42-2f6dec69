import { useState, useEffect, useCallback } from 'react';

/**
 * Hook for detecting when an element intersects with the viewport
 * 
 * This hook uses the Intersection Observer API to detect when an element
 * enters or leaves the viewport. It provides a ref callback to attach to
 * the element you want to observe, and returns the intersection state.
 * 
 * @param {Object} options - Configuration options
 * @param {number} options.threshold - Percentage of element visibility required to trigger (0-1)
 * @param {string} options.rootMargin - Margin around the root element
 * @param {boolean} options.freezeOnceVisible - Whether to stop observing once element becomes visible
 * @returns {[Function, boolean, boolean]} - [ref callback, isIntersecting, hasIntersected]
 * 
 * @example
 * ```tsx
 * const [ref, isVisible, hasBeenVisible] = useIntersectionObserver();
 * 
 * return (
 *   <div ref={ref}>
 *     {isVisible ? 'Element is visible' : 'Element is not visible'}
 *   </div>
 * );
 * ```
 */
export function useIntersectionObserver({
  threshold = 0.1,
  rootMargin = '0px',
  freezeOnceVisible = false,
}: {
  threshold?: number;
  rootMargin?: string;
  freezeOnceVisible?: boolean;
} = {}): [(node: Element) => void, boolean, boolean] {
  const [ref, setRef] = useState<Element | null>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);

  const setElement = useCallback((node: Element | null) => {
    if (node !== null) {
      setRef(node);
    }
  }, []);

  useEffect(() => {
    if (!ref) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isElementIntersecting = entry.isIntersecting;
        setIsIntersecting(isElementIntersecting);
        
        // Set hasIntersected to true if it's intersecting for the first time
        if (isElementIntersecting && !hasIntersected) {
          setHasIntersected(true);
        }
        
        // Unobserve after it becomes visible if freezeOnceVisible is true
        if (freezeOnceVisible && isElementIntersecting) {
          observer.unobserve(entry.target);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(ref);
    return () => observer.disconnect();
  }, [ref, threshold, rootMargin, freezeOnceVisible, hasIntersected]);

  return [setElement, isIntersecting, hasIntersected];
}
