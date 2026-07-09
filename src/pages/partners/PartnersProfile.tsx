import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Mail, Phone, FileText, MapPin, Save, Loader2, Pill, Wrench, HeartPulse, Megaphone, Star, Target, DollarSign, TrendingUp, Info, Building2, AlertTriangle, CheckCircle2, TrendingDown } from 'lucide-react';
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

        {showAnalytics && <RepresentativeAnalyticsSections />}
      </div>
    </DashboardLayout>
  );
}

/* ---------- Representative dashboard (mocked) ---------- */

const MOCK_WEEK_SIMULATIONS = [
  { week: 'Sem 1', simulacoes: 142 },
  { week: 'Sem 2', simulacoes: 168 },
  { week: 'Sem 3', simulacoes: 195 },
  { week: 'Sem 4', simulacoes: 221 },
];

const MOCK_WEEKLY_BREAKDOWN = [
  { sem: 'Sem 1', cadastradas: 1, ativadas: 0, simulacoes: 142, contratos: 0 },
  { sem: 'Sem 2', cadastradas: 1, ativadas: 1, simulacoes: 168, contratos: 1 },
  { sem: 'Sem 3', cadastradas: 1, ativadas: 1, simulacoes: 195, contratos: 0 },
  { sem: 'Sem 4', cadastradas: 0, ativadas: 0, simulacoes: 221, contratos: 2 },
];

const MOCK_CARTEIRA = {
  acimaMetaComSim: [
    { name: 'Clínica Dental Plus', simHoje: 62, meta: 50 },
    { name: 'OdontoVida Premium', simHoje: 35, meta: 30 },
    { name: 'Clínica Sorriso Mineiro', simHoje: 28, meta: 25 },
  ],
  abaixoMeta: [
    { name: 'Clínica BH Sorriso', simHoje: 18, meta: 25 },
    { name: 'Clínica Dental BH', simHoje: 12, meta: 20 },
  ],
  emAlerta: [
    { name: 'Centro Odonto Minas', motivo: 'Sem simulações há 3 dias' },
    { name: 'Clínica Saúde Total', motivo: 'Sem recepcionistas ativos' },
  ],
  aguardandoAtivacao: [
    { name: 'Dental Plus Centro', cadastradaEm: '26/06/2026' },
  ],
};

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

      {/* Bonificações */}
      <div>
        <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2"><DollarSign className="w-4 h-4 text-green-600" /> Minhas Bonificações</h2>
        <Card><CardContent className="pt-5">
          <p className="text-xs text-muted-foreground">Total acumulado no mês</p>
          <p className="text-xl font-bold text-muted-foreground">—</p>
          <p className="text-xs text-muted-foreground">Disponível após primeiro ciclo completo</p>
        </CardContent></Card>
      </div>

      <RepresentativeAnalyticsSections />
    </div>
  );
}

function RepresentativeAnalyticsSections() {
  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 flex items-start gap-2">
        <span className="text-amber-600 mt-0.5">⚠️</span>
        <div>
          <p className="text-sm font-medium text-amber-800">Dados demonstrativos</p>
          <p className="text-xs text-amber-700 mt-0.5">Metas, desempenho, carteira e gráfico abaixo são ilustrativos. Os valores reais serão populados automaticamente após os primeiros ciclos completos de simulação e comissão.</p>
        </div>
      </div>
      {/* Metas do mês */}
      <div>
        <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2"><Target className="w-4 h-4 text-primary" /> Minhas Metas do Mês</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card><CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">Cadastros</p>
            <p className="text-2xl font-bold">3<span className="text-sm text-muted-foreground font-normal"> / 5</span></p>
            <div className="h-1.5 bg-muted rounded-full mt-2 overflow-hidden"><div className="h-full bg-primary" style={{ width: '60%' }} /></div>
          </CardContent></Card>
          <Card><CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">Ativações</p>
            <p className="text-2xl font-bold">2<span className="text-sm text-muted-foreground font-normal"> / 5</span></p>
            <div className="h-1.5 bg-muted rounded-full mt-2 overflow-hidden"><div className="h-full bg-yellow-500" style={{ width: '40%' }} /></div>
          </CardContent></Card>
          <Card><CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">Clínicas acima da meta</p>
            <p className="text-2xl font-bold">60<span className="text-sm text-muted-foreground font-normal">%</span></p>
            <div className="h-1.5 bg-muted rounded-full mt-2 overflow-hidden"><div className="h-full bg-green-500" style={{ width: '60%' }} /></div>
          </CardContent></Card>
          <Card><CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">SEH atual</p>
            <p className="text-2xl font-bold">70.8</p>
            <div className="h-1.5 bg-muted rounded-full mt-2 overflow-hidden"><div className="h-full bg-blue-500" style={{ width: '70.8%' }} /></div>
          </CardContent></Card>
        </div>
      </div>

      {/* Desempenho */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" /> Meu Desempenho · últimas 4 semanas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MOCK_WEEK_SIMULATIONS}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <RTooltip />
                <Bar dataKey="simulacoes" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Desempenho Semana a Semana */}
      <div>
        <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" /> Desempenho Semana a Semana
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {MOCK_WEEKLY_BREAKDOWN.map(w => (
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
        </div>
      </div>

      {/* Clínicas da Minha Carteira */}
      <div>
        <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-primary" /> Clínicas da Minha Carteira
        </h2>
        <div className="space-y-3">
          <div className="rounded-lg border border-green-200 bg-green-50/40 p-3">
            <p className="text-xs font-semibold text-green-700 mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Ativas acima da meta ({MOCK_CARTEIRA.acimaMetaComSim.length})
            </p>
            <div className="space-y-1">
              {MOCK_CARTEIRA.acimaMetaComSim.map(c => (
                <div key={c.name} className="flex justify-between text-xs">
                  <span className="text-foreground">{c.name}</span>
                  <span className="text-green-700 font-medium">{c.simHoje} sim. / meta {c.meta}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-yellow-200 bg-yellow-50/40 p-3">
            <p className="text-xs font-semibold text-yellow-700 mb-2 flex items-center gap-1.5">
              <TrendingDown className="w-3.5 h-3.5" /> Ativas abaixo da meta ({MOCK_CARTEIRA.abaixoMeta.length})
            </p>
            <div className="space-y-1">
              {MOCK_CARTEIRA.abaixoMeta.map(c => (
                <div key={c.name} className="flex justify-between text-xs">
                  <span className="text-foreground">{c.name}</span>
                  <span className="text-yellow-700 font-medium">{c.simHoje} sim. / meta {c.meta}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-red-200 bg-red-50/40 p-3">
            <p className="text-xs font-semibold text-red-700 mb-2 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" /> Em alerta ({MOCK_CARTEIRA.emAlerta.length})
            </p>
            <div className="space-y-1">
              {MOCK_CARTEIRA.emAlerta.map(c => (
                <div key={c.name} className="flex justify-between text-xs">
                  <span className="text-foreground">{c.name}</span>
                  <span className="text-red-700 font-medium">{c.motivo}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-blue-200 bg-blue-50/40 p-3">
            <p className="text-xs font-semibold text-blue-700 mb-2 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" /> Aguardando ativação ({MOCK_CARTEIRA.aguardandoAtivacao.length})
            </p>
            <div className="space-y-1">
              {MOCK_CARTEIRA.aguardandoAtivacao.map(c => (
                <div key={c.name} className="flex justify-between text-xs">
                  <span className="text-foreground">{c.name}</span>
                  <span className="text-blue-700 font-medium">Cadastrada em {c.cadastradaEm}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
