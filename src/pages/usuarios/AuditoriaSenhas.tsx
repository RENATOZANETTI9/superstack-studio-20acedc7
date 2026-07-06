import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  KeyRound, RefreshCw, ShieldAlert, CheckCircle2, XCircle, ShieldOff, Repeat,
  ArrowUp, ArrowDown, ChevronLeft, ChevronRight, Eye, Copy, Check,
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
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
  user_agent?: string | null;
  created_at: string;
};

const ACTION_LABELS: Record<string, string> = {
  send_reset_email: 'Envio de link',
  reset_password: 'Redefinição direta',
  self_request: 'Solicitação do usuário',
};

type StatusFilter = 'all' | 'success' | 'error' | 'rate_limit' | 'token_reused';
type ActionFilter = 'all' | 'send_reset_email' | 'reset_password' | 'self_request';
type SortKey = 'created_at' | 'action';
type SortDir = 'asc' | 'desc';

const PAGE_SIZE = 20;

const isRateLimit = (r: AuditRow) =>
  !r.success && (r.error_message ?? '').toLowerCase().startsWith('rate_limited');
const isTokenReused = (r: AuditRow) =>
  !r.success && (r.error_message ?? '').toLowerCase().includes('já utilizado');

/** Remove qualquer resquício de token/JWT/e-mail antes de exibir a mensagem crua. */
const sanitizeErrorMessage = (raw: string | null | undefined): string => {
  if (!raw) return '';
  let msg = raw;
  // JWTs (3 partes base64url separadas por ponto)
  msg = msg.replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '[token]');
  // e-mails
  msg = msg.replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, '[email]');
  // hashes longos
  msg = msg.replace(/\b[a-f0-9]{32,}\b/gi, '[hash]');
  return msg;
};

const AuditoriaSenhas = () => {
  const { role } = useAuth();
  const isAdmin = isAdminRole(role as AppRole | null);

  const [searchParams, setSearchParams] = useSearchParams();

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const copyToClipboard = async (value: string, key: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const ta = document.createElement('textarea');
        ta.value = value;
        ta.setAttribute('readonly', '');
        ta.style.position = 'absolute';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 1600);
    } catch {
      setCopiedKey(null);
    }
  };

  // Estado sincronizado com a URL (fonte de verdade: searchParams)
  const filter = searchParams.get('q') ?? '';
  const actionFilter = (searchParams.get('action') as ActionFilter) || 'all';
  const statusFilter = (searchParams.get('status') as StatusFilter) || 'all';
  const sortKey = (searchParams.get('sort') as SortKey) || 'created_at';
  const sortDir = (searchParams.get('dir') as SortDir) || 'desc';
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);
  const selectedId = searchParams.get('event');

  const updateParams = (patch: Record<string, string | null>, opts?: { replace?: boolean }) => {
    const next = new URLSearchParams(searchParams);
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === '' || v === 'all') next.delete(k);
      else next.set(k, v);
    }
    setSearchParams(next, { replace: opts?.replace ?? false });
  };

  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(false);

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

  const filtered = useMemo(() => rows.filter((r) => {
    const q = filter.trim().toLowerCase();
    if (q) {
      const matches =
        r.target_email.toLowerCase().includes(q) ||
        (r.actor_email ?? '').toLowerCase().includes(q);
      if (!matches) return false;
    }
    if (actionFilter !== 'all' && r.action !== actionFilter) return false;
    if (statusFilter === 'success' && !r.success) return false;
    if (statusFilter === 'error' && (r.success || isRateLimit(r) || isTokenReused(r))) return false;
    if (statusFilter === 'rate_limit' && !isRateLimit(r)) return false;
    if (statusFilter === 'token_reused' && !isTokenReused(r)) return false;
    return true;
  }), [rows, filter, actionFilter, statusFilter]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'created_at') {
        cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else {
        cmp = (ACTION_LABELS[a.action] ?? a.action).localeCompare(ACTION_LABELS[b.action] ?? b.action, 'pt-BR');
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      updateParams({ sort: key, dir: sortDir === 'asc' ? 'desc' : 'asc', page: null });
    } else {
      updateParams({ sort: key, dir: 'desc', page: null });
    }
  };

  const SortIcon = ({ active }: { active: boolean }) =>
    active ? (sortDir === 'asc' ? <ArrowUp className="w-3 h-3 inline ml-1" /> : <ArrowDown className="w-3 h-3 inline ml-1" />) : null;

  const selectedRow = selectedId ? rows.find((r) => r.id === selectedId) ?? null : null;

  const counts = {
    total: rows.length,
    success: rows.filter((r) => r.success).length,
    rate_limit: rows.filter(isRateLimit).length,
    token_reused: rows.filter(isTokenReused).length,
    error: rows.filter((r) => !r.success && !isRateLimit(r) && !isTokenReused(r)).length,
  };

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
            <CardDescription>
              Filtre por e-mail, ação ou status. Inclui bloqueios por rate limit (429) e tokens reutilizados.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
              <div className="rounded-md border p-2"><span className="text-muted-foreground">Total</span><div className="text-lg font-semibold">{counts.total}</div></div>
              <div className="rounded-md border p-2"><span className="text-success">Sucesso</span><div className="text-lg font-semibold">{counts.success}</div></div>
              <div className="rounded-md border p-2"><span className="text-warning">Rate limit</span><div className="text-lg font-semibold">{counts.rate_limit}</div></div>
              <div className="rounded-md border p-2"><span className="text-warning">Token reusado</span><div className="text-lg font-semibold">{counts.token_reused}</div></div>
              <div className="rounded-md border p-2"><span className="text-destructive">Erro</span><div className="text-lg font-semibold">{counts.error}</div></div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                placeholder="Filtrar por e-mail..."
                value={filter}
                onChange={(e) => updateParams({ q: e.target.value || null, page: null }, { replace: true })}
                className="max-w-xs"
                data-testid="filter-input"
              />
              <Select value={actionFilter} onValueChange={(v) => updateParams({ action: v, page: null })}>
                <SelectTrigger className="w-[200px]" data-testid="action-filter"><SelectValue placeholder="Ação" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as ações</SelectItem>
                  <SelectItem value="self_request">Solicitação do usuário</SelectItem>
                  <SelectItem value="send_reset_email">Envio de link (admin)</SelectItem>
                  <SelectItem value="reset_password">Redefinição de senha</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(v) => updateParams({ status: v, page: null })}>
                <SelectTrigger className="w-[200px]" data-testid="status-filter"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="success">Sucesso</SelectItem>
                  <SelectItem value="error">Erro</SelectItem>
                  <SelectItem value="rate_limit">Bloqueio por rate limit</SelectItem>
                  <SelectItem value="token_reused">Token reutilizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-md border overflow-x-auto">
              <Table data-testid="audit-table">
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <button
                        type="button"
                        onClick={() => toggleSort('created_at')}
                        className="inline-flex items-center hover:text-foreground"
                        data-testid="sort-created-at"
                      >
                        Data/Hora <SortIcon active={sortKey === 'created_at'} />
                      </button>
                    </TableHead>
                    <TableHead>Solicitante</TableHead>
                    <TableHead>Alvo</TableHead>
                    <TableHead>
                      <button
                        type="button"
                        onClick={() => toggleSort('action')}
                        className="inline-flex items-center hover:text-foreground"
                        data-testid="sort-action"
                      >
                        Ação <SortIcon active={sortKey === 'action'} />
                      </button>
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-6" data-testid="empty-row">
                        {loading ? 'Carregando...' : 'Nenhum evento encontrado.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    pageRows.map((r) => (
                      <TableRow key={r.id} data-testid="audit-row" data-action={r.action}>
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
                          ) : isRateLimit(r) ? (
                            <span className="inline-flex items-center gap-1 text-warning text-xs" title={sanitizeErrorMessage(r.error_message)} data-testid="badge-rate-limit">
                              <ShieldOff className="w-4 h-4" /> Rate limit (429)
                            </span>
                          ) : isTokenReused(r) ? (
                            <span className="inline-flex items-center gap-1 text-warning text-xs" title={sanitizeErrorMessage(r.error_message)} data-testid="badge-token-reused">
                              <Repeat className="w-4 h-4" /> Token reutilizado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-destructive text-xs" title={sanitizeErrorMessage(r.error_message)}>
                              <XCircle className="w-4 h-4" /> Erro
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{r.ip_address ?? '—'}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => updateParams({ event: r.id })}
                            aria-label="Ver detalhes"
                            data-testid="view-details"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span data-testid="pagination-info">
                {sorted.length === 0
                  ? '0 eventos'
                  : `Mostrando ${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(currentPage * PAGE_SIZE, sorted.length)} de ${sorted.length}`}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => updateParams({ page: String(currentPage - 1) })}
                  data-testid="page-prev"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span data-testid="page-indicator">Página {currentPage} de {totalPages}</span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => updateParams({ page: String(currentPage + 1) })}
                  data-testid="page-next"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Sheet open={!!selectedRow} onOpenChange={(open) => { if (!open) updateParams({ event: null }); }}>
          <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto" data-testid="event-detail-sheet">
            {selectedRow && (
              <>
                <SheetHeader>
                  <SheetTitle>Detalhes do evento</SheetTitle>
                  <SheetDescription>
                    Informações sanitizadas — tokens, e-mails secundários e hashes são mascarados.
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-4 text-sm">
                  <div>
                    <div className="text-xs text-muted-foreground">Trace ID</div>
                    <div className="flex items-center gap-2">
                      <div className="font-mono text-xs break-all flex-1" data-testid="detail-trace-id">{selectedRow.id}</div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(selectedRow.id, `trace-${selectedRow.id}`)}
                        aria-label="Copiar Trace ID"
                        data-testid="copy-trace-id"
                        aria-live="polite"
                      >
                        {copiedKey === `trace-${selectedRow.id}` ? (
                          <><Check className="w-3.5 h-3.5 mr-1 text-success" /> Copiado</>
                        ) : (
                          <><Copy className="w-3.5 h-3.5 mr-1" /> Copiar</>
                        )}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Data/Hora</div>
                    <div>{new Date(selectedRow.created_at).toLocaleString('pt-BR')}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-muted-foreground">Ação</div>
                      <Badge variant="secondary">{ACTION_LABELS[selectedRow.action] ?? selectedRow.action}</Badge>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Status</div>
                      <div>
                        {selectedRow.success ? 'Sucesso'
                          : isRateLimit(selectedRow) ? 'Rate limit (429)'
                          : isTokenReused(selectedRow) ? 'Token reutilizado'
                          : 'Erro'}
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Solicitante</div>
                    <div>{selectedRow.actor_email ?? '—'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">E-mail alvo</div>
                    <div className="font-medium">{selectedRow.target_email}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">IP</div>
                    <div className="flex items-center gap-2">
                      <div className="font-mono text-xs flex-1" data-testid="detail-ip">{selectedRow.ip_address ?? '—'}</div>
                      {selectedRow.ip_address && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(selectedRow.ip_address!, `ip-${selectedRow.id}`)}
                          aria-label="Copiar IP"
                          data-testid="copy-ip"
                          aria-live="polite"
                        >
                          {copiedKey === `ip-${selectedRow.id}` ? (
                            <><Check className="w-3.5 h-3.5 mr-1 text-success" /> Copiado</>
                          ) : (
                            <><Copy className="w-3.5 h-3.5 mr-1" /> Copiar</>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                  {selectedRow.user_agent && (
                    <div>
                      <div className="text-xs text-muted-foreground">User agent</div>
                      <div className="font-mono text-xs break-all">{selectedRow.user_agent}</div>
                    </div>
                  )}
                  <div>
                    <div className="text-xs text-muted-foreground">Mensagem (sanitizada)</div>
                    <pre
                      className="mt-1 p-2 rounded-md bg-muted text-xs whitespace-pre-wrap break-all"
                      data-testid="detail-error-message"
                    >
                      {sanitizeErrorMessage(selectedRow.error_message) || '—'}
                    </pre>
                  </div>
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </DashboardLayout>
  );
};

export default AuditoriaSenhas;