// pages/Dashboard.tsx
import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { ProductionChart } from "@/components/dashboard/ProductionChart";
import { StockChart } from "@/components/dashboard/StockChart";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import {
  Factory,
  Package,
  TrendingUp,
  Users,
  ShoppingCart,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import produitService from "@/services/produitService";
import matierePremiereService from "@/services/matierePremiereService";
import productionService from "@/services/productionService";
import factureService from "@/services/factureService";
import clientService from "@/services/clientService";

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    productionSemaine: 0,
    ventesMois: 0,
    clientsActifs: 0,
    alertesStock: 0,
    facturesEnCours: 0,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Charger toutes les données en parallèle
      const [
        productionsRes,
        matieresRes,
        produitsRes,
        facturesRes,
        clientsRes,
        alertesRes,
      ] = await Promise.all([
        productionService.getAll(),
        matierePremiereService.getAll(),
        produitService.getAll(),
        factureService.getAll(),
        clientService.getAll(),
        matierePremiereService.getAlertes(),
      ]);

      // Calculer production de la semaine - CONVERSION EN NOMBRE
      const debutSemaine = new Date();
      debutSemaine.setDate(debutSemaine.getDate() - debutSemaine.getDay());
      debutSemaine.setHours(0, 0, 0, 0);

      const productionSemaine = productionsRes.data
        .filter((p: any) => new Date(p.date_production) >= debutSemaine)
        .reduce((acc: number, p: any) => acc + Number(p.quantite_produite), 0);

      // Calculer ventes du mois - CONVERSION EN NOMBRE
      const debutMois = new Date();
      debutMois.setDate(1);
      debutMois.setHours(0, 0, 0, 0);

      const ventesMois = facturesRes.data
        .filter((f: any) => new Date(f.date_facture) >= debutMois)
        .reduce((acc: number, f: any) => acc + Number(f.montant_ttc), 0);

      // Compter clients actifs (ayant des factures ce mois)
      const clientsActifs = new Set(
        facturesRes.data
          .filter((f: any) => new Date(f.date_facture) >= debutMois)
          .map((f: any) => f.id_client)
      ).size;

      // Compter factures en cours (non payées)
      const facturesEnCours = facturesRes.data.filter(
        (f: any) => Number(f.montant_restant) > 0 && f.statut !== "Annulée"
      ).length;

      setStats({
        productionSemaine,
        ventesMois,
        clientsActifs,
        alertesStock: alertesRes.data.length,
        facturesEnCours,
      });
    } catch (error) {
      console.error("Erreur chargement dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Chargement du tableau de bord...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Header */}
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold tracking-tight text-foreground font-display">
          Tableau de bord
        </h1>
        <p className="mt-1 text-muted-foreground">
          Vue d'ensemble de votre activité
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-8">
        <StatCard
          title="Production Semaine"
          value={stats.productionSemaine.toLocaleString()}
          subtitle="Unités produites"
          icon={Factory}
          variant="primary"
        />
        <StatCard
          title="Ventes Mois"
          value={new Intl.NumberFormat("fr-DZ", {
            notation: "compact",
            compactDisplay: "short",
          }).format(stats.ventesMois)}
          subtitle="DZD"
          icon={TrendingUp}
          variant="success"
        />
        <StatCard
          title="Clients Actifs"
          value={stats.clientsActifs}
          subtitle="Ce mois-ci"
          icon={Users}
          variant="default"
        />
        <StatCard
          title="Factures en cours"
          value={stats.facturesEnCours}
          subtitle="Impayées"
          icon={ShoppingCart}
          variant="default"
        />
        <StatCard
          title="Alertes Stock"
          value={stats.alertesStock}
          subtitle="Niveaux critiques"
          icon={AlertTriangle}
          variant="warning"
        />
      </div>

      {/* Stock Chart - Pleine largeur */}
      <div className="mb-8">
        <StockChart />
      </div>

      {/* Production Chart */}
      <div className="grid gap-6 lg:grid-cols-1 mb-8">
        <ProductionChart />
      </div>
    </MainLayout>
  );
};

export default Dashboard;