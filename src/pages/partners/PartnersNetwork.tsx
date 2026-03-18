import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbSeparator, BreadcrumbPage
} from '@/components/ui/breadcrumb';
import {
  GitBranch, Users, Building2, ChevronDown, ChevronUp, Info,
  ArrowLeft, Network, TrendingUp, Eye
} from 'lucide-react';
import { LEVEL_COLORS, STATUS_LABELS, isAdminRole, PARTNER_RULES } from '@/lib/partner-rules';

const PartnersNetwork = () => {
  const { role } = useAuth();
  const isAdmin = isAdminRole(role as any);

  const [network, setNetwork] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [clinics, setClinics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Navigation state: null = overview, string = viewing a specific master's network
  const [selectedMaster, setSelectedMaster] = useState<string | null>(null);
  const [expandedPartner, setExpandedPartner] = useState<string | null>(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const [networkRes, partnersRes, clinicsRes] = await Promise.all([
      supabase.from('partner_network').select('*'),
      supabase.from('partners').select('*'),
      supabase.from('partner_clinic_relations').select('*'),
    ]);
    setNetwork(networkRes.data || []);
    setPartners(partnersRes.data || []);
    setClinics(clinicsRes.data || []);
    setLoading(false);
  };

  const getPartner = (id: string) => partners.find(p => p.id === id);
  const getPartnerClinics = (id: string) => clinics.filter(c => c.partner_id === id);
  const masterPartners = partners.filter(p => p.type === 'MASTER');
  const standalonePartners = partners.filter(
    p => p.type === 'PARTNER' && !network.some(n => n.child_partner_id === p.id)
  );

  const getNetworkChildren = (masterId: string) => {
    const rels = network.filter(n => n.parent_partner_id === masterId);
    return rels.map(r => {
      const child = getPartner(r.child_partner_id);
      return child ? { ...child, rel: r } : null;
    }).filter(Boolean) as any[];
  };

  const getNetworkStats = (masterId: string) => {
    const children = getNetworkChildren(masterId);
    const activeChildren = children.filter(c => c.rel.is_active && c.status === 'ACTIVE');
    const inactiveChildren = children.filter(c => !c.rel.is_active || c.status !== 'ACTIVE');
    const allClinics = children.flatMap(c => getPartnerClinics(c.id));
    const activeClinics = allClinics.filter(c => c.is_active);
    const totalConsultations = allClinics.reduce((s, c) => s + (c.consultations_count || 0), 0);
    const totalApprovals = allClinics.reduce((s, c) => s + (c.approvals_count || 0), 0);
    const totalPaid = allClinics.reduce((s, c) => s + (c.paid_count || 0), 0);
    return { children, activeChildren, inactiveChildren, allClinics, activeClinics, totalConsultations, totalApprovals, totalPaid };
  };

  // Stats cards
  const totalNetworkLinks = network.filter(n => n.is_active).length;

  // ===== DETAIL VIEW: Selected Master Partner =====
  if (selectedMaster) {
    const master = getPartner(selectedMaster);
    if (!master) return null;
    const stats = getNetworkStats(selectedMaster);

    return (
      <DashboardLayout>
        <div className="space-y-6">
          {/* Breadcrumb */}
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink className="cursor-pointer" onClick={() => setSelectedMaster(null)}>
                  Rede de Partners
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{master.legal_name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Header */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setSelectedMaster(null)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-foreground">Rede: {master.legal_name}</h1>
                <Badge className="bg-purple-600 text-white">Master Partner</Badge>
                <Badge className={LEVEL_COLORS[master.current_level]}>{master.current_level}</Badge>
              </div>
              <p className="text-muted-foreground mt-1">
                {master.region_city}/{master.region_state} · SEH: {Number(master.seh_score || 0).toFixed(1)}
              </p>
            </div>
          </div>

          {/* Network Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card><CardContent className="pt-6 text-center">
              <p className="text-2xl font-bold text-purple-600">{stats.activeChildren.length}</p>
              <p className="text-xs text-muted-foreground">Partners Ativos</p>
            </CardContent></Card>
            <Card><CardContent className="pt-6 text-center">
              <p className="text-2xl font-bold text-muted-foreground">{stats.inactiveChildren.length}</p>
              <p className="text-xs text-muted-foreground">Partners Inativos</p>
            </CardContent></Card>
            <Card><CardContent className="pt-6 text-center">
              <p className="text-2xl font-bold text-green-600">{stats.activeClinics.length}</p>
              <p className="text-xs text-muted-foreground">Clínicas Ativas da Rede</p>
            </CardContent></Card>
            <Card><CardContent className="pt-6 text-center">
              <p className="text-2xl font-bold">{stats.children.length}</p>
              <p className="text-xs text-muted-foreground">Total Indicados</p>
            </CardContent></Card>
          </div>

          {/* Production summary */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Produtividade Agregada da Rede</span>
                <Tooltip>
                  <TooltipTrigger><Info className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                  <TooltipContent className="max-w-[250px]">
                    <p className="text-xs">Soma da produção de todas as clínicas dos partners indicados por este Master Partner.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-xl font-bold">{stats.totalConsultations}</p>
                  <p className="text-xs text-muted-foreground">Consultas</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold">{stats.totalApprovals}</p>
                  <p className="text-xs text-muted-foreground">Aprovados</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-green-600">{stats.totalPaid}</p>
                  <p className="text-xs text-muted-foreground">Pagos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Partners list with tabs */}
          <Tabs defaultValue="ativos">
            <TabsList>
              <TabsTrigger value="ativos">Partners Ativos ({stats.activeChildren.length})</TabsTrigger>
              <TabsTrigger value="inativos">Inativos ({stats.inactiveChildren.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="ativos">
              {stats.activeChildren.length === 0 ? (
                <Card><CardContent className="py-12 text-center text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p className="font-medium">Nenhum partner ativo na rede</p>
                  <p className="text-sm mt-1">Partners indicados por este Master aparecerão aqui quando forem ativados.</p>
                </CardContent></Card>
              ) : (
                <div className="space-y-3">
                  {stats.activeChildren.map((cp: any) => {
                    const cpClinics = getPartnerClinics(cp.id);
                    const cpActive = cpClinics.filter((c: any) => c.is_active);
                    const cpInactive = cpClinics.filter((c: any) => !c.is_active);
                    const cpConsultas = cpClinics.reduce((s: number, c: any) => s + (c.consultations_count || 0), 0);
                    const cpAprovados = cpClinics.reduce((s: number, c: any) => s + (c.approvals_count || 0), 0);
                    const cpPagos = cpClinics.reduce((s: number, c: any) => s + (c.paid_count || 0), 0);
                    const isExpanded = expandedPartner === cp.id;

                    return (
                      <Card key={cp.id} className="overflow-hidden">
                        <div
                          className="flex items-center justify-between p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                          onClick={() => setExpandedPartner(isExpanded ? null : cp.id)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                              <Users className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-sm">{cp.legal_name}</p>
                                <Badge className={LEVEL_COLORS[cp.current_level] + ' text-[10px]'}>{cp.current_level}</Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {cp.phone || cp.email} · {cpActive.length} clínicas ativas
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground">
                              <span>{cpConsultas} consultas</span>
                              <span>{cpAprovados} aprovados</span>
                              <span className="text-green-600 font-medium">{cpPagos} pagos</span>
                            </div>
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="border-t p-4 space-y-3">
                            {/* Partner details */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                              <div><span className="text-muted-foreground">Telefone:</span> <span className="font-medium">{cp.phone || '—'}</span></div>
                              <div><span className="text-muted-foreground">E-mail:</span> <span className="font-medium">{cp.email}</span></div>
                              <div><span className="text-muted-foreground">Cadastro:</span> <span className="font-medium">{new Date(cp.created_at).toLocaleDateString('pt-BR')}</span></div>
                              <div><span className="text-muted-foreground">SEH:</span> <span className="font-medium">{Number(cp.seh_score || 0).toFixed(1)}</span></div>
                            </div>

                            {/* Clinic summary */}
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                              <div className="p-2 rounded bg-muted/50 text-center">
                                <p className="text-lg font-bold">{cpClinics.length}</p>
                                <p className="text-[10px] text-muted-foreground">Total Clínicas</p>
                              </div>
                              <div className="p-2 rounded bg-green-500/10 text-center">
                                <p className="text-lg font-bold text-green-600">{cpActive.length}</p>
                                <p className="text-[10px] text-muted-foreground">Ativas</p>
                              </div>
                              <div className="p-2 rounded bg-muted/50 text-center">
                                <p className="text-lg font-bold">{cpConsultas}</p>
                                <p className="text-[10px] text-muted-foreground">Consultas</p>
                              </div>
                              <div className="p-2 rounded bg-muted/50 text-center">
                                <p className="text-lg font-bold">{cpAprovados}</p>
                                <p className="text-[10px] text-muted-foreground">Aprovados</p>
                              </div>
                              <div className="p-2 rounded bg-green-500/10 text-center">
                                <p className="text-lg font-bold text-green-600">{cpPagos}</p>
                                <p className="text-[10px] text-muted-foreground">Pagos</p>
                              </div>
                            </div>

                            {/* Clinics table */}
                            {cpClinics.length > 0 && (
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                                  <Building2 className="h-3 w-3" /> Clínicas vinculadas
                                </p>
                                <div className="overflow-x-auto">
                                  <table className="w-full text-xs">
                                    <thead><tr className="border-b text-left">
                                      <th className="pb-2">Clínica</th>
                                      <th className="pb-2">Status</th>
                                      <th className="pb-2">Consultas</th>
                                      <th className="pb-2">Aprovados</th>
                                      <th className="pb-2">Pagos</th>
                                      <th className="pb-2">Qualificada</th>
                                    </tr></thead>
                                    <tbody>
                                      {cpClinics.map((c: any) => (
                                        <tr key={c.id} className="border-b">
                                          <td className="py-1.5">{c.clinic_name}</td>
                                          <td className="py-1.5">
                                            <div className={`inline-flex h-2 w-2 rounded-full mr-1 ${c.is_active ? 'bg-green-500' : 'bg-red-400'}`} />
                                            {c.is_active ? 'Ativa' : 'Inativa'}
                                          </td>
                                          <td className="py-1.5">{c.consultations_count}</td>
                                          <td className="py-1.5">{c.approvals_count}</td>
                                          <td className="py-1.5 font-medium text-green-600">{c.paid_count}</td>
                                          <td className="py-1.5">
                                            {c.is_qualified
                                              ? <Badge className="bg-green-100 text-green-800 text-[10px]">Sim</Badge>
                                              : <Badge variant="secondary" className="text-[10px]">Não</Badge>}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="inativos">
              {stats.inactiveChildren.length === 0 ? (
                <Card><CardContent className="py-12 text-center text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>Nenhum partner inativo na rede.</p>
                </CardContent></Card>
              ) : (
                <div className="space-y-2">
                  {stats.inactiveChildren.map((cp: any) => (
                    <Card key={cp.id} className="p-4 opacity-70">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium text-sm">{cp.legal_name}</p>
                            <p className="text-xs text-muted-foreground">{cp.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-[10px]">{STATUS_LABELS[cp.status] || cp.status}</Badge>
                          <span className="text-xs text-muted-foreground">{getPartnerClinics(cp.id).length} clínicas</span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    );
  }

  // ===== OVERVIEW: All networks =====
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Network className="h-6 w-6" /> Rede de Partners
          </h1>
          <p className="text-muted-foreground mt-1">
            Estrutura hierárquica de Master Partners e seus partners indicados. Clique em uma rede para ver os detalhes.
          </p>
        </div>

        {/* Help context */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-foreground">
              <strong>💡 Como funciona:</strong> Cada Master Partner possui uma rede de partners indicados por ele.
              O foco desta tela é a <strong>rede de partners</strong>, não de clínicas diretamente.
              Clique em "Ver rede" para navegar até os partners indicados e suas clínicas vinculadas.
            </p>
          </CardContent>
        </Card>

        {/* Global Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card><CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold">{partners.length}</p>
            <p className="text-xs text-muted-foreground">Total Partners</p>
          </CardContent></Card>
          <Card><CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold text-purple-600">{masterPartners.length}</p>
            <p className="text-xs text-muted-foreground">Master Partners</p>
          </CardContent></Card>
          <Card><CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold">{totalNetworkLinks}</p>
            <p className="text-xs text-muted-foreground">Vínculos Ativos</p>
          </CardContent></Card>
          <Card><CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold text-green-600">{clinics.filter(c => c.is_active).length}</p>
            <p className="text-xs text-muted-foreground">Clínicas Ativas</p>
          </CardContent></Card>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Master Partner Networks */}
            {masterPartners.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <GitBranch className="h-5 w-5 text-purple-500" /> Redes de Master Partners
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {masterPartners.map(master => {
                    const stats = getNetworkStats(master.id);
                    return (
                      <Card key={master.id} className="hover:border-purple-300 transition-colors cursor-pointer"
                        onClick={() => setSelectedMaster(master.id)}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/10">
                                <GitBranch className="h-5 w-5 text-purple-500" />
                              </div>
                              <div>
                                <CardTitle className="text-base">{master.legal_name}</CardTitle>
                                <CardDescription>{master.region_city}/{master.region_state} · SEH: {Number(master.seh_score || 0).toFixed(1)}</CardDescription>
                              </div>
                            </div>
                            <Badge className={LEVEL_COLORS[master.current_level] + ' text-[10px]'}>{master.current_level}</Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-4 gap-2 text-center">
                            <div>
                              <p className="text-lg font-bold text-purple-600">{stats.activeChildren.length}</p>
                              <p className="text-[10px] text-muted-foreground">Partners Ativos</p>
                            </div>
                            <div>
                              <p className="text-lg font-bold">{stats.activeClinics.length}</p>
                              <p className="text-[10px] text-muted-foreground">Clínicas</p>
                            </div>
                            <div>
                              <p className="text-lg font-bold">{stats.totalConsultations}</p>
                              <p className="text-[10px] text-muted-foreground">Consultas</p>
                            </div>
                            <div>
                              <p className="text-lg font-bold text-green-600">{stats.totalPaid}</p>
                              <p className="text-[10px] text-muted-foreground">Pagos</p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" className="w-full mt-3" onClick={(e) => { e.stopPropagation(); setSelectedMaster(master.id); }}>
                            <Eye className="h-4 w-4 mr-2" /> Ver rede completa
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Standalone partners */}
            {standalonePartners.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Users className="h-5 w-5 text-muted-foreground" /> Partners Independentes
                  <Badge variant="secondary" className="text-[10px]">{standalonePartners.length}</Badge>
                  <Tooltip>
                    <TooltipTrigger><Info className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                    <TooltipContent className="max-w-[250px]">
                      <p className="text-xs">Partners que não estão vinculados a nenhum Master Partner. Operam de forma independente.</p>
                    </TooltipContent>
                  </Tooltip>
                </h2>
                <div className="space-y-2">
                  {standalonePartners.map(p => {
                    const pClinics = getPartnerClinics(p.id);
                    const activeCount = pClinics.filter(c => c.is_active).length;
                    return (
                      <Card key={p.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium text-sm">{p.legal_name}</p>
                              <p className="text-xs text-muted-foreground">{p.email} · {p.region_city}/{p.region_state}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={LEVEL_COLORS[p.current_level] + ' text-[10px]'}>{p.current_level}</Badge>
                            <Badge variant={p.status === 'ACTIVE' ? 'default' : 'secondary'} className="text-[10px]">
                              {STATUS_LABELS[p.status] || p.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{activeCount} clínicas</span>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {masterPartners.length === 0 && standalonePartners.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Network className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p className="font-medium">Nenhuma rede cadastrada</p>
                  <p className="text-sm mt-1">As redes de partners aparecerão aqui quando Master Partners forem criados e vincularem partners indicados.</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PartnersNetwork;
