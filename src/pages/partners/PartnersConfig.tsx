import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { Settings, DollarSign, Target, Zap, Gift, Flag } from 'lucide-react';

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

  const categories = [...new Set(configs.map(c => c.category))];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Configurações do Sistema</h1>
          <p className="text-muted-foreground">Parâmetros, faixas, feature flags e regras do módulo Partners</p>
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
                  {cat.replace(/_/g, ' ')}
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
                          <div>
                            <CardTitle className="text-base">{config.config_key}</CardTitle>
                            <CardDescription>{config.description}</CardDescription>
                          </div>
                          <Badge variant={config.is_active ? 'default' : 'secondary'} className="ml-auto">
                            {config.is_active ? 'Ativo' : 'Inativo'}
                          </Badge>
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
    </DashboardLayout>
  );
};

export default PartnersConfig;
