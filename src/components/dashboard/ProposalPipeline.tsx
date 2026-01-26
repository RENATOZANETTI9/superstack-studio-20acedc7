import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  MessageSquare, 
  Mail, 
  Phone,
  Eye,
  FileText,
  Send,
  Info
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import ProposalDetailModal from './ProposalDetailModal';

export interface Proposal {
  id: string;
  cpf: string;
  name: string;
  status: 'aprovada' | 'recusada' | 'erro';
  value?: number;
  date: string;
  marketingActions?: {
    rcs: boolean;
    email: boolean;
    call: boolean;
  };
}

interface PipelineColumnProps {
  title: string;
  status: 'aprovada' | 'recusada' | 'erro';
  proposals: Proposal[];
  icon: React.ReactNode;
  color: string;
  tooltip?: string;
  onAction?: (proposalId: string, action: 'rcs' | 'email' | 'call') => void;
  onViewDetails?: (proposal: Proposal) => void;
  isMobile?: boolean;
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
  isMobile
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
          {filteredProposals.map((proposal) => (
            <motion.div
              key={proposal.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-lg sm:rounded-xl p-3 sm:p-4"
            >
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

              {/* Marketing Actions for Approved */}
              {status === 'aprovada' && (
                <div className="border-t border-border/50 pt-2 sm:pt-3">
                  <p className="mb-1.5 sm:mb-2 text-[10px] sm:text-xs font-semibold uppercase text-muted-foreground">
                    Gatilhos de Marketing
                  </p>
                  <div className="flex gap-1 sm:gap-2">
                    <Button
                      variant={proposal.marketingActions?.rcs ? 'default' : 'outline'}
                      size="sm"
                      className={cn(
                        'h-7 sm:h-8 flex-1 text-[10px] sm:text-xs px-1 sm:px-2',
                        proposal.marketingActions?.rcs && 'bg-success hover:bg-success/90'
                      )}
                      onClick={() => onAction?.(proposal.id, 'rcs')}
                    >
                      <MessageSquare className="mr-0.5 sm:mr-1 h-3 w-3" />
                      RCS
                    </Button>
                    <Button
                      variant={proposal.marketingActions?.email ? 'default' : 'outline'}
                      size="sm"
                      className={cn(
                        'h-7 sm:h-8 flex-1 text-[10px] sm:text-xs px-1 sm:px-2',
                        proposal.marketingActions?.email && 'bg-success hover:bg-success/90'
                      )}
                      onClick={() => onAction?.(proposal.id, 'email')}
                    >
                      <Mail className="mr-0.5 sm:mr-1 h-3 w-3" />
                      Email
                    </Button>
                    <Button
                      variant={proposal.marketingActions?.call ? 'default' : 'outline'}
                      size="sm"
                      className={cn(
                        'h-7 sm:h-8 flex-1 text-[10px] sm:text-xs px-1 sm:px-2',
                        proposal.marketingActions?.call && 'bg-success hover:bg-success/90'
                      )}
                      onClick={() => onAction?.(proposal.id, 'call')}
                    >
                      <Phone className="mr-0.5 sm:mr-1 h-3 w-3" />
                      IA
                    </Button>
                  </div>

                  {/* Status dos gatilhos */}
                  {(proposal.marketingActions?.rcs || proposal.marketingActions?.email || proposal.marketingActions?.call) && (
                    <div className="mt-1.5 sm:mt-2 flex flex-wrap gap-1">
                      {proposal.marketingActions.rcs && (
                        <Badge variant="secondary" className="text-[10px] sm:text-xs px-1.5 py-0">
                          <Send className="mr-0.5 h-2 w-2" />
                          RCS
                        </Badge>
                      )}
                      {proposal.marketingActions.email && (
                        <Badge variant="secondary" className="text-[10px] sm:text-xs px-1.5 py-0">
                          <Send className="mr-0.5 h-2 w-2" />
                          Email
                        </Badge>
                      )}
                      {proposal.marketingActions.call && (
                        <Badge variant="secondary" className="text-[10px] sm:text-xs px-1.5 py-0">
                          <Send className="mr-0.5 h-2 w-2" />
                          Ligação
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ))}

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
  onMarketingAction?: (proposalId: string, action: 'rcs' | 'email' | 'call') => void;
}

const ProposalPipeline = ({ proposals, onMarketingAction }: ProposalPipelineProps) => {
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const isMobile = useIsMobile();

  const handleViewDetails = (proposal: Proposal) => {
    setSelectedProposal(proposal);
    setDetailModalOpen(true);
  };

  return (
    <>
      <div className={cn(
        "flex gap-3 sm:gap-4 overflow-x-auto pb-3 sm:pb-4 -mx-2 px-2",
        isMobile && "scrollbar-hide"
      )}>
        <PipelineColumn
          title="Em Análise"
          status="erro"
          proposals={proposals}
          icon={<AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-white" />}
          color="bg-warning"
          tooltip="A proposta está sendo analisada. O prazo de análise pode ser de até 24 horas."
          onViewDetails={handleViewDetails}
          isMobile={isMobile}
        />
        <PipelineColumn
          title="Aprovados"
          status="aprovada"
          proposals={proposals}
          icon={<CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-white" />}
          color="bg-success"
          tooltip="Pacientes liberados para contratação do crédito. Já receberam RCS, Email Marketing e ligação via IA."
          onAction={onMarketingAction}
          onViewDetails={handleViewDetails}
          isMobile={isMobile}
        />
        <PipelineColumn
          title="Declinados"
          status="recusada"
          proposals={proposals}
          icon={<XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-white" />}
          color="bg-destructive"
          tooltip="Proposta declinada. Fique tranquilo, a cada 30 dias realizamos novas consultas."
          onViewDetails={handleViewDetails}
          isMobile={isMobile}
        />
      </div>

      <ProposalDetailModal
        proposal={selectedProposal}
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
      />
    </>
  );
};

export default ProposalPipeline;
