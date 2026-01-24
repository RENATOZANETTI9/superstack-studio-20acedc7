import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileSearch, 
  Users, 
  LogOut,
  ChevronDown,
  Shield,
  User,
  Menu
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const AppSidebar = ({ collapsed, onToggle }: AppSidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isMaster, logout } = useAuth();
  const [usersOpen, setUsersOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  const menuItems = [
    {
      title: 'Consultas',
      icon: FileSearch,
      path: '/dashboard/consultas',
    },
    {
      title: 'Dashboard',
      icon: LayoutDashboard,
      path: '/dashboard',
    },
  ];

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-sidebar transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
        {!collapsed && (
          <h1 className="text-xl font-bold text-sidebar-foreground">HelpUde</h1>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* User Info */}
      <div className={cn(
        'border-b border-sidebar-border p-4',
        collapsed && 'flex justify-center'
      )}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-primary to-secondary">
            {isMaster ? (
              <Shield className="h-5 w-5 text-white" />
            ) : (
              <User className="h-5 w-5 text-white" />
            )}
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="truncate text-sm font-medium text-sidebar-foreground">
                {user?.email?.split('@')[0]}
              </p>
              <p className="text-xs text-sidebar-foreground/60">
                {isMaster ? 'Master' : 'Usuário'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-2">
        {menuItems.map((item) => (
          <Button
            key={item.path}
            variant="ghost"
            onClick={() => navigate(item.path)}
            className={cn(
              'w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground',
              isActive(item.path) && 'bg-sidebar-accent text-sidebar-primary',
              collapsed && 'justify-center px-2'
            )}
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span>{item.title}</span>}
          </Button>
        ))}

        {/* Users Menu with Hierarchy */}
        <Collapsible open={usersOpen} onOpenChange={setUsersOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                'w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground',
                (isActive('/dashboard/usuarios') || isActive('/dashboard/usuarios/master')) && 'bg-sidebar-accent text-sidebar-primary',
                collapsed && 'justify-center px-2'
              )}
            >
              <Users className="h-5 w-5 shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1 text-left">Usuários</span>
                  <ChevronDown className={cn(
                    'h-4 w-4 transition-transform',
                    usersOpen && 'rotate-180'
                  )} />
                </>
              )}
            </Button>
          </CollapsibleTrigger>
          {!collapsed && (
            <CollapsibleContent className="space-y-1 pl-8 pt-1">
              <Button
                variant="ghost"
                onClick={() => navigate('/dashboard/usuarios')}
                className={cn(
                  'w-full justify-start text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground',
                  isActive('/dashboard/usuarios') && 'bg-sidebar-accent text-sidebar-primary'
                )}
              >
                <User className="mr-2 h-4 w-4" />
                Usuários Comuns
              </Button>
              {isMaster && (
                <Button
                  variant="ghost"
                  onClick={() => navigate('/dashboard/usuarios/master')}
                  className={cn(
                    'w-full justify-start text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground',
                    isActive('/dashboard/usuarios/master') && 'bg-sidebar-accent text-sidebar-primary'
                  )}
                >
                  <Shield className="mr-2 h-4 w-4" />
                  Gerenciar Usuários
                </Button>
              )}
            </CollapsibleContent>
          )}
        </Collapsible>
      </nav>

      {/* Logout */}
      <div className="border-t border-sidebar-border p-2">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className={cn(
            'w-full justify-start gap-3 text-sidebar-foreground/80 hover:bg-destructive/20 hover:text-destructive',
            collapsed && 'justify-center px-2'
          )}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Sair</span>}
        </Button>
      </div>
    </aside>
  );
};

export default AppSidebar;
