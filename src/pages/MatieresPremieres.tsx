// ============================================================
// PAGE MATIÈRES PREMIÈRES MISE À JOUR
// ============================================================

// pages/MatieresPremieres.tsx
import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Plus, 
  AlertTriangle, 
  Package, 
  Loader2, 
  AlertCircle,
  X,
  Filter,
  PackageOpen,
  Beaker,
  Mountain,
  Leaf,
  Sparkles,
  FileText
} from "lucide-react";
import matierePremiereService from "@/services/matierePremiereService";
import { AddMatierePremiereForm } from "@/components/form/AddMatierePremiereForm";

// Type backend
interface MatierePremiere {
  id: string;
  id_matiere: number;
  nom: string;
  typeM: string;
  unite: string;
  stock_actuel: number;
  stock_minimum: number;
  prix_unitaire: number;
  date_creation: string;
}

// Configuration des types de matières
const TYPE_MATIERE_CONFIG: Record<string, { 
  label: string; 
  couleur: string; 
  icon: React.ComponentType<{ className?: string }>;
  bgColor: string;
}> = {
  'EMBALLAGE': {
    label: 'Emballage',
    couleur: 'text-blue-700 border-blue-300',
    bgColor: 'bg-blue-100',
    icon: PackageOpen
  },
  'CHIMIQUE': {
    label: 'Produit Chimique',
    couleur: 'text-purple-700 border-purple-300',
    bgColor: 'bg-purple-100',
    icon: Beaker
  },
  'MINERALE': {
    label: 'Matière Minérale',
    couleur: 'text-amber-700 border-amber-300',
    bgColor: 'bg-amber-100',
    icon: Mountain
  },
  'ORGANIQUE': {
    label: 'Matière Organique',
    couleur: 'text-green-700 border-green-300',
    bgColor: 'bg-green-100',
    icon: Leaf
  },
  'ADDITIF': {
    label: 'Additif',
    couleur: 'text-pink-700 border-pink-300',
    bgColor: 'bg-pink-100',
    icon: Sparkles
  },
  'AUTRE': {
    label: 'Autre',
    couleur: 'text-gray-700 border-gray-300',
    bgColor: 'bg-gray-100',
    icon: FileText
  }
};

const MatieresPremieres = () => {
  const [matieres, setMatieres] = useState<MatierePremiere[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  useEffect(() => {
    fetchMatieres();
  }, []);

  const fetchMatieres = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await matierePremiereService.getAll();
      
      const matieresAvecId = response.data.map((m: any) => ({
        ...m,
        id: m.id_matiere.toString()
      }));
      
      setMatieres(matieresAvecId);
    } catch (err: any) {
      console.error("Erreur:", err);
      setError(err.message || "Impossible de charger les matières");
    } finally {
      setLoading(false);
    }
  };

  // Filtrer les matières par type
  const matieresFiltrees = selectedType
    ? matieres.filter(m => m.typeM === selectedType)
    : matieres;

  const columns = [
    {
      key: "nom",
      header: "Désignation",
      render: (mp: MatierePremiere) => {
        const typeConfig = TYPE_MATIERE_CONFIG[mp.typeM] || TYPE_MATIERE_CONFIG['AUTRE'];
        const IconComponent = typeConfig.icon;
        return (
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${typeConfig.bgColor}`}>
              <IconComponent className={`h-4 w-4 ${typeConfig.couleur.split(' ')[0]}`} />
            </div>
            <div>
              <p className="font-medium">{mp.nom}</p>
              <p className="text-xs text-muted-foreground">{typeConfig.label}</p>
            </div>
          </div>
        );
      },
    },
    {
      key: "typeM",
      header: "Type",
      render: (mp: MatierePremiere) => {
        const typeConfig = TYPE_MATIERE_CONFIG[mp.typeM] || TYPE_MATIERE_CONFIG['AUTRE'];
        const IconComponent = typeConfig.icon;
        return (
          <Badge variant="outline" className={`${typeConfig.bgColor} ${typeConfig.couleur} font-medium gap-1.5`}>
            <IconComponent className="h-3.5 w-3.5" />
            <span>{typeConfig.label}</span>
          </Badge>
        );
      },
    },
    {
      key: "stock_actuel",
      header: "Stock Actuel",
      render: (mp: MatierePremiere) => {
        const isLow = mp.stock_actuel < mp.stock_minimum;
        const percentage = mp.stock_minimum > 0 
          ? (mp.stock_actuel / (mp.stock_minimum * 2)) * 100 
          : 50;

        return (
          <div className="space-y-1.5 min-w-[180px]">
            <div className="flex items-center justify-between text-sm">
              <span className={isLow ? "text-destructive font-medium" : "font-medium"}>
                {mp.stock_actuel.toLocaleString()} {mp.unite}
              </span>
              {isLow && <AlertTriangle className="h-4 w-4 text-destructive" />}
            </div>
            <Progress
              value={Math.min(percentage, 100)}
              className={`h-2 ${
                isLow
                  ? "[&>div]:bg-destructive"
                  : percentage < 60
                  ? "[&>div]:bg-orange-400"
                  : "[&>div]:bg-success"
              }`}
            />
            <p className="text-xs text-muted-foreground">
              Seuil minimum: {mp.stock_minimum} {mp.unite}
            </p>
          </div>
        );
      },
    },
    {
      key: "prix_unitaire",
      header: "Prix Unitaire",
      render: (mp: MatierePremiere) => (
        <span>
          {mp.prix_unitaire 
            ? new Intl.NumberFormat("fr-DZ").format(mp.prix_unitaire)
            : "-"} DZD
        </span>
      ),
    },
    {
      key: "status",
      header: "Statut",
      render: (mp: MatierePremiere) => {
        const isLow = mp.stock_actuel < mp.stock_minimum;
        const percentage = mp.stock_minimum > 0 
          ? (mp.stock_actuel / (mp.stock_minimum * 2)) * 100 
          : 50;

        if (isLow) {
          return (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="h-3 w-3" />
              Critique
            </Badge>
          );
        }
        if (percentage < 60) {
          return (
            <Badge
              variant="outline"
              className="bg-orange-100 text-orange-600 border-orange-600 gap-1"
            >
              <AlertTriangle className="h-3 w-3" />
              Attention
            </Badge>
          );
        }
        return (
          <Badge
            variant="outline"
            className="bg-success/10 text-success border-success/20"
          >
            Normal
          </Badge>
        );
      },
    },
  ];

  // Statistiques
  const stockCritique = matieresFiltrees.filter(m => m.stock_actuel < m.stock_minimum).length;
  const valeurStock = matieresFiltrees.reduce((acc, m) => acc + m.stock_actuel * (m.prix_unitaire || 0), 0);
  const stockTotal = matieresFiltrees.reduce((acc, m) => acc + m.stock_actuel, 0);

  // Comptage par type
  const typesCount = matieres.reduce((acc, m) => {
    acc[m.typeM] = (acc[m.typeM] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Loading
  if (loading && !showAddForm) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Chargement des matières...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Error
  if (error && !showAddForm) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center max-w-md">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Erreur de chargement</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchMatieres}>Réessayer</Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Modal formulaire
  if (showAddForm) {
    return (
      <MainLayout>
        <div className="max-w-3xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Nouvelle matière première</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowAddForm(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <AddMatierePremiereForm
            onSuccess={() => {
              fetchMatieres();
              setShowAddForm(false);
            }}
            onCancel={() => setShowAddForm(false)}
          />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="animate-fade-in">
          <h1 className="text-3xl font-bold tracking-tight text-foreground font-display">
            Matières Premières
          </h1>
          <p className="mt-1 text-muted-foreground">
            Gestion des stocks de matières premières
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchMatieres} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Actualiser
          </Button>
          <Button className="gap-2" onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4" />
            Nouvelle Matière
          </Button>
        </div>
      </div>

      {/* Filtres par type */}
      <div className="mb-6 flex flex-wrap gap-2">
        <Button
          variant={selectedType === null ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedType(null)}
          className="gap-2"
        >
          <Filter className="h-4 w-4" />
          Tous ({matieres.length})
        </Button>
        {Object.entries(TYPE_MATIERE_CONFIG).map(([key, config]) => {
          const count = typesCount[key] || 0;
          if (count === 0) return null;
          const IconComponent = config.icon;
          return (
            <Button
              key={key}
              variant={selectedType === key ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedType(key)}
              className="gap-1.5"
            >
              <IconComponent className="h-4 w-4" />
              <span>{config.label}</span>
              <Badge variant="secondary" className="ml-1">{count}</Badge>
            </Button>
          );
        })}
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Total Références</p>
          <p className="text-2xl font-bold text-foreground">{matieresFiltrees.length}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Stock Critique</p>
          <p className="text-2xl font-bold text-destructive flex items-center gap-2">
            {stockCritique}
            {stockCritique > 0 && <AlertTriangle className="h-5 w-5" />}
          </p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Stock Total</p>
          <p className="text-2xl font-bold text-foreground">
            {stockTotal.toLocaleString()}
          </p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Valeur Stock</p>
          <p className="text-2xl font-bold text-primary">
            {new Intl.NumberFormat("fr-DZ", {
              notation: "compact",
              compactDisplay: "short",
            }).format(valeurStock)} DZD
          </p>
        </div>
      </div>

      {/* Alert */}
      {stockCritique > 0 && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 animate-fade-in">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <div>
            <p className="font-medium text-destructive">
              Attention: {stockCritique} matière(s) en stock critique
            </p>
            <p className="text-sm text-muted-foreground">
              Veuillez procéder au réapprovisionnement rapidement.
            </p>
          </div>
        </div>
      )}

      {/* Table */}
      {matieresFiltrees.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/20">
          <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {selectedType 
              ? `Aucune matière de type ${TYPE_MATIERE_CONFIG[selectedType]?.label}`
              : "Aucune matière première"
            }
          </h3>
          <p className="text-muted-foreground mb-4">
            {selectedType
              ? "Essayez de sélectionner un autre type ou ajoutez une nouvelle matière"
              : "Commencez par ajouter votre première matière première"
            }
          </p>
          {!selectedType && (
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une matière
            </Button>
          )}
        </div>
      ) : (
        <DataTable
          data={matieresFiltrees}
          columns={columns}
          searchPlaceholder="Rechercher une matière..."
          searchKey="nom"
        />
      )}
    </MainLayout>
  );
};

export default MatieresPremieres;