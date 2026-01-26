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
import Usuarios from "./pages/Usuarios";
import Permissoes from "./pages/usuarios/Permissoes";
import Hierarquias from "./pages/usuarios/Hierarquias";
import Lista from "./pages/usuarios/Lista";
import NotFound from "./pages/NotFound";

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
            <Route path="/dashboard/usuarios" element={<Usuarios />} />
            <Route path="/dashboard/usuarios/master" element={<Usuarios />} />
            <Route path="/dashboard/usuarios/permissoes" element={<Permissoes />} />
            <Route path="/dashboard/usuarios/hierarquias" element={<Hierarquias />} />
            <Route path="/dashboard/usuarios/lista" element={<Lista />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
