import { motion } from 'framer-motion';
import { Eye, FileText, Clock, AlertTriangle, CheckCircle, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Contract } from '@/types/contracts';
import type { ContractMarketingStatus } from '@/hooks/useContracts';

interface ContractCardProps {
  contract: Contract;
  onViewDetails: (contract: Contract) => void;
  isMobile?: boolean;
  marketingStatus?: ContractMarketingStatus;
}

const ContractCard = ({ contract, onViewDetails, isMobile, marketingStatus }: ContractCardProps) => {
  const formatCurrency = (value: number) =>
    `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  const getExpiresIn = () => {
    if (contract.contract_status !== 'AGUARDANDO_ASSINATURA') return null;
    const linkDate = new Date(contract.link_generated_at);
    const expiresAt = new Date(linkDate.getTime() + 72 * 3600000);
    const diff = expiresAt.getTime() - Date.now();
    if (diff <= 0) return 'Expirado';
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  };

  const expiresIn = getExpiresIn();
  const allTriggersActive = marketingStatus?.sms && marketingStatus?.email && marketingStatus?.call;
  const hasAnyTrigger = marketingStatus?.sms || marketingStatus?.email || marketingStatus?.call;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-lg sm:rounded-xl p-3 sm:p-4"
    >
      {/* Header */}
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-sm sm:text-base text-foreground truncate">
            {contract.patient_name}
          </p>
          <p className="text-[10px] sm:text-xs text-muted-foreground">
            CPF: {contract.cpf}
          </p>
        </div>
        <div className="flex gap-0.5 sm:gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 sm:h-8 sm:w-8 hover:bg-primary/10 hover:text-primary"
            onClick={() => onViewDetails(contract)}
          >
            <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 sm:h-8 sm:w-8 hover:bg-primary/10 hover:text-primary"
          >
            <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>
        </div>
      </div>

      {/* Bank */}
      <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">
        {contract.bank_name}
      </p>

      {/* Value */}
      <p className="mb-1 text-base sm:text-lg font-bold text-primary">
        {formatCurrency(contract.amount_released)}
      </p>

      {/* Details row */}
      <div className="flex gap-3 text-[10px] sm:text-xs text-muted-foreground mb-2">
        <span>Parcela: {formatCurrency(contract.installment_value)}</span>
        <span>{contract.term_months}x</span>
      </div>

      {/* Date */}
      <p className="text-[10px] sm:text-xs text-muted-foreground mb-2">
        Link: {new Date(contract.link_generated_at).toLocaleDateString('pt-BR')}
      </p>

      {/* Marketing Trigger Status */}
      <div className="mt-2 pt-2 border-t border-border/50">
        {allTriggersActive ? (
          <div className="flex items-center gap-1.5 text-success">
            <CheckCircle className="h-3.5 w-3.5" />
            <span className="text-[10px] sm:text-xs font-semibold">Gatilhos Ativados</span>
          </div>
        ) : hasAnyTrigger ? (
          <div className="flex items-center gap-1.5 text-warning">
            <Send className="h-3 w-3" />
            <span className="text-[10px] sm:text-xs font-medium">Gatilhos Parciais</span>
            <div className="flex gap-1 ml-auto">
              {marketingStatus?.sms && <Badge variant="outline" className="text-[8px] px-1 py-0 h-4 border-success/50 text-success">SMS</Badge>}
              {marketingStatus?.email && <Badge variant="outline" className="text-[8px] px-1 py-0 h-4 border-success/50 text-success">Email</Badge>}
              {marketingStatus?.call && <Badge variant="outline" className="text-[8px] px-1 py-0 h-4 border-success/50 text-success">IA</Badge>}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Send className="h-3 w-3" />
            <span className="text-[10px] sm:text-xs font-medium">Gatilhos Pendentes</span>
          </div>
        )}
      </div>

      {/* Status-specific extras */}
      {expiresIn && (
        <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border/50">
          <Clock className="h-3 w-3 text-warning" />
          <span className="text-[10px] sm:text-xs font-medium text-warning">
            Expira em {expiresIn}
          </span>
        </div>
      )}

      {contract.contract_status === 'PENDENCIAS_GERAIS' && contract.pending_reason && (
        <div className="mt-2 pt-2 border-t border-border/50">
          <div className="flex items-center gap-1 mb-1">
            <AlertTriangle className="h-3 w-3 text-warning" />
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-warning text-warning">
              Pendência
            </Badge>
          </div>
          <p className="text-[10px] text-muted-foreground line-clamp-2">
            {contract.pending_reason}
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default ContractCard;
