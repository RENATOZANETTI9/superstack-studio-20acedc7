import { useState } from 'react';
import { Search, Shield, KeyRound, Mail, CheckCircle2, ArrowRight } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { isAdminRole, type AppRole } from '@/lib/partner-rules';
import { getAllowedMenuKeys, type MenuKey } from '@/lib/permissions-matrix';

const MENU_LABELS: Record<MenuKey, string> = {
  dashboard: 'Dashboard',
  buscar_credito: 'Buscar Crédito',
  creditos_aprovados: 'Créditos Aprovados',
  usuarios: 'Gestão de Usuários',
  representantes_painel: 'Representantes • Painel',
  representantes_rota: 'Representantes • Minha Rota',
  representantes_perfil: 'Representantes • Meu Perfil',
  representantes_cadastro: 'Representantes • Cadastro',
  representantes_clinicas: 'Representantes • Clínicas',
  representantes_bonificacoes: 'Representantes • Bonificações',
  representantes_simulador: 'Representantes • Simulador',
  representantes_marketing: 'Representantes • Marketing',
  representantes_simulacoes: 'Representantes • Simulações',
  representantes_config: 'Representantes • Configurações',
  representantes_monitoramento: 'Representantes • Monitoramento',
  clinicas_admin: 'Clínicas (Admin)',
  auditoria_permissoes: 'Auditoria de Permissões',
};

const ROLE_LABELS: Record<string, string> = {
  master: 'Master do Sistema',
  admin: 'Administrador',
  user: 'Usuário',
  master_partner: 'Master Partner',
  partner: 'Partner / Representante',
  representante: 'Representante',
  cs_geral: 'CS Geral',
  cs_exclusiva: 'CS Exclusiva',
  clinic_owner: 'Dono de Clínica',
  attendant: 'Atendente',
};

const MeuAcesso = () => {
  const { user, role } = useAuth();
  const currentRole = role as AppRole | null;
  const isAdmin = isAdminRole(currentRole);

  const [query, setQuery] = useState(user?.email ?? '');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookup, setLookup] = useState<{ found: boolean; email?: string; role?: string } | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const runLookup = async (email: string) => {
    setLookupError(null);
    setLookup(null);
    if (!email.trim()) { setLookupError('Informe um e-mail.'); return; }
    setLookupLoading(true);
    const { data, error } = await supabase.functions.invoke('admin-user-actions', {
      body: { action: 'lookup_role', email: email.trim().toLowerCase() },
    });
    setLookupLoading(false);
    if (error || data?.error) {
      setLookupError(data?.error ?? error?.message ?? 'Falha na consulta');
      return;
    }
    setLookup(data);
  };

  const resolvedRole = lookup?.role as AppRole | undefined;
  const showMenus = lookup?.found ? getAllowedMenuKeys(resolvedRole ?? null) : [];

  const handleAdminReset = async () => {
    if (!lookup?.found || !lookup.email) return;
    if (newPassword.length < 6) { toast.error('A senha precisa ter pelo menos 6 caracteres.'); return; }
    setResetLoading(true);
    const { data, error } = await supabase.functions.invoke('admin-user-actions', {
      body: { action: 'reset_password', email: lookup.email, newPassword },
    });
    setResetLoading(false);
    if (error || data?.error) {
      toast.error(data?.error ?? error?.message ?? 'Falha ao redefinir senha');
      return;
    }
    toast.success(`Senha atualizada para ${lookup.email}`);
    setNewPassword('');
  };

  const handleSendResetEmail = async () => {
    if (!lookup?.email) return;
    const { data, error } = await supabase.functions.invoke('admin-user-actions', {
      body: {
        action: 'send_reset_email',
        email: lookup.email,
        redirectTo: `${window.location.origin}/reset-password`,
      },
    });
    if (error || data?.error) {
      toast.error(data?.error ?? error?.message ?? 'Falha ao enviar e-mail');
      return;
    }
    toast.success('E-mail de recuperação enviado');
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" /> Meu Acesso
          </h1>
          <p className="text-muted-foreground text-sm">
            Consulte seu perfil, veja onde você pode navegar e gerencie o acesso da sua conta.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Search className="w-5 h-5" /> Buscar perfil por e-mail
            </CardTitle>
            <CardDescription>
              {isAdmin
                ? 'Como admin, você pode consultar qualquer e-mail cadastrado.'
                : 'Você só pode consultar o e-mail associado à sua conta.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={(e) => { e.preventDefault(); runLookup(query); }} className="flex gap-2">
              <Input
                type="email"
                placeholder="usuario@exemplo.com"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <Button type="submit" disabled={lookupLoading}>
                {lookupLoading ? 'Consultando...' : 'Consultar'}
              </Button>
            </form>
            {lookupError && <p className="text-sm text-destructive">{lookupError}</p>}

            {lookup && !lookup.found && (
              <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                Nenhum usuário encontrado com esse e-mail.
              </div>
            )}

            {lookup?.found && (
              <div className="rounded-lg border p-4 space-y-3 bg-muted/30">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{lookup.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Perfil (role):</span>
                  <Badge variant="secondary" className="text-sm">
                    {ROLE_LABELS[lookup.role ?? 'user'] ?? lookup.role}
                  </Badge>
                  <span className="text-xs text-muted-foreground">({lookup.role})</span>
                </div>

                <Separator />
                <div>
                  <p className="text-sm font-medium mb-2">Menus/áreas acessíveis:</p>
                  {showMenus.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum menu liberado para este perfil.</p>
                  ) : (
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                      {showMenus.map((k) => (
                        <li key={k} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                          <span>{MENU_LABELS[k]}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {isAdmin && lookup?.found && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <KeyRound className="w-5 h-5" /> Ações de administrador
              </CardTitle>
              <CardDescription>
                Redefina a senha diretamente ou envie um e-mail de recuperação para{' '}
                <strong>{lookup.email}</strong>.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newpw">Nova senha (mínimo 6 caracteres)</Label>
                <div className="flex gap-2">
                  <Input
                    id="newpw"
                    type="text"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Nova senha"
                  />
                  <Button onClick={handleAdminReset} disabled={resetLoading || newPassword.length < 6}>
                    {resetLoading ? 'Salvando...' : 'Redefinir'}
                  </Button>
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">Enviar e-mail de recuperação</p>
                  <p className="text-xs text-muted-foreground">
                    O usuário receberá um link seguro para escolher a nova senha.
                  </p>
                </div>
                <Button variant="outline" onClick={handleSendResetEmail}>
                  Enviar link <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MeuAcesso;