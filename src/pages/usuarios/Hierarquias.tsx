import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Shield, X } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface Hierarchy {
  id: string;
  title: string;
  description?: string;
  permissions: string[];
  createdAt: string;
}

const availablePermissions = [
  'user_management_access', 'user_edit', 'user_show', 'user_delete', 'user_access', 'user_create',
  'clinica_edit', 'clinica_show', 'clinica_delete', 'clinica_access', 'clinica_create',
  'propostum_access', 'propostum_show', 'propostum_approve', 'propostum_cancel', 'propostum_delete',
  'simulacao_access', 'simulacao_create', 'simulacao_show', 'simulacao_delete',
  'paciente_access', 'paciente_create', 'paciente_edit', 'paciente_show', 'paciente_delete', 'paciente_sensitive_edit',
  'audit_log_access', 'audit_log_show',
  'user_alert_access', 'user_alert_create', 'user_alert_edit', 'user_alert_delete',
  'dashboard_access', 'onboarding_dashboard_access',
  'clinica_filial_create', 'clinica_sensitive_edit', 'clinica_edit_endereco',
  'user_create_atendente', 'user_create_aprovador', 'user_create_medico',
  'permission_access', 'permission_create', 'permission_edit', 'permission_delete',
  'role_access', 'role_create', 'role_edit', 'role_delete',
];

const mockHierarchies: Hierarchy[] = [
  {
    id: '1',
    title: 'Master do Sistema',
    description: 'Acesso irrestrito a todas as funcionalidades',
    permissions: availablePermissions,
    createdAt: '2025-01-01',
  },
  {
    id: '2',
    title: 'Master da Clínica',
    description: 'Acesso administrativo da clínica',
    permissions: ['user_management_access', 'user_edit', 'user_show', 'user_delete', 'clinica_edit', 'clinica_show', 'propostum_access', 'propostum_show', 'propostum_approve', 'simulacao_access', 'simulacao_create', 'paciente_access', 'paciente_create', 'paciente_edit', 'audit_log_access', 'dashboard_access', 'clinica_filial_create', 'user_create_atendente', 'user_create_aprovador', 'user_create_medico'],
    createdAt: '2025-01-01',
  },
  {
    id: '3',
    title: 'Gestor',
    description: 'Acesso gerencial com permissões de CRUD',
    permissions: ['user_management_access', 'user_edit', 'user_show', 'user_access', 'clinica_edit', 'clinica_access', 'propostum_access', 'propostum_show', 'simulacao_access', 'paciente_access', 'paciente_edit', 'audit_log_access', 'dashboard_access', 'permission_access', 'role_access'],
    createdAt: '2025-01-01',
  },
  {
    id: '4',
    title: 'Supervisor',
    description: 'Acesso supervisório com permissões limitadas',
    permissions: ['user_management_access', 'user_access', 'clinica_access', 'propostum_access', 'propostum_show', 'simulacao_access', 'simulacao_create', 'paciente_access', 'paciente_edit', 'audit_log_access', 'dashboard_access', 'user_create_atendente', 'user_create_aprovador'],
    createdAt: '2025-01-01',
  },
  {
    id: '5',
    title: 'CS',
    description: 'Acesso para Customer Success',
    permissions: ['user_management_access', 'user_access', 'clinica_edit', 'clinica_access', 'propostum_access', 'propostum_show', 'simulacao_access', 'simulacao_create', 'paciente_access', 'paciente_create', 'paciente_edit', 'audit_log_access', 'dashboard_access', 'clinica_filial_create', 'user_create_atendente', 'clinica_edit_endereco'],
    createdAt: '2025-01-01',
  },
  {
    id: '6',
    title: 'SDR',
    description: 'Acesso para prospecção de vendas',
    permissions: ['user_management_access', 'user_access', 'propostum_access', 'propostum_show', 'simulacao_access', 'dashboard_access', 'onboarding_dashboard_access'],
    createdAt: '2025-01-01',
  },
  {
    id: '7',
    title: 'Aprovador',
    description: 'Permissão para aprovar propostas',
    permissions: ['user_management_access', 'clinica_access', 'propostum_access', 'propostum_show', 'propostum_approve', 'propostum_cancel', 'simulacao_access', 'simulacao_create', 'simulacao_show', 'paciente_access', 'paciente_edit', 'audit_log_access', 'user_alert_access', 'clinica_filial_create', 'user_create_atendente'],
    createdAt: '2025-01-01',
  },
  {
    id: '8',
    title: 'Atendente',
    description: 'Acesso básico para atendimento',
    permissions: ['clinica_access', 'propostum_access', 'simulacao_access', 'simulacao_create', 'simulacao_show', 'dashboard_access'],
    createdAt: '2025-01-01',
  },
  {
    id: '9',
    title: 'Médico',
    description: 'Acesso restrito para médicos',
    permissions: ['user_alert_access'],
    createdAt: '2025-01-01',
  },
];

const hierarchyColors: Record<string, string> = {
  'Master do Sistema': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'Master da Clínica': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'Gestor': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  'Supervisor': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  'CS': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  'SDR': 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  'Aprovador': 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  'Atendente': 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  'Médico': 'bg-rose-500/20 text-rose-400 border-rose-500/30',
};

const Hierarquias = () => {
  const isMobile = useIsMobile();
  const [hierarchies, setHierarchies] = useState<Hierarchy[]>(mockHierarchies);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHierarchy, setEditingHierarchy] = useState<Hierarchy | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    permissions: [] as string[],
  });

  const columns: Column<Hierarchy>[] = [
    {
      key: 'id',
      header: 'ID',
      render: (item) => <span className="text-muted-foreground">{item.id}</span>,
    },
    {
      key: 'title',
      header: 'Título',
      render: (item) => (
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          <Badge
            variant="outline"
            className={cn('font-medium', hierarchyColors[item.title] || 'bg-muted')}
          >
            {item.title}
          </Badge>
        </div>
      ),
    },
    {
      key: 'permissions',
      header: 'Permissões',
      render: (item) => (
        <div className="flex flex-wrap gap-1 max-w-md">
          {item.permissions.slice(0, 3).map((p) => (
            <Badge key={p} variant="secondary" className="text-[10px] font-mono">
              {p}
            </Badge>
          ))}
          {item.permissions.length > 3 && (
            <Badge variant="outline" className="text-[10px]">
              +{item.permissions.length - 3} mais
            </Badge>
          )}
        </div>
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
    setEditingHierarchy(null);
    setFormData({ title: '', description: '', permissions: [] });
    setIsModalOpen(true);
  };

  const handleEdit = (hierarchy: Hierarchy) => {
    setEditingHierarchy(hierarchy);
    setFormData({
      title: hierarchy.title,
      description: hierarchy.description || '',
      permissions: hierarchy.permissions,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (hierarchy: Hierarchy) => {
    if (confirm(`Deseja realmente deletar a hierarquia "${hierarchy.title}"?`)) {
      setHierarchies((prev) => prev.filter((h) => h.id !== hierarchy.id));
    }
  };

  const togglePermission = (permission: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter((p) => p !== permission)
        : [...prev.permissions, permission],
    }));
  };

  const handleSave = () => {
    if (!formData.title.trim()) return;

    if (editingHierarchy) {
      setHierarchies((prev) =>
        prev.map((h) =>
          h.id === editingHierarchy.id
            ? { ...h, ...formData }
            : h
        )
      );
    } else {
      const newHierarchy: Hierarchy = {
        id: (hierarchies.length + 1).toString(),
        ...formData,
        createdAt: new Date().toLocaleDateString('pt-BR'),
      };
      setHierarchies((prev) => [...prev, newHierarchy]);
    }

    setIsModalOpen(false);
    setFormData({ title: '', description: '', permissions: [] });
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
              Hierarquias
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Gerencie as hierarquias e roles do sistema ({hierarchies.length} registros)
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
            Adicionar Hierarquia
          </Button>
        </motion.div>

        {/* Data Table */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <DataTable
            data={hierarchies}
            columns={columns}
            searchPlaceholder="Pesquisar hierarquia..."
            searchKeys={['title', 'description']}
            onView={(item) => console.log('View', item)}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </motion.div>

        {/* Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent
            className={cn(
              'glass-card border-border/50 max-w-2xl',
              isMobile && 'w-[calc(100%-2rem)] mx-auto'
            )}
          >
            <DialogHeader>
              <DialogTitle className="text-foreground">
                {editingHierarchy ? 'Editar Hierarquia' : 'Adicionar Hierarquia'}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                {editingHierarchy
                  ? 'Edite os dados e permissões da hierarquia'
                  : 'Crie uma nova hierarquia com as permissões desejadas'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Título</Label>
                  <Input
                    placeholder="ex: Supervisor"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, title: e.target.value }))
                    }
                    className="bg-background/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Input
                    placeholder="Descrição breve..."
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, description: e.target.value }))
                    }
                    className="bg-background/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Permissões ({formData.permissions.length} selecionadas)</Label>
                  {formData.permissions.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setFormData((prev) => ({ ...prev, permissions: [] }))}
                      className="text-xs text-muted-foreground h-auto py-1"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Limpar
                    </Button>
                  )}
                </div>
                <ScrollArea className="h-48 rounded-md border border-border/50 bg-background/30 p-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {availablePermissions.map((permission) => (
                      <label
                        key={permission}
                        className="flex items-center gap-2 cursor-pointer hover:bg-muted/30 p-1.5 rounded"
                      >
                        <Checkbox
                          checked={formData.permissions.includes(permission)}
                          onCheckedChange={() => togglePermission(permission)}
                        />
                        <span className="text-xs font-mono text-foreground/80">
                          {permission}
                        </span>
                      </label>
                    ))}
                  </div>
                </ScrollArea>
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
                disabled={!formData.title.trim()}
              >
                {editingHierarchy ? 'Salvar' : 'Criar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Hierarquias;
