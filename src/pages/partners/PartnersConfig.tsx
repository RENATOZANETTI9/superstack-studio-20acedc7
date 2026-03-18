import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Settings, DollarSign, Target, Zap, Gift, Flag, Pencil, History } from 'lucide-react';

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
  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<any>(null);
  const [editValue, setEditValue] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editActive, setEditActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const { role, user } = useAuth();
  const { toast } = useToast();

  const isAdmin = role === 'master' || role === 'admin';

  useEffect(() => {
    fetchConfigs();
  }, []);

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
    setEditDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingConfig || !user) return;

    let parsedValue: any;
    try {
      parsedValue = JSON.parse(editValue);
    } catch {
      toast({ title: 'JSON inválido', description: 'Verifique a formatação do valor.', variant: 'destructive' });
      return;
    }

    setSaving(true);

    // Save history
    await supabase.from('partner_config_history').insert({
      config_id: editingConfig.id,
      config_key: editingConfig.config_key,
      old_value: editingConfig.config_value,
      new_value: parsedValue,
      changed_by: user.id,
    });

    // Update config
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
      toast({ title: 'Configuração atualizada' });
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Configurações do Sistema</h1>
          <p className="text-muted-foreground">
            Parâmetros, faixas, funcionalidades e regras do módulo Partners
            {!isAdmin && ' (somente leitura)'}
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
          </div>
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
                  {catConfigs.map(config => (
                    <Card key={config.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Icon className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base">{config.config_key.replace(/_/g, ' ')}</CardTitle>
                            <CardDescription>{config.description}</CardDescription>
                          </div>
                          <Badge variant={config.is_active ? 'default' : 'secondary'}>
                            {config.is_active ? 'Ativo' : 'Inativo'}
                          </Badge>
                          {isAdmin && (
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" onClick={() => openEdit(config)} title="Editar">
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => openHistory(config)} title="Histórico">
                                <History className="h-4 w-4" />
                              </Button>
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

      {/* Edit Dialog */}
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
              <Input
                value={editDescription}
                onChange={e => setEditDescription(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Valor (JSON)</label>
              <Textarea
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                className="mt-1 font-mono text-xs min-h-[200px]"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Ativo</label>
              <Switch checked={editActive} onCheckedChange={setEditActive} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Histórico de Alterações</DialogTitle>
            <DialogDescription>Últimas 20 alterações desta configuração</DialogDescription>
          </DialogHeader>

          {historyLoading ? (
            <div className="flex justify-center py-4">
              <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-primary" />
            </div>
          ) : history.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma alteração registrada.</p>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {history.map(h => (
                <Card key={h.id} className="p-3">
                  <p className="text-xs text-muted-foreground">
                    {new Date(h.created_at).toLocaleString('pt-BR')}
                  </p>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Anterior</p>
                      <pre className="text-[10px] bg-muted p-1 rounded overflow-x-auto max-h-24">
                        {JSON.stringify(h.old_value, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Novo</p>
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
