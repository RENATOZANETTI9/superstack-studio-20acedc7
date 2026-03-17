import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, UserPlus, Building2, Link2, Copy, ExternalLink, Filter, ChevronDown, ChevronUp } from 'lucide-react';

const levelColors: Record<string, string> = {
  BRONZE: 'bg-amber-700 text-white',
  PRATA: 'bg-gray-400 text-white',
  OURO: 'bg-yellow-500 text-white',
  ELITE: 'bg-purple-600 text-white',
};

const PartnersManagement = () => {
  const { user, isMaster } = useAuth();
  const { toast } = useToast();
  const [partners, setPartners] = useState<any[]>([]);
  const [clinics, setClinics] = useState<any[]>([]);
  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [expandedPartner, setExpandedPartner] = useState<string | null>(null);
  const [form, setForm] = useState({
    type: 'PARTNER',
    person_type: 'CPF',
    document_number: '',
    legal_name: '',
    email: '',
    phone: '',
    region_state: '',
    region_city: '',
    years_in_health_market: 0,
    monthly_relationship_clinics: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [pRes, cRes, lRes] = await Promise.all([
      supabase.from('partners').select('*').order('created_at', { ascending: false }),
      supabase.from('partner_clinic_relations').select('*'),
      supabase.from('partner_links').select('*'),
    ]);
    setPartners(pRes.data || []);
    setClinics(cRes.data || []);
    setLinks(lRes.data || []);
    setLoading(false);
  };

  const getPartnerClinics = (partnerId: string) => clinics.filter(c => c.partner_id === partnerId);
  const getPartnerLinks = (partnerId: string) => links.filter(l => l.partner_id === partnerId);
  const getActiveClinicsCount = (partnerId: string) => getPartnerClinics(partnerId).filter(c => c.is_active).length;

  const canBecomeMaster = (partnerId: string) => getActiveClinicsCount(partnerId) >= 20;

  const handleCreate = async () => {
    if (!form.legal_name || !form.email || !form.document_number) {
      toast({ title: 'Preencha os campos obrigatórios', variant: 'destructive' });
      return;
    }

    if (form.type === 'MASTER') {
      toast({ title: 'Master Partners são promovidos automaticamente ao atingir 20 clínicas ativas', variant: 'destructive' });
      return;
    }

    const { error } = await supabase.from('partners').insert({
      ...form,
      user_id: user!.id,
      status: 'PENDING',
    });

    if (error) {
      toast({ title: 'Erro ao criar partner', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Partner criado com sucesso!' });
      setDialogOpen(false);
      setForm({
        type: 'PARTNER', person_type: 'CPF', document_number: '', legal_name: '',
        email: '', phone: '', region_state: '', region_city: '',
        years_in_health_market: 0, monthly_relationship_clinics: 0,
      });
      fetchData();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Link copiado!' });
  };

  const filtered = partners.filter(p => {
    const matchSearch = !search || 
      p.legal_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.email?.toLowerCase().includes(search.toLowerCase()) ||
      p.document_number?.includes(search);
    const matchType = filterType === 'ALL' || p.type === filterType;
    const matchStatus = filterStatus === 'ALL' || p.status === filterStatus;
    return matchSearch && matchType && matchStatus;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Cadastro de Partners</h1>
            <p className="text-muted-foreground">Gerenciar parceiros, master partners e suas clínicas</p>
          </div>
          {isMaster && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" /> Novo Partner</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Cadastrar Partner</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                    <p>💡 Para se tornar <strong>Master Partner</strong>, o parceiro precisa ter no mínimo <strong>20 clínicas ativas</strong> vinculadas. A promoção é automática.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Pessoa</Label>
                      <Select value={form.person_type} onValueChange={v => setForm({...form, person_type: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CPF">CPF</SelectItem>
                          <SelectItem value="CNPJ">CNPJ</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Documento</Label>
                      <Input value={form.document_number} onChange={e => setForm({...form, document_number: e.target.value})} placeholder="000.000.000-00" />
                    </div>
                  </div>
                  <div>
                    <Label>Nome / Razão Social *</Label>
                    <Input value={form.legal_name} onChange={e => setForm({...form, legal_name: e.target.value})} placeholder="Nome completo" />
                  </div>
                  <div>
                    <Label>E-mail *</Label>
                    <Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="email@exemplo.com" />
                  </div>
                  <div>
                    <Label>Telefone</Label>
                    <Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="+55 71 99999-0000" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Estado</Label><Input value={form.region_state} onChange={e => setForm({...form, region_state: e.target.value})} placeholder="BA" /></div>
                    <div><Label>Cidade</Label><Input value={form.region_city} onChange={e => setForm({...form, region_city: e.target.value})} placeholder="Salvador" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Anos no mercado</Label><Input type="number" value={form.years_in_health_market} onChange={e => setForm({...form, years_in_health_market: Number(e.target.value)})} /></div>
                    <div><Label>Clínicas/mês</Label><Input type="number" value={form.monthly_relationship_clinics} onChange={e => setForm({...form, monthly_relationship_clinics: Number(e.target.value)})} /></div>
                  </div>
                  <Button onClick={handleCreate} className="w-full">
                    <UserPlus className="h-4 w-4 mr-2" /> Cadastrar Partner
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por nome, e-mail ou documento..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[160px]"><Filter className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos os Tipos</SelectItem>
              <SelectItem value="PARTNER">Partner</SelectItem>
              <SelectItem value="MASTER">Master Partner</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos Status</SelectItem>
              <SelectItem value="ACTIVE">Ativo</SelectItem>
              <SelectItem value="PENDING">Pendente</SelectItem>
              <SelectItem value="SUSPENDED">Suspenso</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Partners List */}
        <div className="space-y-3">
          {loading ? (
            <div className="flex justify-center py-8"><div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" /></div>
          ) : filtered.length === 0 ? (
            <Card><CardContent className="pt-6 text-center py-12 text-muted-foreground"><p>Nenhum partner encontrado</p></CardContent></Card>
          ) : (
            filtered.map(p => {
              const pClinics = getPartnerClinics(p.id);
              const activeClinics = pClinics.filter(c => c.is_active);
              const inactiveClinics = pClinics.filter(c => !c.is_active);
              const pLinks = getPartnerLinks(p.id);
              const isExpanded = expandedPartner === p.id;
              const totalConsultations = pClinics.reduce((s, c) => s + (c.consultations_count || 0), 0);
              const totalApprovals = pClinics.reduce((s, c) => s + (c.approvals_count || 0), 0);
              const totalPaid = pClinics.reduce((s, c) => s + (c.paid_count || 0), 0);

              return (
                <Card key={p.id} className="overflow-hidden">
                  <div 
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => setExpandedPartner(isExpanded ? null : p.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <UserPlus className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{p.legal_name}</p>
                          <Badge variant="outline" className="text-xs">{p.type === 'MASTER' ? 'Master' : 'Partner'}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{p.email} · {p.document_number}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right hidden sm:block">
                        <div className="flex items-center gap-2">
                          <Badge className={levelColors[p.current_level] || 'bg-muted'}>{p.current_level}</Badge>
                          <Badge variant={p.status === 'ACTIVE' ? 'default' : 'secondary'}>{p.status === 'ACTIVE' ? 'Ativo' : p.status === 'PENDING' ? 'Pendente' : p.status}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          SEH: {Number(p.seh_score || 0).toFixed(1)} · {activeClinics.length} clínicas ativas
                          {p.type === 'PARTNER' && canBecomeMaster(p.id) && (
                            <span className="text-green-600 font-medium ml-1">✓ Elegível a Master</span>
                          )}
                        </p>
                      </div>
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t p-4 space-y-4">
                      {/* Summary stats */}
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        <div className="p-3 rounded-lg bg-muted/50 text-center">
                          <p className="text-lg font-bold">{pClinics.length}</p>
                          <p className="text-xs text-muted-foreground">Total Clínicas</p>
                        </div>
                        <div className="p-3 rounded-lg bg-green-500/10 text-center">
                          <p className="text-lg font-bold text-green-600">{activeClinics.length}</p>
                          <p className="text-xs text-muted-foreground">Ativas</p>
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
                      </div>

                      {/* Links */}
                      {pLinks.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium mb-2 flex items-center gap-2"><Link2 className="h-4 w-4" /> Links de Cadastro</h4>
                          <div className="space-y-2">
                            {pLinks.map(l => (
                              <div key={l.id} className="flex items-center gap-3 p-2 rounded bg-muted/50 text-sm">
                                <Badge variant="outline" className="text-xs">
                                  {l.link_type === 'CLINIC_REGISTRATION' ? '🏥 Clínica' : l.link_type === 'PARTNER_INVITATION' ? '🤝 Partner' : l.link_type}
                                </Badge>
                                <code className="text-xs flex-1 truncate">{l.link_url}</code>
                                <span className="text-xs text-muted-foreground">{l.uses_count} usos</span>
                                <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); copyToClipboard(l.link_url); }}>
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                          {p.type === 'PARTNER' && !pLinks.some(l => l.link_type === 'PARTNER_INVITATION') && (
                            <p className="text-xs text-muted-foreground mt-2">
                              ℹ️ O link de recrutamento de partners será habilitado quando este partner for promovido a Master Partner (mín. 20 clínicas ativas).
                            </p>
                          )}
                        </div>
                      )}

                      {/* Clinics */}
                      <Tabs defaultValue="ativas">
                        <TabsList className="h-8">
                          <TabsTrigger value="ativas" className="text-xs">Clínicas Ativas ({activeClinics.length})</TabsTrigger>
                          <TabsTrigger value="inativas" className="text-xs">Inativas ({inactiveClinics.length})</TabsTrigger>
                        </TabsList>
                        <TabsContent value="ativas">
                          {activeClinics.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-4">Nenhuma clínica ativa</p>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead><tr className="border-b text-left">
                                  <th className="pb-2 text-xs font-medium">Clínica</th>
                                  <th className="pb-2 text-xs font-medium">Consultas</th>
                                  <th className="pb-2 text-xs font-medium">Aprovados</th>
                                  <th className="pb-2 text-xs font-medium">Pagos</th>
                                  <th className="pb-2 text-xs font-medium">Qualificada</th>
                                </tr></thead>
                                <tbody>
                                  {activeClinics.map(c => (
                                    <tr key={c.id} className="border-b">
                                      <td className="py-2"><div><p className="font-medium">{c.clinic_name}</p><p className="text-xs text-muted-foreground">{c.clinic_external_id}</p></div></td>
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
                            <p className="text-sm text-muted-foreground py-4">Nenhuma clínica inativa</p>
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
                  )}
                </Card>
              );
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PartnersManagement;
