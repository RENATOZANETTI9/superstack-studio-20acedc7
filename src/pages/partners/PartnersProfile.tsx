import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Mail, Phone, FileText, MapPin, Save, Loader2, Pill, Wrench, HeartPulse, Megaphone, Star, Target, DollarSign, TrendingUp, Info, Building2, AlertTriangle, CheckCircle2, Inbox } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip as RTooltip, CartesianGrid } from 'recharts';
import { isAdminRole } from '@/lib/partner-rules';

const isRepresentanteRole = (r: string | null | undefined) =>
  r === 'partner' || r === 'master_partner';

const CATEGORIAS: Record<string, { label: string; icon: any }> = {
  representante_farmaceutico: { label: 'Representante Farmacêutico', icon: Pill },
  equipamentos_cirurgias: { label: 'Equipamentos de Cirurgias', icon: Wrench },
  outros_saude: { label: 'Outros na Área de Saúde', icon: HeartPulse },
  gestor_trafego: { label: 'Gestor de Tráfego Médico', icon: Megaphone },
  creator_influencer: { label: 'Creator & Influencer', icon: Star },
};

export default function PartnersProfile() {
  const { user, role } = useAuth();
  const isAdmin = isAdminRole(role as any);
  const userName =
    (user?.user_metadata as any)?.full_name ||
    (user?.user_metadata as any)?.name ||
    (user?.email ? user.email.split('@')[0] : 'Parceiro');
  const userLocation =
    (user?.user_metadata as any)?.city && (user?.user_metadata as any)?.state
      ? `${(user?.user_metadata as any).city} / ${(user?.user_metadata as any).state}`
      : null;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [partner, setPartner] = useState<any>(null);

  const [legalName, setLegalName] = useState('');
  const [phone, setPhone] = useState('');
  const [regionState, setRegionState] = useState('');
  const [regionCity, setRegionCity] = useState('');

  useEffect(() => {
    if (!user) return;
    const fetchPartner = async () => {
      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data && !error) {
        setPartner(data);
        setLegalName(data.legal_name || '');
        setPhone(data.phone || '');
        setRegionState(data.region_state || '');
        setRegionCity(data.region_city || '');
      }
      setLoading(false);
    };
    fetchPartner();
  }, [user]);

  const handleSave = async () => {
    if (!partner) return;
    setSaving(true);
    const { error } = await supabase
      .from('partners')
      .update({
        legal_name: legalName.trim(),
        phone: phone.trim() || null,
        region_state: regionState.trim() || null,
        region_city: regionCity.trim() || null,
      })
      .eq('id', partner.id);

    if (error) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Perfil atualizado com sucesso!' });
    }
    setSaving(false);
  };

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const catInfo = partner?.categoria ? CATEGORIAS[partner.categoria] : null;
  const showAnalytics = isRepresentanteRole(role as any) && !isAdmin;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!partner) {
    return (
      <DashboardLayout>
        <RepresentativeDashboard isAdmin={isAdmin} userEmail={user?.email} userName={userName} userLocation={userLocation} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
            <User className="w-7 h-7 text-primary" />
            Meu Perfil
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Visualize e edite seus dados pessoais</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Info Card */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base">Informações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center">
                  <User className="w-10 h-10 text-white" />
                </div>
              </div>
              <div className="text-center space-y-1">
                <p className="font-semibold text-foreground">{partner.legal_name}</p>
                <p className="text-sm text-muted-foreground">{partner.email}</p>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Status</span>
                  <Badge variant={partner.status === 'ACTIVE' ? 'default' : 'secondary'}>
                    {partner.status === 'ACTIVE' ? 'Ativo' : partner.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Tipo</span>
                  <Badge variant="outline">
                    {partner.type === 'MASTER' ? 'Master Partner' : 'Partner'}
                  </Badge>
                </div>
                {catInfo && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Categoria</span>
                    <Badge variant="outline" className="gap-1">
                      <catInfo.icon className="w-3 h-3" />
                      {catInfo.label}
                    </Badge>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">CPF</span>
                  <span className="text-sm font-mono text-foreground">
                    {partner.document_number?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Edit Card */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Editar Dados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  Nome Completo
                </label>
                <Input value={legalName} onChange={(e) => setLegalName(e.target.value)} className="h-11" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  E-mail
                </label>
                <Input value={partner.email} disabled className="h-11 bg-muted" />
                <p className="text-xs text-muted-foreground">O e-mail não pode ser alterado.</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  WhatsApp
                </label>
                <Input
                  value={formatPhone(phone)}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="(11) 99999-9999"
                  className="h-11"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    Estado
                  </label>
                  <Input value={regionState} onChange={(e) => setRegionState(e.target.value)} placeholder="SP" className="h-11" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    Cidade
                  </label>
                  <Input value={regionCity} onChange={(e) => setRegionCity(e.target.value)} placeholder="São Paulo" className="h-11" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  Categoria de Atuação
                </label>
                <Input
                  value={catInfo?.label || partner.categoria || 'Não definida'}
                  disabled
                  className="h-11 bg-muted"
                />
                <p className="text-xs text-muted-foreground">A categoria é definida no cadastro e não pode ser alterada.</p>
              </div>

              <div className="pt-2">
                <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Salvar Alterações
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {showAnalytics && <RepresentativeAnalyticsSections partnerId={partner.id} />}
      </div>
    </DashboardLayout>
  );
}

/* ---------- Representative dashboard (real data) ---------- */

function RepresentativeDashboard({ isAdmin, userEmail, userName, userLocation }: { isAdmin: boolean; userEmail?: string | null; userName: string; userLocation: string | null }) {
  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
            <User className="w-7 h-7 text-primary" />
            Meu Perfil
          </h1>
        </div>
        <Card className="border-yellow-300 bg-yellow-50">
          <CardContent className="pt-6 flex items-start gap-3">
            <Info className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-900">Seu perfil de representante ainda não foi vinculado.</p>
              <p className="text-sm text-yellow-800 mt-1">Fale com o administrador para vincular seu cadastro de partner. Assim que vinculado, você verá aqui suas metas, desempenho e visitas.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-primary/10 via-secondary/5 to-transparent">
        <CardContent className="pt-6 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center shrink-0">
            <User className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl md:text-2xl font-bold text-foreground">{userName}</h1>
            <p className="text-sm text-muted-foreground">{userEmail || ''}</p>
            <div className="flex gap-2 mt-2 flex-wrap">
              <Badge variant="outline">Partner</Badge>
              <Badge variant="outline" className="gap-1"><MapPin className="w-3 h-3" /> {userLocation || 'Localização não informada'}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <RepresentativeAnalyticsSections partnerId={null} />
    </div>
  );
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

type WeekBucket = { key: string; label: string; start: Date; end: Date };

function buildLast4Weeks(): WeekBucket[] {
  const now = new Date();
  const buckets: WeekBucket[] = [];
  // Weeks anchored on Monday, last 4 including current
  const day = now.getDay();
  const diffToMonday = (day + 6) % 7;
  const thisMonday = new Date(now);
  thisMonday.setHours(0, 0, 0, 0);
  thisMonday.setDate(thisMonday.getDate() - diffToMonday);
  for (let i = 3; i >= 0; i--) {
    const start = new Date(thisMonday);
    start.setDate(start.getDate() - i * 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    buckets.push({ key: `w${3 - i}`, label: `Sem ${4 - i}`, start, end });
  }
  return buckets;
}

function RepresentativeAnalyticsSections({ partnerId }: { partnerId: string | null }) {
  const [loading, setLoading] = useState(true);
  const [commissionAmount, setCommissionAmount] = useState<number>(0);
  const [hasCommissionCycle, setHasCommissionCycle] = useState(false);
  const [clinics, setClinics] = useState<any[]>([]);
  const [dailyMetrics, setDailyMetrics] = useState<any[]>([]);

  const weeks = useMemo(() => buildLast4Weeks(), []);

  useEffect(() => {
    if (!partnerId) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const now = new Date();
      const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const start28 = new Date(now);
      start28.setDate(start28.getDate() - 28);

      const [commRes, clinicsRes, metricsRes] = await Promise.all([
        supabase
          .from('partner_commissions')
          .select('commission_amount, status, reference_month')
          .eq('beneficiary_partner_id', partnerId)
          .eq('reference_month', monthKey)
          .in('status', ['PAID', 'APPROVED']),
        supabase
          .from('portfolio_clinics')
          .select('id, nome, status, created_at, updated_at, ultima_visita')
          .eq('partner_id', partnerId),
        supabase
          .from('partner_metrics_daily')
          .select('metric_date, consultations, paid_contracts, active_clinics, total_clinics_direct')
          .eq('partner_id', partnerId)
          .gte('metric_date', start28.toISOString().slice(0, 10))
          .order('metric_date', { ascending: true }),
      ]);

      if (cancelled) return;
      const commRows = commRes.data ?? [];
      setHasCommissionCycle(commRows.length > 0);
      setCommissionAmount(commRows.reduce((s: number, r: any) => s + Number(r.commission_amount || 0), 0));
      setClinics(clinicsRes.data ?? []);
      setDailyMetrics(metricsRes.data ?? []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [partnerId]);

  const weekChart = useMemo(() =>
    weeks.map(w => {
      const sum = dailyMetrics.reduce((acc, m) => {
        const d = new Date(m.metric_date);
        return d >= w.start && d < w.end ? acc + Number(m.consultations || 0) : acc;
      }, 0);
      return { week: w.label, simulacoes: sum };
    }), [weeks, dailyMetrics]);

  const weeklyBreakdown = useMemo(() =>
    weeks.map(w => {
      const cadastradas = clinics.filter(c => {
        const d = new Date(c.created_at); return d >= w.start && d < w.end;
      }).length;
      const ativadas = clinics.filter(c => {
        if (c.status !== 'Ativo') return false;
        const d = new Date(c.updated_at); return d >= w.start && d < w.end;
      }).length;
      const simulacoes = dailyMetrics.reduce((acc, m) => {
        const d = new Date(m.metric_date);
        return d >= w.start && d < w.end ? acc + Number(m.consultations || 0) : acc;
      }, 0);
      const contratos = dailyMetrics.reduce((acc, m) => {
        const d = new Date(m.metric_date);
        return d >= w.start && d < w.end ? acc + Number(m.paid_contracts || 0) : acc;
      }, 0);
      return { sem: w.label, cadastradas, ativadas, simulacoes, contratos };
    }), [weeks, clinics, dailyMetrics]);

  const chartHasData = weekChart.some(w => w.simulacoes > 0);
  const breakdownHasData = weeklyBreakdown.some(w => w.cadastradas || w.ativadas || w.simulacoes || w.contratos);

  // Metas do mês (real progress vs. default target 5)
  const startOfMonth = useMemo(() => {
    const d = new Date(); d.setDate(1); d.setHours(0,0,0,0); return d;
  }, []);
  const cadastradasMes = clinics.filter(c => new Date(c.created_at) >= startOfMonth).length;
  const ativadasMes = clinics.filter(c => c.status === 'Ativo' && new Date(c.updated_at) >= startOfMonth).length;
  const metaCadastros = 5;
  const metaAtivacoes = 5;

  // Carteira grouped by real status
  const ativas = clinics.filter(c => c.status === 'Ativo');
  const leads = clinics.filter(c => c.status === 'Lead');
  const inativas = clinics.filter(c => c.status === 'Inativo');
  const hasClinics = clinics.length > 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Bonificações reais */}
      <div>
        <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2"><DollarSign className="w-4 h-4 text-green-600" /> Minhas Bonificações</h2>
        <Card><CardContent className="pt-5">
          <p className="text-xs text-muted-foreground">Total acumulado no mês (PAID + APPROVED)</p>
          {hasCommissionCycle ? (
            <p className="text-2xl font-bold text-green-600">
              {commissionAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          ) : (
            <>
              <p className="text-xl font-bold text-muted-foreground">—</p>
              <p className="text-xs text-muted-foreground">Disponível após primeiro ciclo completo</p>
            </>
          )}
        </CardContent></Card>
      </div>

      {/* Metas do mês */}
      <div>
        <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2"><Target className="w-4 h-4 text-primary" /> Minhas Metas do Mês</h2>
        {!hasClinics ? (
          <Card><CardContent className="pt-5"><EmptyState title="Sem dados ainda — aguardando primeiro ciclo" hint="Suas metas aparecerão assim que você tiver clínicas na carteira." /></CardContent></Card>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-2 gap-3">
            <Card><CardContent className="pt-5">
              <p className="text-xs text-muted-foreground">Cadastros (mês)</p>
              <p className="text-2xl font-bold">{cadastradasMes}<span className="text-sm text-muted-foreground font-normal"> / {metaCadastros}</span></p>
              <div className="h-1.5 bg-muted rounded-full mt-2 overflow-hidden"><div className="h-full bg-primary" style={{ width: `${Math.min(100, (cadastradasMes / metaCadastros) * 100)}%` }} /></div>
            </CardContent></Card>
            <Card><CardContent className="pt-5">
              <p className="text-xs text-muted-foreground">Ativações (mês)</p>
              <p className="text-2xl font-bold">{ativadasMes}<span className="text-sm text-muted-foreground font-normal"> / {metaAtivacoes}</span></p>
              <div className="h-1.5 bg-muted rounded-full mt-2 overflow-hidden"><div className="h-full bg-yellow-500" style={{ width: `${Math.min(100, (ativadasMes / metaAtivacoes) * 100)}%` }} /></div>
            </CardContent></Card>
          </div>
        )}
      </div>

      {/* Desempenho */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" /> Meu Desempenho · últimas 4 semanas</CardTitle>
        </CardHeader>
        <CardContent>
          {chartHasData ? (<div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <RTooltip />
                <Bar dataKey="simulacoes" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>) : (
            <EmptyState title="Sem simulações registradas nas últimas 4 semanas" hint="O gráfico será populado a partir das métricas diárias da sua carteira." />
          )}
        </CardContent>
      </Card>

      {/* Desempenho Semana a Semana */}
      <div>
        <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" /> Desempenho Semana a Semana
        </h2>
        {!breakdownHasData ? (
          <Card><CardContent className="pt-5"><EmptyState title="Sem dados ainda — aguardando primeiro ciclo" /></CardContent></Card>
        ) : (<div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {weeklyBreakdown.map(w => (
            <Card key={w.sem}>
              <CardContent className="pt-4">
                <p className="text-xs font-bold text-primary mb-3 uppercase tracking-wide">{w.sem}</p>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Cadastradas</span>
                    <span className="font-semibold">{w.cadastradas}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Ativadas</span>
                    <span className="font-semibold">{w.ativadas}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Simulações</span>
                    <span className="font-semibold">{w.simulacoes}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Contratos</span>
                    <span className="font-semibold">{w.contratos}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>)}
      </div>

      {/* Clínicas da Minha Carteira */}
      <div>
        <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-primary" /> Clínicas da Minha Carteira
        </h2>
        {!hasClinics ? (
          <Card><CardContent className="pt-5"><EmptyState title="Nenhuma clínica vinculada ainda" hint="Cadastre clínicas em 'Minhas Clínicas' para acompanhar a carteira." /></CardContent></Card>
        ) : (<div className="space-y-3">
          <div className="rounded-lg border border-green-200 bg-green-50/40 p-3">
            <p className="text-xs font-semibold text-green-700 mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Ativas ({ativas.length})
            </p>
            <div className="space-y-1">
              {ativas.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">Nenhuma clínica ativa no momento.</p>
              ) : ativas.map(c => (
                <div key={c.id} className="flex justify-between text-xs">
                  <span className="text-foreground">{c.nome}</span>
                  <span className="text-green-700 font-medium">Ativa</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-red-200 bg-red-50/40 p-3">
            <p className="text-xs font-semibold text-red-700 mb-2 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" /> Inativas ({inativas.length})
            </p>
            <div className="space-y-1">
              {inativas.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">Nenhuma clínica inativa.</p>
              ) : inativas.map(c => (
                <div key={c.id} className="flex justify-between text-xs">
                  <span className="text-foreground">{c.nome}</span>
                  <span className="text-red-700 font-medium">Inativa</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-blue-200 bg-blue-50/40 p-3">
            <p className="text-xs font-semibold text-blue-700 mb-2 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" /> Aguardando ativação · Leads ({leads.length})
            </p>
            <div className="space-y-1">
              {leads.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">Nenhum lead pendente.</p>
              ) : leads.map(c => (
                <div key={c.id} className="flex justify-between text-xs">
                  <span className="text-foreground">{c.nome}</span>
                  <span className="text-blue-700 font-medium">Cadastrada em {new Date(c.created_at).toLocaleDateString('pt-BR')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>)}
      </div>
    </div>
  );
}
