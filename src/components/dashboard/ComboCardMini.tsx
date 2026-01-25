import { motion } from 'framer-motion';
import { Check, Lock, Zap, FileCheck, Headphones, Settings, Webhook } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';

interface PlanFeature {
  text: string;
  points?: string;
}

interface PlanDetails {
  features: PlanFeature[];
  requirements?: string[];
}

const planDetailsMap: Record<string, PlanDetails> = {
  'Nível Básico': {
    features: [
      { text: 'Consultas individuais', points: '50 Pontos Help' },
      { text: 'Pipeline de propostas' },
      { text: 'Gatilhos de Marketing básico', points: '50 Pontos Help' },
    ],
  },
  'Nível Profissional': {
    features: [
      { text: 'Consultas individuais', points: '1000 Pontos Help' },
      { text: 'Consultas em lote (RCS)', points: '1000 Pontos Help' },
      { text: 'Envio de RCS', points: '1000 Pontos Help' },
      { text: 'Ligações por IA', points: '1000 Pontos Help' },
      { text: 'Envio de email marketing', points: '1000 Pontos Help' },
    ],
    requirements: [
      'Aprovação cadastral',
      'Contrato social',
      'Documentação da empresa',
    ],
  },
  'Nível Enterprise': {
    features: [
      { text: 'Tudo do Combo profissional', points: 'Ilimitado' },
      { text: 'Suporte dedicado 24/7' },
      { text: 'Customização de regras' },
      { text: 'Webhooks em tempo real' },
    ],
    requirements: [
      'Toda documentação do Combo Profissional',
      'Análise de histórico dos últimos 90 dias',
      'Aprovação cadastral especial',
    ],
  },
};

interface ComboCardMiniProps {
  title: string;
  consultasLimit: string;
  active: boolean;
  locked?: boolean;
  selected?: boolean;
  onSelect?: () => void;
}

const ComboCardMini = ({
  title,
  consultasLimit,
  active,
  locked = false,
  selected = false,
  onSelect,
}: ComboCardMiniProps) => {
  const planDetails = planDetailsMap[title];

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        <motion.div
          whileHover={!locked ? { scale: 1.02 } : {}}
          whileTap={!locked ? { scale: 0.98 } : {}}
          onClick={!locked ? onSelect : undefined}
          className={cn(
            'relative cursor-pointer rounded-xl border p-3 transition-all duration-300',
            locked && 'cursor-not-allowed opacity-60',
            selected && !locked
              ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20'
              : 'border-border/50 bg-card/50 hover:border-primary/50',
          )}
        >
          {locked && (
            <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-muted">
              <Lock className="h-3 w-3 text-muted-foreground" />
            </div>
          )}

          {selected && !locked && (
            <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
              <Check className="h-3 w-3 text-primary-foreground" />
            </div>
          )}

          <div className="flex items-center gap-2">
            <div className={cn(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
              selected && !locked ? 'bg-primary/20' : 'bg-muted'
            )}>
              <Zap className={cn(
                'h-4 w-4',
                selected && !locked ? 'text-primary' : 'text-muted-foreground'
              )} />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="truncate text-sm font-semibold text-foreground">{title}</h4>
              <p className="truncate text-xs text-muted-foreground">{consultasLimit}</p>
            </div>
          </div>
        </motion.div>
      </HoverCardTrigger>
      
      {planDetails && (
        <HoverCardContent 
          side="left" 
          align="start" 
          className="w-72 p-4"
          sideOffset={8}
        >
          <div className="space-y-3">
            <div>
              <h4 className="font-semibold text-foreground flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                {title}
              </h4>
              <p className="text-xs text-muted-foreground">{consultasLimit}</p>
            </div>

            {/* Features */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-foreground uppercase tracking-wide">
                Recursos inclusos
              </p>
              <ul className="space-y-1.5">
                {planDetails.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-xs">
                    <Check className="h-3 w-3 shrink-0 text-success mt-0.5" />
                    <span className="text-foreground">
                      {feature.text}
                      {feature.points && (
                        <span className="ml-1 text-primary font-medium">
                          ({feature.points})
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Requirements */}
            {planDetails.requirements && planDetails.requirements.length > 0 && (
              <div className="space-y-2 border-t border-border/50 pt-3">
                <p className="text-xs font-medium text-foreground uppercase tracking-wide flex items-center gap-1">
                  <FileCheck className="h-3 w-3 text-warning" />
                  Requisitos para liberar
                </p>
                <ul className="space-y-1.5">
                  {planDetails.requirements.map((req, index) => (
                    <li key={index} className="flex items-start gap-2 text-xs">
                      <Lock className="h-3 w-3 shrink-0 text-warning mt-0.5" />
                      <span className="text-muted-foreground">{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </HoverCardContent>
      )}
    </HoverCard>
  );
};

export default ComboCardMini;
