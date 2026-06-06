import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Clock, ArrowRight, User, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { PixAuditExportDialog } from './PixAuditExportDialog';

export interface PixAuditEntry {
  id: string;
  proposal_id: string;
  actor_email: string | null;
  actor_id: string | null;
  from_phase: string | null;
  to_phase: string;
  pix_key_type: string | null;
  pix_key_value: string | null;
  biometric_link: string | null;
  error_message: string | null;
  created_at: string;
}

const PHASE_LABEL: Record<string, string> = {
  idle: 'Aguardando chave',
  generating: 'Gerando link',
  analyzing: 'Em análise',
  ready: 'Pronto p/ assinatura',
  error: 'Erro',
};

const phaseColor = (p: string) => {
  switch (p) {
    case 'ready':
      return 'bg-success/15 text-success border-success/30';
    case 'error':
      return 'bg-destructive/15 text-destructive border-destructive/30';
    case 'analyzing':
    case 'generating':
      return 'bg-warning/15 text-warning border-warning/30';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
};

interface PixAuditTimelineProps {
  proposalId: string;
  compact?: boolean;
  showExport?: boolean;
  refreshKey?: number;
}

export function PixAuditTimeline({ proposalId, compact, showExport, refreshKey }: PixAuditTimelineProps) {
  const [entries, setEntries] = useState<PixAuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const { data, error } = await supabase
        .from('proposal_pix_audit')
        .select('*')
        .eq('proposal_id', proposalId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (cancelled) return;
      if (error) {
        setError(error.message);
      } else {
        setEntries((data as PixAuditEntry[]) ?? []);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [proposalId, refreshKey]);

  return (
    <div className={cn('rounded-md border border-border/60 bg-background/30', compact ? 'p-2' : 'p-3')}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Clock className={cn('text-primary', compact ? 'h-3 w-3' : 'h-3.5 w-3.5')} />
          <span className={cn('font-semibold uppercase tracking-wider text-foreground', compact ? 'text-[10px]' : 'text-xs')}>
            Histórico da chave Pix
          </span>
        </div>
        {showExport && (
          <Button
            variant="ghost"
            size="sm"
            className={cn('h-6 px-2', compact ? 'text-[10px]' : 'text-xs')}
            onClick={() => setExportOpen(true)}
          >
            Exportar
          </Button>
        )}
      </div>

      {loading && (
        <div className="flex items-center gap-2 py-2 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" /> Carregando histórico…
        </div>
      )}
      {error && (
        <div className="flex items-start gap-1.5 rounded-md border border-destructive/30 bg-destructive/10 p-2 text-[11px] text-destructive">
          <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" /> {error}
        </div>
      )}
      {!loading && !error && entries.length === 0 && (
        <p className={cn('text-muted-foreground italic', compact ? 'text-[10px]' : 'text-xs')}>
          Sem alterações registradas ainda.
        </p>
      )}

      {entries.length > 0 && (
        <ol className="relative space-y-2 border-l border-border/60 pl-3">
          {entries.map((e) => (
            <li key={e.id} className="relative">
              <span className={cn(
                'absolute -left-[7px] top-1 h-2.5 w-2.5 rounded-full border',
                phaseColor(e.to_phase),
              )} />
              <div className="flex items-center gap-1.5">
                {e.from_phase && (
                  <>
                    <span className={cn('rounded border px-1.5 py-0.5', phaseColor(e.from_phase), compact ? 'text-[9px]' : 'text-[10px]')}>
                      {PHASE_LABEL[e.from_phase] ?? e.from_phase}
                    </span>
                    <ArrowRight className="h-2.5 w-2.5 text-muted-foreground" />
                  </>
                )}
                <span className={cn('rounded border px-1.5 py-0.5 font-semibold', phaseColor(e.to_phase), compact ? 'text-[9px]' : 'text-[10px]')}>
                  {PHASE_LABEL[e.to_phase] ?? e.to_phase}
                </span>
                {e.pix_key_type && (
                  <span className={cn('text-muted-foreground', compact ? 'text-[10px]' : 'text-[11px]')}>
                    · {e.pix_key_type}
                  </span>
                )}
              </div>
              <div className={cn('mt-0.5 flex items-center gap-2 text-muted-foreground', compact ? 'text-[10px]' : 'text-[11px]')}>
                <span className="inline-flex items-center gap-1">
                  <User className="h-2.5 w-2.5" />
                  {e.actor_email ?? 'sistema'}
                </span>
                <span>· {new Date(e.created_at).toLocaleString('pt-BR')}</span>
              </div>
              {e.error_message && (
                <p className={cn('mt-0.5 text-destructive', compact ? 'text-[10px]' : 'text-[11px]')}>
                  {e.error_message}
                </p>
              )}
            </li>
          ))}
        </ol>
      )}

      {showExport && (
        <PixAuditExportDialog
          open={exportOpen}
          onOpenChange={setExportOpen}
          proposalId={proposalId}
        />
      )}
    </div>
  );
}