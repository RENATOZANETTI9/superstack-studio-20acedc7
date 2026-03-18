import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';

const RegisterPartner = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const refCode = searchParams.get('ref') || '';

  const [validating, setValidating] = useState(true);
  const [linkValid, setLinkValid] = useState(false);
  const [linkError, setLinkError] = useState('');
  const [masterName, setMasterName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    person_type: 'CPF',
    document_number: '',
    legal_name: '',
    email: '',
    password: '',
    password_confirm: '',
    phone: '',
    region_state: '',
    region_city: '',
    years_in_health_market: 0,
    monthly_relationship_clinics: 0,
  });

  useEffect(() => {
    validateLink();
  }, [refCode]);

  const validateLink = async () => {
    if (!refCode) {
      setLinkError('Código de referência não fornecido. Solicite um link válido ao seu Master Partner.');
      setValidating(false);
      return;
    }

    const { data, error } = await supabase
      .from('partner_links')
      .select('id, partner_id, is_active, expires_at, max_uses, uses_count, partners(legal_name, status)')
      .eq('link_code', refCode)
      .eq('link_type', 'PARTNER_INVITATION')
      .single();

    if (error || !data) {
      setLinkError('Link de cadastro inválido ou não encontrado.');
      setValidating(false);
      return;
    }

    if (!data.is_active) {
      setLinkError('Este link de cadastro não está mais ativo.');
      setValidating(false);
      return;
    }

    if (data.max_uses && data.uses_count >= data.max_uses) {
      setLinkError('Este link atingiu o número máximo de cadastros.');
      setValidating(false);
      return;
    }

    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      setLinkError('Este link de cadastro expirou.');
      setValidating(false);
      return;
    }

    const partner = data.partners as any;
    if (!partner || partner.status !== 'ACTIVE') {
      setLinkError('O parceiro referenciador não está ativo.');
      setValidating(false);
      return;
    }

    setMasterName(partner.legal_name);
    setLinkValid(true);
    setValidating(false);
  };

  const handleSubmit = async () => {
    if (!form.legal_name || !form.email || !form.password || !form.document_number) {
      toast({ title: 'Preencha todos os campos obrigatórios', variant: 'destructive' });
      return;
    }

    if (form.password.length < 6) {
      toast({ title: 'A senha deve ter pelo menos 6 caracteres', variant: 'destructive' });
      return;
    }

    if (form.password !== form.password_confirm) {
      toast({ title: 'As senhas não coincidem', variant: 'destructive' });
      return;
    }

    setSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('register-partner', {
        body: {
          ref_code: refCode,
          email: form.email,
          password: form.password,
          person_type: form.person_type,
          document_number: form.document_number,
          legal_name: form.legal_name,
          phone: form.phone,
          region_state: form.region_state,
          region_city: form.region_city,
          years_in_health_market: form.years_in_health_market,
          monthly_relationship_clinics: form.monthly_relationship_clinics,
        },
      });

      if (error) {
        toast({ title: 'Erro ao cadastrar', description: error.message, variant: 'destructive' });
        setSubmitting(false);
        return;
      }

      if (data?.error) {
        toast({ title: 'Erro ao cadastrar', description: data.error, variant: 'destructive' });
        setSubmitting(false);
        return;
      }

      // Auto-login the new partner
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });

      if (loginError) {
        toast({ title: 'Cadastro realizado!', description: 'Faça login com suas credenciais.' });
        setSuccess(true);
        setSubmitting(false);
        return;
      }

      toast({ title: 'Cadastro realizado com sucesso!', description: 'Bem-vindo à Help Ude Partners!' });
      navigate('/dashboard');
    } catch (err: any) {
      toast({ title: 'Erro inesperado', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (validating) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Validando link de cadastro...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!linkValid) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 flex flex-col items-center gap-4 text-center">
            <AlertTriangle className="h-12 w-12 text-destructive" />
            <h2 className="text-xl font-bold">Link Inválido</h2>
            <p className="text-muted-foreground">{linkError}</p>
            <Button variant="outline" onClick={() => navigate('/')}>Voltar ao Início</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 flex flex-col items-center gap-4 text-center">
            <CheckCircle className="h-12 w-12 text-green-500" />
            <h2 className="text-xl font-bold">Cadastro Realizado!</h2>
            <p className="text-muted-foreground">Sua conta foi criada com sucesso. Faça login para começar.</p>
            <Button onClick={() => navigate('/auth')}>Ir para Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <img src="/assets/logo.png" alt="Help Ude" className="h-10 mx-auto" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          </div>
          <CardTitle className="text-2xl">Cadastro de Parceiro</CardTitle>
          <CardDescription>
            Você foi convidado por <strong>{masterName}</strong> para se tornar um parceiro Help Ude.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-sm">
            <p>📋 Preencha seus dados para criar sua conta de parceiro. Após o cadastro, você já poderá acessar o sistema e começar a adicionar clínicas.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tipo de Pessoa</Label>
              <Select value={form.person_type} onValueChange={v => setForm({ ...form, person_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CPF">CPF</SelectItem>
                  <SelectItem value="CNPJ">CNPJ</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Documento *</Label>
              <Input
                value={form.document_number}
                onChange={e => setForm({ ...form, document_number: e.target.value })}
                placeholder={form.person_type === 'CPF' ? '000.000.000-00' : '00.000.000/0001-00'}
              />
            </div>
          </div>

          <div>
            <Label>Nome / Razão Social *</Label>
            <Input value={form.legal_name} onChange={e => setForm({ ...form, legal_name: e.target.value })} placeholder="Nome completo" />
          </div>

          <div>
            <Label>E-mail *</Label>
            <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@exemplo.com" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Senha *</Label>
              <Input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Mínimo 6 caracteres" />
            </div>
            <div>
              <Label>Confirmar Senha *</Label>
              <Input type="password" value={form.password_confirm} onChange={e => setForm({ ...form, password_confirm: e.target.value })} placeholder="Repita a senha" />
            </div>
          </div>

          <div>
            <Label>Telefone</Label>
            <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+55 71 99999-0000" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Estado</Label>
              <Input value={form.region_state} onChange={e => setForm({ ...form, region_state: e.target.value })} placeholder="BA" />
            </div>
            <div>
              <Label>Cidade</Label>
              <Input value={form.region_city} onChange={e => setForm({ ...form, region_city: e.target.value })} placeholder="Salvador" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Anos no mercado de saúde</Label>
              <Input type="number" value={form.years_in_health_market} onChange={e => setForm({ ...form, years_in_health_market: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Clínicas que se relaciona/mês</Label>
              <Input type="number" value={form.monthly_relationship_clinics} onChange={e => setForm({ ...form, monthly_relationship_clinics: Number(e.target.value) })} />
            </div>
          </div>

          <Button onClick={handleSubmit} disabled={submitting} className="w-full" size="lg">
            {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <UserPlus className="h-4 w-4 mr-2" />}
            {submitting ? 'Cadastrando...' : 'Criar Minha Conta de Parceiro'}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Já tem uma conta? <a href="/auth" className="text-primary hover:underline">Faça login</a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegisterPartner;
