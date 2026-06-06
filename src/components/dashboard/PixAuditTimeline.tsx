import { useEffect, useId, useState } from 'react';
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
  const headingId = useId();

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
    <section
      role="region"
      aria-labelledby={headingId}
      aria-busy={loading}
      className={cn('rounded-md border border-border/60 bg-background/30', compact ? 'p-2' : 'p-3')}
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Clock aria-hidden="true" className={cn('text-primary', compact ? 'h-3 w-3' : 'h-3.5 w-3.5')} />
          <h3
            id={headingId}
            className={cn(
              'font-semibold uppercase tracking-wider text-foreground',
              compact ? 'text-[10px]' : 'text-xs',
            )}
          >
            Histórico da chave Pix
          </h3>
        </div>
        {showExport && (
          <Button
            variant="ghost"
            size="sm"
            aria-label="Exportar histórico da chave Pix"
            className={cn(
              'h-7 min-h-7 px-2 focus-visible:ring-2 focus-visible:ring-primary',
              compact ? 'text-[10px]' : 'text-xs',
            )}
            onClick={() => setExportOpen(true)}
          >
            Exportar
          </Button>
        )}
      </div>

      {/* Live region for status changes (screen readers) */}
      <p className="sr-only" aria-live="polite">
        {loading
          ? 'Carregando histórico da chave Pix.'
          : error
            ? `Erro ao carregar histórico: ${error}`
            : `${entries.length} evento${entries.length === 1 ? '' : 's'} no histórico.`}
      </p>

      {loading && (
        <div role="status" className="flex items-center gap-2 py-2 text-xs text-muted-foreground">
          <Loader2 aria-hidden="true" className="h-3 w-3 animate-spin" /> Carregando histórico…
        </div>
      )}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-1.5 rounded-md border border-destructive/40 bg-destructive/10 p-2 text-[11px] text-destructive"
        >
          <AlertCircle aria-hidden="true" className="h-3 w-3 mt-0.5 shrink-0" /> {error}
        </div>
      )}
      {!loading && !error && entries.length === 0 && (
        <p className={cn('text-foreground/70 italic', compact ? 'text-[10px]' : 'text-xs')}>
          Sem alterações registradas ainda.
        </p>
      )}

      {entries.length > 0 && (
        <ol
          aria-label="Linha do tempo de transições da chave Pix, mais recente primeiro"
          className="relative space-y-2 border-l border-border/60 pl-3"
        >
          {entries.map((e) => (
            <li
              key={e.id}
              className="relative"
              aria-label={[
                e.from_phase ? `De ${PHASE_LABEL[e.from_phase] ?? e.from_phase}` : 'Início',
                `para ${PHASE_LABEL[e.to_phase] ?? e.to_phase}`,
                e.pix_key_type ? `tipo ${e.pix_key_type}` : null,
                `por ${e.actor_email ?? 'sistema'}`,
                `em ${new Date(e.created_at).toLocaleString('pt-BR')}`,
                e.error_message ? `erro: ${e.error_message}` : null,
              ]
                .filter(Boolean)
                .join(', ')}
            >
              <span
                aria-hidden="true"
                className={cn(
                  'absolute -left-[7px] top-1 h-2.5 w-2.5 rounded-full border',
                  phaseColor(e.to_phase),
                )}
              />
              <div className="flex flex-wrap items-center gap-1.5">
                {e.from_phase && (
                  <>
                    <span className={cn('rounded border px-1.5 py-0.5', phaseColor(e.from_phase), compact ? 'text-[10px]' : 'text-[11px]')}>
                      {PHASE_LABEL[e.from_phase] ?? e.from_phase}
                    </span>
                    <ArrowRight aria-hidden="true" className="h-2.5 w-2.5 text-foreground/60" />
                  </>
                )}
                <span className={cn('rounded border px-1.5 py-0.5 font-semibold', phaseColor(e.to_phase), compact ? 'text-[10px]' : 'text-[11px]')}>
                  {PHASE_LABEL[e.to_phase] ?? e.to_phase}
                </span>
                {e.pix_key_type && (
                  <span className={cn('text-foreground/70', compact ? 'text-[10px]' : 'text-[11px]')}>
                    · {e.pix_key_type}
                  </span>
                )}
              </div>
              <div className={cn('mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-foreground/70', compact ? 'text-[10px]' : 'text-[11px]')}>
                <span className="inline-flex items-center gap-1">
                  <User aria-hidden="true" className="h-2.5 w-2.5" />
                  {e.actor_email ?? 'sistema'}
                </span>
                <time dateTime={e.created_at}>· {new Date(e.created_at).toLocaleString('pt-BR')}</time>
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
    </section>
  );
}