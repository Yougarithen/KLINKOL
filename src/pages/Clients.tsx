import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  Eye, 
  Phone, 
  MapPin, 
  History, 
  Loader2,
  Users,
  AlertCircle
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
import { toast } from "sonner";
import { ClientDetailModal } from "@/components/detail/ClientDetailModal";
import { AddClientForm } from "@/components/form/AddClientForm";
import { HistoriqueDetailModal } from "@/components/detail/HistoriqueDetailModal";
import { ClientTypeBadge, getTypeConfig } from "@/util/clientTypeHelpers.tsx";

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

  const [selectedClient, setSelectedClient] = useState<ClientDisplay | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isHistoriqueModalOpen, setIsHistoriqueModalOpen] = useState(false);

  /* =========================
     FETCH CLIENTS
  ========================= */
  const fetchClients = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await clientService.getAll();
      setClients(response.data.map(mapClientToDisplay));
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
            onClick={() => {
              setSelectedClient(client);
              setIsHistoriqueModalOpen(true);
            }}
          >
            <History className="h-4 w-4 mr-1" />
            Historique
          </Button>
        </div>
      ),
    },
  ];

  /* =========================
     STATS CALCULATION (Dynamique)
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

      {/* Modal Historique Client */}
      <Dialog open={isHistoriqueModalOpen} onOpenChange={setIsHistoriqueModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedClient && (
            <HistoriqueDetailModal 
              clientId={selectedClient.id_client}
              clientNom={selectedClient.nom}
            />
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default Clients;