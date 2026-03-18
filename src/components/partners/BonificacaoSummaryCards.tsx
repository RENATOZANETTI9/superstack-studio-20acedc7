import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DollarSign, Gift, Info } from 'lucide-react';
import { formatCurrency } from '@/lib/partner-rules';

interface Props {
  totalDirect: number;
  totalOverride: number;
  totalPix: number;
  totalMimos: number;
}

const BonificacaoSummaryCards = ({ totalDirect, totalOverride, totalPix, totalMimos }: Props) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-500/10"><DollarSign className="h-5 w-5 text-green-500" /></div>
          <div>
            <div className="flex items-center gap-1">
              <p className="text-sm text-muted-foreground">Bonificação Direta</p>
              <Tooltip>
                <TooltipTrigger><Info className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                <TooltipContent><p className="max-w-[200px] text-xs">1,6% sobre valor líquido pago dos contratos das clínicas vinculadas ao partner</p></TooltipContent>
              </Tooltip>
            </div>
            <p className="text-xl font-bold">R$ {formatCurrency(totalDirect)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10"><DollarSign className="h-5 w-5 text-blue-500" /></div>
          <div>
            <div className="flex items-center gap-1">
              <p className="text-sm text-muted-foreground">Bonificação de Rede</p>
              <Tooltip>
                <TooltipTrigger><Info className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                <TooltipContent><p className="max-w-[200px] text-xs">0,2% override sobre contratos pagos dos partners indicados na rede</p></TooltipContent>
              </Tooltip>
            </div>
            <p className="text-xl font-bold">R$ {formatCurrency(totalOverride)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/10"><Gift className="h-5 w-5 text-purple-500" /></div>
          <div>
            <p className="text-sm text-muted-foreground">Mimos Semanais</p>
            <p className="text-xl font-bold">{totalMimos}</p>
            <p className="text-xs text-muted-foreground">registros</p>
          </div>
        </div>
      </CardContent>
    </Card>
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10"><DollarSign className="h-5 w-5 text-emerald-500" /></div>
          <div>
            <p className="text-sm text-muted-foreground">PIX Atendentes</p>
            <p className="text-xl font-bold">R$ {formatCurrency(totalPix)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

export default BonificacaoSummaryCards;
