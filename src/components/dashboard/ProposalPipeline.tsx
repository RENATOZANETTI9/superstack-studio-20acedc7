import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Send,
  Eye,
  FileText,
  Info,
  ChevronRight,
  PenTool,
  Loader2,
  KeyRound
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import ProposalDetailModal from './ProposalDetailModal';
import { toast } from 'sonner';
import { applyMask, isValidPixKey, pixPlaceholder } from '@/lib/pix-validation';
import { usePixStates, type PixStateExtended } from '@/hooks/usePixStates';

export interface Proposal {
  id: string;
  cpf: string;
  name: string;
  status: 'aprovada' | 'recusada' | 'erro';
  value?: number;
  date: string;
  marketingActions?: {
    sms: boolean;
    email: boolean;
    call: boolean;
  };
}

export type PixKeyType = 'cpf' | 'telefone' | 'email';
export type PixPhase = 'idle' | 'generating' | 'ready' | 'analyzing';
export interface PixState {
  type?: PixKeyType;
  phase: PixPhase;
}

interface PipelineColumnProps {
  title: string;
  status: 'aprovada' | 'recusada' | 'erro';
  proposals: Proposal[];
  icon: React.ReactNode;
  color: string;
  tooltip?: string;
  onAction?: (proposalId: string, action: 'sms' | 'email' | 'call') => void;
  onViewDetails?: (proposal: Proposal) => void;
  isMobile?: boolean;
  activatedProposals?: Set<string>;
  pixStateMap?: Record<string, PixStateExtended>;
  onPixSubmit?: (proposal: Proposal, type: PixKeyType, value: string) => void;
  loadingMap?: Record<string, boolean>;
}

const PipelineColumn = ({ 
  title, 
  status, 
  proposals, 
  icon, 
  color,
  tooltip,
  onAction,
  onViewDetails,
  isMobile,
  activatedProposals = new Set(),
  pixStateMap = {},
  onPixSubmit,
  loadingMap = {},
}: PipelineColumnProps) => {
  const filteredProposals = proposals.filter(p => p.status === status);

  return (
    <div className={cn(
      "flex h-full flex-col rounded-xl bg-muted/30 p-3 sm:p-4",
      isMobile ? "w-72 shrink-0" : "w-80 shrink-0"
    )}>
      {/* Header */}
      <div className="mb-3 sm:mb-4 flex items-center gap-2">
        <div className={cn('rounded-lg p-1.5 sm:p-2', color)}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <h3 className="font-semibold text-sm sm:text-base text-foreground truncate">{title}</h3>
            {tooltip && !isMobile && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help shrink-0" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p className="text-xs">{tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {filteredProposals.length} proposta{filteredProposals.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Proposals */}
      <ScrollArea className="flex-1">
        <div className="space-y-2 sm:space-y-3 pr-2">
          {filteredProposals.map((proposal) => {
            const allTriggersActive = proposal.marketingActions?.sms && proposal.marketingActions?.email && proposal.marketingActions?.call;
            const manuallyActivated = activatedProposals.has(proposal.id);
            const triggersDone = allTriggersActive || manuallyActivated;
            const pixState: PixStateExtended = pixStateMap[proposal.id] || { phase: 'idle' as PixPhase };
            const isBusy = !!loadingMap[proposal.id];
            const pixReady = status === 'aprovada' && pixState.phase === 'ready';
            const shouldPulse = status === 'aprovada' && !pixReady;
            const showActivatedState = status === 'aprovada' && pixReady;
            const actionLabel = status === 'aprovada'
              ? (pixReady
                  ? 'Cliente pronto para assinatura/biometria'
                  : pixState.phase === 'generating'
                    ? 'Gerando link de biometria…'
                    : 'Informar chave Pix para gerar link de contratação')
              : null;

            return (
            <motion.div
              key={proposal.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={cn(
                "relative rounded-lg sm:rounded-xl p-3 sm:p-4 overflow-hidden transition-colors duration-500",
                shouldPulse 
                  ? "bg-warning/[0.08] border border-warning/30 shadow-[0_0_16px_-4px_hsl(var(--warning)/0.2)]" 
                  : showActivatedState
                    ? "bg-success/[0.06] border border-success/30"
                    : "glass-card"
              )}
            >
              {/* Animated accent bar for pending */}
              {shouldPulse && (
                <motion.div
                  className="absolute left-0 top-0 bottom-0 w-[3px] rounded-full bg-warning"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                />
              )}

              {/* Green accent bar for activated */}
              {showActivatedState && (
                <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-full bg-success" />
              )}

              {/* "Ação necessária" micro-badge */}
              {status === 'aprovada' && (
                <div className="mb-2 flex items-center gap-1.5">
                  <motion.div
                    className={cn(
                      'h-1.5 w-1.5 rounded-full',
                      pixReady ? 'bg-success' : 'bg-warning'
                    )}
                    animate={pixReady ? {} : { scale: [1, 1.4, 1], opacity: [0.7, 1, 0.7] }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                  />
                  <span className={cn(
                    'text-[10px] font-semibold uppercase tracking-wider',
                    pixReady ? 'text-success' : 'text-warning'
                  )}>
                    {pixReady ? 'Pronto p/ assinatura' : 'Ação necessária'}
                  </span>
                </div>
              )}
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm sm:text-base text-foreground truncate">{proposal.name}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Paciente: {proposal.cpf}</p>
                </div>
                <div className="flex gap-0.5 sm:gap-1 shrink-0">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 sm:h-8 sm:w-8 hover:bg-primary/10 hover:text-primary"
                    onClick={() => onViewDetails?.(proposal)}
                  >
                    <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 hover:bg-primary/10 hover:text-primary">
                    <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </Button>
                </div>
              </div>

              {proposal.value && (
                <p className="mb-2 text-base sm:text-lg font-bold text-primary">
                  R$ {proposal.value.toLocaleString('pt-BR')}
                </p>
              )}

              <p className="mb-2 sm:mb-3 text-[10px] sm:text-xs text-muted-foreground">{proposal.date}</p>

              {actionLabel && (
                <div className={cn(
                  'mb-2 sm:mb-3 rounded-md px-2 py-1.5 text-[10px] sm:text-xs font-medium',
                  pixReady
                    ? 'bg-success/10 text-success border border-success/30'
                    : 'bg-warning/10 text-warning border border-warning/30'
                )}>
                  {actionLabel}
                </div>
              )}

              {/* Marketing Actions for Approved */}
              {status === 'aprovada' && (
                <div className="border-t border-border/50 pt-2 sm:pt-3 space-y-2">
                  {triggersDone ? (
                    <div className="flex items-center gap-1.5 text-success">
                      <CheckCircle className="h-3.5 w-3.5" />
                      <span className="text-[10px] sm:text-xs font-semibold">Gatilhos de marketing ativados</span>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full h-8 sm:h-9 text-xs sm:text-sm gap-1.5 border-warning/50 text-warning hover:bg-warning hover:text-warning-foreground transition-colors"
                      onClick={() => onViewDetails?.(proposal)}
                    >
                      <Send className="h-3.5 w-3.5" />
                      Ativar Gatilho de Marketing
                    </Button>
                  )}

                  {/* Finalizar contratação / Gerar link de biometria */}
                  <div className="rounded-md border border-border/60 bg-background/40 p-2 sm:p-2.5">
                    <div className="mb-1.5 flex items-center gap-1.5">
                      <KeyRound className="h-3 w-3 text-primary" />
                      <span className="text-[10px] sm:text-xs font-semibold text-foreground">
                        Finalizar contratação / Gerar link de biometria
                      </span>
                    </div>

                    {pixState.phase === 'idle' && (
                      <PixKeyForm
                        compact
                        disabled={isBusy}
                        onSubmit={(type, value) => onPixSubmit?.(proposal, type, value)}
                      />
                    )}

                    {pixState.phase === 'generating' && (
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground py-1.5">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                        Gerando link de biometria, aguarde…
                      </div>
                    )}

                    {pixState.phase === 'analyzing' && (
                      <div className="flex items-center gap-2 text-[11px] text-warning py-1.5">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Aguardando análise — retornará automaticamente quando pronto.
                      </div>
                    )}

                    {pixState.phase === 'ready' && (
                      <motion.div
                        animate={{ boxShadow: ['0 0 0px hsl(var(--success)/0)', '0 0 18px hsl(var(--success)/0.55)', '0 0 0px hsl(var(--success)/0)'] }}
                        transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
                        className="rounded-md"
                      >
                        <Button
                          size="sm"
                          disabled={isBusy}
                          className="w-full h-10 text-xs sm:text-sm font-bold gap-2 bg-success hover:bg-success/90 text-white"
                          onClick={() => {
                            if (pixState.link) window.open(pixState.link, '_blank');
                            toast.success('Abrindo link de biometria…');
                          }}
                        >
                          <PenTool className="h-4 w-4" />
                          Link de biometria / Assinar contrato
                        </Button>
                      </motion.div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
            );
          })}

          {filteredProposals.length === 0 && (
            <div className="flex h-24 sm:h-32 items-center justify-center text-center">
              <p className="text-xs sm:text-sm text-muted-foreground">
                Nenhuma proposta
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export interface ProposalPipelineProps {
  proposals: Proposal[];
  onMarketingAction?: (proposalId: string, action: 'sms' | 'email' | 'call') => void;
}

const ProposalPipeline = ({ proposals, onMarketingAction }: ProposalPipelineProps) => {
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [activatedProposals, setActivatedProposals] = useState<Set<string>>(new Set());
  const { pixStateMap, loadingMap, submitPixKey } = usePixStates(proposals);
  const statusOverrides: Record<string, 'erro' | 'aprovada'> = {};
  // Reflect analyzing as "Em Análise" column
  Object.entries(pixStateMap).forEach(([pid, st]) => {
    if (st.phase === 'analyzing') statusOverrides[pid] = 'erro';
  });
  const [showScrollHint, setShowScrollHint] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const handleViewDetails = (proposal: Proposal) => {
    setSelectedProposal(proposal);
    setDetailModalOpen(true);
  };

  const handleMarketingActivated = (proposalId: string) => {
    setActivatedProposals(prev => new Set(prev).add(proposalId));
  };

  const handlePixSubmit = (proposal: Proposal, type: PixKeyType, value: string) => {
    submitPixKey(proposal, type, value);
  };

  // Apply status overrides to proposals
  const effectiveProposals = proposals.map(p =>
    statusOverrides[p.id] ? { ...p, status: statusOverrides[p.id] } : p
  );

  // Hide scroll hint after user scrolls
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !isMobile) return;

    const handleScroll = () => {
      if (container.scrollLeft > 20) {
        setShowScrollHint(false);
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [isMobile]);

  // Auto-hide hint after 5 seconds
  useEffect(() => {
    if (!isMobile) return;
    const timer = setTimeout(() => setShowScrollHint(false), 5000);
    return () => clearTimeout(timer);
  }, [isMobile]);

  return (
    <>
      <div className="relative">
        {/* Scroll container */}
        <div 
          ref={scrollContainerRef}
          className={cn(
            "flex gap-3 sm:gap-4 overflow-x-auto pb-3 sm:pb-4 -mx-2 px-2",
            isMobile && "scrollbar-hide"
          )}
        >
          <PipelineColumn
            title="Em Análise"
            status="erro"
            proposals={effectiveProposals}
            icon={<AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-white" />}
            color="bg-warning"
            tooltip="A proposta está sendo analisada. O prazo de análise pode ser de até 24 horas."
            onViewDetails={handleViewDetails}
            isMobile={isMobile}
          />
          <PipelineColumn
            title="Aprovados"
            status="aprovada"
            proposals={effectiveProposals}
            icon={<CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-white" />}
            color="bg-success"
            tooltip="Pacientes liberados para contratação do crédito. Já receberam SMS, Email Marketing e ligação via IA."
            onAction={onMarketingAction}
            onViewDetails={handleViewDetails}
            isMobile={isMobile}
            activatedProposals={activatedProposals}
            pixStateMap={pixStateMap}
            onPixSubmit={handlePixSubmit}
            loadingMap={loadingMap}
          />
          <PipelineColumn
            title="Declinados"
            status="recusada"
            proposals={effectiveProposals}
            icon={<XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-white" />}
            color="bg-destructive"
            tooltip="Proposta declinada. Fique tranquilo, a cada 30 dias realizamos novas consultas."
            onViewDetails={handleViewDetails}
            isMobile={isMobile}
          />
        </div>

        {/* Scroll hint indicator for mobile */}
        <AnimatePresence>
          {isMobile && showScrollHint && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none"
            >
              {/* Gradient fade */}
              <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-background to-transparent" />
              
              {/* Animated arrow indicator */}
              <motion.div
                animate={{ x: [0, 8, 0] }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 1.5,
                  ease: "easeInOut"
                }}
                className="relative flex items-center bg-primary/90 text-primary-foreground p-2 rounded-l-lg shadow-lg"
              >
                <ChevronRight className="h-4 w-4" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ProposalDetailModal
        proposal={selectedProposal}
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        onMarketingActivated={handleMarketingActivated}
        pixState={selectedProposal ? pixStateMap[selectedProposal.id] : undefined}
        onPixSubmit={handlePixSubmit}
        isBusy={selectedProposal ? !!loadingMap[selectedProposal.id] : false}
      />
    </>
  );
};

export default ProposalPipeline;

// Inline component for collecting + validating pix key
interface PixKeyFormProps {
  compact?: boolean;
  disabled?: boolean;
  onSubmit: (type: PixKeyType, value: string) => void;
}

export const PixKeyForm = ({ compact, disabled, onSubmit }: PixKeyFormProps) => {
  const [type, setType] = useState<PixKeyType | ''>('');
  const [value, setValue] = useState('');
  const valid = type ? isValidPixKey(type, value) : false;

  return (
    <div className={cn('space-y-2', compact ? '' : 'space-y-3')}>
      <p className={cn('text-muted-foreground leading-snug', compact ? 'text-[10px]' : 'text-xs')}>
        Para gerar o link de contratação, selecione e informe a chave Pix do cliente.
      </p>
      <Select
        value={type}
        onValueChange={(v) => {
          setType(v as PixKeyType);
          setValue('');
        }}
        disabled={disabled}
      >
        <SelectTrigger className={cn('bg-background/60', compact ? 'h-8 text-xs' : '')}>
          <SelectValue placeholder="Selecione a chave Pix" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="cpf">CPF (gera link imediato)</SelectItem>
          <SelectItem value="telefone">Telefone</SelectItem>
          <SelectItem value="email">E-mail</SelectItem>
        </SelectContent>
      </Select>
      {type && (
        <>
          <Input
            value={value}
            disabled={disabled}
            inputMode={type === 'email' ? 'email' : 'numeric'}
            placeholder={pixPlaceholder(type)}
            onChange={(e) => setValue(applyMask(type, e.target.value))}
            className={cn('bg-background/60', compact ? 'h-8 text-xs' : '')}
          />
          {value && !valid && (
            <p className={cn('text-destructive', compact ? 'text-[10px]' : 'text-xs')}>
              {type === 'cpf' ? 'CPF inválido.' : type === 'telefone' ? 'Telefone inválido.' : 'E-mail inválido.'}
            </p>
          )}
          <Button
            size={compact ? 'sm' : 'default'}
            disabled={!valid || disabled}
            className={cn('w-full gap-1.5 bg-primary hover:bg-primary/90', compact ? 'h-8 text-xs' : '')}
            onClick={() => type && onSubmit(type, value)}
          >
            {disabled ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <KeyRound className="h-3.5 w-3.5" />}
            Gerar link de biometria
          </Button>
        </>
      )}
    </div>
  );
};
