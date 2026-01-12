import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Shield, User, UserPlus, Trash2, Search } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { z } from 'zod';

const createUserSchema = z.object({
  email: z.string().email('Email inválido').max(255, 'Email muito longo'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres').max(100, 'Senha muito longa'),
});

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  created_at: string;
  user_roles: { role: string }[] | null;
}

const Usuarios = () => {
  const { user, isMaster, createUser, deleteUser, getAllUsers } = useAuth();
  
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

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
    }
    setLoadingUsers(false);
  };

  const validateForm = () => {
    try {
      createUserSchema.parse({ email: newUserEmail, password: newUserPassword });
      setErrors({});
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: { email?: string; password?: string } = {};
        err.errors.forEach((error) => {
          if (error.path[0] === 'email') fieldErrors.email = error.message;
          if (error.path[0] === 'password') fieldErrors.password = error.message;
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  const handleCreateUser = async () => {
    if (!validateForm()) return;
    
    setIsCreating(true);
    const { error } = await createUser(newUserEmail, newUserPassword);
    
    if (error) {
      toast.error(error);
    } else {
      toast.success('Usuário criado com sucesso!');
      setNewUserEmail('');
      setNewUserPassword('');
      setDialogOpen(false);
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

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const regularUsers = filteredUsers.filter(u => u.user_roles?.[0]?.role !== 'master');
  const masterUsers = filteredUsers.filter(u => u.user_roles?.[0]?.role === 'master');

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gerenciar Usuários</h1>
            <p className="text-muted-foreground">
              Crie, visualize e gerencie os usuários do sistema
            </p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-primary to-secondary hover:opacity-90">
                <UserPlus className="mr-2 h-4 w-4" />
                Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-card border-border/50">
              <DialogHeader>
                <DialogTitle className="text-foreground">Criar Novo Usuário</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Preencha os dados para criar um novo usuário no sistema.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="new-email">Email</Label>
                  <Input
                    id="new-email"
                    type="email"
                    placeholder="usuario@email.com"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    className="bg-background/50 border-border/50"
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">Senha</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    className="bg-background/50 border-border/50"
                  />
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password}</p>
                  )}
                </div>
                <Button 
                  onClick={handleCreateUser} 
                  disabled={isCreating}
                  className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                >
                  {isCreating ? 'Criando...' : 'Criar Usuário'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="glass-card rounded-xl p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar usuários por email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-background/50 pl-10"
            />
          </div>
        </div>

        {/* Users Lists */}
        {loadingUsers ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Master Users */}
            <div className="glass-card rounded-2xl p-6">
              <div className="mb-4 flex items-center gap-3">
                <Shield className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">
                  Usuários Master ({masterUsers.length})
                </h2>
              </div>
              
              {masterUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum usuário master encontrado.</p>
              ) : (
                <div className="space-y-3">
                  {masterUsers.map((userProfile) => (
                    <motion.div
                      key={userProfile.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between rounded-xl bg-background/50 p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-primary to-secondary">
                          <Shield className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{userProfile.email}</p>
                          <p className="text-xs text-muted-foreground">
                            Master • Criado em {new Date(userProfile.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Regular Users */}
            <div className="glass-card rounded-2xl p-6">
              <div className="mb-4 flex items-center gap-3">
                <Users className="h-5 w-5 text-secondary" />
                <h2 className="text-lg font-semibold text-foreground">
                  Usuários Comuns ({regularUsers.length})
                </h2>
              </div>
              
              {regularUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum usuário comum encontrado.</p>
              ) : (
                <div className="space-y-3">
                  {regularUsers.map((userProfile) => (
                    <motion.div
                      key={userProfile.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between rounded-xl bg-background/50 p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                          <User className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{userProfile.email}</p>
                          <p className="text-xs text-muted-foreground">
                            Usuário • Criado em {new Date(userProfile.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      
                      {userProfile.user_id !== user?.id && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="glass-card border-border/50">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-foreground">Excluir Usuário</AlertDialogTitle>
                              <AlertDialogDescription className="text-muted-foreground">
                                Tem certeza que deseja excluir o usuário {userProfile.email}? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="bg-background/50">Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteUser(userProfile.user_id, userProfile.email)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Usuarios;
