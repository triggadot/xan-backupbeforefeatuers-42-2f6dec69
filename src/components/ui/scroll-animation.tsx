import React, { useState, useRef, useEffect } from 'react';
import { motion, Variants, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useIntersectionObserver } from '@/hooks/utils/use-intersection-observer';

type AnimationType = 'fade' | 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right' | 'zoom' | 'none';

interface ScrollAnimationProps extends Omit<HTMLMotionProps<'div'>, 'animate' | 'initial' | 'variants'> {
  type?: AnimationType;
  delay?: number;
  duration?: number;
  threshold?: number;
  rootMargin?: string;
  once?: boolean;
  children: React.ReactNode;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
  customVariants?: Variants;
}

const variants: Record<AnimationType, Variants> = {
  fade: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  },
  'slide-up': {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0 }
  },
  'slide-down': {
    hidden: { opacity: 0, y: -50 },
    visible: { opacity: 1, y: 0 }
  },
  'slide-left': {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0 }
  },
  'slide-right': {
    hidden: { opacity: 0, x: -50 },
    visible: { opacity: 1, x: 0 }
  },
  zoom: {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 }
  },
  none: {
    hidden: {},
    visible: {}
  }
};

export const ScrollAnimation = React.forwardRef<HTMLDivElement, ScrollAnimationProps>(
  ({
    type = 'fade',
    delay = 0,
    duration = 0.5,
    threshold = 0.1,
    rootMargin = '0px',
    once = true,
    children,
    className,
    as = 'div',
    customVariants,
    ...rest
  }, forwardedRef) => {
    const internalRef = useRef<HTMLDivElement>(null);
    const [isIntersecting, setIsIntersecting] = useState(false);
    const [hasIntersected, setHasIntersected] = useState(false);

    // Set up the intersection observer
    useEffect(() => {
      if (!internalRef.current) return;
      
      const observer = new IntersectionObserver(
        ([entry]) => {
          setIsIntersecting(entry.isIntersecting);
          if (entry.isIntersecting) {
            setHasIntersected(true);
            if (once) {
              observer.disconnect();
            }
          }
        },
        { threshold, rootMargin }
      );
      
      observer.observe(internalRef.current);
      
      return () => {
        observer.disconnect();
      };
    }, [threshold, rootMargin, once]);

    // Handle forwarded ref
    useEffect(() => {
      if (typeof forwardedRef === 'function') {
        forwardedRef(internalRef.current);
      } else if (forwardedRef) {
        forwardedRef.current = internalRef.current;
      }
    }, [forwardedRef]);

    // Use the motion component with the correct element type
    const Component = motion[as as keyof typeof motion] || motion.div;
    const activeVariants = customVariants || variants[type];

    // Simplify the component to avoid complex typing issues
    return (
      <motion.div
        ref={internalRef}
        className={className}
        initial="hidden"
        animate={isIntersecting || (once && hasIntersected) ? "visible" : "hidden"}
        variants={activeVariants}
        transition={{ duration, delay, ease: "easeOut" }}
        {...rest}
      >
        {children}
      </motion.div>
    );
  }
);

ScrollAnimation.displayName = 'ScrollAnimation';
