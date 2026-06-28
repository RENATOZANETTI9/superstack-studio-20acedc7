import { useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Building2, Phone, MapPin, User, Mail, Plus, CheckCircle2, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ESPECIALIDADES = [
  'Clínica Geral',
  'Cardiologia',
  'Dermatologia',
  'Endocrinologia',
  'Ginecologia',
  'Neurologia',
  'Oftalmologia',
  'Ortopedia',
  'Pediatria',
  'Psiquiatria',
  'Reumatologia',
  'Urologia',
  'Odontologia',
  'Fisioterapia',
  'Nutrição',
  'Psicologia',
  'Outra',
];

const ESTADOS_BR = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
];

interface Clinica {
  id: string;
  nome: string;
  especialidade: string;
  bairro: string;
  cidade: string;
  estado: string;
  telefone: string;
  responsavel: string;
  status: 'ativa' | 'pendente';
}

const MOCK_CLINICAS: Clinica[] = [
  { id: '1', nome: 'Clínica São Lucas', especialidade: 'Cardiologia', bairro: 'Centro', cidade: 'São Paulo', estado: 'SP', telefone: '(11) 3333-1111', responsavel: 'Dr. Marcos Silva', status: 'ativa' },
  { id: '2', nome: 'Instituto Vida Saúde', especialidade: 'Clínica Geral', bairro: 'Jardins', cidade: 'São Paulo', estado: 'SP', telefone: '(11) 3333-2222', responsavel: 'Dra. Ana Souza', status: 'ativa' },
  { id: '3', nome: 'Clínica BemEstar', especialidade: 'Psicologia', bairro: 'Pinheiros', cidade: 'São Paulo', estado: 'SP', telefone: '(11) 3333-3333', responsavel: 'Dr. Pedro Costa', status: 'pendente' },
  { id: '4', nome: 'Centro Médico Norte', especialidade: 'Ortopedia', bairro: 'Santana', cidade: 'São Paulo', estado: 'SP', telefone: '(11) 3333-4444', responsavel: 'Dra. Carla Lima', status: 'ativa' },
];

const FORM_INITIAL = {
  nome: '',
  especialidade: '',
  endereco: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  estado: '',
  cep: '',
  telefone: '',
  email: '',
  responsavelNome: '',
  responsavelEmail: '',
  responsavelTelefone: '',
};

const PartnersManagement = () => {
  const { toast } = useToast();
  const [form, setForm] = useState(FORM_INITIAL);
  const [saving, setSaving] = useState(false);
  const [busca, setBusca] = useState('');

  const clinicasFiltradas = MOCK_CLINICAS.filter(c =>
    c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    c.bairro.toLowerCase().includes(busca.toLowerCase()) ||
    c.especialidade.toLowerCase().includes(busca.toLowerCase())
  );

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome || !form.especialidade || !form.bairro || !form.cidade || !form.estado || !form.telefone || !form.responsavelNome) {
      toast({ title: 'Campos obrigatórios', description: 'Preencha todos os campos marcados com *.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    await new Promise(r => setTimeout(r, 1000));
    setSaving(false);
    toast({ title: 'Clínica cadastrada!', description: `${form.nome} foi cadastrada com sucesso.` });
    setForm(FORM_INITIAL);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cadastro de Clínica</h1>
          <p className="text-sm text-muted-foreground mt-1">Registre uma nova clínica na sua carteira de atendimento</p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dados da Clínica */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                Dados da Clínica
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 space-y-1.5">
                  <Label htmlFor="nome">Nome da Clínica *</Label>
                  <Input id="nome" placeholder="Ex: Clínica São Lucas" value={form.nome} onChange={e => handleChange('nome', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Especialidade Principal *</Label>
                  <Select value={form.especialidade} onValueChange={v => handleChange('especialidade', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a especialidade" />
                    </SelectTrigger>
                    <SelectContent>
                      {ESPECIALIDADES.map(e => (
                        <SelectItem key={e} value={e}>{e}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="telefone">Telefone da Clínica *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="telefone" className="pl-9" placeholder="(00) 00000-0000" value={form.telefone} onChange={e => handleChange('telefone', e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">E-mail da Clínica</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="email" type="email" className="pl-9" placeholder="contato@clinica.com.br" value={form.email} onChange={e => handleChange('email', e.target.value)} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Endereço */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                Endereço
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-1.5">
                  <Label htmlFor="endereco">Logradouro</Label>
                  <Input id="endereco" placeholder="Rua, Avenida, etc." value={form.endereco} onChange={e => handleChange('endereco', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="numero">Número</Label>
                  <Input id="numero" placeholder="123" value={form.numero} onChange={e => handleChange('numero', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="complemento">Complemento</Label>
                  <Input id="complemento" placeholder="Sala 101, Andar 2..." value={form.complemento} onChange={e => handleChange('complemento', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="bairro">Bairro *</Label>
                  <Input id="bairro" placeholder="Bairro" value={form.bairro} onChange={e => handleChange('bairro', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cep">CEP</Label>
                  <Input id="cep" placeholder="00000-000" value={form.cep} onChange={e => handleChange('cep', e.target.value)} />
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <Label htmlFor="cidade">Cidade *</Label>
                  <Input id="cidade" placeholder="Cidade" value={form.cidade} onChange={e => handleChange('cidade', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Estado *</Label>
                  <Select value={form.estado} onValueChange={v => handleChange('estado', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="UF" />
                    </SelectTrigger>
                    <SelectContent>
                      {ESTADOS_BR.map(uf => (
                        <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Responsável */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                Responsável pela Clínica
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 space-y-1.5">
                  <Label htmlFor="responsavelNome">Nome do Responsável *</Label>
                  <Input id="responsavelNome" placeholder="Dr. Nome Sobrenome" value={form.responsavelNome} onChange={e => handleChange('responsavelNome', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="responsavelEmail">E-mail do Responsável</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="responsavelEmail" type="email" className="pl-9" placeholder="responsavel@clinica.com.br" value={form.responsavelEmail} onChange={e => handleChange('responsavelEmail', e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="responsavelTelefone">Telefone do Responsável</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="responsavelTelefone" className="pl-9" placeholder="(00) 00000-0000" value={form.responsavelTelefone} onChange={e => handleChange('responsavelTelefone', e.target.value)} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botão */}
          <div className="flex justify-end">
            <Button type="submit" disabled={saving} className="gap-2 min-w-[180px]">
              {saving ? (
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {saving ? 'Cadastrando...' : 'Cadastrar Clínica'}
            </Button>
          </div>
        </form>

        <Separator />

        {/* Lista de clínicas cadastradas */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Clínicas Cadastradas</h2>
              <p className="text-sm text-muted-foreground">{MOCK_CLINICAS.length} clínicas na sua carteira</p>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Buscar clínica..." value={busca} onChange={e => setBusca(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {clinicasFiltradas.map(c => (
              <Card key={c.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="font-medium text-sm truncate">{c.nome}</span>
                      </div>
                      <p className="text-xs text-muted-foreground pl-6">{c.especialidade}</p>
                      <p className="text-xs text-muted-foreground pl-6 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {c.bairro}, {c.cidade} – {c.estado}
                      </p>
                      <p className="text-xs text-muted-foreground pl-6 flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {c.responsavel}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0 ml-2">
                      {c.status === 'ativa' ? (
                        <Badge variant="default" className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100 text-xs gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Ativa
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">Pendente</Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {clinicasFiltradas.length === 0 && (
              <div className="col-span-2 text-center py-10 text-muted-foreground text-sm">
                Nenhuma clínica encontrada para "{busca}"
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PartnersManagement;
