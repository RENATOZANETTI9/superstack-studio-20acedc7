import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  Phone, MapPin, Calendar, ArrowLeft, CheckCircle2, Clock, Plus, ArrowUp, ArrowRight, ArrowDown,
  Building2, User, Save,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip as RTooltip, CartesianGrid } from 'recharts';
import { toast } from 'sonner';
import { MOCK_CLINICS } from './PartnersClinicas';

const MOCK_RECEPTIONISTS_BASE = [
  { name: 'Maria Silva', today: 22, yesterday: 18, week: [15, 18, 20, 22, 19], trend: 'up' as const },
  { name: 'Ana Lima', today: 18, yesterday: 20, week: [17, 19, 18, 20, 21], trend: 'right' as const },
  { name: 'Carla Souza', today: 12, yesterday: 14, week: [11, 12, 13, 12, 14], trend: 'down' as const },
];

const MOCK_TREND_14D = Array.from({ length: 14 }, (_, i) => ({
  day: `D${i + 1}`,
  simulacoes: Math.round(20 + Math.sin(i / 2) * 10 + i * 1.5 + Math.random() * 6),
}));

const MOCK_VISITS_HISTORY = [
  { date: '20/06/2026', goal: 'Treinar nova recepcionista', result: 'Mariana treinada. Iniciou cadastros no mesmo dia.' },
  { date: '06/06/2026', goal: 'Apresentar campanha de junho', result: 'Equipe engajada. Material entregue.' },
  { date: '22/05/2026', goal: 'Reativar fluxo de simulações', result: 'Identificada queda por mudança de gestor. Plano traçado.' },
];

const TREND_ICON: Record<'up' | 'right' | 'down', JSX.Element> = {
  up: <ArrowUp className="h-4 w-4 text-green-600" />,
  right: <ArrowRight className="h-4 w-4 text-muted-foreground" />,
  down: <ArrowDown className="h-4 w-4 text-red-600" />,
};

export default function PartnersClinicProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const clinic = MOCK_CLINICS.find(c => c.id === id) ?? MOCK_CLINICS[0];

  const [visits, setVisits] = useState(MOCK_VISITS_HISTORY);
  const [openNewVisit, setOpenNewVisit] = useState(false);
  const [vDate, setVDate] = useState('');
  const [vGoal, setVGoal] = useState('');
  const [vResult, setVResult] = useState('');
  const [vNext, setVNext] = useState('');

  const handleSaveVisit = () => {
    if (!vDate || !vGoal) {
      toast.error('Preencha data e objetivo');
      return;
    }
    setVisits(prev => [{ date: vDate, goal: vGoal, result: vResult || '—' }, ...prev]);
    toast.success('Visita registrada');
    setOpenNewVisit(false);
    setVDate(''); setVGoal(''); setVResult(''); setVNext('');
  };

  const checklist = [
    { label: 'Clínica cadastrada', done: true },
    { label: 'Recepcionista treinada', done: true },
    { label: 'Primeiro CPF inserido', done: true },
    { label: 'Meta semanal atingida pela 1ª vez', done: clinic.status === 'green' },
  ];

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clinic.address)}`;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/partners/clinicas')} className="gap-1 -ml-2">
          <ArrowLeft className="w-4 h-4" /> Voltar para Minhas Clínicas
        </Button>

        {/* Header */}
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div className="flex items-start gap-4 min-w-0">
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shrink-0">
                  <Building2 className="w-7 h-7 text-white" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl md:text-2xl font-bold text-foreground">{clinic.name}</h1>
                    <Badge className={clinic.active ? 'bg-green-500 text-white border-0' : 'bg-red-500 text-white border-0'}>
                      {clinic.active ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{clinic.specialty}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 mt-3 text-sm">
                    <p className="flex items-center gap-1.5 text-muted-foreground"><MapPin className="w-3.5 h-3.5" /> {clinic.address}</p>
                    <p className="flex items-center gap-1.5 text-muted-foreground"><Phone className="w-3.5 h-3.5" /> {clinic.phone}</p>
                    <p className="flex items-center gap-1.5 text-muted-foreground"><User className="w-3.5 h-3.5" /> {clinic.responsible}</p>
                    <p className="flex items-center gap-1.5 text-muted-foreground"><Calendar className="w-3.5 h-3.5" /> Cadastrada em {clinic.registeredAt}</p>
                    <p className="flex items-center gap-1.5 text-muted-foreground"><Calendar className="w-3.5 h-3.5" /> Ativada em {clinic.activatedAt}</p>
                    <p className="flex items-center gap-1.5 text-muted-foreground"><Clock className="w-3.5 h-3.5" /> {clinic.activeDays} dias ativos</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 shrink-0">
                <Button variant="outline" size="sm" asChild className="gap-1">
                  <a href={`tel:${clinic.phone.replace(/\D/g, '')}`}><Phone className="w-4 h-4" /> Ligar para Clínica</a>
                </Button>
                <Button variant="outline" size="sm" asChild className="gap-1">
                  <a href={mapsUrl} target="_blank" rel="noreferrer"><MapPin className="w-4 h-4" /> Ver no Maps</a>
                </Button>
                <Button size="sm" className="gap-1" onClick={() => toast.success('Clínica adicionada à rota da semana')}>
                  <Calendar className="w-4 h-4" /> Adicionar à Rota
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status de Ativação */}
        <Card className="shadow-sm">
          <CardHeader><CardTitle className="text-base">Status de Ativação</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {checklist.map(item => (
                <div key={item.label} className={`flex items-center gap-2 p-3 rounded-lg border ${item.done ? 'bg-green-50 border-green-200' : 'bg-muted/40'}`}>
                  {item.done
                    ? <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                    : <Clock className="w-5 h-5 text-muted-foreground shrink-0" />}
                  <p className="text-sm">{item.label}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              <span className="font-medium text-foreground">Dias até primeira simulação após cadastro:</span> 2 dias
            </p>
          </CardContent>
        </Card>

        {/* Simulações por recepcionista */}
        <Card className="shadow-sm">
          <CardHeader><CardTitle className="text-base">Simulações por Recepcionista · últimos 7 dias</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="text-left font-medium py-2">Recepcionista</th>
                  <th className="text-center font-medium py-2">Hoje</th>
                  <th className="text-center font-medium py-2">Ontem</th>
                  <th className="text-center font-medium py-2">Seg</th>
                  <th className="text-center font-medium py-2">Ter</th>
                  <th className="text-center font-medium py-2">Qua</th>
                  <th className="text-center font-medium py-2">Qui</th>
                  <th className="text-center font-medium py-2">Sex</th>
                  <th className="text-center font-medium py-2">Total</th>
                  <th className="text-center font-medium py-2">Tendência</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_RECEPTIONISTS_BASE.slice(0, Math.max(1, clinic.activeReceptionists || 1)).map(r => {
                  const total = r.today + r.yesterday + r.week.reduce((a, b) => a + b, 0);
                  return (
                    <tr key={r.name} className="border-b hover:bg-muted/30">
                      <td className="py-2 font-medium">{r.name}</td>
                      <td className="text-center">{r.today}</td>
                      <td className="text-center">{r.yesterday}</td>
                      {r.week.map((v, i) => <td key={i} className="text-center">{v}</td>)}
                      <td className="text-center font-semibold">{total}</td>
                      <td className="text-center"><span className="inline-flex justify-center">{TREND_ICON[r.trend]}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Gráfico de Tendência */}
        <Card className="shadow-sm">
          <CardHeader><CardTitle className="text-base">Tendência · últimos 14 dias</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={MOCK_TREND_14D}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                  <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <RTooltip />
                  <Line type="monotone" dataKey="simulacoes" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Histórico de visitas */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Histórico de Visitas do Representante</CardTitle>
            <Button size="sm" className="gap-1" onClick={() => setOpenNewVisit(true)}>
              <Plus className="w-4 h-4" /> Registrar Nova Visita
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {visits.map((v, i) => (
                <div key={i} className="p-3 rounded-lg border bg-card">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <p className="font-medium text-sm flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-primary" /> {v.date}
                    </p>
                    <Badge variant="outline" className="text-[10px]">{v.goal}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{v.result}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* New visit modal */}
        <Dialog open={openNewVisit} onOpenChange={setOpenNewVisit}>
          <DialogContent>
            <DialogHeader><DialogTitle>Registrar Nova Visita</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium">Data</label>
                <Input type="date" value={vDate} onChange={e => setVDate(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium">Objetivo</label>
                <Input value={vGoal} onChange={e => setVGoal(e.target.value)} placeholder="Ex: Treinar nova recepcionista" />
              </div>
              <div>
                <label className="text-xs font-medium">Resultado</label>
                <Textarea rows={3} value={vResult} onChange={e => setVResult(e.target.value)} placeholder="O que foi conversado e realizado..." />
              </div>
              <div>
                <label className="text-xs font-medium">Próximo passo</label>
                <Input value={vNext} onChange={e => setVNext(e.target.value)} placeholder="Ex: Retornar em 2 semanas" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpenNewVisit(false)}>Cancelar</Button>
              <Button onClick={handleSaveVisit} className="gap-1"><Save className="w-4 h-4" /> Salvar visita</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}