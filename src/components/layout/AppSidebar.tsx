import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Package,
  Factory,
  ShoppingCart,
  Boxes,
  Settings,
  LogOut,
  CalendarClock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import { useSidebar } from "./SidebarContext";
import LogoImg from "@/assets/Logo.png";
import { toast } from "sonner";
import { apiRequest } from "@/services/apiConfig";

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
  const navigate = useNavigate();
  const { collapsed, setCollapsed } = useSidebar();
  const [isPermanentlyCollapsed, setIsPermanentlyCollapsed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
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


  
 const handleLogout = async () => {
    // Fermer la modale immédiatement
    setShowLogoutModal(false);
    
    // Afficher le toast de chargement
    toast.loading('Déconnexion en cours...');
    
    try {
      // Appel API logout avec la configuration centralisée
      await apiRequest('/auth/logout', {
        method: 'POST'
      }).catch(() => {
        // Ignorer les erreurs réseau (serveur down, timeout, etc.)
        console.log('API logout non disponible, déconnexion locale uniquement');
      });
    } catch (error) {
      console.log('Erreur API logout (non bloquant):', error);
    }
    
    // Toujours nettoyer le localStorage (même si l'API échoue)
    localStorage.removeItem('erp_auth_token');
    localStorage.removeItem('erp_user_data');
    localStorage.removeItem('erp_session_expires');
    
    // Afficher le toast de succès
    toast.dismiss();
    toast.success('Déconnexion réussie. À bientôt !');
    
    // Rediriger vers login
    setTimeout(() => {
      navigate('/login', { replace: true });
    }, 1000);
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
        {/* Logo PNG */}
        <div className="flex h-20 items-center justify-center px-4 border-b border-sidebar-border">
          <img
            src={LogoImg}
            alt="KLINKOL"
            className={cn(
              "object-contain transition-all duration-300",
              collapsed ? "h-10 w-auto" : "h-12 w-auto"
            )}
          />
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

        {/* Settings & Logout */}
        <div className="border-t border-sidebar-border p-3 space-y-1">
          {/* <NavLink
            to="/parametres"
            className={cn(
              "sidebar-link group",
              location.pathname === "/parametres" && "sidebar-link-active"
            )}
          >
            <Settings className="h-5 w-5 shrink-0 text-sidebar-foreground/70 group-hover:text-sidebar-accent-foreground" />
            {!collapsed && <span>Paramètres</span>}
          </NavLink> */}

          <button
            onClick={() => setShowLogoutModal(true)}
            className="sidebar-link group w-full text-left hover:bg-red-500/10 hover:text-red-500"
          >
            <LogOut className="h-5 w-5 shrink-0 text-sidebar-foreground/70 group-hover:text-red-500" />
            {!collapsed && <span>Déconnexion</span>}
          </button>
        </div>
      </div>

      {/* Modale de confirmation de déconnexion */}
      {showLogoutModal && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setShowLogoutModal(false)}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md">
            <div className="bg-white rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              {/* Header */}
              <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 text-center">
                <div className="w-16 h-16 bg-white/20 rounded-full mx-auto mb-3 flex items-center justify-center">
                  <LogOut className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-white">
                  Confirmer la déconnexion
                </h2>
              </div>

              {/* Content */}
              <div className="p-6">
                <p className="text-center text-gray-600 mb-6">
                  Êtes-vous sûr de vouloir vous déconnecter ?
                </p>

                {/* Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowLogoutModal(false)}
                    className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
                  >
                    Se déconnecter
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </aside>
  );
}