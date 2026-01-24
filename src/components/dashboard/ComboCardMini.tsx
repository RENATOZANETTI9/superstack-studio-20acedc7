import { motion } from 'framer-motion';
import { Check, Lock, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  return (
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
  );
};

export default ComboCardMini;
