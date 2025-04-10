import { cn } from '@/lib/utils';
import React from 'react';

type GridDensity = 'loose' | 'normal' | 'tight';
type GridResponsiveness = 'adaptive' | 'fixed';

type Breakpoints = {
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
  '2xl'?: number;
};

interface ResponsiveGridProps extends React.HTMLAttributes<HTMLDivElement> {
  columns: Breakpoints;
  gap?: number | Breakpoints;
  children: React.ReactNode;
}

interface GridItemProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  span?: number | Breakpoints;
}

/**
 * A responsive grid component that allows for different column counts at different breakpoints
 */
export function ResponsiveGrid({
  columns,
  gap = 4,
  className,
  children,
  ...props
}: ResponsiveGridProps) {
  // Convert gap to class names
  const gapClasses = typeof gap === 'number' 
    ? `gap-${gap}` 
    : [
        gap.xs && `gap-${gap.xs}`,
        gap.sm && `sm:gap-${gap.sm}`,
        gap.md && `md:gap-${gap.md}`,
        gap.lg && `lg:gap-${gap.lg}`,
        gap.xl && `xl:gap-${gap.xl}`,
        gap['2xl'] && `2xl:gap-${gap['2xl']}`,
      ].filter(Boolean).join(' ');

  // Convert columns to grid-template-columns class names
  const colClasses = [
    columns.xs && `grid-cols-${columns.xs}`,
    columns.sm && `sm:grid-cols-${columns.sm}`,
    columns.md && `md:grid-cols-${columns.md}`,
    columns.lg && `lg:grid-cols-${columns.lg}`,
    columns.xl && `xl:grid-cols-${columns.xl}`,
    columns['2xl'] && `2xl:grid-cols-${columns['2xl']}`,
  ].filter(Boolean).join(' ');

  return (
    <div
      className={cn('grid', colClasses, gapClasses, className)}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * A grid item that can span multiple columns
 */
export function GridItem({
  span,
  className,
  children,
  ...props
}: GridItemProps) {
  // Convert span to class names
  const spanClasses = 
    !span ? '' :
    typeof span === 'number'
      ? `col-span-${span}`
      : [
          span.xs && `col-span-${span.xs}`,
          span.sm && `sm:col-span-${span.sm}`,
          span.md && `md:col-span-${span.md}`,
          span.lg && `lg:col-span-${span.lg}`,
          span.xl && `xl:col-span-${span.xl}`,
          span['2xl'] && `2xl:col-span-${span['2xl']}`,
        ].filter(Boolean).join(' ');

  return (
    <div className={cn(spanClasses, className)} {...props}>
      {children}
    </div>
  );
}
