import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DollarSign, CheckCircle2 } from 'lucide-react';
import { COMMISSION_STATUS_LABELS, COMMISSION_STATUS_COLORS, formatCurrency } from '@/lib/partner-rules';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  items: any[];
  hasActiveFilters: boolean;
  isAdmin: boolean;
  getClinicDisplay: (clinicId: string | null) => string;
  onRefresh: () => void;
}

const BonificacaoPixTab = ({ items, hasActiveFilters, isAdmin, getClinicDisplay, onRefresh }: Props) => {
  const handleMarkPaid = async (id: string) => {
    const { error } = await supabase
      .from('attendant_incentives')
      .update({ status: 'PAID', paid_at: new Date().toISOString() })
      .eq('id', id);
    if (error) {
      toast.error('Erro ao dar baixa: ' + error.message);
    } else {
      toast.success('PIX marcado como pago');
      onRefresh();
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle className="text-base">PIX por Contrato Pago</CardTitle>
            <CardDescription>Pago pela Help Ude · Avaliação mensal</CardDescription>
          </div>
          <Badge variant="outline" className="text-xs w-fit">📅 Mensal · {items.length} registros</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>Nenhum incentivo PIX registrado {hasActiveFilters ? 'com os filtros aplicados' : ''}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  {['Mês Ref.', 'Clínica', 'Produção Paga', 'Faixa', 'Valor PIX', 'Status', ...(isAdmin ? ['Ação'] : [])].map(h => (
                    <th key={h} className="pb-3 whitespace-nowrap pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map(i => (
                  <tr key={i.id} className="border-b hover:bg-accent/30">
                    <td className="py-3">{i.reference_month}</td>
                    <td className="py-3 text-xs">{getClinicDisplay(i.clinic_external_id)}</td>
                    <td className="py-3">R$ {formatCurrency(Number(i.paid_amount_generated || 0))}</td>
                    <td className="py-3"><Badge variant="secondary">{i.pix_tier || '—'}</Badge></td>
                    <td className="py-3 font-bold text-green-600">R$ {formatCurrency(Number(i.incentive_amount || 0))}</td>
                    <td className="py-3"><Badge className={COMMISSION_STATUS_COLORS[i.status] || ''}>{COMMISSION_STATUS_LABELS[i.status] || i.status}</Badge></td>
                    {isAdmin && (
                      <td className="py-3">
                        {i.status !== 'PAID' ? (
                          <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => handleMarkPaid(i.id)}>
                            <CheckCircle2 className="h-3.5 w-3.5" /> Pagar
                          </Button>
                        ) : (
                          <span className="text-xs text-green-600 font-medium">✓ Pago</span>
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

export default BonificacaoPixTab;
