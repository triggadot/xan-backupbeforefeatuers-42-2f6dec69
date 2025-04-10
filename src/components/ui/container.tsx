import { Breakpoint } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import React from 'react';

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Maximum width of the container at different breakpoints
   */
  maxWidth?: Partial<Record<Breakpoint, boolean>> & {
    none?: boolean;
    full?: boolean;
  };
  /**
   * Whether to center the container
   */
  center?: boolean;
  /**
   * Padding for different breakpoints
   */
  padding?: {
    x?: number | Partial<Record<Breakpoint, number>>;
    y?: number | Partial<Record<Breakpoint, number>>;
  } | number | Partial<Record<Breakpoint, number>>;
  /**
   * Whether to add space at the bottom for mobile navigation
   */
  mobileBottomSpace?: boolean;
}

/**
 * A responsive container with configurable max-width, padding, and other properties.
 * 
 * @example
 * ```tsx
 * <Container maxWidth={{ xs: true, sm: true, md: true }}>
 *   Content goes here
 * </Container>
 * ```
 */
export function Container({
  children,
  className,
  maxWidth,
  center = true,
  padding = { x: { xs: 4, md: 6, lg: 8 }, y: { xs: 4, md: 6, lg: 8 } },
  mobileBottomSpace = true,
  ...props
}: ContainerProps) {
  // Generate max-width classes
  const maxWidthClasses = maxWidth
    ? Object.entries(maxWidth)
      .filter(([_, value]) => value)
      .map(([breakpoint]) => {
        if (breakpoint === 'none') return '';
        if (breakpoint === 'full') return 'max-w-full';
        if (breakpoint === 'xs') return 'max-w-xs';
        return `${breakpoint}:max-w-${breakpoint}`;
      })
      .filter(Boolean)
      .join(' ')
    : 'max-w-7xl'; // Default max width
  
  // Generate padding classes
  let paddingClasses = '';
  
  if (typeof padding === 'number') {
    paddingClasses = `p-${padding}`;
  } else if (padding && typeof padding === 'object') {
    if ('x' in padding && 'y' in padding) {
      const xPadding = typeof padding.x === 'number'
        ? `px-${padding.x}`
        : padding.x
          ? Object.entries(padding.x)
            .map(([bp, val]) => `${bp === 'xs' ? '' : bp + ':'}px-${val}`)
            .join(' ')
          : '';
      
      const yPadding = typeof padding.y === 'number'
        ? `py-${padding.y}`
        : padding.y
          ? Object.entries(padding.y)
            .map(([bp, val]) => `${bp === 'xs' ? '' : bp + ':'}py-${val}`)
            .join(' ')
          : '';
      
      paddingClasses = `${xPadding} ${yPadding}`.trim();
    } else {
      // Handle responsive padding object
      paddingClasses = Object.entries(padding)
        .map(([bp, val]) => `${bp === 'xs' ? '' : bp + ':'}p-${val}`)
        .join(' ');
    }
  } else {
    paddingClasses = 'px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8';
  }
  
  return (
    <div
      className={cn(
        paddingClasses,
        center && 'mx-auto',
        maxWidthClasses,
        mobileBottomSpace && 'pb-20 md:pb-8',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
} 