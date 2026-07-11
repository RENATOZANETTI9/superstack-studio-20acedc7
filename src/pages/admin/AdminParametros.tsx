import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Settings2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSystemConfigFull, useUpdateSystemConfig } from '@/hooks/useSystemConfig';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useRoleGuard } from '@/hooks/useRoleGuard';

// ---------- helpers ----------
function useUpdatedByEmail(userId: string | null) {
  const [email, setEmail] = useState<string | null>(null);
  useEffect(() => {
    if (!userId) { setEmail(null); return; }
    supabase.from('profiles').select('email').eq('user_id', userId).maybeSingle()
      .then(({ data }) => setEmail((data as any)?.email ?? null));
  }, [userId]);
  return email;
}

function LastEdited({ updatedAt, updatedBy }: { updatedAt?: string; updatedBy?: string | null }) {
  const email = useUpdatedByEmail(updatedBy ?? null);
  if (!updatedAt) return null;
  const date = new Date(updatedAt).toLocaleDateString('pt-BR');
  return (
    <p className="text-xs text-muted-foreground mt-2">
      Última edição: {date}{email ? ` por ${email}` : ''}
    </p>
  );
}

function toNumber(v: string): number | null {
  if (v === '' || v == null) return null;
  const n = Number(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

// ---------- Reusable rate card ----------
function RateCard({
  configKey,
  title,
  description,
}: {
  configKey: string;
  title: string;
  description: string;
}) {
  const KEY = configKey;
  const { data, isLoading } = useSystemConfigFull(KEY);
  const update = useUpdateSystemConfig();
  const [ratePct, setRatePct] = useState<string>('');

  useEffect(() => {
    const rate = (data?.config_value as any)?.rate;
    if (rate != null) setRatePct(String((rate * 100).toFixed(4).replace(/\.?0+$/, '')));
  }, [data]);

  const parsed = toNumber(ratePct);
  const error =
    ratePct === ''
      ? 'Informe a taxa.'
      : parsed == null
        ? 'Valor numérico inválido.'
        : parsed < 0 || parsed > 100
          ? 'A taxa deve estar entre 0 e 100.'
          : null;

  const save = () => {
    if (error || parsed == null) {
      toast.error(error ?? 'Informe uma taxa válida entre 0 e 100.');
      return;
    }
    const newValue = { ...(data?.config_value as any), rate: parsed / 100 };
    update.mutate({ configKey: KEY, value: newValue }, {
      onSuccess: () => toast.success('Taxa de comissão atualizada.'),
      onError: (e: any) => toast.error(e?.message ?? 'Erro ao salvar.'),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <Loader2 className="animate-spin" />
        ) : (
          <>
            <div className="max-w-xs space-y-2">
              <Label htmlFor={`rate-${KEY}`}>Taxa (%)</Label>
              <Input
                id={`rate-${KEY}`}
                type="number"
                step="0.01"
                min={0}
                max={100}
                value={ratePct}
                onChange={(e) => setRatePct(e.target.value)}
                aria-invalid={!!error}
                className={error ? 'border-destructive focus-visible:ring-destructive' : ''}
              />
              {error && <p className="text-xs text-destructive">{error}</p>}
              <p className="text-xs text-muted-foreground">
                Atual: {parsed != null && !error ? `${parsed.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}%` : '—'}
              </p>
            </div>
            <Button onClick={save} disabled={update.isPending || !!error}>
              {update.isPending ? 'Salvando…' : 'Salvar'}
            </Button>
            <LastEdited updatedAt={data?.updated_at} updatedBy={data?.updated_by} />
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ---------- Card 2: MIMO Representante ----------
type MimoRepTier = { min_volume: number | null; max_volume: number | null; brinde: string; label: string; level: number };
const REP_TIER_KEYS = ['bronze', 'prata', 'ouro', 'diamante'] as const;

function CardMimoRepresentante() {
  const KEY = 'faixas_mimo_representante';
  const { data, isLoading } = useSystemConfigFull(KEY);
  const update = useUpdateSystemConfig();
  const [tiers, setTiers] = useState<Record<string, MimoRepTier>>({} as any);

  useEffect(() => {
    if (data?.config_value) setTiers({ ...(data.config_value as any) });
  }, [data]);

  const setField = (key: string, field: keyof MimoRepTier, value: any) => {
    setTiers((prev) => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
  };

  const tierErrors: Record<string, { min?: string; max?: string; brinde?: string }> = {};
  for (const k of REP_TIER_KEYS) {
    const t = tiers[k];
    if (!t) continue;
    const errs: { min?: string; max?: string; brinde?: string } = {};
    if (t.min_volume == null || t.min_volume < 0) errs.min = 'Volume mínimo obrigatório (≥ 0).';
    if (t.max_volume != null && t.max_volume < 0) errs.max = 'Valor negativo inválido.';
    if (t.min_volume != null && t.max_volume != null && t.min_volume > t.max_volume)
      errs.max = 'Máximo deve ser ≥ mínimo.';
    if (!t.brinde || !t.brinde.trim())
      errs.brinde = `Descreva o brinde da faixa ${t.label}.`;
    if (Object.keys(errs).length) tierErrors[k] = errs;
  }
  const hasErrors = Object.keys(tierErrors).length > 0;

  const save = () => {
    if (hasErrors) {
      toast.error('Corrija os campos destacados antes de salvar.');
      return;
    }
    update.mutate({ configKey: KEY, value: tiers }, {
      onSuccess: () => toast.success('Faixas de MIMO atualizadas.'),
      onError: (e: any) => toast.error(e?.message ?? 'Erro ao salvar.'),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>MIMO Representante</CardTitle>
        <CardDescription>Faixas mensais por volume de produção paga do representante.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <Loader2 className="animate-spin" />
        ) : (
          <>
            <div className="space-y-4">
              {REP_TIER_KEYS.map((k) => {
                const t = tiers[k];
                if (!t) return null;
                const errs = tierErrors[k] ?? {};
                return (
                  <div key={k} className="border rounded-lg p-4 space-y-3">
                    <p className="font-semibold">{t.label}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label>Volume mínimo (R$)</Label>
                        <Input
                          type="number"
                          value={t.min_volume ?? ''}
                          onChange={(e) => setField(k, 'min_volume', toNumber(e.target.value))}
                          aria-invalid={!!errs.min}
                          className={errs.min ? 'border-destructive focus-visible:ring-destructive' : ''}
                        />
                        {errs.min && <p className="text-xs text-destructive">{errs.min}</p>}
                      </div>
                      <div className="space-y-1">
                        <Label>Volume máximo (R$)</Label>
                        <Input
                          type="number"
                          placeholder="Sem limite"
                          value={t.max_volume ?? ''}
                          onChange={(e) => setField(k, 'max_volume', toNumber(e.target.value))}
                          aria-invalid={!!errs.max}
                          className={errs.max ? 'border-destructive focus-visible:ring-destructive' : ''}
                        />
                        {errs.max ? (
                          <p className="text-xs text-destructive">{errs.max}</p>
                        ) : t.max_volume == null && (
                          <p className="text-xs text-muted-foreground">Sem limite</p>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label>Brinde</Label>
                      <Textarea
                        rows={2}
                        value={t.brinde ?? ''}
                        onChange={(e) => setField(k, 'brinde', e.target.value)}
                        aria-invalid={!!errs.brinde}
                        className={errs.brinde ? 'border-destructive focus-visible:ring-destructive' : ''}
                      />
                      {errs.brinde && <p className="text-xs text-destructive">{errs.brinde}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
            <Button onClick={save} disabled={update.isPending || hasErrors}>
              {update.isPending ? 'Salvando…' : 'Salvar'}
            </Button>
            <LastEdited updatedAt={data?.updated_at} updatedBy={data?.updated_by} />
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ---------- Card 3: MIMO Atendente ----------
type MimoAtdTier = { min_producao: number | null; max_producao: number | null; mimo: string };
const ATD_TIER_KEYS = ['bronze', 'prata', 'ouro'] as const;
const ATD_LABELS: Record<string, string> = { bronze: 'Bronze', prata: 'Prata', ouro: 'Ouro' };

function CardMimoAtendente() {
  const KEY = 'faixas_mimo_atendente';
  const { data, isLoading } = useSystemConfigFull(KEY);
  const update = useUpdateSystemConfig();
  const [tiers, setTiers] = useState<Record<string, MimoAtdTier>>({} as any);

  useEffect(() => {
    if (data?.config_value) setTiers({ ...(data.config_value as any) });
  }, [data]);

  const setField = (key: string, field: keyof MimoAtdTier, value: any) => {
    setTiers((prev) => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
  };

  const tierErrors: Record<string, { min?: string; max?: string; mimo?: string }> = {};
  for (const k of ATD_TIER_KEYS) {
    const t = tiers[k];
    if (!t) continue;
    const errs: { min?: string; max?: string; mimo?: string } = {};
    if (t.min_producao == null || t.min_producao < 0) errs.min = 'Produção mínima obrigatória (≥ 0).';
    if (t.max_producao != null && t.max_producao < 0) errs.max = 'Valor negativo inválido.';
    if (t.min_producao != null && t.max_producao != null && t.min_producao > t.max_producao)
      errs.max = 'Máximo deve ser ≥ mínimo.';
    if (!t.mimo || !t.mimo.trim())
      errs.mimo = `Descreva o brinde da faixa ${ATD_LABELS[k]}.`;
    if (Object.keys(errs).length) tierErrors[k] = errs;
  }
  const hasErrors = Object.keys(tierErrors).length > 0;

  const save = () => {
    if (hasErrors) {
      toast.error('Corrija os campos destacados antes de salvar.');
      return;
    }
    update.mutate({ configKey: KEY, value: tiers }, {
      onSuccess: () => toast.success('Faixas do atendente atualizadas.'),
      onError: (e: any) => toast.error(e?.message ?? 'Erro ao salvar.'),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>MIMO Atendente</CardTitle>
        <CardDescription>Faixas mensais por produção paga do atendente.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <Loader2 className="animate-spin" />
        ) : (
          <>
            <div className="space-y-4">
              {ATD_TIER_KEYS.map((k) => {
                const t = tiers[k];
                if (!t) return null;
                const errs = tierErrors[k] ?? {};
                return (
                  <div key={k} className="border rounded-lg p-4 space-y-3">
                    <p className="font-semibold">{ATD_LABELS[k]}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label>Produção mínima (R$)</Label>
                        <Input
                          type="number"
                          value={t.min_producao ?? ''}
                          onChange={(e) => setField(k, 'min_producao', toNumber(e.target.value))}
                          aria-invalid={!!errs.min}
                          className={errs.min ? 'border-destructive focus-visible:ring-destructive' : ''}
                        />
                        {errs.min && <p className="text-xs text-destructive">{errs.min}</p>}
                      </div>
                      <div className="space-y-1">
                        <Label>Produção máxima (R$)</Label>
                        <Input
                          type="number"
                          placeholder="Sem limite"
                          value={t.max_producao ?? ''}
                          onChange={(e) => setField(k, 'max_producao', toNumber(e.target.value))}
                          aria-invalid={!!errs.max}
                          className={errs.max ? 'border-destructive focus-visible:ring-destructive' : ''}
                        />
                        {errs.max ? (
                          <p className="text-xs text-destructive">{errs.max}</p>
                        ) : t.max_producao == null && (
                          <p className="text-xs text-muted-foreground">Sem limite</p>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label>Brinde</Label>
                      <Textarea
                        rows={2}
                        value={t.mimo ?? ''}
                        onChange={(e) => setField(k, 'mimo', e.target.value)}
                        aria-invalid={!!errs.mimo}
                        className={errs.mimo ? 'border-destructive focus-visible:ring-destructive' : ''}
                      />
                      {errs.mimo && <p className="text-xs text-destructive">{errs.mimo}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
            <Button onClick={save} disabled={update.isPending || hasErrors}>
              {update.isPending ? 'Salvando…' : 'Salvar'}
            </Button>
            <LastEdited updatedAt={data?.updated_at} updatedBy={data?.updated_by} />
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminParametros() {
  const { role, isLoading } = useAuth();
  useRoleGuard(['master', 'admin']);

  if (isLoading) return null;
  if (role !== 'master' && role !== 'admin') return null;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center gap-3">
          <Settings2 className="w-7 h-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Parâmetros do Sistema</h1>
            <p className="text-sm text-muted-foreground">
              Ajuste taxas e faixas — mudanças propagam automaticamente para todo o sistema.
            </p>
          </div>
        </div>

        <RateCard
          configKey="taxa_comissao_representante"
          title="Comissão do Representante"
          description="Percentual pago ao representante sobre produção paga das clínicas do portfólio."
        />
        <CardMimoRepresentante />
        <CardMimoAtendente />
      </div>
    </DashboardLayout>
  );
}