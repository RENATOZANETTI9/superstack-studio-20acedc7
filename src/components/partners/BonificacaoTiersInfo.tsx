import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Gift } from 'lucide-react';
import { PARTNER_RULES } from '@/lib/partner-rules';

const BonificacaoTiersInfo = () => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Gift className="h-4 w-4 text-primary" /> Mimos por Volume de Simulações
        </CardTitle>
        <CardDescription className="text-xs">
          📅 <strong>Regra semanal</strong> · 💰 <strong>Pago pelo Partner</strong>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {PARTNER_RULES.MIMO_TIERS.map((tier, i) => (
            <div key={i} className="flex justify-between items-center p-2.5 rounded bg-muted/50 text-sm">
              <span>{tier.label}</span>
              <Badge variant="outline" className="font-medium">{tier.mimo}</Badge>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3 p-2 bg-amber-50 rounded border border-amber-200">
          ⚠️ Mimos não são valores em dinheiro. São premiações (brindes, vouchers, etc.) definidas pelo partner responsável.
        </p>
      </CardContent>
    </Card>
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-green-500" /> PIX por Contrato Pago
        </CardTitle>
        <CardDescription className="text-xs">
          📅 <strong>Regra mensal</strong> · 💰 <strong>Pago pela Help Ude</strong>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {PARTNER_RULES.PIX_TIERS.map((tier, i) => (
            <div key={i} className="flex justify-between items-center p-2.5 rounded bg-muted/50 text-sm">
              <span>{tier.label}</span>
              <Badge variant="outline" className="font-medium">{tier.pix}</Badge>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3 p-2 bg-green-50 rounded border border-green-200">
          💡 Valor fixo em PIX baseado na faixa de produção mensal de contratos pagos. Pago pela Help Ude.
        </p>
      </CardContent>
    </Card>
  </div>
);

export default BonificacaoTiersInfo;
