import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, TrendingUp, Users, Download, ShieldCheck, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { COMMISSION_STATUS_LABELS, COMMISSION_STATUS_COLORS, formatCurrency, isAdminRole } from '@/lib/partner-rules';

/**
 * Tela administrativa de visualização de comissões.
 *
 * IMPORTANTE — RLS:
 * - A tabela `partner_commissions` só permite SELECT ao dono (partner) OU admin/master.
 * - Este componente NÃO adiciona filtros de segurança no client: confia na RLS.
 * - Consequência: mesmo se um partner acessar esta rota (via ProtectedRoute), verá
 *   somente as próprias comissões. Admin/master veem tudo.
 * - UPDATE (dar baixa) é restrito a admin/master pela policy `System can update commissions`.
 * - DELETE é intencionalmente ausente (compliance financeiro). Ver docs/RLS-CHECKLIST.md
 */
const PartnersComissoesAdmin = () => {
  const { toast } = useToast();
  const { role } = useAuth();
  const isAdmin = isAdminRole(role as any);

  const [partners, setPartners] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPartner, setFilterPartner] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    void fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    // Sem filtros artificiais no client — RLS decide o que retorna.
    const [pRes, cRes] = await Promise.all([
      supabase.from('partners').select('id, name, email, type').order('name'),
      supabase.from('partner_commissions').select('*').order('created_at', { ascending: false }).limit(500),
    ]);
    if (pRes.error) toast({ title: 'Erro ao carregar parceiros', description: pRes.error.message, variant: 'destructive' });
    if (cRes.error) toast({ title: 'Erro ao carregar comissões', description: cRes.error.message, variant: 'destructive' });
    setPartners(pRes.data || []);
    setCommissions(cRes.data || []);
    setLoading(false);
  };

  const getPartnerName = (id: string | null) => {
    if (!id) return '—';
    const p = partners.find((p: any) => p.id === id);
    return p?.name || p?.email?.split('@')[0] || id.slice(0, 8);
  };

  const filtered = commissions.filter((c: any) => {
    if (filterPartner !== 'all' && c.partner_id !== filterPartner) return false;
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;
    if (filterType !== 'all' && c.commission_type !== filterType) return false;
    return true;
  });

  const totalPago = filtered.filter((c: any) => c.status === 'PAID').reduce((s: number, c: any) => s + Number(c.commission_amount || 0), 0);
  const totalPendente = filtered.filter((c: any) => c.status !== 'PAID').reduce((s: number, c: any) => s + Number(c.commission_amount || 0), 0);

  const handleMarkPaid = async (id: string) => {
    const { error } = await supabase
      .from('partner_commissions')
      .update({ status: 'PAID', paid_at: new Date().toISOString() })
      .eq('id', id);
    if (error) {
      // Se cair aqui para um partner comum, é a RLS bloqueando (esperado).
      toast({ title: 'Sem permissão para dar baixa', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Comissão marcada como paga' });
    void fetchData();
  };

  const handleExport = () => {
    const rows = [
      ['Parceiro', 'Tipo', 'Mês Ref.', 'Base', 'Taxa', 'Comissão', 'Status', 'Criada em', 'Paga em'],
      ...filtered.map((c: any) => [
        getPartnerName(c.partner_id),
        c.commission_type,
        c.reference_month || '—',
        Number(c.net_paid_amount || 0).toFixed(2),
        Number(c.commission_rate || 0).toFixed(4),
        Number(c.commission_amount || 0).toFixed(2),
        c.status,
        c.created_at ? new Date(c.created_at).toLocaleDateString('pt-BR') : '—',
        c.paid_at ? new Date(c.paid_at).toLocaleDateString('pt-BR') : '—',
      ]),
    ];
    const csv = rows.map(r => r.map(x => `"${String(x).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `comissoes_partners_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'CSV exportado' });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-primary" /> Administração de Comissões
            </h1>
            <p className="text-sm text-muted-foreground">
              Visualização escopada por RLS. {isAdmin ? 'Você está vendo todas as comissões.' : 'Você vê apenas as suas.'}
            </p>
          </div>
          <Button onClick={handleExport} variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" /> Exportar CSV
          </Button>
        </div>

        <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
          <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div>
            Os totais e a lista abaixo refletem <strong>apenas o que o RLS permite ler</strong>. Baixa de pagamento e deleção são restritas por policy — parceiros comuns recebem erro se tentarem alterar.
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-green-500/10"><DollarSign className="h-5 w-5 text-green-500" /></div><div><p className="text-sm text-muted-foreground">Total Pago (filtro)</p><p className="text-2xl font-bold">R$ {formatCurrency(totalPago)}</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-yellow-500/10"><TrendingUp className="h-5 w-5 text-yellow-500" /></div><div><p className="text-sm text-muted-foreground">A Pagar (filtro)</p><p className="text-2xl font-bold">R$ {formatCurrency(totalPendente)}</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-primary/10"><Users className="h-5 w-5 text-primary" /></div><div><p className="text-sm text-muted-foreground">Lançamentos visíveis</p><p className="text-2xl font-bold">{commissions.length}</p></div></div></CardContent></Card>
        </div>

        <div className="flex flex-wrap gap-3">
          <Select value={filterPartner} onValueChange={setFilterPartner}>
            <SelectTrigger className="w-56"><SelectValue placeholder="Parceiro" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os parceiros</SelectItem>
              {partners.map((p: any) => (
                <SelectItem key={p.id} value={p.id}>{p.name || p.email?.split('@')[0] || p.id.slice(0, 8)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos status</SelectItem>
              {Object.entries(COMMISSION_STATUS_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Tipo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="DIRECT">Direta (1,6%)</SelectItem>
              <SelectItem value="NETWORK">Rede (0,2%)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Lançamentos</CardTitle>
                <CardDescription>Ordenado por data de criação (mais recente primeiro)</CardDescription>
              </div>
              <Badge variant="outline">{filtered.length} de {commissions.length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-10 text-sm text-muted-foreground">Carregando...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-10 text-sm text-muted-foreground">Nenhuma comissão para os filtros selecionados</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      {['Parceiro', 'Tipo', 'Mês Ref.', 'Base', 'Taxa', 'Comissão', 'Status', 'Criada em', ...(isAdmin ? ['Ação'] : [])].map(h => (
                        <th key={h} className="pb-3 pr-4 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((c: any) => (
                      <tr key={c.id} className="border-b hover:bg-accent/30">
                        <td className="py-3 pr-4">{getPartnerName(c.partner_id)}</td>
                        <td className="py-3 pr-4"><Badge variant="outline">{c.commission_type === 'DIRECT' ? 'Direta' : 'Rede'}</Badge></td>
                        <td className="py-3 pr-4">{c.reference_month || '—'}</td>
                        <td className="py-3 pr-4 tabular-nums">R$ {formatCurrency(Number(c.net_paid_amount || 0))}</td>
                        <td className="py-3 pr-4 tabular-nums">{(Number(c.commission_rate || 0) * 100).toFixed(2)}%</td>
                        <td className="py-3 pr-4 font-semibold text-green-600 tabular-nums">R$ {formatCurrency(Number(c.commission_amount || 0))}</td>
                        <td className="py-3 pr-4">
                          <Badge className={COMMISSION_STATUS_COLORS[c.status] || ''}>
                            {COMMISSION_STATUS_LABELS[c.status] || c.status}
                          </Badge>
                        </td>
                        <td className="py-3 pr-4 text-xs text-muted-foreground">
                          {c.created_at ? new Date(c.created_at).toLocaleDateString('pt-BR') : '—'}
                        </td>
                        {isAdmin && (
                          <td className="py-3 pr-4">
                            {c.status !== 'PAID' ? (
                              <Button size="sm" variant="outline" className="text-xs" onClick={() => handleMarkPaid(c.id)}>
                                Dar baixa
                              </Button>
                            ) : (
                              <span className="text-xs text-green-600">✓ Pago</span>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default PartnersComissoesAdmin;