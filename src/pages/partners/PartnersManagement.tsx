import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, UserPlus } from 'lucide-react';

const PartnersManagement = () => {
  const { user, isMaster } = useAuth();
  const { toast } = useToast();
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
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
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('partners')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setPartners(data);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!form.legal_name || !form.email || !form.document_number) {
      toast({ title: 'Preencha os campos obrigatórios', variant: 'destructive' });
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
      fetchPartners();
    }
  };

  const filtered = partners.filter(p => 
    p.legal_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.email?.toLowerCase().includes(search.toLowerCase()) ||
    p.document_number?.includes(search)
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Cadastro de Partners</h1>
            <p className="text-muted-foreground">Gerenciar parceiros e masters</p>
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
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Tipo</Label>
                      <Select value={form.type} onValueChange={v => setForm({...form, type: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PARTNER">Partner</SelectItem>
                          <SelectItem value="MASTER">Master Partner</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
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
                  </div>
                  <div>
                    <Label>Documento (CPF/CNPJ)</Label>
                    <Input value={form.document_number} onChange={e => setForm({...form, document_number: e.target.value})} placeholder="00.000.000/0000-00" />
                  </div>
                  <div>
                    <Label>Nome / Razão Social</Label>
                    <Input value={form.legal_name} onChange={e => setForm({...form, legal_name: e.target.value})} placeholder="Nome completo" />
                  </div>
                  <div>
                    <Label>E-mail</Label>
                    <Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="email@exemplo.com" />
                  </div>
                  <div>
                    <Label>Telefone</Label>
                    <Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="+55 71 99999-0000" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Estado</Label>
                      <Input value={form.region_state} onChange={e => setForm({...form, region_state: e.target.value})} placeholder="BA" />
                    </div>
                    <div>
                      <Label>Cidade</Label>
                      <Input value={form.region_city} onChange={e => setForm({...form, region_city: e.target.value})} placeholder="Salvador" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Anos no mercado de saúde</Label>
                      <Input type="number" value={form.years_in_health_market} onChange={e => setForm({...form, years_in_health_market: Number(e.target.value)})} />
                    </div>
                    <div>
                      <Label>Clínicas relacionadas/mês</Label>
                      <Input type="number" value={form.monthly_relationship_clinics} onChange={e => setForm({...form, monthly_relationship_clinics: Number(e.target.value)})} />
                    </div>
                  </div>
                  <Button onClick={handleCreate} className="w-full">
                    <UserPlus className="h-4 w-4 mr-2" /> Cadastrar Partner
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por nome, e-mail ou documento..." 
            value={search} 
            onChange={e => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Partners List */}
        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>Nenhum partner encontrado</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-3 font-medium">Nome</th>
                      <th className="pb-3 font-medium">Tipo</th>
                      <th className="pb-3 font-medium">Documento</th>
                      <th className="pb-3 font-medium">Nível</th>
                      <th className="pb-3 font-medium">SEH</th>
                      <th className="pb-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(p => (
                      <tr key={p.id} className="border-b hover:bg-accent/50 transition-colors">
                        <td className="py-3">
                          <div>
                            <p className="font-medium">{p.legal_name}</p>
                            <p className="text-xs text-muted-foreground">{p.email}</p>
                          </div>
                        </td>
                        <td className="py-3"><Badge variant="outline">{p.type}</Badge></td>
                        <td className="py-3 text-muted-foreground">{p.document_number}</td>
                        <td className="py-3"><Badge>{p.current_level}</Badge></td>
                        <td className="py-3 font-mono">{Number(p.seh_score || 0).toFixed(1)}</td>
                        <td className="py-3">
                          <Badge variant={p.status === 'ACTIVE' ? 'default' : 'secondary'}>
                            {p.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default PartnersManagement;
