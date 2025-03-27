
import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';

type GridDensity = 'loose' | 'normal' | 'tight';
type GridResponsiveness = 'adaptive' | 'fixed';

interface ResponsiveGridProps extends React.HTMLAttributes<HTMLDivElement> {
  columns?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: {
    x?: number;
    y?: number;
  } | number;
  density?: GridDensity;
  type?: GridResponsiveness;
  animate?: boolean;
  staggerChildren?: boolean;
  staggerDelay?: number;
}

const columnDefaults = {
  xs: 1,
  sm: 2,
  md: 3,
  lg: 3,
  xl: 4,
};

const densityMap: Record<GridDensity, string> = {
  loose: 'gap-8',
  normal: 'gap-6',
  tight: 'gap-4',
};

export const ResponsiveGrid = forwardRef<HTMLDivElement, ResponsiveGridProps>(
  ({ 
    children, 
    className, 
    columns = columnDefaults, 
    gap, 
    density = 'normal', 
    type = 'adaptive',
    animate = false,
    staggerChildren = false,
    staggerDelay = 0.05,
    ...props 
  }, ref) => {
    // Determine the gap classes
    let gapClasses = '';
    if (typeof gap === 'number') {
      gapClasses = `gap-${gap}`;
    } else if (gap) {
      const xGap = gap.x !== undefined ? `gap-x-${gap.x}` : '';
      const yGap = gap.y !== undefined ? `gap-y-${gap.y}` : '';
      gapClasses = `${xGap} ${yGap}`.trim();
    } else {
      gapClasses = densityMap[density];
    }

    // Determine grid-template-columns classes based on responsive breakpoints
    const columnsClasses = type === 'adaptive' 
      ? `grid-cols-${columns.xs || 1} sm:grid-cols-${columns.sm || 2} md:grid-cols-${columns.md || 3} lg:grid-cols-${columns.lg || 3} xl:grid-cols-${columns.xl || 4}`
      : `grid-cols-${columns.xs || 1}`;

    const baseClasses = `grid ${gapClasses} ${columnsClasses}`;

    if (animate) {
      const containerVariants = {
        hidden: { opacity: 0 },
        visible: { 
          opacity: 1,
          transition: { 
            staggerChildren: staggerChildren ? staggerDelay : 0 
          }
        }
      };

      const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { 
          opacity: 1, 
          y: 0,
          transition: { type: 'spring', stiffness: 100, damping: 10 }
        }
      };

      // Create a new array of children with motion.div wrappers if animate is true
      const animatedChildren = React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) return child;
        
        return (
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: staggerChildren ? index * staggerDelay : 0 }}
          >
            {child}
          </motion.div>
        );
      });

      return (
        <motion.div
          ref={ref}
          className={cn(baseClasses, className)}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          {...props as HTMLMotionProps<"div">}
        >
          {animatedChildren}
        </motion.div>
      );
    }

    return (
      <div 
        ref={ref}
        className={cn(baseClasses, className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

ResponsiveGrid.displayName = 'ResponsiveGrid';

// Item component to be used within the grid
export const GridItem = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("h-full w-full", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GridItem.displayName = 'GridItem';
