
import { GlideSidebar } from "@/components/blocks/GlideSidebar"
import {
  SidebarContent,
  SidebarProvider,
} from "@/components/ui/sidebar"

export function Demo() {
  return (
    <SidebarProvider>
      <div className="flex h-screen">
        <GlideSidebar />
        <SidebarContent className="flex-1 p-6 bg-muted/50">
          <div className="rounded-lg border bg-card p-8 shadow">
            <h2 className="text-xl font-semibold">Welcome to the Dashboard</h2>
            <p className="text-muted-foreground">This is the main content area. Use the sidebar to navigate.</p>
          </div>
        </SidebarContent>
      </div>
    </SidebarProvider>
  )
} 
