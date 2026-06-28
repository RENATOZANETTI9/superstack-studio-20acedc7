import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Users, Star, Building2, Award, Activity } from 'lucide-react';
import { MOCK_PARTNERS, MOCK_CLINICS, withMockFallback } from '@/lib/mock-data';

const RepresentantesDashboard = () => {
  const [partners, setPartners] = useState<any[]>([]);
  const [clinics, setClinics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const [partnersRes, clinicsRes] = await Promise.all([
      supabase.from('partners').select('*').order('created_at', { ascending: false }),
      supabase.from('partner_clinic_relations').select('*'),
    ]);
    setPartners(withMockFallback(partnersRes.data, MOCK_PARTNERS));
    setClinics(withMockFallback(clinicsRes.data, MOCK_CLINICS));
    setLoading(false);
  };

  const totalReps = partners.length;
  const masterPartners = partners.filter((p: any) => p.type === 'MASTER' || p.role === 'master_partner').length;
  const activeReps = partners.filter((p: any) => p.status === 'ACTIVE').length;
  const totalClinics = clinics.length;
  const avgSeh = partners.length > 0
    ? (partners.reduce((s: number, p: any) => s + Number(p.seh_score || 0), 0) / partners.length).toFixed(1)
    : '0';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Representantes</h1>
            <p className="text-sm text-muted-foreground">Gestão da rede de representantes comerciais</p>
          </div>
          <Button onClick={fetchData} variant="outline" size="sm">Atualizar</Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-primary/10"><Users className="h-5 w-5 text-primary" /></div><div><p className="text-sm text-muted-foreground">Total Representantes</p><p className="text-2xl font-bold">{totalReps}</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-purple-500/10"><Star className="h-5 w-5 text-purple-500" /></div><div><p className="text-sm text-muted-foreground">Master Partners</p><p className="text-2xl font-bold">{masterPartners}</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-green-500/10"><Activity className="h-5 w-5 text-green-500" /></div><div><p className="text-sm text-muted-foreground">Ativos</p><p className="text-2xl font-bold">{activeReps}</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-blue-500/10"><Building2 className="h-5 w-5 text-blue-500" /></div><div><p className="text-sm text-muted-foreground">Clínicas Vinculadas</p><p className="text-2xl font-bold">{totalClinics}</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-yellow-500/10"><Award className="h-5 w-5 text-yellow-500" /></div><div><p className="text-sm text-muted-foreground">SEH Médio Rede</p><p className="text-2xl font-bold">{avgSeh}</p></div></div></CardContent></Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4 text-primary" />Representantes Cadastrados</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground text-sm">Carregando...</div>
            ) : (
              <div className="space-y-2">
                {partners.map((p: any) => {
                  const isMaster = p.type === 'MASTER' || p.role === 'master_partner';
                  const clinicCount = clinics.filter((c: any) => c.partner_id === p.id).length;
                  return (
                    <div key={p.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border bg-card hover:bg-accent/30 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-bold text-sm text-white ${isMaster ? 'bg-purple-600' : 'bg-primary'}`}>
                          {(p.name || p.email || 'R').charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{p.name || p.email?.split('@')[0] || 'Representante'}</p>
                          <p className="text-xs text-muted-foreground truncate">{p.email || '—'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <Badge variant={isMaster ? 'default' : 'secondary'} className={isMaster ? 'bg-purple-600 text-white' : ''}>
                          {isMaster ? 'Master Partner' : 'Partner'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{clinicCount} clínica{clinicCount !== 1 ? 's' : ''}</span>
                        <Badge variant="outline" className={p.status === 'ACTIVE' ? 'text-green-700 border-green-300' : 'text-muted-foreground'}>
                          {p.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
                        </Badge>
                        <span className="text-sm font-semibold tabular-nums">SEH {Number(p.seh_score || 0).toFixed(0)}</span>
                      </div>
                    </div>
                  );
                })}
                {partners.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">Nenhum representante cadastrado</div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default RepresentantesDashboard;