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
import { useState, useMemo } from 'react';

// ─── Mock data ────────────────────────────────────────────────────────────────

interface Representante {
  id: string;
  name: string;
  email: string;
  region: string;
  type: 'MASTER' | 'PARTNER';
  clinicasTotal: number;
  clinicasAtivas: number;
  clinicasAcimaMetaPct: number; // %
  visitasSemana: number;
  visitasRealizadas: number;
  cadastrosMes: number;
  metaCadastros: number;
  ativacoesMes: number;
  metaAtivacoes: number;
  mimosEntregues: number;
  mimosPendentes: number;
  seh: number;
  trend: 'up' | 'stable' | 'down';
}

const MOCK_REPRESENTANTES: Representante[] = [
  {
    id: 'r1', name: 'Roberto Ribeiro', email: 'roberto@helpude.com', region: 'BH / MG', type: 'MASTER',
    clinicasTotal: 12, clinicasAtivas: 10, clinicasAcimaMetaPct: 60,
    visitasSemana: 8, visitasRealizadas: 6,
    cadastrosMes: 3, metaCadastros: 5,
    ativacoesMes: 2, metaAtivacoes: 5,
    mimosEntregues: 8, mimosPendentes: 3,
    seh: 70.8, trend: 'up',
  },
  {
    id: 'r2', name: 'Ana Paula Ferreira', email: 'ana@helpude.com', region: 'SP Capital', type: 'PARTNER',
    clinicasTotal: 8, clinicasAtivas: 7, clinicasAcimaMetaPct: 85,
    visitasSemana: 6, visitasRealizadas: 6,
    cadastrosMes: 4, metaCadastros: 5,
    ativacoesMes: 4, metaAtivacoes: 5,
    mimosEntregues: 12, mimosPendentes: 1,
    seh: 88.2, trend: 'up',
  },
  {
    id: 'r3', name: 'Carlos Henrique Lima', email: 'carlos@helpude.com', region: 'RJ / Niterói', type: 'PARTNER',
    clinicasTotal: 5, clinicasAtivas: 3, clinicasAcimaMetaPct: 40,
    visitasSemana: 5, visitasRealizadas: 2,
    cadastrosMes: 1, metaCadastros: 5,
    ativacoesMes: 0, metaAtivacoes: 5,
    mimosEntregues: 2, mimosPendentes: 5,
    seh: 42.0, trend: 'down',
  },
  {
    id: 'r4', name: 'Fernanda Costa', email: 'fernanda@helpude.com', region: 'Campinas / SP', type: 'PARTNER',
    clinicasTotal: 9, clinicasAtivas: 8, clinicasAcimaMetaPct: 72,
    visitasSemana: 7, visitasRealizadas: 5,
    cadastrosMes: 3, metaCadastros: 5,
    ativacoesMes: 3, metaAtivacoes: 5,
    mimosEntregues: 10, mimosPendentes: 2,
    seh: 75.5, trend: 'stable',
  },
];

interface MimoAudit {
  id: string;
  representante: string;
  clinic: string;
  semana: string;
  faixa: string;
  status: 'PENDENTE' | 'ENTREGUE_COM_FOTO' | 'ENTREGUE_SEM_FOTO';
}

const MOCK_MIMOS_AUDIT: MimoAudit[] = [
  { id: 'm1', representante: 'Roberto Ribeiro', clinic: 'Clínica Dental Plus', semana: 'Sem 4 / Jun', faixa: 'Mimo Tipo 3', status: 'PENDENTE' },
  { id: 'm2', representante: 'Roberto Ribeiro', clinic: 'OdontoVida Premium', semana: 'Sem 4 / Jun', faixa: 'Mimo Tipo 2', status: 'PENDENTE' },
  { id: 'm3', representante: 'Carlos H. Lima', clinic: 'Clínica Carioca', semana: 'Sem 3 / Jun', faixa: 'Mimo Tipo 1', status: 'PENDENTE' },
  { id: 'm4', representante: 'Ana Paula Ferreira', clinic: 'Clínica Paulista', semana: 'Sem 4 / Jun', faixa: 'Mimo Tipo 2', status: 'ENTREGUE_COM_FOTO' },
  { id: 'm5', representante: 'Fernanda Costa', clinic: 'OdontoCampinas', semana: 'Sem 4 / Jun', faixa: 'Mimo Tipo 3', status: 'ENTREGUE_SEM_FOTO' },
  { id: 'm6', representante: 'Carlos H. Lima', clinic: 'Dental Rio', semana: 'Sem 4 / Jun', faixa: 'Mimo Tipo 1', status: 'PENDENTE' },
  { id: 'm7', representante: 'Roberto Ribeiro', clinic: 'Clínica BH Sorriso', semana: 'Sem 3 / Jun', faixa: 'Mimo Tipo 2', status: 'PENDENTE' },
];

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

  const filteredReps = useMemo(() =>
    MOCK_REPRESENTANTES.filter(r =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.region.toLowerCase().includes(search.toLowerCase())
    ), [search]);

  const filteredMimos = useMemo(() =>
    MOCK_MIMOS_AUDIT.filter(m => mimoFilter === 'all' || m.status === mimoFilter),
    [mimoFilter]);

  // Summary KPIs
  const totalReps = MOCK_REPRESENTANTES.length;
  const totalClinicas = MOCK_REPRESENTANTES.reduce((s, r) => s + r.clinicasTotal, 0);
  const totalMimosPendentes = MOCK_MIMOS_AUDIT.filter(m => m.status === 'PENDENTE').length;
  const totalMimosEntregues = MOCK_MIMOS_AUDIT.filter(m => m.status === 'ENTREGUE_COM_FOTO').length;
  const avgSEH = (MOCK_REPRESENTANTES.reduce((s, r) => s + r.seh, 0) / totalReps).toFixed(1);

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
