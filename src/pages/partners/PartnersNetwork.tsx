import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { GitBranch, Users, ArrowRight } from 'lucide-react';

const PartnersNetwork = () => {
  const [network, setNetwork] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [networkRes, partnersRes] = await Promise.all([
      supabase.from('partner_network').select('*').eq('is_active', true),
      supabase.from('partners').select('id, legal_name, type, current_level'),
    ]);
    
    setNetwork(networkRes.data || []);
    setPartners(partnersRes.data || []);
    setLoading(false);
  };

  const getPartnerName = (id: string) => {
    const p = partners.find(p => p.id === id);
    return p?.legal_name || 'Desconhecido';
  };

  const getPartnerType = (id: string) => {
    const p = partners.find(p => p.id === id);
    return p?.type || '';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Rede de Partners</h1>
          <p className="text-muted-foreground">Relacionamentos Master → Partner</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <GitBranch className="h-5 w-5" /> Árvore de Rede
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
              </div>
            ) : network.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <GitBranch className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">Nenhuma relação de rede</p>
                <p className="text-sm">As relações Master → Partner aparecerão aqui.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {network.map(rel => (
                  <div key={rel.id} className="flex items-center gap-4 p-4 rounded-lg border">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      <div>
                        <p className="font-medium">{getPartnerName(rel.parent_partner_id)}</p>
                        <Badge variant="outline" className="text-xs">{getPartnerType(rel.parent_partner_id)}</Badge>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{getPartnerName(rel.child_partner_id)}</p>
                        <Badge variant="outline" className="text-xs">{getPartnerType(rel.child_partner_id)}</Badge>
                      </div>
                    </div>
                    <Badge className="ml-auto">{rel.relationship_type}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default PartnersNetwork;
