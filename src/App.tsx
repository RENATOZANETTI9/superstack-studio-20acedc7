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
import PartnersMarketing from "./pages/partners/PartnersMarketing";
import PartnersClinicSimulations from "./pages/partners/PartnersClinicSimulations";
import PartnersProfile from "./pages/partners/PartnersProfile";
import Clinicas from "./pages/Clinicas";
import NotFound from "./pages/NotFound";
import TermosDeUso from "./pages/TermosDeUso";
import PoliticaDePrivacidade from "./pages/PoliticaDePrivacidade";
import RegisterPartner from "./pages/RegisterPartner";
import CadastroClinica from "./pages/CadastroClinica";
import CadastroPartner from "./pages/CadastroPartner";

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
            <Route path="/dashboard/partners/bonificacoes" element={<PartnersBonificacoes />} />
            <Route path="/dashboard/partners/config" element={<PartnersConfig />} />
            <Route path="/dashboard/partners/simulador" element={<PartnersSimulator />} />
            <Route path="/dashboard/partners/monitoramento" element={<PartnersMonitoring />} />
            <Route path="/dashboard/partners/marketing" element={<PartnersMarketing />} />
            <Route path="/dashboard/partners/simulacoes-clinicas" element={<PartnersClinicSimulations />} />
            <Route path="/dashboard/partners/perfil" element={<PartnersProfile />} />
            <Route path="/dashboard/clinicas" element={<Clinicas />} />
            <Route path="/register/partner" element={<RegisterPartner />} />
            <Route path="/cadastroclinica" element={<CadastroClinica />} />
            <Route path="/cadastropartner" element={<CadastroPartner />} />
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
