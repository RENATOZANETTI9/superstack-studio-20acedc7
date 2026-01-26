import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Shield,
  ShieldCheck,
  Eye,
  Edit,
  Trash2,
  Mail,
  UserCheck,
  UserX,
  Users
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { cn, getInitials } from '@/lib/utils';
import type { SubUser, Permission } from '@/types';

const mockUsers: SubUser[] = [
  {
    id: '1',
    name: 'Ana Carolina',
    email: 'ana@clinica.com',
    role: 'admin',
    permissions: ['view_dashboard', 'upload_base', 'view_clients', 'send_messages', 'manage_users', 'manage_marketing', 'view_reports', 'export_data'],
    createdAt: new Date('2024-01-10'),
    lastAccess: new Date(),
    active: true,
  },
  {
    id: '2',
    name: 'Carlos Eduardo',
    email: 'carlos@clinica.com',
    role: 'operator',
    permissions: ['view_dashboard', 'upload_base', 'view_clients', 'send_messages'],
    createdAt: new Date('2024-02-15'),
    lastAccess: new Date(),
    active: true,
  },
  {
    id: '3',
    name: 'Mariana Silva',
    email: 'mariana@clinica.com',
    role: 'viewer',
    permissions: ['view_dashboard', 'view_clients'],
    createdAt: new Date('2024-03-01'),
    lastAccess: new Date('2024-03-10'),
    active: false,
  },
];

const permissionLabels: Record<Permission, string> = {
  view_dashboard: 'Ver Dashboard',
  upload_base: 'Upload de Base',
  view_clients: 'Ver Clientes',
  send_messages: 'Enviar Mensagens',
  manage_users: 'Gerenciar Usuários',
  manage_marketing: 'Gerenciar Marketing',
  view_reports: 'Ver Relatórios',
  export_data: 'Exportar Dados',
};

const roleConfig = {
  admin: {
    label: 'Administrador',
    color: 'bg-primary/20 text-primary border-primary/30',
    icon: ShieldCheck,
  },
  operator: {
    label: 'Operador',
    color: 'bg-secondary/20 text-secondary border-secondary/30',
    icon: Shield,
  },
  viewer: {
    label: 'Visualizador',
    color: 'bg-muted text-muted-foreground border-border',
    icon: Eye,
  },
};

const Usuarios = () => {
  const [users, setUsers] = useState<SubUser[]>(mockUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'viewer' as SubUser['role'],
  });

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddUser = () => {
    const user: SubUser = {
      id: Date.now().toString(),
      ...newUser,
      permissions: newUser.role === 'admin' 
        ? Object.keys(permissionLabels) as Permission[]
        : newUser.role === 'operator'
        ? ['view_dashboard', 'upload_base', 'view_clients', 'send_messages']
        : ['view_dashboard', 'view_clients'],
      createdAt: new Date(),
      active: true,
    };
    
    setUsers(prev => [...prev, user]);
    setIsAddModalOpen(false);
    setNewUser({ name: '', email: '', role: 'viewer' });
  };

  const toggleUserStatus = (userId: string) => {
    setUsers(prev =>
      prev.map(user =>
        user.id === userId ? { ...user, active: !user.active } : user
      )
    );
  };

  const handleDeleteUser = (userId: string) => {
    setUsers(prev => prev.filter(user => user.id !== userId));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Gerenciamento de Usuários
            </h1>
            <p className="text-muted-foreground mt-1">
              Controle o acesso e permissões dos membros da sua equipe
            </p>
          </div>
          <Button 
            onClick={() => setIsAddModalOpen(true)} 
            className="gap-2 bg-gradient-to-r from-primary to-secondary hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Adicionar Usuário
          </Button>
        </div>

        {/* Search */}
        <Card className="glass-card border-border/50">
          <CardContent className="p-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-background/50"
              />
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        <div className="grid gap-4">
          {filteredUsers.map((user, index) => {
            const role = roleConfig[user.role];
            const RoleIcon = role.icon;

            return (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={cn(
                  "glass-card border-border/50 transition-all",
                  !user.active && "opacity-60"
                )}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className={cn(
                          "font-semibold",
                          user.active 
                            ? "bg-gradient-to-br from-primary to-secondary text-white" 
                            : "bg-muted text-muted-foreground"
                        )}>
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className="font-semibold text-foreground">{user.name}</p>
                          <Badge className={cn("gap-1 border", role.color)}>
                            <RoleIcon className="h-3 w-3" />
                            {role.label}
                          </Badge>
                          {!user.active && (
                            <Badge variant="outline" className="text-muted-foreground">
                              Inativo
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {user.permissions.slice(0, 4).map(perm => (
                            <span
                              key={perm}
                              className="text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground"
                            >
                              {permissionLabels[perm]}
                            </span>
                          ))}
                          {user.permissions.length > 4 && (
                            <span className="text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground">
                              +{user.permissions.length - 4}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="hidden md:block text-right">
                        <p className="text-xs text-muted-foreground">Último acesso</p>
                        <p className="text-sm font-medium text-foreground">
                          {user.lastAccess?.toLocaleDateString('pt-BR')}
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="hover:bg-primary/10 hover:text-primary">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => toggleUserStatus(user.id)}
                          className={user.active 
                            ? "text-warning hover:bg-warning/10" 
                            : "text-success hover:bg-success/10"
                          }
                        >
                          {user.active ? (
                            <UserX className="h-4 w-4" />
                          ) : (
                            <UserCheck className="h-4 w-4" />
                          )}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}

          {filteredUsers.length === 0 && (
            <Card className="glass-card border-border/50">
              <CardContent className="p-8 text-center text-muted-foreground">
                <Users className="mx-auto mb-4 h-12 w-12 opacity-50" />
                <p>Nenhum usuário encontrado</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Add User Modal */}
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogContent className="glass-card border-border/50">
            <DialogHeader>
              <DialogTitle className="text-foreground">Adicionar Novo Usuário</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Convide um membro da equipe para acessar a plataforma
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input
                  placeholder="Nome completo"
                  value={newUser.name}
                  onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                  className="bg-background/50"
                />
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="email@exemplo.com"
                  value={newUser.email}
                  onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                  className="bg-background/50"
                />
              </div>

              <div className="space-y-2">
                <Label>Função</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(['admin', 'operator', 'viewer'] as const).map((role) => {
                    const config = roleConfig[role];
                    const Icon = config.icon;
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setNewUser(prev => ({ ...prev, role }))}
                        className={cn(
                          "p-3 rounded-xl border-2 transition-all text-center",
                          newUser.role === role
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <Icon className={cn(
                          "h-5 w-5 mx-auto mb-1",
                          newUser.role === role ? "text-primary" : "text-muted-foreground"
                        )} />
                        <span className={cn(
                          "text-sm font-medium",
                          newUser.role === role ? "text-primary" : "text-muted-foreground"
                        )}>
                          {config.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleAddUser}
                className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                disabled={!newUser.name || !newUser.email}
              >
                Enviar Convite
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Usuarios;
