import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import MatieresPremieres from "./pages/MatieresPremieres";
import Produits from "./pages/Produits";
import Production from "./pages/Production";
import Ventes from "./pages/Ventes";
import Simulation from "./pages/Simulation";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import SessionManager from "./components/SessionManager";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        {/* SessionManager placé ici pour rester monté pendant toute la navigation */}
        <SessionManager 
          sessionDurationMinutes={2}
          warningMinutes={1}
          debug={true}
        />
        
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/matieres-premieres" element={<MatieresPremieres />} />
          <Route path="/produits" element={<Produits />} />
          <Route path="/production" element={<Production />} />
          <Route path="/ventes" element={<Ventes />} />
          <Route path="/simulation" element={<Simulation />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;