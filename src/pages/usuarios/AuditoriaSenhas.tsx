import { useEffect, useState } from 'react';
import { KeyRound, RefreshCw, ShieldAlert, CheckCircle2, XCircle } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { isAdminRole, type AppRole } from '@/lib/partner-rules';

type AuditRow = {
  id: string;
  actor_email: string | null;
  target_email: string;
  action: 'send_reset_email' | 'reset_password' | 'self_request';
  success: boolean;
  error_message: string | null;
  ip_address: string | null;
  created_at: string;
};

const ACTION_LABELS: Record<string, string> = {
  send_reset_email: 'Envio de link',
  reset_password: 'Redefinição direta',
  self_request: 'Solicitação do usuário',
};

const AuditoriaSenhas = () => {
  const { role } = useAuth();
  const isAdmin = isAdminRole(role as AppRole | null);

  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('');

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('password_reset_audit')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    setLoading(false);
    if (!error && data) setRows(data as AuditRow[]);
  };

  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="max-w-3xl mx-auto p-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-destructive" /> Acesso restrito
              </CardTitle>
              <CardDescription>Apenas administradores podem visualizar a auditoria de redefinições de senha.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const filtered = rows.filter((r) => {
    const q = filter.trim().toLowerCase();
    if (!q) return true;
    return (
      r.target_email.toLowerCase().includes(q) ||
      (r.actor_email ?? '').toLowerCase().includes(q)
    );
  });

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <KeyRound className="w-6 h-6 text-primary" /> Auditoria de senhas
            </h1>
            <p className="text-muted-foreground text-sm">
              Registro completo de solicitações e redefinições de senha (últimos 200 eventos).
            </p>
          </div>
          <Button variant="outline" onClick={load} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Eventos</CardTitle>
            <CardDescription>Filtre por e-mail do solicitante ou do alvo.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Filtrar por e-mail..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="max-w-md"
            />
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Solicitante</TableHead>
                    <TableHead>Alvo</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>IP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                        {loading ? 'Carregando...' : 'Nenhum evento encontrado.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="text-xs whitespace-nowrap">
                          {new Date(r.created_at).toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell className="text-sm">{r.actor_email ?? '—'}</TableCell>
                        <TableCell className="text-sm font-medium">{r.target_email}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{ACTION_LABELS[r.action] ?? r.action}</Badge>
                        </TableCell>
                        <TableCell>
                          {r.success ? (
                            <span className="inline-flex items-center gap-1 text-success text-xs">
                              <CheckCircle2 className="w-4 h-4" /> Sucesso
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-destructive text-xs" title={r.error_message ?? ''}>
                              <XCircle className="w-4 h-4" /> Erro
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{r.ip_address ?? '—'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AuditoriaSenhas;