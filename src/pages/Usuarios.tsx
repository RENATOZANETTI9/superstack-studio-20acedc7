import { useEffect, useState } from 'react';
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
  Users,
  User,
  UserPlus
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { cn, getInitials } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { z } from 'zod';
import type { SubUser, Permission } from '@/types';

const createUserSchema = z.object({
  email: z.string().email('Email inválido').max(255, 'Email muito longo'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres').max(100, 'Senha muito longa'),
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100, 'Nome muito longo'),
});

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  created_at: string;
  user_roles: { role: string }[] | null;
}

const permissionLabels: Record<Permission, string> = {
  view_dashboard: 'Ver Dashboard',
  upload_base: 'Upload de Base',
  view_clients: 'Ver Pacientes',
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
  const { user, isMaster, createUser, deleteUser, getAllUsers } = useAuth();
  
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [subUsers, setSubUsers] = useState<SubUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'viewer' as SubUser['role'],
  });
  const [errors, setErrors] = useState<{ email?: string; password?: string; name?: string }>({});
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (isMaster) {
      loadUsers();
    }
  }, [isMaster]);

  const loadUsers = async () => {
    setLoadingUsers(true);
    const { users: fetchedUsers, error } = await getAllUsers();
    if (error) {
      toast.error(error);
    } else {
      setUsers(fetchedUsers);
      // Convert to SubUser format for display
      const converted: SubUser[] = fetchedUsers.map((u: UserProfile) => ({
        id: u.id,
        name: u.email.split('@')[0], // Use email prefix as name for now
        email: u.email,
        role: u.user_roles?.[0]?.role === 'master' ? 'admin' : 'viewer',
        permissions: u.user_roles?.[0]?.role === 'master' 
          ? Object.keys(permissionLabels) as Permission[]
          : ['view_dashboard', 'view_clients'],
        createdAt: new Date(u.created_at),
        lastAccess: new Date(),
        active: true,
      }));
      setSubUsers(converted);
    }
    setLoadingUsers(false);
  };

  const validateForm = () => {
    try {
      createUserSchema.parse({ 
        email: newUser.email, 
        password: newUser.password,
        name: newUser.name 
      });
      setErrors({});
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: { email?: string; password?: string; name?: string } = {};
        err.errors.forEach((error) => {
          if (error.path[0] === 'email') fieldErrors.email = error.message;
          if (error.path[0] === 'password') fieldErrors.password = error.message;
          if (error.path[0] === 'name') fieldErrors.name = error.message;
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  const handleAddUser = async () => {
    if (!validateForm()) return;
    
    setIsCreating(true);
    const { error } = await createUser(newUser.email, newUser.password);
    
    if (error) {
      toast.error(error);
    } else {
      toast.success('Usuário criado com sucesso!');
      setNewUser({ name: '', email: '', password: '', role: 'viewer' });
      setIsAddModalOpen(false);
      loadUsers();
    }
    setIsCreating(false);
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    const { error } = await deleteUser(userId);
    
    if (error) {
      toast.error(error);
    } else {
      toast.success(`Usuário ${email} excluído com sucesso!`);
      loadUsers();
    }
  };

  const toggleUserStatus = (userId: string) => {
    setSubUsers(prev =>
      prev.map(u =>
        u.id === userId ? { ...u, active: !u.active } : u
      )
    );
  };

  const filteredUsers = subUsers.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const regularUsers = filteredUsers.filter(u => u.role !== 'admin');
  const masterUsers = filteredUsers.filter(u => u.role === 'admin');

  if (!isMaster) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <Shield className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
            <h2 className="mb-2 text-2xl font-bold text-foreground">Acesso Restrito</h2>
            <p className="text-muted-foreground">
              Apenas usuários Master podem gerenciar usuários.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

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
        {loadingUsers ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredUsers.map((subUser, index) => {
              const role = roleConfig[subUser.role];
              const RoleIcon = role.icon;
              const originalUser = users.find(u => u.id === subUser.id);

              return (
                <motion.div
                  key={subUser.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className={cn(
                    "glass-card border-border/50 transition-all",
                    !subUser.active && "opacity-60"
                  )}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className={cn(
                            "font-semibold",
                            subUser.active 
                              ? "bg-gradient-to-br from-primary to-secondary text-white" 
                              : "bg-muted text-muted-foreground"
                          )}>
                            {getInitials(subUser.name)}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <p className="font-semibold text-foreground">{subUser.name}</p>
                            <Badge className={cn("gap-1 border", role.color)}>
                              <RoleIcon className="h-3 w-3" />
                              {role.label}
                            </Badge>
                            {!subUser.active && (
                              <Badge variant="outline" className="text-muted-foreground">
                                Inativo
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <Mail className="h-3 w-3" />
                            {subUser.email}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {subUser.permissions.slice(0, 4).map(perm => (
                              <span
                                key={perm}
                                className="text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground"
                              >
                                {permissionLabels[perm]}
                              </span>
                            ))}
                            {subUser.permissions.length > 4 && (
                              <span className="text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground">
                                +{subUser.permissions.length - 4}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="hidden md:block text-right">
                          <p className="text-xs text-muted-foreground">Último acesso</p>
                          <p className="text-sm font-medium text-foreground">
                            {subUser.lastAccess?.toLocaleDateString('pt-BR')}
                          </p>
                        </div>

                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="hover:bg-primary/10 hover:text-primary">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => toggleUserStatus(subUser.id)}
                            className={subUser.active 
                              ? "text-warning hover:bg-warning/10" 
                              : "text-success hover:bg-success/10"
                            }
                          >
                            {subUser.active ? (
                              <UserX className="h-4 w-4" />
                            ) : (
                              <UserCheck className="h-4 w-4" />
                            )}
                          </Button>
                          {originalUser && originalUser.user_id !== user?.id && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="glass-card border-border/50">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="text-foreground">Excluir Usuário</AlertDialogTitle>
                                  <AlertDialogDescription className="text-muted-foreground">
                                    Tem certeza que deseja excluir o usuário {subUser.email}? Esta ação não pode ser desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="bg-background/50">Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteUser(originalUser.user_id, subUser.email)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Excluir
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
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
        )}

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
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name}</p>
                )}
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
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Senha</Label>
                <Input
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={newUser.password}
                  onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                  className="bg-background/50"
                />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
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
                        <Icon className="h-5 w-5 mx-auto mb-1 text-foreground" />
                        <span className="text-sm font-medium text-foreground">{config.label}</span>
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
                disabled={isCreating}
                className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
              >
                {isCreating ? 'Criando...' : 'Enviar Convite'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Usuarios;
