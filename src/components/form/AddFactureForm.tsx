// components/form/AddFactureForm.tsx
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Loader2 } from "lucide-react";
import factureService from "@/services/factureService";
import clientService from "@/services/clientService";
import produitService from "@/services/produitService";

interface AddFactureFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  typeFacture?: "FACTURE" | "BON_LIVRAISON";
}

interface LigneFacture {
  id_produit: number;
  quantite: number;
  prix_unitaire_ht: number;
  taux_tva: number;
  remise_ligne: number;
  description: string;
  unite_vente: string;
}

export function AddFactureForm({ onSuccess, onCancel, typeFacture = "FACTURE" }: AddFactureFormProps) {
  const [clients, setClients] = useState<any[]>([]);
  const [produits, setProduits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    id_client: 0,
    date_facture: new Date().toISOString().split("T")[0],
    date_echeance: "",
    remise_globale: 0,
    conditions_paiement: "30 jours",
    notes: "",
    type_facture: typeFacture,
  });

  const [lignes, setLignes] = useState<LigneFacture[]>([
    {
      id_produit: 0,
      quantite: 1,
      prix_unitaire_ht: 0,
      taux_tva: 19,
      remise_ligne: 0,
      description: "",
      unite_vente: "unité",
    },
  ]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [clientsRes, produitsRes] = await Promise.all([
        clientService.getAll(),
        produitService.getAll(),
      ]);
      setClients(clientsRes.data);
      setProduits(produitsRes.data);
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const ajouterLigne = () => {
    setLignes([
      ...lignes,
      {
        id_produit: 0,
        quantite: 1,
        prix_unitaire_ht: 0,
        taux_tva: 19,
        remise_ligne: 0,
        description: "",
        unite_vente: "unité",
      },
    ]);
  };

  const supprimerLigne = (index: number) => {
    if (lignes.length > 1) {
      setLignes(lignes.filter((_, i) => i !== index));
    }
  };

  const updateLigne = (index: number, field: keyof LigneFacture, value: any) => {
    const newLignes = [...lignes];
    newLignes[index] = { ...newLignes[index], [field]: value };

    // Si on change le produit, mettre à jour le prix et la TVA automatiquement
    if (field === "id_produit") {
      const produit = produits.find((p) => p.id_produit === parseInt(value));
      if (produit) {
        newLignes[index].prix_unitaire_ht = produit.prix_vente_ht || 0;
        newLignes[index].taux_tva = produit.taux_tva || 19;
        newLignes[index].unite_vente = produit.unite_vente || "unité";
      }
    }

    setLignes(newLignes);
  };

  const calculerTotaux = () => {
    let totalHT = 0;
    let totalTVA = 0;

    lignes.forEach((ligne) => {
      const montantHTLigne = ligne.prix_unitaire_ht * ligne.quantite;
      const montantApresRemise = montantHTLigne * (1 - ligne.remise_ligne / 100);
      const montantTVALigne = montantApresRemise * (ligne.taux_tva / 100);

      totalHT += montantApresRemise;
      totalTVA += montantTVALigne;
    });

    // Appliquer la remise globale
    const remiseGlobale = (totalHT + totalTVA) * (formData.remise_globale / 100);
    const totalTTC = totalHT + totalTVA - remiseGlobale;

    return {
      totalHT: totalHT.toFixed(2),
      totalTVA: totalTVA.toFixed(2),
      remiseGlobale: remiseGlobale.toFixed(2),
      totalTTC: totalTTC.toFixed(2),
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.id_client === 0) {
      alert("Veuillez sélectionner un client");
      return;
    }

    if (lignes.some((l) => l.id_produit === 0)) {
      alert("Veuillez sélectionner un produit pour chaque ligne");
      return;
    }

    setSubmitting(true);
    try {
      // Créer la facture
      const factureRes = await factureService.create(formData);
      const id_facture = factureRes.data.id_facture;

      // Ajouter les lignes
      for (const ligne of lignes) {
        await factureService.ajouterLigne(id_facture, ligne);
      }

      alert(`${typeFacture === "BON_LIVRAISON" ? "Bon de livraison" : "Facture"} créé${typeFacture === "BON_LIVRAISON" ? "" : "e"} avec succès !`);
      onSuccess();
    } catch (error: any) {
      console.error("Erreur:", error);
      alert(`Erreur: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const totaux = calculerTotaux();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Informations générales */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Client <span className="text-destructive">*</span>
          </label>
          <select
            value={formData.id_client}
            onChange={(e) =>
              setFormData({ ...formData, id_client: parseInt(e.target.value) })
            }
            className="w-full border rounded-lg px-3 py-2"
            required
          >
            <option value={0}>Sélectionner un client</option>
            {clients.map((client) => (
              <option key={client.id_client} value={client.id_client}>
                {client.nom}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Date</label>
          <Input
            type="date"
            value={formData.date_facture}
            onChange={(e) =>
              setFormData({ ...formData, date_facture: e.target.value })
            }
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Date d'échéance</label>
          <Input
            type="date"
            value={formData.date_echeance}
            onChange={(e) =>
              setFormData({ ...formData, date_echeance: e.target.value })
            }
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Conditions de paiement</label>
          <Input
            value={formData.conditions_paiement}
            onChange={(e) =>
              setFormData({ ...formData, conditions_paiement: e.target.value })
            }
            placeholder="30 jours, 60 jours..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Remise globale (%)</label>
          <Input
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={formData.remise_globale}
            onChange={(e) =>
              setFormData({
                ...formData,
                remise_globale: parseFloat(e.target.value) || 0,
              })
            }
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Notes</label>
          <Input
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Notes optionnelles..."
          />
        </div>
      </div>

      {/* Lignes de facture */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Lignes de {typeFacture === "BON_LIVRAISON" ? "bon de livraison" : "facture"}</h3>
          <Button type="button" onClick={ajouterLigne} size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Ajouter une ligne
          </Button>
        </div>

        <div className="space-y-3">
          {lignes.map((ligne, index) => (
            <div key={index} className="border rounded-lg p-4 bg-muted/20">
              <div className="grid grid-cols-6 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium mb-1">Produit</label>
                  <select
                    value={ligne.id_produit}
                    onChange={(e) =>
                      updateLigne(index, "id_produit", parseInt(e.target.value))
                    }
                    className="w-full border rounded px-2 py-1.5 text-sm"
                    required
                  >
                    <option value={0}>Sélectionner</option>
                    {produits.map((produit) => (
                      <option key={produit.id_produit} value={produit.id_produit}>
                        {produit.nom}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1">Quantité</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={ligne.quantite}
                    onChange={(e) =>
                      updateLigne(index, "quantite", parseFloat(e.target.value) || 0)
                    }
                    className="text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1">Unité</label>
                  <select
                    value={ligne.unite_vente}
                    onChange={(e) => updateLigne(index, "unite_vente", e.target.value)}
                    className="w-full border rounded px-2 py-1.5 text-sm"
                  >
                    <option value="unité">Unité</option>
                    <option value="kg">Kg</option>
                    <option value="litre">Litre</option>
                    <option value="mètre">Mètre</option>
                    <option value="m²">m²</option>
                    <option value="m³">m³</option>
                    <option value="carton">Carton</option>
                    <option value="palette">Palette</option>
                    <option value="lot">Lot</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1">Prix HT</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={ligne.prix_unitaire_ht}
                    onChange={(e) =>
                      updateLigne(
                        index,
                        "prix_unitaire_ht",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    className="text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1">TVA (%)</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={ligne.taux_tva}
                    onChange={(e) =>
                      updateLigne(index, "taux_tva", parseFloat(e.target.value) || 0)
                    }
                    className="text-sm"
                  />
                </div>
              </div>

              <div className="mt-3 grid grid-cols-6 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Remise (%)</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={ligne.remise_ligne}
                    onChange={(e) =>
                      updateLigne(
                        index,
                        "remise_ligne",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    className="text-sm"
                  />
                </div>

                <div className="col-span-5 flex items-end gap-2">
                  <Input
                    value={ligne.description}
                    onChange={(e) => updateLigne(index, "description", e.target.value)}
                    placeholder="Description optionnelle..."
                    className="text-sm flex-1"
                  />
                  {lignes.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => supprimerLigne(index)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Totaux */}
      <div className="bg-muted/30 rounded-lg p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span>Total HT:</span>
          <span className="font-semibold">{totaux.totalHT} DZD</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Total TVA:</span>
          <span className="font-semibold">{totaux.totalTVA} DZD</span>
        </div>
        {formData.remise_globale > 0 && (
          <div className="flex justify-between text-sm text-orange-600">
            <span>Remise globale ({formData.remise_globale}%):</span>
            <span className="font-semibold">- {totaux.remiseGlobale} DZD</span>
          </div>
        )}
        <div className="flex justify-between text-lg font-bold border-t pt-2">
          <span>TOTAL TTC:</span>
          <span className="text-primary">{totaux.totalTTC} DZD</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button type="submit" disabled={submitting} className="flex-1">
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Création...
            </>
          ) : (
            `Créer ${typeFacture === "BON_LIVRAISON" ? "le bon de livraison" : "la facture"}`
          )}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
      </div>
    </form>
  );
}