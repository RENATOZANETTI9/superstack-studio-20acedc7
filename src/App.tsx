import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import DashboardHome from "./pages/DashboardHome";
import Consultas from "./pages/Consultas";
import Contratos from "./pages/Contratos";
import Usuarios from "./pages/Usuarios";
import Permissoes from "./pages/usuarios/Permissoes";
import Hierarquias from "./pages/usuarios/Hierarquias";
import Lista from "./pages/usuarios/Lista";
import PartnersDashboard from "./pages/partners/PartnersDashboard";
import PartnersManagement from "./pages/partners/PartnersManagement";
import PartnersNetwork from "./pages/partners/PartnersNetwork";
import PartnersBonificacoes from "./pages/partners/PartnersBonificacoes";
import PartnersConfig from "./pages/partners/PartnersConfig";
import PartnersSimulator from "./pages/partners/PartnersSimulator";
import PartnersMonitoring from "./pages/partners/PartnersMonitoring";
import NotFound from "./pages/NotFound";
import TermosDeUso from "./pages/TermosDeUso";
import PoliticaDePrivacidade from "./pages/PoliticaDePrivacidade";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<DashboardHome />} />
            <Route path="/dashboard/consultas" element={<Consultas />} />
            <Route path="/dashboard/contratos" element={<Contratos />} />
            <Route path="/dashboard/usuarios" element={<Usuarios />} />
            <Route path="/dashboard/usuarios/master" element={<Usuarios />} />
            <Route path="/dashboard/usuarios/permissoes" element={<Permissoes />} />
            <Route path="/dashboard/usuarios/hierarquias" element={<Hierarquias />} />
            <Route path="/dashboard/usuarios/lista" element={<Lista />} />
            <Route path="/dashboard/partners" element={<PartnersDashboard />} />
            <Route path="/dashboard/partners/cadastro" element={<PartnersManagement />} />
            <Route path="/dashboard/partners/rede" element={<PartnersNetwork />} />
            <Route path="/dashboard/partners/comissoes" element={<PartnersCommissions />} />
            <Route path="/dashboard/partners/config" element={<PartnersConfig />} />
            <Route path="/dashboard/partners/simulador" element={<PartnersSimulator />} />
            <Route path="/dashboard/partners/monitoramento" element={<PartnersMonitoring />} />
            <Route path="/termos-de-uso" element={<TermosDeUso />} />
            <Route path="/politica-de-privacidade" element={<PoliticaDePrivacidade />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
