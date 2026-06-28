import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, Users, Building2, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { MOCK_PARTNERS, MOCK_CLINICS, withMockFallback } from '@/lib/mock-data';

const RepresentantesRede = () => {
  const [partners, setPartners] = useState<any[]>([]);
  const [clinics, setClinics] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const [pRes, cRes] = await Promise.all([
      supabase.from('partners').select('*').order('created_at', { ascending: false }),
      supabase.from('partner_clinic_relations').select('*'),
    ]);
    setPartners(withMockFallback(pRes.data, MOCK_PARTNERS));
    setClinics(withMockFallback(cRes.data, MOCK_CLINICS));
    setLoading(false);
  };

  const masters = partners.filter((p: any) => p.type === 'MASTER' || p.role === 'master_partner');
  const regularPartners = partners.filter((p: any) => p.type !== 'MASTER' && p.role !== 'master_partner');

  const toggle = (id: string) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Rede & Hierarquia</h1>
            <p className="text-sm text-muted-foreground">Estrutura completa da rede de representantes</p>
          </div>
          <Button onClick={fetchData} variant="outline" size="sm">Atualizar</Button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Card><CardContent className="pt-4 pb-4"><div className="flex items-center gap-3"><Star className="h-5 w-5 text-purple-500" /><div><p className="text-xs text-muted-foreground">Master Partners</p><p className="text-xl font-bold">{masters.length}</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-4 pb-4"><div className="flex items-center gap-3"><Users className="h-5 w-5 text-primary" /><div><p className="text-xs text-muted-foreground">Partners</p><p className="text-xl font-bold">{regularPartners.length}</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-4 pb-4"><div className="flex items-center gap-3"><Building2 className="h-5 w-5 text-blue-500" /><div><p className="text-xs text-muted-foreground">Clínicas Totais</p><p className="text-xl font-bold">{clinics.length}</p></div></div></CardContent></Card>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Carregando hierarquia...</div>
        ) : (
          <div className="space-y-3">
            {masters.map((master: any) => {
              const isOpen = expanded[master.id] !== false;
              const subPartners = regularPartners.filter((p: any) => p.master_partner_id === master.id || p.referred_by === master.id);
              const masterClinics = clinics.filter((c: any) => c.partner_id === master.id);
              const masterSeh = Number(master.seh_score || 0).toFixed(0);

              return (
                <Card key={master.id} className="overflow-hidden">
                  <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-accent/30 transition-colors" onClick={() => toggle(master.id)}>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-600 text-white font-bold text-sm">
                        {(master.name || master.email || 'M').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm">{master.name || master.email?.split('@')[0] || 'Master Partner'}</p>
                          <Badge className="bg-purple-600 text-white text-[10px] px-1.5">Master</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{subPartners.length} partners · {masterClinics.length} clínicas · SEH {masterSeh}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className={master.status === 'ACTIVE' ? 'text-green-700 border-green-300' : ''}>
                        {master.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
                      </Badge>
                      {isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </div>

                  {isOpen && (
                    <div className="border-t bg-muted/30">
                      {subPartners.length > 0 ? (
                        <div className="p-3 space-y-2">
                          {subPartners.map((sp: any) => {
                            const spClinics = clinics.filter((c: any) => c.partner_id === sp.id);
                            return (
                              <div key={sp.id} className="flex items-center justify-between p-3 rounded-lg bg-card border ml-4">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white font-bold text-xs">
                                    {(sp.name || sp.email || 'P').charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="font-medium text-sm">{sp.name || sp.email?.split('@')[0] || 'Partner'}</p>
                                    <p className="text-xs text-muted-foreground">{spClinics.length} clínica{spClinics.length !== 1 ? 's' : ''} · SEH {Number(sp.seh_score || 0).toFixed(0)}</p>
                                  </div>
                                </div>
                                <Badge variant="secondary" className="text-xs">Partner</Badge>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-4 ml-4 text-xs text-muted-foreground">Nenhum partner vinculado a este Master</div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}

            {regularPartners.filter((p: any) => !masters.some((m: any) => p.master_partner_id === m.id || p.referred_by === m.id)).length > 0 && (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Partners Independentes</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {regularPartners.filter((p: any) => !masters.some((m: any) => p.master_partner_id === m.id || p.referred_by === m.id)).map((p: any) => {
                    const pClinics = clinics.filter((c: any) => c.partner_id === p.id);
                    return (
                      <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white font-bold text-xs">
                            {(p.name || p.email || 'P').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{p.name || p.email?.split('@')[0] || 'Partner'}</p>
                            <p className="text-xs text-muted-foreground">{pClinics.length} clínica{pClinics.length !== 1 ? 's' : ''} · SEH {Number(p.seh_score || 0).toFixed(0)}</p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-xs">Partner</Badge>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {partners.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Nenhum representante na rede</p>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default RepresentantesRede;