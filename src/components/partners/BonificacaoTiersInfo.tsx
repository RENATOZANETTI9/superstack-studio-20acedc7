import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DollarSign, Gift, Upload, Loader2, ImagePlus, Check, X, RefreshCw } from 'lucide-react';
import { PARTNER_RULES, MIMO_TIERS } from '@/lib/partner-rules';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const BUCKET = 'mimo-tiers';
const MAX_IMAGE_BYTES = 3 * 1024 * 1024; // 3 MB
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
const ACCEPTED_LABEL = 'PNG, JPG, WEBP ou GIF';

const humanSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

async function logMimoChange(params: {
  level: number;
  field: 'name' | 'image_url';
  oldValue: string | null;
  newValue: string | null;
}) {
  try {
    const { data: userRes } = await supabase.auth.getUser();
    const uid = userRes?.user?.id ?? null;
    await supabase.from('mimo_tiers_customization_log').insert({
      level: params.level,
      field: params.field,
      old_value: params.oldValue,
      new_value: params.newValue,
      changed_by: uid,
    });
  } catch (e) {
    console.warn('[audit] falha ao registrar mimo_tiers_customization_log', e);
  }
}

const formatRange = (min: number, max: number) =>
  Number.isFinite(max) ? `${min}–${max} simulações` : `${min}+ simulações`;

type Customization = {
  level: number;
  name: string;
  image_url: string | null;
};

const useSignedUrl = (path: string | null) => {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    if (!path) { setUrl(null); return; }
    // Support both raw storage path and full URL (legacy)
    if (/^https?:\/\//i.test(path)) { setUrl(path); return; }
    supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60).then(({ data }) => {
      if (!cancelled) setUrl(data?.signedUrl ?? null);
    });
    return () => { cancelled = true; };
  }, [path]);
  return url;
};

const TierEditor = ({
  tier,
  data,
  onSaved,
}: {
  tier: (typeof MIMO_TIERS)[number];
  data: Customization | undefined;
  onSaved: (row: Customization) => void;
}) => {
  const [name, setName] = useState(data?.name ?? tier.label);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [lastFailedFile, setLastFailedFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const imageUrl = useSignedUrl(data?.image_url ?? null);

  useEffect(() => { setName(data?.name ?? tier.label); setDirty(false); }, [data?.name, tier.label]);

  const upsert = async (patch: Partial<Customization>) => {
    const oldName = data?.name ?? null;
    const oldImage = data?.image_url ?? null;
    const payload = {
      level: tier.level,
      name: patch.name ?? name,
      image_url: patch.image_url !== undefined ? patch.image_url : data?.image_url ?? null,
    };
    const { data: row, error } = await supabase
      .from('mimo_tiers_customization')
      .upsert(payload, { onConflict: 'level' })
      .select()
      .single();
    if (error) throw error;
    onSaved(row as Customization);

    // Audit — só registra o que mudou
    if (patch.name !== undefined && payload.name !== oldName) {
      void logMimoChange({ level: tier.level, field: 'name', oldValue: oldName, newValue: payload.name });
    }
    if (patch.image_url !== undefined && payload.image_url !== oldImage) {
      void logMimoChange({ level: tier.level, field: 'image_url', oldValue: oldImage, newValue: payload.image_url });
    }
  };

  const handleSaveName = async () => {
    setSaving(true);
    try {
      await upsert({ name: name.trim() || tier.label });
      setDirty(false);
      toast.success('Nome do mimo atualizado');
    } catch (e: any) {
      toast.error('Falha ao salvar: ' + (e.message ?? 'erro desconhecido'));
    } finally { setSaving(false); }
  };

  const uploadFile = async (file: File) => {
    // Validação: tipo
    if (!ACCEPTED_TYPES.includes(file.type)) {
      const msg = `Tipo inválido (${file.type || 'desconhecido'}). Aceitos: ${ACCEPTED_LABEL}.`;
      setUploadError(msg);
      setLastFailedFile(null);
      toast.error(msg);
      return;
    }
    // Validação: tamanho
    if (file.size > MAX_IMAGE_BYTES) {
      const msg = `Arquivo muito grande (${humanSize(file.size)}). Limite: ${humanSize(MAX_IMAGE_BYTES)}.`;
      setUploadError(msg);
      setLastFailedFile(file);
      toast.error(msg);
      return;
    }

    setUploading(true);
    setUploadError(null);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `tier-${tier.level}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw new Error(`Falha ao enviar para o storage: ${upErr.message}`);
      try {
        await upsert({ image_url: path });
      } catch (dbErr: any) {
        throw new Error(`Upload concluído, mas falha ao salvar no banco: ${dbErr.message ?? 'erro desconhecido'}`);
      }
      setLastFailedFile(null);
      toast.success('Imagem do mimo atualizada');
    } catch (e: any) {
      const msg = e?.message ?? 'Erro desconhecido no upload';
      setUploadError(msg);
      setLastFailedFile(file);
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (fileRef.current) fileRef.current.value = '';
    if (!file) return;
    await uploadFile(file);
  };

  const handleRetry = async () => {
    if (!lastFailedFile) return;
    await uploadFile(lastFailedFile);
  };

  const handleRemoveImage = async () => {
    setSaving(true);
    try {
      await upsert({ image_url: null });
      setUploadError(null);
      setLastFailedFile(null);
      toast.success('Imagem removida');
    } catch (e: any) {
      toast.error('Falha ao remover: ' + (e.message ?? 'erro desconhecido'));
    } finally { setSaving(false); }
  };

  return (
    <div className="flex gap-3 p-2.5 rounded bg-muted/50 items-start">
      <div className="shrink-0">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading || saving}
          className="relative h-16 w-16 rounded-md border border-dashed bg-background overflow-hidden flex items-center justify-center hover:border-primary/60 transition disabled:opacity-60"
          title={data?.image_url ? 'Trocar imagem' : 'Anexar imagem'}
        >
          {uploading || saving ? (
            <div className="absolute inset-0 flex items-center justify-center bg-background/70">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : imageUrl ? (
            <img src={imageUrl} alt={name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-0.5 text-muted-foreground">
              <ImagePlus className="h-4 w-4" />
              <span className="text-[9px] leading-none">sem imagem</span>
            </div>
          )}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          className="hidden"
          onChange={handleFile}
        />
      </div>

      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <div className="text-xs text-muted-foreground">{formatRange(tier.min, tier.max)}</div>
          {(!data?.name || !data?.image_url) && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200 whitespace-nowrap">
              Sem dados ainda
            </span>
          )}
        </div>
        <div className="flex gap-1.5 items-center">
          <Input
            value={name}
            onChange={(e) => { setName(e.target.value); setDirty(true); }}
            placeholder={tier.label}
            className="h-8 text-sm"
            disabled={saving || uploading}
            maxLength={80}
          />
          {dirty && (
            <Button size="icon" variant="outline" className="h-8 w-8 shrink-0" onClick={handleSaveName} disabled={saving}>
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            </Button>
          )}
          {data?.image_url && !uploading && (
            <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0 text-muted-foreground" onClick={handleRemoveImage} disabled={saving} title="Remover imagem">
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <Upload className="h-3 w-3" />
          {uploading
            ? 'Enviando imagem…'
            : saving
            ? 'Salvando…'
            : `Clique na imagem para ${data?.image_url ? 'trocar' : 'anexar'} (${ACCEPTED_LABEL}, máx. ${humanSize(MAX_IMAGE_BYTES)})`}
        </div>
        {uploadError && !uploading && (
          <div className="flex items-start gap-1.5 text-[11px] p-1.5 rounded border border-destructive/40 bg-destructive/5 text-destructive">
            <span className="flex-1 leading-snug">{uploadError}</span>
            {lastFailedFile && (
              <Button
                size="sm"
                variant="outline"
                className="h-6 px-2 text-[11px] shrink-0"
                onClick={handleRetry}
                disabled={saving}
              >
                <RefreshCw className="h-3 w-3 mr-1" /> Tentar de novo
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const BonificacaoTiersInfo = () => {
  const [rows, setRows] = useState<Customization[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from('mimo_tiers_customization')
      .select('level, name, image_url')
      .order('level', { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) toast.error('Falha ao carregar mimos: ' + error.message);
        setRows((data as Customization[]) ?? []);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const upsertLocal = (row: Customization) => {
    setRows((prev) => {
      const next = prev.filter((r) => r.level !== row.level);
      next.push(row);
      return next.sort((a, b) => a.level - b.level);
    });
  };

  return (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Gift className="h-4 w-4 text-primary" /> Mimos por Volume de Simulações
        </CardTitle>
        <CardDescription className="text-xs">
          📅 <strong>Regra semanal</strong> · 💰 <strong>Pago pelo Partner</strong>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="space-y-2">
            {MIMO_TIERS.map((tier) => (
              <TierEditor
                key={tier.level}
                tier={tier}
                data={rows.find((r) => r.level === tier.level)}
                onSaved={upsertLocal}
              />
            ))}
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-3 p-2 bg-amber-50 rounded border border-amber-200">
          ⚠️ Mimos não são valores em dinheiro. São premiações (brindes, vouchers, etc.) definidas pelo partner responsável.
        </p>
      </CardContent>
    </Card>
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-green-500" /> PIX por Contrato Pago
        </CardTitle>
        <CardDescription className="text-xs">
          📅 <strong>Regra mensal</strong> · 💰 <strong>Pago pela Help Ude</strong>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {PARTNER_RULES.PIX_TIERS.map((tier, i) => (
            <div key={i} className="flex justify-between items-center p-2.5 rounded bg-muted/50 text-sm">
              <span>{tier.label}</span>
              <Badge variant="outline" className="font-medium">{tier.pix}</Badge>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3 p-2 bg-green-50 rounded border border-green-200">
          💡 Valor fixo em PIX baseado na faixa de produção mensal de contratos pagos. Pago pela Help Ude.
        </p>
      </CardContent>
    </Card>
  </div>
  );
};

export default BonificacaoTiersInfo;
