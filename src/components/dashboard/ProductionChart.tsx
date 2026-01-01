// components/dashboard/ProductionChart.tsx
import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import productionService from "@/services/productionService";

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <p className="font-semibold text-foreground">{item.jourComplet}</p>
        {item.produits && item.produits.length > 0 && (
          <div className="mt-2 space-y-1">
            {item.produits.map((p: any, idx: number) => (
              <p key={idx} className="text-xs text-muted-foreground">
                • {p.nom}: {p.quantite}
              </p>
            ))}
          </div>
        )}
        <p className="text-sm font-medium text-foreground mt-2">
          Total: {item.quantite} unités
        </p>
      </div>
    );
  }
  return null;
};

export function ProductionChart() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProductionData();
  }, []);

  const fetchProductionData = async () => {
    try {
      console.log("🔄 Chargement des productions...");
      const response = await productionService.getAll();
      console.log("✅ Productions reçues:", response.data);
      
      // Obtenir le début de la semaine (lundi)
      const aujourdhui = new Date();
      const jourSemaine = aujourdhui.getDay(); // 0 = dimanche, 1 = lundi, etc.
      const debutSemaine = new Date(aujourdhui);
      
      // Ajuster pour commencer le lundi (si dimanche = 0, reculer de 6 jours, sinon reculer de jourSemaine - 1)
      const joursAReculer = jourSemaine === 0 ? 6 : jourSemaine - 1;
      debutSemaine.setDate(aujourdhui.getDate() - joursAReculer);
      debutSemaine.setHours(0, 0, 0, 0);
      
      console.log("📅 Début de semaine:", debutSemaine);
      console.log("📅 Aujourd'hui:", aujourdhui);

      // Noms des jours
      const nomsJours = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
      const nomsJoursComplets = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
      
      const chartData = [];
      
      // Créer les 7 jours de la semaine + aujourd'hui
      for (let i = 0; i <= 7; i++) {
        const date = new Date(debutSemaine);
        date.setDate(debutSemaine.getDate() + i);
        
        const dateStr = date.toISOString().split('T')[0];
        const estAujourdhui = dateStr === aujourdhui.toISOString().split('T')[0];
        
        // Filtrer les productions de ce jour
        const productionsJour = response.data.filter((p: any) => {
          const prodDate = p.date_production.split('T')[0];
          return prodDate === dateStr;
        });
        
        console.log(`📊 ${dateStr}:`, productionsJour.length, "productions");
        
        const totalJour = productionsJour.reduce((acc: number, p: any) => 
          acc + parseFloat(p.quantite_produite), 0
        );
        
        // Détail des produits
        const detailProduits = productionsJour.map((p: any) => ({
          nom: p.produit_nom || `Produit ${p.id_produit}`,
          quantite: parseFloat(p.quantite_produite)
        }));
        
        // Label du jour
        let label = '';
        if (estAujourdhui) {
          label = "Aujourd'hui";
        } else if (i < 7) {
          label = nomsJours[i];
        } else {
          label = ""; // Ne pas afficher le 8ème jour si c'est aujourd'hui
        }
        
        // N'ajouter que si c'est pas le 8ème jour redondant
        if (!(i === 7 && estAujourdhui)) {
          chartData.push({
            jour: label,
            jourComplet: estAujourdhui ? "Aujourd'hui" : nomsJoursComplets[i],
            date: dateStr,
            quantite: totalJour,
            produits: detailProduits,
            estAujourdhui: estAujourdhui
          });
        }
      }
      
      // Si aujourd'hui n'est pas déjà dans la liste, l'ajouter
      const aujourdhuiStr = aujourdhui.toISOString().split('T')[0];
      const aujourdhuiDejaDansListe = chartData.some(d => d.date === aujourdhuiStr);
      
      if (!aujourdhuiDejaDansListe) {
        const productionsAujourdhui = response.data.filter((p: any) => {
          const prodDate = p.date_production.split('T')[0];
          return prodDate === aujourdhuiStr;
        });
        
        const totalAujourdhui = productionsAujourdhui.reduce((acc: number, p: any) => 
          acc + parseFloat(p.quantite_produite), 0
        );
        
        const detailProduitsAujourdhui = productionsAujourdhui.map((p: any) => ({
          nom: p.produit_nom || `Produit ${p.id_produit}`,
          quantite: parseFloat(p.quantite_produite)
        }));
        
        chartData.push({
          jour: "Aujourd'hui",
          jourComplet: "Aujourd'hui",
          date: aujourdhuiStr,
          quantite: totalAujourdhui,
          produits: detailProduitsAujourdhui,
          estAujourdhui: true
        });
      }
      
      console.log("📈 Données du graphique:", chartData);
      setData(chartData);
    } catch (error) {
      console.error("❌ Erreur chargement productions:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="col-span-2">
        <CardContent className="flex items-center justify-center h-80">
          <p className="text-muted-foreground">Chargement des productions...</p>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0 || data.every(d => d.quantite === 0)) {
    return (
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Production Hebdomadaire
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Semaine en cours + Aujourd'hui
          </p>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-80">
          <div className="text-center">
            <p className="text-muted-foreground mb-2">Aucune production cette semaine</p>
            <p className="text-xs text-muted-foreground">
              Les productions enregistrées s'afficheront ici
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          Production Hebdomadaire
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Semaine en cours + Aujourd'hui
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                vertical={false}
              />
              <XAxis
                dataKey="jour"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}`}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted)/0.3)' }} />
              <Bar dataKey="quantite" radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.estAujourdhui ? "hsl(var(--success))" : "hsl(var(--primary))"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Légende */}
        <div className="flex items-center justify-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: "hsl(var(--primary))" }} />
            <span className="text-muted-foreground">Jours de la semaine</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: "hsl(var(--success))" }} />
            <span className="text-muted-foreground">Aujourd'hui</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}