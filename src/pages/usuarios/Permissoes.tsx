import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Key } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { DataTable, Column } from '@/components/usuarios/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface Permission {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

// Mock data - 119 permissions as per documentation
const mockPermissions: Permission[] = [
  { id: '1', name: 'onboarding_dashboard_access', description: 'Acesso ao dashboard de onboarding', createdAt: '2025-01-01' },
  { id: '2', name: 'atendente', description: 'Permissão de atendente', createdAt: '2025-01-01' },
  { id: '3', name: 'aprovador', description: 'Permissão de aprovador', createdAt: '2025-01-01' },
  { id: '4', name: 'sdr', description: 'Permissão de SDR', createdAt: '2025-01-01' },
  { id: '5', name: 'cs', description: 'Permissão de Customer Success', createdAt: '2025-01-01' },
  { id: '6', name: 'supervisor', description: 'Permissão de supervisor', createdAt: '2025-01-01' },
  { id: '7', name: 'gestor', description: 'Permissão de gestor', createdAt: '2025-01-01' },
  { id: '8', name: 'user_create_medico', description: 'Criar usuário médico', createdAt: '2025-01-01' },
  { id: '9', name: 'clinica_edit_endereco', description: 'Editar endereço da clínica', createdAt: '2025-01-01' },
  { id: '10', name: 'user_create_aprovador', description: 'Criar usuário aprovador', createdAt: '2025-01-01' },
  { id: '11', name: 'user_create_atendente', description: 'Criar usuário atendente', createdAt: '2025-01-01' },
  { id: '12', name: 'master_clinica', description: 'Permissão master da clínica', createdAt: '2025-01-01' },
  { id: '13', name: 'master_sistema', description: 'Permissão master do sistema', createdAt: '2025-01-01' },
  { id: '14', name: 'clinica_filial_create', description: 'Criar filial da clínica', createdAt: '2025-01-01' },
  { id: '15', name: 'dashboard_access', description: 'Acesso ao dashboard', createdAt: '2025-01-01' },
  { id: '16', name: 'propostum_approve', description: 'Aprovar proposta', createdAt: '2025-01-01' },
  { id: '17', name: 'clinica_sensitive_edit', description: 'Editar dados sensíveis da clínica', createdAt: '2025-01-01' },
  { id: '18', name: 'paciente_sensitive_edit', description: 'Editar dados sensíveis do paciente', createdAt: '2025-01-01' },
  { id: '19', name: 'propostum_delete', description: 'Deletar proposta', createdAt: '2025-01-01' },
  { id: '20', name: 'simulacao_delete', description: 'Deletar simulação', createdAt: '2025-01-01' },
  { id: '21', name: 'log_api_access', description: 'Acesso aos logs de API', createdAt: '2025-01-01' },
  { id: '22', name: 'propostum_cancel', description: 'Cancelar proposta', createdAt: '2025-01-01' },
  { id: '23', name: 'simulacao_show', description: 'Visualizar simulação', createdAt: '2025-01-01' },
  { id: '24', name: 'simulacao_create', description: 'Criar simulação', createdAt: '2025-01-01' },
  { id: '25', name: 'simulacao_access', description: 'Acesso a simulações', createdAt: '2025-01-01' },
  { id: '26', name: 'paciente_show', description: 'Visualizar paciente', createdAt: '2025-01-01' },
  { id: '27', name: 'paciente_delete', description: 'Deletar paciente', createdAt: '2025-01-01' },
  { id: '28', name: 'paciente_edit', description: 'Editar paciente', createdAt: '2025-01-01' },
  { id: '29', name: 'paciente_create', description: 'Criar paciente', createdAt: '2025-01-01' },
  { id: '30', name: 'paciente_access', description: 'Acesso a pacientes', createdAt: '2025-01-01' },
];

const Permissoes = () => {
  const isMobile = useIsMobile();
  const [permissions, setPermissions] = useState<Permission[]>(mockPermissions);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });

  const columns: Column<Permission>[] = [
    {
      key: 'id',
      header: '#',
      render: (item) => <span className="text-muted-foreground">{item.id}</span>,
    },
    {
      key: 'name',
      header: 'Nome da Permissão',
      render: (item) => (
        <div className="flex items-center gap-2">
          <Key className="h-4 w-4 text-primary" />
          <Badge variant="outline" className="font-mono text-xs">
            {item.name}
          </Badge>
        </div>
      ),
    },
    {
      key: 'description',
      header: 'Descrição',
      render: (item) => (
        <span className="text-muted-foreground text-sm">
          {item.description || '—'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Criado em',
      render: (item) => (
        <span className="text-muted-foreground text-sm">{item.createdAt}</span>
      ),
    },
  ];

  const handleAdd = () => {
    setEditingPermission(null);
    setFormData({ name: '', description: '' });
    setIsModalOpen(true);
  };

  const handleEdit = (permission: Permission) => {
    setEditingPermission(permission);
    setFormData({ name: permission.name, description: permission.description || '' });
    setIsModalOpen(true);
  };

  const handleDelete = (permission: Permission) => {
    if (confirm(`Deseja realmente deletar a permissão "${permission.name}"?`)) {
      setPermissions((prev) => prev.filter((p) => p.id !== permission.id));
    }
  };

  const handleSave = () => {
    if (!formData.name.trim()) return;

    if (editingPermission) {
      setPermissions((prev) =>
        prev.map((p) =>
          p.id === editingPermission.id
            ? { ...p, name: formData.name, description: formData.description }
            : p
        )
      );
    } else {
      const newPermission: Permission = {
        id: (permissions.length + 1).toString(),
        name: formData.name,
        description: formData.description,
        createdAt: new Date().toLocaleDateString('pt-BR'),
      };
      setPermissions((prev) => [...prev, newPermission]);
    }

    setIsModalOpen(false);
    setFormData({ name: '', description: '' });
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
              Permissões
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Gerencie as permissões do sistema ({permissions.length} registros)
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
            Adicionar Permissão
          </Button>
        </motion.div>

        {/* Data Table */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <DataTable
            data={permissions}
            columns={columns}
            searchPlaceholder="Pesquisar permissão..."
            searchKeys={['name', 'description']}
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
                {editingPermission ? 'Editar Permissão' : 'Adicionar Permissão'}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                {editingPermission
                  ? 'Edite os dados da permissão'
                  : 'Preencha os dados para criar uma nova permissão'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nome da Permissão</Label>
                <Input
                  placeholder="ex: paciente_create"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="bg-background/50 font-mono"
                />
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  placeholder="Descrição da permissão..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className="bg-background/50 resize-none"
                  rows={3}
                />
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
                disabled={!formData.name.trim()}
              >
                {editingPermission ? 'Salvar' : 'Criar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Permissoes;
