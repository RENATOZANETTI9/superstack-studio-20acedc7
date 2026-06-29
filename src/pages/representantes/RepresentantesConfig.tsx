import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Settings, DollarSign, Target, Zap, Gift, Flag, Pencil, History, Info, Lock } from 'lucide-react';
import { isAdminRole, canAccessConfig } from '@/lib/partner-rules';
import JsonEditor from '@/components/partners/JsonEditor';

const categoryLabels: Record<string, string> = {
  COMMISSION_RATES: 'Taxas de Bonificação',
  LEVEL_THRESHOLDS: 'Faixas de Nível',
  SEH_WEIGHTS: 'Pesos SEH',
  PIX_TIERS: 'Faixas PIX',
  MIMO_TIERS: 'Faixas Mimo',
  FEATURE_FLAGS: 'Funcionalidades',
  ALERT_RULES: 'Regras de Alerta',
  GENERAL: 'Geral',
};

const categoryDescriptions: Record<string, string> = {
  COMMISSION_RATES: 'Percentuais aplicados sobre valores pagos para cálculo de bonificações diretas e de rede',
  LEVEL_THRESHOLDS: 'Intervalos de Score SEH que definem os níveis Bronze, Prata, Ouro e Elite',
  SEH_WEIGHTS: 'Pesos de cada pilar (Ativação, Volume, Conversão) na composição do Score SEH',
  PIX_TIERS: 'Faixas de produção mensal paga que determinam o valor do PIX devido ao atendente',
  MIMO_TIERS: 'Faixas de volume semanal de simulações que determinam o tipo de mimo',
  FEATURE_FLAGS: 'Controle de funcionalidades ativas/inativas no sistema',
  ALERT_RULES: 'Parâmetros que disparam alertas automáticos no monitoramento',
  GENERAL: 'Configurações gerais do módulo Partners',
};

const categoryIcons: Record<string, any> = {
  COMMISSION_RATES: DollarSign,
  LEVEL_THRESHOLDS: Target,
  SEH_WEIGHTS: Zap,
  PIX_TIERS: DollarSign,
  MIMO_TIERS: Gift,
  FEATURE_FLAGS: Flag,
  ALERT_RULES: Settings,
  GENERAL: Settings,
};

const PartnersConfig = () => {
  const navigate = useNavigate();
  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<any>(null);
  const [editValue, setEditValue] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editActive, setEditActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [jsonValid, setJsonValid] = useState(true);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const { role, user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const isAdmin = isAdminRole(role as any);

  // Redirect non-admin users
  useEffect(() => {
    if (!authLoading && role && !canAccessConfig(role as any)) {
      navigate('/dashboard/partners');
    }
  }, [role, authLoading, navigate]);

  useEffect(() => { fetchConfigs(); }, []);

  const fetchConfigs = async () => {
    const { data } = await supabase
      .from('partner_system_config')
      .select('*')
      .order('category', { ascending: true });
    setConfigs(data || []);
    setLoading(false);
  };

  const openEdit = (config: any) => {
    setEditingConfig(config);
    setEditValue(JSON.stringify(config.config_value, null, 2));
    setEditDescription(config.description || '');
    setEditActive(config.is_active);
    setJsonValid(true);
    setEditDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingConfig || !user || !jsonValid) return;

    let parsedValue: any;
    try {
      parsedValue = JSON.parse(editValue);
    } catch {
      toast({ title: 'JSON inválido', description: 'Corrija os erros de sintaxe antes de salvar.', variant: 'destructive' });
      return;
    }

    setSaving(true);
    await supabase.from('partner_config_history').insert({
      config_id: editingConfig.id,
      config_key: editingConfig.config_key,
      old_value: editingConfig.config_value,
      new_value: parsedValue,
      changed_by: user.id,
    });

    const { error } = await supabase
      .from('partner_system_config')
      .update({
        config_value: parsedValue,
        description: editDescription,
        is_active: editActive,
        updated_by: user.id,
      })
      .eq('id', editingConfig.id);

    setSaving(false);
    if (error) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Configuração atualizada com sucesso' });
      setEditDialogOpen(false);
      fetchConfigs();
    }
  };

  const openHistory = async (config: any) => {
    setHistoryLoading(true);
    setHistoryDialogOpen(true);
    const { data } = await supabase
      .from('partner_config_history')
      .select('*')
      .eq('config_id', config.id)
      .order('created_at', { ascending: false })
      .limit(20);
    setHistory(data || []);
    setHistoryLoading(false);
  };

  const categories = [...new Set(configs.map(c => c.category))];

  // Don't render if not authorized
  if (!authLoading && role && !canAccessConfig(role as any)) return null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Settings className="h-6 w-6" /> Configurações do Sistema
          </h1>
          <p className="text-muted-foreground mt-1">
            Parâmetros, faixas, funcionalidades e regras do módulo Partners Help Ude.
            {!isAdmin && (
              <span className="inline-flex items-center gap-1 ml-2 text-amber-600">
                <Lock className="h-3 w-3" /> Somente leitura — edição restrita ao administrador.
              </span>
            )}
          </p>
        </div>

        {/* Contextual help */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-foreground">
              <strong>💡 Como funciona:</strong> Cada configuração controla uma regra do sistema. 
              Alterações são registradas em histórico de auditoria. 
              {isAdmin ? ' Clique no ícone de lápis para editar ou no relógio para ver o histórico.' : ' Entre em contato com o administrador para solicitar alterações.'}
            </p>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
          </div>
        ) : configs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Settings className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="font-medium">Nenhuma configuração cadastrada</p>
              <p className="text-sm mt-1">As configurações do sistema serão exibidas aqui quando forem criadas pelo administrador.</p>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue={categories[0] || 'GENERAL'}>
            <TabsList className="flex-wrap h-auto gap-1">
              {categories.map(cat => (
                <TabsTrigger key={cat} value={cat} className="text-xs">
                  {categoryLabels[cat] || cat}
                </TabsTrigger>
              ))}
            </TabsList>

            {categories.map(cat => {
              const Icon = categoryIcons[cat] || Settings;
              const catConfigs = configs.filter(c => c.category === cat);
              
              return (
                <TabsContent key={cat} value={cat} className="space-y-4">
                  <p className="text-sm text-muted-foreground px-1">
                    {categoryDescriptions[cat] || 'Configurações desta categoria.'}
                  </p>
                  {catConfigs.map(config => (
                    <Card key={config.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Icon className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base">{config.config_key.replace(/_/g, ' ')}</CardTitle>
                            <CardDescription>{config.description || 'Sem descrição'}</CardDescription>
                          </div>
                          <Badge variant={config.is_active ? 'default' : 'secondary'}>
                            {config.is_active ? 'Ativo' : 'Inativo'}
                          </Badge>
                          {isAdmin && (
                            <div className="flex gap-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" onClick={() => openEdit(config)}>
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Editar configuração</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" onClick={() => openHistory(config)}>
                                    <History className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Ver histórico de alterações</TooltipContent>
                              </Tooltip>
                            </div>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto">
                          {JSON.stringify(config.config_value, null, 2)}
                        </pre>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>
              );
            })}
          </Tabs>
        )}
      </div>

      {/* Edit Dialog with JSON validation */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Configuração</DialogTitle>
            <DialogDescription>
              {editingConfig?.config_key.replace(/_/g, ' ')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Descrição</label>
              <Input value={editDescription} onChange={e => setEditDescription(e.target.value)} className="mt-1" />
            </div>

            <JsonEditor
              value={editValue}
              onChange={setEditValue}
              onValidChange={setJsonValid}
              minHeight="200px"
            />

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Ativo</label>
              <Switch checked={editActive} onCheckedChange={setEditActive} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving || !jsonValid}>
              {saving ? 'Salvando...' : !jsonValid ? 'JSON inválido' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Histórico de Alterações</DialogTitle>
            <DialogDescription>Últimas 20 alterações desta configuração — rastreabilidade completa de quem alterou e quando.</DialogDescription>
          </DialogHeader>

          {historyLoading ? (
            <div className="flex justify-center py-4">
              <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-primary" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <History className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Nenhuma alteração registrada para esta configuração.</p>
              <p className="text-xs mt-1">O histórico será preenchido automaticamente a cada edição.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {history.map(h => (
                <Card key={h.id} className="p-3">
                  <p className="text-xs text-muted-foreground">
                    📅 {new Date(h.created_at).toLocaleString('pt-BR')}
                  </p>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Valor anterior</p>
                      <pre className="text-[10px] bg-muted p-1 rounded overflow-x-auto max-h-24">
                        {JSON.stringify(h.old_value, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Novo valor</p>
                      <pre className="text-[10px] bg-muted p-1 rounded overflow-x-auto max-h-24">
                        {JSON.stringify(h.new_value, null, 2)}
                      </pre>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default PartnersConfig;
