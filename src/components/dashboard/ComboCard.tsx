import { motion } from 'framer-motion';
import { Check, FileText, History, Lock, Unlock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ComboCardProps {
  title: string;
  consultasLimit: string;
  features: string[];
  requirements?: string[];
  active: boolean;
  locked?: boolean;
  selected?: boolean;
  onSelect?: () => void;
}

const ComboCard = ({
  title,
  consultasLimit,
  features,
  requirements,
  active,
  locked,
  selected,
  onSelect,
}: ComboCardProps) => {
  return (
    <motion.div
      whileHover={active && !locked ? { scale: 1.02 } : {}}
      className={cn(
        'glass-card relative overflow-hidden rounded-2xl p-6 transition-all',
        selected && 'border-2 border-primary ring-2 ring-primary/20',
        active && !locked
          ? 'cursor-pointer hover:border-primary/50'
          : 'cursor-not-allowed opacity-70'
      )}
      onClick={active && !locked ? onSelect : undefined}
    >
      {/* Status */}
      <div className="absolute right-4 top-4">
        {locked ? (
          <Lock className="h-5 w-5 text-muted-foreground" />
        ) : selected ? (
          <Badge className="bg-primary text-primary-foreground">
            <Check className="mr-1 h-3 w-3" />
            Ativo
          </Badge>
        ) : (
          <Unlock className="h-5 w-5 text-success" />
        )}
      </div>

      {/* Title */}
      <h4 className="mb-1 text-lg font-bold text-foreground">{title}</h4>
      <p className="mb-4 text-2xl font-bold text-primary">{consultasLimit}</p>

      {/* Features */}
      <ul className="mb-4 space-y-2">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-2 text-sm">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
            <span className="text-muted-foreground">{feature}</span>
          </li>
        ))}
      </ul>

      {/* Requirements */}
      {requirements && requirements.length > 0 && (
        <div className="mt-4 border-t border-border/50 pt-4">
          <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
            Requisitos:
          </p>
          <ul className="space-y-1">
            {requirements.map((req, index) => (
              <li key={index} className="flex items-start gap-2 text-xs">
                {locked ? (
                  <FileText className="mt-0.5 h-3 w-3 shrink-0 text-warning" />
                ) : (
                  <Check className="mt-0.5 h-3 w-3 shrink-0 text-success" />
                )}
                <span className={locked ? 'text-warning' : 'text-success'}>
                  {req}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action */}
      {!selected && !locked && (
        <Button
          variant="outline"
          className="mt-4 w-full hover:bg-primary/10 hover:text-primary"
          onClick={onSelect}
        >
          Selecionar Combo
        </Button>
      )}

      {locked && (
        <Button
          variant="outline"
          className="mt-4 w-full"
          disabled
        >
          <Lock className="mr-2 h-4 w-4" />
          Solicitar Aprovação
        </Button>
      )}
    </motion.div>
  );
};

export default ComboCard;
