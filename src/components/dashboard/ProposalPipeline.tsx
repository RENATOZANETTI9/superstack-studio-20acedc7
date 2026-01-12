import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  MessageSquare, 
  Mail, 
  Phone,
  MoreVertical,
  Send
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

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
  onAction?: (proposalId: string, action: 'rcs' | 'email' | 'call') => void;
}

const PipelineColumn = ({ 
  title, 
  status, 
  proposals, 
  icon, 
  color,
  onAction 
}: PipelineColumnProps) => {
  const filteredProposals = proposals.filter(p => p.status === status);

  return (
    <div className="flex h-full w-80 shrink-0 flex-col rounded-xl bg-muted/30 p-4">
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <div className={cn('rounded-lg p-2', color)}>
          {icon}
        </div>
        <div>
          <h3 className="font-semibold text-foreground">{title}</h3>
          <p className="text-xs text-muted-foreground">
            {filteredProposals.length} proposta{filteredProposals.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Proposals */}
      <ScrollArea className="flex-1">
        <div className="space-y-3 pr-2">
          {filteredProposals.map((proposal) => (
            <motion.div
              key={proposal.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-xl p-4"
            >
              <div className="mb-2 flex items-start justify-between">
                <div>
                  <p className="font-medium text-foreground">{proposal.name}</p>
                  <p className="text-xs text-muted-foreground">CPF: {proposal.cpf}</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Ver detalhes</DropdownMenuItem>
                    <DropdownMenuItem>Exportar</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {proposal.value && (
                <p className="mb-2 text-lg font-bold text-primary">
                  R$ {proposal.value.toLocaleString('pt-BR')}
                </p>
              )}

              <p className="mb-3 text-xs text-muted-foreground">{proposal.date}</p>

              {/* Marketing Actions for Approved */}
              {status === 'aprovada' && (
                <div className="border-t border-border/50 pt-3">
                  <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                    Gatilhos de Marketing
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant={proposal.marketingActions?.rcs ? 'default' : 'outline'}
                      size="sm"
                      className={cn(
                        'h-8 flex-1',
                        proposal.marketingActions?.rcs && 'bg-success hover:bg-success/90'
                      )}
                      onClick={() => onAction?.(proposal.id, 'rcs')}
                    >
                      <MessageSquare className="mr-1 h-3 w-3" />
                      RCS
                    </Button>
                    <Button
                      variant={proposal.marketingActions?.email ? 'default' : 'outline'}
                      size="sm"
                      className={cn(
                        'h-8 flex-1',
                        proposal.marketingActions?.email && 'bg-success hover:bg-success/90'
                      )}
                      onClick={() => onAction?.(proposal.id, 'email')}
                    >
                      <Mail className="mr-1 h-3 w-3" />
                      Email
                    </Button>
                    <Button
                      variant={proposal.marketingActions?.call ? 'default' : 'outline'}
                      size="sm"
                      className={cn(
                        'h-8 flex-1',
                        proposal.marketingActions?.call && 'bg-success hover:bg-success/90'
                      )}
                      onClick={() => onAction?.(proposal.id, 'call')}
                    >
                      <Phone className="mr-1 h-3 w-3" />
                      IA
                    </Button>
                  </div>

                  {/* Status dos gatilhos */}
                  {(proposal.marketingActions?.rcs || proposal.marketingActions?.email || proposal.marketingActions?.call) && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {proposal.marketingActions.rcs && (
                        <Badge variant="secondary" className="text-xs">
                          <Send className="mr-1 h-2 w-2" />
                          RCS Enviado
                        </Badge>
                      )}
                      {proposal.marketingActions.email && (
                        <Badge variant="secondary" className="text-xs">
                          <Send className="mr-1 h-2 w-2" />
                          Email Enviado
                        </Badge>
                      )}
                      {proposal.marketingActions.call && (
                        <Badge variant="secondary" className="text-xs">
                          <Send className="mr-1 h-2 w-2" />
                          Ligação Realizada
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ))}

          {filteredProposals.length === 0 && (
            <div className="flex h-32 items-center justify-center text-center">
              <p className="text-sm text-muted-foreground">
                Nenhuma proposta
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

interface ProposalPipelineProps {
  proposals: Proposal[];
  onMarketingAction?: (proposalId: string, action: 'rcs' | 'email' | 'call') => void;
}

const ProposalPipeline = ({ proposals, onMarketingAction }: ProposalPipelineProps) => {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      <PipelineColumn
        title="Aprovadas"
        status="aprovada"
        proposals={proposals}
        icon={<CheckCircle className="h-5 w-5 text-white" />}
        color="bg-success"
        onAction={onMarketingAction}
      />
      <PipelineColumn
        title="Recusadas"
        status="recusada"
        proposals={proposals}
        icon={<XCircle className="h-5 w-5 text-white" />}
        color="bg-destructive"
      />
      <PipelineColumn
        title="Com Erro"
        status="erro"
        proposals={proposals}
        icon={<AlertTriangle className="h-5 w-5 text-white" />}
        color="bg-warning"
      />
    </div>
  );
};

export default ProposalPipeline;
