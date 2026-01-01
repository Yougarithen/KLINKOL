import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  FileText,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  Eye,
  RefreshCw,
} from "lucide-react";
import factureService from "@/services/factureService";
import { toast } from "sonner";
import { formatCurrency } from "@/util/formatUtils";
import { corrigerFactures, calculerTotauxFactures } from "@/util/facture-utils";

/* =========================
   TYPES
========================= */
interface Facture {
  id_facture: number;
  numero_facture: string;
  date_facture: string;
  date_echeance: string;
  statut: string;
  montant_ht: number;
  montant_tva: number;
  montant_ttc: number;
  montant_paye: number;
  montant_restant: number;
  client?: string;
}

interface HistoriqueDetailModalProps {
  clientId: number;
  clientNom: string;
}

/* =========================
   HELPERS
========================= */
const getStatutBadge = (statut: string) => {
  const variants: Record<string, { className: string; icon: any }> = {
    "Brouillon": { 
      className: "bg-gray-100 text-gray-800 border-gray-200", 
      icon: Clock 
    },
    "Validée": { 
      className: "bg-blue-100 text-blue-800 border-blue-200", 
      icon: CheckCircle2 
    },
    "Partiellement payée": { 
      className: "bg-orange-100 text-orange-800 border-orange-200", 
      icon: AlertCircle 
    },
    "Payée": { 
      className: "bg-green-100 text-green-800 border-green-200", 
      icon: CheckCircle2 
    },
    "Annulée": { 
      className: "bg-red-100 text-red-800 border-red-200", 
      icon: AlertCircle 
    },
  };

  const config = variants[statut] || variants["Brouillon"];
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={`${config.className} flex items-center gap-1 w-fit`}>
      <Icon className="h-3 w-3" />
      {statut}
    </Badge>
  );
};

const formatDate = (dateString: string) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

/* =========================
   COMPONENT
========================= */
export const HistoriqueDetailModal = ({ 
  clientId, 
  clientNom 
}: HistoriqueDetailModalProps) => {
  const [factures, setFactures] = useState<Facture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* =========================
     FETCH FACTURES
  ========================= */
  const fetchFactures = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("🔍 Récupération des factures pour:", clientNom);
      
      // Récupérer toutes les factures
      const response = await factureService.getAll();
      
      // Filtrer par nom de client
      const nomClientLower = clientNom.toLowerCase().trim();
      const facturesClient = response.data.filter((f: any) => {
        if (!f.client) return false;
        const factureClientLower = f.client.toLowerCase().trim();
        return factureClientLower === nomClientLower || 
               factureClientLower.includes(nomClientLower) ||
               nomClientLower.includes(factureClientLower);
      });
      
      console.log(`📊 ${facturesClient.length} facture(s) trouvée(s)`);
      
      // Corriger les montants TTC
      const facturesCorrigees = corrigerFactures(facturesClient);
      
      // Trier par date décroissante
      const sortedFactures = [...facturesCorrigees].sort((a: Facture, b: Facture) => 
        new Date(b.date_facture).getTime() - new Date(a.date_facture).getTime()
      );
      
      setFactures(sortedFactures);
    } catch (err: any) {
      console.error("❌ Erreur:", err);
      setError(err.message || "Erreur lors du chargement de l'historique");
      toast.error("Erreur lors du chargement de l'historique");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFactures();
  }, [clientId, clientNom]);

  /* =========================
     STATS CALCULATION
  ========================= */
  const totaux = calculerTotauxFactures(factures);
  const stats = {
    total: factures.length,
    totalAchats: totaux.totalAchats,
    totalPaye: totaux.totalPaye,
    totalRestant: totaux.totalRestant,
  };

  /* =========================
     LOADING STATE
  ========================= */
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Chargement de l'historique...</p>
        </div>
      </div>
    );
  }

  /* =========================
     ERROR STATE
  ========================= */
  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Erreur</h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={fetchFactures} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Réessayer
        </Button>
      </div>
    );
  }

  /* =========================
     EMPTY STATE
  ========================= */
  if (factures.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Aucune facture</h3>
        <p className="text-muted-foreground mb-2">
          Ce client n'a pas encore de factures
        </p>
        <Button onClick={fetchFactures} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>
    );
  }

  /* =========================
     RENDER
  ========================= */
  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div> <Button onClick={fetchFactures} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
        </div>
 
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-xs text-blue-600 font-medium mb-1">Total Factures</p>
          <p className="text-2xl font-bold text-blue-700">{stats.total}</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <p className="text-xs text-purple-600 font-medium mb-1">Total Achats</p>
          <p className="text-lg font-bold text-purple-700">
            {formatCurrency(stats.totalAchats)}
          </p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-xs text-green-600 font-medium mb-1">Total Payé</p>
          <p className="text-lg font-bold text-green-700">
            {formatCurrency(stats.totalPaye)}
          </p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <p className="text-xs text-orange-600 font-medium mb-1">Reste à Payer</p>
          <p className="text-lg font-bold text-orange-700">
            {formatCurrency(stats.totalRestant)}
          </p>
        </div>
      </div>

      {/* Liste des factures */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
        {factures.map((facture) => (
          <div
            key={facture.id_facture}
            className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-card"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    {facture.numero_facture || "N/A"}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(facture.date_facture)}
                  </p>
                </div>
              </div>
              {getStatutBadge(facture.statut)}
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground text-xs mb-1">Montant TTC</p>
                <p className="font-semibold text-foreground">
                  {formatCurrency(facture.montant_ttc)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-1">Montant Payé</p>
                <p className="font-semibold text-green-600">
                  {formatCurrency(facture.montant_paye)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-1">Reste à Payer</p>
                <p className="font-semibold text-orange-600">
                  {formatCurrency(facture.montant_restant)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-1">Échéance</p>
                <p className={`font-semibold ${
                  new Date(facture.date_echeance) < new Date() && facture.montant_restant > 0
                    ? "text-red-600"
                    : "text-foreground"
                }`}>
                  {formatDate(facture.date_echeance)}
                </p>
              </div>
            </div>

            {/* Barre de progression du paiement */}
            {facture.montant_ttc > 0 && (
              <div className="mt-3">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Progression du paiement</span>
                  <span>
                    {((facture.montant_paye / facture.montant_ttc) * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      facture.montant_restant === 0
                        ? "bg-green-500"
                        : facture.montant_paye > 0
                        ? "bg-orange-500"
                        : "bg-gray-400"
                    }`}
                    style={{
                      width: `${Math.min(100, (facture.montant_paye / facture.montant_ttc) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            )}

          </div>
        ))}
      </div>
    </div>
  );
};