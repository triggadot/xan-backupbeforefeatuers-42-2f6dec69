import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// Sidebar Component
const sidebarVariants = cva(
  "group relative flex h-screen w-full flex-col overflow-hidden border-r bg-background transition-all",
  {
    variants: {
      variant: {
        default: "border-border",
        float: "border-0 shadow-lg",
      },
      collapsible: {
        none: "",
        icon: "data-[state=collapsed]:w-20",
      },
    },
    defaultVariants: {
      variant: "default",
      collapsible: "none",
    },
  }
)

export interface SidebarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof sidebarVariants> {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  (
    {
      className,
      variant,
      collapsible,
      open = true,
      onOpenChange,
      children,
      ...props
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = React.useState(open)
    
    React.useEffect(() => {
      setIsOpen(open)
    }, [open])
    
    const handleOpenChange = (newState: boolean) => {
      setIsOpen(newState)
      onOpenChange?.(newState)
    }
    
    return (
      <div
        className={cn(
          sidebarVariants({ variant, collapsible, className })
        )}
        ref={ref}
        data-state={isOpen ? "expanded" : "collapsed"}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Sidebar.displayName = "Sidebar"

// Sidebar Content Component
export interface SidebarContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export const SidebarContent = React.forwardRef<HTMLDivElement, SidebarContentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex-1 overflow-auto p-4", className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
SidebarContent.displayName = "SidebarContent"

// Sidebar Footer Component
export interface SidebarFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

export const SidebarFooter = React.forwardRef<HTMLDivElement, SidebarFooterProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("border-t p-4", className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
SidebarFooter.displayName = "SidebarFooter"

// Sidebar Group Component
export interface SidebarGroupProps extends React.HTMLAttributes<HTMLDivElement> {}

export const SidebarGroup = React.forwardRef<HTMLDivElement, SidebarGroupProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("space-y-2", className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
SidebarGroup.displayName = "SidebarGroup"

// Sidebar Group Label Component
export interface SidebarGroupLabelProps extends React.HTMLAttributes<HTMLDivElement> {}

export const SidebarGroupLabel = React.forwardRef<HTMLDivElement, SidebarGroupLabelProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("text-xs font-semibold text-muted-foreground", className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
SidebarGroupLabel.displayName = "SidebarGroupLabel"

// Sidebar Group Content Component
export interface SidebarGroupContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export const SidebarGroupContent = React.forwardRef<HTMLDivElement, SidebarGroupContentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("space-y-1", className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
SidebarGroupContent.displayName = "SidebarGroupContent"

// Sidebar Menu Component
export interface SidebarMenuProps extends React.HTMLAttributes<HTMLDivElement> {}

export const SidebarMenu = React.forwardRef<HTMLDivElement, SidebarMenuProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("space-y-1", className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
SidebarMenu.displayName = "SidebarMenu"

// Sidebar Menu Item Component
export interface SidebarMenuItemProps extends React.HTMLAttributes<HTMLDivElement> {}

export const SidebarMenuItem = React.forwardRef<HTMLDivElement, SidebarMenuItemProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("", className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
SidebarMenuItem.displayName = "SidebarMenuItem"

// Sidebar Menu Button Component
const sidebarMenuButtonVariants = cva(
  "group flex w-full items-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
  {
    variants: {
      variant: {
        default: "justify-start gap-2",
        icon: "justify-center",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface SidebarMenuButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof sidebarMenuButtonVariants> {
  asChild?: boolean
}

export const SidebarMenuButton = React.forwardRef<HTMLButtonElement, SidebarMenuButtonProps>(
  (
    { className, variant, asChild = false, ...props },
    ref
  ) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        ref={ref}
        className={cn(sidebarMenuButtonVariants({ variant, className }))}
        {...props}
      />
    )
  }
)
SidebarMenuButton.displayName = "SidebarMenuButton"

// Sidebar Inset Component
export interface SidebarInsetProps extends React.HTMLAttributes<HTMLDivElement> {}

export const SidebarInset = React.forwardRef<HTMLDivElement, SidebarInsetProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex-1 overflow-auto p-6", className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
SidebarInset.displayName = "SidebarInset"

// Re-export the SidebarProvider
export { SidebarProvider } from "./use-sidebar" 