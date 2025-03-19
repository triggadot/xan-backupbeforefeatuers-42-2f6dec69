# Sidebar Component

This directory contains a comprehensive sidebar component for React applications. It replaces the older sidebar implementation in `src/components/blocks/sidebar`.

## Features

- Fully responsive design
- Mobile-friendly with sheet implementation
- Collapsible to icon-only mode
- Keyboard shortcut support (Ctrl/Cmd+B)
- Persistent state via cookies
- Various sidebar components for building complex navigation

## Hover Behavior

The sidebar now includes an enhanced hover behavior in collapsed mode:

1. When collapsed, hovering over the sidebar will temporarily expand it to show all labels
2. Moving the mouse away will collapse it back to icon-only mode
3. This provides a better user experience by showing context when needed while maintaining a compact UI

Example with hover effect:

```tsx
function AppSidebar() {
  const [isHovering, setIsHovering] = useState(false)
  const { state } = useSidebar()
  const isExpanded = state === "expanded"
  
  // Show labels on hover or when expanded
  const showLabels = isExpanded || isHovering
  
  return (
    <div 
      className={`transition-width duration-300 ${isExpanded || isHovering ? "w-64" : "w-12"}`}
      onMouseEnter={() => !isExpanded && setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <Sidebar>
        {/* sidebar content */}
      </Sidebar>
    </div>
  )
}
```

## Usage

### Basic Example

```tsx
import { 
  Sidebar, 
  SidebarContent, 
  SidebarHeader, 
  SidebarFooter, 
  SidebarProvider 
} from "@/components/ui/sidebar"

function Layout() {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen">
        <Sidebar>
          <SidebarHeader>
            {/* Your header content */}
          </SidebarHeader>
          <SidebarContent>
            {/* Your sidebar navigation */}
          </SidebarContent>
          <SidebarFooter>
            {/* Your footer content */}
          </SidebarFooter>
        </Sidebar>
        <main className="flex-1">
          {/* Your main content */}
        </main>
      </div>
    </SidebarProvider>
  )
}
```

### Available Components

- `Sidebar`: The main container component
- `SidebarHeader`: Header section of the sidebar
- `SidebarContent`: Main content area of the sidebar
- `SidebarFooter`: Footer section of the sidebar
- `SidebarMenu`: Container for menu items
- `SidebarMenuItem`: Individual menu item
- `SidebarSeparator`: Horizontal separator for dividing sections
- `SidebarInput`: Search input component for sidebars
- `SidebarGroup`: Group container with collapsible functionality
- `SidebarTrigger`: Button to toggle sidebar state

## Migration from old sidebar

If you're migrating from the old sidebar components in `src/components/blocks/sidebar`, use the following mapping:

| Old Component | New Component |
|---------------|---------------|
| `SidebarComponent` | `Sidebar` |
| `SidebarContent` | `SidebarContent` |
| `SidebarGroup` | Use `SidebarHeader`, `SidebarContent`, or just `div` with appropriate styles |
| `SidebarGroupLabel` | Use a heading with styling |
| `SidebarMenuButton` | Use a `Link` or `button` with appropriate styling |
| `SidebarProvider` | `SidebarProvider` |
| `useSidebar().isOpen` | `useSidebar().state === "expanded"` |
| `useSidebar().toggleSidebar()` | `useSidebar().toggleSidebar()` |

The new implementation provides more flexibility and better separation of concerns. 