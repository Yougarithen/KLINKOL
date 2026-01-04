// pages/Production.tsx
import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AddProductionForm } from "@/components/form/AddProductionForm";
import { DateRangeSelector } from "@/components/form/DateRangeSelector";
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
  CalendarRange,
  Archive,
  FileText
} from "lucide-react";
import productionService from "@/services/productionService";
import recetteProductionService from "@/services/recetteProductionService";
import matierePremiereService from "@/services/matierePremiereService";
import { genererEtatProductionsPDF, genererEtatProductionUniquePDF } from "@/util/productionPdfGenerator";
import { toast } from "sonner";

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

// FONCTION ULTRA-ROBUSTE DE FORMATAGE
const formatQuantite = (value: any): string => {
  try {
    const num = Number(value);
    if (!isFinite(num) || isNaN(num)) return "0";
    return Number.isInteger(num) ? num.toString() : num.toFixed(2);
  } catch {
    return "0";
  }
};

// Constante pour la conversion palette
const SACS_PAR_PALETTE = 64;

const Production = () => {
  const [allProductions, setAllProductions] = useState<ProductionRecord[]>([]);
  const [displayedProductions, setDisplayedProductions] = useState<ProductionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("all");
  const [isEtatDialogOpen, setIsEtatDialogOpen] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isSingleProductionDialogOpen, setIsSingleProductionDialogOpen] = useState(false);
  const [selectedProductionForPDF, setSelectedProductionForPDF] = useState<ProductionRecord | null>(null);
  const [generatingSinglePDF, setGeneratingSinglePDF] = useState<number | null>(null);

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

  const handleGenerateEtatProductions = async (dateRange: { startDate: string; endDate: string; label: string }) => {
    try {
      setIsGeneratingPDF(true);
      setIsEtatDialogOpen(false);
      toast.loading("Génération du PDF en cours...");

      // Filtrer les productions selon la plage de dates
      const productionsFiltrees = allProductions.filter(p => {
        const prodDate = new Date(p.date_production);
        const start = new Date(dateRange.startDate);
        const end = new Date(dateRange.endDate);
        return prodDate >= start && prodDate <= end;
      });

      if (productionsFiltrees.length === 0) {
        toast.dismiss();
        toast.info(`Aucune production trouvée pour la période : ${dateRange.label}`);
        setIsGeneratingPDF(false);
        return;
      }

      // Récupérer toutes les matières premières pour avoir les stocks actuels
      const matieresResponse = await matierePremiereService.getAll();
      const toutesLesMatieres = matieresResponse.data;

      // Créer un Map pour accès rapide au stock par nom de matière
      const stockMap = new Map(
        toutesLesMatieres.map((m: any) => [m.nom, m.stock_actuel])
      );

      // Calculer les matières premières utilisées
      const matieresUtiliseesMap = new Map<string, { nom_matiere: string; quantite_totale: number; unite: string; stock_actuel: number }>();

      for (const prod of productionsFiltrees) {
        try {
          const recetteResponse = await recetteProductionService.getByProduit(prod.id_produit);
          const recette = recetteResponse.data;

          recette.forEach((ingredient: any) => {
            const quantiteNecessaire = ingredient.quantite_necessaire * prod.quantite_produite;
            const key = ingredient.matiere_nom;
            const stockActuel = stockMap.get(key) || 0;

            if (matieresUtiliseesMap.has(key)) {
              const existing = matieresUtiliseesMap.get(key)!;
              existing.quantite_totale += quantiteNecessaire;
            } else {
              matieresUtiliseesMap.set(key, {
                nom_matiere: ingredient.matiere_nom,
                quantite_totale: quantiteNecessaire,
                unite: ingredient.matiere_unite,
                stock_actuel: stockActuel
              });
            }
          });
        } catch (err) {
          console.warn(`Impossible de récupérer la recette pour le produit ${prod.id_produit}`);
        }
      }

      const matieresUtilisees = Array.from(matieresUtiliseesMap.values());

      // Générer le PDF
      await genererEtatProductionsPDF(productionsFiltrees, matieresUtilisees, dateRange.label);
      
      toast.dismiss();
      toast.success("PDF généré avec succès !");

    } catch (error) {
      console.error("Erreur lors de la génération du PDF:", error);
      toast.dismiss();
      toast.error("Erreur lors de la génération du PDF");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleGenerateSingleProductionReport = (production: ProductionRecord) => {
    setSelectedProductionForPDF(production);
    setIsSingleProductionDialogOpen(true);
  };

  const handleGenerateSingleProduction = async (dateRange: { startDate: string; endDate: string; label: string }) => {
    if (!selectedProductionForPDF) return;

    try {
      setGeneratingSinglePDF(selectedProductionForPDF.id_production);
      setIsSingleProductionDialogOpen(false);
      toast.loading(`Génération du PDF pour ${selectedProductionForPDF.produit_nom}...`);

      // Récupérer toutes les matières premières pour avoir les stocks actuels
      const matieresResponse = await matierePremiereService.getAll();
      const toutesLesMatieres = matieresResponse.data;

      // Créer un Map pour accès rapide au stock par nom de matière
      const stockMap = new Map(
        toutesLesMatieres.map((m: any) => [m.nom, m.stock_actuel])
      );

      // Récupérer la recette du produit
      const recetteResponse = await recetteProductionService.getByProduit(selectedProductionForPDF.id_produit);
      const recette = recetteResponse.data;

      // Calculer les matières premières utilisées pour cette production
      const matieresUtilisees = recette.map((ingredient: any) => {
        const quantiteNecessaire = ingredient.quantite_necessaire * selectedProductionForPDF.quantite_produite;
        return {
          nom_matiere: ingredient.matiere_nom,
          quantite_totale: quantiteNecessaire,
          unite: ingredient.matiere_unite,
          stock_actuel: stockMap.get(ingredient.matiere_nom) || 0
        };
      });

      // Générer le PDF avec une seule production
      await genererEtatProductionUniquePDF([selectedProductionForPDF], matieresUtilisees, dateRange.label);
      
      toast.dismiss();
      toast.success("PDF généré avec succès !");

    } catch (error) {
      console.error("Erreur lors de la génération du PDF:", error);
      toast.dismiss();
      toast.error("Erreur lors de la génération du PDF");
    } finally {
      setGeneratingSinglePDF(null);
    }
  };

  // Définition des colonnes APRÈS toutes les fonctions
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
      key: "palettes",
      header: "Palettes / Quantité",
      render: (prod: ProductionRecord) => {
        const palettes = Number(prod.quantite_produite) / SACS_PAR_PALETTE;
        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Archive className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-primary">
                {formatQuantite(palettes)} Palette
              </span>
            </div>
            <div className="flex items-center gap-2 pl-6">
              <Factory className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {formatQuantite(prod.quantite_produite)} {prod.unite}
              </span>
            </div>
          </div>
        );
      },
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
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleGenerateSingleProductionReport(prod)}
          disabled={generatingSinglePDF === prod.id_production}
          className="bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
        >
          {generatingSinglePDF === prod.id_production ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <FileText className="h-4 w-4 mr-1" />
          )}
          État Production
        </Button>
      ),
    },
  ];

  // Calculer les statistiques
  const productionTotal = allProductions.reduce(
    (acc, p) => acc + Number(p.quantite_produite), 
    0
  );

  // Productions de cette semaine
  const debutSemaine = new Date();
  debutSemaine.setDate(debutSemaine.getDate() - debutSemaine.getDay());
  debutSemaine.setHours(0, 0, 0, 0);
  
  const productionSemaine = allProductions
    .filter(p => new Date(p.date_production) >= debutSemaine)
    .reduce((acc, p) => acc + Number(p.quantite_produite), 0);

  // Productions d'aujourd'hui
  const aujourdhui = new Date().toISOString().split('T')[0];
  const productionAujourdhui = allProductions
    .filter(p => p.date_production.split('T')[0] === aujourdhui)
    .reduce((acc, p) => acc + Number(p.quantite_produite), 0);

  const nombreLots = displayedProductions.length;
  const productionTotaleFiltree = displayedProductions.reduce(
    (acc, p) => acc + Number(p.quantite_produite), 
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

          <Dialog open={isEtatDialogOpen} onOpenChange={setIsEtatDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" disabled={isGeneratingPDF}            className="bg-orange-50 hover:bg-orange-100 border-orange-200 text-orange-700">

                {isGeneratingPDF ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4 mr-2" />
                )}
                État global des productions
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Générer l'état des productions</DialogTitle>
                <DialogDescription>
                  Sélectionnez une période pour générer le rapport PDF
                </DialogDescription>
              </DialogHeader>
              <DateRangeSelector
                onConfirm={handleGenerateEtatProductions}
                onCancel={() => setIsEtatDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
          
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

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Production Aujourd'hui</p>
          <p className="text-2xl font-bold text-primary">
            {formatQuantite(productionAujourdhui)}
          </p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Production Semaine</p>
          <p className="text-2xl font-bold text-info">
            {formatQuantite(productionSemaine)}
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
              ? formatQuantite(productionTotal)
              : formatQuantite(productionTotaleFiltree)
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

      {/* Dialogue Sélection Période - Production unique */}
      <Dialog open={isSingleProductionDialogOpen} onOpenChange={setIsSingleProductionDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Sélectionner la période</DialogTitle>
            <DialogDescription>
              Générer l'état de production pour {selectedProductionForPDF?.produit_nom}
            </DialogDescription>
          </DialogHeader>
          <DateRangeSelector
            onConfirm={handleGenerateSingleProduction}
            onCancel={() => setIsSingleProductionDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default Production;