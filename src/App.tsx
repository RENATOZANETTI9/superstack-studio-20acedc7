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
import PartnersRota from "./pages/partners/PartnersRota";
import PartnersDiagnosticoIA from "./pages/partners/PartnersDiagnosticoIA";
import PartnersClinicas from "./pages/partners/PartnersClinicas";
import PartnersClinicProfile from "./pages/partners/PartnersClinicProfile";
import PartnersComissoesAdmin from "./pages/partners/PartnersComissoesAdmin";
import AdminParametros from "./pages/admin/AdminParametros";
import RepresentantesDashboard from "./pages/representantes/RepresentantesDashboard";
import RepresentantesRede from "./pages/representantes/RepresentantesRede";
import RepresentantesComissoes from "./pages/representantes/RepresentantesComissoes";
import RepresentantesClinicas from "./pages/representantes/RepresentantesClinicas";
import RepresentantesConfig from "./pages/representantes/RepresentantesConfig";
import RepresentantesMonitoring from "./pages/representantes/RepresentantesMonitoring";
import RepresentantesADM from "@/pages/representantes/RepresentantesADM";
import { RepresentantesCatchAll } from "./components/representantes/RepresentantesCatchAll";
import Clinicas from "./pages/Clinicas";
import NotFound from "./pages/NotFound";
import TermosDeUso from "./pages/TermosDeUso";
import PoliticaDePrivacidade from "./pages/PoliticaDePrivacidade";
import RegisterPartner from "./pages/RegisterPartner";
import CadastroClinica from "./pages/CadastroClinica";
import CadastroPartner from "./pages/CadastroPartner";
import AccessDenied from "./pages/AccessDenied";
import AuditoriaPermissoes from "./pages/usuarios/AuditoriaPermissoes";
import AuditoriaSenhas from "./pages/usuarios/AuditoriaSenhas";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ChangePassword from "./pages/ChangePassword";
import MeuAcesso from "./pages/MeuAcesso";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { MustChangePasswordGate } from "./components/auth/MustChangePasswordGate";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <MustChangePasswordGate>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/change-password" element={<ChangePassword />} />
            <Route path="/dashboard" element={<DashboardHome />} />
            <Route path="/dashboard/meu-acesso" element={<MeuAcesso />} />
            <Route path="/dashboard/consultas" element={<Consultas />} />
            <Route path="/dashboard/contratos" element={<Contratos />} />
            <Route path="/dashboard/usuarios" element={<Usuarios />} />
            <Route path="/dashboard/usuarios/master" element={<Usuarios />} />
            <Route path="/dashboard/usuarios/permissoes" element={<Permissoes />} />
            <Route path="/dashboard/usuarios/hierarquias" element={<Hierarquias />} />
            <Route path="/dashboard/usuarios/lista" element={<Lista />} />
            <Route path="/dashboard/usuarios/auditoria" element={<AuditoriaPermissoes />} />
            <Route path="/dashboard/usuarios/auditoria-senhas" element={<AuditoriaSenhas />} />
            <Route element={<ProtectedRoute allowedRoles={['master', 'admin', 'master_partner', 'partner', 'representante']} />}>
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
              <Route path="/dashboard/partners/rota" element={<PartnersRota />} />
              <Route path="/dashboard/partners/diagnostico-ia" element={<PartnersDiagnosticoIA />} />
              <Route path="/dashboard/partners/clinicas" element={<PartnersClinicas />} />
              <Route path="/dashboard/partners/clinicas/:id" element={<PartnersClinicProfile />} />
              <Route path="/dashboard/representantes" element={<RepresentantesDashboard />} />
              <Route path="/dashboard/representantes/rede" element={<RepresentantesRede />} />
              <Route path="/dashboard/representantes/comissoes" element={<RepresentantesComissoes />} />
              <Route path="/dashboard/representantes/rota" element={<PartnersRota />} />
              <Route path="/dashboard/representantes/perfil" element={<PartnersProfile />} />
              <Route path="/dashboard/representantes/cadastro" element={<PartnersManagement />} />
              <Route path="/dashboard/representantes/clinicas" element={<RepresentantesClinicas />} />
              <Route path="/dashboard/representantes/clinicas/:id" element={<PartnersClinicProfile />} />
              <Route path="/dashboard/representantes/bonificacoes" element={<PartnersBonificacoes />} />
              <Route path="/dashboard/representantes/simulador" element={<PartnersSimulator />} />
              <Route path="/dashboard/representantes/marketing" element={<PartnersMarketing />} />
              <Route path="/dashboard/representantes/simulacoes-clinicas" element={<PartnersClinicSimulations />} />
              <Route path="/dashboard/representantes/config" element={<RepresentantesConfig />} />
              <Route path="/dashboard/representantes/monitoramento" element={<RepresentantesMonitoring />} />
            </Route>
            <Route element={<ProtectedRoute allowedRoles={['master', 'admin']} />}>
              <Route path="/dashboard/representantes/adm" element={<RepresentantesADM />} />
              <Route path="/dashboard/partners/comissoes-admin" element={<PartnersComissoesAdmin />} />
              <Route path="/dashboard/admin/parametros" element={<AdminParametros />} />
            </Route>
            {/* Catch-all for unknown /dashboard/representantes/* URLs */}
            <Route path="/dashboard/representantes/*" element={<RepresentantesCatchAll />} />
            <Route path="/dashboard/clinicas" element={<Clinicas />} />
            <Route path="/register/partner" element={<RegisterPartner />} />
            <Route path="/cadastroclinica" element={<CadastroClinica />} />
            <Route path="/cadastropartner" element={<CadastroPartner />} />
            <Route path="/termos-de-uso" element={<TermosDeUso />} />
            <Route path="/politica-de-privacidade" element={<PoliticaDePrivacidade />} />
            <Route path="/acesso-negado" element={<AccessDenied />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </MustChangePasswordGate>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
