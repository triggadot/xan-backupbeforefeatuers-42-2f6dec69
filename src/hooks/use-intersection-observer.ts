
import { useState, useEffect, useCallback, RefObject } from 'react';

interface UseIntersectionObserverProps {
  threshold?: number;
  rootMargin?: string;
  freezeOnceVisible?: boolean;
}

export function useIntersectionObserver({
  threshold = 0.1,
  rootMargin = '0px',
  freezeOnceVisible = false,
}: UseIntersectionObserverProps = {}): [(node: Element) => void, boolean, boolean] {
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
