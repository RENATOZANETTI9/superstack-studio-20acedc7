import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { PixAuditEntry } from './PixAuditTimeline';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  proposalId: string;
}

const PHASE_LABEL: Record<string, string> = {
  idle: 'Aguardando chave',
  generating: 'Gerando link',
  analyzing: 'Em análise',
  ready: 'Pronto p/ assinatura',
  error: 'Erro',
};

async function fetchAudit(
  proposalId: string,
  pixType: string,
  from: string,
  to: string,
  format: 'json' | 'csv' = 'json',
): Promise<PixAuditEntry[]> {
  // Calls the secure edge function which validates the caller's JWT
  // and scopes the query to their own user_id (defense-in-depth on top of RLS).
  const { data, error } = await supabase.functions.invoke('export-pix-audit', {
    body: {
      proposal_id: proposalId,
      pix_key_type: pixType,
      from: from || undefined,
      to: to || undefined,
      format,
    },
  });
  if (error) {
    const msg = (error as any)?.context?.error || error.message || 'Falha na exportação.';
    throw new Error(typeof msg === 'string' ? msg : 'Erro de permissão ou validação.');
  }
  if (format === 'csv') {
    // Edge function returns raw CSV text via invoke; supabase-js gives us the body
    return data as unknown as PixAuditEntry[]; // not used, see CSV handler below
  }
  return ((data as any)?.rows ?? []) as PixAuditEntry[];
}

function downloadBlob(content: string, mime: string, filename: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function toCSV(rows: PixAuditEntry[]): string {
  const headers = [
    'data',
    'de',
    'para',
    'tipo_chave',
    'chave',
    'autor',
    'link_biometria',
    'erro',
  ];
  const esc = (v: unknown) => {
    const s = v == null ? '' : String(v);
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.join(';')];
  rows.forEach((r) => {
    lines.push(
      [
        new Date(r.created_at).toLocaleString('pt-BR'),
        PHASE_LABEL[r.from_phase ?? ''] ?? r.from_phase ?? '',
        PHASE_LABEL[r.to_phase] ?? r.to_phase,
        r.pix_key_type ?? '',
        r.pix_key_value ?? '',
        r.actor_email ?? '',
        r.biometric_link ?? '',
        r.error_message ?? '',
      ]
        .map(esc)
        .join(';'),
    );
  });
  return lines.join('\n');
}

function openPrintablePDF(proposalId: string, rows: PixAuditEntry[]) {
  const w = window.open('', '_blank');
  if (!w) {
    toast.error('Permita pop-ups para gerar o PDF.');
    return;
  }
  const css = `
    body{font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#111;padding:24px;}
    h1{font-size:18px;margin:0 0 4px;}
    p.sub{font-size:12px;color:#555;margin:0 0 16px;}
    table{width:100%;border-collapse:collapse;font-size:11px;}
    th,td{border:1px solid #ddd;padding:6px 8px;text-align:left;vertical-align:top;}
    th{background:#f5f5f5;text-transform:uppercase;font-size:10px;letter-spacing:.04em;}
    .err{color:#b00020;}
  `;
  const head = `<tr><th>Data</th><th>De</th><th>Para</th><th>Tipo</th><th>Chave</th><th>Autor</th><th>Erro</th></tr>`;
  const body = rows
    .map(
      (r) => `<tr>
        <td>${new Date(r.created_at).toLocaleString('pt-BR')}</td>
        <td>${PHASE_LABEL[r.from_phase ?? ''] ?? r.from_phase ?? '-'}</td>
        <td><strong>${PHASE_LABEL[r.to_phase] ?? r.to_phase}</strong></td>
        <td>${r.pix_key_type ?? '-'}</td>
        <td>${r.pix_key_value ?? '-'}</td>
        <td>${r.actor_email ?? 'sistema'}</td>
        <td class="err">${r.error_message ?? ''}</td>
      </tr>`,
    )
    .join('');
  w.document.write(`<!doctype html><html><head><title>Auditoria Pix ${proposalId}</title><style>${css}</style></head>
    <body>
      <h1>Auditoria da chave Pix</h1>
      <p class="sub">Proposta: ${proposalId} · Gerado em ${new Date().toLocaleString('pt-BR')} · ${rows.length} evento(s)</p>
      <table><thead>${head}</thead><tbody>${body || '<tr><td colspan="7">Sem eventos.</td></tr>'}</tbody></table>
      <script>window.onload=()=>setTimeout(()=>window.print(),250)</script>
    </body></html>`);
  w.document.close();
}

export function PixAuditExportDialog({ open, onOpenChange, proposalId }: Props) {
  const [pixType, setPixType] = useState<string>('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [busy, setBusy] = useState<'csv' | 'pdf' | null>(null);

  const handleExport = async (format: 'csv' | 'pdf') => {
    setBusy(format);
    try {
      if (format === 'csv') {
        // Ask the edge function for the CSV directly so server-side filters/auth apply.
        const res = await supabase.functions.invoke('export-pix-audit', {
          body: {
            proposal_id: proposalId,
            pix_key_type: pixType,
            from: from || undefined,
            to: to || undefined,
            format: 'csv',
          },
          headers: { Accept: 'text/csv' },
        });
        if (res.error) {
          const ctxErr = (res.error as any)?.context?.error;
          throw new Error(typeof ctxErr === 'string' ? ctxErr : res.error.message);
        }
        const csv = typeof res.data === 'string' ? res.data : await (res.data as Blob).text();
        if (!csv.trim() || csv.trim() === '\uFEFF') {
          toast.info('Nenhum evento encontrado para os filtros selecionados.');
          return;
        }
        downloadBlob(csv, 'text/csv;charset=utf-8', `auditoria-pix-${proposalId}.csv`);
        toast.success('CSV exportado com sucesso.');
      } else {
        const rows = await fetchAudit(proposalId, pixType, from, to, 'json');
        if (rows.length === 0) {
          toast.info('Nenhum evento encontrado para os filtros selecionados.');
          return;
        }
        openPrintablePDF(proposalId, rows);
      }
    } catch (e: any) {
      toast.error(e?.message ?? 'Falha ao exportar auditoria.', {
        description: 'Verifique sua sessão. Apenas o autor da proposta pode exportar este log.',
      });
    } finally {
      setBusy(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-border/50 max-w-md">
        <DialogHeader>
          <DialogTitle>Exportar auditoria da chave Pix</DialogTitle>
          <DialogDescription>
            Filtre por tipo de chave e período e baixe em CSV ou PDF.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-2">
          <div>
            <Label className="text-xs">Tipo de chave</Label>
            <Select value={pixType} onValueChange={setPixType}>
              <SelectTrigger className="bg-background/60 mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="cpf">CPF</SelectItem>
                <SelectItem value="telefone">Telefone</SelectItem>
                <SelectItem value="email">E-mail</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">De</Label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="bg-background/60 mt-1" />
            </div>
            <div>
              <Label className="text-xs">Até</Label>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="bg-background/60 mt-1" />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1 gap-2"
              disabled={busy !== null}
              onClick={() => handleExport('csv')}
            >
              {busy === 'csv' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              CSV
            </Button>
            <Button
              className="flex-1 gap-2 bg-primary hover:bg-primary/90"
              disabled={busy !== null}
              onClick={() => handleExport('pdf')}
            >
              {busy === 'pdf' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
              PDF
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}