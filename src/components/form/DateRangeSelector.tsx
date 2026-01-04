import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "lucide-react";

interface DateRangeSelectorProps {
  onConfirm: (dateRange: { startDate: string; endDate: string; label: string }) => void;
  onCancel: () => void;
}

export const DateRangeSelector = ({ onConfirm, onCancel }: DateRangeSelectorProps) => {
  const [mode, setMode] = useState<"all" | "month" | "custom">("all");
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7) // Format YYYY-MM
  );
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const handleConfirm = () => {
    if (mode === "all") {
      // Retourner une plage très large pour inclure toutes les factures
      onConfirm({
        startDate: "1900-01-01",
        endDate: "2099-12-31",
        label: "Toutes les périodes"
      });
    } else if (mode === "month") {
      // Calculer le premier et dernier jour du mois
      const year = parseInt(selectedMonth.split("-")[0]);
      const month = parseInt(selectedMonth.split("-")[1]);
      const firstDay = new Date(year, month - 1, 1);
      const lastDay = new Date(year, month, 0);
      
      const monthNames = [
        "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
        "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
      ];
      
      onConfirm({
        startDate: firstDay.toISOString().split("T")[0],
        endDate: lastDay.toISOString().split("T")[0],
        label: `${monthNames[month - 1]} ${year}`
      });
    } else {
      if (!startDate || !endDate) {
        alert("Veuillez renseigner les deux dates");
        return;
      }
      if (new Date(startDate) > new Date(endDate)) {
        alert("La date de début doit être antérieure à la date de fin");
        return;
      }
      
      onConfirm({
        startDate,
        endDate,
        label: `Du ${new Date(startDate).toLocaleDateString("fr-FR")} au ${new Date(endDate).toLocaleDateString("fr-FR")}`
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Mode de sélection */}
      <div className="space-y-2">
        <Label>Type de période</Label>
        <Select value={mode} onValueChange={(value: "all" | "month" | "custom") => setMode(value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les périodes</SelectItem>
            <SelectItem value="month">Par mois</SelectItem>
            <SelectItem value="custom">Intervalle personnalisé</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Message d'information pour "Toutes les périodes" */}
      {mode === "all" && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>ℹ️ Toutes les informations</strong> seront incluses dans le rapport, sans filtre de date.
          </p>
        </div>
      )}

      {/* Sélection par mois */}
      {mode === "month" && (
        <div className="space-y-2">
          <Label htmlFor="month">Sélectionner un mois</Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="month"
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="pl-10"
              max={new Date().toISOString().slice(0, 7)}
            />
          </div>
        </div>
      )}

      {/* Sélection par intervalle */}
      {mode === "custom" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="start-date">Date de début</Label>
            <Input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end-date">Date de fin</Label>
            <Input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
            />
          </div>
        </div>
      )}

      {/* Aperçu de la période */}
      <div className="bg-muted/50 p-4 rounded-lg border">
        <p className="text-sm text-muted-foreground mb-1">Période sélectionnée :</p>
        <p className="font-medium">
          {mode === "all" ? (
            "Toutes les périodes"
          ) : mode === "month" ? (
            (() => {
              const [year, month] = selectedMonth.split("-");
              const monthNames = [
                "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
                "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
              ];
              return `${monthNames[parseInt(month) - 1]} ${year}`;
            })()
          ) : (
            startDate && endDate ? (
              `Du ${new Date(startDate).toLocaleDateString("fr-FR")} au ${new Date(endDate).toLocaleDateString("fr-FR")}`
            ) : (
              "Veuillez sélectionner les dates"
            )
          )}
        </p>
      </div>

      {/* Boutons d'action */}
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button onClick={handleConfirm}>
          Générer le PDF
        </Button>
      </div>
    </div>
  );
};