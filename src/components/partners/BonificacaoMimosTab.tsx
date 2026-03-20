import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Gift, CheckCircle2 } from 'lucide-react';
import { COMMISSION_STATUS_LABELS, COMMISSION_STATUS_COLORS } from '@/lib/partner-rules';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  items: any[];
  loading: boolean;
  hasActiveFilters: boolean;
  canMarkDelivered: boolean;
  getClinicDisplay: (clinicId: string | null) => string;
  onRefresh: () => void;
}

const BonificacaoMimosTab = ({ items, loading, hasActiveFilters, canMarkDelivered, getClinicDisplay, onRefresh }: Props) => {
  const handleMarkDelivered = async (id: string) => {
    const { error } = await supabase
      .from('attendant_incentives')
      .update({ status: 'PAID', paid_at: new Date().toISOString() })
      .eq('id', id);
    if (error) {
      toast.error('Erro ao dar baixa: ' + error.message);
    } else {
      toast.success('Mimo marcado como entregue');
      onRefresh();
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle className="text-base">Mimos Semanais por Simulação</CardTitle>
            <CardDescription>Pago pelo partner · Avaliação semanal</CardDescription>
          </div>
          <Badge variant="outline" className="text-xs w-fit">🕐 Semanal · {items.length} registros</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8"><div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" /></div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Gift className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>Nenhum mimo registrado {hasActiveFilters ? 'com os filtros aplicados' : ''}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  {['Mês Ref.', 'Semana', 'Clínica', 'Simulações', 'Produção', 'Faixa Mimo', 'Status', ...(canMarkDelivered ? ['Ação'] : [])].map(h => (
                    <th key={h} className="pb-3 whitespace-nowrap pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map(i => (
                  <tr key={i.id} className="border-b hover:bg-accent/30">
                    <td className="py-3">{i.reference_month}</td>
                    <td className="py-3">Semana {i.reference_week}</td>
                    <td className="py-3 text-xs">{getClinicDisplay(i.clinic_external_id)}</td>
                    <td className="py-3 font-medium">{i.cpfs_generated}</td>
                    <td className="py-3">{i.consultations_generated} consultas</td>
                    <td className="py-3"><Badge variant="secondary" className="font-medium">{i.pix_tier || '—'}</Badge></td>
                    <td className="py-3"><Badge className={COMMISSION_STATUS_COLORS[i.status] || ''}>{COMMISSION_STATUS_LABELS[i.status] || i.status}</Badge></td>
                    {canMarkDelivered && (
                      <td className="py-3">
                        {i.status !== 'PAID' ? (
                          <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => handleMarkDelivered(i.id)}>
                            <CheckCircle2 className="h-3.5 w-3.5" /> Entregue
                          </Button>
                        ) : (
                          <span className="text-xs text-green-600 font-medium">✓ Entregue</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BonificacaoMimosTab;
