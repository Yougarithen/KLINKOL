import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, ShoppingCart, Factory, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const activities = [
  {
    id: 1,
    type: "sale",
    icon: ShoppingCart,
    title: "Nouvelle vente",
    description: "Client SONATRACH - 500 sacs de ciment",
    time: "Il y a 2 heures",
    color: "text-success",
    bgColor: "bg-success/10",
  },
  {
    id: 2,
    type: "production",
    icon: Factory,
    title: "Production terminée",
    description: "Lot #2024-156 - 200 tonnes CPA 42.5",
    time: "Il y a 4 heures",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    id: 3,
    type: "stock",
    icon: Package,
    title: "Stock faible",
    description: "Gypse - Niveau critique atteint",
    time: "Il y a 6 heures",
    color: "text-warning",
    bgColor: "bg-warning/10",
  },
  {
    id: 4,
    type: "client",
    icon: Users,
    title: "Nouveau client",
    description: "COSIDER Construction ajouté",
    time: "Hier",
    color: "text-info",
    bgColor: "bg-info/10",
  },
];

export function RecentActivity() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          Activité Récente
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Dernières opérations enregistrées
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <div
              key={activity.id}
              className={cn(
                "flex items-start gap-4 rounded-lg p-3 transition-colors hover:bg-muted/50",
                "animate-slide-up"
              )}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                  activity.bgColor
                )}
              >
                <activity.icon className={cn("h-5 w-5", activity.color)} />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium text-foreground">
                  {activity.title}
                </p>
                <p className="text-sm text-muted-foreground">
                  {activity.description}
                </p>
                <p className="text-xs text-muted-foreground/70">
                  {activity.time}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}