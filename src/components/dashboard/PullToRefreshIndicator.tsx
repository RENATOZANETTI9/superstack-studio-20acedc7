import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PullToRefreshIndicatorProps {
  pullIndicator: number;
  isRefreshing: boolean;
}

const PullToRefreshIndicator = ({ pullIndicator, isRefreshing }: PullToRefreshIndicatorProps) => {
  if (pullIndicator <= 0 && !isRefreshing) return null;

  return (
    <div
      className="flex items-center justify-center py-3 transition-opacity"
      style={{ opacity: isRefreshing ? 1 : pullIndicator }}
    >
      <Loader2 className={cn('h-5 w-5 text-primary', isRefreshing && 'animate-spin')} />
      <span className="ml-2 text-xs text-muted-foreground">
        {isRefreshing ? 'Atualizando...' : pullIndicator >= 1 ? 'Solte para atualizar' : 'Puxe para atualizar'}
      </span>
    </div>
  );
};

export default PullToRefreshIndicator;
