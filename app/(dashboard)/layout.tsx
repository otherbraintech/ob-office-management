import { AppSidebar } from "@/components/app-sidebar"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { BellIcon } from "lucide-react"
import { ShiftManager } from "@/components/shift-manager"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 border-b pr-4">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-vertical:h-4 data-vertical:self-auto"
            />
          </div>
          <div className="flex items-center gap-4">
            <ShiftManager />
            <button className="p-2 rounded-full hover:bg-muted relative">
              <BellIcon className="h-5 w-5" />
              <span className="absolute top-1 right-1 flex h-2 w-2 rounded-full bg-red-500"></span>
            </button>
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 relative">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
