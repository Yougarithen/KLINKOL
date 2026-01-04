import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Trash2, 
  Calculator, 
  Check, 
  ChevronsUpDown,
  Package,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Box
} from "lucide-react";
import { format, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import produitService from "@/services/produitService";
import recetteProductionService from "@/services/recetteProductionService";
import matierePremiereService from "@/services/matierePremiereService";

// Types
interface ProductionJour {
  date: Date;
  productions: Production[];
}

interface Production {
  id: string;
  id_produit: number;
  nom_produit: string;
  quantite: number;
  unite_saisie: "unite" | "palette"; // pour traçabilité
  recette: RecetteIngredient[];
}

interface RecetteIngredient {
  id_matiere: number;
  nom_matiere: string;
  quantite_necessaire: number;
  unite: string;
}

interface MatiereResume {
  id_matiere: number;
  nom_matiere: string;
  unite: string;
  quantite_necessaire: number;
  stock_actuel: number;
  manquant: number;
  statut: "ok" | "insuffisant" | "critique";
}

interface Produit {
  id_produit: number;
  nom: string;
  code_produit: string;
  unite: string;
}

// Constante
const PALETTE_SIZE = 64;

export default function Simulation() {
  // États
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [productionsParJour, setProductionsParJour] = useState<ProductionJour[]>([]);
  const [produitsDisponibles, setProduitsDisponibles] = useState<Produit[]>([]);
  const [stocksMatiere, setStocksMatiere] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // États pour le formulaire inline (toujours en palettes)
  const [jourSelectionne, setJourSelectionne] = useState<Date | null>(null);
  const [openProductPopover, setOpenProductPopover] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [quantitePalettes, setQuantitePalettes] = useState<string>("");

  // Charger les données au montage
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [produitsResult, matieresResult] = await Promise.all([
        produitService.getAll(),
        matierePremiereService.getAll()
      ]);
      
      if (produitsResult.success) {
        setProduitsDisponibles(produitsResult.data);
      }
      if (matieresResult.success) {
        setStocksMatiere(matieresResult.data);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
    } finally {
      setLoading(false);
    }
  };

  // Obtenir les productions d'un jour
  const getProductionsJour = (date: Date): Production[] => {
    const jour = productionsParJour.find(p => isSameDay(p.date, date));
    return jour ? jour.productions : [];
  };

  // Ajouter une production à tous les jours sélectionnés
  const ajouterProduction = async () => {
    if (selectedDates.length === 0 || !selectedProductId || !quantitePalettes) {
      alert("Veuillez remplir tous les champs");
      return;
    }

    const quantiteNormalisee = quantitePalettes.replace(',', '.');
    const quantiteFloat = parseFloat(quantiteNormalisee);
    
    if (isNaN(quantiteFloat) || quantiteFloat <= 0) {
      alert("Veuillez entrer une quantité valide");
      return;
    }

    // Toujours convertir les palettes en unités
    const quantiteFinale = quantiteFloat * PALETTE_SIZE;

    try {
      setLoading(true);
      
      // Récupérer la recette du produit
      const recetteResult = await recetteProductionService.getByProduit(selectedProductId);
      
      if (!recetteResult.success) {
        alert("Erreur lors de la récupération de la recette");
        return;
      }

      const produit = produitsDisponibles.find(p => p.id_produit === selectedProductId);
      
      // Créer une production pour chaque jour sélectionné
      const nouveauxJours = [...productionsParJour];
      
      selectedDates.forEach(date => {
        const nouvelleProduction: Production = {
          id: `${Date.now()}-${Math.random()}`,
          id_produit: selectedProductId,
          nom_produit: produit?.nom || "Produit inconnu",
          quantite: quantiteFinale,
          unite_saisie: "palette",
          recette: recetteResult.data.map((r: any) => ({
            id_matiere: r.id_matiere,
            nom_matiere: r.matiere_nom,
            quantite_necessaire: parseFloat(String(r.quantite_necessaire).replace(',', '.')) || 0,
            unite: r.matiere_unite,
          })),
        };

        // Ajouter ou mettre à jour le jour
        const jourIndex = nouveauxJours.findIndex(p => isSameDay(p.date, date));
        
        if (jourIndex >= 0) {
          nouveauxJours[jourIndex].productions.push(nouvelleProduction);
        } else {
          nouveauxJours.push({
            date: date,
            productions: [nouvelleProduction]
          });
        }
      });

      setProductionsParJour(nouveauxJours);

      // Réinitialiser le formulaire
      setSelectedProductId(null);
      setQuantitePalettes("");
      setOpenProductPopover(false);
      setJourSelectionne(null);
    } catch (error) {
      console.error("Erreur lors de l'ajout de la production:", error);
      alert("Erreur lors de l'ajout de la production");
    } finally {
      setLoading(false);
    }
  };

  // Supprimer une production
  const supprimerProduction = (date: Date, productionId: string) => {
    const nouveauxJours = productionsParJour.map(jour => {
      if (isSameDay(jour.date, date)) {
        return {
          ...jour,
          productions: jour.productions.filter(p => p.id !== productionId)
        };
      }
      return jour;
    }).filter(jour => jour.productions.length > 0);
    
    setProductionsParJour(nouveauxJours);
  };

  // Calculer le récapitulatif des matières
  const calculerRecapitulatif = (): MatiereResume[] => {
    const matieresMap = new Map<number, MatiereResume>();

    // Parcourir toutes les productions de la semaine
    productionsParJour.forEach(jour => {
      jour.productions.forEach(production => {
        production.recette.forEach(ingredient => {
          const quantiteNecessaire = ingredient.quantite_necessaire * production.quantite;
          
          if (!matieresMap.has(ingredient.id_matiere)) {
            const stockMatiere = stocksMatiere.find(m => m.id_matiere === ingredient.id_matiere);
            const stockActuel = stockMatiere?.stock_actuel || 0;
            
            matieresMap.set(ingredient.id_matiere, {
              id_matiere: ingredient.id_matiere,
              nom_matiere: ingredient.nom_matiere,
              unite: ingredient.unite,
              quantite_necessaire: 0,
              stock_actuel: stockActuel,
              manquant: 0,
              statut: "ok"
            });
          }

          const matiere = matieresMap.get(ingredient.id_matiere)!;
          matiere.quantite_necessaire += quantiteNecessaire;
        });
      });
    });

    // Calculer le manquant et le statut
    return Array.from(matieresMap.values()).map(matiere => {
      const manquant = Math.max(0, matiere.quantite_necessaire - matiere.stock_actuel);
      let statut: "ok" | "insuffisant" | "critique" = "ok";
      
      if (manquant > 0) {
        const pourcentageManquant = (manquant / matiere.quantite_necessaire) * 100;
        statut = pourcentageManquant > 50 ? "critique" : "insuffisant";
      }

      return {
        ...matiere,
        manquant,
        statut
      };
    });
  };

  const recapitulatif = calculerRecapitulatif();
  const matieresARavitailler = recapitulatif.filter(m => m.manquant > 0);

  // Formater les quantités
  const formaterQuantite = (quantite: number, unite: string): string => {
    const qty = typeof quantite === 'string' ? parseFloat(quantite) : quantite;
    if (isNaN(qty)) return `0 ${unite}`;
    
    if (unite.toLowerCase() === 'kg' && qty > 1000) {
      return `${(qty / 1000).toFixed(2)} T`;
    }
    return `${qty.toFixed(2)} ${unite}`;
  };

  return (
    <MainLayout>
      <div className="container mx-auto p-4 space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Colonne gauche : Calendrier avec productions */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Calendrier de production</CardTitle>
                  <Button
                    onClick={() => {
                      if (selectedDates.length === 0) {
                        alert("Veuillez sélectionner au moins un jour");
                        return;
                      }
                      setJourSelectionne(selectedDates[0]); // Pour ouvrir le formulaire
                    }}
                    size="sm"
                    disabled={selectedDates.length === 0}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Ajouter un produit
                  </Button>
                </div>
                {selectedDates.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {selectedDates.length} jour{selectedDates.length > 1 ? 's' : ''} sélectionné{selectedDates.length > 1 ? 's' : ''}
                  </p>
                )}
              </CardHeader>
              <CardContent className="p-4">
                <div className="w-full flex justify-center">
                  <Calendar
                    mode="multiple"
                    selected={selectedDates}
                    onSelect={(dates) => {
                      if (dates) {
                        setSelectedDates(dates);
                      } else {
                        setSelectedDates([]);
                        setJourSelectionne(null);
                      }
                    }}
                    locale={fr}
                    className="rounded-md border-0 w-full max-w-none"
                    classNames={{
                      months: "flex w-full space-y-0",
                      month: "space-y-4 w-full",
                      caption: "flex justify-center pt-1 relative items-center",
                      caption_label: "text-sm font-medium",
                      nav: "space-x-1 flex items-center",
                      table: "w-full border-collapse space-y-1",
                      head_row: "flex w-full",
                      head_cell: "text-muted-foreground rounded-md w-full font-normal text-[0.8rem]",
                      row: "flex w-full mt-2",
                      cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20 w-full",
                      day: "h-14 w-full p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-md",
                      day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                      day_today: "bg-accent text-accent-foreground",
                      day_outside: "text-muted-foreground opacity-50",
                      day_disabled: "text-muted-foreground opacity-50",
                      day_hidden: "invisible",
                    }}
                  />
                </div>
                {/* Légende sous le calendrier */}
                <div className="mt-2 text-xs text-muted-foreground text-center">
                  {productionsParJour.length > 0 && (
                    <p>📦 {productionsParJour.reduce((acc, j) => acc + j.productions.length, 0)} production(s) planifiée(s)</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Colonne droite : Productions planifiées + Formulaire */}
          <div className="lg:col-span-2 space-y-4">
            {/* Formulaire d'ajout (si jours sélectionnés) */}
            {jourSelectionne && selectedDates.length > 0 && (
              <Card className="border-primary">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Nouvelle production</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setJourSelectionne(null)}
                      className="h-6 w-6 p-0"
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardDescription className="text-xs">
                    Production sur {selectedDates.length} jour{selectedDates.length > 1 ? 's' : ''}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Affichage des jours sélectionnés */}
                  <div className="space-y-1">
                    <Label className="text-xs">Jours concernés</Label>
                    <div className="flex flex-wrap gap-1">
                      {selectedDates
                        .sort((a, b) => a.getTime() - b.getTime())
                        .map((date) => (
                          <Badge
                            key={date.toISOString()}
                            variant="secondary"
                            className="text-[10px]"
                          >
                            {format(date, "d MMM", { locale: fr })}
                          </Badge>
                        ))}
                    </div>
                  </div>

                  {/* Produit */}
                  <div className="space-y-1.5">
                    <Label className="text-xs">Produit</Label>
                    <Popover open={openProductPopover} onOpenChange={setOpenProductPopover}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-full justify-between h-8 text-xs"
                        >
                          {selectedProductId
                            ? produitsDisponibles.find(p => p.id_produit === selectedProductId)?.nom
                            : "Sélectionner..."}
                          <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[250px] p-0">
                        <Command>
                          <CommandInput placeholder="Rechercher..." className="h-8 text-xs" />
                          <CommandList>
                            <CommandEmpty className="text-xs">Aucun produit trouvé.</CommandEmpty>
                            <CommandGroup>
                              {produitsDisponibles.map((produit) => (
                                <CommandItem
                                  key={produit.id_produit}
                                  value={produit.nom}
                                  onSelect={() => {
                                    setSelectedProductId(produit.id_produit);
                                    setOpenProductPopover(false);
                                  }}
                                  className="text-xs"
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-3 w-3",
                                      selectedProductId === produit.id_produit
                                        ? "opacity-100"
                                        : "opacity-0"
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

                  {/* Quantité */}
                  <div className="space-y-1.5">
                    <Label className="text-xs">Palettes par jour (64 sacs/palette)</Label>
                    <Input
                      type="text"
                      placeholder="Ex: 5"
                      value={quantitePalettes}
                      onChange={(e) => setQuantitePalettes(e.target.value)}
                      className="h-8 text-sm"
                    />
                    {quantitePalettes && (
                      <p className="text-[10px] text-muted-foreground">
                        {(parseFloat(quantitePalettes.replace(',', '.')) * PALETTE_SIZE) || 0} sacs/jour
                        {selectedDates.length > 1 && (
                          <span className="ml-1">
                            • Total: {(parseFloat(quantitePalettes.replace(',', '.')) * PALETTE_SIZE * selectedDates.length) || 0} sacs
                          </span>
                        )}
                      </p>
                    )}
                  </div>

                  {/* Bouton */}
                  <Button
                    onClick={ajouterProduction}
                    disabled={loading || !selectedProductId || !quantitePalettes}
                    className="w-full h-8 text-xs"
                    size="sm"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Planifier sur {selectedDates.length} jour{selectedDates.length > 1 ? 's' : ''}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Liste des productions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Productions planifiées
                </CardTitle>
              </CardHeader>
              <CardContent>
                {productionsParJour.length === 0 ? (
                  <div className="text-center py-6">
                    <CalendarIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">
                      Sélectionnez des jours et ajoutez des productions
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {productionsParJour
                      .sort((a, b) => a.date.getTime() - b.date.getTime())
                      .map(jour => {
                        const productions = jour.productions;
                        
                        return (
                          <div key={jour.date.toISOString()} className="border rounded p-2">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-xs">
                                {format(jour.date, "EEE d MMM", { locale: fr })}
                              </h4>
                              <Badge variant="secondary" className="text-[10px]">
                                {productions.length}
                              </Badge>
                            </div>

                            <div className="space-y-1.5">
                              {productions.map(production => (
                                <div
                                  key={production.id}
                                  className="flex items-center justify-between p-1.5 bg-muted/50 rounded text-xs"
                                >
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium truncate">{production.nom_produit}</div>
                                    <div className="text-[10px] text-muted-foreground">
                                      {(production.quantite / PALETTE_SIZE).toFixed(1)} pal. ({production.quantite} sacs)
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => supprimerProduction(jour.date, production.id)}
                                    className="text-destructive hover:text-destructive h-6 w-6 p-0 ml-2"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tableau récapitulatif des matières premières */}
        {recapitulatif.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Calculator className="h-5 w-5 text-primary" />
                Récapitulatif des matières premières
              </CardTitle>
              <CardDescription className="text-xs">
                Besoins de production vs stocks disponibles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b-2 bg-muted/50">
                      <th className="text-left p-3 font-semibold text-sm">Matière première</th>
                      <th className="text-center p-3 font-semibold text-sm">Unité</th>
                      <th className="text-right p-3 font-semibold text-sm">Quantité nécessaire</th>
                      <th className="text-right p-3 font-semibold text-sm">Stock actuel</th>
                      <th className="text-right p-3 font-semibold text-sm">Manquant</th>
                      <th className="text-center p-3 font-semibold text-sm">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recapitulatif.map((matiere, index) => (
                      <tr
                        key={matiere.id_matiere}
                        className={cn(
                          "border-b transition-colors hover:bg-muted/50",
                          index % 2 === 0 && "bg-muted/20",
                          matiere.statut === "ok" && "bg-green-50/50 dark:bg-green-950/20",
                          matiere.statut === "insuffisant" && "bg-yellow-50/50 dark:bg-yellow-950/20",
                          matiere.statut === "critique" && "bg-red-50/50 dark:bg-red-950/20"
                        )}
                      >
                        <td className="p-3 font-medium text-sm">{matiere.nom_matiere}</td>
                        <td className="p-3 text-center text-sm text-muted-foreground">{matiere.unite}</td>
                        <td className="p-3 text-right font-semibold text-sm">
                          {formaterQuantite(matiere.quantite_necessaire, matiere.unite)}
                        </td>
                        <td className="p-3 text-right text-sm">
                          {formaterQuantite(matiere.stock_actuel, matiere.unite)}
                        </td>
                        <td className="p-3 text-right font-bold text-sm">
                          {matiere.manquant === 0 ? (
                            <span className="text-green-600">-</span>
                          ) : (
                            <span
                              className={cn(
                                matiere.statut === "insuffisant" && "text-yellow-600",
                                matiere.statut === "critique" && "text-red-600"
                              )}
                            >
                              {formaterQuantite(matiere.manquant, matiere.unite)}
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {matiere.statut === "ok" && (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Suffisant
                            </Badge>
                          )}
                          {matiere.statut === "insuffisant" && (
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Attention
                            </Badge>
                          )}
                          {matiere.statut === "critique" && (
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
                              <XCircle className="h-3 w-3 mr-1" />
                              Critique
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {/* Ligne de résumé */}
                  <tfoot className="border-t-2 bg-muted/30">
                    <tr>
                      <td colSpan={4} className="p-3 text-sm font-semibold">
                        Résumé du ravitaillement
                      </td>
                      <td colSpan={2} className="p-3 text-right">
                        <Badge
                          variant={matieresARavitailler.length === 0 ? "outline" : "destructive"}
                          className="text-sm"
                        >
                          {matieresARavitailler.length === 0 ? (
                            <>
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Aucun ravitaillement nécessaire
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="h-4 w-4 mr-1" />
                              {matieresARavitailler.length} matière{matieresARavitailler.length > 1 ? 's' : ''} à commander
                            </>
                          )}
                        </Badge>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Message si aucune production */}
        {productionsParJour.length === 0 && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucune production planifiée</h3>
                <p className="text-muted-foreground mb-4">
                  Sélectionnez des jours dans le calendrier ci-dessus pour commencer à planifier votre production
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}