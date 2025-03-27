
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
  as?: keyof typeof motion;
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
    const [observe, isIntersecting, hasIntersected] = useIntersectionObserver({
      threshold,
      rootMargin,
      freezeOnceVisible: once
    });

    // Set up the intersection observer
    useEffect(() => {
      if (!internalRef.current) return;
      observe(internalRef.current);
    }, [observe]);

    // Handle forwarded ref
    useEffect(() => {
      if (typeof forwardedRef === 'function') {
        forwardedRef(internalRef.current);
      } else if (forwardedRef) {
        forwardedRef.current = internalRef.current;
      }
    }, [forwardedRef]);

    // Create the motion component based on the 'as' prop
    const MotionComponent = motion[as];
    const activeVariants = customVariants || variants[type];

    return (
      <MotionComponent
        ref={internalRef}
        className={className}
        initial="hidden"
        animate={isIntersecting || (once && hasIntersected) ? "visible" : "hidden"}
        variants={activeVariants}
        transition={{ duration, delay, ease: "easeOut" }}
        {...rest}
      >
        {children}
      </MotionComponent>
    );
  }
);

ScrollAnimation.displayName = 'ScrollAnimation';
