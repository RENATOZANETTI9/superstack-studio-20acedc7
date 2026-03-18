import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, FileSearch, FileSignature, Users, LogOut, ChevronDown,
  Shield, User, Menu, X, Key, GitBranch, UserCircle, Handshake,
  UserPlus, Network, DollarSign, Settings, Calculator, Activity, Megaphone,
  Building2, BarChart3
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useIsMobile } from '@/hooks/use-mobile';
import { isAdminRole, isPartnerRole, canAccessConfig, canAccessMonitoring, canAccessUsersMenu } from '@/lib/partner-rules';

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const AppSidebar = ({ collapsed, onToggle }: AppSidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isMaster, role, logout } = useAuth();
  const [usersOpen, setUsersOpen] = useState(location.pathname.startsWith('/dashboard/usuarios'));
  const [partnersOpen, setPartnersOpen] = useState(location.pathname.startsWith('/dashboard/partners'));
  const [clinicasOpen, setClinicasOpen] = useState(location.pathname.startsWith('/dashboard/clinicas'));
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const appRole = role as any;
  const isAdmin = isAdminRole(appRole);
  const isPartner = isPartnerRole(appRole);
  const showUsersMenu = canAccessUsersMenu(appRole);
  const showConfig = canAccessConfig(appRole);
  const showMonitoring = canAccessMonitoring(appRole);

  const handleLogout = async () => { await logout(); navigate('/'); };
  const isActive = (path: string) => location.pathname === path;
  const handleNavigate = (path: string) => {
    navigate(path);
    if (isMobile) setMobileMenuOpen(false);
  };

  // Base menu items - visible to all
  const menuItems = [
    { title: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  ];

  // Buscar Crédito and Créditos Aprovados visible to all roles
  menuItems.unshift(
    { title: 'Buscar Crédito', icon: FileSearch, path: '/dashboard/consultas' },
    { title: 'Créditos Aprovados', icon: FileSignature, path: '/dashboard/contratos' },
  );

  // Partner submenu items with RBAC
  const partnerSubItems = [
    { title: 'Dashboard', icon: LayoutDashboard, path: '/dashboard/partners', visible: true },
    { title: 'Cadastro', icon: UserPlus, path: '/dashboard/partners/cadastro', visible: true },
    { title: 'Rede', icon: Network, path: '/dashboard/partners/rede', visible: true },
    { title: 'Bonificações', icon: DollarSign, path: '/dashboard/partners/bonificacoes', visible: true },
    { title: 'Simulador', icon: Calculator, path: '/dashboard/partners/simulador', visible: true },
    { title: 'Marketing', icon: Megaphone, path: '/dashboard/partners/marketing', visible: true },
    { title: 'Simulações Clínicas', icon: BarChart3, path: '/dashboard/partners/simulacoes-clinicas', visible: true },
    { title: 'Configurações', icon: Settings, path: '/dashboard/partners/config', visible: showConfig },
    { title: 'Monitoramento', icon: Activity, path: '/dashboard/partners/monitoramento', visible: showMonitoring },
  ].filter(item => item.visible);

  const roleLabel = isAdmin ? (role === 'master' ? 'Master' : 'Admin') 
    : role === 'master_partner' ? 'Master Partner' 
    : role === 'partner' ? 'Partner' 
    : role === 'cs_geral' ? 'CS Geral'
    : role === 'cs_exclusiva' ? 'CS Exclusiva'
    : role === 'clinic_owner' ? 'Dono Clínica'
    : role === 'attendant' ? 'Atendente'
    : 'Usuário';

  // Mobile layout
  if (isMobile) {
    return (
      <>
        <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-sidebar border-b border-sidebar-border flex items-center justify-between px-4">
          <h1 className="text-lg font-bold text-sidebar-foreground">Help Ude</h1>
          <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-sidebar-foreground hover:bg-sidebar-accent">
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </header>

        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 bg-sidebar pt-14">
            <div className="border-b border-sidebar-border p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-primary to-secondary">
                  {isAdmin ? <Shield className="h-6 w-6 text-white" /> : <User className="h-6 w-6 text-white" />}
                </div>
                <div className="overflow-hidden">
                  <p className="truncate font-medium text-sidebar-foreground">{user?.email?.split('@')[0]}</p>
                  <p className="text-sm text-sidebar-foreground/60">{roleLabel}</p>
                </div>
              </div>
            </div>

            <nav className="flex-1 space-y-1 p-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 14rem)' }}>
              {menuItems.map((item) => (
                <Button key={item.path} variant="ghost" onClick={() => handleNavigate(item.path)}
                  className={cn('w-full justify-start gap-3 h-14 text-base text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground',
                    isActive(item.path) && 'bg-sidebar-accent text-sidebar-primary')}>
                  <item.icon className="h-6 w-6 shrink-0" /><span>{item.title}</span>
                </Button>
              ))}

              {/* Users Menu - admin only */}
              {showUsersMenu && (
                <Collapsible open={usersOpen} onOpenChange={setUsersOpen}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className={cn('w-full justify-start gap-3 h-14 text-base text-sidebar-foreground hover:bg-sidebar-accent',
                      location.pathname.startsWith('/dashboard/usuarios') && 'bg-sidebar-accent text-sidebar-primary')}>
                      <Users className="h-6 w-6 shrink-0" /><span className="flex-1 text-left">Gestão de Usuários</span>
                      <ChevronDown className={cn('h-5 w-5 transition-transform duration-200', usersOpen && 'rotate-180')} />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-1 pt-1">
                    {[
                      { title: 'Permissões', icon: Key, path: '/dashboard/usuarios/permissoes' },
                      { title: 'Hierarquias', icon: GitBranch, path: '/dashboard/usuarios/hierarquias' },
                      { title: 'Usuários', icon: UserCircle, path: '/dashboard/usuarios/lista' },
                    ].map(sub => (
                      <Button key={sub.path} variant="ghost" onClick={() => handleNavigate(sub.path)}
                        className={cn('w-full justify-start gap-3 h-12 pl-14 text-base text-sidebar-foreground/80 hover:bg-sidebar-accent',
                          isActive(sub.path) && 'bg-sidebar-accent text-sidebar-primary font-medium')}>
                        <sub.icon className="h-5 w-5 shrink-0" /><span>{sub.title}</span>
                      </Button>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* Partners Menu */}
              <Collapsible open={partnersOpen} onOpenChange={setPartnersOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className={cn('w-full justify-start gap-3 h-14 text-base text-sidebar-foreground hover:bg-sidebar-accent',
                    location.pathname.startsWith('/dashboard/partners') && 'bg-sidebar-accent text-sidebar-primary')}>
                    <Handshake className="h-6 w-6 shrink-0" /><span className="flex-1 text-left">Partners</span>
                    <ChevronDown className={cn('h-5 w-5 transition-transform duration-200', partnersOpen && 'rotate-180')} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-1 pt-1">
                  {partnerSubItems.map(sub => (
                    <Button key={sub.path} variant="ghost" onClick={() => handleNavigate(sub.path)}
                      className={cn('w-full justify-start gap-3 h-12 pl-14 text-base text-sidebar-foreground/80 hover:bg-sidebar-accent',
                        isActive(sub.path) && 'bg-sidebar-accent text-sidebar-primary font-medium')}>
                      <sub.icon className="h-5 w-5 shrink-0" /><span>{sub.title}</span>
                    </Button>
                  ))}
                </CollapsibleContent>
              </Collapsible>

              {/* Clínicas Menu */}
              <Button variant="ghost" onClick={() => handleNavigate('/dashboard/clinicas')}
                className={cn('w-full justify-start gap-3 h-14 text-base text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground',
                  isActive('/dashboard/clinicas') && 'bg-sidebar-accent text-sidebar-primary')}>
                <Building2 className="h-6 w-6 shrink-0" /><span>Clínicas</span>
              </Button>
            </nav>

            <div className="border-t border-sidebar-border p-4">
              <Button variant="ghost" onClick={handleLogout}
                className="w-full justify-start gap-3 h-14 text-base text-sidebar-foreground/80 hover:bg-destructive/20 hover:text-destructive">
                <LogOut className="h-6 w-6 shrink-0" /><span>Sair</span>
              </Button>
            </div>
          </div>
        )}

        <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-sidebar border-t border-sidebar-border flex items-center justify-center gap-1 px-4 safe-area-inset-bottom">
          {menuItems.slice(0, 3).map((item) => (
            <Button key={item.path} variant="ghost" onClick={() => handleNavigate(item.path)}
              className={cn('flex-1 flex-col h-14 gap-1 text-sidebar-foreground hover:bg-sidebar-accent', isActive(item.path) && 'text-sidebar-primary')}>
              <item.icon className={cn('h-5 w-5', isActive(item.path) && 'text-primary')} />
              <span className="text-[10px]">{item.title}</span>
            </Button>
          ))}
          {showUsersMenu && (
            <Button variant="ghost" onClick={() => handleNavigate('/dashboard/usuarios/lista')}
              className={cn('flex-1 flex-col h-14 gap-1 text-sidebar-foreground hover:bg-sidebar-accent',
                location.pathname.startsWith('/dashboard/usuarios') && 'text-sidebar-primary')}>
              <Users className={cn('h-5 w-5', location.pathname.startsWith('/dashboard/usuarios') && 'text-primary')} />
              <span className="text-[10px]">Usuários</span>
            </Button>
          )}
          <Button variant="ghost" onClick={() => handleNavigate('/dashboard/partners')}
            className={cn('flex-1 flex-col h-14 gap-1 text-sidebar-foreground hover:bg-sidebar-accent',
              location.pathname.startsWith('/dashboard/partners') && 'text-sidebar-primary')}>
            <Handshake className={cn('h-5 w-5', location.pathname.startsWith('/dashboard/partners') && 'text-primary')} />
            <span className="text-[10px]">Partners</span>
          </Button>
        </nav>
      </>
    );
  }

  // Desktop Sidebar
  return (
    <aside className={cn('fixed left-0 top-0 z-40 h-screen bg-sidebar transition-all duration-300', collapsed ? 'w-16' : 'w-64')}>
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
        {!collapsed && <h1 className="text-xl font-bold text-sidebar-foreground">Help Ude</h1>}
        <Button variant="ghost" size="icon" onClick={onToggle} className="text-sidebar-foreground hover:bg-sidebar-accent">
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      <div className={cn('border-b border-sidebar-border p-4', collapsed && 'flex justify-center')}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-primary to-secondary">
            {isAdmin ? <Shield className="h-5 w-5 text-white" /> : <User className="h-5 w-5 text-white" />}
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="truncate text-sm font-medium text-sidebar-foreground">{user?.email?.split('@')[0]}</p>
              <p className="text-xs text-sidebar-foreground/60">{roleLabel}</p>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-2">
        {menuItems.map((item) => (
          <Button key={item.path} variant="ghost" onClick={() => navigate(item.path)}
            className={cn('w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground',
              isActive(item.path) && 'bg-sidebar-accent text-sidebar-primary', collapsed && 'justify-center px-2')}>
            <item.icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span>{item.title}</span>}
          </Button>
        ))}

        {/* Users Menu - admin only */}
        {showUsersMenu && (
          <Collapsible open={usersOpen} onOpenChange={setUsersOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className={cn('w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground',
                location.pathname.startsWith('/dashboard/usuarios') && 'bg-sidebar-accent text-sidebar-primary', collapsed && 'justify-center px-2')}>
                <Users className="h-5 w-5 shrink-0" />
                {!collapsed && (<><span className="flex-1 text-left">Gestão de Usuários</span><ChevronDown className={cn('h-4 w-4 transition-transform duration-200', usersOpen && 'rotate-180')} /></>)}
              </Button>
            </CollapsibleTrigger>
            {!collapsed && (
              <CollapsibleContent className="space-y-1 pt-1">
                {[
                  { title: 'Permissões', icon: Key, path: '/dashboard/usuarios/permissoes' },
                  { title: 'Hierarquias', icon: GitBranch, path: '/dashboard/usuarios/hierarquias' },
                  { title: 'Usuários', icon: UserCircle, path: '/dashboard/usuarios/lista' },
                ].map(sub => (
                  <Button key={sub.path} variant="ghost" onClick={() => navigate(sub.path)}
                    className={cn('w-full justify-start gap-2 pl-11 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground',
                      isActive(sub.path) && 'bg-sidebar-accent text-sidebar-primary font-medium')}>
                    <sub.icon className="h-4 w-4 shrink-0" /><span>{sub.title}</span>
                  </Button>
                ))}
              </CollapsibleContent>
            )}
          </Collapsible>
        )}

        {/* Partners Menu */}
        <Collapsible open={partnersOpen} onOpenChange={setPartnersOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className={cn('w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground',
              location.pathname.startsWith('/dashboard/partners') && 'bg-sidebar-accent text-sidebar-primary', collapsed && 'justify-center px-2')}>
              <Handshake className="h-5 w-5 shrink-0" />
              {!collapsed && (<><span className="flex-1 text-left">Partners</span><ChevronDown className={cn('h-4 w-4 transition-transform duration-200', partnersOpen && 'rotate-180')} /></>)}
            </Button>
          </CollapsibleTrigger>
          {!collapsed && (
            <CollapsibleContent className="space-y-1 pt-1">
              {partnerSubItems.map(sub => (
                <Button key={sub.path} variant="ghost" onClick={() => navigate(sub.path)}
                  className={cn('w-full justify-start gap-2 pl-11 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground',
                    isActive(sub.path) && 'bg-sidebar-accent text-sidebar-primary font-medium')}>
                  <sub.icon className="h-4 w-4 shrink-0" /><span>{sub.title}</span>
                </Button>
              ))}
            </CollapsibleContent>
          )}
        </Collapsible>
      </nav>

      <div className="border-t border-sidebar-border p-2">
        <Button variant="ghost" onClick={handleLogout}
          className={cn('w-full justify-start gap-3 text-sidebar-foreground/80 hover:bg-destructive/20 hover:text-destructive', collapsed && 'justify-center px-2')}>
          <LogOut className="h-5 w-5 shrink-0" />{!collapsed && <span>Sair</span>}
        </Button>
      </div>
    </aside>
  );
};

export default AppSidebar;
