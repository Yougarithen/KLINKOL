// components/forms/AddMatierePremiereForm.tsx
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import matierePremiereService from "@/services/matierePremiereService";
import { TYPE_MATIERE_CONFIG, TypeMatiere } from "@/util/materielUtils";

interface AddMatiereFormData {
  nom: string;
  type_matiere: TypeMatiere;
  unite: string;
  stock_actuel: number;
  stock_minimum: number;
  prix_unitaire: number;
}

interface AddMatierePremiereFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function AddMatierePremiereForm({ onSuccess, onCancel }: AddMatierePremiereFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<AddMatiereFormData>({
    defaultValues: {
      nom: "",
      type_matiere: "MINERAL",
      unite: "kg",
      stock_actuel: 0,
      stock_minimum: 0,
      prix_unitaire: 0,
    },
  });

  const handleSubmit = async (data: AddMatiereFormData) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Obtenir le préfixe selon le type
      const prefix = TYPE_MATIERE_CONFIG[data.type_matiere].prefix;
      
      // Vérifier si le nom commence déjà par le préfixe
      const nomAvecPrefix = data.nom.startsWith(`${prefix}-`) 
        ? data.nom 
        : `${prefix}-${data.nom}`;
      
      // Préparer les données avec le nom préfixé
      const dataToSend = {
        ...data,
        nom: nomAvecPrefix
      };

      console.log("Données envoyées:", dataToSend);

      const response = await matierePremiereService.create(dataToSend);

      console.log("Matière créée avec succès:", response.data);
      alert(`Matière première créée avec succès ! ID: ${response.data.id_matiere}`);

      if (onSuccess) {
        onSuccess();
      }

      form.reset();
    } catch (error: any) {
      console.error("Erreur lors de la création:", error);
      setSubmitError(error.message || "Une erreur est survenue");
      alert(`Erreur: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const typeSelectionne = form.watch("type_matiere");

  return (
    <Card className="w-full border-slate-100">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl">Ajouter une matière première</CardTitle>
        <CardDescription>Remplissez les informations de la matière</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Message d'erreur */}
            {submitError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {submitError}
              </div>
            )}

            {/* Type de matière */}
            <FormField
              control={form.control}
              name="type_matiere"
              rules={{ required: "Le type est requis" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type de matière *</FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-3 gap-3">
                      {(Object.keys(TYPE_MATIERE_CONFIG) as TypeMatiere[]).map((type) => {
                        const config = TYPE_MATIERE_CONFIG[type];
                        const isSelected = field.value === type;
                        return (
                          <button
                            key={type}
                            type="button"
                            onClick={() => field.onChange(type)}
                            className={`p-4 border-2 rounded-lg transition-all ${
                              isSelected
                                ? 'border-primary bg-primary/5'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <Badge className={`mb-2 ${config.couleur}`}>
                              {config.prefix}
                            </Badge>
                            <p className="text-sm font-medium">{config.label}</p>
                          </button>
                        );
                      })}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Nom */}
            <FormField
              control={form.control}
              name="nom"
              rules={{ required: "Le nom est requis" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom de la matière *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Calcaire, Ciment, Sac papier..." {...field} />
                  </FormControl>
                  {field.value && (
                    <p className="text-xs text-muted-foreground mt-1">
                      📝 Sera enregistré comme: <span className="font-semibold text-primary">
                        {TYPE_MATIERE_CONFIG[typeSelectionne].prefix}-{field.value}
                      </span>
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Unité et Prix */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="unite"
                rules={{ required: "L'unité est requise" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unité *</FormLabel>
                    <FormControl>
                      <select {...field} className="border rounded px-3 py-2 w-full">
                        <option value="kg">Kilogramme (kg)</option>
                        <option value="tonne">Tonne (t)</option>
                        <option value="litre">Litre (L)</option>
                        <option value="m3">Mètre cube (m³)</option>
                        <option value="unité">Unité</option>
                        <option value="sac">Sac</option>
                        <option value="palette">Palette</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="prix_unitaire"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prix unitaire (DZD)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Stock actuel et minimum */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="stock_actuel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock initial</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="stock_minimum"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock minimum (seuil d'alerte)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Boutons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Ajout en cours..." : "Ajouter la matière"}
              </Button>
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isSubmitting}
                >
                  Annuler
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}