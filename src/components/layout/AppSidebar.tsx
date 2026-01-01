import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Package,
  Factory,
  ShoppingCart,
  Boxes,
  Settings,
  ChevronLeft,
  CalendarClock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import { useSidebar } from "./SidebarContext";
import klinkolLogo from "@/assets/klinkol-logo.png";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Clients", href: "/clients", icon: Users },
  { name: "Matière première", href: "/matieres-premieres", icon: Package },
  { name: "Produits", href: "/produits", icon: Boxes },
  { name: "Production", href: "/production", icon: Factory },
  { name: "Ventes", href: "/ventes", icon: ShoppingCart },
  { name: "Simulation", href: "/simulation", icon: CalendarClock },
];

export function AppSidebar() {
  const location = useLocation();
  const { collapsed, setCollapsed } = useSidebar();
  const [isPermanentlyCollapsed, setIsPermanentlyCollapsed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Auto-collapse après inactivité (5 secondes)
  useEffect(() => {
    if (!isPermanentlyCollapsed && !isHovered) {
      timeoutRef.current = setTimeout(() => {
        setCollapsed(true);
      }, 700);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isPermanentlyCollapsed, isHovered, location.pathname, setCollapsed]);

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (!isPermanentlyCollapsed) {
      setCollapsed(false);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const handleToggleCollapse = () => {
    const newCollapsedState = !collapsed;
    setCollapsed(newCollapsedState);
    setIsPermanentlyCollapsed(newCollapsedState);
  };

  return (
    <aside
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-sidebar transition-all duration-300 ease-in-out",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-sidebar to-sidebar/95 pointer-events-none" />

      <div className="relative flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-20 items-center justify-between px-4 border-b border-sidebar-border">
          <div className={cn("flex items-center gap-3", collapsed && "justify-center w-full")}>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <img
                src={klinkolLogo}
                alt="Klinkol"
                className="h-8 w-auto object-contain"
              />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="font-display text-lg font-bold text-sidebar-foreground">
                  KLINKOL
                </span>
                <span className="text-xs text-sidebar-foreground/60">
                  Gestion de l'usine
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={cn(
                  "sidebar-link group",
                  isActive && "sidebar-link-active"
                )}
              >
                <item.icon className={cn("h-5 w-5 shrink-0", isActive ? "text-primary-foreground" : "text-sidebar-foreground/70 group-hover:text-sidebar-accent-foreground")} />
                {!collapsed && (
                  <span className="truncate">{item.name}</span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Settings & Collapse */}
        <div className="border-t border-sidebar-border p-3 space-y-1">
          <NavLink
            to="/parametres"
            className={cn(
              "sidebar-link group",
              location.pathname === "/parametres" && "sidebar-link-active"
            )}
          >
            <Settings className="h-5 w-5 shrink-0 text-sidebar-foreground/70 group-hover:text-sidebar-accent-foreground" />
            {!collapsed && <span>Paramètres</span>}
          </NavLink>


        </div>
      </div>
    </aside>
  );
}