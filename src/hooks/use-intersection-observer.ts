
import { useEffect, useState, useRef, RefObject } from 'react';

interface UseIntersectionObserverProps {
  threshold?: number;
  root?: Element | null;
  rootMargin?: string;
  freezeOnceVisible?: boolean;
}

export function useIntersectionObserver({
  threshold = 0.1,
  root = null,
  rootMargin = '0px',
  freezeOnceVisible = false,
}: UseIntersectionObserverProps = {}) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const elementRef = useRef<Element | null>(null);

  const frozen = freezeOnceVisible && isIntersecting;

  useEffect(() => {
    // Skip if already observed and frozen
    if (frozen) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isEntryIntersecting = entry.isIntersecting;
        setIsIntersecting(isEntryIntersecting);
        
        if (isEntryIntersecting && !hasIntersected) {
          setHasIntersected(true);
        }
      },
      {
        threshold,
        root,
        rootMargin,
      }
    );

    observerRef.current = observer;

    return () => {
      observer.disconnect();
    };
  }, [threshold, root, rootMargin, frozen, hasIntersected]);

  // Connect the observer to the element when the element changes
  const observe = (element: Element | null) => {
    if (observerRef.current && element) {
      if (elementRef.current) {
        // Disconnect from the previous element
        observerRef.current.unobserve(elementRef.current);
      }
      
      elementRef.current = element;
      observerRef.current.observe(element);
    }
  };

  // Cleanup when component is unmounted
  useEffect(() => {
    return () => {
      if (observerRef.current && elementRef.current) {
        observerRef.current.unobserve(elementRef.current);
      }
    };
  }, []);

  return [observe, isIntersecting, hasIntersected] as const;
}
