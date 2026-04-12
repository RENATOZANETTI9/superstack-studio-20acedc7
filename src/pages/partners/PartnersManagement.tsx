import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { MOCK_PARTNERS, MOCK_CLINICS, MOCK_LINKS, MOCK_NETWORK, withMockFallback } from '@/lib/mock-data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, UserPlus, Link2, Copy, ChevronDown, ChevronUp, Filter, Calendar, Pencil, Power, PowerOff, Info, Users, Building2, TrendingUp, Eye } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { TYPE_COLORS, STATUS_LABELS, isAdminRole, canEditPartner, PARTNER_RULES, formatCurrency } from '@/lib/partner-rules';

const PartnersManagement = () => {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const isAdmin = isAdminRole(role as any);
  
  const [partners, setPartners] = useState<any[]>([]);
  const [clinics, setClinics] = useState<any[]>([]);
  const [links, setLinks] = useState<any[]>([]);
  const [network, setNetwork] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterMinClinics, setFilterMinClinics] = useState('');
  const [filterClinicStatus, setFilterClinicStatus] = useState('ALL');
  const [filterMinConsultas, setFilterMinConsultas] = useState('');
  const [filterClinicActivity, setFilterClinicActivity] = useState('ALL');
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<any>(null);
  const [expandedPartner, setExpandedPartner] = useState<string | null>(null);
  const [detailPartner, setDetailPartner] = useState<any>(null);
  const [form, setForm] = useState({
    person_type: 'CPF', document_number: '', legal_name: '', email: '', phone: '',
    region_state: '', region_city: '', years_in_health_market: 0, monthly_relationship_clinics: 0,
  });
  const [editForm, setEditForm] = useState({ ...form });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const [pRes, cRes, lRes, nRes] = await Promise.all([
      supabase.from('partners').select('*').order('created_at', { ascending: false }),
      supabase.from('partner_clinic_relations').select('*'),
      supabase.from('partner_links').select('*'),
      supabase.from('partner_network').select('*'),
    ]);
    setPartners(withMockFallback(pRes.data, MOCK_PARTNERS));
    setClinics(withMockFallback(cRes.data, MOCK_CLINICS));
    setLinks(withMockFallback(lRes.data, MOCK_LINKS));
    setNetwork(withMockFallback(nRes.data, MOCK_NETWORK));
    setLoading(false);
  };

  const getPartnerClinics = (partnerId: string) => clinics.filter(c => c.partner_id === partnerId);
  const getPartnerLinks = (partnerId: string) => links.filter(l => l.partner_id === partnerId);
  const getActiveClinicsCount = (partnerId: string) => getPartnerClinics(partnerId).filter(c => c.is_active).length;
  const getNetworkChildren = (partnerId: string) => network.filter(n => n.parent_partner_id === partnerId);
  const getPartnerById = (id: string) => partners.find(p => p.id === id);

  const handleCreate = async () => {
    if (!form.legal_name || !form.email || !form.document_number) {
      toast({ title: 'Preencha os campos obrigatórios', variant: 'destructive' });
      return;
    }
    const { error } = await supabase.from('partners').insert({
      ...form, type: 'PARTNER', user_id: user!.id, status: 'PENDING',
    });
    if (error) {
      toast({ title: 'Erro ao criar partner', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Partner criado com sucesso!' });
      setDialogOpen(false);
      setForm({ person_type: 'CPF', document_number: '', legal_name: '', email: '', phone: '', region_state: '', region_city: '', years_in_health_market: 0, monthly_relationship_clinics: 0 });
      fetchData();
    }
  };

  const openEditDialog = (partner: any) => {
    setEditingPartner(partner);
    setEditForm({
      person_type: partner.person_type || 'CPF', document_number: partner.document_number || '',
      legal_name: partner.legal_name || '', email: partner.email || '', phone: partner.phone || '',
      region_state: partner.region_state || '', region_city: partner.region_city || '',
      years_in_health_market: partner.years_in_health_market || 0, monthly_relationship_clinics: partner.monthly_relationship_clinics || 0,
    });
    setEditDialogOpen(true);
  };

  const handleEdit = async () => {
    if (!editingPartner) return;
    const { error } = await supabase.from('partners').update({ ...editForm }).eq('id', editingPartner.id);
    if (error) {
      toast({ title: 'Erro ao atualizar', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Partner atualizado!' });
      setEditDialogOpen(false);
      setEditingPartner(null);
      fetchData();
    }
  };

  const togglePartnerStatus = async (partner: any) => {
    const newStatus = partner.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    const updates: any = { status: newStatus };
    if (newStatus === 'ACTIVE') { updates.activated_at = new Date().toISOString(); updates.suspended_at = null; }
    else { updates.suspended_at = new Date().toISOString(); }
    const { error } = await supabase.from('partners').update(updates).eq('id', partner.id);
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); }
    else { toast({ title: `Partner ${newStatus === 'ACTIVE' ? 'ativado' : 'desativado'}!` }); fetchData(); }
  };

  const copyToClipboard = (text: string) => { navigator.clipboard.writeText(text); toast({ title: 'Link copiado!' }); };

  const filtered = partners.filter(p => {
    const matchSearch = !search || p.legal_name?.toLowerCase().includes(search.toLowerCase()) || p.email?.toLowerCase().includes(search.toLowerCase()) || p.document_number?.includes(search) || p.phone?.includes(search);
    const matchType = filterType === 'ALL' || p.type === filterType;
    const matchStatus = filterStatus === 'ALL' || p.status === filterStatus;
    const pClinics = getPartnerClinics(p.id);
    const activeClinicsCount = pClinics.filter(c => c.is_active).length;
    const inactiveClinicsCount = pClinics.filter(c => !c.is_active).length;
    const matchMinClinics = !filterMinClinics || pClinics.length >= Number(filterMinClinics);
    const matchClinicStatus = filterClinicStatus === 'ALL' || 
      (filterClinicStatus === 'ONLY_ACTIVE' && activeClinicsCount > 0) ||
      (filterClinicStatus === 'ONLY_INACTIVE' && inactiveClinicsCount > 0) ||
      (filterClinicStatus === 'HAS_BOTH' && activeClinicsCount > 0 && inactiveClinicsCount > 0);
    const totalConsultas = pClinics.reduce((s, c) => s + (c.consultations_count || 0), 0);
    const matchMinConsultas = !filterMinConsultas || totalConsultas >= Number(filterMinConsultas);
    const totalPaidCount = pClinics.reduce((s, c) => s + (c.paid_count || 0), 0);
    const matchClinicActivity = filterClinicActivity === 'ALL' ||
      (filterClinicActivity === 'SIMULATED' && totalConsultas > 0) ||
      (filterClinicActivity === 'PAID' && totalPaidCount > 0);
    const matchDateFrom = !dateFrom || new Date(p.created_at) >= dateFrom;
    const matchDateTo = !dateTo || new Date(p.created_at) <= new Date(dateTo.getTime() + 86400000);
    return matchSearch && matchType && matchStatus && matchMinClinics && matchClinicStatus && matchMinConsultas && matchClinicActivity && matchDateFrom && matchDateTo;
  });

  // Render Master Partner detail - focus on indicated partners, not clinics directly
  const renderMasterPartnerDetail = (p: any) => {
    const childRels = getNetworkChildren(p.id);
    const childPartners = childRels.map(r => ({ ...getPartnerById(r.child_partner_id), rel: r })).filter(cp => cp.id);
    const activeChildren = childPartners.filter(cp => cp.rel.is_active && cp.status === 'ACTIVE');
    const inactiveChildren = childPartners.filter(cp => !cp.rel.is_active || cp.status !== 'ACTIVE');
    
    // Aggregate metrics from all indicated partners
    const networkClinics = childPartners.flatMap(cp => getPartnerClinics(cp.id));
    const networkActiveClinics = networkClinics.filter(c => c.is_active);
    const networkConsultations = networkClinics.reduce((s, c) => s + (c.consultations_count || 0), 0);
    const networkApprovals = networkClinics.reduce((s, c) => s + (c.approvals_count || 0), 0);
    const networkPaid = networkClinics.reduce((s, c) => s + (c.paid_count || 0), 0);

    return (
      <div className="space-y-4">
        {/* Network Summary */}
        <div>
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <Users className="h-4 w-4 text-purple-500" /> Resumo da Rede Indicada
            <Tooltip><TooltipTrigger><Info className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
              <TooltipContent className="max-w-[250px]"><p className="text-xs">Para Master Partners, o foco principal é a rede de partners indicados. Os dados abaixo mostram a produtividade agregada de todos os partners da rede.</p></TooltipContent>
            </Tooltip>
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-purple-500/10 text-center">
              <p className="text-lg font-bold text-purple-700">{activeChildren.length}</p>
              <p className="text-xs text-muted-foreground">Partners Ativos</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 text-center">
              <p className="text-lg font-bold text-muted-foreground">{inactiveChildren.length}</p>
              <p className="text-xs text-muted-foreground">Partners Inativos</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 text-center">
              <p className="text-lg font-bold">{childPartners.length}</p>
              <p className="text-xs text-muted-foreground">Total Indicados</p>
            </div>
            <div className="p-3 rounded-lg bg-green-500/10 text-center">
              <p className="text-lg font-bold text-green-600">{networkActiveClinics.length}</p>
              <p className="text-xs text-muted-foreground">Clínicas da Rede</p>
            </div>
          </div>
        </div>

        {/* Network production */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-muted/50 text-center">
            <p className="text-lg font-bold">{networkConsultations}</p>
            <p className="text-xs text-muted-foreground">Consultas Rede</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50 text-center">
            <p className="text-lg font-bold">{networkApprovals}</p>
            <p className="text-xs text-muted-foreground">Aprovados Rede</p>
          </div>
          <div className="p-3 rounded-lg bg-green-500/10 text-center">
            <p className="text-lg font-bold text-green-600">{networkPaid}</p>
            <p className="text-xs text-muted-foreground">Pagos Rede</p>
          </div>
        </div>

        {/* Indicated partners table */}
        <Tabs defaultValue="ativos">
          <TabsList className="h-8">
            <TabsTrigger value="ativos" className="text-xs">Partners Ativos ({activeChildren.length})</TabsTrigger>
            <TabsTrigger value="inativos" className="text-xs">Inativos ({inactiveChildren.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="ativos">
            {activeChildren.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Nenhum partner ativo na rede. Partners indicados por este Master aparecerão aqui.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b text-left">
                    <th className="pb-2 text-xs font-medium">Partner</th>
                    <th className="pb-2 text-xs font-medium">Telefone</th>
                    <th className="pb-2 text-xs font-medium">Status</th>
                    <th className="pb-2 text-xs font-medium">Cadastro</th>
                    <th className="pb-2 text-xs font-medium">Clínicas</th>
                    <th className="pb-2 text-xs font-medium">Consultas</th>
                    <th className="pb-2 text-xs font-medium">Aprovados</th>
                    <th className="pb-2 text-xs font-medium">Pagos</th>
                  </tr></thead>
                  <tbody>
                    {activeChildren.map(cp => {
                      const cpClinics = getPartnerClinics(cp.id);
                      const cpActive = cpClinics.filter(c => c.is_active).length;
                      const cpInactive = cpClinics.filter(c => !c.is_active).length;
                      return (
                        <tr key={cp.id} className="border-b hover:bg-accent/30">
                          <td className="py-2"><p className="font-medium">{cp.legal_name}</p><p className="text-xs text-muted-foreground">{cp.email}</p></td>
                          <td className="py-2 text-xs">{cp.phone || '—'}</td>
                          <td className="py-2"><Badge variant="default" className="text-[10px]">{STATUS_LABELS[cp.status] || cp.status}</Badge></td>
                          <td className="py-2 text-xs">{new Date(cp.created_at).toLocaleDateString('pt-BR')}</td>
                          <td className="py-2 text-xs">{cpActive} ativas / {cpInactive} inativas</td>
                          <td className="py-2">{cpClinics.reduce((s, c) => s + (c.consultations_count || 0), 0)}</td>
                          <td className="py-2">{cpClinics.reduce((s, c) => s + (c.approvals_count || 0), 0)}</td>
                          <td className="py-2 font-medium text-green-600">{cpClinics.reduce((s, c) => s + (c.paid_count || 0), 0)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>
          <TabsContent value="inativos">
            {inactiveChildren.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Nenhum partner inativo na rede.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b text-left">
                    <th className="pb-2 text-xs font-medium">Partner</th>
                    <th className="pb-2 text-xs font-medium">Status</th>
                    <th className="pb-2 text-xs font-medium">Clínicas</th>
                  </tr></thead>
                  <tbody>
                    {inactiveChildren.map(cp => (
                      <tr key={cp.id} className="border-b text-muted-foreground">
                        <td className="py-2">{cp.legal_name}</td>
                        <td className="py-2"><Badge variant="secondary" className="text-[10px]">{STATUS_LABELS[cp.status] || cp.status}</Badge></td>
                        <td className="py-2 text-xs">{getPartnerClinics(cp.id).length} clínicas</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  // Render common Partner detail - focus on clinics
  const renderPartnerClinicsDetail = (p: any) => {
    const pClinics = getPartnerClinics(p.id);
    const activeClinics = pClinics.filter(c => c.is_active);
    const inactiveClinics = pClinics.filter(c => !c.is_active);
    const totalConsultations = pClinics.reduce((s, c) => s + (c.consultations_count || 0), 0);
    const totalApprovals = pClinics.reduce((s, c) => s + (c.approvals_count || 0), 0);
    const totalPaid = pClinics.reduce((s, c) => s + (c.paid_count || 0), 0);
    const convApproval = totalConsultations > 0 ? ((totalApprovals / totalConsultations) * 100).toFixed(1) : '0';
    const convPaid = totalApprovals > 0 ? ((totalPaid / totalApprovals) * 100).toFixed(1) : '0';

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          <div className="p-3 rounded-lg bg-muted/50 text-center">
            <p className="text-lg font-bold">{pClinics.length}</p>
            <p className="text-xs text-muted-foreground">Total Clínicas</p>
          </div>
          <div className="p-3 rounded-lg bg-green-500/10 text-center">
            <p className="text-lg font-bold text-green-600">{activeClinics.length}</p>
            <p className="text-xs text-muted-foreground">Ativas</p>
          </div>
          <div className="p-3 rounded-lg bg-red-500/10 text-center">
            <p className="text-lg font-bold text-red-600">{inactiveClinics.length}</p>
            <p className="text-xs text-muted-foreground">Inativas</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50 text-center">
            <p className="text-lg font-bold">{totalConsultations}</p>
            <p className="text-xs text-muted-foreground">Consultas</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50 text-center">
            <p className="text-lg font-bold">{totalApprovals}</p>
            <p className="text-xs text-muted-foreground">Aprovados</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50 text-center">
            <p className="text-lg font-bold">{totalPaid}</p>
            <p className="text-xs text-muted-foreground">Pagos</p>
          </div>
          <div className="p-3 rounded-lg bg-blue-500/10 text-center">
            <p className="text-lg font-bold text-blue-600">{convApproval}%</p>
            <p className="text-xs text-muted-foreground">Conversão</p>
          </div>
        </div>

        <Tabs defaultValue="ativas">
          <TabsList className="h-8">
            <TabsTrigger value="ativas" className="text-xs">Clínicas Ativas ({activeClinics.length})</TabsTrigger>
            <TabsTrigger value="inativas" className="text-xs">Inativas ({inactiveClinics.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="ativas">
            {activeClinics.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Nenhuma clínica ativa vinculada a este partner.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b text-left">
                    <th className="pb-2 text-xs font-medium">Clínica</th>
                    <th className="pb-2 text-xs font-medium">Consultas</th>
                    <th className="pb-2 text-xs font-medium">Aprovados</th>
                    <th className="pb-2 text-xs font-medium">Pagos</th>
                    <th className="pb-2 text-xs font-medium flex items-center gap-1">
                      Qualificada
                      <Tooltip><TooltipTrigger><Info className="h-3 w-3" /></TooltipTrigger>
                        <TooltipContent><p className="text-xs max-w-[200px]">Uma clínica é qualificada quando atinge {PARTNER_RULES.QUALIFICATION_THRESHOLD}+ consultas no período. Este valor é configurável.</p></TooltipContent>
                      </Tooltip>
                    </th>
                  </tr></thead>
                  <tbody>
                    {activeClinics.map(c => (
                      <tr key={c.id} className="border-b">
                        <td className="py-2"><p className="font-medium">{c.clinic_name}</p><p className="text-xs text-muted-foreground">{c.clinic_external_id}</p></td>
                        <td className="py-2">{c.consultations_count}</td>
                        <td className="py-2">{c.approvals_count}</td>
                        <td className="py-2 font-medium text-green-600">{c.paid_count}</td>
                        <td className="py-2">{c.is_qualified ? <Badge className="bg-green-100 text-green-800 text-xs">Sim</Badge> : <Badge variant="secondary" className="text-xs">Não</Badge>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>
          <TabsContent value="inativas">
            {inactiveClinics.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Nenhuma clínica inativa.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b text-left">
                    <th className="pb-2 text-xs font-medium">Clínica</th>
                    <th className="pb-2 text-xs font-medium">Consultas</th>
                    <th className="pb-2 text-xs font-medium">Aprovados</th>
                    <th className="pb-2 text-xs font-medium">Pagos</th>
                  </tr></thead>
                  <tbody>
                    {inactiveClinics.map(c => (
                      <tr key={c.id} className="border-b text-muted-foreground">
                        <td className="py-2"><p>{c.clinic_name}</p><p className="text-xs">{c.clinic_external_id}</p></td>
                        <td className="py-2">{c.consultations_count}</td>
                        <td className="py-2">{c.approvals_count}</td>
                        <td className="py-2">{c.paid_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <UserPlus className="h-6 w-6" /> Cadastro de Partners
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerenciar parceiros Help Ude, suas clínicas e redes vinculadas.
              {!isAdmin && ' Você pode visualizar os cadastros, mas a edição é restrita ao administrador.'}
            </p>
          </div>
          {isAdmin && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" /> Cadastrar Novo Partner</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Cadastrar Novo Partner</DialogTitle>
                  <DialogDescription>Preencha os dados do novo parceiro. Todo partner é cadastrado como Partner Comum.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-sm text-foreground">
                    <p>💡 Todo partner é cadastrado como <strong>Partner</strong>. A promoção a <strong>Master Partner</strong> é automática quando sua rede atinge <strong>R$ {PARTNER_RULES.MASTER_PROMOTION_THRESHOLD_AMOUNT.toLocaleString('pt-BR')}</strong> em créditos pagos para procedimentos. Ao se tornar Master, um link de recrutamento de partners é gerado automaticamente.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Tipo de Pessoa</Label>
                      <Select value={form.person_type} onValueChange={v => setForm({...form, person_type: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="CPF">CPF</SelectItem><SelectItem value="CNPJ">CNPJ</SelectItem></SelectContent>
                      </Select>
                    </div>
                    <div><Label>Documento *</Label><Input value={form.document_number} onChange={e => setForm({...form, document_number: e.target.value})} placeholder="000.000.000-00" /></div>
                  </div>
                  <div><Label>Nome / Razão Social *</Label><Input value={form.legal_name} onChange={e => setForm({...form, legal_name: e.target.value})} placeholder="Nome completo" /></div>
                  <div><Label>E-mail *</Label><Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="email@exemplo.com" /></div>
                  <div><Label>Telefone</Label><Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="+55 71 99999-0000" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Estado</Label><Input value={form.region_state} onChange={e => setForm({...form, region_state: e.target.value})} placeholder="BA" /></div>
                    <div><Label>Cidade</Label><Input value={form.region_city} onChange={e => setForm({...form, region_city: e.target.value})} placeholder="Salvador" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Anos no mercado</Label><Input type="number" value={form.years_in_health_market} onChange={e => setForm({...form, years_in_health_market: Number(e.target.value)})} /></div>
                    <div><Label>Clínicas/mês</Label><Input type="number" value={form.monthly_relationship_clinics} onChange={e => setForm({...form, monthly_relationship_clinics: Number(e.target.value)})} /></div>
                  </div>
                  <Button onClick={handleCreate} className="w-full"><UserPlus className="h-4 w-4 mr-2" /> Cadastrar Partner</Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filtros avançados</span>
              <Tooltip><TooltipTrigger><Info className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                <TooltipContent><p className="text-xs max-w-[200px]">Use os filtros para encontrar partners por nome, tipo, status, período de cadastro, volume de clínicas ou consultas.</p></TooltipContent>
              </Tooltip>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Nome, e-mail, documento, telefone..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos os Tipos</SelectItem>
                  <SelectItem value="PARTNER">Partner Comum</SelectItem>
                  <SelectItem value="MASTER">Master Partner</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos Status</SelectItem>
                  <SelectItem value="ACTIVE">Ativo</SelectItem>
                  <SelectItem value="PENDING">Pendente</SelectItem>
                  <SelectItem value="SUSPENDED">Suspenso</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterClinicStatus} onValueChange={setFilterClinicStatus}>
                <SelectTrigger><SelectValue placeholder="Clínicas" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todas Clínicas</SelectItem>
                  <SelectItem value="ONLY_ACTIVE">Com Clínicas Ativas</SelectItem>
                  <SelectItem value="ONLY_INACTIVE">Com Clínicas Inativas</SelectItem>
                  <SelectItem value="HAS_BOTH">Ativas e Inativas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
              <Select value={filterClinicActivity} onValueChange={setFilterClinicActivity}>
                <SelectTrigger><SelectValue placeholder="Clínicas por atividade" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos</SelectItem>
                  <SelectItem value="PAID">Pagos</SelectItem>
                  <SelectItem value="SIMULATED">Simulados</SelectItem>
                </SelectContent>
              </Select>
              <Input placeholder="Mín. clínicas vinculadas" type="number" value={filterMinClinics} onChange={e => setFilterMinClinics(e.target.value)} />
              <Input placeholder="Mín. consultas no período" type="number" value={filterMinConsultas} onChange={e => setFilterMinConsultas(e.target.value)} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("justify-start text-left font-normal", !dateFrom && "text-muted-foreground")}>
                    <Calendar className="mr-2 h-4 w-4" />{dateFrom ? format(dateFrom, "dd/MM/yyyy") : "Data início"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent mode="single" selected={dateFrom} onSelect={setDateFrom} className="p-3 pointer-events-auto" locale={ptBR} />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("justify-start text-left font-normal", !dateTo && "text-muted-foreground")}>
                    <Calendar className="mr-2 h-4 w-4" />{dateTo ? format(dateTo, "dd/MM/yyyy") : "Data fim"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent mode="single" selected={dateTo} onSelect={setDateTo} className="p-3 pointer-events-auto" locale={ptBR} />
                </PopoverContent>
              </Popover>
            </div>
            {(search || filterType !== 'ALL' || filterStatus !== 'ALL' || filterClinicStatus !== 'ALL' || filterMinClinics || filterMinConsultas || filterClinicActivity !== 'ALL' || dateFrom || dateTo) && (
              <Button variant="ghost" size="sm" className="mt-2 text-xs" onClick={() => {
                setSearch(''); setFilterType('ALL'); setFilterStatus('ALL'); setFilterClinicStatus('ALL');
                setFilterMinClinics(''); setFilterMinConsultas(''); setFilterClinicActivity('ALL');
                setDateFrom(undefined); setDateTo(undefined);
              }}>✕ Limpar filtros</Button>
            )}
          </CardContent>
        </Card>

        <div className="text-sm text-muted-foreground">
          {filtered.length} partner{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
        </div>

        {/* Partners List */}
        <div className="space-y-3">
          {loading ? (
            <div className="flex justify-center py-8"><div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" /></div>
          ) : filtered.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center py-12 text-muted-foreground">
                <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p className="font-medium">Nenhum partner encontrado</p>
                <p className="text-sm mt-1">
                  {search || filterType !== 'ALL' ? 'Tente ajustar os filtros para encontrar resultados.' : 'Cadastre o primeiro partner clicando no botão acima.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filtered.map(p => {
              const pClinics = getPartnerClinics(p.id);
              const activeClinicsCount = pClinics.filter(c => c.is_active).length;
              const isExpanded = expandedPartner === p.id;
              const pLinks = getPartnerLinks(p.id);
              const isMasterPartner = p.type === 'MASTER';

              return (
                <Card key={p.id} className="overflow-hidden">
                  <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => setExpandedPartner(isExpanded ? null : p.id)}>
                    <div className="flex items-center gap-4">
                      <div className={cn("flex h-10 w-10 items-center justify-center rounded-full", isMasterPartner ? 'bg-purple-500/10' : 'bg-primary/10')}>
                        {isMasterPartner ? <Users className="h-5 w-5 text-purple-500" /> : <UserPlus className="h-5 w-5 text-primary" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium">{p.legal_name}</p>
                          <Badge variant="outline" className={cn("text-xs", isMasterPartner ? 'border-purple-500 text-purple-700' : '')}>
                            {isMasterPartner ? 'Master Partner' : 'Partner Comum'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{p.email} · {p.region_city}/{p.region_state}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right hidden sm:block">
                        <div className="flex items-center gap-2">
                          <Badge className={TYPE_COLORS[p.type] || 'bg-muted'}>{p.type === 'MASTER' ? 'Master Partner' : 'Partner'}</Badge>
                          <Badge variant={p.status === 'ACTIVE' ? 'default' : p.status === 'SUSPENDED' ? 'destructive' : 'secondary'}>{STATUS_LABELS[p.status] || p.status}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          SEH: {Number(p.seh_score || 0).toFixed(1)} · {activeClinicsCount} clínicas ativas
                        </p>
                      </div>
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t p-4 space-y-5">
                      {/* Action buttons - admin only */}
                      {isAdmin && (
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); openEditDialog(p); }}>
                            <Pencil className="h-3 w-3 mr-1" /> Editar
                          </Button>
                          <Button size="sm" variant={p.status === 'ACTIVE' ? 'destructive' : 'default'} onClick={(e) => { e.stopPropagation(); togglePartnerStatus(p); }}>
                            {p.status === 'ACTIVE' ? <><PowerOff className="h-3 w-3 mr-1" /> Desativar</> : <><Power className="h-3 w-3 mr-1" /> Ativar</>}
                          </Button>
                        </div>
                      )}
                      
                      {!isAdmin && (
                        <p className="text-xs text-muted-foreground p-2 bg-muted/50 rounded-lg">
                          👁️ Modo leitura — entre em contato com o administrador para editar este cadastro.
                        </p>
                      )}

                      {/* ===== SEÇÃO 1: Dados Cadastrais Completos ===== */}
                      <div>
                        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-foreground">
                          📋 Dados Cadastrais
                          <Tooltip><TooltipTrigger><Info className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                            <TooltipContent className="max-w-[250px]"><p className="text-xs">Informações completas do cadastro do partner. {isAdmin ? 'Você pode editar clicando em "Editar".' : 'Somente administradores podem alterar estes dados.'}</p></TooltipContent>
                          </Tooltip>
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-2 text-sm bg-muted/30 rounded-lg p-4">
                          <div className="flex flex-col">
                            <span className="text-[11px] text-muted-foreground uppercase tracking-wide">Nome / Razão Social</span>
                            <span className="font-medium">{p.legal_name}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[11px] text-muted-foreground uppercase tracking-wide">Tipo de Pessoa</span>
                            <span className="font-medium">{p.person_type === 'CPF' ? 'Pessoa Física (CPF)' : 'Pessoa Jurídica (CNPJ)'}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[11px] text-muted-foreground uppercase tracking-wide">Documento</span>
                            <span className="font-medium font-mono">{p.document_number || '—'}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[11px] text-muted-foreground uppercase tracking-wide">E-mail</span>
                            <span className="font-medium truncate">{p.email}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[11px] text-muted-foreground uppercase tracking-wide">Telefone</span>
                            <span className="font-medium">{p.phone || '—'}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[11px] text-muted-foreground uppercase tracking-wide">Localização</span>
                            <span className="font-medium">{p.region_city || '—'} / {p.region_state || '—'}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[11px] text-muted-foreground uppercase tracking-wide">Anos no Mercado</span>
                            <span className="font-medium">{p.years_in_health_market || 0} anos</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[11px] text-muted-foreground uppercase tracking-wide">Clínicas Relacionamento/Mês</span>
                            <span className="font-medium">{p.monthly_relationship_clinics || 0}</span>
                          </div>
                        </div>
                      </div>

                      {/* ===== SEÇÃO 2: Status e Datas ===== */}
                      <div>
                        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-foreground">
                          📅 Status e Cronologia
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                          <div className="p-3 rounded-lg bg-muted/30 text-center">
                            <Badge variant={p.status === 'ACTIVE' ? 'default' : p.status === 'SUSPENDED' ? 'destructive' : 'secondary'} className="text-[10px] mb-1">
                              {STATUS_LABELS[p.status] || p.status}
                            </Badge>
                            <p className="text-[10px] text-muted-foreground">Status Atual</p>
                          </div>
                           <div className="p-3 rounded-lg bg-muted/30 text-center">
                             <Badge className={cn(TYPE_COLORS[p.type], 'text-[10px] mb-1')}>{p.type === 'MASTER' ? 'Master' : 'Partner'}</Badge>
                             <p className="text-[10px] text-muted-foreground">Tipo</p>
                           </div>
                          <div className="p-3 rounded-lg bg-muted/30 text-center">
                            <p className="text-xs font-medium">{new Date(p.created_at).toLocaleDateString('pt-BR')}</p>
                            <p className="text-[10px] text-muted-foreground">Data Cadastro</p>
                          </div>
                          <div className="p-3 rounded-lg bg-muted/30 text-center">
                            <p className="text-xs font-medium">{p.activated_at ? new Date(p.activated_at).toLocaleDateString('pt-BR') : '—'}</p>
                            <p className="text-[10px] text-muted-foreground">Data Ativação</p>
                          </div>
                          <div className="p-3 rounded-lg bg-muted/30 text-center">
                            <p className="text-xs font-medium">{p.onboarded_at ? new Date(p.onboarded_at).toLocaleDateString('pt-BR') : '—'}</p>
                            <p className="text-[10px] text-muted-foreground">Data Onboarding</p>
                          </div>
                          <div className="p-3 rounded-lg bg-muted/30 text-center">
                            <p className="text-xs font-medium">{Number(p.seh_score || 0).toFixed(1)}</p>
                            <p className="text-[10px] text-muted-foreground">Score SEH</p>
                          </div>
                        </div>
                      </div>

                      {/* ===== SEÇÃO 3: Origem e Vínculo Hierárquico ===== */}
                      {(() => {
                        const parentRel = network.find(n => n.child_partner_id === p.id && n.is_active);
                        const parentPartner = parentRel ? getPartnerById(parentRel.parent_partner_id) : null;
                        const referralLink = pLinks.find(l => l.link_type === 'CLINIC_REGISTRATION') || pLinks[0];
                        
                        return (
                          <div>
                            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-foreground">
                              🔗 Origem e Vínculo Hierárquico
                              <Tooltip><TooltipTrigger><Info className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                                <TooltipContent className="max-w-[250px]"><p className="text-xs">Indica quem indicou este partner e a qual rede ele pertence. A vinculação é estabelecida automaticamente via link de cadastro.</p></TooltipContent>
                              </Tooltip>
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                              <div className="p-3 rounded-lg border border-border/50 bg-muted/20">
                                <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">Tipo do Partner</p>
                                <div className="flex items-center gap-2">
                                  {isMasterPartner
                                    ? <Badge className="bg-purple-600 text-white text-xs">Master Partner</Badge>
                                    : <Badge variant="outline" className="text-xs">Partner Comum</Badge>}
                                  {isMasterPartner && (
                                    <Tooltip><TooltipTrigger><Info className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                                      <TooltipContent className="max-w-[220px]"><p className="text-xs">Promovido automaticamente quando a rede atinge R$ {PARTNER_RULES.MASTER_PROMOTION_THRESHOLD_AMOUNT.toLocaleString('pt-BR')} em créditos pagos.</p></TooltipContent>
                                    </Tooltip>
                                  )}
                                </div>
                              </div>
                              <div className="p-3 rounded-lg border border-border/50 bg-muted/20">
                                <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">Indicado por</p>
                                {parentPartner ? (
                                  <div>
                                    <p className="font-medium text-sm">{parentPartner.legal_name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {parentPartner.type === 'MASTER' ? 'Master Partner' : 'Partner'} · Desde {new Date(parentRel.linked_at).toLocaleDateString('pt-BR')}
                                    </p>
                                  </div>
                                ) : (
                                  <p className="text-sm text-muted-foreground">Cadastro direto (sem indicação)</p>
                                )}
                              </div>
                              <div className="p-3 rounded-lg border border-border/50 bg-muted/20">
                                <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">Rede Vinculada</p>
                                {parentPartner ? (
                                  <p className="text-sm font-medium">Rede {parentPartner.legal_name}</p>
                                ) : isMasterPartner ? (
                                  <p className="text-sm font-medium text-purple-600">Líder de rede própria</p>
                                ) : (
                                  <p className="text-sm text-muted-foreground">Partner independente</p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* ===== SEÇÃO 4: Links de Cadastro ===== */}
                      {(() => {
                        const invitationLink = pLinks.find(l => l.link_type === 'PARTNER_INVITATION' && l.is_active);
                        const otherLinks = pLinks.filter(l => l.link_type !== 'PARTNER_INVITATION');
                        const registrationUrl = invitationLink ? `${window.location.origin}/register/partner?ref=${invitationLink.link_code}` : null;

                        return (
                          <div className="space-y-3">
                            {/* Prominent Partner Invitation Link for Master Partners */}
                            {isMasterPartner && invitationLink && (
                              <div className="p-4 rounded-lg border-2 border-purple-500/30 bg-purple-500/5">
                                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2 text-foreground">
                                  🤝 Link de Cadastro de Partners
                                  <Tooltip><TooltipTrigger><Info className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                                    <TooltipContent className="max-w-[280px]"><p className="text-xs">Compartilhe este link com pessoas que deseja recrutar como partners. Ao se cadastrar por este link, o novo partner será automaticamente vinculado à sua rede.</p></TooltipContent>
                                  </Tooltip>
                                </h4>
                                <div className="flex items-center gap-2">
                                  <Input readOnly value={registrationUrl || ''} className="text-xs font-mono bg-background" />
                                  <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); copyToClipboard(registrationUrl || ''); }}>
                                    <Copy className="h-3 w-3 mr-1" /> Copiar
                                  </Button>
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">
                                  {invitationLink.uses_count} parceiro{invitationLink.uses_count !== 1 ? 's' : ''} cadastrado{invitationLink.uses_count !== 1 ? 's' : ''} por este link
                                </p>
                              </div>
                            )}

                            {/* Other links */}
                            {otherLinks.length > 0 && (
                              <div>
                                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2 text-foreground">
                                  <Link2 className="h-4 w-4" /> Outros Links
                                </h4>
                                <div className="space-y-2">
                                  {otherLinks.map(l => (
                                    <div key={l.id} className="flex items-center gap-3 p-2 rounded bg-muted/50 text-sm">
                                      <Badge variant="outline" className="text-xs shrink-0">
                                        {l.link_type === 'CLINIC_REGISTRATION' ? '🏥 Clínica' : l.link_type}
                                      </Badge>
                                      <code className="text-xs flex-1 truncate">{l.link_url}</code>
                                      <span className="text-xs text-muted-foreground shrink-0">{l.uses_count} usos</span>
                                      <Badge variant={l.is_active ? 'default' : 'secondary'} className="text-[10px] shrink-0">{l.is_active ? 'Ativo' : 'Inativo'}</Badge>
                                      <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); copyToClipboard(l.link_url); }}>
                                        <Copy className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* ===== SEÇÃO 5: Resumos Operacionais ===== */}
                      {isMasterPartner ? renderMasterPartnerDetail(p) : renderPartnerClinicsDetail(p)}
                    </div>
                  )}
                </Card>
              );
            })
          )}
        </div>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Partner</DialogTitle>
              <DialogDescription>Altere os dados cadastrais do partner. Apenas administradores podem editar.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Tipo de Pessoa</Label>
                  <Select value={editForm.person_type} onValueChange={v => setEditForm({...editForm, person_type: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="CPF">CPF</SelectItem><SelectItem value="CNPJ">CNPJ</SelectItem></SelectContent>
                  </Select>
                </div>
                <div><Label>Documento</Label><Input value={editForm.document_number} onChange={e => setEditForm({...editForm, document_number: e.target.value})} /></div>
              </div>
              <div><Label>Nome / Razão Social</Label><Input value={editForm.legal_name} onChange={e => setEditForm({...editForm, legal_name: e.target.value})} /></div>
              <div><Label>E-mail</Label><Input type="email" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} /></div>
              <div><Label>Telefone</Label><Input value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Estado</Label><Input value={editForm.region_state} onChange={e => setEditForm({...editForm, region_state: e.target.value})} /></div>
                <div><Label>Cidade</Label><Input value={editForm.region_city} onChange={e => setEditForm({...editForm, region_city: e.target.value})} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Anos no mercado</Label><Input type="number" value={editForm.years_in_health_market} onChange={e => setEditForm({...editForm, years_in_health_market: Number(e.target.value)})} /></div>
                <div><Label>Clínicas/mês</Label><Input type="number" value={editForm.monthly_relationship_clinics} onChange={e => setEditForm({...editForm, monthly_relationship_clinics: Number(e.target.value)})} /></div>
              </div>
              <Button onClick={handleEdit} className="w-full"><Pencil className="h-4 w-4 mr-2" /> Salvar Alterações</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default PartnersManagement;
