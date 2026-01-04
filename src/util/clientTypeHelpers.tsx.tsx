// utils/clientTypeHelpers.tsx
import { 
  Building2, 
  User, 
  Store, 
  Briefcase, 
  ShoppingCart,
  Users,
  Building,
  Factory,
  Home,
  LucideIcon
} from "lucide-react";

interface TypeConfig {
  icon: LucideIcon;
  color: string;
  bgColor: string;
  borderColor: string;
}

// Configuration des types avec leurs icônes et couleurs
export const clientTypeConfig: Record<string, TypeConfig> = {
  // Entreprises
  'entreprise': {
    icon: Building2,
    color: 'text-purple-800',
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-200'
  },
  'sarl': {
    icon: Building,
    color: 'text-indigo-800',
    bgColor: 'bg-indigo-100',
    borderColor: 'border-indigo-200'
  },
  'eurl': {
    icon: Briefcase,
    color: 'text-violet-800',
    bgColor: 'bg-violet-100',
    borderColor: 'border-violet-200'
  },
  'spa': {
    icon: Factory,
    color: 'text-purple-800',
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-200'
  },
  
  // Commerce
  'grossiste': {
    icon: ShoppingCart,
    color: 'text-emerald-800',
    bgColor: 'bg-emerald-100',
    borderColor: 'border-emerald-200'
  },
  'détaillant': {
    icon: Store,
    color: 'text-teal-800',
    bgColor: 'bg-teal-100',
    borderColor: 'border-teal-200'
  },
  'revendeur': {
    icon: Store,
    color: 'text-cyan-800',
    bgColor: 'bg-cyan-100',
    borderColor: 'border-cyan-200'
  },
  
  // Particuliers
  'particulier': {
    icon: User,
    color: 'text-blue-800',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-200'
  },
  'particuliers': {
    icon: Users,
    color: 'text-blue-800',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-200'
  },
  
  // Défaut
  'default': {
    icon: Building2,
    color: 'text-gray-800',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-200'
  }
};

// Fonction pour obtenir la config d'un type (avec protection contre undefined/null)
export const getTypeConfig = (type?: string | null): TypeConfig => {
  // Si type est undefined, null, ou vide, retourner la config par défaut
  if (!type || typeof type !== 'string') {
    return clientTypeConfig['default'];
  }
  
  const normalizedType = type.toLowerCase().trim();
  return clientTypeConfig[normalizedType] || clientTypeConfig['default'];
};

// Fonction pour obtenir l'icône d'un type
export const getTypeIcon = (type?: string | null): LucideIcon => {
  return getTypeConfig(type).icon;
};

// Fonction pour obtenir les classes CSS d'un type
export const getTypeClasses = (type?: string | null): string => {
  const config = getTypeConfig(type);
  return `${config.bgColor} ${config.color} ${config.borderColor}`;
};

// Composant Badge avec icône pour un type de client
interface ClientTypeBadgeProps {
  type?: string | null;
  showIcon?: boolean;
  className?: string;
}

export const ClientTypeBadge = ({ type, showIcon = true, className = "" }: ClientTypeBadgeProps) => {
  const config = getTypeConfig(type);
  const Icon = config.icon;
  const displayType = type || 'Non défini';
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-sm font-medium ${getTypeClasses(type)} ${className}`}>
      {showIcon && <Icon className="h-3.5 w-3.5" />}
      {displayType}
    </span>
  );
};