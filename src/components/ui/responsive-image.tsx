import { Skeleton } from '@/components/ui/skeleton';
import { BREAKPOINTS } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import React, { useEffect, useState } from 'react';

interface ResponsiveImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  /**
   * Alternative sources for different screen sizes
   */
  sources?: {
    xs?: string;
    sm?: string;
    md?: string;
    lg?: string;
    xl?: string;
    "2xl"?: string;
  };
  /**
   * Main image source (fallback)
   */
  src: string;
  /**
   * Whether to show a placeholder while loading
   */
  showPlaceholder?: boolean;
  /**
   * Whether to use lazy loading
   */
  lazy?: boolean;
  /**
   * Whether the image should fill its container
   */
  fill?: boolean;
  /**
   * Object fit property when fill is true
   */
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  /**
   * Object position when fill is true
   */
  objectPosition?: string;
  /**
   * Whether to use blur effects during load
   */
  blurEffect?: boolean;
}

/**
 * A responsive image component that optimizes image loading
 * and supports different images for different screen sizes
 */
export function ResponsiveImage({
  sources,
  src,
  alt = '',
  className,
  showPlaceholder = true,
  lazy = true,
  fill = false,
  objectFit = 'cover',
  objectPosition = 'center',
  blurEffect = true,
  ...props
}: ResponsiveImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [currentSrc, setCurrentSrc] = useState(src);
  
  // Handle responsive source selection
  useEffect(() => {
    const updateSource = () => {
      if (!sources) return;
      
      const width = window.innerWidth;
      
      if (width >= BREAKPOINTS["2xl"] && sources["2xl"]) {
        setCurrentSrc(sources["2xl"]);
      } else if (width >= BREAKPOINTS.xl && sources.xl) {
        setCurrentSrc(sources.xl);
      } else if (width >= BREAKPOINTS.lg && sources.lg) {
        setCurrentSrc(sources.lg);
      } else if (width >= BREAKPOINTS.md && sources.md) {
        setCurrentSrc(sources.md);
      } else if (width >= BREAKPOINTS.sm && sources.sm) {
        setCurrentSrc(sources.sm);
      } else if (sources.xs) {
        setCurrentSrc(sources.xs);
      } else {
        setCurrentSrc(src); // Fallback to default
      }
    };
    
    updateSource();
    window.addEventListener('resize', updateSource);
    
    return () => window.removeEventListener('resize', updateSource);
  }, [sources, src]);
  
  // Handle image load
  const handleLoad = () => {
    setIsLoading(false);
  };
  
  return (
    <div className={cn(
      "relative",
      fill && "w-full h-full",
      isLoading && blurEffect && "overflow-hidden",
      className
    )}>
      {isLoading && showPlaceholder && (
        <Skeleton 
          className={cn(
            "absolute inset-0 z-0",
            !fill && "w-full h-full"
          )} 
        />
      )}
      
      <img
        src={currentSrc}
        alt={alt}
        loading={lazy ? "lazy" : undefined}
        onLoad={handleLoad}
        className={cn(
          "max-w-full transition-opacity duration-300",
          fill && "w-full h-full absolute top-0 left-0",
          fill && `object-${objectFit}`,
          objectPosition && fill && `object-${objectPosition}`,
          isLoading ? "opacity-0" : "opacity-100",
          blurEffect && !isLoading && "animate-scale-in",
        )}
        {...props}
      />
    </div>
  );
}

/**
 * A specialized component for background images that adapts to screen sizes
 */
export function ResponsiveBackgroundImage({
  sources,
  src,
  className,
  children,
  overlay = false,
  overlayColor = "bg-black/40",
}: ResponsiveImageProps & {
  children?: React.ReactNode;
  overlay?: boolean;
  overlayColor?: string;
}) {
  const [currentSrc, setCurrentSrc] = useState(src);
  
  // Handle responsive source selection
  useEffect(() => {
    const updateSource = () => {
      if (!sources) return;
      
      const width = window.innerWidth;
      
      if (width >= BREAKPOINTS["2xl"] && sources["2xl"]) {
        setCurrentSrc(sources["2xl"]);
      } else if (width >= BREAKPOINTS.xl && sources.xl) {
        setCurrentSrc(sources.xl);
      } else if (width >= BREAKPOINTS.lg && sources.lg) {
        setCurrentSrc(sources.lg);
      } else if (width >= BREAKPOINTS.md && sources.md) {
        setCurrentSrc(sources.md);
      } else if (width >= BREAKPOINTS.sm && sources.sm) {
        setCurrentSrc(sources.sm);
      } else if (sources.xs) {
        setCurrentSrc(sources.xs);
      } else {
        setCurrentSrc(src); // Fallback to default
      }
    };
    
    updateSource();
    window.addEventListener('resize', updateSource);
    
    return () => window.removeEventListener('resize', updateSource);
  }, [sources, src]);
  
  return (
    <div
      className={cn(
        "relative bg-cover bg-center bg-no-repeat",
        className
      )}
      style={{ backgroundImage: `url('${currentSrc}')` }}
    >
      {overlay && (
        <div className={cn(
          "absolute inset-0",
          overlayColor
        )} />
      )}
      <div className="relative">{children}</div>
    </div>
  );
} 