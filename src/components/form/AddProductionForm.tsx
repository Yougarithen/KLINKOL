import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Combobox } from "@headlessui/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Package, AlertTriangle } from "lucide-react";
import produitService from "@/services/produitService";
import productionService from "@/services/productionService";
import recetteProductionService from "@/services/recetteProductionService";

// Types
interface Produit {
  id_produit: number;
  code_produit: string;
  nom: string;
  unite: string;
  stock_actuel: number;
  poids?: number;
  unite_poids?: string;
}

interface MatierePremiere {
  matiere: string;
  necessaire: number;
  disponible: number;
  manquant?: number;
  unite: string;
}

interface VerificationStock {
  possible: boolean;
  matieres_ok: MatierePremiere[];
  matieres_manquantes: MatierePremiere[];
}

interface AddProductionFormData {
  id_produit: number;
  quantite_produite: number;
  operateur: string;
  commentaire?: string;
}

interface AddProductionFormProps {
  onSuccess?: () => void;
}

export function AddProductionForm({ onSuccess }: AddProductionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [selectedProduit, setSelectedProduit] = useState<Produit | null>(null);
  const [produitQuery, setProduitQuery] = useState("");
  const [verificationStock, setVerificationStock] = useState<VerificationStock | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const form = useForm<AddProductionFormData>({
    defaultValues: {
      id_produit: 0,
      quantite_produite: 0,
      operateur: "",
      commentaire: "",
    },
  });

  const quantiteProduite = form.watch("quantite_produite");

  // Charger les produits au montage
  useEffect(() => {
    loadProduits();
  }, []);

  // Vérifier le stock quand le produit ou la quantité change
  useEffect(() => {
    if (selectedProduit && quantiteProduite > 0) {
      verifierStock();
    } else {
      setVerificationStock(null);
    }
  }, [selectedProduit, quantiteProduite]);

  const loadProduits = async () => {
    try {
      const response = await produitService.getAll();
      if (response.success) {
        setProduits(response.data);
      }
    } catch (error: any) {
      console.error("Erreur lors du chargement des produits:", error);
    }
  };

  const verifierStock = async () => {
    if (!selectedProduit || quantiteProduite <= 0) return;

    setIsVerifying(true);
    try {
      // SOLUTION 1 : Si votre backend a la route /production/verifier-stock
      // const response = await productionService.verifierStock(
      //   selectedProduit.id_produit,
      //   quantiteProduite
      // );

      // SOLUTION 2 : Utiliser recetteProductionService.verifierDisponibilite
      const response = await recetteProductionService.verifierDisponibilite(
        selectedProduit.id_produit,
        quantiteProduite
      );

      if (response.success) {
        // Transformer les données du format recetteProductionService
        const data = response.data;
        
        // Si votre backend retourne { disponible, matieres_manquantes }
        if ('disponible' in data) {
          const verif: VerificationStock = {
            possible: data.disponible,
            matieres_ok: [],
            matieres_manquantes: data.matieres_manquantes || []
          };
          
          // Récupérer la recette complète pour avoir toutes les matières
          const recetteResponse = await recetteProductionService.getByProduit(selectedProduit.id_produit);
          if (recetteResponse.success) {
            recetteResponse.data.forEach((ingredient: any) => {
              const quantiteNecessaire = ingredient.quantite_necessaire * quantiteProduite;
              const matManquante = data.matieres_manquantes?.find((m: any) => m.matiere === ingredient.matiere_nom);
              
              if (!matManquante) {
                verif.matieres_ok.push({
                  matiere: ingredient.matiere_nom,
                  necessaire: quantiteNecessaire,
                  disponible: quantiteNecessaire, // Simplifié
                  unite: ingredient.matiere_unite
                });
              }
            });
          }
          
          setVerificationStock(verif);
        } else {
          // Format déjà correct
          setVerificationStock(data);
        }
      }
    } catch (error: any) {
      console.error("Erreur lors de la vérification du stock:", error);
      setVerificationStock(null);
      // Ne pas bloquer l'utilisateur, juste afficher un warning
      console.warn("Vérification du stock impossible, la production sera quand même tentée");
    } finally {
      setIsVerifying(false);
    }
  };

  const filteredProduits =
    produitQuery === ""
      ? produits
      : produits.filter((p) =>
          p.nom.toLowerCase().includes(produitQuery.toLowerCase()) ||
          p.code_produit.toLowerCase().includes(produitQuery.toLowerCase())
        );

  const handleProduitChange = (produit: Produit | null) => {
    setSelectedProduit(produit);
    if (produit) {
      form.setValue("id_produit", produit.id_produit);
    }
    setVerificationStock(null);
  };

  const handleSubmit = async (data: AddProductionFormData) => {
    if (isSubmitting) return;

    // Vérifier que le stock est suffisant
    if (verificationStock && !verificationStock.possible) {
      setSubmitError("Stock insuffisant pour cette production");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      console.log("Données envoyées au backend:", data);

      // Utiliser produire() qui gère automatiquement la consommation des matières premières
      const response = await productionService.produire(
        data.id_produit,
        data.quantite_produite,
        data.operateur,
        data.commentaire || null
      );

      if (response.success) {
        console.log("Production créée avec succès:", response.data);
        
        if (onSuccess) {
          onSuccess();
        }

        // Réinitialiser le formulaire
        form.reset();
        setSelectedProduit(null);
        setProduitQuery("");
        setVerificationStock(null);
      }
    } catch (error: any) {
      console.error("Erreur lors de la création de la production:", error);
      setSubmitError(error.message || "Une erreur est survenue");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full border-slate-100">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl flex items-center gap-2">
          <Package className="w-6 h-6" />
          Ajouter un lot de production
        </CardTitle>
        <CardDescription>
          Enregistrez une nouvelle production et mettez à jour automatiquement les stocks
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Message d'erreur */}
            {submitError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Erreur</AlertTitle>
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            )}

            {/* Sélection du produit */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Produit à fabriquer *
              </label>
              <Combobox value={selectedProduit} onChange={handleProduitChange}>
                <div className="relative">
                  <Combobox.Input
                    className="border border-slate-200 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onChange={(e) => setProduitQuery(e.target.value)}
                    displayValue={(p: Produit | null) =>
                      p ? `${p.code_produit} - ${p.nom}` : ""
                    }
                    placeholder="Rechercher un produit..."
                  />
                  <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-slate-200 bg-white shadow-lg">
                    {filteredProduits.length === 0 ? (
                      <div className="p-3 text-gray-500">Aucun produit trouvé</div>
                    ) : (
                      filteredProduits.map((p) => (
                        <Combobox.Option
                          key={p.id_produit}
                          value={p}
                          className={({ active }) =>
                            `cursor-pointer select-none p-3 ${
                              active ? "bg-blue-500 text-white" : ""
                            }`
                          }
                        >
                          {({ selected }) => (
                            <div className="flex justify-between items-center">
                              <div>
                                <div className="font-medium">
                                  {p.code_produit} - {p.nom}
                                </div>
                                <div className={`text-sm ${selected ? "text-blue-100" : "text-gray-500"}`}>
                                  Stock actuel: {p.stock_actuel} {p.unite}
                                </div>
                              </div>
                              {selected && (
                                <CheckCircle2 className="w-5 h-5" />
                              )}
                            </div>
                          )}
                        </Combobox.Option>
                      ))
                    )}
                  </Combobox.Options>
                </div>
              </Combobox>
              {selectedProduit && (
                <div className="mt-2 text-sm text-gray-600 bg-blue-50 p-3 rounded-md">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-blue-600" />
                    <span className="font-medium">Stock actuel:</span>
                    <span>{selectedProduit.stock_actuel} {selectedProduit.unite}</span>
                    {selectedProduit.poids && (
                      <span className="text-gray-500">
                        ({selectedProduit.poids} {selectedProduit.unite_poids}/{selectedProduit.unite})
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Quantité à produire */}
            <FormField
              control={form.control}
              name="quantite_produite"
              rules={{
                required: "La quantité est requise",
                min: { value: 0.01, message: "La quantité doit être supérieure à 0" }
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantité à produire *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Ex: 100"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  {selectedProduit && (
                    <FormDescription>
                      Unité: {selectedProduit.unite}
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Vérification du stock */}
            {isVerifying && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                Vérification du stock des matières premières...
              </div>
            )}

            {verificationStock && !isVerifying && (
              <div className="space-y-3">
                {verificationStock.possible ? (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-800">
                      Production possible
                    </AlertTitle>
                    <AlertDescription className="text-green-700">
                      Toutes les matières premières sont disponibles en quantité suffisante.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Stock insuffisant</AlertTitle>
                    <AlertDescription>
                      Certaines matières premières manquent pour cette production.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Détail des matières premières */}
                <div className="border rounded-md overflow-hidden">
                  <div className="bg-slate-50 px-4 py-2 font-medium text-sm">
                    Matières premières nécessaires
                  </div>
                  <div className="divide-y">
                    {verificationStock.matieres_ok.map((m, index) => (
                      <div key={index} className="px-4 py-3 flex justify-between items-center">
                        <div>
                          <div className="font-medium">{m.matiere}</div>
                          <div className="text-sm text-gray-500">
                            Nécessaire: {m.necessaire} {m.unite}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-green-600 font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" />
                            Disponible
                          </div>
                          <div className="text-sm text-gray-500">
                            Stock: {m.disponible} {m.unite}
                          </div>
                        </div>
                      </div>
                    ))}
                    {verificationStock.matieres_manquantes.map((m, index) => (
                      <div key={index} className="px-4 py-3 flex justify-between items-center bg-red-50">
                        <div>
                          <div className="font-medium text-red-900">{m.matiere}</div>
                          <div className="text-sm text-red-700">
                            Nécessaire: {m.necessaire} {m.unite}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-red-600 font-medium flex items-center gap-1">
                            <AlertTriangle className="w-4 h-4" />
                            Manquant: {m.manquant} {m.unite}
                          </div>
                          <div className="text-sm text-gray-500">
                            Disponible: {m.disponible} {m.unite}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Opérateur */}
            <FormField
              control={form.control}
              name="operateur"
              rules={{ required: "Le nom de l'opérateur est requis" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Opérateur responsable *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Ahmed Belkacem" {...field} />
                  </FormControl>
                  <FormDescription>
                    Nom de la personne responsable de cette production
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Commentaire */}
            <FormField
              control={form.control}
              name="commentaire"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Commentaire (optionnel)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ex: Production journalière du matin, équipe A"
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Résumé de la production */}
            {selectedProduit && quantiteProduite > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="font-medium text-blue-900 mb-2">Résumé de la production</div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Produit:</span>
                    <span className="font-medium">{selectedProduit.nom}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Quantité:</span>
                    <span className="font-medium">{quantiteProduite} {selectedProduit.unite}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Stock actuel:</span>
                    <span>{selectedProduit.stock_actuel} {selectedProduit.unite}</span>
                  </div>
                  <div className="flex justify-between border-t border-blue-200 pt-1 mt-1">
                    <span className="text-gray-600">Nouveau stock:</span>
                    <span className="font-medium text-green-600">
                      {(parseFloat(selectedProduit.stock_actuel.toString()) + parseFloat(quantiteProduite.toString())).toFixed(2)} {selectedProduit.unite}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Boutons d'action */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                disabled={
                  isSubmitting || 
                  !selectedProduit || 
                  quantiteProduite <= 0 || 
                  (verificationStock && !verificationStock.possible)
                }
              >
                {isSubmitting ? "Création en cours..." : "Créer la production"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset();
                  setSelectedProduit(null);
                  setProduitQuery("");
                  setVerificationStock(null);
                  setSubmitError(null);
                }}
                disabled={isSubmitting}
              >
                Réinitialiser
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}