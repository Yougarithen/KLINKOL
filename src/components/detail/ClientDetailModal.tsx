import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Edit2, 
  Save, 
  X, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  FileText,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Download
} from "lucide-react";
import clientService from "@/services/clientService";
import { getTypeIcon, ClientTypeBadge } from "@/util/clientTypeHelpers.tsx";
import { genererFicheClientPDF } from "@/util/clientInfoPdfGenerator";
import { toast } from "sonner";

interface ClientType {
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

interface ClientDetailModalProps {
  client: ClientType | null;
  onClientUpdated?: () => void;
}

export function ClientDetailModal({ client, onClientUpdated }: ClientDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [editedClient, setEditedClient] = useState<ClientType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [clientTypes, setClientTypes] = useState<string[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(true);

  // Charger les types de clients
  useEffect(() => {
    const fetchTypes = async () => {
      try {
        setLoadingTypes(true);
        const response = await clientService.getTypes();
        const types = response.data.map((t: any) => t.TypeC);
        setClientTypes(types.length > 0 ? types : ["Entreprise", "Particulier", "Grossiste"]);
      } catch (error) {
        console.error("Erreur lors du chargement des types:", error);
        setClientTypes(["Entreprise", "Particulier", "Grossiste"]);
      } finally {
        setLoadingTypes(false);
      }
    };

    fetchTypes();
  }, []);

  if (!client) return null;

  const currentClient = isEditing ? editedClient : client;

  const handleEdit = () => {
    setEditedClient({ ...client });
    setIsEditing(true);
    setError(null);
    setSuccess(null);
  };

  const handleCancel = () => {
    setEditedClient(null);
    setIsEditing(false);
    setError(null);
    setSuccess(null);
  };

  const handleSave = async () => {
    if (!editedClient) return;

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      console.log('Updating client with ID:', editedClient.id_client);
      
      const updateData = {
        nom: editedClient.nom,
        adresse: editedClient.adresse,
        telephone: editedClient.telephone,
        email: editedClient.email,
        TypeC: editedClient.TypeC,
        numero_rc: editedClient.numeroRc || editedClient.numero_rc,
        nif: editedClient.nif,
        contact: editedClient.contact,
        n_article: editedClient.n_article,
      };

      console.log('Client data to update:', updateData);

      const result = await clientService.update(editedClient.id_client, updateData);

      if (result.success) {
        setSuccess("Client mis à jour avec succès !");
        setIsEditing(false);
        setEditedClient(null);
        
        setTimeout(() => {
          if (onClientUpdated) onClientUpdated();
        }, 1000);
      } else {
        throw new Error("Échec de la mise à jour");
      }
    } catch (error: any) {
      console.error('Error updating client:', error);
      setError(error.message || "Impossible de mettre à jour le client");
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: keyof ClientType, value: any) => {
    if (!editedClient) return;
    setEditedClient({ ...editedClient, [field]: value });
  };

  const handleGeneratePDF = async () => {
    if (!client) return;
    
    try {
      setIsGeneratingPDF(true);
      toast.loading("Génération du PDF en cours...");
      
      await genererFicheClientPDF(client);
      
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

  return (
    <div className="space-y-6">
      {/* Messages d'alerte */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Succès</AlertTitle>
          <AlertDescription className="text-green-700">{success}</AlertDescription>
        </Alert>
      )}

      {/* Header avec badge */}
      <div className="flex items-center justify-between pb-4 border-b">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              {currentClient?.nom}
            </h2>
            <div className="mt-1">
              <ClientTypeBadge type={currentClient?.TypeC || "Entreprise"} />
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          {!isEditing ? (
            <>
              <Button 
                onClick={handleGeneratePDF} 
                variant="outline" 
                size="sm"
                disabled={isGeneratingPDF}
                className="bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
              >
                {isGeneratingPDF ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Génération...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Imprimer infos
                  </>
                )}
              </Button>
              <Button onClick={handleEdit} variant="outline" size="sm">
                <Edit2 className="h-4 w-4 mr-2" />
                Modifier
              </Button>
            </>
          ) : (
            <>
              <Button 
                onClick={handleSave} 
                size="sm"
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Enregistrer
                  </>
                )}
              </Button>
              <Button 
                onClick={handleCancel} 
                variant="outline" 
                size="sm"
                disabled={isSaving}
              >
                <X className="h-4 w-4 mr-2" />
                Annuler
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Informations de contact */}
      <div className="bg-white rounded-lg border p-6 space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <Phone className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Informations de contact</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="nom" className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
              <User className="h-4 w-4" />
              Nom
            </Label>
            {isEditing ? (
              <Input
                id="nom"
                value={editedClient?.nom || ""}
                onChange={(e) => handleInputChange("nom", e.target.value)}
                className="mt-1"
              />
            ) : (
              <p className="text-base font-medium mt-1 p-2 bg-muted/50 rounded">
                {currentClient?.nom || "-"}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="TypeC" className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
              {(() => {
                const Icon = getTypeIcon(currentClient?.TypeC || "Entreprise");
                return <Icon className="h-4 w-4" />;
              })()}
              Type
            </Label>
            {isEditing ? (
              <Select
                value={editedClient?.TypeC || "Entreprise"}
                onValueChange={(value) => handleInputChange("TypeC", value)}
                disabled={loadingTypes}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder={loadingTypes ? "Chargement..." : "Sélectionnez"} />
                </SelectTrigger>
                <SelectContent>
                  {loadingTypes ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : (
                    clientTypes.map((type) => {
                      const Icon = getTypeIcon(type);
                      return (
                        <SelectItem key={type} value={type}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {type}
                          </div>
                        </SelectItem>
                      );
                    })
                  )}
                </SelectContent>
              </Select>
            ) : (
              <div className="mt-1">
                <ClientTypeBadge type={currentClient?.TypeC || "Entreprise"} />
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="telephone" className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Téléphone
            </Label>
            {isEditing ? (
              <Input
                id="telephone"
                value={editedClient?.telephone || ""}
                onChange={(e) => handleInputChange("telephone", e.target.value)}
                className="mt-1"
              />
            ) : (
              <p className="text-base font-medium mt-1 p-2 bg-muted/50 rounded">
                {currentClient?.telephone || "-"}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="email" className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email
            </Label>
            {isEditing ? (
              <Input
                id="email"
                type="email"
                value={editedClient?.email || ""}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className="mt-1"
              />
            ) : (
              <p className="text-base font-medium mt-1 p-2 bg-muted/50 rounded break-all">
                {currentClient?.email || "-"}
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="adresse" className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Adresse
            </Label>
            {isEditing ? (
              <Input
                id="adresse"
                value={editedClient?.adresse || ""}
                onChange={(e) => handleInputChange("adresse", e.target.value)}
                className="mt-1"
              />
            ) : (
              <p className="text-base font-medium mt-1 p-2 bg-muted/50 rounded">
                {currentClient?.adresse || "-"}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="contact" className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
              <User className="h-4 w-4" />
              Personne de contact
            </Label>
            {isEditing ? (
              <Input
                id="contact"
                value={editedClient?.contact || ""}
                onChange={(e) => handleInputChange("contact", e.target.value)}
                className="mt-1"
              />
            ) : (
              <p className="text-base font-medium mt-1 p-2 bg-muted/50 rounded">
                {currentClient?.contact || "-"}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Informations commerciales */}
      <div className="bg-white rounded-lg border p-6 space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Informations commerciales</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="numeroRc" className="text-sm text-muted-foreground mb-2">
              Numéro RC
            </Label>
            {isEditing ? (
              <Input
                id="numeroRc"
                value={editedClient?.numeroRc || editedClient?.numero_rc || ""}
                onChange={(e) => handleInputChange("numeroRc", e.target.value)}
                className="mt-1"
              />
            ) : (
              <p className="text-base font-medium mt-1 p-2 bg-muted/50 rounded">
                {currentClient?.numeroRc || currentClient?.numero_rc || "-"}
              </p>
            )}
          </div>
          
          <div>
            <Label htmlFor="nif" className="text-sm text-muted-foreground mb-2">
              NIF
            </Label>
            {isEditing ? (
              <Input
                id="nif"
                value={editedClient?.nif || ""}
                onChange={(e) => handleInputChange("nif", e.target.value)}
                className="mt-1"
              />
            ) : (
              <p className="text-base font-medium mt-1 p-2 bg-muted/50 rounded">
                {currentClient?.nif || "-"}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="n_article" className="text-sm text-muted-foreground mb-2">
              N° Article
            </Label>
            {isEditing ? (
              <Input
                id="n_article"
                value={editedClient?.n_article || ""}
                onChange={(e) => handleInputChange("n_article", e.target.value)}
                className="mt-1"
              />
            ) : (
              <p className="text-base font-medium mt-1 p-2 bg-muted/50 rounded">
                {currentClient?.n_article || "-"}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}