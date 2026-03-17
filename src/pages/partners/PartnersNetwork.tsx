import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { GitBranch, Users, Building2, ChevronDown, ChevronUp } from 'lucide-react';

const levelColors: Record<string, string> = {
  BRONZE: 'bg-amber-700 text-white',
  PRATA: 'bg-gray-400 text-white',
  OURO: 'bg-yellow-500 text-white',
  ELITE: 'bg-purple-600 text-white',
};

const PartnersNetwork = () => {
  const [network, setNetwork] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [clinics, setClinics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedMaster, setExpandedMaster] = useState<string | null>(null);
  const [expandedPartnerClinics, setExpandedPartnerClinics] = useState<string | null>(null);

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
  const standalonePartners = partners.filter(p => p.type === 'PARTNER' && !network.some(n => n.child_partner_id === p.id));

  const renderClinicList = (partnerId: string) => {
    const pClinics = getPartnerClinics(partnerId);
    const active = pClinics.filter(c => c.is_active);
    const inactive = pClinics.filter(c => !c.is_active);
    const isExpanded = expandedPartnerClinics === partnerId;

    return (
      <div className="mt-2">
        <button onClick={(e) => { e.stopPropagation(); setExpandedPartnerClinics(isExpanded ? null : partnerId); }}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <Building2 className="h-3 w-3" />
          <span>{active.length} ativas · {inactive.length} inativas</span>
          {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
        {isExpanded && (
          <div className="mt-2 ml-4 space-y-1">
            {pClinics.map(c => (
              <div key={c.id} className="flex items-center gap-2 text-xs p-1.5 rounded bg-muted/30">
                <div className={`h-2 w-2 rounded-full ${c.is_active ? 'bg-green-500' : 'bg-red-400'}`} />
                <span className={c.is_active ? '' : 'text-muted-foreground'}>{c.clinic_name}</span>
                <span className="text-muted-foreground ml-auto">{c.consultations_count} consultas · {c.paid_count} pagos</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderPartnerCard = (p: any, indent: boolean = false) => {
    const pClinics = getPartnerClinics(p.id);
    const activeClinics = pClinics.filter(c => c.is_active).length;
    return (
      <div key={p.id} className={`p-3 rounded-lg border bg-card ${indent ? 'ml-8 border-l-4 border-l-muted' : ''}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full ${p.type === 'MASTER' ? 'bg-purple-500/10' : 'bg-primary/10'}`}>
              <Users className={`h-4 w-4 ${p.type === 'MASTER' ? 'text-purple-500' : 'text-primary'}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium text-sm">{p.legal_name}</p>
                <Badge variant="outline" className={`text-[10px] ${p.type === 'MASTER' ? 'border-purple-500 text-purple-700' : ''}`}>
                  {p.type === 'MASTER' ? 'Master Partner' : 'Partner Comum'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{p.region_city}/{p.region_state} · SEH: {Number(p.seh_score || 0).toFixed(1)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={levelColors[p.current_level] || 'bg-muted'} >{p.current_level}</Badge>
            <Badge variant={p.status === 'ACTIVE' ? 'default' : p.status === 'SUSPENDED' ? 'destructive' : 'secondary'} className="text-[10px]">
              {p.status === 'ACTIVE' ? 'Ativo' : p.status === 'PENDING' ? 'Pendente' : 'Suspenso'}
            </Badge>
            <span className="text-xs text-muted-foreground">{activeClinics} clínicas</span>
          </div>
        </div>
        {renderClinicList(p.id)}
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Rede de Partners</h1>
          <p className="text-muted-foreground">Visão da estrutura Master Partner → Partners e suas clínicas vinculadas</p>
        </div>

        {/* Stats */}
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
            <p className="text-2xl font-bold">{partners.filter(p => p.type === 'PARTNER').length}</p>
            <p className="text-xs text-muted-foreground">Partners Comuns</p>
          </CardContent></Card>
          <Card><CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold text-green-600">{clinics.filter(c => c.is_active).length}</p>
            <p className="text-xs text-muted-foreground">Clínicas Ativas</p>
          </CardContent></Card>
        </div>

        {loading ? (
          <div className="flex justify-center py-8"><div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" /></div>
        ) : (
          <div className="space-y-6">
            {/* Master Partners and their networks */}
            {masterPartners.map(master => {
              const childRels = network.filter(n => n.parent_partner_id === master.id);
              const isExpanded = expandedMaster === master.id;
              return (
                <Card key={master.id}>
                  <CardHeader className="pb-3 cursor-pointer" onClick={() => setExpandedMaster(isExpanded ? null : master.id)}>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <GitBranch className="h-5 w-5 text-purple-500" />
                        Rede: {master.legal_name}
                        <Badge className="bg-purple-600 text-white text-[10px]">Master</Badge>
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{childRels.length} partner{childRels.length !== 1 ? 's' : ''} na rede</span>
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </div>
                  </CardHeader>
                  {isExpanded && (
                    <CardContent className="space-y-3">
                      {renderPartnerCard(master)}
                      {childRels.length > 0 ? (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-muted-foreground ml-8">Partners vinculados:</p>
                          {childRels.map(rel => {
                            const child = getPartner(rel.child_partner_id);
                            if (!child) return null;
                            return (
                              <div key={rel.id}>
                                {renderPartnerCard(child, true)}
                                {!rel.is_active && (
                                  <p className="text-xs text-red-500 ml-12 mt-1">⚠ Vínculo inativo</p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground ml-8">Nenhum partner vinculado a esta rede.</p>
                      )}
                    </CardContent>
                  )}
                </Card>
              );
            })}

            {/* Standalone partners (not in any network) */}
            {standalonePartners.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    Partners Independentes
                    <Badge variant="secondary" className="text-[10px]">{standalonePartners.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {standalonePartners.map(p => renderPartnerCard(p))}
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
