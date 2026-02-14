import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock, AlertTriangle, CheckCircle, TimerOff, XCircle, Info, ChevronRight,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import type { Contract, ContractStatus } from '@/types/contracts';
import ContractCard from './ContractCard';
import ContractDetailModal from './ContractDetailModal';

interface ColumnConfig {
  title: string;
  status: ContractStatus;
  icon: React.ReactNode;
  color: string;
  tooltip: string;
}

const columns: ColumnConfig[] = [
  { title: 'Aguardando Assinatura', status: 'AGUARDANDO_ASSINATURA', icon: <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-white" />, color: 'bg-primary', tooltip: 'Créditos aguardando a assinatura do paciente. O link expira em 72h.' },
  { title: 'Pendências Gerais', status: 'PENDENCIAS_GERAIS', icon: <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-white" />, color: 'bg-warning', tooltip: 'Créditos com pendências após início do processo de assinatura.' },
  { title: 'Crédito Pago', status: 'PAGO', icon: <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-white" />, color: 'bg-success', tooltip: 'Créditos finalizados e pagos com sucesso.' },
  { title: 'Crédito Expirado', status: 'EXPIRADO', icon: <TimerOff className="h-4 w-4 sm:h-5 sm:w-5 text-white" />, color: 'bg-muted-foreground', tooltip: 'Créditos expirados (72h sem assinatura). Podem ser regenerados.' },
  { title: 'Crédito Cancelado', status: 'CANCELADO', icon: <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-white" />, color: 'bg-destructive', tooltip: 'Créditos cancelados pelo banco ou fundo.' },
];

interface ContractPipelineProps {
  contracts: Contract[];
  onRegenerate: (contractId: string) => Promise<boolean>;
  onRefresh: () => Promise<void>;
}

const ContractPipeline = ({ contracts, onRegenerate, onRefresh }: ContractPipelineProps) => {
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [showScrollHint, setShowScrollHint] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const handleViewDetails = (contract: Contract) => {
    setSelectedContract(contract);
    setDetailModalOpen(true);
  };

  const handleRegenerate = async (contractId: string) => {
    const success = await onRegenerate(contractId);
    if (success) setDetailModalOpen(false);
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !isMobile) return;
    const handleScroll = () => { if (container.scrollLeft > 20) setShowScrollHint(false); };
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [isMobile]);

  useEffect(() => {
    if (!isMobile) return;
    const timer = setTimeout(() => setShowScrollHint(false), 5000);
    return () => clearTimeout(timer);
  }, [isMobile]);

  return (
    <>
      <div className="relative">
        <div ref={scrollContainerRef} className={cn('flex gap-3 sm:gap-4 overflow-x-auto pb-3 sm:pb-4 -mx-2 px-2', isMobile && 'scrollbar-hide')}>
          {columns.map((col) => {
            const filtered = contracts.filter((c) => c.contract_status === col.status);
            return (
              <div key={col.status} className={cn('flex h-full flex-col rounded-xl bg-muted/30 p-3 sm:p-4', isMobile ? 'w-72 shrink-0' : 'w-64 shrink-0')}>
                <div className="mb-3 sm:mb-4 flex items-center gap-2">
                  <div className={cn('rounded-lg p-1.5 sm:p-2', col.color)}>{col.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <h3 className="font-semibold text-xs sm:text-sm text-foreground truncate">{col.title}</h3>
                      {!isMobile && (
                        <TooltipProvider><Tooltip><TooltipTrigger asChild><Info className="h-3.5 w-3.5 text-muted-foreground cursor-help shrink-0" /></TooltipTrigger><TooltipContent side="top" className="max-w-xs"><p className="text-xs">{col.tooltip}</p></TooltipContent></Tooltip></TooltipProvider>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{filtered.length} crédito{filtered.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <ScrollArea className="flex-1">
                  <div className="space-y-2 sm:space-y-3 pr-2">
                    {filtered.map((contract) => (
                      <ContractCard key={contract.id} contract={contract} onViewDetails={handleViewDetails} isMobile={isMobile} />
                    ))}
                    {filtered.length === 0 && (
                      <div className="flex h-24 sm:h-32 items-center justify-center text-center">
                        <p className="text-xs sm:text-sm text-muted-foreground">Nenhum crédito</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            );
          })}
        </div>
        <AnimatePresence>
          {isMobile && showScrollHint && (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none">
              <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-background to-transparent" />
              <motion.div animate={{ x: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }} className="relative flex items-center bg-primary/90 text-primary-foreground p-2 rounded-l-lg shadow-lg">
                <ChevronRight className="h-4 w-4" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ContractDetailModal
        contract={selectedContract}
        open={detailModalOpen}
        onOpenChange={(open) => {
          setDetailModalOpen(open);
          if (!open) onRefresh();
        }}
        onRegenerate={handleRegenerate}
      />
    </>
  );
};

export default ContractPipeline;
