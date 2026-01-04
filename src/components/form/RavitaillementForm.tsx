// components/form/RavitaillementForm.tsx
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Package, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";
import matierePremiereService from "@/services/matierePremiereService";
import { toast } from "sonner";

interface MatierePremiere {
  id_matiere: number;
  nom: string;
  typeM: string;
  unite: string;
  stock_actuel: number;
  stock_minimum: number;
}

interface RavitaillementFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function RavitaillementForm({ onSuccess, onCancel }: RavitaillementFormProps) {
  const [matieres, setMatieres] = useState<MatierePremiere[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [selectedMatiereId, setSelectedMatiereId] = useState<string>("");
  const [quantite, setQuantite] = useState<string>("");
  const [responsable, setResponsable] = useState<string>("");
  const [motif, setMotif] = useState<string>("Ravitaillement");

  useEffect(() => {
    fetchMatieres();
  }, []);

  const fetchMatieres = async () => {
    try {
      setLoading(true);
      const response = await matierePremiereService.getAll();
      setMatieres(response.data);
    } catch (err: any) {
      setError("Impossible de charger les matières premières");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const selectedMatiere = matieres.find(m => m.id_matiere.toString() === selectedMatiereId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedMatiereId || !quantite || !responsable) {
      setError("Veuillez remplir tous les champs obligatoires");
      return;
    }

    const qty = parseFloat(quantite);
    if (isNaN(qty) || qty <= 0) {
      setError("La quantité doit être un nombre positif");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await matierePremiereService.ajusterStock(
        parseInt(selectedMatiereId),
        qty,
        responsable,
        motif
      );

      setSuccess(true);
      toast.success("Ravitaillement effectué avec succès !");
      
      setTimeout(() => {
        onSuccess();
      }, 1500);
      
    } catch (err: any) {
      console.error("Erreur ravitaillement:", err);
      setError(err.message || "Erreur lors du ravitaillement");
      toast.error("Erreur lors du ravitaillement");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="text-center p-12">
        <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Ravitaillement effectué !</h3>
        <p className="text-muted-foreground">Le stock a été mis à jour avec succès.</p>
      </div>
    );
  }

  const nouveauStock = selectedMatiere 
    ? Number(selectedMatiere.stock_actuel) + (parseFloat(quantite) || 0)
    : 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Alerte d'erreur */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Sélection de la matière */}
      <div className="space-y-2">
        <Label htmlFor="matiere">
          Matière première <span className="text-destructive">*</span>
        </Label>
        <Select value={selectedMatiereId} onValueChange={setSelectedMatiereId}>
          <SelectTrigger>
            <SelectValue placeholder="Sélectionnez une matière première" />
          </SelectTrigger>
          <SelectContent>
            {matieres.map((matiere) => (
              <SelectItem key={matiere.id_matiere} value={matiere.id_matiere.toString()}>
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span>{matiere.nom}</span>
                  <span className="text-xs text-muted-foreground">
                    (Stock: {Number(matiere.stock_actuel).toLocaleString('fr-FR')} {matiere.unite})
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Info matière sélectionnée */}
      {selectedMatiere && (
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Stock actuel :</span>
            <span className="font-medium">
              {Number(selectedMatiere.stock_actuel).toLocaleString('fr-FR')} {selectedMatiere.unite}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Stock minimum :</span>
            <span className="font-medium">
              {Number(selectedMatiere.stock_minimum).toLocaleString('fr-FR')} {selectedMatiere.unite}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Type :</span>
            <span className="font-medium">{selectedMatiere.typeM}</span>
          </div>
        </div>
      )}

      {/* Quantité */}
      <div className="space-y-2">
        <Label htmlFor="quantite">
          Quantité à ravitailler <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <Input
            id="quantite"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="Ex: 100"
            value={quantite}
            onChange={(e) => setQuantite(e.target.value)}
            className="pr-20"
          />
          {selectedMatiere && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              {selectedMatiere.unite}
            </span>
          )}
        </div>
      </div>

      {/* Aperçu nouveau stock */}
      {selectedMatiere && quantite && parseFloat(quantite) > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <span className="font-medium text-green-900">Nouveau stock après ravitaillement</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-green-600">
              {nouveauStock.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}
            </span>
            <span className="text-green-700">{selectedMatiere.unite}</span>
          </div>
          <p className="text-xs text-green-600 mt-1">
            (+{parseFloat(quantite).toLocaleString('fr-FR')} {selectedMatiere.unite})
          </p>
        </div>
      )}

      {/* Responsable */}
      <div className="space-y-2">
        <Label htmlFor="responsable">
          Responsable <span className="text-destructive">*</span>
        </Label>
        <Input
          id="responsable"
          type="text"
          placeholder="Nom du responsable"
          value={responsable}
          onChange={(e) => setResponsable(e.target.value)}
        />
      </div>

      {/* Motif */}
      <div className="space-y-2">
        <Label htmlFor="motif">Motif (optionnel)</Label>
        <Input
          id="motif"
          type="text"
          placeholder="Ex: Ravitaillement hebdomadaire"
          value={motif}
          onChange={(e) => setMotif(e.target.value)}
        />
      </div>

      {/* Boutons */}
      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={submitting}
          className="flex-1"
        >
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={submitting || !selectedMatiereId || !quantite || !responsable}
          className="flex-1"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Enregistrement...
            </>
          ) : (
            <>
              <TrendingUp className="h-4 w-4 mr-2" />
              Ravitailler
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
