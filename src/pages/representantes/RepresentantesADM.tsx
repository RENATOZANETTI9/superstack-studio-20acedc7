import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Users, Building2, Gift, CheckCircle2, TrendingUp, TrendingDown, Minus,
  Search, MapPin, Target, AlertTriangle, Camera, Calendar, BarChart3,
  ClipboardCheck, Star
} from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// ─── Helper ───────────────────────────────────────────────────────────────────

const TREND_CONFIG = {
  up:     { icon: TrendingUp,   color: 'text-green-600',  label: 'Em alta'  },
  stable: { icon: Minus,        color: 'text-blue-500',   label: 'Estável'  },
  down:   { icon: TrendingDown, color: 'text-red-600',    label: 'Em queda' },
};

const MIMO_STATUS_CONFIG = {
  PENDENTE:           { label: 'Pendente',           cls: 'bg-yellow-100 text-yellow-800' },
  ENTREGUE_COM_FOTO:  { label: 'Entregue c/ foto',   cls: 'bg-green-100 text-green-800'  },
  ENTREGUE_SEM_FOTO:  { label: 'Entregue s/ foto',   cls: 'bg-orange-100 text-orange-800'},
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function RepresentantesADM() {
  const [search, setSearch] = useState('');
  const [mimoFilter, setMimoFilter] = useState<'all' | 'PENDENTE' | 'ENTREGUE_COM_FOTO' | 'ENTREGUE_SEM_FOTO'>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [representantes, setRepresentantes] = useState<any[]>([]);
  // TODO: conectar tabela attendant_incentives para auditoria de mimos.
  const mimosAudit: any[] = [];

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);
      setLoadError(null);

      // 1. IDs de usuários com role 'representante'
      const { data: roleRows, error: rErr } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'representante' as any)
        .limit(500);
      if (rErr) { if (!cancelled) { setLoadError(rErr.message); setLoading(false); } return; }

      const userIds = (roleRows || []).map((r: any) => r.user_id);
      if (userIds.length === 0) {
        if (!cancelled) { setRepresentantes([]); setLoading(false); }
        return;
      }

      // 2. Partners desses usuários
      const { data: partnerRows, error: pErr } = await supabase
        .from('partners')
        .select('id, user_id, legal_name, email, region_state, region_city, type, seh_score')
        .in('user_id', userIds)
        .limit(500);
      if (pErr) { if (!cancelled) { setLoadError(pErr.message); setLoading(false); } return; }

      const partnerIds = (partnerRows || []).map((p: any) => p.id);
      const safeIds = partnerIds.length > 0 ? partnerIds : ['no-match'];

      // 3. Clínicas e comissões em paralelo, com filtro de período
      const [clinicRes, commRes] = await Promise.all([
        supabase
          .from('partner_clinic_relations')
          .select('partner_id, clinic_name, is_active, created_at')
          .in('partner_id', safeIds)
          .limit(5000),
        supabase
          .from('partner_commissions')
          .select('beneficiary_partner_id, commission_amount, status, created_at')
          .in('beneficiary_partner_id', safeIds)
          .gte('created_at', dateFrom ? dateFrom + 'T00:00:00Z' : '2020-01-01T00:00:00Z')
          .lte('created_at', dateTo ? dateTo + 'T23:59:59Z' : new Date().toISOString())
          .limit(10000),
      ]);
      if (cancelled) return;

      const clinicsByPartner: Record<string, { total: number; active: number }> = {};
      for (const c of (clinicRes.data || []) as any[]) {
        const bucket = clinicsByPartner[c.partner_id] || { total: 0, active: 0 };
        bucket.total += 1;
        if (c.is_active) bucket.active += 1;
        clinicsByPartner[c.partner_id] = bucket;
      }

      const commByPartner: Record<string, { total: number; paid: number; pending: number; approved: number }> = {};
      for (const c of (commRes.data || []) as any[]) {
        const pid = c.beneficiary_partner_id;
        if (!commByPartner[pid]) commByPartner[pid] = { total: 0, paid: 0, pending: 0, approved: 0 };
        const amt = Number(c.commission_amount || 0);
        commByPartner[pid].total += amt;
        if (c.status === 'PAID') commByPartner[pid].paid += amt;
        else if (c.status === 'APPROVED') commByPartner[pid].approved += amt;
        else commByPartner[pid].pending += amt;
      }

      const reps = (partnerRows || []).map((p: any) => ({
        id: p.id,
        name: p.legal_name || p.email || 'Sem nome',
        email: p.email || '',
        region: [p.region_city, p.region_state].filter(Boolean).join(' / ') || '—',
        type: (p.type || 'PARTNER') as 'MASTER' | 'PARTNER',
        seh: Number(p.seh_score || 0),
        clinicasTotal: clinicsByPartner[p.id]?.total || 0,
        clinicasAtivas: clinicsByPartner[p.id]?.active || 0,
        comissaoTotal: commByPartner[p.id]?.total || 0,
        comissaoPaga: commByPartner[p.id]?.paid || 0,
        comissaoPendente: commByPartner[p.id]?.pending || 0,
        comissaoAprovada: commByPartner[p.id]?.approved || 0,
      }));

      setRepresentantes(reps);
      setLoading(false);
    };
    fetchData();
    return () => { cancelled = true; };
  }, [dateFrom, dateTo]);

  const filteredReps = useMemo(() =>
    representantes.filter(r =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.region.toLowerCase().includes(search.toLowerCase())
    ), [representantes, search]);

  const filteredMimos = useMemo(() =>
    mimosAudit.filter((m: any) => mimoFilter === 'all' || m.status === mimoFilter),
    [mimoFilter]);

  // Summary KPIs
  const totalReps = representantes.length;
  const totalClinicas = representantes.reduce((s, r) => s + r.clinicasTotal, 0);
  const totalMimosPendentes = 0;
  const totalMimosEntregues = 0;
  const avgSEH = totalReps > 0
    ? (representantes.reduce((s, r) => s + (r.seh || 0), 0) / totalReps).toFixed(1)
    : '0.0';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-primary" /> Gestão de Representantes
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Visão centralizada de performance, rotas, metas e auditoria de mimos
          </p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <Card className="shadow-sm">
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10"><Users className="h-5 w-5 text-primary" /></div>
                <div>
                  <p className="text-xs text-muted-foreground">Representantes</p>
                  <p className="text-2xl font-bold">{totalReps}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10"><Building2 className="h-5 w-5 text-blue-500" /></div>
                <div>
                  <p className="text-xs text-muted-foreground">Clínicas Total</p>
                  <p className="text-2xl font-bold">{totalClinicas}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/10"><Gift className="h-5 w-5 text-yellow-500" /></div>
                <div>
                  <p className="text-xs text-muted-foreground">Mimos Pendentes</p>
                  <p className="text-2xl font-bold text-yellow-600">{totalMimosPendentes}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10"><CheckCircle2 className="h-5 w-5 text-green-500" /></div>
                <div>
                  <p className="text-xs text-muted-foreground">Entregues c/ Foto</p>
                  <p className="text-2xl font-bold text-green-600">{totalMimosEntregues}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10"><Star className="h-5 w-5 text-purple-500" /></div>
                <div>
                  <p className="text-xs text-muted-foreground">SEH Médio</p>
                  <p className="text-2xl font-bold">{avgSEH}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs: Representantes | Mimos Auditoria */}
        <Tabs defaultValue="reps">
          <TabsList>
            <TabsTrigger value="reps" className="gap-2">
              <Users className="w-4 h-4" /> Representantes ({totalReps})
            </TabsTrigger>
            <TabsTrigger value="mimos" className="gap-2">
              <Gift className="w-4 h-4" /> Auditoria de Mimos
              {totalMimosPendentes > 0 && (
                <Badge className="ml-1 bg-yellow-500 text-white border-0 text-[10px] h-4 px-1">
                  {totalMimosPendentes}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Tab: Representantes */}
          <TabsContent value="reps" className="space-y-4 mt-4">
            <Card className="mb-4">
              <CardContent className="pt-4 pb-4">
                <div className="flex flex-wrap items-end gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Data início</label>
                    <Input
                      type="date"
                      value={dateFrom}
                      onChange={e => setDateFrom(e.target.value)}
                      className="h-8 w-40 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Data fim</label>
                    <Input
                      type="date"
                      value={dateTo}
                      onChange={e => setDateTo(e.target.value)}
                      className="h-8 w-40 text-sm"
                    />
                  </div>
                  {(dateFrom || dateTo) && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => { setDateFrom(''); setDateTo(''); }}
                      className="h-8 text-xs"
                    >
                      Limpar filtros
                    </Button>
                  )}
                  <p className="text-xs text-muted-foreground ml-auto">
                    {dateFrom || dateTo ? `Período: ${dateFrom || '—'} → ${dateTo || 'hoje'}` : 'Exibindo todos os dados'}
                  </p>
                </div>
              </CardContent>
            </Card>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar representante ou região..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>

            <div className="space-y-3">
              {filteredReps.map(r => {
                const TrendIcon = TREND_CONFIG[r.trend].icon;
                const cadastrosPct = Math.min(100, (r.cadastrosMes / r.metaCadastros) * 100);
                const ativacoesPct = Math.min(100, (r.ativacoesMes / r.metaAtivacoes) * 100);
                const visitasPct = Math.min(100, (r.visitasRealizadas / r.visitasSemana) * 100);
                return (
                  <Card key={r.id} className="shadow-sm">
                    <CardContent className="pt-4">
                      <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                        {/* Identity */}
                        <div className="flex items-start gap-3 lg:w-56 shrink-0">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-white font-bold text-sm shrink-0">
                            {r.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm">{r.name}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3" /> {r.region}
                            </p>
                            <div className="flex gap-1 mt-1 flex-wrap">
                              <Badge variant="outline" className="text-[10px] h-4">
                                {r.type === 'MASTER' ? 'Master' : 'Partner'}
                              </Badge>
                              <Badge className={`text-[10px] h-4 ${TREND_CONFIG[r.trend].color} bg-transparent border`}>
                                <TrendIcon className="w-2.5 h-2.5 mr-0.5" />
                                {TREND_CONFIG[r.trend].label}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {/* Metas e KPIs */}
                        <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {/* Cadastros */}
                          <div className="p-2.5 rounded-lg bg-muted/40">
                            <p className="text-[10px] text-muted-foreground mb-1">Cadastros</p>
                            <p className="font-bold text-sm">{r.cadastrosMes}<span className="text-[10px] text-muted-foreground font-normal"> / {r.metaCadastros}</span></p>
                            <div className="h-1.5 bg-muted rounded-full mt-1.5 overflow-hidden">
                              <div className={`h-full rounded-full ${cadastrosPct >= 80 ? 'bg-green-500' : cadastrosPct >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${cadastrosPct}%` }} />
                            </div>
                          </div>
                          {/* Ativações */}
                          <div className="p-2.5 rounded-lg bg-muted/40">
                            <p className="text-[10px] text-muted-foreground mb-1">Ativações</p>
                            <p className="font-bold text-sm">{r.ativacoesMes}<span className="text-[10px] text-muted-foreground font-normal"> / {r.metaAtivacoes}</span></p>
                            <div className="h-1.5 bg-muted rounded-full mt-1.5 overflow-hidden">
                              <div className={`h-full rounded-full ${ativacoesPct >= 80 ? 'bg-green-500' : ativacoesPct >= 50 ? 'bg-blue-500' : 'bg-red-500'}`} style={{ width: `${ativacoesPct}%` }} />
                            </div>
                          </div>
                          {/* Visitas da Semana */}
                          <div className="p-2.5 rounded-lg bg-muted/40">
                            <p className="text-[10px] text-muted-foreground mb-1">Visitas (sem.)</p>
                            <p className="font-bold text-sm">{r.visitasRealizadas}<span className="text-[10px] text-muted-foreground font-normal"> / {r.visitasSemana}</span></p>
                            <div className="h-1.5 bg-muted rounded-full mt-1.5 overflow-hidden">
                              <div className="h-full rounded-full bg-primary" style={{ width: `${visitasPct}%` }} />
                            </div>
                          </div>
                          {/* SEH */}
                          <div className="p-2.5 rounded-lg bg-muted/40">
                            <p className="text-[10px] text-muted-foreground mb-1">SEH · Acima meta</p>
                            <p className="font-bold text-sm">{r.seh}<span className="text-[10px] text-muted-foreground font-normal"> / {r.clinicasAcimaMetaPct}%</span></p>
                            <div className="h-1.5 bg-muted rounded-full mt-1.5 overflow-hidden">
                              <div className="h-full rounded-full bg-purple-500" style={{ width: `${r.clinicasAcimaMetaPct}%` }} />
                            </div>
                          </div>
                        </div>

                        {/* Mimos */}
                        <div className="lg:w-32 shrink-0 flex lg:flex-col gap-2 items-center lg:items-end">
                          <div className="text-center p-2 rounded-lg bg-yellow-50 w-full">
                            <p className="text-[10px] text-yellow-700 font-medium">Mimos pendentes</p>
                            <p className="text-xl font-bold text-yellow-600">{r.mimosPendentes}</p>
                          </div>
                          <div className="text-center p-2 rounded-lg bg-green-50 w-full">
                            <p className="text-[10px] text-green-700 font-medium">Entregues</p>
                            <p className="text-xl font-bold text-green-600">{r.mimosEntregues}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {filteredReps.length === 0 && (
                <div className="text-center py-12 text-sm text-muted-foreground">
                  Nenhum representante encontrado.
                </div>
              )}
            </div>
          </TabsContent>

          {/* Tab: Auditoria de Mimos */}
          <TabsContent value="mimos" className="space-y-4 mt-4">
            <div className="flex flex-wrap gap-2">
              {(['all', 'PENDENTE', 'ENTREGUE_COM_FOTO', 'ENTREGUE_SEM_FOTO'] as const).map(f => (
                <Button
                  key={f}
                  size="sm"
                  variant={mimoFilter === f ? 'default' : 'outline'}
                  onClick={() => setMimoFilter(f)}
                  className="gap-1.5"
                >
                  {f === 'all' && <><Gift className="w-3.5 h-3.5" /> Todos ({MOCK_MIMOS_AUDIT.length})</>}
                  {f === 'PENDENTE' && <><AlertTriangle className="w-3.5 h-3.5" /> Pendentes ({MOCK_MIMOS_AUDIT.filter(m => m.status === 'PENDENTE').length})</>}
                  {f === 'ENTREGUE_COM_FOTO' && <><Camera className="w-3.5 h-3.5" /> Com foto ({MOCK_MIMOS_AUDIT.filter(m => m.status === 'ENTREGUE_COM_FOTO').length})</>}
                  {f === 'ENTREGUE_SEM_FOTO' && <><AlertTriangle className="w-3.5 h-3.5" /> Sem foto ({MOCK_MIMOS_AUDIT.filter(m => m.status === 'ENTREGUE_SEM_FOTO').length})</>}
                </Button>
              ))}
            </div>

            <Card>
              <CardContent className="pt-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        {['Representante', 'Clínica', 'Semana Ref.', 'Faixa Mimo', 'Status'].map(h => (
                          <th key={h} className="pb-3 text-left pr-4 text-xs text-muted-foreground font-semibold">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMimos.map(m => {
                        const cfg = MIMO_STATUS_CONFIG[m.status];
                        return (
                          <tr key={m.id} className="border-b hover:bg-accent/30">
                            <td className="py-3 font-medium text-sm">{m.representante}</td>
                            <td className="py-3 text-sm">{m.clinic}</td>
                            <td className="py-3 text-xs text-muted-foreground">{m.semana}</td>
                            <td className="py-3"><Badge variant="secondary">{m.faixa}</Badge></td>
                            <td className="py-3">
                              <Badge className={`${cfg.cls} border-0`}>{cfg.label}</Badge>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredMimos.length === 0 && (
                        <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">Nenhum mimo encontrado.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
