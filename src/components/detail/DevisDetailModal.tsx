// components/detail/DevisDetailModal.tsx
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  X,
  FileCheck,
  User,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  Send,
  Ban
} from "lucide-react";
import devisService from "@/services/devisService";
import produitService from "@/services/produitService";

interface DevisDetailModalProps {
  id_devis: number;
  onClose: () => void;
  onUpdate: () => void;
}

export function DevisDetailModal({ id_devis, onClose, onUpdate }: DevisDetailModalProps) {
  const [devis, setDevis] = useState<any>(null);
  const [produits, setProduits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [id_devis]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [devisRes, produitsRes] = await Promise.all([
        devisService.getById(id_devis),
        produitService.getAll()
      ]);
      
      setDevis(devisRes.data);
      setProduits(produitsRes.data);
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangerStatut = async (nouveauStatut: string) => {
    if (!confirm(`Voulez-vous changer le statut du devis en "${nouveauStatut}" ?`)) return;
    
    try {
      await devisService.changerStatut(id_devis, nouveauStatut);
      alert("Statut modifié avec succès !");
      fetchData();
      onUpdate();
    } catch (error: any) {
      alert(`Erreur: ${error.message}`);
    }
  };

  const handleConvertirEnFacture = async () => {
    if (!confirm("Voulez-vous convertir ce devis en facture ?")) return;
    
    try {
      await devisService.convertirEnFacture(id_devis);
      alert("Devis converti en facture avec succès !");
      onUpdate();
      onClose();
    } catch (error: any) {
      alert(`Erreur: ${error.message}`);
    }
  };

  const getNomProduit = (id_produit: number) => {
    const produit = produits.find(p => p.id_produit === id_produit);
    return produit ? produit.nom : `Produit #${id_produit}`;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!devis) return null;

  const statusConfig = {
    "Brouillon": { icon: FileCheck, className: "bg-muted text-muted-foreground border-border" },
    "Envoyé": { icon: Clock, className: "bg-blue-100 text-blue-800 border-blue-300" },
    "Accepté": { icon: CheckCircle, className: "bg-success/10 text-success border-success/20" },
    "Refusé": { icon: AlertCircle, className: "bg-destructive/10 text-destructive border-destructive/20" },
    "Expiré": { icon: AlertCircle, className: "bg-orange-100 text-orange-800 border-orange-300" },
  };

  const config = statusConfig[devis.statut as keyof typeof statusConfig] || statusConfig["Brouillon"];
  const Icon = config.icon;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <FileCheck className="h-6 w-6 text-primary" />
              {devis.numero_devis}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Détails du devis
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Informations générales */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted/30 rounded-lg p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <User className="h-4 w-4" />
                <span className="text-sm font-medium">Client</span>
              </div>
              <p className="font-semibold text-lg">{devis.client}</p>
            </div>

            <div className="bg-muted/30 rounded-lg p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Calendar className="h-4 w-4" />
                <span className="text-sm font-medium">Date du devis</span>
              </div>
              <p className="font-semibold">
                {new Date(devis.date_devis).toLocaleDateString("fr-FR")}
              </p>
            </div>

            <div className="bg-muted/30 rounded-lg p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-medium">Date de validité</span>
              </div>
              <p className="font-semibold">
                {devis.date_validite 
                  ? new Date(devis.date_validite).toLocaleDateString("fr-FR")
                  : "Non définie"
                }
              </p>
            </div>

            <div className="bg-muted/30 rounded-lg p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Statut</span>
              </div>
              <Badge variant="outline" className={config.className}>
                <Icon className="h-3 w-3 mr-1" />
                {devis.statut}
              </Badge>
            </div>
          </div>

          {/* Lignes du devis */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <FileCheck className="h-5 w-5" />
              Lignes du devis ({devis.lignes?.length || 0})
            </h3>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 font-medium">Produit</th>
                    <th className="text-right p-3 font-medium">Prix unit. HT</th>
                    <th className="text-center p-3 font-medium">Qté</th>
                    <th className="text-right p-3 font-medium">Remise ligne</th>
                    <th className="text-right p-3 font-medium">TVA</th>
                    <th className="text-right p-3 font-medium">Total ligne TTC</th>
                  </tr>
                </thead>
                <tbody>
                  {devis.lignes?.map((ligne: any, index: number) => {
                    const prixHT = ligne.prix_unitaire_ht || 0;
                    const quantite = ligne.quantite || 0;
                    const remiseLigne = ligne.remise_ligne || 0;
                    const tauxTVA = ligne.taux_tva || 0;
                    
                    const totalHTAvantRemise = prixHT * quantite;
                    const montantRemise = totalHTAvantRemise * (remiseLigne / 100);
                    const totalHTApresRemise = totalHTAvantRemise - montantRemise;
                    const montantTVA = totalHTApresRemise * (tauxTVA / 100);
                    const totalTTC = totalHTApresRemise + montantTVA;
                    
                    return (
                      <tr key={index} className="border-t">
                        <td className="p-3">
                          <div>
                            <p className="font-medium">{getNomProduit(ligne.id_produit)}</p>
                            {ligne.description && (
                              <p className="text-xs text-muted-foreground">{ligne.description}</p>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-right">{prixHT.toFixed(2)} DZD</td>
                        <td className="p-3 text-center">{quantite}</td>
                        <td className="p-3 text-right">
                          {remiseLigne > 0 ? (
                            <span className="text-orange-600">{remiseLigne}%</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="p-3 text-right">{tauxTVA}%</td>
                        <td className="p-3 text-right font-semibold">
                          {totalTTC.toFixed(2)} DZD
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Totaux */}
            <div className="mt-4 bg-muted/30 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Sous-total HT (lignes):</span>
                <span className="font-semibold">
                  {(devis.montant_ht || 0).toFixed(2)} DZD
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>TVA (lignes):</span>
                <span className="font-semibold">
                  {(devis.montant_tva || 0).toFixed(2)} DZD
                </span>
              </div>
              <div className="flex justify-between text-sm border-t pt-2">
                <span>Total avant remise globale:</span>
                <span className="font-semibold">
                  {((devis.montant_ht || 0) + (devis.montant_tva || 0)).toFixed(2)} DZD
                </span>
              </div>
              
              {(devis.remise_globale || 0) > 0 && (
                <>
                  <div className="flex justify-between text-orange-600 font-medium">
                    <span>Remise globale ({devis.remise_globale}%):</span>
                    <span>
                      - {(((devis.montant_ht || 0) + (devis.montant_tva || 0)) * (devis.remise_globale / 100)).toFixed(2)} DZD
                    </span>
                  </div>
                </>
              )}
              
              <div className="flex justify-between text-lg font-bold border-t-2 border-primary/20 pt-2 mt-2">
                <span>TOTAL TTC:</span>
                <span className="text-primary">{(devis.montant_ttc || 0).toFixed(2)} DZD</span>
              </div>
            </div>
          </div>

          {/* Conditions et notes */}
          {(devis.conditions_paiement || devis.notes) && (
            <div className="bg-muted/30 rounded-lg p-4">
              {devis.conditions_paiement && (
                <div className="mb-2">
                  <span className="text-sm font-medium">Conditions de paiement : </span>
                  <span className="text-sm">{devis.conditions_paiement}</span>
                </div>
              )}
              {devis.notes && (
                <div>
                  <span className="text-sm font-medium">Notes : </span>
                  <span className="text-sm">{devis.notes}</span>
                </div>
              )}
            </div>
          )}

          {/* Actions selon le statut */}
          <div className="flex gap-3 pt-4 border-t">
            {devis.statut === "Brouillon" && (
              <Button onClick={() => handleChangerStatut("Envoyé")} className="flex-1">
                <Send className="h-4 w-4 mr-2" />
                Marquer comme envoyé
              </Button>
            )}
            
            {devis.statut === "Envoyé" && (
              <>
                <Button onClick={() => handleChangerStatut("Accepté")} className="flex-1">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Accepter
                </Button>
                <Button 
                  onClick={() => handleChangerStatut("Refusé")} 
                  variant="outline" 
                  className="flex-1"
                >
                  <Ban className="h-4 w-4 mr-2" />
                  Refuser
                </Button>
              </>
            )}

            {devis.statut === "Accepté" && (
              <Button onClick={handleConvertirEnFacture} className="flex-1">
                <CheckCircle className="h-4 w-4 mr-2" />
                Convertir en facture
              </Button>
            )}

            <Button variant="outline" onClick={onClose}>
              Fermer
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}