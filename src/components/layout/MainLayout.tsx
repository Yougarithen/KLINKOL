// src/components/MainLayout.tsx
import { AppSidebar } from "./AppSidebar";
import { cn } from "@/lib/utils";
import { SidebarProvider, useSidebar } from "./SidebarContext";

interface MainLayoutProps {
  children: React.ReactNode;
}

function MainLayoutContent({ children }: MainLayoutProps) {
  const { collapsed } = useSidebar();

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <main
        className={cn(
          "min-h-screen transition-all duration-300 ease-in-out",
          collapsed ? "ml-20" : "ml-64"
        )}
      >
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <SidebarProvider>
      <MainLayoutContent>{children}</MainLayoutContent>
    </SidebarProvider>
  );
}