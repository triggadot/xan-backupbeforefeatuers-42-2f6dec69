import { AppSidebar } from "@/components/blocks/whatsapp-sidebar"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/blocks/sidebar"

export function Demo() {
  return (
    <SidebarProvider>
      <div className="flex h-screen">
        <AppSidebar />
        <SidebarInset className="bg-muted/50">
          <div className="rounded-lg border bg-card p-8 shadow">
            <h2 className="text-xl font-semibold">Welcome to the Dashboard</h2>
            <p className="text-muted-foreground">This is the main content area. Use the sidebar to navigate.</p>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
} 