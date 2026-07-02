import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Building2, Search, MapPin, AlertTriangle, TrendingUp, Users, Calendar,
  ArrowUp, ArrowUpRight, ArrowRight, ArrowDownRight, ArrowDown, Activity, Sparkles,
  ExternalLink, PhoneCall, XCircle,
} from 'lucide-react';

export type Trend = 'up' | 'upright' | 'right' | 'downright' | 'down';
export type ClinicStatus = 'green' | 'yellow' | 'red';

export interface MockClinic {
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
  activeDays: number; // days since activation
  daysSinceLastSim: number;
  phone: string;
  responsible: string;
  address: string;
  registeredAt: string;
  activatedAt: string;
}

export const MOCK_CLINICS: MockClinic[] = [
  { id: 'cl1', name: 'Clínica Dental Plus', specialty: 'Odontologia', neighborhood: 'Centro', city: 'Belo Horizonte', status: 'green', active: true, alert: false, simulationsToday: 62, expected: 50, trend: 'up', activeReceptionists: 3, activeDays: 120, daysSinceLastSim: 0, phone: '(31) 99876-1100', responsible: 'Dra. Marina Souza', address: 'Av. Afonso Pena 1230 · Centro · Belo Horizonte/MG', registeredAt: '01/03/2026', activatedAt: '05/03/2026' },
  { id: 'cl2', name: 'Clínica BH Sorriso', specialty: 'Odontologia', neighborhood: 'Savassi', city: 'Belo Horizonte', status: 'yellow', active: true, alert: false, simulationsToday: 18, expected: 25, trend: 'right', activeReceptionists: 2, activeDays: 45, daysSinceLastSim: 0, phone: '(31) 98765-4321', responsible: 'Dr. Felipe Lima', address: 'R. Pernambuco 450 · Savassi · Belo Horizonte/MG', registeredAt: '15/05/2026', activatedAt: '20/05/2026' },
  { id: 'cl3', name: 'Centro Odonto Minas', specialty: 'Odontologia', neighborhood: 'Lourdes', city: 'Belo Horizonte', status: 'red', active: true, alert: true, simulationsToday: 0, expected: 20, trend: 'down', activeReceptionists: 0, activeDays: 80, daysSinceLastSim: 3, phone: '(31) 97654-3210', responsible: 'Carla Souza', address: 'R. da Bahia 88 · Lourdes · Belo Horizonte/MG', registeredAt: '10/04/2026', activatedAt: '12/04/2026' },
  { id: 'cl4', name: 'Clínica Saúde Total', specialty: 'Clínica Geral', neighborhood: 'Buritis', city: 'Belo Horizonte', status: 'red', active: true, alert: true, simulationsToday: 5, expected: 30, trend: 'downright', activeReceptionists: 1, activeDays: 30, daysSinceLastSim: 0, phone: '(31) 96543-2109', responsible: 'Patrícia Lima', address: 'Av. do Contorno 500 · Buritis · Belo Horizonte/MG', registeredAt: '28/05/2026', activatedAt: '30/05/2026' },
  { id: 'cl5', name: 'Clínica Dental BH', specialty: 'Odontologia', neighborhood: 'Centro', city: 'Belo Horizonte', status: 'yellow', active: true, alert: false, simulationsToday: 12, expected: 20, trend: 'downright', activeReceptionists: 1, activeDays: 60, daysSinceLastSim: 0, phone: '(31) 95432-1098', responsible: 'Dr. Eduardo Castro', address: 'R. Espírito Santo 200 · Centro · Belo Horizonte/MG', registeredAt: '20/04/2026', activatedAt: '25/04/2026' },
  { id: 'cl6', name: 'OdontoVida Premium', specialty: 'Implantodontia', neighborhood: 'Savassi', city: 'Belo Horizonte', status: 'green', active: true, alert: false, simulationsToday: 35, expected: 30, trend: 'up', activeReceptionists: 2, activeDays: 90, daysSinceLastSim: 0, phone: '(31) 94321-0987', responsible: 'Dra. Júlia Mendes', address: 'Av. Raja Gabaglia 1000 · Savassi · Belo Horizonte/MG', registeredAt: '20/03/2026', activatedAt: '01/04/2026' },
  { id: 'cl7', name: 'Clínica Sorriso Mineiro', specialty: 'Odontologia', neighborhood: 'Lourdes', city: 'Belo Horizonte', status: 'green', active: true, alert: false, simulationsToday: 28, expected: 25, trend: 'right', activeReceptionists: 2, activeDays: 75, daysSinceLastSim: 0, phone: '(31) 93210-9876', responsible: 'Ana Beatriz', address: 'R. dos Inconfidentes 300 · Lourdes · Belo Horizonte/MG', registeredAt: '10/04/2026', activatedAt: '15/04/2026' },
  { id: 'cl8', name: 'Dental Plus Centro', specialty: 'Odontologia', neighborhood: 'Centro', city: 'Belo Horizonte', status: 'yellow', active: true, alert: true, isNew: true, awaitingFirstSim: true, simulationsToday: 10, expected: 20, trend: 'right', activeReceptionists: 1, activeDays: 4, daysSinceLastSim: 4, phone: '(31) 92109-8765', responsible: 'Roberta Lopes', address: 'Av. Amazonas 770 · Centro · Belo Horizonte/MG', registeredAt: '26/06/2026', activatedAt: '—' },
];

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

const SPECIALTIES = ['Odontologia', 'Clínica Geral', 'Implantodontia'];

const NEIGHBORHOODS = ['Centro', 'Savassi', 'Lourdes', 'Buritis'];

export default function PartnersClinicas() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [neighborhoodFilter, setNeighborhoodFilter] = useState('all');
  const [specialtyFilter, setSpecialtyFilter] = useState('all');

  const filtered = useMemo(() => {
    return MOCK_CLINICS.filter(c => {
      const m1 = c.name.toLowerCase().includes(search.toLowerCase()) ||
                  c.responsible.toLowerCase().includes(search.toLowerCase());
      const m2 = statusFilter === 'all'
        || (statusFilter === 'ativas' && c.active && !c.awaitingFirstSim)
        || (statusFilter === 'inativas' && !c.active)
        || (statusFilter === 'alerta' && c.alert)
        || (statusFilter === 'aguardando' && c.awaitingFirstSim);
      const m3 = neighborhoodFilter === 'all' || c.neighborhood === neighborhoodFilter;
      const m4 = specialtyFilter === 'all' || c.specialty === specialtyFilter;
      return m1 && m2 && m3 && m4;
    });
  }, [search, statusFilter, neighborhoodFilter, specialtyFilter]);

  const total = 12;
  const ativas = 10;
  const simHoje = 127;
  const emAlerta = 3;
  const novasSemana = 2;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
            <Building2 className="w-7 h-7 text-primary" /> Minhas Clínicas
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Monitoramento em tempo real de simulações e ativações</p>
        </div>

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
              {NEIGHBORHOODS.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Lista */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map(c => (
            <button
              key={c.id}
              onClick={() => navigate(`/dashboard/representantes/clinicas/${c.id}`)}
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
      </div>
    </DashboardLayout>
  );
}