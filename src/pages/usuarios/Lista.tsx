import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Building2, Mail, Calendar } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { DataTable, Column } from '@/components/usuarios/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn, getInitials } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface User {
  id: string;
  name: string;
  email: string;
  client: string;
  status: 'ATIVO' | 'INATIVO';
  hierarchy?: string;
  createdAt: string;
}

const mockUsers: User[] = [
  {
    id: '1',
    name: 'INSTITUTO LETICIA KIYO LTDA',
    email: 'leticiakiyo@gmail.com',
    client: 'INSTITUTO LETICIA KIYO LTDA',
    status: 'INATIVO',
    hierarchy: '',
    createdAt: '08/01/2026 11:14:51',
  },
  {
    id: '2',
    name: 'MS ESPECIALIDADES MEDICAS LTDA',
    email: 'miria.psiclinica@gmail.com',
    client: 'MS ESPECIALIDADES MEDICAS LTDA',
    status: 'ATIVO',
    hierarchy: '',
    createdAt: '07/01/2026 17:52:15',
  },
  {
    id: '3',
    name: 'Ligia Cintra',
    email: 'clinicah2a@gmail.com',
    client: 'Ligia Cintra',
    status: 'INATIVO',
    hierarchy: '',
    createdAt: '08/11/2025 20:43:29',
  },
  {
    id: '4',
    name: 'Elane',
    email: 'helpude6@helpude.com.br',
    client: 'CLÍNICA MASTER',
    status: 'ATIVO',
    hierarchy: 'HelpUde2',
    createdAt: '29/09/2025 09:36:44',
  },
  {
    id: '5',
    name: 'Dr. Carlos Mendes',
    email: 'carlos.mendes@clinica.com',
    client: 'Clínica São Paulo',
    status: 'ATIVO',
    hierarchy: 'Médico',
    createdAt: '15/10/2025 14:22:10',
  },
  {
    id: '6',
    name: 'Ana Paula Silva',
    email: 'ana.silva@helpude.com.br',
    client: 'CLÍNICA MASTER',
    status: 'ATIVO',
    hierarchy: 'Atendente',
    createdAt: '20/08/2025 09:15:30',
  },
  {
    id: '7',
    name: 'Roberto Almeida',
    email: 'roberto@clinicaalmeida.com',
    client: 'Clínica Almeida & Filhos',
    status: 'ATIVO',
    hierarchy: 'Aprovador',
    createdAt: '05/07/2025 16:45:00',
  },
  {
    id: '8',
    name: 'Fernanda Costa',
    email: 'fernanda.costa@helpude.com.br',
    client: 'CLÍNICA MASTER',
    status: 'ATIVO',
    hierarchy: 'CS',
    createdAt: '12/06/2025 11:30:22',
  },
  {
    id: '9',
    name: 'ODONTOCLINIC LTDA',
    email: 'contato@odontoclinic.com.br',
    client: 'ODONTOCLINIC LTDA',
    status: 'INATIVO',
    hierarchy: '',
    createdAt: '28/05/2025 08:00:00',
  },
  {
    id: '10',
    name: 'Marcos Pereira',
    email: 'marcos.p@helpude.com.br',
    client: 'CLÍNICA MASTER',
    status: 'ATIVO',
    hierarchy: 'SDR',
    createdAt: '03/04/2025 10:20:15',
  },
];

const hierarchyOptions = [
  'Master do Sistema',
  'Master da Clínica',
  'Gestor',
  'Supervisor',
  'CS',
  'SDR',
  'Aprovador',
  'Atendente',
  'Médico',
];

const Lista = () => {
  const isMobile = useIsMobile();
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    client: '',
    status: 'ATIVO' as User['status'],
    hierarchy: '',
  });

  const columns: Column<User>[] = [
    {
      key: 'name',
      header: 'Nome',
      render: (item) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-xs font-semibold">
              {getInitials(item.name)}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium">{item.name}</span>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      render: (item) => (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Mail className="h-3.5 w-3.5" />
          <span className="text-sm">{item.email}</span>
        </div>
      ),
    },
    {
      key: 'client',
      header: 'Cliente',
      render: (item) => (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Building2 className="h-3.5 w-3.5" />
          <span className="text-sm">{item.client}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => (
        <Badge
          className={cn(
            item.status === 'ATIVO'
              ? 'bg-success/20 text-success border-success/30'
              : 'bg-destructive/20 text-destructive border-destructive/30'
          )}
        >
          {item.status}
        </Badge>
      ),
    },
    {
      key: 'hierarchy',
      header: 'Estrutura',
      render: (item) =>
        item.hierarchy ? (
          <div className="flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5 text-primary" />
            <span className="text-sm">{item.hierarchy}</span>
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: 'createdAt',
      header: 'Criado em',
      render: (item) => (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          <span className="text-sm">{item.createdAt}</span>
        </div>
      ),
    },
  ];

  const handleAdd = () => {
    setEditingUser(null);
    setFormData({ name: '', email: '', client: '', status: 'ATIVO', hierarchy: '' });
    setIsModalOpen(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      client: user.client,
      status: user.status,
      hierarchy: user.hierarchy || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = (user: User) => {
    if (confirm(`Deseja realmente deletar o usuário "${user.name}"?`)) {
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    }
  };

  const handleSave = () => {
    if (!formData.name.trim() || !formData.email.trim()) return;

    if (editingUser) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingUser.id
            ? { ...u, ...formData }
            : u
        )
      );
    } else {
      const newUser: User = {
        id: (users.length + 1).toString(),
        ...formData,
        createdAt: new Date().toLocaleString('pt-BR'),
      };
      setUsers((prev) => [...prev, newUser]);
    }

    setIsModalOpen(false);
    setFormData({ name: '', email: '', client: '', status: 'ATIVO', hierarchy: '' });
  };

  return (
    <DashboardLayout>
      <div className={cn('space-y-6', isMobile && 'mt-14')}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">
              Usuários
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Gerencie os usuários do sistema ({users.length} registros)
            </p>
          </div>
          <Button
            onClick={handleAdd}
            className={cn(
              'gap-2 bg-gradient-to-r from-primary to-secondary hover:opacity-90',
              isMobile && 'w-full'
            )}
          >
            <Plus className="h-4 w-4" />
            Adicionar Usuário
          </Button>
        </motion.div>

        {/* Data Table */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <DataTable
            data={users}
            columns={columns}
            searchPlaceholder="Pesquisar por nome, email ou cliente..."
            searchKeys={['name', 'email', 'client']}
            onView={(item) => console.log('View', item)}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </motion.div>

        {/* Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent
            className={cn(
              'glass-card border-border/50',
              isMobile && 'w-[calc(100%-2rem)] max-w-lg mx-auto'
            )}
          >
            <DialogHeader>
              <DialogTitle className="text-foreground">
                {editingUser ? 'Editar Usuário' : 'Adicionar Usuário'}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                {editingUser
                  ? 'Edite os dados do usuário'
                  : 'Preencha os dados para criar um novo usuário'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input
                    placeholder="Nome completo"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="bg-background/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    placeholder="email@exemplo.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, email: e.target.value }))
                    }
                    className="bg-background/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Cliente / Clínica</Label>
                <Input
                  placeholder="Nome da clínica"
                  value={formData.client}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, client: e.target.value }))
                  }
                  className="bg-background/50"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(v) =>
                      setFormData((prev) => ({ ...prev, status: v as User['status'] }))
                    }
                  >
                    <SelectTrigger className="bg-background/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background border border-border z-50">
                      <SelectItem value="ATIVO">ATIVO</SelectItem>
                      <SelectItem value="INATIVO">INATIVO</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Hierarquia</Label>
                  <Select
                    value={formData.hierarchy || 'none'}
                    onValueChange={(v) =>
                      setFormData((prev) => ({ ...prev, hierarchy: v === 'none' ? '' : v }))
                    }
                  >
                    <SelectTrigger className="bg-background/50">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent className="bg-background border border-border z-50">
                      <SelectItem value="none">Nenhuma</SelectItem>
                      {hierarchyOptions.map((h) => (
                        <SelectItem key={h} value={h}>
                          {h}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter className={cn(isMobile && 'flex-col gap-2')}>
              <Button
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className={cn(isMobile && 'w-full order-2')}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                className={cn(
                  'bg-gradient-to-r from-primary to-secondary hover:opacity-90',
                  isMobile && 'w-full order-1'
                )}
                disabled={!formData.name.trim() || !formData.email.trim()}
              >
                {editingUser ? 'Salvar' : 'Criar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Lista;
