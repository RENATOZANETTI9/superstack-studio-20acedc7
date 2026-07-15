import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Activity, RefreshCw, KeyRound, ExternalLink, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

export const AI_ROUTE_HISTORY_KEY = 'ai_route_gen_history_v1';

export interface AiRouteHistoryEntry {
  at: string; // ISO
  cidade?: string;
  bairros?: string;
  meta: any;
}

export function readAiRouteHistory(): AiRouteHistoryEntry[] {
  try {
    const raw = localStorage.getItem(AI_ROUTE_HISTORY_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

export function pushAiRouteHistory(entry: AiRouteHistoryEntry, max = 20) {
  try {
    const cur = readAiRouteHistory();
    const next = [entry, ...cur].slice(0, max);
    localStorage.setItem(AI_ROUTE_HISTORY_KEY, JSON.stringify(next));
  } catch { /* ignore */ }
}

interface HealthResult {
  tavily_configured: boolean;
  tavily_key_valid_shape: boolean;
  live_test_ok: boolean;
  live_test_status: number | null;
  sample_results_count: number;
  error_message: string | null;
  checked_at: string;
  duration_ms: number;
}

export default function PartnersDiagnosticoIA() {
  const [health, setHealth] = useState<HealthResult | null>(null);
  const [checking, setChecking] = useState(false);
  const [history, setHistory] = useState<AiRouteHistoryEntry[]>([]);

  const refreshHistory = () => setHistory(readAiRouteHistory());

  useEffect(() => { refreshHistory(); void runHealth(); /* eslint-disable-next-line */ }, []);

  const runHealth = async () => {
    setChecking(true);
    try {
      const { data, error } = await supabase.functions.invoke('tavily-health', { body: {} });
      if (error) throw error;
      setHealth(data as HealthResult);
      if ((data as any)?.live_test_ok) toast.success('Tavily OK — chave válida e busca respondendo.');
      else if ((data as any)?.tavily_key_valid_shape) toast.warning('Chave com formato correto, mas a busca falhou.');
      else toast.error('TAVILY_API_KEY inválida ou ausente.');
    } catch (err: any) {
      toast.error('Erro ao consultar tavily-health: ' + (err?.message || 'desconhecido'));
    } finally {
      setChecking(false);
    }
  };

  const clearHistory = () => {
    localStorage.removeItem(AI_ROUTE_HISTORY_KEY);
    setHistory([]);
    toast.success('Histórico local limpo.');
  };

  const statusPill = (ok: boolean, label: string) => (
    <Badge className={ok ? 'bg-green-100 text-green-700 border-green-300' : 'bg-red-100 text-red-700 border-red-300'}>
      {ok ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
      {label}
    </Badge>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
            <Activity className="w-7 h-7 text-primary" /> Diagnóstico do Roteiro IA
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Estado da chave Tavily, últimas gerações realizadas neste navegador e um guia para corrigir problemas.
          </p>
        </div>

        {/* Health */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <CardTitle className="text-base flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-primary" /> Status do Tavily
              </CardTitle>
              <Button size="sm" onClick={runHealth} disabled={checking} className="gap-2">
                <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
                {checking ? 'Verificando…' : 'Reverificar Tavily'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {!health ? (
              <p className="text-muted-foreground">Nenhuma verificação executada ainda.</p>
            ) : (
              <>
                <div className="flex flex-wrap gap-2">
                  {statusPill(health.tavily_configured, 'Secret configurado')}
                  {statusPill(health.tavily_key_valid_shape, 'Formato "tvly-…"')}
                  {statusPill(health.live_test_ok, `Busca ao vivo (${health.sample_results_count} resultados)`)}
                </div>
                <div className="text-xs text-muted-foreground grid gap-1">
                  <div>HTTP: <span className="font-mono">{health.live_test_status ?? '—'}</span></div>
                  <div>Duração: {health.duration_ms}ms</div>
                  <div>Verificado em: {new Date(health.checked_at).toLocaleString('pt-BR')}</div>
                  {health.error_message && (
                    <div className="text-red-600 mt-1 flex items-start gap-1">
                      <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                      <span className="break-all">{health.error_message}</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Guide */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-primary" /> Como substituir o <span className="font-mono text-xs bg-muted px-1 py-0.5 rounded">TAVILY_API_KEY</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <ol className="list-decimal ml-5 space-y-2">
              <li>
                Crie ou copie uma chave em{' '}
                <a href="https://app.tavily.com/home" target="_blank" rel="noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                  app.tavily.com <ExternalLink className="w-3 h-3" />
                </a>. A chave precisa começar com <span className="font-mono bg-muted px-1 rounded">tvly-</span>.
              </li>
              <li>
                No projeto, abra <span className="font-semibold">Configurações → Secrets</span> (ou peça ao administrador).
                Edite o secret existente <span className="font-mono bg-muted px-1 rounded">TAVILY_API_KEY</span> — não crie um novo com nome diferente.
              </li>
              <li>Cole o valor novo e salve. O deploy do backend pega o novo valor automaticamente na próxima chamada.</li>
              <li>Clique em <span className="font-semibold">"Reverificar Tavily"</span> acima. A badge "Busca ao vivo" deve ficar verde.</li>
              <li>Volte para <span className="font-semibold">Rota → Roteiro com IA</span> e gere um roteiro novo. O campo <span className="font-mono text-xs">tavily_sources</span> deve vir preenchido.</li>
            </ol>
            <div className="text-xs text-muted-foreground rounded border bg-muted/30 p-2">
              <strong>Sintomas de chave inválida:</strong> <span className="font-mono">tavily_errors ≥ 1</span> em todas as gerações,{' '}
              <span className="font-mono">source = "suggested"</span> mesmo com bairros informados,{' '}
              <span className="font-mono">tavily_expected_but_missing = true</span> no meta.
            </div>
          </CardContent>
        </Card>

        {/* History */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" /> Últimas gerações ({history.length})
              </CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={refreshHistory}>Atualizar</Button>
                <Button size="sm" variant="ghost" onClick={clearHistory} className="text-red-600">Limpar</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma geração registrada neste navegador ainda. Gere um roteiro na aba "Roteiro com IA" para popular este histórico.
              </p>
            ) : (
              <div className="space-y-2">
                {history.map((h, i) => {
                  const m = h.meta || {};
                  const errs: any[] = Array.isArray(m.tavily_error_details) ? m.tavily_error_details : [];
                  const sources: any[] = Array.isArray(m.tavily_sources_summary) ? m.tavily_sources_summary : [];
                  const shapeOk = !!m.tavily_key_valid_shape;
                  const hasErr = (m.tavily_errors ?? 0) > 0;
                  return (
                    <div key={i} className="rounded-md border p-3 text-xs space-y-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="font-medium text-sm">
                          📍 {h.cidade || m.cidade || '—'}
                          {h.bairros ? <span className="text-muted-foreground"> · {h.bairros}</span> : null}
                        </div>
                        <div className="text-muted-foreground">{new Date(h.at).toLocaleString('pt-BR')}</div>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <Badge variant="outline">🤖 {m.model || '—'}</Badge>
                        <Badge variant="outline">⏱ {m.duration_ms ?? '—'}ms</Badge>
                        <Badge className={shapeOk ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                          key_valid_shape: {String(shapeOk)}
                        </Badge>
                        <Badge className={hasErr ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}>
                          tavily_errors: {m.tavily_errors ?? 0}
                        </Badge>
                        <Badge variant="outline">hits: {m.tavily_hits ?? 0}</Badge>
                        <Badge variant="outline">cache: {m.cache_hits ?? 0}</Badge>
                        <Badge variant="outline">sources: {m.tavily_sources_count ?? sources.length}</Badge>
                      </div>
                      {sources.length > 0 && (
                        <div>
                          <div className="font-semibold text-muted-foreground mb-1">tavily_sources_summary</div>
                          <ul className="pl-4 list-disc space-y-0.5">
                            {sources.slice(0, 5).map((s: any, j: number) => (
                              <li key={j} className="truncate">
                                <span className="text-muted-foreground">[{s.from}]</span> {s.bairro} — {s.title}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {errs.length > 0 && (
                        <div>
                          <div className="font-semibold text-red-600 mb-1">tavily_error_details</div>
                          <ul className="pl-4 list-disc space-y-0.5 text-red-600/90">
                            {errs.map((e: any, j: number) => (
                              <li key={j} className="break-all">
                                {e.bairro} — {e.status ?? 'exception'}: {e.message}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
