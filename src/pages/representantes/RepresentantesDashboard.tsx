import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useRepresentanteGuard } from '@/hooks/useRepresentanteGuard';
import { Users, Star, Building2, Award, Activity, UserPlus } from 'lucide-react';
import { MOCK_PARTNERS, MOCK_CLINICS, withMockFallback } from '@/lib/mock-data';
import { toast } from 'sonner';

const ESTADOS_BR = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'
];

const RepresentantesDashboard = () => {
  const navigate = useNavigate();
  const { role } = useAuth();
  useRepresentanteGuard('admin');
  const [partners, setPartners] = useState<any[]>([]);
  const [clinics, setClinics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', phone: '', type: 'PARTNER', region_state: '', region_city: '',
  });

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

  const handleSave = async () => {
    if (!form.name || !form.email) {
      toast.error('Nome e e-mail são obrigatórios');
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('partners').insert([{
      user_id: crypto.randomUUID(),
      legal_name: form.name,
      document_number: '',
      email: form.email,
      phone: form.phone || null,
      type: form.type,
      region_state: form.region_state || null,
      region_city: form.region_city || null,
      status: 'PENDING',
      person_type: 'PF',
    }]);
    setSaving(false);
    if (error) {
      toast.error('Erro ao cadastrar representante', { description: error.message });
    } else {
      toast.success('Representante pré-cadastrado com sucesso', {
        description: 'O acesso ao sistema deve ser configurado pelo administrador.',
      });
      setDialogOpen(false);
      setForm({ name: '', email: '', phone: '', type: 'PARTNER', region_state: '', region_city: '' });
      fetchData();
    }
  };

  const totalReps = partners.length;
  const masterPartners = partners.filter((p: any) => p.type === 'MASTER').length;
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
          <div className="flex gap-2">
            <Button onClick={fetchData} variant="outline" size="sm">Atualizar</Button>
            <Button onClick={() => setDialogOpen(true)} size="sm" className="gap-2">
              <UserPlus className="h-4 w-4" /> Cadastrar Representante
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-primary/10"><Users className="h-5 w-5 text-primary" /></div><div><p className="text-sm text-muted-foreground">Total</p><p className="text-2xl font-bold">{totalReps}</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-purple-500/10"><Star className="h-5 w-5 text-purple-500" /></div><div><p className="text-sm text-muted-foreground">Master Partners</p><p className="text-2xl font-bold">{masterPartners}</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-green-500/10"><Activity className="h-5 w-5 text-green-500" /></div><div><p className="text-sm text-muted-foreground">Ativos</p><p className="text-2xl font-bold">{activeReps}</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-blue-500/10"><Building2 className="h-5 w-5 text-blue-500" /></div><div><p className="text-sm text-muted-foreground">Clínicas Vinculadas</p><p className="text-2xl font-bold">{totalClinics}</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-yellow-500/10"><Award className="h-5 w-5 text-yellow-500" /></div><div><p className="text-sm text-muted-foreground">SEH Médio</p><p className="text-2xl font-bold">{avgSeh}</p></div></div></CardContent></Card>
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
                  const isMaster = p.type === 'MASTER';
                  const clinicCount = clinics.filter((c: any) => c.partner_id === p.id).length;
                  const name = p.legal_name || p.name || p.email?.split('@')[0] || 'Representante';
                  return (
                    <div key={p.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border bg-card hover:bg-accent/30 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-bold text-sm text-white ${isMaster ? 'bg-purple-600' : 'bg-primary'}`}>
                          {name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{name}</p>
                          <p className="text-xs text-muted-foreground truncate">{p.email || '—'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <Badge variant={isMaster ? 'default' : 'secondary'} className={isMaster ? 'bg-purple-600 text-white' : ''}>
                          {isMaster ? 'Master Partner' : 'Partner'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{clinicCount} clínica{clinicCount !== 1 ? 's' : ''}</span>
                        <Badge variant="outline" className={p.status === 'ACTIVE' ? 'text-green-700 border-green-300' : p.status === 'PENDING' ? 'text-yellow-700 border-yellow-300' : 'text-muted-foreground'}>
                          {p.status === 'ACTIVE' ? 'Ativo' : p.status === 'PENDING' ? 'Pendente' : 'Inativo'}
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cadastrar Representante</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="rep-name">Nome completo *</Label>
              <Input id="rep-name" placeholder="Ex: João Silva" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rep-email">E-mail *</Label>
              <Input id="rep-email" type="email" placeholder="joao@email.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rep-phone">Telefone</Label>
              <Input id="rep-phone" placeholder="(11) 99999-0000" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PARTNER">Partner</SelectItem>
                  <SelectItem value="MASTER">Master Partner</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Estado</Label>
                <Select value={form.region_state} onValueChange={v => setForm(f => ({ ...f, region_state: v }))}>
                  <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                  <SelectContent>{ESTADOS_BR.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rep-city">Cidade</Label>
                <Input id="rep-city" placeholder="Ex: São Paulo" value={form.region_city} onChange={e => setForm(f => ({ ...f, region_city: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Salvando...' : 'Cadastrar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default RepresentantesDashboard;
