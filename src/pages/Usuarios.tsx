import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
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
import { Input } from '@/components/ui/input';
import { cn, getInitials } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface SubUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'operator' | 'viewer';
  active: boolean;
}

const mockUsers: SubUser[] = [
  {
    id: '1',
    name: 'Ana Carolina',
    email: 'ana@clinica.com',
    role: 'admin',
    active: true,
  },
  {
    id: '2',
    name: 'Carlos Eduardo',
    email: 'carlos@clinica.com',
    role: 'operator',
    active: true,
  },
  {
    id: '3',
    name: 'Mariana Silva',
    email: 'mariana@clinica.com',
    role: 'viewer',
    active: false,
  },
];

const roleConfig = {
  admin: {
    label: 'Administrador',
    color: 'bg-purple-100 text-purple-700',
  },
  operator: {
    label: 'Operador',
    color: 'bg-blue-100 text-blue-700',
  },
  viewer: {
    label: 'Visualizador',
    color: 'bg-slate-100 text-slate-600',
  },
};

const Usuarios = () => {
  const [users, setUsers] = useState<SubUser[]>(mockUsers);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'viewer' as SubUser['role'],
  });
  const isMobile = useIsMobile();

  const handleAddUser = () => {
    const user: SubUser = {
      id: Date.now().toString(),
      ...newUser,
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
      <div className={cn("space-y-6", isMobile && "mt-14")}>
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">
              Gerenciamento de Usuários
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Controle o acesso e permissões dos membros da sua equipe
            </p>
          </div>
          <Button 
            onClick={() => setIsAddModalOpen(true)} 
            className={cn(
              "gap-2 bg-gradient-to-r from-primary to-secondary hover:opacity-90",
              isMobile && "w-full"
            )}
          >
            <Plus className="h-4 w-4" />
            Adicionar Usuário
          </Button>
        </div>

        {/* Users List */}
        <div className="flex flex-col gap-3">
          {users.map((user, index) => {
            const role = roleConfig[user.role];

            return (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={cn(
                  "glass-card border-border/50",
                  !user.active && "opacity-60"
                )}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <Avatar className="h-12 w-12 shrink-0">
                        <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white font-semibold">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>

                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="font-semibold text-foreground">{user.name}</p>
                          <Badge className={cn("text-xs", role.color)}>
                            {role.label}
                          </Badge>
                          {!user.active && (
                            <Badge variant="outline" className="text-muted-foreground text-xs">
                              Inativo
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5" />
                          {user.email}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-9 w-9 text-muted-foreground hover:text-foreground"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => toggleUserStatus(user.id)}
                          className={cn(
                            "h-9 w-9",
                            user.active 
                              ? "text-warning hover:text-warning hover:bg-warning/10" 
                              : "text-success hover:text-success hover:bg-success/10"
                          )}
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
                          className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10"
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

          {users.length === 0 && (
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
          <DialogContent className={cn(
            "glass-card border-border/50",
            isMobile && "w-[calc(100%-2rem)] max-w-lg mx-auto"
          )}>
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

            <DialogFooter className={cn(isMobile && "flex-col gap-2")}>
              <Button 
                variant="outline" 
                onClick={() => setIsAddModalOpen(false)}
                className={cn(isMobile && "w-full order-2")}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleAddUser}
                className={cn(
                  "bg-gradient-to-r from-primary to-secondary hover:opacity-90",
                  isMobile && "w-full order-1"
                )}
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
