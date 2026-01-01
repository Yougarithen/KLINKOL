import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Calendar } from "@/components/ui/calendar";
import { CalendarDays, Plus, Trash2, Calculator, Check, ChevronsUpDown } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import produitService from "@/services/produitService";
import recetteProductionService from "@/services/recetteProductionService";

// Types
interface ProduitSimulation {
  id: number;
  nom: string;
  quantite: number;
  recette: RecetteIngredient[];
}

interface RecetteIngredient {
  id_matiere: number;
  nom_matiere: string;
  quantite_necessaire: number;
  unite: string;
}

interface MatriceRow {
  id_matiere: number;
  nom_matiere: string;
  unite: string;
  quantites: { [produitId: number]: number };
  total: number;
}

// Fonction pour formater les quantités avec conversion automatique kg -> tonnes
const formaterQuantite = (quantite: number, unite: string): { valeur: string; unite: string } => {
  if (unite.toLowerCase() === 'kg' && quantite > 100) {
    return {
      valeur: (quantite / 1000).toFixed(4),
      unite: 'T'
    };
  }
  return {
    valeur: quantite.toFixed(4),
    unite: unite
  };
};

export default function Simulation() {
  const [dateDebut, setDateDebut] = useState<Date | undefined>(undefined);
  const [dateFin, setDateFin] = useState<Date | undefined>(undefined);
  const [produitsDisponibles, setProduitsDisponibles] = useState<any[]>([]);
  const [produitsSimulation, setProduitsSimulation] = useState<ProduitSimulation[]>([]);
  const [openProductPopover, setOpenProductPopover] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [quantiteProduit, setQuantiteProduit] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Charger les produits disponibles au montage
  useEffect(() => {
    loadProduits();
  }, []);

  const loadProduits = async () => {
    try {
      setLoading(true);
      const result = await produitService.getAll();
      if (result.success) {
        setProduitsDisponibles(result.data);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des produits:", error);
    } finally {
      setLoading(false);
    }
  };

  // Ajouter un produit à la simulation
  const ajouterProduit = async () => {
    // Remplacer la virgule par un point pour le parsing
    const quantiteNormalisee = quantiteProduit.replace(',', '.');
    const quantiteFloat = parseFloat(quantiteNormalisee);
    
    if (!selectedProductId || !quantiteProduit || isNaN(quantiteFloat) || quantiteFloat <= 0) {
      alert("Veuillez sélectionner un produit et entrer une quantité valide");
      return;
    }

    // Vérifier si le produit est déjà dans la simulation
    if (produitsSimulation.some(p => p.id === selectedProductId)) {
      alert("Ce produit est déjà dans la simulation");
      return;
    }

    try {
      setLoading(true);
      // Récupérer la recette du produit
      const recetteResult = await recetteProductionService.getByProduit(selectedProductId);
      
      if (!recetteResult.success) {
        alert("Erreur lors de la récupération de la recette");
        return;
      }

      const produit = produitsDisponibles.find(p => p.id_produit === selectedProductId);
      
      const nouveauProduit: ProduitSimulation = {
        id: selectedProductId,
        nom: produit?.nom || "Produit inconnu",
        quantite: quantiteFloat,
        recette: recetteResult.data.map((r: any) => ({
          id_matiere: r.id_matiere,
          nom_matiere: r.matiere_nom,
          quantite_necessaire: parseFloat(String(r.quantite_necessaire).replace(',', '.')) || 0,
          unite: r.matiere_unite,
        })),
      };

      setProduitsSimulation([...produitsSimulation, nouveauProduit]);
      
      // Réinitialiser les champs
      setSelectedProductId(null);
      setQuantiteProduit("");
      setOpenProductPopover(false);
    } catch (error) {
      console.error("Erreur lors de l'ajout du produit:", error);
      alert("Erreur lors de l'ajout du produit");
    } finally {
      setLoading(false);
    }
  };

  // Supprimer un produit de la simulation
  const supprimerProduit = (produitId: number) => {
    setProduitsSimulation(produitsSimulation.filter(p => p.id !== produitId));
  };

  // Construire la matrice des matières premières
  const construireMatrice = (): MatriceRow[] => {
    const matriceMap = new Map<number, MatriceRow>();

    produitsSimulation.forEach(produit => {
      produit.recette.forEach(ingredient => {
        if (!matriceMap.has(ingredient.id_matiere)) {
          matriceMap.set(ingredient.id_matiere, {
            id_matiere: ingredient.id_matiere,
            nom_matiere: ingredient.nom_matiere,
            unite: ingredient.unite,
            quantites: {},
            total: 0,
          });
        }

        const row = matriceMap.get(ingredient.id_matiere)!;
        
        // Les valeurs sont déjà converties correctement lors de l'ajout du produit
        const quantiteCalculee = ingredient.quantite_necessaire * produit.quantite;
        
        row.quantites[produit.id] = quantiteCalculee;
        row.total += quantiteCalculee;
      });
    });

    return Array.from(matriceMap.values());
  };

  const matrice = construireMatrice();

  return (
    <MainLayout>
      <div className="container mx-auto p-6 space-y-6">


        {/* Matrice de simulation */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-primary" />
                  Matrice de Simulation
                </CardTitle>
                <CardDescription>
                  Ajoutez des produits et visualisez les besoins en matières premières
                </CardDescription>
              </div>
              
              {/* Bouton Ajouter Produit */}
              <Popover open={openProductPopover} onOpenChange={setOpenProductPopover}>
                <PopoverTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Ajouter Produit
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-4" align="end">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Produit</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className="w-full justify-between"
                          >
                            {selectedProductId
                              ? produitsDisponibles.find(p => p.id_produit === selectedProductId)?.nom
                              : "Sélectionner un produit..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput placeholder="Rechercher un produit..." />
                            <CommandList>
                              <CommandEmpty>Aucun produit trouvé.</CommandEmpty>
                              <CommandGroup>
                                {produitsDisponibles.map((produit) => (
                                  <CommandItem
                                    key={produit.id_produit}
                                    value={produit.nom}
                                    onSelect={() => {
                                      setSelectedProductId(produit.id_produit);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        selectedProductId === produit.id_produit ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {produit.nom}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label>Quantité à produire</Label>
                      <Input
                        type="number"
                        placeholder="Ex: 100"
                        value={quantiteProduit}
                        onChange={(e) => setQuantiteProduit(e.target.value)}
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <Button 
                      className="w-full" 
                      onClick={ajouterProduit}
                      disabled={loading || !selectedProductId || !quantiteProduit}
                    >
                      {loading ? "Chargement..." : "Ajouter à la simulation"}
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </CardHeader>
          <CardContent>
            {/* Sélection de l'intervalle de dates */}
            <div className="mb-6 pb-6 border-b">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Date de début */}
                <div className="space-y-2">
                  <Label>Date de début</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dateDebut && "text-muted-foreground"
                        )}
                      >
                        <CalendarDays className="mr-2 h-4 w-4" />
                        {dateDebut ? format(dateDebut, "d MMMM yyyy", { locale: fr }) : "Sélectionner une date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateDebut}
                        onSelect={setDateDebut}
                        locale={fr}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Date de fin */}
                <div className="space-y-2">
                  <Label>Date de fin</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dateFin && "text-muted-foreground"
                        )}
                      >
                        <CalendarDays className="mr-2 h-4 w-4" />
                        {dateFin ? format(dateFin, "d MMMM yyyy", { locale: fr }) : "Sélectionner une date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateFin}
                        onSelect={setDateFin}
                        locale={fr}
                        initialFocus
                        disabled={(date) => dateDebut ? date < dateDebut : false}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {dateDebut && dateFin && (
                <div className="mt-4 p-3 bg-primary/10 rounded-lg">
                  <p className="text-sm font-medium">
                    Période sélectionnée : {format(dateDebut, "d MMM", { locale: fr })} - {format(dateFin, "d MMM yyyy", { locale: fr })}
                  </p>
                </div>
              )}
            </div>

            {produitsSimulation.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  Aucun produit ajouté à la simulation
                </p>
                <p className="text-sm text-muted-foreground">
                  Cliquez sur "Ajouter Produit" pour commencer
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b-2">
                      <th className="text-left p-3 font-semibold bg-muted/50 sticky left-0 z-10">
                        Matière Première
                      </th>
                      {produitsSimulation.map(produit => (
                        <th key={produit.id} className="text-center p-3 font-semibold bg-muted/50 min-w-[200px]">
                          <div className="flex flex-col items-center gap-2">
                            <span className="text-sm">{produit.nom}</span>
                            <span className="text-xs text-muted-foreground font-normal">
                              Qté: {produit.quantite}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => supprimerProduit(produit.id)}
                              className="text-destructive hover:text-destructive h-6 w-6 p-0"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </th>
                      ))}
                      <th className="text-center p-3 font-semibold bg-primary/10 min-w-[150px]">
                        Total Nécessaire
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {matrice.length === 0 ? (
                      <tr>
                        <td colSpan={produitsSimulation.length + 2} className="text-center py-8 text-muted-foreground">
                          Les produits sélectionnés n'ont pas de recette définie
                        </td>
                      </tr>
                    ) : (
                      matrice.map((row, index) => (
                        <tr key={row.id_matiere} className={cn("border-b", index % 2 === 0 && "bg-muted/20")}>
                          <td className="p-3 font-medium sticky left-0 bg-background">
                            <div>
                              <div className="text-sm">{row.nom_matiere}</div>
                       
                            </div>
                          </td>
                          {produitsSimulation.map(produit => {
                            const quantiteFormatee = formaterQuantite(row.quantites[produit.id] || 0, row.unite);
                            return (
                            <td key={produit.id} className="p-3 text-center">
                              {row.quantites[produit.id] !== undefined ? (
                                <div className="font-medium text-sm">
                                  {quantiteFormatee.valeur} {quantiteFormatee.unite}
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-xs">-</span>
                              )}
                            </td>
                          );})}
                          <td className="p-3 text-center bg-primary/5">
                            {(() => {
                              const totalFormate = formaterQuantite(row.total, row.unite);
                              return (
                                <div className="font-bold text-sm text-primary">
                                  {totalFormate.valeur} {totalFormate.unite}
                                </div>
                              );
                            })()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Résumé des besoins */}
        {matrice.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-primary" />
                Résumé des Besoins en Matières Premières
              </CardTitle>
              <CardDescription>
                Quantités totales nécessaires pour la production planifiée
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {matrice.map(row => {
                  const totalFormate = formaterQuantite(row.total, row.unite);
                  return (
                  <div
                    key={row.id_matiere}
                    className="p-4 rounded-lg border-2 border-primary/30 bg-primary/5"
                  >
                    <h4 className="font-semibold text-sm mb-2">{row.nom_matiere}</h4>
                    <div className="space-y-1">
                      <div className="flex justify-between items-baseline">
                        <span className="text-xs text-muted-foreground">Total nécessaire:</span>
                        <span className="font-bold text-lg text-primary">
                          {totalFormate.valeur}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground text-right">
                        {totalFormate.unite}
                      </div>
                    </div>
                  </div>
                );})}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}