import { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import {
  MapPin, ChevronLeft, ChevronRight, Sparkles, Search, Phone, Gift,
  Target, Calendar, Users, CheckCircle2, Share2, Building2, Save, ClipboardCheck,
  Upload, Plus, Loader2, Copy, MoreVertical, Pencil, Trash2
} from 'lucide-react';
import { toast } from 'sonner';

type VisitStatus =
  | 'Pendente'
  | 'Em andamento'
  | 'Realizada'
  | 'Não visitada'
  | 'Reagendada'
  | 'Sem contato'
  | 'Clínica cadastrada'
  | 'Clínica ativada'
  | 'Treinamento realizado'
  | 'Aguardando retorno'
  | 'Cancelada';

interface PlannedVisit {
  id: string;
  clinic: string;
  address: string;
  goal: string;
  responsible?: string;
  phone?: string;
  status: VisitStatus;
}

interface PortfolioClinic {
  id: string;
  nome: string;
  tipo: 'Clínica' | 'Hospital' | 'Consultório';
  bairro: string;
  cidade: string;
  telefone: string;
  responsavel: string;
  status: 'Lead' | 'Ativo' | 'Inativo';
  ultimaVisita?: string;
}

const INITIAL_PORTFOLIO: PortfolioClinic[] = [
  { id: 'p1', nome: 'Clínica Savassi Odonto', tipo: 'Clínica', bairro: 'Savassi', cidade: 'Belo Horizonte', telefone: '(31) 99876-1122', responsavel: 'Dra. Marina', status: 'Ativo', ultimaVisita: '02/07/2026' },
  { id: 'p2', nome: 'Hospital Lourdes Saúde', tipo: 'Hospital', bairro: 'Lourdes', cidade: 'Belo Horizonte', telefone: '(31) 99654-3344', responsavel: 'Dr. Ricardo', status: 'Lead' },
  { id: 'p3', nome: 'Consultório Centro BH', tipo: 'Consultório', bairro: 'Centro', cidade: 'Belo Horizonte', telefone: '(31) 98877-2211', responsavel: 'Patrícia Lima', status: 'Inativo', ultimaVisita: '15/05/2026' },
];

const INITIAL_DAYS: Record<string, PlannedVisit[]> = {
  seg: [
    { id: 's1', clinic: 'Clínica BH Sorriso', address: 'Av. Afonso Pena 1230, BH', goal: 'Cadastro e ativação', responsible: 'Dra. Marina', phone: '(31) 99876-1122', status: 'Pendente' },
    { id: 's2', clinic: 'Centro Odonto Minas', address: 'R. da Bahia 88, BH', goal: 'Relacionamento com recepção', responsible: 'Carla Souza', phone: '(31) 99654-3344', status: 'Pendente' },
  ],
  ter: [
    { id: 't1', clinic: 'Clínica Saúde Total', address: 'Av. do Contorno 500, BH', goal: 'Treinar recepcionista', responsible: 'Patrícia Lima', phone: '(31) 98877-2211', status: 'Pendente' },
    { id: 't2', clinic: 'Clínica Dental BH', address: 'R. Espírito Santo 200, BH', goal: 'Reativar simulações', responsible: 'Dr. Felipe', phone: '(31) 98765-9988', status: 'Pendente' },
  ],
  qua: [
    { id: 'q1', clinic: 'OdontoVida Premium BH', address: 'Av. Raja Gabaglia 1000, BH', goal: 'Apresentar campanha', responsible: 'Júlia Mendes', phone: '(31) 97654-1010', status: 'Pendente' },
    { id: 'q2', clinic: 'Clínica Sorriso Mineiro', address: 'R. Pernambuco 450, BH', goal: 'Treinar nova recepção', responsible: 'Ana Beatriz', phone: '(31) 99123-4567', status: 'Pendente' },
  ],
  qui: [
    { id: 'qi1', clinic: 'Dental Plus Centro', address: 'Av. Amazonas 770, BH', goal: 'Renegociar metas', responsible: 'Roberta Lopes', phone: '(31) 98456-7788', status: 'Pendente' },
  ],
  sex: [],
};

const GIFT_ROUTE_INITIAL = {
  achieved: [
    { id: 'g1', clinic: 'Clínica Dental Plus', simulations: 62, gift: 'Ouro', receptionist: 'Maria Silva', delivered: false },
    { id: 'g2', clinic: 'Clínica BH Sorriso', simulations: 45, gift: 'Prata', receptionist: 'Ana Lima', delivered: false },
    { id: 'g3', clinic: 'Centro Odonto Minas', simulations: 35, gift: 'Prata', receptionist: 'Carla Souza', delivered: false },
  ],
  missed: [
    { id: 'm1', clinic: 'Clínica Saúde Total', simulations: 18 },
    { id: 'm2', clinic: 'Clínica Dental BH', simulations: 12 },
  ],
};

const DAY_META: { key: keyof typeof INITIAL_DAYS; label: string }[] = [
  { key: 'seg', label: 'Seg' },
  { key: 'ter', label: 'Ter' },
  { key: 'qua', label: 'Qua' },
  { key: 'qui', label: 'Qui' },
  { key: 'sex', label: 'Sex' },
];

function getWeekDates(offset: number) {
  const today = new Date();
  const day = today.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(today.getDate() + diffToMonday + offset * 7);

  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);

  const weekNum = Math.ceil(
    ((monday.getTime() - new Date(monday.getFullYear(), 0, 1).getTime()) / 86400000 + 1) / 7,
  );

  const fmt = (d: Date) =>
    d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

  return {
    label: `Semana ${weekNum} — ${fmt(monday)} a ${fmt(friday)}`,
    monday,
  };
}

function getDays(monday: Date) {
  const fmt = (d: Date) =>
    d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  return DAY_META.map((d, idx) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + idx);
    return { ...d, date: fmt(date) };
  });
}

const STATUS_BADGE: Record<VisitStatus, string> = {
  Pendente: 'bg-muted text-muted-foreground',
  'Em andamento': 'bg-blue-100 text-blue-700',
  Realizada: 'bg-green-100 text-green-700',
  'Não visitada': 'bg-gray-100 text-gray-600',
  Reagendada: 'bg-yellow-100 text-yellow-700',
  'Sem contato': 'bg-orange-100 text-orange-700',
  'Clínica cadastrada': 'bg-purple-100 text-purple-700',
  'Clínica ativada': 'bg-indigo-100 text-indigo-700',
  'Treinamento realizado': 'bg-teal-100 text-teal-700',
  'Aguardando retorno': 'bg-amber-100 text-amber-700',
  Cancelada: 'bg-red-100 text-red-700',
};

export default function PartnersRota() {
  const { user } = useAuth();
  const [weekOffset, setWeekOffset] = useState(0);
  const [days, setDays] = useState(INITIAL_DAYS);
  const [activeTab, setActiveTab] = useState<string>('seg');
  const [gifts, setGifts] = useState(GIFT_ROUTE_INITIAL);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Side sheet
  const [openVisit, setOpenVisit] = useState<PlannedVisit | null>(null);
  const [visitResultStatus, setVisitResultStatus] = useState<VisitStatus>('Realizada');
  const [visitResultActions, setVisitResultActions] = useState<string[]>([]);
  const [visitResultNotes, setVisitResultNotes] = useState('');
  const [visitClinicName, setVisitClinicName] = useState('');
  const [visitClinicPhone, setVisitClinicPhone] = useState('');
  const [visitClinicResponsible, setVisitClinicResponsible] = useState('');

  // Cobrar modal
  const [cobrarTarget, setCobrarTarget] = useState<{ id: string; clinic: string } | null>(null);
  const [cobrarNote, setCobrarNote] = useState('');

  // Outer tabs
  const [outerTab, setOuterTab] = useState<string>('rota');

  // Portfolio
  const [portfolio, setPortfolio] = useState<PortfolioClinic[]>(INITIAL_PORTFOLIO);
  const [portfolioSearch, setPortfolioSearch] = useState('');
  const [portfolioStatusFilter, setPortfolioStatusFilter] = useState<string>('all');
  const [addClinicOpen, setAddClinicOpen] = useState(false);
  const [newClinic, setNewClinic] = useState<Omit<PortfolioClinic, 'id'>>({
    nome: '', tipo: 'Clínica', bairro: '', cidade: '', telefone: '', responsavel: '', status: 'Lead',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI
  const [aiRoute, setAiRoute] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const { label: weekLabel, monday } = getWeekDates(weekOffset);
  const DAYS = getDays(monday);

  const handleGenerateAI = async () => {
    setAiLoading(true);
    setAiRoute(null);
    try {
      const { data, error } = await supabase.functions.invoke('generate-ai-route', {
        body: { clinicas: portfolio, semana: weekLabel },
      });
      if (error) throw error;
      setAiRoute(data?.roteiro || 'Roteiro não disponível.');
    } catch (err: any) {
      const msg = String(err?.message || err || '');
      if (
        msg.includes('OPENAI_API_KEY') ||
        msg.includes('not configured') ||
        msg.includes('secret') ||
        msg.includes('FunctionsFetchError')
      ) {
        toast.error(
          'Roteiro IA não configurado ainda. Peça ao administrador para adicionar OPENAI_API_KEY nos secrets do Supabase.',
          { duration: 8000 },
        );
      } else {
        toast.error('Erro ao gerar roteiro. Tente novamente em instantes.');
      }
    } finally {
      setAiLoading(false);
    }
  };

  const handleExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet);
        const imported: PortfolioClinic[] = rows.map((r) => ({
          id: crypto.randomUUID(),
          nome: String(r.Nome ?? r.nome ?? ''),
          tipo: (r.Tipo ?? r.tipo ?? 'Clínica') as PortfolioClinic['tipo'],
          bairro: String(r.Bairro ?? r.bairro ?? ''),
          cidade: String(r.Cidade ?? r.cidade ?? ''),
          telefone: String(r.Telefone ?? r.telefone ?? ''),
          responsavel: String(r.Responsavel ?? r.responsavel ?? r.Responsável ?? ''),
          status: 'Lead' as const,
        })).filter(c => c.nome);
        setPortfolio(prev => [...prev, ...imported]);
        toast.success(`${imported.length} clínica(s) importada(s) do Excel`);
      } catch (err) {
        toast.error('Erro ao ler arquivo Excel');
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleAddClinic = () => {
    if (!newClinic.nome || !newClinic.bairro || !newClinic.cidade) {
      toast.error('Preencha nome, bairro e cidade');
      return;
    }
    setPortfolio(prev => [...prev, { ...newClinic, id: crypto.randomUUID() }]);
    toast.success('Clínica adicionada ao portfólio');
    setAddClinicOpen(false);
    setNewClinic({ nome: '', tipo: 'Clínica', bairro: '', cidade: '', telefone: '', responsavel: '', status: 'Lead' });
  };

  const handleRemoveClinic = (id: string) => {
    setPortfolio(prev => prev.filter(c => c.id !== id));
    toast.success('Clínica removida');
  };

  const handleCopyAiRoute = async () => {
    if (!aiRoute) return;
    await navigator.clipboard.writeText(aiRoute);
    toast.success('Roteiro copiado!');
  };

  const filteredPortfolio = portfolio.filter(c => {
    const matchesSearch =
      c.nome.toLowerCase().includes(portfolioSearch.toLowerCase()) ||
      c.bairro.toLowerCase().includes(portfolioSearch.toLowerCase());
    const matchesStatus = portfolioStatusFilter === 'all' || c.status === portfolioStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const portfolioStatusBadge = (status: PortfolioClinic['status']) =>
    status === 'Ativo' ? 'bg-green-100 text-green-700'
    : status === 'Lead' ? 'bg-gray-100 text-gray-700'
    : 'bg-red-100 text-red-700';

  const handleShare = () => {
    toast.success('Roteiro copiado! Cole no WhatsApp para compartilhar.');
  };

  const handleDelivered = (id: string) => {
    setGifts(prev => ({
      ...prev,
      achieved: prev.achieved.map(g => g.id === id ? { ...g, delivered: true } : g),
    }));
    toast.success('Brinde marcado como entregue ✓');
  };

  const handleSaveCobranca = () => {
    toast.success(`Cobrança registrada para ${cobrarTarget?.clinic}`, { description: cobrarNote || 'Sem observações.' });
    setCobrarTarget(null);
    setCobrarNote('');
  };

  const handleSaveVisitResult = () => {
    if (!openVisit) return;
    setDays(prev => {
      const dayKey = (Object.keys(prev) as Array<keyof typeof prev>).find(k => prev[k].some(v => v.id === openVisit.id));
      if (!dayKey) return prev;
      return {
        ...prev,
        [dayKey]: prev[dayKey].map(v => v.id === openVisit.id ? { ...v, status: visitResultStatus } : v),
      };
    });
    toast.success('Resultado da visita registrado');
    setOpenVisit(null);
    setVisitResultStatus('Realizada');
    setVisitResultActions([]);
    setVisitResultNotes('');
    setVisitClinicName('');
    setVisitClinicPhone('');
    setVisitClinicResponsible('');
  };

  const filteredDayVisits = (key: keyof typeof INITIAL_DAYS) => {
    return days[key].filter(v => {
      const matchesSearch = v.clinic.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || v.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  };

  // Goals
  const allVisits = Object.values(days).flat();
  const goals = [
    {
      label: 'Cadastros Novos',
      current: allVisits.filter(v => v.status === 'Clínica cadastrada' || v.status === 'Clínica ativada').length,
      total: 3,
      color: 'bg-primary',
    },
    {
      label: 'Ativações',
      current: allVisits.filter(v => v.status === 'Clínica ativada').length,
      total: 3,
      color: 'bg-blue-500',
    },
    {
      label: 'Visitas Realizadas',
      current: allVisits.filter(v =>
        v.status !== 'Pendente' && v.status !== 'Em andamento' && v.status !== 'Cancelada'
      ).length,
      total: 8,
      color: 'bg-green-500',
    },
    { label: 'Clínicas Acima da Meta', current: 60, total: 100, color: 'bg-purple-500', suffix: '%' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
              <MapPin className="w-7 h-7 text-primary" /> Minha Rota Semanal
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Planeje suas visitas e gerencie entregas de brindes</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 rounded-lg border bg-card p-1">
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setWeekOffset(o => o - 1)} aria-label="Semana anterior">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium px-2 min-w-[220px] text-center">{weekLabel}</span>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setWeekOffset(o => o + 1)} aria-label="Próxima semana">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Button
              onClick={() => { setOuterTab('ia'); handleGenerateAI(); }}
              className="gap-2 bg-gradient-to-r from-primary to-secondary text-white shadow-md hover:shadow-lg"
              disabled={aiLoading}
            >
              <Sparkles className="w-4 h-4" />
              {aiLoading ? 'Gerando...' : 'Gerar Roteiro com IA'}
            </Button>
          </div>
        </div>

        <Tabs value={outerTab} onValueChange={setOuterTab} className="w-full">
          <TabsList className="grid grid-cols-3 w-full sm:w-auto">
            <TabsTrigger value="rota">📅 Rota Semanal</TabsTrigger>
            <TabsTrigger value="portfolio">🏥 Portfólio de Clínicas</TabsTrigger>
            <TabsTrigger value="ia">🤖 Roteiro com IA</TabsTrigger>
          </TabsList>

          <TabsContent value="rota" className="mt-6 space-y-6">
        {/* Metas */}
        <div>
          <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" /> Meta da Semana
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {goals.map(g => {
              const pct = Math.min(100, (g.current / g.total) * 100);
              return (
                <Card key={g.label} className="shadow-sm">
                  <CardContent className="pt-5">
                    <p className="text-xs text-muted-foreground">{g.label}</p>
                    <p className="text-2xl font-bold">
                      {g.current}{g.suffix || ''}
                      <span className="text-sm text-muted-foreground font-normal">
                        {g.suffix ? '' : ` / ${g.total}`}
                      </span>
                    </p>
                    <div className="h-1.5 bg-muted rounded-full mt-2 overflow-hidden">
                      <div className={`h-full ${g.color} transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Roteiro por dia */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" /> Roteiro por Dia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-5 w-full sm:w-auto">
                {DAYS.map(d => (
                  <TabsTrigger key={d.key} value={d.key} className="flex flex-col py-2 h-auto">
                    <span className="text-xs font-semibold">{d.label}</span>
                    <span className="text-[10px] text-muted-foreground">{d.date}</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* Filtros */}
              <div className="flex flex-col sm:flex-row gap-2 mt-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar clínica..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-48 h-9">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    <SelectItem value="Pendente">Pendente</SelectItem>
                    <SelectItem value="Em andamento">Em andamento</SelectItem>
                    <SelectItem value="Realizada">Realizada</SelectItem>
                    <SelectItem value="Clínica cadastrada">Clínica cadastrada</SelectItem>
                    <SelectItem value="Clínica ativada">Clínica ativada</SelectItem>
                    <SelectItem value="Treinamento realizado">Treinamento realizado</SelectItem>
                    <SelectItem value="Aguardando retorno">Aguardando retorno</SelectItem>
                    <SelectItem value="Cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {DAYS.filter(d => d.key !== 'sex').map(d => (
                <TabsContent key={d.key} value={d.key} className="mt-4 space-y-2">
                  {filteredDayVisits(d.key).length === 0 ? (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                      Nenhuma visita planejada para {d.label.toLowerCase()}.
                    </div>
                  ) : filteredDayVisits(d.key).map(v => (
                    <button
                      key={v.id}
                      onClick={() => { setOpenVisit(v); }}
                      className="w-full text-left flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors shadow-sm"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Building2 className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{v.clinic}</p>
                          <p className="text-xs text-muted-foreground truncate">{v.address}</p>
                          <p className="text-xs text-muted-foreground mt-0.5"><span className="font-medium">Objetivo:</span> {v.goal}</p>
                        </div>
                      </div>
                      <Badge className={`${STATUS_BADGE[v.status]} border-0 shrink-0`}>{v.status}</Badge>
                    </button>
                  ))}
                </TabsContent>
              ))}

              {/* Sexta — Roteiro de brindes */}
              <TabsContent value="sex" className="mt-4 space-y-4">
                <div className="rounded-lg border-2 border-primary/30 bg-gradient-to-r from-primary/10 via-secondary/5 to-transparent p-4">
                  <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Gift className="w-4 h-4 text-primary" /> 🎁 Roteiro de Entrega de Brindes
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Gerado automaticamente com base na meta semanal</p>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">Bateram a meta</p>
                  {gifts.achieved.map(g => (
                    <div key={g.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg border bg-green-50/40 shadow-sm">
                      <div className="min-w-0">
                        <p className="font-medium text-sm">{g.clinic}</p>
                        <p className="text-xs text-muted-foreground">
                          {g.simulations} simulações · {g.gift} · Recepcionista: {g.receptionist}
                        </p>
                      </div>
                      {g.delivered ? (
                        <Badge className="bg-green-600 text-white gap-1 border-0">
                          <CheckCircle2 className="w-3 h-3" /> Entregue ✓
                        </Badge>
                      ) : (
                        <Button size="sm" onClick={() => handleDelivered(g.id)} className="gap-1 bg-green-600 hover:bg-green-700 text-white">
                          <CheckCircle2 className="w-4 h-4" /> Brinde Entregue
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-red-700 uppercase tracking-wide">Não bateram a meta</p>
                  {gifts.missed.map(m => (
                    <div key={m.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg border border-red-200 bg-red-50/40 shadow-sm">
                      <div className="min-w-0">
                        <p className="font-medium text-sm">{m.clinic}</p>
                        <p className="text-xs text-muted-foreground">{m.simulations} simulações · Abaixo da meta</p>
                      </div>
                      <Button size="sm" variant="outline" className="gap-1 border-red-300 text-red-700 hover:bg-red-50" onClick={() => { setCobrarTarget(m); setCobrarNote(''); }}>
                        <Phone className="w-4 h-4" /> Cobrar Recepção
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end pt-2">
                  <Button variant="outline" className="gap-2" onClick={handleShare}>
                    <Share2 className="w-4 h-4" /> Compartilhar Roteiro
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Fechamento do Dia */}
        {activeTab !== 'sex' && (() => {
          const todayKey = activeTab as keyof typeof INITIAL_DAYS;
          const todayVisits = days[todayKey] || [];
          if (todayVisits.length === 0) return null;
          const planejadas = todayVisits.length;
          const realizadas = todayVisits.filter(v =>
            v.status !== 'Pendente' && v.status !== 'Em andamento' && v.status !== 'Cancelada'
          ).length;
          const cadastradas = todayVisits.filter(v =>
            v.status === 'Clínica cadastrada' || v.status === 'Clínica ativada'
          ).length;
          const ativadas = todayVisits.filter(v => v.status === 'Clínica ativada').length;
          const aguardando = todayVisits.filter(v =>
            v.status === 'Aguardando retorno' || v.status === 'Reagendada'
          ).length;
          return (
            <Card className="shadow-sm border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4 text-primary" /> Fechamento do Dia —{' '}
                  {DAYS.find(d => d.key === activeTab)?.label} {DAYS.find(d => d.key === activeTab)?.date}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                  <div className="text-center p-2 rounded-lg bg-muted/40">
                    <p className="text-xl font-bold">{planejadas}</p>
                    <p className="text-[10px] text-muted-foreground">Planejadas</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-green-50">
                    <p className="text-xl font-bold text-green-700">{realizadas}</p>
                    <p className="text-[10px] text-muted-foreground">Realizadas</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-purple-50">
                    <p className="text-xl font-bold text-purple-700">{cadastradas}</p>
                    <p className="text-[10px] text-muted-foreground">Cadastros</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-indigo-50">
                    <p className="text-xl font-bold text-indigo-700">{ativadas}</p>
                    <p className="text-[10px] text-muted-foreground">Ativações</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-amber-50">
                    <p className="text-xl font-bold text-amber-700">{aguardando}</p>
                    <p className="text-[10px] text-muted-foreground">Retorno</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })()}
          </TabsContent>

          <TabsContent value="portfolio" className="mt-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <Badge variant="secondary" className="text-sm">
                {portfolio.length} clínica{portfolio.length === 1 ? '' : 's'} cadastrada{portfolio.length === 1 ? '' : 's'}
              </Badge>
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={handleExcelImport}
                />
                <Button variant="outline" className="gap-2" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="w-4 h-4" /> Importar Excel
                </Button>
                <Button className="gap-2 bg-gradient-to-r from-primary to-secondary text-white" onClick={() => setAddClinicOpen(true)}>
                  <Plus className="w-4 h-4" /> Adicionar Clínica
                </Button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou bairro..."
                  value={portfolioSearch}
                  onChange={e => setPortfolioSearch(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
              <Select value={portfolioStatusFilter} onValueChange={setPortfolioStatusFilter}>
                <SelectTrigger className="w-full sm:w-48 h-9">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="Lead">Lead</SelectItem>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filteredPortfolio.length === 0 ? (
              <div className="text-center py-12 text-sm text-muted-foreground">
                Nenhuma clínica encontrada.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredPortfolio.map(c => (
                  <Card key={c.id} className="shadow-sm">
                    <CardContent className="pt-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-sm truncate">{c.nome}</p>
                          <Badge variant="outline" className="mt-1 text-[10px]">{c.tipo}</Badge>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-7 w-7">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => toast.info('Edição em breve')}>
                              <Pencil className="w-4 h-4 mr-2" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRemoveClinic(c.id)} className="text-red-600">
                              <Trash2 className="w-4 h-4 mr-2" /> Remover
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <MapPin className="w-3 h-3" /> {c.bairro}, {c.cidade}
                      </p>
                      {c.telefone && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Phone className="w-3 h-3" /> {c.telefone}
                        </p>
                      )}
                      {c.responsavel && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Users className="w-3 h-3" /> {c.responsavel}
                        </p>
                      )}
                      <div className="flex items-center justify-between pt-1">
                        <Badge className={`${portfolioStatusBadge(c.status)} border-0`}>{c.status}</Badge>
                        {c.ultimaVisita && (
                          <span className="text-[10px] text-muted-foreground">Última visita: {c.ultimaVisita}</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="ia" className="mt-6 space-y-4">
            <div className="rounded-lg border-2 border-primary/20 bg-gradient-to-r from-primary/10 via-secondary/5 to-transparent p-4">
              <p className="text-sm text-foreground">
                A IA analisa seu portfólio de clínicas e gera um roteiro semanal otimizado agrupando visitas por bairro para minimizar deslocamentos.
              </p>
            </div>

            <div className="flex justify-center py-6">
              <Button
                size="lg"
                onClick={handleGenerateAI}
                disabled={aiLoading}
                className="gap-2 bg-gradient-to-r from-primary to-secondary text-white shadow-lg hover:shadow-xl"
              >
                {aiLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                {aiLoading ? 'Gerando...' : '✨ Gerar Roteiro com Inteligência Artificial'}
              </Button>
            </div>

            {aiRoute && (
              <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" /> Roteiro Gerado pela IA
                  </CardTitle>
                  <Button size="sm" variant="outline" className="gap-2" onClick={handleCopyAiRoute}>
                    <Copy className="w-4 h-4" /> Copiar
                  </Button>
                </CardHeader>
                <CardContent>
                  <pre className="whitespace-pre-wrap text-sm font-sans">{aiRoute}</pre>
                </CardContent>
              </Card>
            )}

            {!aiRoute && !aiLoading && (
              <div className="text-center text-muted-foreground py-12">
                <Sparkles className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">Nenhum roteiro gerado ainda</p>
                <p className="text-xs mt-1 opacity-60">
                  Clique em "Gerar Roteiro com IA" para criar seu roteiro da semana.
                </p>
                <p className="text-xs mt-1 opacity-40">Requer OPENAI_API_KEY configurado no Supabase.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Visit side sheet */}
        <Sheet open={!!openVisit} onOpenChange={(o) => {
          if (!o) {
            setOpenVisit(null);
            setVisitResultStatus('Realizada');
            setVisitResultActions([]);
            setVisitResultNotes('');
            setVisitClinicName('');
            setVisitClinicPhone('');
            setVisitClinicResponsible('');
          }
        }}>
          <SheetContent className="w-full sm:max-w-md overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2"><Building2 className="w-5 h-5 text-primary" /> {openVisit?.clinic}</SheetTitle>
              <SheetDescription>Detalhes da visita planejada</SheetDescription>
            </SheetHeader>
            {openVisit && (
              <div className="space-y-4 mt-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Endereço</p>
                  <p className="text-sm">{openVisit.address}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Responsável</p>
                  <p className="text-sm">{openVisit.responsible || '—'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Telefone</p>
                  <p className="text-sm flex items-center gap-2"><Phone className="w-3 h-3 text-muted-foreground" /> {openVisit.phone || '—'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Objetivo da Visita</p>
                  <p className="text-sm">{openVisit.goal}</p>
                </div>
                <div className="space-y-4 border-t pt-4 mt-2">
                  {/* Status da visita */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Resultado da visita</label>
                    <Select value={visitResultStatus} onValueChange={(v) => setVisitResultStatus(v as VisitStatus)}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Realizada">✅ Realizada</SelectItem>
                        <SelectItem value="Clínica cadastrada">🏥 Clínica cadastrada</SelectItem>
                        <SelectItem value="Clínica ativada">⚡ Clínica ativada</SelectItem>
                        <SelectItem value="Treinamento realizado">📚 Treinamento realizado</SelectItem>
                        <SelectItem value="Aguardando retorno">🕐 Aguardando retorno</SelectItem>
                        <SelectItem value="Reagendada">📅 Reagendada</SelectItem>
                        <SelectItem value="Sem contato">📵 Sem contato</SelectItem>
                        <SelectItem value="Não visitada">❌ Não visitada</SelectItem>
                        <SelectItem value="Cancelada">🚫 Cancelada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Mini-form cadastro de clínica */}
                  {visitResultStatus === 'Clínica cadastrada' && (
                    <div className="rounded-lg border border-purple-200 bg-purple-50/40 p-3 space-y-2">
                      <p className="text-xs font-semibold text-purple-700 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5" /> Dados da nova clínica
                      </p>
                      <Input
                        placeholder="Nome da clínica"
                        value={visitClinicName}
                        onChange={e => setVisitClinicName(e.target.value)}
                        className="h-9 text-sm"
                      />
                      <Input
                        placeholder="Responsável"
                        value={visitClinicResponsible}
                        onChange={e => setVisitClinicResponsible(e.target.value)}
                        className="h-9 text-sm"
                      />
                      <Input
                        placeholder="Telefone"
                        value={visitClinicPhone}
                        onChange={e => setVisitClinicPhone(e.target.value)}
                        className="h-9 text-sm"
                      />
                    </div>
                  )}

                  {/* Ações secundárias */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Ações realizadas (opcional)</label>
                    <div className="space-y-2">
                      {[
                        { id: 'usuarios', label: 'Usuários da recepção criados' },
                        { id: 'simulacao', label: 'Primeira simulação realizada' },
                        { id: 'retorno', label: 'Requer nova visita' },
                      ].map(action => (
                        <div key={action.id} className="flex items-center gap-2">
                          <Checkbox
                            id={action.id}
                            checked={visitResultActions.includes(action.id)}
                            onCheckedChange={(checked) => {
                              setVisitResultActions(prev =>
                                checked ? [...prev, action.id] : prev.filter(a => a !== action.id)
                              );
                            }}
                          />
                          <Label htmlFor={action.id} className="text-sm font-normal cursor-pointer">
                            {action.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Observações */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Observações (opcional)</label>
                    <Textarea
                      rows={3}
                      value={visitResultNotes}
                      onChange={e => setVisitResultNotes(e.target.value)}
                      placeholder="O que foi conversado, próximos passos..."
                    />
                  </div>

                  <Button onClick={handleSaveVisitResult} className="w-full gap-2">
                    <Save className="w-4 h-4" /> Salvar resultado
                  </Button>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>

        {/* Cobrar Recepção modal */}
        <Dialog open={!!cobrarTarget} onOpenChange={(o) => { if (!o) { setCobrarTarget(null); setCobrarNote(''); } }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Phone className="w-5 h-5 text-primary" /> Cobrar Recepção · {cobrarTarget?.clinic}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Textarea
                rows={4}
                value={cobrarNote}
                onChange={e => setCobrarNote(e.target.value)}
                placeholder="Anote o que foi conversado e os próximos passos..."
              />
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => { setCobrarTarget(null); setCobrarNote(''); }}>Cancelar</Button>
              <Button onClick={handleSaveCobranca} className="gap-2"><Save className="w-4 h-4" /> Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Clinic dialog */}
        <Dialog open={addClinicOpen} onOpenChange={setAddClinicOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" /> Adicionar Clínica
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">Nome*</Label>
                <Input value={newClinic.nome} onChange={e => setNewClinic(p => ({ ...p, nome: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Tipo*</Label>
                  <Select value={newClinic.tipo} onValueChange={(v) => setNewClinic(p => ({ ...p, tipo: v as PortfolioClinic['tipo'] }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Clínica">Clínica</SelectItem>
                      <SelectItem value="Hospital">Hospital</SelectItem>
                      <SelectItem value="Consultório">Consultório</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Status*</Label>
                  <Select value={newClinic.status} onValueChange={(v) => setNewClinic(p => ({ ...p, status: v as PortfolioClinic['status'] }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Lead">Lead</SelectItem>
                      <SelectItem value="Ativo">Ativo</SelectItem>
                      <SelectItem value="Inativo">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Bairro*</Label>
                  <Input value={newClinic.bairro} onChange={e => setNewClinic(p => ({ ...p, bairro: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Cidade*</Label>
                  <Input value={newClinic.cidade} onChange={e => setNewClinic(p => ({ ...p, cidade: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Telefone</Label>
                <Input value={newClinic.telefone} onChange={e => setNewClinic(p => ({ ...p, telefone: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Responsável</Label>
                <Input value={newClinic.responsavel} onChange={e => setNewClinic(p => ({ ...p, responsavel: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setAddClinicOpen(false)}>Cancelar</Button>
              <Button onClick={handleAddClinic} className="gap-2"><Save className="w-4 h-4" /> Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}