import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, TrendingUp, Users, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { MOCK_PARTNERS, MOCK_COMMISSIONS, withMockFallback } from '@/lib/mock-data';
import { useToast } from '@/hooks/use-toast';
import { useRepresentanteGuard } from '@/hooks/useRepresentanteGuard';

const RepresentantesComissoes = () => {
  const navigate = useNavigate();
  useRepresentanteGuard('admin');

  const { toast } = useToast();
  const [partners, setPartners] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPartner, setFilterPartner] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const [pRes, cRes] = await Promise.all([
      supabase.from('partners').select('*').order('created_at', { ascending: false }),
      supabase.from('partner_commissions').select('*').order('created_at', { ascending: false }).limit(100),
    ]);
    setPartners(withMockFallback(pRes.data, MOCK_PARTNERS));
    setCommissions(withMockFallback(cRes.data, MOCK_COMMISSIONS));
    setLoading(false);
  };

  const filtered = commissions.filter((c: any) => {
    if (filterPartner !== 'all' && c.partner_id !== filterPartner) return false;
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;
    return true;
  });

  const totalPago = commissions.filter((c: any) => c.status === 'PAID').reduce((s: number, c: any) => s + Number(c.commission_amount || 0), 0);
  const totalPendente = commissions.filter((c: any) => c.status !== 'PAID').reduce((s: number, c: any) => s + Number(c.commission_amount || 0), 0);

  const getPartnerName = (id: string) => {
    const p = partners.find((p: any) => p.id === id);
    return p?.name || p?.email?.split('@')[0] || id;
  };

  const handleExport = () => {
    const rows = [
      ['Representante', 'Valor', 'Status', 'Data'],
      ...filtered.map((c: any) => [
        getPartnerName(c.partner_id),
        `R$ ${Number(c.commission_amount || 0).toFixed(2)}`,
        c.status,
        c.created_at ? new Date(c.created_at).toLocaleDateString('pt-BR') : '—',
      ]),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'comissoes_representantes.csv';
    a.click();
    toast({ title: 'CSV exportado com sucesso' });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Comissões & Bonificações</h1>
            <p className="text-sm text-muted-foreground">Histórico de pagamentos por representante</p>
          </div>
          <Button onClick={handleExport} variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" /> Exportar CSV
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-green-500/10"><DollarSign className="h-5 w-5 text-green-500" /></div><div><p className="text-sm text-muted-foreground">Total Pago</p><p className="text-2xl font-bold">R$ {totalPago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-yellow-500/10"><TrendingUp className="h-5 w-5 text-yellow-500" /></div><div><p className="text-sm text-muted-foreground">A Pagar</p><p className="text-2xl font-bold">R$ {totalPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-primary/10"><Users className="h-5 w-5 text-primary" /></div><div><p className="text-sm text-muted-foreground">Lançamentos</p><p className="text-2xl font-bold">{commissions.length}</p></div></div></CardContent></Card>
        </div>

        <div className="flex flex-wrap gap-3">
          <Select value={filterPartner} onValueChange={setFilterPartner}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Filtrar por representante" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os representantes</SelectItem>
              {partners.map((p: any) => (
                <SelectItem key={p.id} value={p.id}>{p.name || p.email?.split('@')[0] || p.id}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="PAID">Pagos</SelectItem>
              <SelectItem value="PENDING">Pendentes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Lançamentos de Comissão</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground text-sm">Carregando...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm">Nenhum lançamento encontrado</div>
            ) : (
              <div className="space-y-2">
                {filtered.map((c: any) => (
                  <div key={c.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg border bg-card hover:bg-accent/20 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                        {getPartnerName(c.partner_id).charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{getPartnerName(c.partner_id)}</p>
                        <p className="text-xs text-muted-foreground">
                          {c.created_at ? new Date(c.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'}
                          {c.description ? ` · ${c.description}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <span className="font-semibold text-base tabular-nums">
                        R$ {Number(c.commission_amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                      <Badge variant="outline" className={c.status === 'PAID' ? 'bg-green-50 text-green-700 border-green-300' : 'bg-yellow-50 text-yellow-700 border-yellow-300'}>
                        {c.status === 'PAID' ? 'Pago' : 'Pendente'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default RepresentantesComissoes;