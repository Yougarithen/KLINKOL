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
import { AlertCircle, CheckCircle2, Package, AlertTriangle, ArrowRightLeft } from "lucide-react";
import produitService from "@/services/produitService";
import productionService from "@/services/productionService";
import recetteProductionService from "@/services/recetteProductionService";

// Constante de conversion
const SACS_PAR_PALETTE = 64;

// FONCTION ULTRA-ROBUSTE DE FORMATAGE
const formatQuantite = (value: any): string => {
  try {
    const num = Number(value);
    if (!isFinite(num) || isNaN(num)) return "0";
    return Number.isInteger(num) ? num.toString() : num.toFixed(2);
  } catch {
    return "0";
  }
};

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
  const [inputMode, setInputMode] = useState<"sacs" | "palettes">("sacs");
  const [paletteValue, setPaletteValue] = useState<number>(0);

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
      const response = await recetteProductionService.verifierDisponibilite(
        selectedProduit.id_produit,
        quantiteProduite
      );

      if (response.success) {
        const data = response.data;
        
        if ('disponible' in data) {
          const verif: VerificationStock = {
            possible: data.disponible,
            matieres_ok: [],
            matieres_manquantes: data.matieres_manquantes || []
          };
          
          const recetteResponse = await recetteProductionService.getByProduit(selectedProduit.id_produit);
          if (recetteResponse.success) {
            recetteResponse.data.forEach((ingredient: any) => {
              const quantiteNecessaire = ingredient.quantite_necessaire * quantiteProduite;
              const matManquante = data.matieres_manquantes?.find((m: any) => m.matiere === ingredient.matiere_nom);
              
              if (!matManquante) {
                verif.matieres_ok.push({
                  matiere: ingredient.matiere_nom,
                  necessaire: quantiteNecessaire,
                  disponible: quantiteNecessaire,
                  unite: ingredient.matiere_unite
                });
              }
            });
          }
          
          setVerificationStock(verif);
        } else {
          setVerificationStock(data);
        }
      }
    } catch (error: any) {
      console.error("Erreur lors de la vérification du stock:", error);
      setVerificationStock(null);
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

  const handleModeChange = () => {
    const newMode = inputMode === "sacs" ? "palettes" : "sacs";
    setInputMode(newMode);
    
    if (newMode === "palettes") {
      // Convertir sacs en palettes
      const palettes = Number(quantiteProduite) / SACS_PAR_PALETTE;
      setPaletteValue(palettes);
    } else {
      // Convertir palettes en sacs
      const sacs = Number(paletteValue) * SACS_PAR_PALETTE;
      form.setValue("quantite_produite", sacs);
    }
  };

  const handlePaletteChange = (value: number) => {
    setPaletteValue(value);
    const sacs = value * SACS_PAR_PALETTE;
    form.setValue("quantite_produite", sacs);
  };

  const handleSacChange = (value: number) => {
    form.setValue("quantite_produite", value);
    setPaletteValue(value / SACS_PAR_PALETTE);
  };

  const handleSubmit = async (data: AddProductionFormData) => {
    if (isSubmitting) return;

    if (verificationStock && !verificationStock.possible) {
      setSubmitError("Stock insuffisant pour cette production");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      console.log("Données envoyées au backend:", data);

      const response = await productionService.produire(
        data.id_produit,
        data.quantite_produite,
        data.operateur,
        data.commentaire || null
      );

      if (response.success) {
        console.log("Production créée avec succès:", response.data);
        
        form.reset({
          id_produit: 0,
          quantite_produite: 0,
          operateur: "",
          commentaire: "",
        });
        setSelectedProduit(null);
        setProduitQuery("");
        setVerificationStock(null);
        setPaletteValue(0);
        
        if (onSuccess) {
          onSuccess();
        }
      } else {
        setSubmitError(response.message || "Erreur lors de la création de la production");
      }
    } catch (error: any) {
      console.error("Erreur lors de la soumission:", error);
      setSubmitError(error.message || "Une erreur est survenue");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-none shadow-none">
      <CardHeader className="px-0">
        <CardTitle className="text-xl">Informations de production</CardTitle>
        <CardDescription>
          Remplissez les détails du lot de production
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {submitError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Erreur</AlertTitle>
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            )}

            {/* Sélection du produit */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Produit à produire *</label>
              <Combobox value={selectedProduit} onChange={handleProduitChange}>
                <div className="relative">
                  <Combobox.Input
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    displayValue={(produit: Produit | null) => produit?.nom || ""}
                    onChange={(event) => setProduitQuery(event.target.value)}
                    placeholder="Rechercher un produit..."
                  />
                  <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                    {filteredProduits.length === 0 && produitQuery !== "" ? (
                      <div className="relative cursor-default select-none px-4 py-2 text-gray-700">
                        Aucun produit trouvé.
                      </div>
                    ) : (
                      filteredProduits.map((produit) => (
                        <Combobox.Option
                          key={produit.id_produit}
                          value={produit}
                          className={({ active }) =>
                            `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                              active ? "bg-blue-600 text-white" : "text-gray-900"
                            }`
                          }
                        >
                          <div>
                            <span className="block truncate font-medium">
                              {produit.nom}
                            </span>
                            <span className="block truncate text-sm opacity-70">
                              Code: {produit.code_produit} | Stock: {formatQuantite(produit.stock_actuel)} {produit.unite}
                            </span>
                          </div>
                        </Combobox.Option>
                      ))
                    )}
                  </Combobox.Options>
                </div>
              </Combobox>
              {selectedProduit && (
                <p className="text-sm text-muted-foreground">
                  Stock actuel: {formatQuantite(selectedProduit.stock_actuel)} {selectedProduit.unite}
                </p>
              )}
            </div>

            {/* Quantité à produire avec toggle sacs/palettes */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <FormLabel>Quantité à produire *</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleModeChange}
                  className="flex items-center gap-2"
                >
                  <ArrowRightLeft className="h-4 w-4" />
                  {inputMode === "sacs" ? "Saisir en palettes" : "Saisir en sacs"}
                </Button>
              </div>

              {inputMode === "sacs" ? (
                <FormField
                  control={form.control}
                  name="quantite_produite"
                  rules={{
                    required: "La quantité est requise",
                    min: { value: 0.01, message: "La quantité doit être supérieure à 0" }
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type="number"
                            step="1"
                            placeholder="Ex: 64"
                            {...field}
                            onChange={(e) => handleSacChange(parseFloat(e.target.value) || 0)}
                            className="pr-16"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                            SACS
                          </span>
                        </div>
                      </FormControl>
                      {quantiteProduite > 0 && (
                        <FormDescription className="flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          = {formatQuantite(Number(quantiteProduite) / SACS_PAR_PALETTE)} palette{(Number(quantiteProduite) / SACS_PAR_PALETTE) > 1 ? 's' : ''}
                        </FormDescription>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Ex: 1.5"
                      value={paletteValue || ""}
                      onChange={(e) => handlePaletteChange(parseFloat(e.target.value) || 0)}
                      className="pr-20"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      PALETTES
                    </span>
                  </div>
                  {paletteValue > 0 && (
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      = {formatQuantite(quantiteProduite)} sac{Number(quantiteProduite) > 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              )}

              {quantiteProduite > 0 && (
                <div className="grid grid-cols-2 gap-4 p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground">Sacs</p>
                    <p className="text-lg font-semibold">{formatQuantite(quantiteProduite)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Palettes</p>
                    <p className="text-lg font-semibold">{formatQuantite(paletteValue)}</p>
                  </div>
                </div>
              )}
            </div>

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
                            Nécessaire: {formatQuantite(m.necessaire)} {m.unite}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-green-600 font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" />
                            Disponible
                          </div>
                          <div className="text-sm text-gray-500">
                            Stock: {formatQuantite(m.disponible)} {m.unite}
                          </div>
                        </div>
                      </div>
                    ))}
                    {verificationStock.matieres_manquantes.map((m, index) => (
                      <div key={index} className="px-4 py-3 flex justify-between items-center bg-red-50">
                        <div>
                          <div className="font-medium text-red-900">{m.matiere}</div>
                          <div className="text-sm text-red-700">
                            Nécessaire: {formatQuantite(m.necessaire)} {m.unite}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-red-600 font-medium flex items-center gap-1">
                            <AlertTriangle className="w-4 h-4" />
                            Manquant: {formatQuantite(m.manquant || 0)} {m.unite}
                          </div>
                          <div className="text-sm text-gray-500">
                            Disponible: {formatQuantite(m.disponible)} {m.unite}
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
                    <span className="font-medium">
                      {formatQuantite(quantiteProduite)} {selectedProduit.unite} ({formatQuantite(paletteValue)} PLT)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Stock actuel:</span>
                    <span>{formatQuantite(selectedProduit.stock_actuel)} {selectedProduit.unite}</span>
                  </div>
                  <div className="flex justify-between border-t border-blue-200 pt-1 mt-1">
                    <span className="text-gray-600">Nouveau stock:</span>
                    <span className="font-medium text-green-600">
                      {formatQuantite(Number(selectedProduit.stock_actuel) + Number(quantiteProduite))} {selectedProduit.unite}
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
                  setPaletteValue(0);
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