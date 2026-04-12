import { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  Popover, PopoverContent, PopoverTrigger
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbSeparator, BreadcrumbPage
} from '@/components/ui/breadcrumb';
import {
  GitBranch, Users, Building2, ChevronDown, ChevronUp, Info,
  ArrowLeft, Network, TrendingUp, Eye, Search, Filter, CalendarIcon, X
} from 'lucide-react';
import { TYPE_COLORS, STATUS_LABELS, isAdminRole, PARTNER_RULES } from '@/lib/partner-rules';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const PartnersNetwork = () => {
  const { role } = useAuth();
  const isAdmin = isAdminRole(role as any);

  const [network, setNetwork] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [clinics, setClinics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedMaster, setSelectedMaster] = useState<string | null>(null);
  const [expandedPartner, setExpandedPartner] = useState<string | null>(null);

  // Filter state for detail view
  const [searchName, setSearchName] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [minProductivity, setMinProductivity] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [showFilters, setShowFilters] = useState(false);

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

  const totalNetworkLinks = network.filter(n => n.is_active).length;

  const hasActiveFilters = searchName || filterStatus !== 'all' || minProductivity || dateFrom || dateTo;

  const clearFilters = () => {
    setSearchName('');
    setFilterStatus('all');
    setMinProductivity('');
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  // Filter children in detail view
  const filterChildren = (children: any[]) => {
    return children.filter(cp => {
      // Name search
      if (searchName) {
        const s = searchName.toLowerCase();
        const match = cp.legal_name?.toLowerCase().includes(s) ||
          cp.email?.toLowerCase().includes(s) ||
          cp.phone?.includes(s);
        if (!match) return false;
      }

      // Status filter
      if (filterStatus !== 'all') {
        if (filterStatus === 'active' && cp.status !== 'ACTIVE') return false;
        if (filterStatus === 'inactive' && cp.status === 'ACTIVE') return false;
      }

      // Min productivity
      if (minProductivity) {
        const minVal = parseInt(minProductivity, 10);
        if (!isNaN(minVal)) {
          const cpClinics = getPartnerClinics(cp.id);
          const totalConsultas = cpClinics.reduce((s: number, c: any) => s + (c.consultations_count || 0), 0);
          if (totalConsultas < minVal) return false;
        }
      }

      // Date range
      if (dateFrom) {
        const created = new Date(cp.created_at);
        if (created < dateFrom) return false;
      }
      if (dateTo) {
        const created = new Date(cp.created_at);
        const endOfDay = new Date(dateTo);
        endOfDay.setHours(23, 59, 59, 999);
        if (created > endOfDay) return false;
      }

      return true;
    });
  };

  // ===== DETAIL VIEW: Selected Master Partner =====
  if (selectedMaster) {
    const master = getPartner(selectedMaster);
    if (!master) return null;
    const stats = getNetworkStats(selectedMaster);
    const filteredActive = filterChildren(stats.activeChildren);
    const filteredInactive = filterChildren(stats.inactiveChildren);

    return (
      <DashboardLayout>
        <div className="space-y-4 sm:space-y-6">
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
          <div className="flex items-center gap-3 sm:gap-4">
            <Button variant="ghost" size="icon" onClick={() => setSelectedMaster(null)} className="shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-2xl font-bold text-foreground truncate">Rede: {master.legal_name}</h1>
                <Badge className="bg-purple-600 text-white shrink-0">Master Partner</Badge>
                <Badge className={cn(TYPE_COLORS[master.type], 'shrink-0')}>{master.type === 'MASTER' ? 'Master Partner' : 'Partner'}</Badge>
              </div>
              <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
                {master.region_city}/{master.region_state} · SEH: {Number(master.seh_score || 0).toFixed(1)}
              </p>
            </div>
          </div>

          {/* Network Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <Card><CardContent className="pt-4 sm:pt-6 text-center">
              <p className="text-xl sm:text-2xl font-bold text-purple-600">{stats.activeChildren.length}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Partners Ativos</p>
            </CardContent></Card>
            <Card><CardContent className="pt-4 sm:pt-6 text-center">
              <p className="text-xl sm:text-2xl font-bold text-muted-foreground">{stats.inactiveChildren.length}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Partners Inativos</p>
            </CardContent></Card>
            <Card><CardContent className="pt-4 sm:pt-6 text-center">
              <p className="text-xl sm:text-2xl font-bold text-green-600">{stats.activeClinics.length}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Clínicas Ativas da Rede</p>
            </CardContent></Card>
            <Card><CardContent className="pt-4 sm:pt-6 text-center">
              <p className="text-xl sm:text-2xl font-bold">{stats.children.length}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Total Indicados</p>
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
                  <p className="text-lg sm:text-xl font-bold">{stats.totalConsultations}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Consultas</p>
                </div>
                <div className="text-center">
                  <p className="text-lg sm:text-xl font-bold">{stats.totalApprovals}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Aprovados</p>
                </div>
                <div className="text-center">
                  <p className="text-lg sm:text-xl font-bold text-green-600">{stats.totalPaid}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Pagos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Advanced Filters */}
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Filtros Avançados</span>
                  {hasActiveFilters && (
                    <Badge variant="secondary" className="text-[10px]">Filtros ativos</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 text-xs gap-1">
                      <X className="h-3 w-3" /> Limpar
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className="h-7 text-xs sm:hidden"
                  >
                    {showFilters ? 'Ocultar' : 'Mostrar'}
                  </Button>
                </div>
              </div>

              <div className={cn(
                'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3',
                !showFilters && 'hidden sm:grid'
              )}>
                {/* Search by name */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Buscar por nome, email ou telefone</Label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Nome, email ou telefone..."
                      value={searchName}
                      onChange={e => setSearchName(e.target.value)}
                      className="pl-8 h-9 text-sm bg-background/50"
                    />
                  </div>
                </div>

                {/* Status filter */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Status do partner</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="h-9 text-sm bg-background/50">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border border-border z-50">
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Min productivity */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    Produtividade mínima
                    <Tooltip>
                      <TooltipTrigger><Info className="h-3 w-3" /></TooltipTrigger>
                      <TooltipContent className="max-w-[200px]">
                        <p className="text-xs">Filtra partners com total de consultas igual ou maior que o valor informado.</p>
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    placeholder="Ex: 50"
                    value={minProductivity}
                    onChange={e => setMinProductivity(e.target.value)}
                    className="h-9 text-sm bg-background/50"
                  />
                </div>

                {/* Date range */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Período de cadastro</Label>
                  <div className="flex gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className={cn(
                          "h-9 flex-1 justify-start text-left text-xs font-normal",
                          !dateFrom && "text-muted-foreground"
                        )}>
                          <CalendarIcon className="mr-1 h-3 w-3" />
                          {dateFrom ? format(dateFrom, 'dd/MM/yy') : 'De'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={dateFrom}
                          onSelect={setDateFrom}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className={cn(
                          "h-9 flex-1 justify-start text-left text-xs font-normal",
                          !dateTo && "text-muted-foreground"
                        )}>
                          <CalendarIcon className="mr-1 h-3 w-3" />
                          {dateTo ? format(dateTo, 'dd/MM/yy') : 'Até'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={dateTo}
                          onSelect={setDateTo}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>

              {hasActiveFilters && (
                <p className="text-xs text-muted-foreground mt-2">
                  Mostrando {filteredActive.length + filteredInactive.length} de {stats.children.length} partners indicados
                </p>
              )}
            </CardContent>
          </Card>

          {/* Partners list with tabs */}
          <Tabs defaultValue="ativos">
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="ativos" className="flex-1 sm:flex-none">Ativos ({filteredActive.length})</TabsTrigger>
              <TabsTrigger value="inativos" className="flex-1 sm:flex-none">Inativos ({filteredInactive.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="ativos">
              {filteredActive.length === 0 ? (
                <Card><CardContent className="py-12 text-center text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p className="font-medium">{hasActiveFilters ? 'Nenhum partner corresponde aos filtros' : 'Nenhum partner ativo na rede'}</p>
                  <p className="text-sm mt-1">
                    {hasActiveFilters
                      ? 'Tente ajustar os filtros para ver mais resultados.'
                      : 'Partners indicados por este Master aparecerão aqui quando forem ativados.'}
                  </p>
                  {hasActiveFilters && (
                    <Button variant="outline" size="sm" className="mt-3" onClick={clearFilters}>Limpar filtros</Button>
                  )}
                </CardContent></Card>
              ) : (
                <div className="space-y-3">
                  {filteredActive.map((cp: any) => (
                    <PartnerNetworkCard
                      key={cp.id}
                      partner={cp}
                      clinics={getPartnerClinics(cp.id)}
                      expanded={expandedPartner === cp.id}
                      onToggle={() => setExpandedPartner(expandedPartner === cp.id ? null : cp.id)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="inativos">
              {filteredInactive.length === 0 ? (
                <Card><CardContent className="py-12 text-center text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>{hasActiveFilters ? 'Nenhum partner inativo corresponde aos filtros.' : 'Nenhum partner inativo na rede.'}</p>
                </CardContent></Card>
              ) : (
                <div className="space-y-2">
                  {filteredInactive.map((cp: any) => (
                    <Card key={cp.id} className="p-3 sm:p-4 opacity-70">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{cp.legal_name}</p>
                            <p className="text-xs text-muted-foreground truncate">{cp.email}</p>
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
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold text-foreground flex items-center gap-2">
            <Network className="h-5 sm:h-6 w-5 sm:w-6" /> Rede de Partners
          </h1>
          <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
            Estrutura hierárquica de Master Partners e seus partners indicados. Clique em uma rede para ver os detalhes.
          </p>
        </div>

        {/* Help context */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs sm:text-sm text-foreground">
              <strong>💡 Como funciona:</strong> Cada Master Partner possui uma rede de partners indicados por ele.
              O foco desta tela é a <strong>rede de partners</strong>, não de clínicas diretamente.
              Clique em "Ver rede" para navegar até os partners indicados e suas clínicas vinculadas.
            </p>
          </CardContent>
        </Card>

        {/* Global Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <Card><CardContent className="pt-4 sm:pt-6 text-center">
            <p className="text-xl sm:text-2xl font-bold">{partners.length}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Total Partners</p>
          </CardContent></Card>
          <Card><CardContent className="pt-4 sm:pt-6 text-center">
            <p className="text-xl sm:text-2xl font-bold text-purple-600">{masterPartners.length}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Master Partners</p>
          </CardContent></Card>
          <Card><CardContent className="pt-4 sm:pt-6 text-center">
            <p className="text-xl sm:text-2xl font-bold">{totalNetworkLinks}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Vínculos Ativos</p>
          </CardContent></Card>
          <Card><CardContent className="pt-4 sm:pt-6 text-center">
            <p className="text-xl sm:text-2xl font-bold text-green-600">{clinics.filter(c => c.is_active).length}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Clínicas Ativas</p>
          </CardContent></Card>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            {masterPartners.length > 0 && (
              <div>
                <h2 className="text-base sm:text-lg font-semibold mb-3 flex items-center gap-2">
                  <GitBranch className="h-5 w-5 text-purple-500" /> Redes de Master Partners
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {masterPartners.map(master => {
                    const s = getNetworkStats(master.id);
                    return (
                      <Card key={master.id} className="hover:border-purple-300 transition-colors cursor-pointer"
                        onClick={() => setSelectedMaster(master.id)}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/10 shrink-0">
                                <GitBranch className="h-5 w-5 text-purple-500" />
                              </div>
                              <div className="min-w-0">
                                <CardTitle className="text-sm sm:text-base truncate">{master.legal_name}</CardTitle>
                                <CardDescription className="text-xs truncate">{master.region_city}/{master.region_state} · SEH: {Number(master.seh_score || 0).toFixed(1)}</CardDescription>
                              </div>
                            </div>
                            <Badge className={cn(TYPE_COLORS[master.type], 'text-[10px] shrink-0')}>{master.type === 'MASTER' ? 'Master' : 'Partner'}</Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-4 gap-2 text-center">
                            <div>
                              <p className="text-base sm:text-lg font-bold text-purple-600">{s.activeChildren.length}</p>
                              <p className="text-[10px] text-muted-foreground">Partners</p>
                            </div>
                            <div>
                              <p className="text-base sm:text-lg font-bold">{s.activeClinics.length}</p>
                              <p className="text-[10px] text-muted-foreground">Clínicas</p>
                            </div>
                            <div>
                              <p className="text-base sm:text-lg font-bold">{s.totalConsultations}</p>
                              <p className="text-[10px] text-muted-foreground">Consultas</p>
                            </div>
                            <div>
                              <p className="text-base sm:text-lg font-bold text-green-600">{s.totalPaid}</p>
                              <p className="text-[10px] text-muted-foreground">Pagos</p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" className="w-full mt-3 text-xs sm:text-sm" onClick={(e) => { e.stopPropagation(); setSelectedMaster(master.id); }}>
                            <Eye className="h-4 w-4 mr-2" /> Ver rede completa
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {standalonePartners.length > 0 && (
              <div>
                <h2 className="text-base sm:text-lg font-semibold mb-3 flex items-center gap-2">
                  <Users className="h-5 w-5 text-muted-foreground" /> Partners Independentes
                  <Badge variant="secondary" className="text-[10px]">{standalonePartners.length}</Badge>
                  <Tooltip>
                    <TooltipTrigger><Info className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                    <TooltipContent className="max-w-[250px]">
                      <p className="text-xs">Partners que não estão vinculados a nenhum Master Partner.</p>
                    </TooltipContent>
                  </Tooltip>
                </h2>
                <div className="space-y-2">
                  {standalonePartners.map(p => {
                    const pClinics = getPartnerClinics(p.id);
                    const activeCount = pClinics.filter(c => c.is_active).length;
                    return (
                      <Card key={p.id} className="p-3 sm:p-4">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-3 min-w-0">
                            <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">{p.legal_name}</p>
                              <p className="text-xs text-muted-foreground truncate">{p.email} · {p.region_city}/{p.region_state}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={cn(TYPE_COLORS[p.type], 'text-[10px]')}>{p.type === 'MASTER' ? 'Master' : 'Partner'}</Badge>
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
                  <p className="text-sm mt-1">As redes de partners aparecerão aqui quando Master Partners forem criados.</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

// ===== Extracted Partner Card Component =====
function PartnerNetworkCard({ partner: cp, clinics: cpClinics, expanded, onToggle }: {
  partner: any;
  clinics: any[];
  expanded: boolean;
  onToggle: () => void;
}) {
  const cpActive = cpClinics.filter((c: any) => c.is_active);
  const cpConsultas = cpClinics.reduce((s: number, c: any) => s + (c.consultations_count || 0), 0);
  const cpAprovados = cpClinics.reduce((s: number, c: any) => s + (c.approvals_count || 0), 0);
  const cpPagos = cpClinics.reduce((s: number, c: any) => s + (c.paid_count || 0), 0);

  return (
    <Card className="overflow-hidden">
      <div
        className="flex items-center justify-between p-3 sm:p-4 cursor-pointer hover:bg-accent/50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 shrink-0">
            <Users className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium text-sm truncate">{cp.legal_name}</p>
              <Badge className={cn(TYPE_COLORS[cp.type], 'text-[10px] shrink-0')}>{cp.type === 'MASTER' ? 'Master' : 'Partner'}</Badge>
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {cp.phone || cp.email} · {cpActive.length} clínicas ativas
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground">
            <span>{cpConsultas} consultas</span>
            <span>{cpAprovados} aprovados</span>
            <span className="text-green-600 font-medium">{cpPagos} pagos</span>
          </div>
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t p-3 sm:p-4 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div><span className="text-muted-foreground text-xs">Telefone:</span> <span className="font-medium text-xs sm:text-sm">{cp.phone || '—'}</span></div>
            <div><span className="text-muted-foreground text-xs">E-mail:</span> <span className="font-medium text-xs sm:text-sm truncate block">{cp.email}</span></div>
            <div><span className="text-muted-foreground text-xs">Cadastro:</span> <span className="font-medium text-xs sm:text-sm">{new Date(cp.created_at).toLocaleDateString('pt-BR')}</span></div>
            <div><span className="text-muted-foreground text-xs">SEH:</span> <span className="font-medium text-xs sm:text-sm">{Number(cp.seh_score || 0).toFixed(1)}</span></div>
          </div>

          {/* Mobile stats */}
          <div className="grid grid-cols-3 gap-2 sm:hidden">
            <div className="p-2 rounded bg-muted/50 text-center">
              <p className="text-base font-bold">{cpConsultas}</p>
              <p className="text-[10px] text-muted-foreground">Consultas</p>
            </div>
            <div className="p-2 rounded bg-muted/50 text-center">
              <p className="text-base font-bold">{cpAprovados}</p>
              <p className="text-[10px] text-muted-foreground">Aprovados</p>
            </div>
            <div className="p-2 rounded bg-green-500/10 text-center">
              <p className="text-base font-bold text-green-600">{cpPagos}</p>
              <p className="text-[10px] text-muted-foreground">Pagos</p>
            </div>
          </div>

          {/* Desktop stats */}
          <div className="hidden sm:grid grid-cols-5 gap-3">
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
                    <th className="pb-2 hidden sm:table-cell">Consultas</th>
                    <th className="pb-2 hidden sm:table-cell">Aprovados</th>
                    <th className="pb-2">Pagos</th>
                    <th className="pb-2 hidden sm:table-cell">Qualificada</th>
                  </tr></thead>
                  <tbody>
                    {cpClinics.map((c: any) => (
                      <tr key={c.id} className="border-b">
                        <td className="py-1.5 max-w-[120px] truncate">{c.clinic_name}</td>
                        <td className="py-1.5">
                          <div className={`inline-flex h-2 w-2 rounded-full mr-1 ${c.is_active ? 'bg-green-500' : 'bg-red-400'}`} />
                          <span className="hidden sm:inline">{c.is_active ? 'Ativa' : 'Inativa'}</span>
                        </td>
                        <td className="py-1.5 hidden sm:table-cell">{c.consultations_count}</td>
                        <td className="py-1.5 hidden sm:table-cell">{c.approvals_count}</td>
                        <td className="py-1.5 font-medium text-green-600">{c.paid_count}</td>
                        <td className="py-1.5 hidden sm:table-cell">
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
}

export default PartnersNetwork;
