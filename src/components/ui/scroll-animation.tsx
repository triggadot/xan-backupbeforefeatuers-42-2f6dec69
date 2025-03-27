
import React, { useState, useRef, useEffect } from 'react';
import { motion, Variants, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useIntersectionObserver } from '@/hooks/use-intersection-observer';

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
  as?: React.ElementType;
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
    const elementRef = useRef<HTMLDivElement>(null);
    const [observe, isIntersecting, hasIntersected] = useIntersectionObserver({
      threshold,
      rootMargin,
      freezeOnceVisible: once
    });

    // Merge refs
    useEffect(() => {
      if (!elementRef.current) return;
      observe(elementRef.current);
      
      // Handle forwarded ref
      if (typeof forwardedRef === 'function') {
        forwardedRef(elementRef.current);
      } else if (forwardedRef) {
        forwardedRef.current = elementRef.current;
      }
    }, [observe, forwardedRef]);

    const Component = motion[as as keyof typeof motion] || motion.div;
    const activeVariants = customVariants || variants[type];

    return (
      <Component
        ref={elementRef}
        className={className}
        initial="hidden"
        animate={isIntersecting || (once && hasIntersected) ? "visible" : "hidden"}
        variants={activeVariants}
        transition={{ duration, delay, ease: "easeOut" }}
        {...rest}
      >
        {children}
      </Component>
    );
  }
);

ScrollAnimation.displayName = 'ScrollAnimation';
