import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Building2, Mail, Calendar, KeyRound, User as UserIcon, Shield, RefreshCw, CheckCircle2, XCircle, Loader2, AlertTriangle } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { DataTable, Column } from '@/components/usuarios/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { createClient } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { isAdminRole, type AppRole } from '@/lib/partner-rules';
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

const ROLE_TO_HIERARCHY: Record<string, string> = {
  master: 'Master do Sistema',
  admin: 'Master do Sistema',
  master_partner: 'Master da Clínica',
  partner: 'Representante',
  representante: 'Representante',
  cs_geral: 'CS',
  cs_exclusiva: 'CS',
  clinic_owner: 'Master da Clínica',
  attendant: 'Atendente',
  user: '',
};

const _unusedMockUsers: User[] = [
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
  {
    id: '11',
    name: 'Roberto Ribeiro',
    email: 'roberto.ribeiro@helpude.com.br',
    client: 'HELP UDE — BH/MG',
    status: 'ATIVO',
    hierarchy: 'Representante',
    createdAt: '15/01/2026 08:00:00',
  },
];

const hierarchyOptions = [
  'Master do Sistema',
  'Master da Clínica',
  'Gestor',
  'Supervisor',
  'CS',
  'SDR',
  'Representante',
  'Aprovador',
  'Atendente',
  'Médico',
];

const Lista = () => {
  const isMobile = useIsMobile();
  const { role } = useAuth();
  const canAdmin = isAdminRole(role as AppRole | null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [regenLoading, setRegenLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [loginCheck, setLoginCheck] = useState<{
    status: 'idle' | 'checking' | 'ok' | 'fail';
    message?: string;
  }>({ status: 'idle' });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    client: '',
    status: 'ATIVO' as User['status'],
    hierarchy: '',
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
      const { data: profiles, error: pErr } = await supabase
        .from('profiles')
        .select('user_id, email, created_at')
        .order('created_at', { ascending: false })
        .limit(500);
      if (pErr) {
        if (!cancelled) { setLoadError(pErr.message); setLoading(false); }
        return;
      }
      const ids = (profiles ?? []).map((p) => p.user_id);
      const { data: roles } = ids.length
        ? await supabase.from('user_roles').select('user_id, role').in('user_id', ids)
        : { data: [] as Array<{ user_id: string; role: string }> };
      const roleMap = new Map<string, string>();
      (roles ?? []).forEach((r) => roleMap.set(r.user_id, r.role));
      const mapped: User[] = (profiles ?? []).map((p) => {
        const roleKey = roleMap.get(p.user_id) ?? 'user';
        const email = p.email ?? '';
        return {
          id: p.user_id,
          name: email.split('@')[0] || email,
          email,
          client: '',
          status: 'ATIVO',
          hierarchy: ROLE_TO_HIERARCHY[roleKey] ?? roleKey,
          createdAt: p.created_at
            ? new Date(p.created_at).toLocaleString('pt-BR')
            : '',
        };
      });
      if (!cancelled) { setUsers(mapped); setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, []);

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
    setNewPassword('');
    setLoginCheck({ status: 'idle' });
    setIsModalOpen(true);
  };

  const handleView = (user: User) => {
    setViewingUser(user);
    setIsViewOpen(true);
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
    let pw = '';
    for (let i = 0; i < 12; i++) pw += chars[Math.floor(Math.random() * chars.length)];
    setNewPassword(pw);
  };

  const verifyLoginInBackground = async (email: string, password: string) => {
    setLoginCheck({ status: 'checking' });
    try {
      const url = import.meta.env.VITE_SUPABASE_URL as string;
      const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
      // Ephemeral client so we do NOT overwrite the admin's active session
      const memStorage = {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      };
      const probe = createClient(url, key, {
        auth: {
          storage: memStorage as any,
          persistSession: false,
          autoRefreshToken: false,
        },
      });
      const { data, error } = await probe.auth.signInWithPassword({ email, password });
      if (error || !data?.session) {
        setLoginCheck({
          status: 'fail',
          message: error?.message ?? 'Login não autorizado com a nova senha.',
        });
        return;
      }
      // Clean up the ephemeral session
      await probe.auth.signOut();
      setLoginCheck({ status: 'ok', message: 'Login validado com sucesso.' });
    } catch (e) {
      setLoginCheck({
        status: 'fail',
        message: (e as Error).message ?? 'Erro ao validar login.',
      });
    }
  };

  const handleRegeneratePassword = async () => {
    if (!editingUser) return;
    if (!newPassword || newPassword.length < 6) {
      toast.error('A nova senha precisa ter pelo menos 6 caracteres.');
      return;
    }
    // Guardrail: ensure the target email actually exists in our loaded list
    const exists = users.some(
      (u) => u.email.trim().toLowerCase() === editingUser.email.trim().toLowerCase()
    );
    if (!exists) {
      toast.error('E-mail não encontrado na base. Use a busca para selecionar um usuário válido.');
      return;
    }
    setRegenLoading(true);
    setLoginCheck({ status: 'idle' });
    const { data, error } = await supabase.functions.invoke('admin-user-actions', {
      body: { action: 'reset_password', email: editingUser.email, newPassword },
    });
    setRegenLoading(false);
    if (error || (data as any)?.error) {
      toast.error((data as any)?.error ?? error?.message ?? 'Falha ao regenerar senha');
      return;
    }
    toast.success(`Nova senha definida para ${editingUser.email}`);
    // Fire-and-forget background login validation
    const emailForCheck = editingUser.email;
    const passwordForCheck = newPassword;
    setNewPassword('');
    verifyLoginInBackground(emailForCheck, passwordForCheck);
  };

  const handleSendResetEmail = async () => {
    if (!editingUser) return;
    const { data, error } = await supabase.functions.invoke('admin-user-actions', {
      body: {
        action: 'send_reset_email',
        email: editingUser.email,
        redirectTo: `${window.location.origin}/reset-password`,
      },
    });
    if (error || (data as any)?.error) {
      toast.error((data as any)?.error ?? error?.message ?? 'Falha ao enviar e-mail');
      return;
    }
    toast.success('E-mail de recuperação enviado');
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
            ? { ...u, name: u.name, email: u.email, client: u.client, status: formData.status, hierarchy: formData.hierarchy }
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
              Gerencie os usuários do sistema ({loading ? '…' : users.length} registros)
            </p>
            {loadError && (
              <p className="text-xs text-destructive mt-1">Erro ao carregar usuários: {loadError}</p>
            )}
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
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </motion.div>

        {/* View Modal */}
        <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
          <DialogContent className={cn('glass-card border-border/50', isMobile && 'w-[calc(100%-2rem)] max-w-lg mx-auto')}>
            <DialogHeader>
              <DialogTitle className="text-foreground flex items-center gap-2">
                <UserIcon className="h-5 w-5 text-primary" />
                Detalhes do Usuário
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Informações completas do registro.
              </DialogDescription>
            </DialogHeader>
            {viewingUser && (
              <div className="space-y-4 py-2">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white font-semibold">
                      {getInitials(viewingUser.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{viewingUser.name}</p>
                    <p className="text-sm text-muted-foreground">{viewingUser.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Cliente / Clínica</p>
                    <p className="font-medium">{viewingUser.client || '—'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Hierarquia</p>
                    <p className="font-medium">{viewingUser.hierarchy || '—'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Status</p>
                    <Badge className={cn(viewingUser.status === 'ATIVO'
                      ? 'bg-success/20 text-success border-success/30'
                      : 'bg-destructive/20 text-destructive border-destructive/30')}>
                      {viewingUser.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Criado em</p>
                    <p className="font-medium">{viewingUser.createdAt}</p>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsViewOpen(false)}>Fechar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
                    disabled={!!editingUser}
                    readOnly={!!editingUser}
                    className="bg-background/50 disabled:opacity-70 disabled:cursor-not-allowed"
                  />
                  {editingUser && (
                    <p className="text-[11px] text-muted-foreground">O nome não pode ser editado.</p>
                  )}
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
                    disabled={!!editingUser}
                    readOnly={!!editingUser}
                    className="bg-background/50 disabled:opacity-70 disabled:cursor-not-allowed"
                  />
                  {editingUser && (
                    <p className="text-[11px] text-muted-foreground">O e-mail não pode ser alterado.</p>
                  )}
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
                  disabled={!!editingUser}
                  readOnly={!!editingUser}
                  className="bg-background/50 disabled:opacity-70 disabled:cursor-not-allowed"
                />
                {editingUser && (
                  <p className="text-[11px] text-muted-foreground">Cliente/Clínica não pode ser editado.</p>
                )}
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

              {editingUser && canAdmin && (
                <div className="space-y-3 border-t border-border/50 pt-4">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    <p className="text-sm font-semibold">Regenerar senha</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      type="text"
                      placeholder="Nova senha (mín. 6 caracteres)"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="bg-background/50 flex-1"
                    />
                    <Button type="button" variant="outline" onClick={generateRandomPassword} className="gap-2">
                      <RefreshCw className="h-4 w-4" /> Gerar
                    </Button>
                    <Button
                      type="button"
                      onClick={handleRegeneratePassword}
                      disabled={regenLoading || newPassword.length < 6}
                      className="gap-2"
                    >
                      <KeyRound className="h-4 w-4" />
                      {regenLoading ? 'Salvando...' : 'Aplicar'}
                    </Button>
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={handleSendResetEmail} className="gap-2">
                    <Mail className="h-4 w-4" /> Enviar link de recuperação por e-mail
                  </Button>
                </div>
              )}
            </div>

            <DialogFooter className={cn(isMobile && 'flex-col gap-2')}>
              <Button
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className={cn(isMobile && 'w-full order-2')}
              >
                {editingUser ? 'Fechar' : 'Cancelar'}
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
