// pages/Ventes.tsx - VERSION COMPLÈTE AVEC 3 SECTIONS
import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  FileText, 
  Eye, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Loader2,
  X,
  Printer,
  Package,
  FileCheck,
  ArrowRight
} from "lucide-react";
import factureService from "@/services/factureService";
import devisService from "@/services/devisService";
import clientService from "@/services/clientService";
import { AddFactureForm } from "@/components/form/AddFactureForm";
import { AddDevisForm } from "@/components/form/AddDevisForm";
import { FactureDetailModal } from "@/components/detail/FactureDetailModal";
import { DevisDetailModal } from "@/components/detail/DevisDetailModal";
import { genererFacturePDF } from "@/util/pdfGenerator";

type SectionActive = "devis" | "bons_livraison" | "factures";

interface Facture {
  id: string;
  id_facture: number;
  numero_facture: string;
  id_client: number;
  client: string;
  date_facture: string;
  date_echeance: string;
  statut: string;
  type_facture: string;
  montant_ht: number;
  montant_tva: number;
  montant_ttc: number;
  montant_paye: number;
  montant_restant: number;
  remise_globale?: number;
}

interface Devis {
  id: string;
  id_devis: number;
  numero_devis: string;
  id_client: number;
  client: string;
  date_devis: string;
  date_validite: string;
  statut: string;
  montant_ht: number;
  montant_tva: number;
  montant_ttc: number;
  remise_globale?: number;
}

const statusConfigFacture = {
  "Brouillon": {
    label: "Brouillon",
    icon: FileText,
    className: "bg-muted text-muted-foreground border-border",
  },
  "Validée": {
    label: "Validée",
    icon: CheckCircle,
    className: "bg-blue-100 text-blue-800 border-blue-300",
  },
  "Partiellement payée": {
    label: "Partiel",
    icon: Clock,
    className: "bg-warning/10 text-warning border-warning/20",
  },
  "Payée": {
    label: "Payée",
    icon: CheckCircle,
    className: "bg-success/10 text-success border-success/20",
  },
  "Annulée": {
    label: "Annulée",
    icon: AlertCircle,
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
};

const statusConfigDevis = {
  "Brouillon": {
    label: "Brouillon",
    icon: FileText,
    className: "bg-muted text-muted-foreground border-border",
  },
  "Envoyé": {
    label: "Envoyé",
    icon: Clock,
    className: "bg-blue-100 text-blue-800 border-blue-300",
  },
  "Accepté": {
    label: "Accepté",
    icon: CheckCircle,
    className: "bg-success/10 text-success border-success/20",
  },
  "Refusé": {
    label: "Refusé",
    icon: AlertCircle,
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
  "Expiré": {
    label: "Expiré",
    icon: AlertCircle,
    className: "bg-orange-100 text-orange-800 border-orange-300",
  },
};

// Composant FactureTable
interface FactureTableProps {
  factures: Facture[];
  onSelectFacture: (id: number) => void;
  onVoirFacture: (facture: Facture) => void;
  loadingPdf: number | null;
  searchTerm: string;
  filtreStatut: string | null;
  onAddNew: () => void;
  isBonLivraison?: boolean;
}

function FactureTable({
  factures,
  onSelectFacture,
  onVoirFacture,
  loadingPdf,
  searchTerm,
  filtreStatut,
  onAddNew,
  isBonLivraison = false
}: FactureTableProps) {
  if (factures.length === 0) {
    return (
      <div className="border rounded-lg p-12 text-center">
        <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">
          {searchTerm || filtreStatut
            ? `Aucun${isBonLivraison ? "" : "e"} ${isBonLivraison ? "bon de livraison" : "facture"} trouvé${isBonLivraison ? "" : "e"}`
            : `Aucun${isBonLivraison ? "" : "e"} ${isBonLivraison ? "bon de livraison" : "facture"}`}
        </h3>
        <p className="text-muted-foreground mb-4">
          {searchTerm || filtreStatut
            ? "Essayez de modifier vos critères de recherche"
            : `Commencez par créer votre premier${isBonLivraison ? "" : "e"} ${isBonLivraison ? "bon de livraison" : "facture"}`}
        </p>
        {!searchTerm && !filtreStatut && (
          <Button onClick={onAddNew}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau {isBonLivraison ? "bon de livraison" : "facture"}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-muted/50">
          <tr>
            <th className="text-left p-4 font-medium">N° Document</th>
            <th className="text-left p-4 font-medium">Client</th>
            <th className="text-left p-4 font-medium">Date</th>
            <th className="text-left p-4 font-medium">Échéance</th>
            <th className="text-right p-4 font-medium">Montant TTC</th>
            <th className="text-right p-4 font-medium">Payé</th>
            <th className="text-right p-4 font-medium">Reste</th>
            <th className="text-center p-4 font-medium">Statut</th>
            <th className="text-center p-4 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {factures.map((facture) => {
            const config = statusConfigFacture[facture.statut as keyof typeof statusConfigFacture] || statusConfigFacture["Brouillon"];
            const Icon = config.icon;
            const isEnRetard = facture.date_echeance && 
                              facture.montant_restant > 0 && 
                              new Date(facture.date_echeance) < new Date();

            return (
              <tr key={facture.id} className="border-t hover:bg-muted/20">
                <td className="p-4">
                  <div className="font-medium">{facture.numero_facture}</div>
                  {isBonLivraison && (
                    <div className="text-xs text-muted-foreground">Bon de livraison</div>
                  )}
                </td>
                <td className="p-4">{facture.client}</td>
                <td className="p-4">
                  {new Date(facture.date_facture).toLocaleDateString("fr-FR")}
                </td>
                <td className="p-4">
                  {facture.date_echeance ? (
                    <span className={isEnRetard ? "text-destructive font-medium" : ""}>
                      {new Date(facture.date_echeance).toLocaleDateString("fr-FR")}
                      {isEnRetard && " ⚠️"}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </td>
                <td className="p-4 text-right font-medium">
                  {new Intl.NumberFormat("fr-DZ", {
                    style: "currency",
                    currency: "DZD",
                    maximumFractionDigits: 0,
                  }).format(facture.montant_ttc)}
                </td>
                <td className="p-4 text-right text-success">
                  {new Intl.NumberFormat("fr-DZ", {
                    style: "currency",
                    currency: "DZD",
                    maximumFractionDigits: 0,
                  }).format(facture.montant_paye)}
                </td>
                <td className="p-4 text-right text-warning">
                  {new Intl.NumberFormat("fr-DZ", {
                    style: "currency",
                    currency: "DZD",
                    maximumFractionDigits: 0,
                  }).format(facture.montant_restant)}
                </td>
                <td className="p-4">
                  <div className="flex justify-center">
                    <Badge variant="outline" className={config.className}>
                      <Icon className="h-3 w-3 mr-1" />
                      {config.label}
                    </Badge>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onSelectFacture(facture.id_facture)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onVoirFacture(facture)}
                      disabled={loadingPdf === facture.id_facture}
                    >
                      {loadingPdf === facture.id_facture ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Printer className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// Composant DevisTable
interface DevisTableProps {
  devis: Devis[];
  onSelectDevis: (id: number) => void;
  onConvertir: (id: number) => void;
  searchTerm: string;
  filtreStatut: string | null;
  onAddNew: () => void;
}

function DevisTable({
  devis,
  onSelectDevis,
  onConvertir,
  searchTerm,
  filtreStatut,
  onAddNew
}: DevisTableProps) {
  if (devis.length === 0) {
    return (
      <div className="border rounded-lg p-12 text-center">
        <FileCheck className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">
          {searchTerm || filtreStatut ? "Aucun devis trouvé" : "Aucun devis"}
        </h3>
        <p className="text-muted-foreground mb-4">
          {searchTerm || filtreStatut
            ? "Essayez de modifier vos critères de recherche"
            : "Commencez par créer votre premier devis"}
        </p>
        {!searchTerm && !filtreStatut && (
          <Button onClick={onAddNew}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau devis
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-muted/50">
          <tr>
            <th className="text-left p-4 font-medium">N° Devis</th>
            <th className="text-left p-4 font-medium">Client</th>
            <th className="text-left p-4 font-medium">Date</th>
            <th className="text-left p-4 font-medium">Validité</th>
            <th className="text-right p-4 font-medium">Montant TTC</th>
            <th className="text-center p-4 font-medium">Statut</th>
            <th className="text-center p-4 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {devis.map((d) => {
            const config = statusConfigDevis[d.statut as keyof typeof statusConfigDevis] || statusConfigDevis["Brouillon"];
            const Icon = config.icon;
            const isExpire = d.date_validite && new Date(d.date_validite) < new Date();

            return (
              <tr key={d.id} className="border-t hover:bg-muted/20">
                <td className="p-4">
                  <div className="font-medium">{d.numero_devis}</div>
                </td>
                <td className="p-4">{d.client}</td>
                <td className="p-4">
                  {new Date(d.date_devis).toLocaleDateString("fr-FR")}
                </td>
                <td className="p-4">
                  {d.date_validite ? (
                    <span className={isExpire ? "text-destructive font-medium" : ""}>
                      {new Date(d.date_validite).toLocaleDateString("fr-FR")}
                      {isExpire && " ⚠️"}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </td>
                <td className="p-4 text-right font-medium">
                  {new Intl.NumberFormat("fr-DZ", {
                    style: "currency",
                    currency: "DZD",
                    maximumFractionDigits: 0,
                  }).format(d.montant_ttc)}
                </td>
                <td className="p-4">
                  <div className="flex justify-center">
                    <Badge variant="outline" className={config.className}>
                      <Icon className="h-3 w-3 mr-1" />
                      {config.label}
                    </Badge>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onSelectDevis(d.id_devis)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {d.statut === "Accepté" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onConvertir(d.id_devis)}
                        title="Convertir en facture"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// Composant principal Ventes
const Ventes = () => {
  const [sectionActive, setSectionActive] = useState<SectionActive>("factures");
  
  // États Factures
  const [factures, setFactures] = useState<Facture[]>([]);
  const [facturesFiltrees, setFacturesFiltrees] = useState<Facture[]>([]);
  const [bonsLivraison, setBonsLivraison] = useState<Facture[]>([]);
  const [bonsLivraisonFiltres, setBonsLivraisonFiltres] = useState<Facture[]>([]);
  
  // États Devis
  const [devis, setDevis] = useState<Devis[]>([]);
  const [devisFiltres, setDevisFiltres] = useState<Devis[]>([]);
  
  // États communs
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddFormFacture, setShowAddFormFacture] = useState(false);
  const [showAddFormBonLivraison, setShowAddFormBonLivraison] = useState(false);
  const [showAddFormDevis, setShowAddFormDevis] = useState(false);
  const [selectedFacture, setSelectedFacture] = useState<number | null>(null);
  const [selectedDevis, setSelectedDevis] = useState<number | null>(null);
  const [loadingPdf, setLoadingPdf] = useState<number | null>(null);
  
  // Filtres
  const [searchTerm, setSearchTerm] = useState("");
  const [filtreStatut, setFiltreStatut] = useState<string | null>(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [facturesRes, devisRes] = await Promise.all([
        factureService.getAll(),
        devisService.getAll()
      ]);
      
      // Séparer les factures et bons de livraison
      const toutesFactures = facturesRes.data.map((f: any) => ({
        ...f,
        id: f.id_facture.toString()
      }));
      
      const facturesSeules = toutesFactures
        .filter((f: any) => !f.type_facture || f.type_facture === "STANDARD" || f.type_facture === "FACTURE")
        .sort((a: any, b: any) => b.id_facture - a.id_facture);
      
      const bonsLiv = toutesFactures
        .filter((f: any) => f.type_facture === "BON_LIVRAISON")
        .sort((a: any, b: any) => b.id_facture - a.id_facture);
      
      const devisData = devisRes.data.map((d: any) => ({
        ...d,
        id: d.id_devis.toString()
      })).sort((a: any, b: any) => b.id_devis - a.id_devis);
      
      setFactures(facturesSeules);
      setFacturesFiltrees(facturesSeules);
      setBonsLivraison(bonsLiv);
      setBonsLivraisonFiltres(bonsLiv);
      setDevis(devisData);
      setDevisFiltres(devisData);
      
    } catch (err: any) {
      console.error("Erreur:", err);
      setError(err.message || "Impossible de charger les données");
    } finally {
      setLoading(false);
    }
  };

  // Filtrage Factures
  useEffect(() => {
    let resultats = [...factures];

    if (searchTerm) {
      const terme = searchTerm.toLowerCase();
      resultats = resultats.filter(f => 
        f.client.toLowerCase().includes(terme) ||
        f.numero_facture.toLowerCase().includes(terme) ||
        new Date(f.date_facture).toLocaleDateString("fr-FR").includes(terme)
      );
    }

    if (filtreStatut) {
      if (filtreStatut === "en_retard") {
        resultats = resultats.filter(f => 
          f.date_echeance && 
          f.montant_restant > 0 && 
          new Date(f.date_echeance) < new Date()
        );
      } else {
        resultats = resultats.filter(f => f.statut === filtreStatut);
      }
    }

    setFacturesFiltrees(resultats);
  }, [searchTerm, filtreStatut, factures]);

  // Filtrage Bons de livraison
  useEffect(() => {
    let resultats = [...bonsLivraison];

    if (searchTerm) {
      const terme = searchTerm.toLowerCase();
      resultats = resultats.filter(f => 
        f.client.toLowerCase().includes(terme) ||
        f.numero_facture.toLowerCase().includes(terme) ||
        new Date(f.date_facture).toLocaleDateString("fr-FR").includes(terme)
      );
    }

    if (filtreStatut) {
      if (filtreStatut === "en_retard") {
        resultats = resultats.filter(f => 
          f.date_echeance && 
          f.montant_restant > 0 && 
          new Date(f.date_echeance) < new Date()
        );
      } else {
        resultats = resultats.filter(f => f.statut === filtreStatut);
      }
    }

    setBonsLivraisonFiltres(resultats);
  }, [searchTerm, filtreStatut, bonsLivraison]);

  // Filtrage Devis
  useEffect(() => {
    let resultats = [...devis];

    if (searchTerm) {
      const terme = searchTerm.toLowerCase();
      resultats = resultats.filter(d => 
        d.client.toLowerCase().includes(terme) ||
        d.numero_devis.toLowerCase().includes(terme) ||
        new Date(d.date_devis).toLocaleDateString("fr-FR").includes(terme)
      );
    }

    if (filtreStatut) {
      resultats = resultats.filter(d => d.statut === filtreStatut);
    }

    setDevisFiltres(resultats);
  }, [searchTerm, filtreStatut, devis]);

  const handleVoirFacture = async (facture: Facture) => {
    try {
      setLoadingPdf(facture.id_facture);
      
      const response = await factureService.getById(facture.id_facture);
      const factureComplete = response.data;
      
      const clientResponse = await clientService.getById(factureComplete.id_client);
      const client = clientResponse.data;
      
      genererFacturePDF(factureComplete, client);
      
    } catch (err: any) {
      console.error("Erreur:", err);
      alert("Erreur lors de la génération du PDF: " + (err.message || "Erreur inconnue"));
    } finally {
      setLoadingPdf(null);
    }
  };

  const handleConvertirDevisEnFacture = async (id_devis: number) => {
    if (!confirm("Voulez-vous convertir ce devis en facture ?")) return;
    
    try {
      await devisService.convertirEnFacture(id_devis);
      alert("Devis converti en facture avec succès !");
      fetchAllData();
    } catch (err: any) {
      alert(`Erreur: ${err.message}`);
    }
  };

  // Calcul des totaux selon la section
  const getCurrentData = () => {
    switch (sectionActive) {
      case "devis":
        return devisFiltres;
      case "bons_livraison":
        return bonsLivraisonFiltres;
      case "factures":
        return facturesFiltrees;
    }
  };

  const getStatsForSection = () => {
    const data = getCurrentData();
    
    if (sectionActive === "devis") {
      return {
        total: data.reduce((sum, d) => sum + (d.montant_ttc || 0), 0),
        acceptes: data.filter(d => d.statut === "Accepté").length,
        enAttente: data.filter(d => d.statut === "Envoyé").length,
        expires: data.filter(d => d.statut === "Expiré").length,
      };
    } else {
      const facturesData = data as Facture[];
      return {
        totalAchats: facturesData.reduce((sum, f) => sum + (f.montant_ttc || 0), 0),
        totalPaye: facturesData.reduce((sum, f) => sum + (f.montant_paye || 0), 0),
        totalRestant: facturesData.reduce((sum, f) => sum + (f.montant_restant || 0), 0),
        enRetard: facturesData.filter(f => 
          f.date_echeance && 
          f.montant_restant > 0 && 
          new Date(f.date_echeance) < new Date()
        ).length,
      };
    }
  };

  const stats = getStatsForSection();

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-96">
          <AlertCircle className="h-16 w-16 text-destructive mb-4" />
          <h3 className="text-lg font-semibold mb-2">Erreur</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchAllData}>Réessayer</Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header avec onglets */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Ventes</h1>
            <p className="text-muted-foreground">
              Gérez vos devis, bons de livraison et factures
            </p>
          </div>
          <Button 
            onClick={() => {
              if (sectionActive === "devis") setShowAddFormDevis(true);
              else if (sectionActive === "bons_livraison") setShowAddFormBonLivraison(true);
              else setShowAddFormFacture(true);
            }} 
            size="lg" 
            className="gap-2"
          >
            <Plus className="h-5 w-5" />
            Nouveau {sectionActive === "devis" ? "Devis" : sectionActive === "bons_livraison" ? "Bon de livraison" : "Facture"}
          </Button>
        </div>

        {/* Onglets de navigation */}
        <div className="flex gap-2 border-b">
          <Button
            variant={sectionActive === "devis" ? "default" : "ghost"}
            onClick={() => {
              setSectionActive("devis");
              setSearchTerm("");
              setFiltreStatut(null);
            }}
            className="gap-2"
          >
            <FileCheck className="h-4 w-4" />
            Devis ({devis.length})
          </Button>
          <Button
            variant={sectionActive === "bons_livraison" ? "default" : "ghost"}
            onClick={() => {
              setSectionActive("bons_livraison");
              setSearchTerm("");
              setFiltreStatut(null);
            }}
            className="gap-2"
          >
            <Package className="h-4 w-4" />
            Bons de livraison ({bonsLivraison.length})
          </Button>
          <Button
            variant={sectionActive === "factures" ? "default" : "ghost"}
            onClick={() => {
              setSectionActive("factures");
              setSearchTerm("");
              setFiltreStatut(null);
            }}
            className="gap-2"
          >
            <FileText className="h-4 w-4" />
            Factures ({factures.length})
          </Button>
        </div>

        {/* Stats Cards - Différentes selon la section */}
        {sectionActive === "devis" ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg border bg-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Total Devis</span>
                <FileCheck className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold">
                {new Intl.NumberFormat("fr-DZ", {
                  style: "currency",
                  currency: "DZD",
                  maximumFractionDigits: 0,
                }).format(stats.total)}
              </div>
            </div>

            <div className="p-4 rounded-lg border bg-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Acceptés</span>
                <CheckCircle className="h-4 w-4 text-success" />
              </div>
              <div className="text-2xl font-bold text-success">
                {stats.acceptes}
              </div>
            </div>

            <div className="p-4 rounded-lg border bg-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">En attente</span>
                <Clock className="h-4 w-4 text-warning" />
              </div>
              <div className="text-2xl font-bold text-warning">
                {stats.enAttente}
              </div>
            </div>

            <div className="p-4 rounded-lg border bg-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Expirés</span>
                <AlertCircle className="h-4 w-4 text-destructive" />
              </div>
              <div className="text-2xl font-bold text-destructive">
                {stats.expires}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg border bg-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Total Achats</span>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold">
                {new Intl.NumberFormat("fr-DZ", {
                  style: "currency",
                  currency: "DZD",
                  maximumFractionDigits: 0,
                }).format(stats.totalAchats)}
              </div>
            </div>

            <div className="p-4 rounded-lg border bg-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Total Payé</span>
                <CheckCircle className="h-4 w-4 text-success" />
              </div>
              <div className="text-2xl font-bold text-success">
                {new Intl.NumberFormat("fr-DZ", {
                  style: "currency",
                  currency: "DZD",
                  maximumFractionDigits: 0,
                }).format(stats.totalPaye)}
              </div>
            </div>

            <div className="p-4 rounded-lg border bg-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Reste à Payer</span>
                <Clock className="h-4 w-4 text-warning" />
              </div>
              <div className="text-2xl font-bold text-warning">
                {new Intl.NumberFormat("fr-DZ", {
                  style: "currency",
                  currency: "DZD",
                  maximumFractionDigits: 0,
                }).format(stats.totalRestant)}
              </div>
            </div>

            <div className="p-4 rounded-lg border bg-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">En Retard</span>
                <AlertCircle className="h-4 w-4 text-destructive" />
              </div>
              <div className="text-2xl font-bold text-destructive">
                {stats.enRetard}
              </div>
            </div>
          </div>
        )}

        {/* Formulaires d'ajout */}
        {showAddFormFacture && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-background border-b p-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold">Nouvelle Facture</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowAddFormFacture(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="p-6">
                <AddFactureForm
                  typeFacture="FACTURE"
                  onSuccess={() => {
                    setShowAddFormFacture(false);
                    fetchAllData();
                  }}
                  onCancel={() => setShowAddFormFacture(false)}
                />
              </div>
            </div>
          </div>
        )}

        {showAddFormBonLivraison && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-background border-b p-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold">Nouveau Bon de livraison</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowAddFormBonLivraison(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="p-6">
                <AddFactureForm
                  typeFacture="BON_LIVRAISON"
                  onSuccess={() => {
                    setShowAddFormBonLivraison(false);
                    fetchAllData();
                  }}
                  onCancel={() => setShowAddFormBonLivraison(false)}
                />
              </div>
            </div>
          </div>
        )}

        {showAddFormDevis && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-background border-b p-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold">Nouveau Devis</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowAddFormDevis(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="p-6">
                <AddDevisForm
                  onSuccess={() => {
                    setShowAddFormDevis(false);
                    fetchAllData();
                  }}
                  onCancel={() => setShowAddFormDevis(false)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Barre de recherche et filtres */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder={`Rechercher par client, n° ${sectionActive === "devis" ? "devis" : "document"} ou date...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={filtreStatut === null ? "default" : "outline"}
              size="sm"
              onClick={() => setFiltreStatut(null)}
            >
              Tout ({getCurrentData().length})
            </Button>
            
            {sectionActive === "devis" ? (
              <>
                <Button
                  variant={filtreStatut === "Brouillon" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFiltreStatut("Brouillon")}
                >
                  Brouillon ({devis.filter(d => d.statut === "Brouillon").length})
                </Button>
                <Button
                  variant={filtreStatut === "Envoyé" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFiltreStatut("Envoyé")}
                >
                  Envoyé ({devis.filter(d => d.statut === "Envoyé").length})
                </Button>
                <Button
                  variant={filtreStatut === "Accepté" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFiltreStatut("Accepté")}
                >
                  Accepté ({devis.filter(d => d.statut === "Accepté").length})
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant={filtreStatut === "Brouillon" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFiltreStatut("Brouillon")}
                >
                  <FileText className="h-4 w-4 mr-1" />
                  Brouillon
                </Button>
                <Button
                  variant={filtreStatut === "Partiellement payée" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFiltreStatut("Partiellement payée")}
                >
                  <Clock className="h-4 w-4 mr-1" />
                  Partiel
                </Button>
                <Button
                  variant={filtreStatut === "Payée" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFiltreStatut("Payée")}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Payée
                </Button>
                <Button
                  variant={filtreStatut === "en_retard" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFiltreStatut("en_retard")}
                  className={filtreStatut === "en_retard" ? "bg-red-600 hover:bg-red-700" : "hover:bg-red-50 text-red-600 border-red-200"}
                >
                  <AlertCircle className="h-4 w-4 mr-1" />
                  En retard
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Tables selon la section active */}
        {sectionActive === "devis" ? (
          <DevisTable 
            devis={devisFiltres}
            onSelectDevis={setSelectedDevis}
            onConvertir={handleConvertirDevisEnFacture}
            searchTerm={searchTerm}
            filtreStatut={filtreStatut}
            onAddNew={() => setShowAddFormDevis(true)}
          />
        ) : sectionActive === "bons_livraison" ? (
          <FactureTable 
            factures={bonsLivraisonFiltres}
            onSelectFacture={setSelectedFacture}
            onVoirFacture={handleVoirFacture}
            loadingPdf={loadingPdf}
            searchTerm={searchTerm}
            filtreStatut={filtreStatut}
            onAddNew={() => setShowAddFormBonLivraison(true)}
            isBonLivraison
          />
        ) : (
          <FactureTable 
            factures={facturesFiltrees}
            onSelectFacture={setSelectedFacture}
            onVoirFacture={handleVoirFacture}
            loadingPdf={loadingPdf}
            searchTerm={searchTerm}
            filtreStatut={filtreStatut}
            onAddNew={() => setShowAddFormFacture(true)}
          />
        )}

        {/* Modals */}
        {selectedFacture && (
          <FactureDetailModal
            id_facture={selectedFacture}
            onClose={() => setSelectedFacture(null)}
            onUpdate={() => {
              fetchAllData();
              setSelectedFacture(null);
            }}
          />
        )}

        {selectedDevis && (
          <DevisDetailModal
            id_devis={selectedDevis}
            onClose={() => setSelectedDevis(null)}
            onUpdate={() => {
              fetchAllData();
              setSelectedDevis(null);
            }}
          />
        )}
      </div>
    </MainLayout>
  );
};

export default Ventes;