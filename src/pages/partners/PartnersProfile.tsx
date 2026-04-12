import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Mail, Phone, FileText, MapPin, Save, Loader2, Pill, Wrench, HeartPulse, Megaphone, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

const CATEGORIAS: Record<string, { label: string; icon: any }> = {
  representante_farmaceutico: { label: 'Representante Farmacêutico', icon: Pill },
  equipamentos_cirurgias: { label: 'Equipamentos de Cirurgias', icon: Wrench },
  outros_saude: { label: 'Outros na Área de Saúde', icon: HeartPulse },
  gestor_trafego: { label: 'Gestor de Tráfego Médico', icon: Megaphone },
  creator_influencer: { label: 'Creator & Influencer', icon: Star },
};

export default function PartnersProfile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [partner, setPartner] = useState<any>(null);

  const [legalName, setLegalName] = useState('');
  const [phone, setPhone] = useState('');
  const [regionState, setRegionState] = useState('');
  const [regionCity, setRegionCity] = useState('');

  useEffect(() => {
    if (!user) return;
    const fetchPartner = async () => {
      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data && !error) {
        setPartner(data);
        setLegalName(data.legal_name || '');
        setPhone(data.phone || '');
        setRegionState(data.region_state || '');
        setRegionCity(data.region_city || '');
      }
      setLoading(false);
    };
    fetchPartner();
  }, [user]);

  const handleSave = async () => {
    if (!partner) return;
    setSaving(true);
    const { error } = await supabase
      .from('partners')
      .update({
        legal_name: legalName.trim(),
        phone: phone.trim() || null,
        region_state: regionState.trim() || null,
        region_city: regionCity.trim() || null,
      })
      .eq('id', partner.id);

    if (error) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Perfil atualizado com sucesso!' });
    }
    setSaving(false);
  };

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const catInfo = partner?.categoria ? CATEGORIAS[partner.categoria] : null;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!partner) {
    return (
      <DashboardLayout>
        <div className="text-center py-12 text-muted-foreground">
          Nenhum registro de partner encontrado.
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
            <User className="w-7 h-7 text-primary" />
            Meu Perfil
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Visualize e edite seus dados pessoais</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Info Card */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base">Informações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center">
                  <User className="w-10 h-10 text-white" />
                </div>
              </div>
              <div className="text-center space-y-1">
                <p className="font-semibold text-foreground">{partner.legal_name}</p>
                <p className="text-sm text-muted-foreground">{partner.email}</p>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Status</span>
                  <Badge variant={partner.status === 'ACTIVE' ? 'default' : 'secondary'}>
                    {partner.status === 'ACTIVE' ? 'Ativo' : partner.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Tipo</span>
                  <Badge variant="outline">
                    {partner.type === 'MASTER' ? 'Master Partner' : 'Partner'}
                  </Badge>
                </div>
                {catInfo && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Categoria</span>
                    <Badge variant="outline" className="gap-1">
                      <catInfo.icon className="w-3 h-3" />
                      {catInfo.label}
                    </Badge>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">CPF</span>
                  <span className="text-sm font-mono text-foreground">
                    {partner.document_number?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Edit Card */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Editar Dados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  Nome Completo
                </label>
                <Input value={legalName} onChange={(e) => setLegalName(e.target.value)} className="h-11" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  E-mail
                </label>
                <Input value={partner.email} disabled className="h-11 bg-muted" />
                <p className="text-xs text-muted-foreground">O e-mail não pode ser alterado.</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  WhatsApp
                </label>
                <Input
                  value={formatPhone(phone)}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="(11) 99999-9999"
                  className="h-11"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    Estado
                  </label>
                  <Input value={regionState} onChange={(e) => setRegionState(e.target.value)} placeholder="SP" className="h-11" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    Cidade
                  </label>
                  <Input value={regionCity} onChange={(e) => setRegionCity(e.target.value)} placeholder="São Paulo" className="h-11" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  Categoria de Atuação
                </label>
                <Input
                  value={catInfo?.label || partner.categoria || 'Não definida'}
                  disabled
                  className="h-11 bg-muted"
                />
                <p className="text-xs text-muted-foreground">A categoria é definida no cadastro e não pode ser alterada.</p>
              </div>

              <div className="pt-2">
                <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Salvar Alterações
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
