
// ============================================================
// StockChart.tsx - Version avec données API
// ============================================================

// components/dashboard/StockChart.tsx
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
  ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import matierePremiereService from "@/services/matierePremiereService";

const getBarColor = (percentage: number) => {
  if (percentage < 30) return "hsl(var(--destructive))";
  if (percentage < 50) return "hsl(var(--warning))";
  return "hsl(var(--success))";
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    return (
      <div className="bg-card border border-border rounded-lg p-4 shadow-xl backdrop-blur-sm">
        <p className="font-bold text-foreground text-base">{item.name}</p>
        <div className="mt-2 space-y-1">
          <p className="text-sm text-muted-foreground">
            Stock: <span className="font-medium text-foreground">{item.stock} {item.unit}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Minimum: <span className="font-medium text-foreground">{item.min} {item.unit}</span>
          </p>
        </div>
        <div className="mt-2 pt-2 border-t border-border">
          <p className="text-sm font-semibold" style={{ color: getBarColor(item.percentage) }}>
            {item.percentage}% du minimum
          </p>
        </div>
      </div>
    );
  }
  return null;
};

export function StockChart() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStockData();
  }, []);

  const fetchStockData = async () => {
    try {
      const response = await matierePremiereService.getAll();
      
      // Prendre les 5 premières matières avec stock minimum > 0
      const chartData = response.data
        .filter((m: any) => m.stock_minimum > 0)
        .slice(0, 5)
        .map((m: any) => ({
          name: m.nom,
          stock: m.stock_actuel,
          min: m.stock_minimum,
          unit: m.unite,
          percentage: m.stock_minimum > 0 
            ? Math.round((m.stock_actuel / (m.stock_minimum * 2)) * 100)
            : 50
        }));
      
      setData(chartData);
    } catch (error) {
      console.error("Erreur chargement stocks:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-80">
          <p className="text-muted-foreground">Chargement...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">
              Stock Matières Premières
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Niveau par rapport au minimum
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-success" />
              <span className="text-muted-foreground">Bon</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-warning" />
              <span className="text-muted-foreground">Moyen</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-destructive" />
              <span className="text-muted-foreground">Critique</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="horizontal" margin={{ top: 20, right: 30, bottom: 40, left: 20 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                vertical={false}
                opacity={0.5}
              />
              <XAxis
                dataKey="name"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                interval={0}
                angle={-20}
                textAnchor="end"
                height={60}
              />
              <YAxis
                domain={[0, 100]}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}%`}
                ticks={[0, 25, 50, 75, 100]}
              />
              <ReferenceLine y={50} stroke="hsl(var(--warning))" strokeDasharray="5 5" opacity={0.5} />
              <ReferenceLine y={30} stroke="hsl(var(--destructive))" strokeDasharray="5 5" opacity={0.5} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted)/0.2)', radius: 4 }} />
              <Bar dataKey="percentage" radius={[6, 6, 0, 0]} barSize={45}>
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={getBarColor(entry.percentage)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}