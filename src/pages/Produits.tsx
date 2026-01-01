import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, History, Boxes, Archive, TrendingUp, Loader2, AlertCircle } from "lucide-react";
import produitService from "@/services/produitService";

// Type correspondant au backend + id pour DataTable
interface Produit {
  id: string; // Pour DataTable
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

// ============================================================
// CONFIGURATION DES PALETTES PAR PRODUIT
// ============================================================
// Fichier de configuration: config/palettesConfig.ts
interface PaletteConfig {
  [code_produit: string]: number; // Nombre d'unités par palette
}

// Configuration par défaut - À adapter selon tes produits
const PALETTES_CONFIG: PaletteConfig = {
  // Exemple: Pour chaque code produit, définis combien d'unités il y a par palette
  "PAIN-001": 50,      // 50 pains par palette
  "HUILE-001": 48,     // 48 bidons par palette
  "FARINE-001": 40,    // 40 sacs par palette
  "SUCRE-001": 30,     // 30 sacs par palette
  // Ajoute tes autres produits ici...
};

// Valeur par défaut si le produit n'est pas dans la config
const UNITES_PAR_PALETTE_DEFAUT = 64;

// Fonction utilitaire pour calculer le nombre de palettes
const calculerPalettes = (stock_actuel: number, code_produit: string): number => {
  const unitesParPalette = PALETTES_CONFIG[code_produit] || UNITES_PAR_PALETTE_DEFAUT;
  return Math.floor(stock_actuel / unitesParPalette);
};

// ============================================================
// COLONNES DU TABLEAU
// ============================================================
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
      const nombrePalettes = calculerPalettes(produit.stock_actuel, produit.code_produit);
      const unitesParPalette = PALETTES_CONFIG[produit.code_produit] || UNITES_PAR_PALETTE_DEFAUT;
      const resteUnites = produit.stock_actuel % unitesParPalette;
      
      return (
        <div className="flex flex-col gap-2">
          {/* Stock en unités (sacs, bidons, etc.) */}
          <div className="flex items-center gap-2">
            <Boxes className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">
              {produit.stock_actuel.toLocaleString()} {produit.unite}
            </span>
          </div>

          {/* Stock en palettes */}
          <div className="flex items-center gap-2">
            <Archive className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-primary">
              {nombrePalettes.toLocaleString()} {nombrePalettes > 1 ? 'palettes' : 'palette'}
              {resteUnites > 0 && (
                <span className="text-xs text-muted-foreground ml-1">
                  + {resteUnites} {produit.unite}
                </span>
              )}
            </span>
          </div>
          
          {/* Info supplémentaire */}
          <span className="text-xs text-muted-foreground">
            ({unitesParPalette} {produit.unite}/palette)
          </span>
        </div>
      );
    },
  },
  {
    key: "poids",
    header: "Poids Unitaire",
    render: (produit: Produit) => (
      <span className="text-sm">
        {produit.poids ? `${produit.poids} ${produit.unite_poids}` : "-"}
      </span>
    ),
  },
  {
    key: "prixVente",
    header: "Prix de Vente",
    render: (produit: Produit) => (
      <div>
        <span className="font-medium">
          {produit.prix_vente_suggere 
            ? new Intl.NumberFormat("fr-DZ").format(produit.prix_vente_suggere) 
            : "-"} DZD
        </span>
        {produit.taux_tva > 0 && (
          <span className="text-xs text-muted-foreground ml-1">
            (TVA {produit.taux_tva}%)
          </span>
        )}
      </div>
    ),
  },
  {
    key: "valeurStock",
    header: "Valeur Stock",
    render: (produit: Produit) => {
      const valeur = produit.stock_actuel * (produit.prix_vente_suggere || 0);
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
      <div className="flex gap-2">
        <Button variant="outline" size="sm">
          <History className="h-4 w-4 mr-1" />
          Historique
        </Button>
      </div>
    ),
  },
];

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================
const Produits = () => {
  const [produits, setProduits] = useState<Produit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les produits au montage du composant
  useEffect(() => {
    fetchProduits();
  }, []);

  const fetchProduits = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await produitService.getAll();
      
      // Mapper les données pour ajouter un id (requis par DataTable)
      const produitsAvecId = response.data.map(p => ({
        ...p,
        id: p.id_produit.toString()
      }));
      
      setProduits(produitsAvecId);
    } catch (err: any) {
      console.error("Erreur lors du chargement des produits:", err);
      setError(err.message || "Impossible de charger les produits");
    } finally {
      setLoading(false);
    }
  };

  // Calculer les statistiques
  const totalStock = produits.reduce((acc, p) => acc + p.stock_actuel, 0);
  
  const totalPalettes = produits.reduce((acc, p) => {
    return acc + calculerPalettes(p.stock_actuel, p.code_produit);
  }, 0);
  
  const valeurTotale = produits.reduce(
    (acc, p) => acc + p.stock_actuel * (p.prix_vente_suggere || 0),
    0
  );

  const produitsAvecStock = produits.filter(p => p.stock_actuel > 0).length;

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
          <Button className="gap-2 animate-slide-up">
            <Plus className="h-4 w-4" />
            Nouveau Produit
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-5 mb-8">
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
          <p className="text-sm text-muted-foreground">Total Palettes</p>
          <p className="text-2xl font-bold text-primary">
            {totalPalettes.toLocaleString()}
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


// ============================================================
// FICHIER DE CONFIGURATION SÉPARÉ (OPTIONNEL)
// ============================================================
// Créer un fichier: src/config/palettesConfig.ts
/*
export interface PaletteConfig {
  [code_produit: string]: number;
}

export const PALETTES_CONFIG: PaletteConfig = {
  "PAIN-001": 50,
  "HUILE-001": 48,
  "FARINE-001": 40,
  "SUCRE-001": 30,
  "LAIT-001": 60,
  "SEL-001": 25,
  // Ajoute tous tes produits ici...
};

export const UNITES_PAR_PALETTE_DEFAUT = 50;

export const calculerPalettes = (stock_actuel: number, code_produit: string): number => {
  const unitesParPalette = PALETTES_CONFIG[code_produit] || UNITES_PAR_PALETTE_DEFAUT;
  return Math.floor(stock_actuel / unitesParPalette);
};
*/

// Puis importer dans le composant:
// import { calculerPalettes, PALETTES_CONFIG, UNITES_PAR_PALETTE_DEFAUT } from '@/config/palettesConfig';