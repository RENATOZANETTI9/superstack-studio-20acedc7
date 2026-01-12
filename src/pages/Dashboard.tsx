import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, LogOut, UserPlus, Trash2, Shield, User } from 'lucide-react';
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

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, role, isMaster, isAuthenticated, isLoading, logout, createUser, deleteUser, getAllUsers } = useAuth();
  
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, isLoading, navigate]);

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

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold gradient-text">HelpUde</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              {isMaster ? (
                <Shield className="w-4 h-4 text-primary" />
              ) : (
                <User className="w-4 h-4" />
              )}
              <span className="text-sm">{user?.email}</span>
              <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                {isMaster ? 'Master' : 'Usuário'}
              </span>
            </div>
            <Button variant="ghost" onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Bem-vindo, {user?.email?.split('@')[0]}!
          </h2>
          <p className="text-muted-foreground mb-8">
            {isMaster 
              ? 'Você tem acesso total ao sistema como usuário Master.'
              : 'Você tem acesso ao sistema como usuário regular.'}
          </p>

          {/* Master Panel */}
          {isMaster && (
            <div className="glass-card rounded-2xl p-6 mb-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Users className="w-6 h-6 text-primary" />
                  <h3 className="text-xl font-semibold text-foreground">Gerenciar Usuários</h3>
                </div>
                
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-primary to-teal hover:opacity-90">
                      <UserPlus className="w-4 h-4 mr-2" />
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
                        className="w-full bg-gradient-to-r from-primary to-teal hover:opacity-90"
                      >
                        {isCreating ? 'Criando...' : 'Criar Usuário'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Users List */}
              {loadingUsers ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : users.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Nenhum usuário encontrado.
                </p>
              ) : (
                <div className="space-y-3">
                  {users.map((userProfile) => (
                    <div
                      key={userProfile.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-background/50 border border-border/30"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-teal flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {userProfile.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{userProfile.email}</p>
                          <p className="text-xs text-muted-foreground">
                            {userProfile.user_roles?.[0]?.role === 'master' ? 'Master' : 'Usuário'} • Criado em {new Date(userProfile.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      
                      {userProfile.user_id !== user?.id && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                              <Trash2 className="w-4 h-4" />
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
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Regular User Content */}
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-xl font-semibold text-foreground mb-4">Área do Usuário</h3>
            <p className="text-muted-foreground">
              Você está logado e tem acesso ao sistema HelpUde. 
              {!isMaster && ' Entre em contato com o administrador para solicitar permissões adicionais.'}
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Dashboard;
