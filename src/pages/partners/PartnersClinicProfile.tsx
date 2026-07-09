import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  Phone, MapPin, Calendar, ArrowLeft, CheckCircle2, Clock, Plus,
  Building2, User, Save, Inbox, AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

interface ClinicRow {
  id: string;
  nome: string;
  tipo: string;
  bairro: string;
  cidade: string;
  telefone: string | null;
  responsavel: string | null;
  status: string;
  created_at: string;
  ultima_visita: string | null;
}

function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="text-center py-10 text-muted-foreground">
      <Inbox className="w-10 h-10 mx-auto mb-2 opacity-40" />
      <p className="text-sm font-medium">{title}</p>
      {hint && <p className="text-xs mt-1">{hint}</p>}
    </div>
  );
}

export default function PartnersClinicProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [clinic, setClinic] = useState<ClinicRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [visits, setVisits] = useState<Array<{ date: string; goal: string; result: string }>>([]);
  const [openNewVisit, setOpenNewVisit] = useState(false);
  const [vDate, setVDate] = useState('');
  const [vGoal, setVGoal] = useState('');
  const [vResult, setVResult] = useState('');
  const [vNext, setVNext] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      const { data, error: err } = await supabase
        .from('portfolio_clinics')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (err) setError(err.message);
      else setClinic(data as ClinicRow | null);
      setLoading(false);
    };
    load();
  }, [id]);

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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-40 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="text-center py-20">
          <AlertTriangle className="w-10 h-10 mx-auto mb-2 text-red-500 opacity-70" />
          <p className="text-sm font-medium text-red-700">Não foi possível carregar esta clínica</p>
          <p className="text-xs mt-1 text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate('/dashboard/partners/clinicas')}>Voltar</Button>
        </div>
      </DashboardLayout>
    );
  }

  if (!clinic) {
    return (
      <DashboardLayout>
        <div className="text-center py-20">
          <Inbox className="w-10 h-10 mx-auto mb-2 opacity-40 text-muted-foreground" />
          <p className="text-sm font-medium">Clínica não encontrada</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate('/dashboard/partners/clinicas')}>Voltar</Button>
        </div>
      </DashboardLayout>
    );
  }

  const clinicAddress = `${clinic.bairro}, ${clinic.cidade}`;
  const active = clinic.status === 'Ativo' || clinic.status === 'ativa' || clinic.status === 'ativo';
  const checklist = [
    { label: 'Clínica cadastrada', done: true },
    { label: 'Recepcionista treinada', done: false },
    { label: 'Primeiro CPF inserido', done: false },
    { label: 'Meta semanal atingida pela 1ª vez', done: active },
  ];
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clinicAddress)}`;

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
                    <h1 className="text-xl md:text-2xl font-bold text-foreground">{clinic.nome}</h1>
                    <Badge className={active ? 'bg-green-500 text-white border-0' : 'bg-red-500 text-white border-0'}>
                      {active ? 'Ativa' : clinic.status || 'Inativa'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{clinic.tipo}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 mt-3 text-sm">
                    <p className="flex items-center gap-1.5 text-muted-foreground"><MapPin className="w-3.5 h-3.5" /> {clinicAddress}</p>
                    <p className="flex items-center gap-1.5 text-muted-foreground"><Phone className="w-3.5 h-3.5" /> {clinic.telefone || '—'}</p>
                    <p className="flex items-center gap-1.5 text-muted-foreground"><User className="w-3.5 h-3.5" /> {clinic.responsavel || '—'}</p>
                    <p className="flex items-center gap-1.5 text-muted-foreground"><Calendar className="w-3.5 h-3.5" /> Cadastrada em {new Date(clinic.created_at).toLocaleDateString('pt-BR')}</p>
                    {clinic.ultima_visita && (
                      <p className="flex items-center gap-1.5 text-muted-foreground"><Clock className="w-3.5 h-3.5" /> Última visita: {new Date(clinic.ultima_visita).toLocaleDateString('pt-BR')}</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 shrink-0">
                {clinic.telefone && (
                  <Button variant="outline" size="sm" asChild className="gap-1">
                    <a href={`tel:${clinic.telefone.replace(/\D/g, '')}`}><Phone className="w-4 h-4" /> Ligar para Clínica</a>
                  </Button>
                )}
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
          </CardContent>
        </Card>

        {/* Simulações por recepcionista */}
        <Card className="shadow-sm">
          <CardHeader><CardTitle className="text-base">Simulações por Recepcionista · últimos 7 dias</CardTitle></CardHeader>
          <CardContent>
            <EmptyState
              title="Sem dados ainda — aguardando primeiro ciclo"
              hint="A produção por recepcionista será exibida após a integração com o fluxo de simulações da clínica."
            />
          </CardContent>
        </Card>

        {/* Gráfico de Tendência */}
        <Card className="shadow-sm">
          <CardHeader><CardTitle className="text-base">Tendência · últimos 14 dias</CardTitle></CardHeader>
          <CardContent>
            <EmptyState
              title="Sem simulações registradas para esta clínica"
              hint="O gráfico será populado quando houver métricas diárias vinculadas à clínica."
            />
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
            {visits.length === 0 ? (
              <EmptyState title="Nenhuma visita registrada ainda" hint="Use 'Registrar Nova Visita' para começar seu histórico." />
            ) : (<div className="space-y-2">
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
            </div>)}
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