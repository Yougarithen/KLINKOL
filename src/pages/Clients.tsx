import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  Eye, 
  Phone, 
  MapPin, 
  Loader2,
  Users,
  AlertCircle,
  FileText
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import clientService from "@/services/clientService";
import factureService from "@/services/factureService";
import paiementService from "@/services/paiementService";
import { toast } from "sonner";
import { ClientDetailModal } from "@/components/detail/ClientDetailModal";
import { AddClientForm } from "@/components/form/AddClientForm";
import { ClientTypeBadge, getTypeConfig } from "@/util/clientTypeHelpers.tsx";
import { genererEtatCreancesTousClientsPDF, genererEtatCreancesClientPDF } from "@/util/creancepdfGenerator";
import { DateRangeSelector } from "@/components/form/DateRangeSelector";

/* =========================
   TYPES
========================= */
interface ClientDisplay {
  id: string;
  id_client: number;
  nom: string;
  adresse: string;
  telephone: string;
  email: string;
  TypeC: string;
  totalAchats: number;
  creance: number;
  numeroRc: string;
  nif: string;
  assujettiTva: boolean;
  numero_rc?: string;
  contact?: string;
  n_article?: string;
}

interface CreanceClient {
  nom: string;
  totalAchats: number;
  totalPaye: number;
  solde: number;
  factures: {
    numero_facture: string;
    date_facture: string;
    montant_ttc: number;
    montant_paye: number;
    montant_restant: number;
  }[];
}

/* =========================
   HELPERS
========================= */
const mapClientToDisplay = (client: any): ClientDisplay => ({
  id: `CLI-${String(client.id_client).padStart(3, "0")}`,
  id_client: client.id_client,
  nom: client.nom,
  adresse: client.adresse || "",
  telephone: client.telephone || "",
  email: client.email || "",
  TypeC: client.TypeC || "Entreprise",
  totalAchats: client.total_achats || 0,
  creance: client.creance || 0,
  numeroRc: client.numero_rc || "",
  numero_rc: client.numero_rc || "",
  nif: client.nif || "",
  n_article: client.n_article || "",
  contact: client.contact || "",
  assujettiTva: client.assujetti_tva === 1,
});

/* =========================
   COMPONENT
========================= */
const Clients = () => {
  const [clients, setClients] = useState<ClientDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [generatingClientPDF, setGeneratingClientPDF] = useState<number | null>(null);

  const [selectedClient, setSelectedClient] = useState<ClientDisplay | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // États pour la sélection de période
  const [isDateRangeDialogOpen, setIsDateRangeDialogOpen] = useState(false);
  const [isClientDateRangeDialogOpen, setIsClientDateRangeDialogOpen] = useState(false);
  const [clientForPDF, setClientForPDF] = useState<ClientDisplay | null>(null);

  /* =========================
     FETCH CLIENTS
  ========================= */
  const fetchClients = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await clientService.getAll();
      
      // ✅ Supprimer les doublons en se basant sur l'id_client
      const clientsUniques = response.data.reduce((acc: any[], client: any) => {
        // Vérifier si ce client existe déjà dans l'accumulateur
        const existe = acc.find(c => c.id_client === client.id_client);
        if (!existe) {
          acc.push(client);
        }
        return acc;
      }, []);
      
      setClients(clientsUniques.map(mapClientToDisplay));
      
      // ⚠️ Logger pour débogage si des doublons ont été trouvés
      if (response.data.length !== clientsUniques.length) {
        console.warn(`${response.data.length - clientsUniques.length} doublons détectés et supprimés`);
      }
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement des clients");
      toast.error("Erreur lors du chargement des clients");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  /* =========================
     GÉNÉRATION PDF CRÉANCES TOUS CLIENTS
  ========================= */
  const handleGenerateAllClientsReport = () => {
    setIsDateRangeDialogOpen(true);
  };

  const genererEtatCreances = async (dateRange: { startDate: string; endDate: string; label: string }) => {
    try {      toast.loading("Génération du PDF en cours...");
      setGeneratingPDF(true);
      setIsDateRangeDialogOpen(false);


      const facturesResponse = await factureService.getAll();
      const factures = facturesResponse.data;

      const paiementsResponse = await paiementService.getAll();
      const paiements = paiementsResponse.data;

      // Filtrer les factures par date
      const facturesFiltrees = factures.filter(f => {
        if (!f.date_facture) return false;
        const dateFacture = new Date(f.date_facture);
        const debut = new Date(dateRange.startDate);
        const fin = new Date(dateRange.endDate);
        fin.setHours(23, 59, 59, 999); // Inclure toute la journée de fin
        return dateFacture >= debut && dateFacture <= fin;
      });

      const creancesParClient: { [key: number]: CreanceClient } = {};

      clients.forEach(client => {
        const facturesClient = facturesFiltrees.filter(f => f.id_client === client.id_client);
        
        if (facturesClient.length === 0) return;

        const totalAchats = facturesClient.reduce((sum, f) => {
          const montant = parseFloat(String(f.montant_ttc || 0));
          return sum + (isNaN(montant) ? 0 : montant);
        }, 0);
        
        const totalPaye = facturesClient.reduce((sum, facture) => {
          const paiementsFacture = paiements.filter(p => p.id_facture === facture.id_facture);
          const montantPayeFacture = paiementsFacture.reduce((s, p) => {
            const montant = parseFloat(String(p.montant_paye || 0));
            return s + (isNaN(montant) ? 0 : montant);
          }, 0);
          return sum + montantPayeFacture;
        }, 0);

        const solde = totalAchats - totalPaye;

        if (solde > 0) {
          creancesParClient[client.id_client] = {
            nom: client.nom,
            totalAchats,
            totalPaye,
            solde,
            factures: facturesClient
              .filter(f => {
                const paiementsFacture = paiements.filter(p => p.id_facture === f.id_facture);
                const montantPayeFacture = paiementsFacture.reduce((s, p) => {
                  const montant = parseFloat(String(p.montant_paye || 0));
                  return s + (isNaN(montant) ? 0 : montant);
                }, 0);
                const montantTTC = parseFloat(String(f.montant_ttc || 0));
                return (isNaN(montantTTC) ? 0 : montantTTC) - montantPayeFacture > 0;
              })
              .map(f => {
                const paiementsFacture = paiements.filter(p => p.id_facture === f.id_facture);
                const montantPayeFacture = paiementsFacture.reduce((s, p) => {
                  const montant = parseFloat(String(p.montant_paye || 0));
                  return s + (isNaN(montant) ? 0 : montant);
                }, 0);
                const montantTTC = parseFloat(String(f.montant_ttc || 0));
                const montantTTCFinal = isNaN(montantTTC) ? 0 : montantTTC;
                
                return {
                  numero_facture: f.numero_facture || 'N/A',
                  date_facture: f.date_facture || new Date().toISOString(),
                  montant_ttc: montantTTCFinal,
                  montant_paye: montantPayeFacture,
                  montant_restant: montantTTCFinal - montantPayeFacture
                };
              })
          };
        }
      });

      const creancesArray = Object.values(creancesParClient);

      if (creancesArray.length === 0) {
        toast.dismiss();
        toast.info(`Aucune créance pour la période : ${dateRange.label}`);
        return;
      }

      await genererEtatCreancesTousClientsPDF(creancesArray, dateRange.label);
      
      toast.dismiss();
      toast.success("PDF généré avec succès !");
    } catch (err: any) {
      console.error("Erreur génération PDF:", err);
      toast.dismiss();
      toast.error("Erreur lors de la génération du PDF");
    } finally {
      setGeneratingPDF(false);
    }
  };

  /* =========================
     GÉNÉRATION PDF CRÉANCES CLIENT SPÉCIFIQUE
  ========================= */
  const handleGenerateClientReport = (client: ClientDisplay) => {
    setClientForPDF(client);
    setIsClientDateRangeDialogOpen(true);
  };

  const genererEtatCreancesClient = async (client: ClientDisplay, dateRange: { startDate: string; endDate: string; label: string }) => {
    try {
      setGeneratingClientPDF(client.id_client);
      setIsClientDateRangeDialogOpen(false);
      toast.loading(`Génération du PDF pour ${client.nom}...`);

      const facturesResponse = await factureService.getAll();
      const factures = facturesResponse.data.filter(f => f.id_client === client.id_client);

      // Filtrer les factures par date
      const facturesFiltrees = factures.filter(f => {
        if (!f.date_facture) return false;
        const dateFacture = new Date(f.date_facture);
        const debut = new Date(dateRange.startDate);
        const fin = new Date(dateRange.endDate);
        fin.setHours(23, 59, 59, 999);
        return dateFacture >= debut && dateFacture <= fin;
      });

      if (facturesFiltrees.length === 0) {
        toast.dismiss();
        toast.info(`Aucune facture pour ce client sur la période : ${dateRange.label}`);
        return;
      }

      const paiementsResponse = await paiementService.getAll();
      const paiements = paiementsResponse.data;

      const totalAchats = facturesFiltrees.reduce((sum, f) => {
        const montant = parseFloat(String(f.montant_ttc || 0));
        return sum + (isNaN(montant) ? 0 : montant);
      }, 0);
      
      const totalPaye = facturesFiltrees.reduce((sum, facture) => {
        const paiementsFacture = paiements.filter(p => p.id_facture === facture.id_facture);
        const montantPayeFacture = paiementsFacture.reduce((s, p) => {
          const montant = parseFloat(String(p.montant_paye || 0));
          return s + (isNaN(montant) ? 0 : montant);
        }, 0);
        return sum + montantPayeFacture;
      }, 0);

      const solde = totalAchats - totalPaye;

      const creanceClient: CreanceClient = {
        nom: client.nom,
        totalAchats,
        totalPaye,
        solde,
        factures: facturesFiltrees
          .filter(f => {
            const paiementsFacture = paiements.filter(p => p.id_facture === f.id_facture);
            const montantPayeFacture = paiementsFacture.reduce((s, p) => {
              const montant = parseFloat(String(p.montant_paye || 0));
              return s + (isNaN(montant) ? 0 : montant);
            }, 0);
            const montantTTC = parseFloat(String(f.montant_ttc || 0));
            return (isNaN(montantTTC) ? 0 : montantTTC) - montantPayeFacture > 0;
          })
          .map(f => {
            const paiementsFacture = paiements.filter(p => p.id_facture === f.id_facture);
            const montantPayeFacture = paiementsFacture.reduce((s, p) => {
              const montant = parseFloat(String(p.montant_paye || 0));
              return s + (isNaN(montant) ? 0 : montant);
            }, 0);
            const montantTTC = parseFloat(String(f.montant_ttc || 0));
            const montantTTCFinal = isNaN(montantTTC) ? 0 : montantTTC;
            
            return {
              numero_facture: f.numero_facture || 'N/A',
              date_facture: f.date_facture || new Date().toISOString(),
              montant_ttc: montantTTCFinal,
              montant_paye: montantPayeFacture,
              montant_restant: montantTTCFinal - montantPayeFacture
            };
          })
      };

      // Préparer les informations du client pour le PDF
      const clientInfo = {
        adresse: client.adresse,
        telephone: client.telephone,
        nif: client.nif,
        numero_rc: client.numeroRc,
        n_article: client.n_article
      };

      await genererEtatCreancesClientPDF(creanceClient, clientInfo, dateRange.label);
      
      toast.dismiss();
      toast.success("PDF généré avec succès !");
    } catch (err: any) {
      console.error("Erreur génération PDF:", err);
      toast.dismiss();
      toast.error("Erreur lors de la génération du PDF");
    } finally {
      setGeneratingClientPDF(null);
    }
  };

  /* =========================
     HANDLE SUCCESS
  ========================= */
  const handleClientSuccess = () => {
    setIsAddModalOpen(false);
    setIsDetailModalOpen(false);
    fetchClients();
    toast.success("Opération réussie !", {
      position: "bottom-right",
      duration: 3000,
    });
  };

  /* =========================
     TABLE COLUMNS
  ========================= */
  const columns = [
    {
      key: "nom",
      header: "Nom / Raison Sociale",
      render: (client: ClientDisplay) => (
        <div>
          <p className="font-medium text-foreground">{client.nom}</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {client.adresse || "Non renseigné"}
          </p>
        </div>
      ),
    },
    {
      key: "TypeC",
      header: "Type",
      render: (client: ClientDisplay) => (
        <ClientTypeBadge type={client.TypeC} />
      ),
    },
    {
      key: "telephone",
      header: "Téléphone",
      render: (client: ClientDisplay) => (
        <span className="flex items-center gap-2 text-sm">
          <Phone className="h-4 w-4 text-muted-foreground" />
          {client.telephone || "-"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (client: ClientDisplay) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                const response = await clientService.getById(client.id_client);
                setSelectedClient(mapClientToDisplay(response.data));
                setIsDetailModalOpen(true);
              } catch {
                toast.error("Impossible de charger le client");
              }
            }}
          >
            <Eye className="h-4 w-4 mr-1" />
            Détails
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleGenerateClientReport(client)}
            disabled={generatingClientPDF === client.id_client}
            className="bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
          >
            {generatingClientPDF === client.id_client ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <FileText className="h-4 w-4 mr-1" />
            )}
            Créances du client
          </Button>
        </div>
      ),
    },
  ];

  /* =========================
     STATS CALCULATION
  ========================= */
  const typeStats = clients.reduce((acc, client) => {
    const type = client.TypeC;
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  /* =========================
     LOADING STATE
  ========================= */
  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Chargement des clients...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  /* =========================
     ERROR STATE
  ========================= */
  if (error) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center max-w-md">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Erreur de chargement</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchClients}>
              Réessayer
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  /* =========================
     RENDER
  ========================= */
  return (
    <MainLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="animate-fade-in">
          <h1 className="text-3xl font-bold tracking-tight text-foreground font-display">
            Clients
          </h1>
          <p className="mt-1 text-muted-foreground">
            Gestion du portefeuille clients
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={fetchClients}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Users className="h-4 w-4 mr-2" />
            )}
            Actualiser
          </Button>

          {/* BOUTON ÉTAT DES CRÉANCES GLOBAL */}
          <Button
            variant="outline"
            onClick={handleGenerateAllClientsReport}
            disabled={generatingPDF || clients.length === 0}
            className="bg-orange-50 hover:bg-orange-100 border-orange-200 text-orange-700"
          >
            {generatingPDF ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileText className="h-4 w-4 mr-2" />
            )}
            État global des créances 
          </Button>
          
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nouveau Client
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Ajouter un client</DialogTitle>
                <DialogDescription>
                  Créez un nouveau client dans votre portefeuille
                </DialogDescription>
              </DialogHeader>
              <AddClientForm onSuccess={handleClientSuccess} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Dynamiques */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Total Clients</p>
          <p className="text-2xl font-bold text-primary">
            {clients.length}
          </p>
        </div>
        {Object.entries(typeStats).slice(0, 3).map(([type, count]) => {
          const config = getTypeConfig(type);
          const Icon = config.icon;
          return (
            <div key={type} className="stat-card">
              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Icon className="h-4 w-4" />
                {type}
              </p>
              <p className={`text-2xl font-bold ${config.color}`}>
                {count}
              </p>
            </div>
          );
        })}
      </div>

      {/* Message si aucun client */}
      {clients.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/20">
          <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucun client</h3>
          <p className="text-muted-foreground mb-4">
            Commencez par ajouter votre premier client
          </p>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau Client
          </Button>
        </div>
      ) : (
        <DataTable
          data={clients}
          columns={columns}
          searchPlaceholder="Rechercher un client..."
          searchKeys={["nom", "telephone", "adresse", "email", "numeroRc", "nif", "TypeC"]}
          rowKey={(row: ClientDisplay) => row.id}
        />
      )}

      {/* Modal Détails Client */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails du client</DialogTitle>
            <DialogDescription>
              Consultez et modifiez les informations du client
            </DialogDescription>
          </DialogHeader>
          <ClientDetailModal 
            client={selectedClient}
            onClientUpdated={handleClientSuccess}
          />
        </DialogContent>
      </Dialog>

      {/* Dialogue Sélection Période - Tous les clients */}
      <Dialog open={isDateRangeDialogOpen} onOpenChange={setIsDateRangeDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Sélectionner la période</DialogTitle>
            <DialogDescription>
              Choisissez la période pour l'état des créances de tous les clients
            </DialogDescription>
          </DialogHeader>
          <DateRangeSelector
            onConfirm={genererEtatCreances}
            onCancel={() => setIsDateRangeDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Dialogue Sélection Période - Client spécifique */}
      <Dialog open={isClientDateRangeDialogOpen} onOpenChange={setIsClientDateRangeDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Sélectionner la période</DialogTitle>
            <DialogDescription>
              Choisissez la période pour l'état des créances de {clientForPDF?.nom}
            </DialogDescription>
          </DialogHeader>
          <DateRangeSelector
            onConfirm={(dateRange) => clientForPDF && genererEtatCreancesClient(clientForPDF, dateRange)}
            onCancel={() => setIsClientDateRangeDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default Clients;