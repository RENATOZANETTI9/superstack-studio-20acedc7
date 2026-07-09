import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { isAdminRole } from '@/lib/partner-rules';
import {
  Building2, Search, MapPin, AlertTriangle, TrendingUp, Users, Calendar,
  ArrowUp, ArrowUpRight, ArrowRight, ArrowDownRight, ArrowDown, Activity, Sparkles, Inbox,
} from 'lucide-react';

export type Trend = 'up' | 'upright' | 'right' | 'downright' | 'down';
export type ClinicStatus = 'green' | 'yellow' | 'red';

export interface ClinicCard {
  id: string;
  name: string;
  specialty: string;
  neighborhood: string;
  city: string;
  status: ClinicStatus;
  active: boolean;
  alert: boolean;
  isNew?: boolean;
  awaitingFirstSim?: boolean;
  simulationsToday: number;
  expected: number;
  trend: Trend;
  activeReceptionists: number;
  activeDays: number;
  daysSinceLastSim: number;
  phone: string;
  responsible: string;
  address: string;
  registeredAt: string;
  activatedAt: string;
}
// Backward-compat alias for older imports.
export type MockClinic = ClinicCard;

const STATUS_DOT: Record<ClinicStatus, string> = {
  green: 'bg-green-500',
  yellow: 'bg-yellow-500',
  red: 'bg-red-500',
};

const TREND_ICON: Record<Trend, JSX.Element> = {
  up: <ArrowUp className="h-4 w-4 text-green-600" />,
  upright: <ArrowUpRight className="h-4 w-4 text-green-500" />,
  right: <ArrowRight className="h-4 w-4 text-muted-foreground" />,
  downright: <ArrowDownRight className="h-4 w-4 text-orange-500" />,
  down: <ArrowDown className="h-4 w-4 text-red-600" />,
};

export default function PartnersClinicas() {
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [neighborhoodFilter, setNeighborhoodFilter] = useState('all');
  const [clinics, setClinics] = useState<ClinicCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setLoadError(null);
      if (!user) { setLoading(false); return; }

      let query = supabase
        .from('portfolio_clinics')
        .select('id, nome, tipo, bairro, cidade, status, telefone, responsavel, ultima_visita, created_at')
        .order('created_at', { ascending: false })
        .limit(500);
      if (!isAdminRole(role as any)) {
        const { data: partner, error: partnerErr } = await supabase
          .from('partners').select('id').eq('user_id', user.id).maybeSingle();
        if (partnerErr) { if (!cancelled) { setLoadError(partnerErr.message); setLoading(false); } return; }
        if (!partner) { if (!cancelled) { setClinics([]); setLoading(false); } return; }
        query = query.eq('partner_id', partner.id);
      }
      const { data, error } = await query;
      if (cancelled) return;
      if (error) { setLoadError(error.message); setLoading(false); return; }
      const now = Date.now();
      const mapped: ClinicCard[] = (data || []).map(c => {
        const activeDays = Math.floor((now - new Date(c.created_at).getTime()) / 86400000);
        const statusRaw = (c.status || '').toUpperCase();
        const active = statusRaw !== 'INATIVA';
        const alert = statusRaw === 'ALERTA';
        const status: ClinicStatus = statusRaw === 'ATIVA' ? 'green' : statusRaw === 'ALERTA' ? 'red' : 'yellow';
        const daysSinceLastSim = c.ultima_visita
          ? Math.floor((now - new Date(c.ultima_visita).getTime()) / 86400000)
          : activeDays;
        return {
          id: c.id,
          name: c.nome,
          specialty: c.tipo || '—',
          neighborhood: c.bairro || '—',
          city: c.cidade || '—',
          status, active, alert,
          isNew: activeDays <= 7,
          awaitingFirstSim: !c.ultima_visita && activeDays <= 30,
          simulationsToday: 0,
          expected: 0,
          trend: 'right',
          activeReceptionists: 0,
          activeDays,
          daysSinceLastSim,
          phone: c.telefone || '',
          responsible: c.responsavel || '',
          address: `${c.bairro || ''} · ${c.cidade || ''}`,
          registeredAt: new Date(c.created_at).toLocaleDateString('pt-BR'),
          activatedAt: c.ultima_visita ? new Date(c.ultima_visita).toLocaleDateString('pt-BR') : '—',
        };
      });
      setClinics(mapped);
      setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [user, role, reloadKey]);

  const neighborhoods = useMemo(
    () => [...new Set(clinics.map(c => c.neighborhood).filter(n => n && n !== '—'))],
    [clinics],
  );

  const filtered = useMemo(() => {
    return clinics.filter(c => {
      const m1 = c.name.toLowerCase().includes(search.toLowerCase());
      const m2 = statusFilter === 'all'
        || (statusFilter === 'ativas' && c.active)
        || (statusFilter === 'inativas' && !c.active)
        || (statusFilter === 'alerta' && c.alert);
      const m3 = neighborhoodFilter === 'all' || c.neighborhood === neighborhoodFilter;
      return m1 && m2 && m3;
    });
  }, [clinics, search, statusFilter, neighborhoodFilter]);

  const total = clinics.length;
  const ativas = clinics.filter(c => c.active).length;
  const simHoje = 0;
  const emAlerta = clinics.filter(c => c.alert).length;
  const novasSemana = clinics.filter(c => c.activeDays <= 7).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
            <Building2 className="w-7 h-7 text-primary" /> Minhas Clínicas
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Monitoramento em tempo real de simulações e ativações</p>
        </div>

        {loadError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 flex items-center justify-between gap-3">
            <span>Erro ao carregar clínicas: {loadError}</span>
            <Button size="sm" variant="outline" onClick={() => setReloadKey(k => k + 1)}>Tentar novamente</Button>
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="shadow-sm">
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10"><Building2 className="h-5 w-5 text-primary" /></div>
                <div>
                  <p className="text-xs text-muted-foreground">Total de Clínicas</p>
                  <p className="text-2xl font-bold">{total}</p>
                  <p className="text-[10px] text-muted-foreground">{ativas} ativas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10"><Activity className="h-5 w-5 text-blue-500" /></div>
                <div>
                  <p className="text-xs text-muted-foreground">Simulações Hoje</p>
                  <p className="text-2xl font-bold">{simHoje}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/10"><AlertTriangle className="h-5 w-5 text-red-500" /></div>
                <div>
                  <p className="text-xs text-muted-foreground">Clínicas em Alerta</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold">{emAlerta}</p>
                    <Badge className="bg-red-500 text-white border-0">{emAlerta}</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10"><Sparkles className="h-5 w-5 text-green-500" /></div>
                <div>
                  <p className="text-xs text-muted-foreground">Novas esta semana</p>
                  <p className="text-2xl font-bold">{novasSemana}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar por nome..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-44 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="ativas">Ativas</SelectItem>
              <SelectItem value="inativas">Inativas</SelectItem>
              <SelectItem value="alerta">Em Alerta</SelectItem>
            </SelectContent>
          </Select>
          <Select value={neighborhoodFilter} onValueChange={setNeighborhoodFilter}>
            <SelectTrigger className="w-full sm:w-44 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os bairros</SelectItem>
              {neighborhoods.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Lista */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {[0, 1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-40 rounded-xl" />)}
          </div>
        ) : clinics.length === 0 ? (
          <div className="text-center py-16 text-sm text-muted-foreground flex flex-col items-center gap-2">
            <Inbox className="h-10 w-10 opacity-30" />
            Sem dados ainda — nenhuma clínica cadastrada para este partner
          </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map(c => (
            <button
              key={c.id}
              onClick={() => navigate(`/dashboard/partners/clinicas/${c.id}`)}
              className="text-left rounded-xl border bg-card hover:shadow-lg transition-all p-4 shadow-sm group"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`h-3 w-3 rounded-full ${STATUS_DOT[c.status]} shrink-0`} />
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">{c.name}</p>
                    <p className="text-[11px] text-muted-foreground">{c.specialty}</p>
                  </div>
                </div>
                {c.awaitingFirstSim && (
                  <Badge className="bg-orange-100 text-orange-700 border-0 text-[10px] shrink-0">Aguardando 1ª simulação</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mb-3">
                <MapPin className="w-3 h-3" /> {c.neighborhood} · {c.city}
              </p>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-muted/40 p-2">
                  <p className="text-[10px] text-muted-foreground">Simulações hoje</p>
                  <p className="font-bold text-base flex items-center gap-1.5">
                    {c.simulationsToday}
                    <span className="text-[10px] font-normal text-muted-foreground">/ {c.expected}</span>
                    {TREND_ICON[c.trend]}
                  </p>
                </div>
                <div className="rounded-lg bg-muted/40 p-2">
                  <p className="text-[10px] text-muted-foreground">Recepcionistas hoje</p>
                  <p className="font-bold text-base flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-muted-foreground" /> {c.activeReceptionists}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-3 pt-3 border-t text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Ativa há {c.activeDays}d</span>
                <span className={c.daysSinceLastSim > 2 ? 'text-red-600 font-medium' : ''}>
                  Última simulação: {c.daysSinceLastSim === 0 ? 'hoje' : `há ${c.daysSinceLastSim}d`}
                </span>
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-12 text-sm text-muted-foreground">
              Nenhuma clínica encontrada com os filtros aplicados.
            </div>
          )}
        </div>
        )}
      </div>
    </DashboardLayout>
  );
}