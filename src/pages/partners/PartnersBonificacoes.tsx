import { useState, useEffect, useMemo, useCallback } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { isAdminRole } from '@/lib/partner-rules';
import BonificacaoFilters from '@/components/partners/BonificacaoFilters';
import BonificacaoSummaryCards from '@/components/partners/BonificacaoSummaryCards';
import BonificacaoTiersInfo from '@/components/partners/BonificacaoTiersInfo';
import BonificacaoMimosTab from '@/components/partners/BonificacaoMimosTab';
import BonificacaoPixTab from '@/components/partners/BonificacaoPixTab';
import BonificacaoCommissionsTab from '@/components/partners/BonificacaoCommissionsTab';

const PartnersBonificacoes = () => {
  const { role, user } = useAuth();
  const [commissions, setCommissions] = useState<any[]>([]);
  const [incentives, setIncentives] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [filterClinic, setFilterClinic] = useState('ALL');
  const [filterAttendant, setFilterAttendant] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Clinic relations for name display + ownership check
  const [clinicRelations, setClinicRelations] = useState<any[]>([]);
  const [myPartner, setMyPartner] = useState<any>(null);

  const isAdmin = isAdminRole(role);
  const isMasterPartner = role === 'master_partner';
  const isPartner = role === 'partner';
  // Partners and master_partners can mark mimos as delivered (they pay them)
  const canMarkMimoDelivered = isPartner || isMasterPartner || isAdmin;

  const fetchData = useCallback(async () => {
    setLoading(true);

    // Fetch partner record for current user
    const partnerPromise = user
      ? supabase.from('partners').select('id, type').eq('user_id', user.id).maybeSingle()
      : Promise.resolve({ data: null });

    const [comRes, incRes, partnerRes, clinicRes] = await Promise.all([
      supabase.from('partner_commissions').select('*').order('created_at', { ascending: false }),
      supabase.from('attendant_incentives').select('*').order('created_at', { ascending: false }),
      partnerPromise,
      supabase.from('partner_clinic_relations').select('clinic_external_id, clinic_name, partner_id'),
    ]);

    setCommissions(comRes.data || []);
    setIncentives(incRes.data || []);
    setMyPartner(partnerRes.data);
    setClinicRelations(clinicRes.data || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Build a map: clinic_external_id -> { name, partner_id }
  const clinicMap = useMemo(() => {
    const map: Record<string, { name: string; partnerId: string }> = {};
    for (const rel of clinicRelations) {
      if (rel.clinic_external_id) {
        map[rel.clinic_external_id] = { name: rel.clinic_name, partnerId: rel.partner_id };
      }
    }
    return map;
  }, [clinicRelations]);

  // Network partner IDs (partners in my network if I'm master_partner)
  const [networkPartnerIds, setNetworkPartnerIds] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (!myPartner || !isMasterPartner) return;
    supabase
      .from('partner_network')
      .select('child_partner_id')
      .eq('parent_partner_id', myPartner.id)
      .eq('is_active', true)
      .then(({ data }) => {
        setNetworkPartnerIds(new Set((data || []).map(d => d.child_partner_id)));
      });
  }, [myPartner, isMasterPartner]);

  /**
   * Clinic name display rules:
   * - Admin: full name always
   * - Partner: full name (all their clinics)
   * - Master Partner: full name for own clinics, abbreviated for network partner clinics
   */
  const getClinicDisplay = useCallback((clinicId: string | null): string => {
    if (!clinicId) return '—';
    const info = clinicMap[clinicId];
    if (!info) return clinicId;

    // Admin sees everything
    if (isAdmin) return info.name;

    // If master_partner and clinic belongs to a network partner → abbreviate
    if (isMasterPartner && myPartner && info.partnerId !== myPartner.id && networkPartnerIds.has(info.partnerId)) {
      const words = info.name.split(' ');
      if (words.length <= 1) return info.name.substring(0, 3) + '...';
      return words[0] + ' ' + words.slice(1).map(w => w[0] + '.').join(' ');
    }

    return info.name;
  }, [clinicMap, isAdmin, isMasterPartner, myPartner, networkPartnerIds]);

  const clinicIds = useMemo(() => [...new Set([
    ...incentives.map(i => i.clinic_external_id),
    ...commissions.map(c => c.clinic_external_id),
  ].filter(Boolean) as string[])], [incentives, commissions]);

  const attendantIds = useMemo(() => [...new Set(incentives.map(i => i.clinic_user_id).filter(Boolean))], [incentives]);

  const applyDateFilter = (item: any) => {
    const d = new Date(item.created_at);
    if (dateFrom && d < dateFrom) return false;
    if (dateTo && d > new Date(dateTo.getTime() + 86400000)) return false;
    return true;
  };

  const filteredCommissions = useMemo(() => commissions.filter(c => {
    if (!applyDateFilter(c)) return false;
    if (filterClinic !== 'ALL' && c.clinic_external_id !== filterClinic) return false;
    if (filterStatus !== 'ALL' && c.status !== filterStatus) return false;
    return true;
  }), [commissions, dateFrom, dateTo, filterClinic, filterStatus]);

  const filteredIncentives = useMemo(() => incentives.filter(i => {
    if (!applyDateFilter(i)) return false;
    if (filterClinic !== 'ALL' && i.clinic_external_id !== filterClinic) return false;
    if (filterAttendant !== 'ALL' && i.clinic_user_id !== filterAttendant) return false;
    if (filterStatus !== 'ALL' && i.status !== filterStatus) return false;
    return true;
  }), [incentives, dateFrom, dateTo, filterClinic, filterAttendant, filterStatus]);

  const mimoIncentives = filteredIncentives.filter(i => i.incentive_type === 'MIMO_SEMANAL');
  const pixIncentives = filteredIncentives.filter(i => i.incentive_type === 'PIX_MENSAL');

  const totalDirect = filteredCommissions.filter(c => c.commission_type === 'DIRECT').reduce((s, c) => s + Number(c.commission_amount), 0);
  const totalOverride = filteredCommissions.filter(c => c.commission_type === 'OVERRIDE').reduce((s, c) => s + Number(c.commission_amount), 0);
  const totalPix = pixIncentives.reduce((s, i) => s + Number(i.incentive_amount || 0), 0);

  const clinicNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const [id, info] of Object.entries(clinicMap)) {
      map[id] = info.name;
    }
    return map;
  }, [clinicMap]);

  const hasActiveFilters = filterClinic !== 'ALL' || filterAttendant !== 'ALL' || filterStatus !== 'ALL' || !!dateFrom || !!dateTo;

  const clearFilters = () => {
    setDateFrom(undefined); setDateTo(undefined);
    setFilterClinic('ALL'); setFilterAttendant('ALL'); setFilterStatus('ALL');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Bonificações e Incentivos</h1>
          <p className="text-muted-foreground">Gestão de bonificações de partners e incentivos de atendentes Help Ude</p>
        </div>

        <BonificacaoFilters
          dateFrom={dateFrom} dateTo={dateTo}
          filterClinic={filterClinic} filterAttendant={filterAttendant} filterStatus={filterStatus}
          clinicIds={clinicIds} attendantIds={attendantIds} clinicNameMap={clinicNameMap}
          onDateFromChange={setDateFrom} onDateToChange={setDateTo}
          onFilterClinicChange={setFilterClinic} onFilterAttendantChange={setFilterAttendant}
          onFilterStatusChange={setFilterStatus}
          onClearFilters={clearFilters} hasActiveFilters={hasActiveFilters}
        />

        <BonificacaoSummaryCards
          totalDirect={totalDirect} totalOverride={totalOverride}
          totalPix={totalPix} totalMimos={mimoIncentives.length}
        />

        <BonificacaoTiersInfo />

        <Tabs defaultValue="mimos">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="mimos" className="text-xs sm:text-sm">🎁 Mimos Semanais</TabsTrigger>
            <TabsTrigger value="pix" className="text-xs sm:text-sm">💰 PIX Mensal</TabsTrigger>
            <TabsTrigger value="bonificacoes" className="text-xs sm:text-sm">📊 Bonificações</TabsTrigger>
          </TabsList>

          <TabsContent value="mimos">
            <BonificacaoMimosTab
              items={mimoIncentives}
              loading={loading}
              hasActiveFilters={hasActiveFilters}
              canMarkDelivered={canMarkMimoDelivered}
              getClinicDisplay={getClinicDisplay}
              onRefresh={fetchData}
            />
          </TabsContent>

          <TabsContent value="pix">
            <BonificacaoPixTab
              items={pixIncentives}
              hasActiveFilters={hasActiveFilters}
              isAdmin={isAdmin}
              getClinicDisplay={getClinicDisplay}
              onRefresh={fetchData}
            />
          </TabsContent>

          <TabsContent value="bonificacoes">
            <BonificacaoCommissionsTab
              items={filteredCommissions}
              hasActiveFilters={hasActiveFilters}
              isAdmin={isAdmin}
              getClinicDisplay={getClinicDisplay}
              onRefresh={fetchData}
            />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default PartnersBonificacoes;
