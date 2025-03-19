# Sidebar Component

This directory contains a comprehensive sidebar component for React applications. It replaces the older sidebar implementation in `src/components/blocks/sidebar`.

## Features

- Fully responsive design
- Mobile-friendly with sheet implementation
- Collapsible to icon-only mode
- Keyboard shortcut support (Ctrl/Cmd+B)
- Persistent state via cookies
- Various sidebar components for building complex navigation

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