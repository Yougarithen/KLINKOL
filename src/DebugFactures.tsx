import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import factureService from "@/services/factureService";

interface DebugFacturesProps {
  clientId: number;
  clientNom: string;
}

export const DebugFactures = ({ clientId, clientNom }: DebugFacturesProps) => {
  const [loading, setLoading] = useState(false);
  const [allFactures, setAllFactures] = useState<any[]>([]);
  const [filteredFactures, setFilteredFactures] = useState<any[]>([]);

  const fetchDebug = async () => {
    try {
      setLoading(true);
      
      // Récupérer toutes les factures
      const response = await factureService.getAll();
      console.log("📦 DEBUG - Toutes les factures:", response.data);
      
      setAllFactures(response.data);
      
      // Afficher la structure de la première facture
      if (response.data && response.data.length > 0) {
        console.log("🔍 DEBUG - Structure d'une facture:", response.data[0]);
        console.log("🔍 DEBUG - Clés disponibles:", Object.keys(response.data[0]));
      }
      
      // Tester différentes méthodes de filtrage
      const tests = [
        {
          name: "id_client strict",
          result: response.data.filter((f: any) => f.id_client === clientId)
        },
        {
          name: "id_client string",
          result: response.data.filter((f: any) => f.id_client === String(clientId))
        },
        {
          name: "id_client Number",
          result: response.data.filter((f: any) => Number(f.id_client) === Number(clientId))
        },
        {
          name: "client_id",
          result: response.data.filter((f: any) => f.client_id === clientId)
        },
        {
          name: "clientId",
          result: response.data.filter((f: any) => f.clientId === clientId)
        },
      ];
      
      console.log("🧪 DEBUG - Tests de filtrage pour client", clientId, ":");
      tests.forEach(test => {
        console.log(`  - ${test.name}: ${test.result.length} résultat(s)`);
        if (test.result.length > 0) {
          console.log(`    ✓ Factures trouvées:`, test.result.map((f: any) => f.numero_facture));
        }
      });
      
      // Afficher tous les id_client uniques
      const uniqueClientIds = [...new Set(response.data.map((f: any) => f.id_client))];
      console.log("👥 DEBUG - IDs clients présents dans les factures:", uniqueClientIds);
      
      // Chercher les factures qui mentionnent le nom du client
      const byName = response.data.filter((f: any) => 
        f.client && f.client.toLowerCase().includes(clientNom.toLowerCase())
      );
      console.log(`🔎 DEBUG - Factures trouvées par nom "${clientNom}":`, byName.length);
      
      setFilteredFactures(tests[0].result);
      
    } catch (err) {
      console.error("❌ DEBUG - Erreur:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDebug();
  }, [clientId]);

  return (
    <div className="space-y-4 p-4 bg-muted/50 rounded-lg border">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">🔧 Mode Debug</h3>
        <Button onClick={fetchDebug} size="sm" variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Recharger
        </Button>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <div className="space-y-2 text-sm font-mono">
          <div>
            <strong>Client recherché:</strong> ID={clientId}, Nom="{clientNom}"
          </div>
          <div>
            <strong>Total factures API:</strong> {allFactures.length}
          </div>
          <div>
            <strong>Factures filtrées:</strong> {filteredFactures.length}
          </div>
          
          {allFactures.length > 0 && (
            <div className="mt-4 p-3 bg-background rounded border">
              <strong>Structure d'une facture:</strong>
              <pre className="mt-2 text-xs overflow-auto max-h-60">
                {JSON.stringify(allFactures[0], null, 2)}
              </pre>
            </div>
          )}
          
          <div className="text-xs text-muted-foreground mt-4">
            Ouvrez la console (F12) pour voir les logs détaillés
          </div>
        </div>
      )}
    </div>
  );
};
