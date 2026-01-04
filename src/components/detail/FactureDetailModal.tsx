// components/detail/FactureDetailModal.tsx - VERSION CORRIGÉE
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  X,
  FileText,
  User,
  Calendar,
  DollarSign,
  CreditCard,
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
  Loader2
} from "lucide-react";
import factureService from "@/services/factureService";
import paiementService from "@/services/paiementService";
import produitService from "@/services/produitService";

interface FactureDetailModalProps {
  id_facture: number;
  onClose: () => void;
  onUpdate: () => void;
}

export function FactureDetailModal({ id_facture, onClose, onUpdate }: FactureDetailModalProps) {
  const [facture, setFacture] = useState<any>(null);
  const [paiements, setPaiements] = useState<any[]>([]);
  const [produits, setProduits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddPaiement, setShowAddPaiement] = useState(false);
  const [submittingPaiement, setSubmittingPaiement] = useState(false);

  // Formulaire paiement
  const [nouveauPaiement, setNouveauPaiement] = useState({
    montant_paye: 0,
    mode_paiement: "Espèces",
    reference: "",
    responsable: "",
    commentaire: ""
  });

  useEffect(() => {
    fetchData();
  }, [id_facture]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [factureRes, paiementsRes, produitsRes] = await Promise.all([
        factureService.getById(id_facture),
        paiementService.getByFacture(id_facture),
        produitService.getAll()
      ]);
      
      setFacture(factureRes.data);
      setPaiements(paiementsRes.data);
      setProduits(produitsRes.data);
      
      // Initialiser le formulaire avec le montant restant
      setNouveauPaiement(prev => ({
        ...prev,
        montant_paye: Number(factureRes.data.montant_restant) || 0
      }));
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleValiderFacture = async () => {
    if (!confirm("Voulez-vous valider cette facture ? Cette action déduira le stock.")) return;
    
    try {
      await factureService.valider(id_facture);
      alert("Facture validée avec succès !");
      fetchData();
      onUpdate();
    } catch (error: any) {
      alert(`Erreur: ${error.message}`);
    }
  };

  const handleAjouterPaiement = async () => {
    if (nouveauPaiement.montant_paye <= 0) {
      alert("Le montant doit être supérieur à 0");
      return;
    }

    const montantRestant = Number(facture.montant_restant);
    if (nouveauPaiement.montant_paye > montantRestant) {
      alert(`Le montant ne peut pas dépasser ${montantRestant.toFixed(2)} DZD`);
      return;
    }

    setSubmittingPaiement(true);
    try {
      await paiementService.create({
        id_facture,
        ...nouveauPaiement
      });

      alert("Paiement enregistré avec succès !");
      setShowAddPaiement(false);
      setNouveauPaiement({
        montant_paye: 0,
        mode_paiement: "Espèces",
        reference: "",
        responsable: "",
        commentaire: ""
      });
      
      fetchData();
      onUpdate();
    } catch (error: any) {
      alert(`Erreur: ${error.message}`);
    } finally {
      setSubmittingPaiement(false);
    }
  };

  const handlePayerCompletement = async () => {
    const montantRestant = Number(facture.montant_restant);
    if (!confirm(`Voulez-vous enregistrer le paiement complet de ${montantRestant.toFixed(2)} DZD ?`)) return;

    try {
      await paiementService.payerCompletement(
        id_facture,
        "Espèces",
        "",
        "Caissier"
      );
      alert("Paiement complet enregistré !");
      fetchData();
      onUpdate();
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

  if (!facture) return null;

  const montantTTC = Number(facture.montant_ttc) || 0;
  const montantPaye = Number(facture.montant_paye) || 0;
  const montantRestant = Number(facture.montant_restant) || 0;
  
  const pourcentagePaye = montantTTC > 0 ? (montantPaye / montantTTC) * 100 : 0;
  const estEntierementPayee = montantRestant <= 0.01;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              {facture.numero_facture}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Détails de la facture et paiements
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
              <p className="font-semibold text-lg">{facture.client}</p>
            </div>

            <div className="bg-muted/30 rounded-lg p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Calendar className="h-4 w-4" />
                <span className="text-sm font-medium">Date</span>
              </div>
              <p className="font-semibold">
                {new Date(facture.date_facture).toLocaleDateString("fr-FR")}
              </p>
            </div>

            <div className="bg-muted/30 rounded-lg p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-medium">Échéance</span>
              </div>
              <p className="font-semibold">
                {facture.date_echeance 
                  ? new Date(facture.date_echeance).toLocaleDateString("fr-FR")
                  : "Non définie"
                }
              </p>
            </div>

            <div className="bg-muted/30 rounded-lg p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Statut</span>
              </div>
              <Badge variant="outline" className="text-sm">
                {facture.statut}
              </Badge>
            </div>
          </div>

          {/* Lignes de la facture */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Lignes de la facture ({facture.lignes?.length || 0})
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
                  {facture.lignes?.map((ligne: any, index: number) => {
                    // ✅ CONVERSION EN NOMBRE
                    const prixHT = Number(ligne.prix_unitaire_ht) || 0;
                    const quantite = Number(ligne.quantite) || 0;
                    const remiseLigne = Number(ligne.remise_ligne) || 0;
                    const tauxTVA = Number(ligne.taux_tva) || 0;
                    
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
                  {Number(facture.montant_ht || 0).toFixed(2)} DZD
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>TVA (lignes):</span>
                <span className="font-semibold">
                  {Number(facture.montant_tva || 0).toFixed(2)} DZD
                </span>
              </div>
              <div className="flex justify-between text-sm border-t pt-2">
                <span>Total avant remise globale:</span>
                <span className="font-semibold">
                  {(Number(facture.montant_ht || 0) + Number(facture.montant_tva || 0)).toFixed(2)} DZD
                </span>
              </div>
              
              {Number(facture.remise_globale || 0) > 0 && (
                <>
                  <div className="flex justify-between text-orange-600 font-medium">
                    <span>Remise globale ({facture.remise_globale}%):</span>
                    <span>
                      - {Number(facture.montant_remise || 0).toFixed(2)} DZD
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span className="text-xs">Sous-total HT après remise:</span>
                    <span className="text-xs">
                      {(Number(facture.montant_ht || 0) * (1 - Number(facture.remise_globale || 0) / 100)).toFixed(2)} DZD
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span className="text-xs">TVA après remise:</span>
                    <span className="text-xs">
                      {(Number(facture.montant_tva || 0) * (1 - Number(facture.remise_globale || 0) / 100)).toFixed(2)} DZD
                    </span>
                  </div>
                </>
              )}
              
              <div className="flex justify-between text-lg font-bold border-t-2 border-primary/20 pt-2 mt-2">
                <span>TOTAL À PAYER TTC:</span>
                <span className="text-primary">{montantTTC.toFixed(2)} DZD</span>
              </div>
            </div>
          </div>

          {/* Statut paiement */}
          <div className="bg-muted/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-success" />
                État des paiements
              </h3>
              <span className="text-sm font-semibold">
                {pourcentagePaye.toFixed(0)}% payé
              </span>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
              <div
                className="bg-success h-3 rounded-full transition-all"
                style={{ width: `${pourcentagePaye}%` }}
              />
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-muted-foreground">Total achat</p>
                <p className="font-bold">{montantTTC.toFixed(2)} DZD</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total payé</p>
                <p className="font-bold text-success">{montantPaye.toFixed(2)} DZD</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Solde</p>
                <p className="font-bold text-warning">{montantRestant.toFixed(2)} DZD</p>
              </div>
            </div>
          </div>

          {/* Historique des paiements */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Historique des paiements ({paiements.length})
              </h3>
              {!estEntierementPayee && facture.statut !== "Brouillon" && (
                <Button
                  size="sm"
                  onClick={() => setShowAddPaiement(!showAddPaiement)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un paiement
                </Button>
              )}
            </div>

            {estEntierementPayee && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  Cette facture est entièrement payée
                </span>
              </div>
            )}

            {/* Formulaire ajout paiement */}
            {showAddPaiement && !estEntierementPayee && (
              <div className="mb-4 p-4 border rounded-lg bg-muted/20">
                <h4 className="font-semibold mb-3">Nouveau paiement</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">Montant (DZD)</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={nouveauPaiement.montant_paye}
                      onChange={(e) => setNouveauPaiement({
                        ...nouveauPaiement,
                        montant_paye: parseFloat(e.target.value) || 0
                      })}
                      max={montantRestant}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Maximum: {montantRestant.toFixed(2)} DZD
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Mode de paiement</label>
                    <select
                      value={nouveauPaiement.mode_paiement}
                      onChange={(e) => setNouveauPaiement({
                        ...nouveauPaiement,
                        mode_paiement: e.target.value
                      })}
                      className="border rounded px-3 py-2 w-full"
                    >
                      <option value="Espèces">Espèces</option>
                      <option value="Chèque">Chèque</option>
                      <option value="Virement">Virement</option>
                      <option value="Carte bancaire">Carte bancaire</option>
                      <option value="Traite">Traite</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Référence</label>
                    <Input
                      value={nouveauPaiement.reference}
                      onChange={(e) => setNouveauPaiement({
                        ...nouveauPaiement,
                        reference: e.target.value
                      })}
                      placeholder="N° chèque, virement..."
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Responsable</label>
                    <Input
                      value={nouveauPaiement.responsable}
                      onChange={(e) => setNouveauPaiement({
                        ...nouveauPaiement,
                        responsable: e.target.value
                      })}
                      placeholder="Nom du caissier"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="text-sm font-medium">Commentaire</label>
                    <Input
                      value={nouveauPaiement.commentaire}
                      onChange={(e) => setNouveauPaiement({
                        ...nouveauPaiement,
                        commentaire: e.target.value
                      })}
                      placeholder="Commentaire optionnel"
                    />
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <Button
                    onClick={handleAjouterPaiement}
                    disabled={submittingPaiement}
                    className="flex-1"
                  >
                    {submittingPaiement ? "Enregistrement..." : "Enregistrer le paiement"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowAddPaiement(false)}
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            )}

            {/* Liste des paiements */}
            {paiements.length > 0 ? (
              <div className="space-y-2">
                {paiements.map((paiement: any) => (
                  <div key={paiement.id_paiement} className="border rounded-lg p-3 bg-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-success" />
                        <div>
                          <p className="font-semibold">{Number(paiement.montant_paye || 0).toFixed(2)} DZD</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(paiement.date_paiement).toLocaleDateString("fr-FR")} • {paiement.mode_paiement}
                            {paiement.reference && ` • ${paiement.reference}`}
                          </p>
                        </div>
                      </div>
                      {paiement.responsable && (
                        <Badge variant="outline">{paiement.responsable}</Badge>
                      )}
                    </div>
                    {paiement.commentaire && (
                      <p className="text-sm text-muted-foreground mt-2">{paiement.commentaire}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Aucun paiement enregistré
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            {facture.statut === "Brouillon" && (
              <Button onClick={handleValiderFacture} className="flex-1">
                <CheckCircle className="h-4 w-4 mr-2" />
                Valider la facture
              </Button>
            )}
            
            {!estEntierementPayee && facture.statut !== "Brouillon" && (
              <Button onClick={handlePayerCompletement} variant="outline" className="flex-1">
                Payer le solde ({montantRestant.toFixed(2)} DZD)
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