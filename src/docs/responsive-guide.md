# Responsive Design Guide

This guide provides information on how to implement responsive design using our custom components and utilities.

## Breakpoints

We use the following breakpoints, aligned with Tailwind CSS:

- `xs`: 0px (base)
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

## Hooks

### Breakpoint Detection

```tsx
import { useBreakpoint, useActiveBreakpoint } from '@/hooks/use-mobile';

// Check if viewport is below a specific breakpoint
const isMobile = useBreakpoint('md');

// Get the current active breakpoint
const currentBreakpoint = useActiveBreakpoint();
```

### Responsive Values

```tsx
import { useResponsiveValue } from '@/hooks/use-responsive';

// Get a value based on the current breakpoint
const padding = useResponsiveValue({
  xs: 4,
  md: 8,
  lg: 12,
  base: 4 // Fallback value
});
```

## Components

### Responsive Container

```tsx
import { Container } from '@/components/ui/container';

// Basic usage with default settings
<Container>
  Content here
</Container>

// Customized container
<Container
  maxWidth={{ sm: true, md: true, lg: true }}
  padding={{ x: 4, y: { xs: 4, lg: 8 } }}
  mobileBottomSpace={true}
>
  Content here
</Container>
```

### Responsive Grid

```tsx
import { ResponsiveGrid, GridItem } from '@/components/ui/responsive-grid';

<ResponsiveGrid
  columns={{ xs: 1, sm: 2, md: 3, lg: 4 }}
  gap={4}
  animate={true}
>
  <GridItem>Card 1</GridItem>
  <GridItem>Card 2</GridItem>
  <GridItem>Card 3</GridItem>
</ResponsiveGrid>
```

### Responsive Split Button Dropdown

```tsx
import { SplitButtonDropdown } from '@/components/custom/SplitButtonDropdown';
import { Home } from 'lucide-react';

// Basic usage
<SplitButtonDropdown
  options={[
    { label: 'Option 1', value: 'option1' },
    { label: 'Option 2', value: 'option2', description: 'Description here' },
    { 
      label: 'Option 3', 
      value: 'option3', 
      description: 'With icon',
      icon: <Home size={18} />
    }
  ]}
  placeholder="Select an option"
  onSelectionChange={(value, option) => console.log(value, option)}
/>

// Mobile-optimized compact view
<SplitButtonDropdown
  options={options}
  compactOnMobile={true}
  className="w-full sm:w-auto"
  placeholder="Mobile friendly"
/>

// With size variants
<SplitButtonDropdown
  options={options}
  size="sm" // 'sm', 'default', or 'lg'
  buttonWidth="w-48"
  placeholder="Small variant"
/>
```

The SplitButtonDropdown has the following responsive features:
- Adapts to screen size with appropriate spacing and touch targets
- Optional compact mobile view that changes to a single button on small screens
- Touch-friendly interactions with appropriate sizing
- Support for icons in dropdown items
- Responsive sizing with truncation for long text

### Responsive Images

```tsx
import { ResponsiveImage, ResponsiveBackgroundImage } from '@/components/ui/responsive-image';

// Image that changes source based on screen size
<ResponsiveImage
  sources={{
    xs: '/images/small.jpg',
    md: '/images/medium.jpg',
    lg: '/images/large.jpg'
  }}
  src="/images/fallback.jpg"
  alt="Responsive image"
  lazy={true}
  fill={true}
/>

// Background image with responsive sources
<ResponsiveBackgroundImage
  sources={{
    xs: '/images/bg-mobile.jpg',
    lg: '/images/bg-desktop.jpg'
  }}
  src="/images/bg-fallback.jpg"
  className="h-64 w-full"
  overlay={true}
>
  Content on top of background
</ResponsiveBackgroundImage>
```

### Conditional Rendering

```tsx
import { ShowAt, HideAt } from '@/hooks/use-responsive';

// Show only on mobile devices (below md breakpoint)
<ShowAt breakpoint="md" below>
  Mobile content
</ShowAt>

// Hide on mobile devices
<HideAt breakpoint="md" below>
  Desktop content
</HideAt>

// Show only at specific breakpoint
<ShowAt breakpoint="lg">
  Large screen content
</ShowAt>

// Show only above a specific breakpoint
<ShowAt breakpoint="lg" above>
  Content for large screens and up
</ShowAt>
```

### Mobile Navigation

```tsx
import { MobileNav } from '@/components/ui/mobile-nav';
import { Home, User, Settings } from 'lucide-react';

const navItems = [
  { icon: <Home className="h-5 w-5" />, label: 'Home', href: '/' },
  { icon: <User className="h-5 w-5" />, label: 'Profile', href: '/profile' },
  { icon: <Settings className="h-5 w-5" />, label: 'Settings', href: '/settings' },
];

<MobileNav items={navItems} />
```

## CSS Utility Classes

### Touch-Friendly Elements

Apply these utility classes to improve touch interactions:

```tsx
<button className="touch-manipulation active:scale-95 transition-transform">
  Touch-friendly button
</button>
```

### Responsive Spacing

Adjust padding and margins based on screen size:

```tsx
<div className="p-4 sm:p-6 lg:p-8">
  Content with responsive padding
</div>
```

### Responsive Typography

Adjust font sizes based on screen size:

```tsx
<h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl">
  Responsive Heading
</h1>
```

## Best Practices

1. **Mobile-First Approach**
   - Always start with mobile layout and enhance for larger screens
   - Use the default Tailwind breakpoint modifiers (`sm:`, `md:`, etc.)
   - Define base styles without breakpoint prefixes

2. **Touch Target Sizes**
   - Make interactive elements at least 44×44px on mobile
   - Add sufficient spacing between touch targets (minimum 8px)
   - Use `touch-manipulation` for better touch responses
   - Add visual feedback with `active:scale-95` or similar effects

3. **Performance**
   - Use lazy-loading for images with the `<ResponsiveImage>` component
   - Use appropriately sized images for different screen sizes
   - Minimize layout shifts with proper placeholder strategies
   - Consider using skeleton loaders for content that takes time to load

4. **Adaptable UI**
   - Use different layouts for different screen sizes where appropriate
   - Consider using the compact view for complex components on mobile
   - Simplify navigation on small screens
   - Use the `compactOnMobile` prop for supported components 

5. **Testing**
   - Test on real devices when possible
   - Test with touch interactions, not just mouse
   - Use browser dev tools to test various screen sizes
   - Check for layout issues when scaling between breakpoints

6. **Accessibility**
   - Ensure touch targets are large enough for users with motor disabilities
   - Maintain sufficient color contrast at all screen sizes
   - Test keyboard navigation on all screen sizes
   - Use appropriate ARIA attributes for interactive components 