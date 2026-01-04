import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  History, 
  Boxes, 
  Archive, 
  TrendingUp, 
  Loader2, 
  AlertCircle,
  FileText,
  BarChart3,
  Download
} from "lucide-react";
import produitService from "@/services/produitService";
import factureService from "@/services/factureService";
import productionService from "@/services/productionService";
import { genererEtatProduitsPDF } from "@/util/produitPdfGenerator";

// Type correspondant au backend + id pour DataTable
interface Produit {
  id: string;
  id_produit: number;
  code_produit: string;
  nom: string;
  description: string;
  unite: string;
  poids: number;
  unite_poids: string;
  stock_actuel: number;
  prix_vente_suggere: number;
  taux_tva: number;
  soumis_taxe: number;
  date_creation: string;
}

interface ProduitProduction {
  nom_produit: string;
  code_produit: string;
  quantite_produite: number;
  unite: string;
  nombre_lots: number;
  nombre_palettes: number;
}

interface ProduitVente {
  nom_produit: string;
  code_produit: string;
  quantite_vendue: number;
  unite: string;
  montant_total: number;
  nombre_factures: number;
  factures_ids?: string[];
}

const UNITES_PAR_PALETTE = 64;

// ============================================================
// COLONNES DU TABLEAU
// ============================================================
const Produits = () => {
  const [produits, setProduits] = useState<Produit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const { toast } = useToast();

  // Charger les produits au montage du composant
  useEffect(() => {
    fetchProduits();
  }, []);

  const fetchProduits = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await produitService.getAll();
      
      const produitsAvecId = response.data
        .map(p => ({
          ...p,
          id: p.id_produit.toString(),
          stock_actuel: Number(p.stock_actuel),
          prix_vente_suggere: Number(p.prix_vente_suggere),
          poids: Number(p.poids)
        }))
        .sort((a, b) => b.stock_actuel - a.stock_actuel);
      
      setProduits(produitsAvecId);
      
      toast({
        title: "Produits chargés",
        description: `${produitsAvecId.length} produit(s) chargé(s) avec succès`,
      });
    } catch (err: any) {
      console.error("Erreur lors du chargement des produits:", err);
      setError(err.message || "Impossible de charger les produits");
      toast({
        variant: "destructive",
        title: "Erreur",
        description: err.message || "Impossible de charger les produits",
      });
    } finally {
      setLoading(false);
    }
  };

  // Générer l'état individuel d'un produit
  const genererEtatProduit = async (produit: Produit) => {
    try {
      setGeneratingPdf(true);
      toast({
        title: "Génération en cours",
        description: "Collecte des données du produit...",
      });

      // Récupérer les productions du produit
      const productionsResponse = await productionService.getByProduit(produit.id_produit);
      const productions = productionsResponse.data || [];

      // Récupérer toutes les factures et filtrer par produit
      const facturesResponse = await factureService.getAll();
      const factures = facturesResponse.data || [];

      // Calculer les ventes de ce produit
      let quantiteVendue = 0;
      let montantTotal = 0;
      let nombreFactures = 0;
      const facturesIds: string[] = [];

      factures.forEach((facture: any) => {
        if (facture.lignes && Array.isArray(facture.lignes)) {
          const lignesProduit = facture.lignes.filter((ligne: any) => ligne.id_produit === produit.id_produit);
          if (lignesProduit.length > 0) {
            lignesProduit.forEach((ligne: any) => {
              quantiteVendue += Number(ligne.quantite) || 0;
              montantTotal += Number(ligne.total_ligne) || 0;
            });
            facturesIds.push(facture.numero_facture || `FAC-${facture.id_facture}`);
            nombreFactures++;
          }
        }
      });

      // Calculer la quantité produite
      const quantiteProduite = productions.reduce((acc: number, prod: any) => 
        acc + (Number(prod.quantite_produite) || 0), 0
      );

      // Calculer le nombre de palettes
      const nombrePalettes = Math.floor(quantiteProduite / UNITES_PAR_PALETTE);

      const produitsProduction: ProduitProduction[] = [{
        nom_produit: produit.nom,
        code_produit: produit.code_produit || '-',
        quantite_produite: quantiteProduite,
        unite: produit.unite,
        nombre_lots: productions.length,
        nombre_palettes: nombrePalettes
      }];

      const produitsVente: ProduitVente[] = [{
        nom_produit: produit.nom,
        code_produit: produit.code_produit || '-',
        quantite_vendue: quantiteVendue,
        unite: produit.unite,
        montant_total: montantTotal,
        nombre_factures: nombreFactures,
        factures_ids: facturesIds
      }];

      await genererEtatProduitsPDF(
        produitsProduction,
        produitsVente,
        `${produit.nom} - Tout le temps`
      );

      toast({
        title: "PDF généré",
        description: `État du produit "${produit.nom}" généré avec succès`,
      });
    } catch (err: any) {
      console.error("Erreur génération PDF:", err);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: err.message || "Impossible de générer le PDF",
      });
    } finally {
      setGeneratingPdf(false);
    }
  };

  // Générer l'état global de tous les produits
  const genererEtatGlobal = async () => {
    try {
      setGeneratingPdf(true);
      toast({
        title: "Génération en cours",
        description: "Collecte des données de tous les produits...",
      });

      // Récupérer toutes les productions
      const productionsResponse = await productionService.getAll();
      const productions = productionsResponse.data || [];

      // Récupérer toutes les factures
      const facturesResponse = await factureService.getAll();
      const factures = facturesResponse.data || [];

      // Calculer les productions par produit
      const productionsParProduit = new Map<number, ProduitProduction>();
      
      productions.forEach((prod: any) => {
        const existing = productionsParProduit.get(prod.id_produit);
        if (existing) {
          existing.quantite_produite += Number(prod.quantite_produite) || 0;
          existing.nombre_lots += 1;
          existing.nombre_palettes = Math.floor(existing.quantite_produite / UNITES_PAR_PALETTE);
        } else {
          const produitInfo = produits.find(p => p.id_produit === prod.id_produit);
          const quantite = Number(prod.quantite_produite) || 0;
          productionsParProduit.set(prod.id_produit, {
            nom_produit: produitInfo?.nom || 'Produit inconnu',
            code_produit: produitInfo?.code_produit || '-',
            quantite_produite: quantite,
            unite: produitInfo?.unite || 'unité',
            nombre_lots: 1,
            nombre_palettes: Math.floor(quantite / UNITES_PAR_PALETTE)
          });
        }
      });

      // Calculer les ventes par produit
      const ventesParProduit = new Map<number, ProduitVente>();

      factures.forEach((facture: any) => {
        if (facture.lignes && Array.isArray(facture.lignes)) {
          facture.lignes.forEach((ligne: any) => {
            const existing = ventesParProduit.get(ligne.id_produit);
            const factureId = facture.numero_facture || `FAC-${facture.id_facture}`;
            
            if (existing) {
              existing.quantite_vendue += Number(ligne.quantite) || 0;
              existing.montant_total += Number(ligne.total_ligne) || 0;
              existing.nombre_factures += 1;
              if (existing.factures_ids && !existing.factures_ids.includes(factureId)) {
                existing.factures_ids.push(factureId);
              }
            } else {
              const produitInfo = produits.find(p => p.id_produit === ligne.id_produit);
              ventesParProduit.set(ligne.id_produit, {
                nom_produit: produitInfo?.nom || 'Produit inconnu',
                code_produit: produitInfo?.code_produit || '-',
                quantite_vendue: Number(ligne.quantite) || 0,
                unite: produitInfo?.unite || 'unité',
                montant_total: Number(ligne.total_ligne) || 0,
                nombre_factures: 1,
                factures_ids: [factureId]
              });
            }
          });
        }
      });

      const produitsProduction = Array.from(productionsParProduit.values());
      const produitsVente = Array.from(ventesParProduit.values());

      await genererEtatProduitsPDF(
        produitsProduction,
        produitsVente,
        "Tous les produits - Tout le temps"
      );

      toast({
        title: "PDF généré",
        description: "État global de tous les produits généré avec succès",
      });
    } catch (err: any) {
      console.error("Erreur génération PDF:", err);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: err.message || "Impossible de générer le PDF",
      });
    } finally {
      setGeneratingPdf(false);
    }
  };

  const columns = [
    {
      key: "nom",
      header: "Désignation",
      render: (produit: Produit) => (
        <div>
          <p className="font-medium text-foreground">{produit.nom}</p>
          {produit.code_produit && (
            <span className="font-mono text-sm font-semibold bg-primary/10 text-primary px-2 py-1 rounded">
              {produit.code_produit}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "stockActuel",
      header: "Stock Actuel",
      render: (produit: Produit) => {
        return (
          <div className="flex items-center gap-2">
            <Boxes className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">
              {Number(produit.stock_actuel).toLocaleString()} {produit.unite}
            </span>
          </div>
        );
      },
    },
    {
      key: "prixVente",
      header: "Prix de Vente",
      render: (produit: Produit) => (
        <span className="font-medium">
          {produit.prix_vente_suggere 
            ? new Intl.NumberFormat("fr-DZ").format(Number(produit.prix_vente_suggere)) 
            : "-"} DZD
        </span>
      ),
    },
    {
      key: "valeurStock",
      header: "Valeur Stock",
      render: (produit: Produit) => {
        const valeur = Number(produit.stock_actuel) * Number(produit.prix_vente_suggere || 0);
        return (
          <span className="font-medium text-primary">
            {new Intl.NumberFormat("fr-DZ", {
              notation: "compact",
              compactDisplay: "short",
            }).format(valeur)} DZD
          </span>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      render: (produit: Produit) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => genererEtatProduit(produit)}
          disabled={generatingPdf}
          className="h-8 gap-2"
        >
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">État</span>
        </Button>
      ),
    },
  ];

  // Calculer les statistiques
  const totalStock = produits.reduce((acc, p) => acc + Number(p.stock_actuel), 0);
  
  const valeurTotale = produits.reduce(
    (acc, p) => acc + Number(p.stock_actuel) * Number(p.prix_vente_suggere || 0),
    0
  );

  const produitsAvecStock = produits.filter(p => Number(p.stock_actuel) > 0).length;

  // État de chargement
  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Chargement des produits...</p>
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
            <Button onClick={fetchProduits}>
              Réessayer
            </Button>
          </div>
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
            Produits
          </h1>
          <p className="mt-1 text-muted-foreground">
            Catalogue et gestion des produits finis
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={genererEtatGlobal}
            disabled={generatingPdf || produits.length === 0}
            className="bg-orange-50 hover:bg-orange-100 border-orange-200 text-orange-700"
          >
            {generatingPdf ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">État global des produits</span>
            <span className="sm:hidden">État</span>
          </Button>
          <Button 
            variant="outline" 
            onClick={fetchProduits}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <History className="h-4 w-4 mr-2" />
            )}
            Actualiser
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Total Références</p>
          <p className="text-2xl font-bold text-foreground">{produits.length}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Stock Total</p>
          <p className="text-2xl font-bold text-foreground">
            {totalStock.toLocaleString()}
          </p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">En Stock</p>
          <p className="text-2xl font-bold text-success">
            {produitsAvecStock}
          </p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Valeur Stock</p>
          <p className="text-2xl font-bold text-primary">
            {new Intl.NumberFormat("fr-DZ", {
              notation: "compact",
              compactDisplay: "short",
            }).format(valeurTotale)}{" "}
            DZD
          </p>
        </div>
      </div>

      {/* Message si aucun produit */}
      {produits.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/20">
          <Boxes className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucun produit</h3>
          <p className="text-muted-foreground mb-4">
            Commencez par ajouter votre premier produit
          </p>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un produit
          </Button>
        </div>
      ) : (
        <DataTable
          data={produits}
          columns={columns}
          searchPlaceholder="Rechercher un produit..."
          searchKey="nom"
        />
      )}
    </MainLayout>
  );
};

export default Produits;