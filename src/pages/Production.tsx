// pages/Production.tsx
import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AddProductionForm } from "@/components/form/AddProductionForm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Plus, 
  Factory, 
  Calendar, 
  Clock, 
  Loader2, 
  AlertCircle,
  CalendarDays,
  CalendarRange
} from "lucide-react";
import productionService from "@/services/productionService";

// Type correspondant au backend
interface ProductionRecord {
  id: string;
  id_production: number;
  id_produit: number;
  quantite_produite: number;
  date_production: string;
  operateur: string;
  commentaire: string;
  produit_nom: string;
  unite: string;
}

type PeriodFilter = "all" | "today" | "week" | "month" | "quarter";

const columns = [
  {
    key: "date_production",
    header: "Date",
    render: (prod: ProductionRecord) => (
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <span>{new Date(prod.date_production).toLocaleDateString("fr-FR")}</span>
      </div>
    ),
  },
  {
    key: "id_production",
    header: "N° Production",
    render: (prod: ProductionRecord) => (
      <span className="font-mono text-sm bg-muted px-2 py-1 rounded">
        PROD-{String(prod.id_production).padStart(4, '0')}
      </span>
    ),
  },
  {
    key: "produit_nom",
    header: "Produit",
    render: (prod: ProductionRecord) => (
      <div>
        <p className="font-medium text-foreground">{prod.produit_nom}</p>
        {prod.commentaire && (
          <p className="text-xs text-muted-foreground">
            {prod.commentaire}
          </p>
        )}
      </div>
    ),
  },
  {
    key: "quantite_produite",
    header: "Quantité",
    render: (prod: ProductionRecord) => (
      <div className="flex items-center gap-2">
        <Factory className="h-4 w-4 text-muted-foreground" />
        <span className="font-semibold">
          {prod.quantite_produite.toLocaleString()} {prod.unite}
        </span>
      </div>
    ),
  },
  {
    key: "operateur",
    header: "Opérateur",
    render: (prod: ProductionRecord) => (
      <span className="text-sm text-muted-foreground">
        {prod.operateur || "-"}
      </span>
    ),
  },
  {
    key: "actions",
    header: "Actions",
    render: (prod: ProductionRecord) => (
      <Button variant="outline" size="sm">
        Détails
      </Button>
    ),
  },
];

const Production = () => {
  const [allProductions, setAllProductions] = useState<ProductionRecord[]>([]);
  const [displayedProductions, setDisplayedProductions] = useState<ProductionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("all");

  useEffect(() => {
    fetchProductions();
  }, []);

  // Appliquer le filtre chaque fois qu'il change
  useEffect(() => {
    applyFilter(periodFilter);
  }, [periodFilter, allProductions]);

  const fetchProductions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await productionService.getAll();
      
      const productionsAvecId = response.data.map((p: any) => ({
        ...p,
        id: p.id_production.toString()
      }));
      
      setAllProductions(productionsAvecId);
    } catch (err: any) {
      console.error("Erreur lors du chargement des productions:", err);
      setError(err.message || "Impossible de charger les productions");
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = (filter: PeriodFilter) => {
    if (filter === "all") {
      setDisplayedProductions(allProductions);
      return;
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const filtered = allProductions.filter(p => {
      const prodDate = new Date(p.date_production);
      
      switch (filter) {
        case "today":
          const todayStart = new Date(today);
          todayStart.setHours(0, 0, 0, 0);
          return prodDate >= todayStart;
        
        case "week":
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          return prodDate >= weekAgo;
        
        case "month":
          const monthAgo = new Date(today);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return prodDate >= monthAgo;
        
        case "quarter":
          const quarterAgo = new Date(today);
          quarterAgo.setMonth(quarterAgo.getMonth() - 3);
          return prodDate >= quarterAgo;
        
        default:
          return true;
      }
    });

    setDisplayedProductions(filtered);
  };

  const handleProductionSuccess = () => {
    setIsDialogOpen(false);
    fetchProductions();
  };

  const handleFilterChange = (filter: PeriodFilter) => {
    setPeriodFilter(filter);
  };

  // Calculer les statistiques sur TOUTES les productions (pas filtrées)
  const productionTotal = allProductions.reduce(
    (acc, p) => acc + p.quantite_produite, 
    0
  );

  // Productions de cette semaine
  const debutSemaine = new Date();
  debutSemaine.setDate(debutSemaine.getDate() - debutSemaine.getDay());
  debutSemaine.setHours(0, 0, 0, 0);
  
  const productionSemaine = allProductions
    .filter(p => new Date(p.date_production) >= debutSemaine)
    .reduce((acc, p) => acc + p.quantite_produite, 0);

  // Productions d'aujourd'hui
  const aujourdhui = new Date().toISOString().split('T')[0];
  const productionAujourdhui = allProductions
    .filter(p => p.date_production.split('T')[0] === aujourdhui)
    .reduce((acc, p) => acc + p.quantite_produite, 0);

  // Nombre de lots affichés (filtrés)
  const nombreLots = displayedProductions.length;

  // Production totale des lots affichés (filtrés)
  const productionTotaleFiltree = displayedProductions.reduce(
    (acc, p) => acc + p.quantite_produite, 
    0
  );

  // État de chargement
  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Chargement des productions...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  // État d'erreur
  if (error) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center max-w-md">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Erreur de chargement</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchProductions}>
              Réessayer
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  const filterButtons = [
    { value: "all" as PeriodFilter, label: "Tout", icon: Calendar },
    { value: "today" as PeriodFilter, label: "Aujourd'hui", icon: Clock },
    { value: "week" as PeriodFilter, label: "7 jours", icon: CalendarDays },
    { value: "month" as PeriodFilter, label: "30 jours", icon: CalendarRange },
    { value: "quarter" as PeriodFilter, label: "Trimestre", icon: CalendarRange },
  ];

  return (
    <MainLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="animate-fade-in">
          <h1 className="text-3xl font-bold tracking-tight text-foreground font-display">
            Production
          </h1>
          <p className="mt-1 text-muted-foreground">
            Suivi des lots de production
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={fetchProductions}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Clock className="h-4 w-4 mr-2" />
            )}
            Actualiser
          </Button>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-red-600 hover:bg-red-700">
                <Plus className="w-4 h-4 mr-2" />
                Nouveau lot
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Ajouter un lot de production</DialogTitle>
                <DialogDescription>
                  Créez un nouveau lot et mettez à jour automatiquement les stocks
                </DialogDescription>
              </DialogHeader>
              <AddProductionForm onSuccess={handleProductionSuccess} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats - Basées sur TOUTES les productions */}
      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Production Aujourd'hui</p>
          <p className="text-2xl font-bold text-primary">
            {productionAujourdhui.toLocaleString()}
          </p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Production Semaine</p>
          <p className="text-2xl font-bold text-info">
            {productionSemaine.toLocaleString()}
          </p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">
            {periodFilter === "all" ? "Total Lots" : "Lots Filtrés"}
          </p>
          <p className="text-2xl font-bold text-success">
            {nombreLots}
          </p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">
            {periodFilter === "all" ? "Production Totale" : "Prod. Filtrée"}
          </p>
          <p className="text-2xl font-bold text-foreground">
            {periodFilter === "all" 
              ? productionTotal.toLocaleString()
              : productionTotaleFiltree.toLocaleString()
            }
          </p>
        </div>
      </div>

      {/* Filtres de période */}
      <div className="flex flex-wrap items-center gap-2 mb-6 p-4 bg-muted/30 rounded-lg border">
        <span className="text-sm font-medium text-muted-foreground flex items-center">
          <Calendar className="h-4 w-4 mr-2" />
          Filtrer par période :
        </span>
        {filterButtons.map(({ value, label, icon: Icon }) => (
          <Button
            key={value}
            variant={periodFilter === value ? "default" : "outline"}
            size="sm"
            onClick={() => handleFilterChange(value)}
            className={periodFilter === value ? "bg-red-600 hover:bg-red-700" : ""}
          >
            <Icon className="h-4 w-4 mr-2" />
            {label}
          </Button>
        ))}
        {periodFilter !== "all" && (
          <Badge variant="secondary" className="ml-2">
            {displayedProductions.length} résultat{displayedProductions.length > 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {/* Message si aucune production */}
      {displayedProductions.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/20">
          <Factory className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {periodFilter === "all" ? "Aucune production" : "Aucune production pour cette période"}
          </h3>
          <p className="text-muted-foreground mb-4">
            {periodFilter === "all" 
              ? "Commencez par enregistrer votre première production"
              : "Essayez de changer le filtre de période"
            }
          </p>
          {periodFilter === "all" ? (
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle Production
            </Button>
          ) : (
            <Button variant="outline" onClick={() => setPeriodFilter("all")}>
              Voir toutes les productions
            </Button>
          )}
        </div>
      ) : (
        <DataTable
          data={displayedProductions}
          columns={columns}
          searchPlaceholder="Rechercher une production..."
          searchKey="produit_nom"
        />
      )}
    </MainLayout>
  );
};

export default Production;