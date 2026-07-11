import { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip, TooltipTrigger, TooltipContent,
} from '@/components/ui/tooltip';
import {
  MapPin, ChevronLeft, ChevronRight, Sparkles, Search, Phone, Gift,
  Target, Calendar, Users, CheckCircle2, Share2, Building2, Save, ClipboardCheck,
  Upload, Plus, Loader2, Copy, MoreVertical, Pencil, Trash2, Mic, MicOff
} from 'lucide-react';
import { toast } from 'sonner';
import { AI_ROUTE_TITLE_ID, AI_FORMAT_ALERT_ID } from './ai-route-alert-ids';
import { normalizeAiSource, type AiSource } from './ai-route-source';

type VisitStatus =
  | 'Pendente'
  | 'Em andamento'
  | 'Realizada'
  | 'Não visitada'
  | 'Reagendada'
  | 'Sem contato'
  | 'Clínica cadastrada'
  | 'Clínica ativada'
  | 'Treinamento realizado'
  | 'Aguardando retorno'
  | 'Cancelada';

interface PlannedVisit {
  id: string;
  clinic: string;
  address: string;
  goal: string;
  responsible?: string;
  phone?: string;
  status: VisitStatus;
}

interface PortfolioClinic {
  id: string;
  nome: string;
  tipo: 'Clínica' | 'Hospital' | 'Consultório';
  bairro: string;
  cidade: string;
  telefone: string;
  responsavel: string;
  status: 'Lead' | 'Ativo' | 'Inativo';
  ultimaVisita?: string;
}

const INITIAL_PORTFOLIO: PortfolioClinic[] = [];

const INITIAL_DAYS: Record<string, PlannedVisit[]> = {
  seg: [], ter: [], qua: [], qui: [], sex: [],
};

const GIFT_ROUTE_INITIAL: {
  achieved: { id: string; clinic: string; simulations: number; gift: string; receptionist: string; delivered: boolean }[];
  missed: { id: string; clinic: string; simulations: number }[];
} = { achieved: [], missed: [] };

const DAY_META: { key: keyof typeof INITIAL_DAYS; label: string }[] = [
  { key: 'seg', label: 'Seg' },
  { key: 'ter', label: 'Ter' },
  { key: 'qua', label: 'Qua' },
  { key: 'qui', label: 'Qui' },
  { key: 'sex', label: 'Sex' },
];

function getWeekDates(offset: number) {
  const today = new Date();
  const day = today.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(today.getDate() + diffToMonday + offset * 7);

  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);

  const weekNum = Math.ceil(
    ((monday.getTime() - new Date(monday.getFullYear(), 0, 1).getTime()) / 86400000 + 1) / 7,
  );

  const fmt = (d: Date) =>
    d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

  return {
    label: `Semana ${weekNum} — ${fmt(monday)} a ${fmt(friday)}`,
    monday,
  };
}

function getDays(monday: Date) {
  const fmt = (d: Date) =>
    d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  return DAY_META.map((d, idx) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + idx);
    return { ...d, date: fmt(date) };
  });
}

const STATUS_BADGE: Record<VisitStatus, string> = {
  Pendente: 'bg-muted text-muted-foreground',
  'Em andamento': 'bg-blue-100 text-blue-700',
  Realizada: 'bg-green-100 text-green-700',
  'Não visitada': 'bg-gray-100 text-gray-600',
  Reagendada: 'bg-yellow-100 text-yellow-700',
  'Sem contato': 'bg-orange-100 text-orange-700',
  'Clínica cadastrada': 'bg-purple-100 text-purple-700',
  'Clínica ativada': 'bg-indigo-100 text-indigo-700',
  'Treinamento realizado': 'bg-teal-100 text-teal-700',
  'Aguardando retorno': 'bg-amber-100 text-amber-700',
  Cancelada: 'bg-red-100 text-red-700',
};

export default function PartnersRota() {
  const { user } = useAuth();
  const [weekOffset, setWeekOffset] = useState(0);
  const [days, setDays] = useState(INITIAL_DAYS);
  const [activeTab, setActiveTab] = useState<string>('seg');
  const [gifts, setGifts] = useState(GIFT_ROUTE_INITIAL);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Side sheet
  const [openVisit, setOpenVisit] = useState<PlannedVisit | null>(null);
  const [visitResultStatus, setVisitResultStatus] = useState<VisitStatus>('Realizada');
  const [visitResultActions, setVisitResultActions] = useState<string[]>([]);
  const [visitResultNotes, setVisitResultNotes] = useState('');
  const [visitClinicName, setVisitClinicName] = useState('');
  const [visitClinicPhone, setVisitClinicPhone] = useState('');
  const [visitClinicResponsible, setVisitClinicResponsible] = useState('');

  // Cobrar modal
  const [cobrarTarget, setCobrarTarget] = useState<{ id: string; clinic: string } | null>(null);
  const [cobrarNote, setCobrarNote] = useState('');

  // Outer tabs
  const [outerTab, setOuterTab] = useState<string>('rota');

  // Portfolio
  const [portfolio, setPortfolio] = useState<PortfolioClinic[]>(INITIAL_PORTFOLIO);
  const [portfolioLoading, setPortfolioLoading] = useState(true);
  const [portfolioSearch, setPortfolioSearch] = useState('');
  const [portfolioStatusFilter, setPortfolioStatusFilter] = useState<string>('all');
  const [addClinicOpen, setAddClinicOpen] = useState(false);
  const [newClinic, setNewClinic] = useState<Omit<PortfolioClinic, 'id'>>({
    nome: '', tipo: 'Clínica', bairro: '', cidade: '', telefone: '', responsavel: '', status: 'Lead',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI
  const [aiRoute, setAiRoute] = useState<string | null>(null);
  const [aiRouteStatus, setAiRouteStatus] = useState<Record<number, 'conversamos' | 'nao' | 'pendente'>>({});
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSource, setAiSource] = useState<AiSource | null>(null);
  const [aiFormatIssues, setAiFormatIssues] = useState<string[]>([]);
  const [aiFormatValid, setAiFormatValid] = useState<boolean>(true);
  const aiFormatAlertRef = useRef<HTMLDivElement>(null);

  // Move keyboard focus to the format-issues alert when it appears, so
  // usuários de teclado/leitor de tela sejam levados ao aviso e ao botão
  // "Gerar novamente" imediatamente.
  useEffect(() => {
    if (!aiFormatValid && aiFormatIssues.length > 0) {
      aiFormatAlertRef.current?.focus();
    }
  }, [aiFormatValid, aiFormatIssues]);
  const [aiRouteFilter, setAiRouteFilter] = useState<'todos' | 'pendente' | 'conversamos' | 'nao'>('todos');
  const [aiKeepMarks, setAiKeepMarks] = useState(true);
  const [aiPreviewOnly, setAiPreviewOnly] = useState(false);
  const [aiLastMeta, setAiLastMeta] = useState<any | null>(null);
  // Persistence: statuses stored in DB by item_key (trimmed line text).
  const [aiStatusByKey, setAiStatusByKey] = useState<Record<string, 'conversamos' | 'nao' | 'pendente'>>({});
  // Fuzzy fallback: normalized-text -> status (survives small wording changes on regeneration)
  const [aiNormStatusByKey, setAiNormStatusByKey] = useState<Record<string, 'conversamos' | 'nao' | 'pendente'>>({});
  const [aiClinicFilter, setAiClinicFilter] = useState<string>('all');
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());

  // AI form fields
  const [aiBairros, setAiBairros] = useState('');
  const [aiEspecialidade, setAiEspecialidade] = useState('');
  const [aiCidade, setAiCidade] = useState('');
  const [aiTipoLocal, setAiTipoLocal] = useState<string>('todos');
  const [aiFaturamentoMedio, setAiFaturamentoMedio] = useState('');
  const [aiClinicasPorDia, setAiClinicasPorDia] = useState<string>('4');
  const [aiNotas, setAiNotas] = useState('');

  // Voice recording
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const { label: weekLabel, monday } = getWeekDates(weekOffset);
  const DAYS = getDays(monday);

  useEffect(() => {
    const loadPortfolio = async () => {
      setPortfolioLoading(true);
      try {
        if (!user?.id) return;
        const { data: partnerData } = await supabase
          .from('partners').select('id').eq('user_id', user.id).maybeSingle();
        if (!partnerData?.id) return;
        const { data: clinics } = await supabase
          .from('portfolio_clinics')
          .select('*')
          .eq('partner_id', partnerData.id)
          .order('created_at');
        if (clinics && clinics.length > 0) {
          setPortfolio(clinics.map((c: any) => ({
            id: c.id,
            nome: c.nome,
            tipo: c.tipo as PortfolioClinic['tipo'],
            bairro: c.bairro,
            cidade: c.cidade,
            telefone: c.telefone || '',
            responsavel: c.responsavel || '',
            status: c.status as PortfolioClinic['status'],
            ultimaVisita: c.ultima_visita || undefined,
          })));
        }
      } finally {
        setPortfolioLoading(false);
      }
    };
    loadPortfolio();
  }, [user?.id]);

  // Helpers for AI route items
  const isAiItemLine = (line: string) =>
    /^\s*(\d+[\.\)]|[-•*])\s+/.test(line) && line.trim().length > 3;
  const itemKey = (line: string) => line.trim().slice(0, 500);
  // Normalized key: strips bullets/numbers, punctuation, casing and extra spaces
  // so that "1. **Clínica X** — visitar" ≈ "- Clínica X | Visitar"
  const normItemKey = (line: string) =>
    line
      .toLowerCase()
      .replace(/^\s*(\d+[\.\)]|[-•*])\s+/, '')
      .replace(/\*+/g, '')
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 200);

  // Extract a clinic label from an AI-generated line by matching known portfolio names.
  const extractClinicName = (line: string): string | null => {
    const lower = line.toLowerCase();
    let best: string | null = null;
    for (const c of portfolio) {
      if (c.nome && lower.includes(c.nome.toLowerCase())) {
        if (!best || c.nome.length > best.length) best = c.nome;
      }
    }
    return best;
  };

  // Resolve a status for a line: exact key -> normalized key fallback.
  const resolveStatusForLine = (
    line: string,
    exact: Record<string, 'conversamos' | 'nao' | 'pendente'>,
    norm: Record<string, 'conversamos' | 'nao' | 'pendente'>,
  ) => exact[itemKey(line)] ?? norm[normItemKey(line)];

  // Load persisted generation + statuses
  useEffect(() => {
    const load = async () => {
      if (!user?.id) return;
      const [{ data: gen }, { data: statuses }] = await Promise.all([
        supabase.from('ai_route_generations').select('roteiro').eq('user_id', user.id).maybeSingle(),
        supabase.from('ai_route_item_status').select('item_key,status').eq('user_id', user.id),
      ]);
      const map: Record<string, 'conversamos' | 'nao' | 'pendente'> = {};
      const normMap: Record<string, 'conversamos' | 'nao' | 'pendente'> = {};
      (statuses || []).forEach((s: any) => {
        map[s.item_key] = s.status;
        normMap[normItemKey(s.item_key)] = s.status;
      });
      setAiStatusByKey(map);
      setAiNormStatusByKey(normMap);
      if (gen?.roteiro) {
        setAiRoute(gen.roteiro);
        const idxMap: Record<number, 'conversamos' | 'nao' | 'pendente'> = {};
        gen.roteiro.split('\n').forEach((line: string, idx: number) => {
          if (isAiItemLine(line)) {
            const s = resolveStatusForLine(line, map, normMap);
            if (s) idxMap[idx] = s;
          }
        });
        setAiRouteStatus(idxMap);
      }
    };
    load();
  }, [user?.id]);

  // Persist a single item status change
  const updateItemStatus = async (
    lineIdx: number,
    line: string,
    status: 'conversamos' | 'nao' | 'pendente',
  ) => {
    setAiRouteStatus(prev => ({ ...prev, [lineIdx]: status }));
    const key = itemKey(line);
    setAiStatusByKey(prev => ({ ...prev, [key]: status }));
    setAiNormStatusByKey(prev => ({ ...prev, [normItemKey(line)]: status }));
    if (!user?.id) return;
    try {
      await supabase.from('ai_route_item_status').upsert(
        { user_id: user.id, item_key: key, item_text: line.trim(), status },
        { onConflict: 'user_id,item_key' },
      );
    } catch {
      // silent — UI already updated optimistically
    }
  };

  // Bulk mark selected items
  const bulkMarkSelected = async (status: 'conversamos' | 'nao' | 'pendente') => {
    if (!aiRoute || selectedItems.size === 0) return;
    const lines = aiRoute.split('\n');
    const targets: { idx: number; line: string }[] = [];
    selectedItems.forEach(idx => {
      const line = lines[idx];
      if (line != null && isAiItemLine(line)) targets.push({ idx, line });
    });
    if (targets.length === 0) return;
    // Optimistic UI update
    setAiRouteStatus(prev => {
      const next = { ...prev };
      targets.forEach(t => { next[t.idx] = status; });
      return next;
    });
    setAiStatusByKey(prev => {
      const next = { ...prev };
      targets.forEach(t => { next[itemKey(t.line)] = status; });
      return next;
    });
    setAiNormStatusByKey(prev => {
      const next = { ...prev };
      targets.forEach(t => { next[normItemKey(t.line)] = status; });
      return next;
    });
    if (user?.id) {
      try {
        await supabase.from('ai_route_item_status').upsert(
          targets.map(t => ({
            user_id: user.id, item_key: itemKey(t.line), item_text: t.line.trim(), status,
          })),
          { onConflict: 'user_id,item_key' },
        );
      } catch {
        // silent
      }
    }
    setSelectedItems(new Set());
    toast.success(`${targets.length} item(ns) marcados`);
  };

  const handleGenerateAI = async (opts?: { isRetry?: boolean; previewOnly?: boolean }) => {
    const isRetry = !!opts?.isRetry;
    const previewOnly = opts?.previewOnly ?? aiPreviewOnly;
    setAiLoading(true);
    if (!aiKeepMarks && !isRetry) setAiRoute(null);
    const previousSource = aiSource;
    try {
      const { data, error } = await supabase.functions.invoke('generate-ai-route', {
        body: {
          clinicas: portfolio,
          semana: weekLabel,
          cidade: aiCidade || 'Salvador',
          bairros: aiBairros || undefined,
          especialidade: aiEspecialidade || undefined,
          tipoLocal: aiTipoLocal !== 'todos' ? aiTipoLocal : undefined,
          faturamentoMedio: aiFaturamentoMedio || undefined,
          clinicasPorDia: aiClinicasPorDia || undefined,
          notasAdicionais: isRetry
            ? `${aiNotas ? aiNotas + ' | ' : ''}IMPORTANTE: siga estritamente o formato com cabeçalhos "## Dia" e itens numerados "1.".`
            : (aiNotas || undefined),
        },
      });
      if (error) throw error;
      const roteiro: string = data?.roteiro || 'Roteiro não disponível.';
      setAiRoute(roteiro);
      // Normaliza `source` — respostas com campo ausente/inválido caem
      // para o último `source` válido conhecido, e por fim `'suggested'`.
      const nextSource = normalizeAiSource(data?.source, previousSource);
      setAiSource(nextSource);
      const issues: string[] = Array.isArray(data?.meta?.format_issues) ? data.meta.format_issues : [];
      const valid = data?.meta?.format_valid !== false;
      setAiFormatIssues(issues);
      setAiFormatValid(valid);
      setAiLastMeta(data?.meta || null);

      // Rebuild per-line status map. If keeping marks, reuse aiStatusByKey; otherwise clear.
      const baseExact = aiKeepMarks ? aiStatusByKey : {};
      const baseNorm = aiKeepMarks ? aiNormStatusByKey : {};
      const idxMap: Record<number, 'conversamos' | 'nao' | 'pendente'> = {};
      roteiro.split('\n').forEach((line, idx) => {
        if (isAiItemLine(line)) {
          const s = resolveStatusForLine(line, baseExact, baseNorm);
          if (s) idxMap[idx] = s;
        }
      });
      setAiRouteStatus(idxMap);
      setSelectedItems(new Set());
      setAiClinicFilter('all');

      if (user?.id && !previewOnly) {
        // Persist the generation
        supabase.from('ai_route_generations').upsert(
          { user_id: user.id, roteiro, params: {
              bairros: aiBairros, especialidade: aiEspecialidade, tipoLocal: aiTipoLocal,
              faturamentoMedio: aiFaturamentoMedio, clinicasPorDia: aiClinicasPorDia,
            } },
          { onConflict: 'user_id' },
        ).then(() => {});

        // If not keeping marks, wipe status rows
        if (!aiKeepMarks) {
          await supabase.from('ai_route_item_status').delete().eq('user_id', user.id);
          setAiStatusByKey({});
          setAiNormStatusByKey({});
        }
      }
      if (previewOnly) {
        toast.message('Pré-visualização gerada (não salva).');
      }

      // Auto-fallback: se falhou validação e ainda não é retry, tenta novamente
      // reforçando o formato. Mantém `source` consistente com o retorno anterior.
      if (!valid && !isRetry) {
        toast.message('Formato inválido detectado, tentando novamente…');
        setAiLoading(false);
        return handleGenerateAI({ isRetry: true, previewOnly });
      }
    } catch (err: any) {
      const msg = String(err?.message || err || '');
      if (
        msg.includes('OPENAI_API_KEY') ||
        msg.includes('not configured') ||
        msg.includes('secret') ||
        msg.includes('FunctionsFetchError')
      ) {
        toast.error(
          'Roteiro IA não configurado ainda. Peça ao administrador para configurar a chave de IA.',
          { duration: 8000 },
        );
      } else {
        toast.error('Erro ao gerar roteiro. Tente novamente em instantes.');
      }
    } finally {
      setAiLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : '';
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        if (blob.size < 1024) {
          toast.error('Gravação muito curta. Tente novamente.');
          return;
        }
        await transcribeBlob(blob);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (err) {
      console.error(err);
      toast.error('Não foi possível acessar o microfone.');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
    setIsRecording(false);
  };

  const transcribeBlob = async (blob: Blob) => {
    setIsTranscribing(true);
    try {
      const arrayBuffer = await blob.arrayBuffer();
      // base64 encode in chunks to avoid stack overflow
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      const chunkSize = 0x8000;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
      }
      const base64 = btoa(binary);
      const { data, error } = await supabase.functions.invoke('transcribe-audio', {
        body: { audio: base64, mimeType: blob.type },
      });
      if (error) throw error;
      const text = (data?.text || '').trim();
      if (!text) {
        toast.error('Não foi possível transcrever o áudio.');
        return;
      }
      setAiNotas((prev) => (prev ? `${prev}\n${text}` : text));
      toast.success('Áudio transcrito!');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao transcrever o áudio.');
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const { data: partnerData } = await supabase
      .from('partners').select('id').eq('user_id', user?.id).maybeSingle();
    if (!partnerData?.id) {
      toast.error('Parceiro não encontrado. Não é possível importar.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet);
        const toInsert = rows
          .map((r) => ({
            partner_id: partnerData.id,
            nome: String(r.Nome ?? r.nome ?? ''),
            tipo: String(r.Tipo ?? r.tipo ?? 'Clínica'),
            bairro: String(r.Bairro ?? r.bairro ?? ''),
            cidade: String(r.Cidade ?? r.cidade ?? ''),
            telefone: String(r.Telefone ?? r.telefone ?? '') || null,
            responsavel: String(r.Responsavel ?? r.responsavel ?? r.Responsável ?? '') || null,
          }))
          .filter((c) => c.nome && c.bairro && c.cidade);

        if (toInsert.length === 0) {
          toast.error('Nenhuma clínica válida encontrada no arquivo (requer Nome, Bairro, Cidade).');
          return;
        }

        const { data: inserted, error } = await supabase
          .from('portfolio_clinics')
          .insert(toInsert)
          .select();

        if (error) throw error;

        const mapped: PortfolioClinic[] = (inserted || []).map((c: any) => ({
          id: c.id,
          nome: c.nome,
          tipo: c.tipo as PortfolioClinic['tipo'],
          bairro: c.bairro,
          cidade: c.cidade,
          telefone: c.telefone || '',
          responsavel: c.responsavel || '',
          status: c.status as PortfolioClinic['status'],
          ultimaVisita: c.ultima_visita || undefined,
        }));

        setPortfolio((prev) => [...prev, ...mapped]);
        toast.success(`${mapped.length} clínica(s) importada(s) e salvas no portfólio`);
      } catch (err) {
        console.error(err);
        toast.error('Erro ao ler ou salvar arquivo Excel');
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleAddClinic = async () => {
    if (!newClinic.nome || !newClinic.bairro || !newClinic.cidade) {
      toast.error('Preencha nome, bairro e cidade');
      return;
    }
    const { data: partnerData } = await supabase
      .from('partners').select('id').eq('user_id', user?.id).maybeSingle();
    if (!partnerData?.id) { toast.error('Parceiro não encontrado.'); return; }
    const { data: inserted, error } = await supabase
      .from('portfolio_clinics')
      .insert({
        partner_id: partnerData.id,
        nome: newClinic.nome,
        tipo: newClinic.tipo,
        bairro: newClinic.bairro,
        cidade: newClinic.cidade,
        telefone: newClinic.telefone || null,
        responsavel: newClinic.responsavel || null,
      })
      .select().single();
    if (error || !inserted) { toast.error('Erro ao salvar clínica.'); return; }
    setPortfolio(prev => [...prev, { ...newClinic, id: inserted.id }]);
    toast.success('Clínica adicionada ao portfólio');
    setAddClinicOpen(false);
    setNewClinic({ nome: '', tipo: 'Clínica', bairro: '', cidade: '', telefone: '', responsavel: '', status: 'Lead' });
  };

  const handleRemoveClinic = async (id: string) => {
    const { error } = await supabase.from('portfolio_clinics').delete().eq('id', id);
    if (error) { toast.error('Erro ao remover clínica.'); return; }
    setPortfolio(prev => prev.filter(c => c.id !== id));
    toast.success('Clínica removida');
  };

  const handleCopyAiRoute = async () => {
    if (!aiRoute) return;
    await navigator.clipboard.writeText(aiRoute);
    toast.success('Roteiro copiado!');
  };

  const filteredPortfolio = portfolio.filter(c => {
    const matchesSearch =
      c.nome.toLowerCase().includes(portfolioSearch.toLowerCase()) ||
      c.bairro.toLowerCase().includes(portfolioSearch.toLowerCase());
    const matchesStatus = portfolioStatusFilter === 'all' || c.status === portfolioStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const portfolioStatusBadge = (status: PortfolioClinic['status']) =>
    status === 'Ativo' ? 'bg-green-100 text-green-700'
    : status === 'Lead' ? 'bg-gray-100 text-gray-700'
    : 'bg-red-100 text-red-700';

  const handleShare = () => {
    toast.success('Roteiro copiado! Cole no WhatsApp para compartilhar.');
  };

  const handleDelivered = (id: string) => {
    setGifts(prev => ({
      ...prev,
      achieved: prev.achieved.map(g => g.id === id ? { ...g, delivered: true } : g),
    }));
    toast.success('Brinde marcado como entregue ✓');
  };

  const handleSaveCobranca = () => {
    toast.success(`Cobrança registrada para ${cobrarTarget?.clinic}`, { description: cobrarNote || 'Sem observações.' });
    setCobrarTarget(null);
    setCobrarNote('');
  };

  const handleSaveVisitResult = () => {
    if (!openVisit) return;
    setDays(prev => {
      const dayKey = (Object.keys(prev) as Array<keyof typeof prev>).find(k => prev[k].some(v => v.id === openVisit.id));
      if (!dayKey) return prev;
      return {
        ...prev,
        [dayKey]: prev[dayKey].map(v => v.id === openVisit.id ? { ...v, status: visitResultStatus } : v),
      };
    });
    toast.success('Resultado da visita registrado');
    setOpenVisit(null);
    setVisitResultStatus('Realizada');
    setVisitResultActions([]);
    setVisitResultNotes('');
    setVisitClinicName('');
    setVisitClinicPhone('');
    setVisitClinicResponsible('');
  };

  const filteredDayVisits = (key: keyof typeof INITIAL_DAYS) => {
    return days[key].filter(v => {
      const matchesSearch = v.clinic.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || v.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  };

  // Goals
  const allVisits = Object.values(days).flat();
  const goals = [
    {
      label: 'Cadastros Novos',
      current: allVisits.filter(v => v.status === 'Clínica cadastrada' || v.status === 'Clínica ativada').length,
      total: 3,
      color: 'bg-primary',
    },
    {
      label: 'Ativações',
      current: allVisits.filter(v => v.status === 'Clínica ativada').length,
      total: 3,
      color: 'bg-blue-500',
    },
    {
      label: 'Visitas Realizadas',
      current: allVisits.filter(v =>
        v.status !== 'Pendente' && v.status !== 'Em andamento' && v.status !== 'Cancelada'
      ).length,
      total: 8,
      color: 'bg-green-500',
    },
    { label: 'Clínicas Acima da Meta', current: 60, total: 100, color: 'bg-purple-500', suffix: '%' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
              <MapPin className="w-7 h-7 text-primary" /> Minha Rota Semanal
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Planeje suas visitas e gerencie entregas de brindes</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 rounded-lg border bg-card p-1">
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setWeekOffset(o => o - 1)} aria-label="Semana anterior">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium px-2 min-w-[220px] text-center">{weekLabel}</span>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setWeekOffset(o => o + 1)} aria-label="Próxima semana">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Button
              onClick={() => { setOuterTab('ia'); void handleGenerateAI(); }}
              className="gap-2 bg-gradient-to-r from-primary to-secondary text-white shadow-md hover:shadow-lg"
              disabled={aiLoading}
            >
              <Sparkles className="w-4 h-4" />
              {aiLoading ? 'Gerando...' : 'Gerar Roteiro com IA'}
            </Button>
          </div>
        </div>

        <Tabs value={outerTab} onValueChange={setOuterTab} className="w-full">
          <TabsList className="grid grid-cols-3 w-full sm:w-auto">
            <TabsTrigger value="rota">📅 Rota Semanal</TabsTrigger>
            <TabsTrigger value="portfolio">🏥 Portfólio de Clínicas</TabsTrigger>
            <TabsTrigger value="ia">🤖 Roteiro com IA</TabsTrigger>
          </TabsList>

          <TabsContent value="rota" className="mt-6 space-y-6">
        {/* Metas */}
        <div>
          <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" /> Meta da Semana
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {goals.map(g => {
              const pct = Math.min(100, (g.current / g.total) * 100);
              return (
                <Card key={g.label} className="shadow-sm">
                  <CardContent className="pt-5">
                    <p className="text-xs text-muted-foreground">{g.label}</p>
                    <p className="text-2xl font-bold">
                      {g.current}{g.suffix || ''}
                      <span className="text-sm text-muted-foreground font-normal">
                        {g.suffix ? '' : ` / ${g.total}`}
                      </span>
                    </p>
                    <div className="h-1.5 bg-muted rounded-full mt-2 overflow-hidden">
                      <div className={`h-full ${g.color} transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Roteiro por dia */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" /> Roteiro por Dia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-5 w-full sm:w-auto">
                {DAYS.map(d => (
                  <TabsTrigger key={d.key} value={d.key} className="flex flex-col py-2 h-auto">
                    <span className="text-xs font-semibold">{d.label}</span>
                    <span className="text-[10px] text-muted-foreground">{d.date}</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* Filtros */}
              <div className="flex flex-col sm:flex-row gap-2 mt-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar clínica..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-48 h-9">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    <SelectItem value="Pendente">Pendente</SelectItem>
                    <SelectItem value="Em andamento">Em andamento</SelectItem>
                    <SelectItem value="Realizada">Realizada</SelectItem>
                    <SelectItem value="Clínica cadastrada">Clínica cadastrada</SelectItem>
                    <SelectItem value="Clínica ativada">Clínica ativada</SelectItem>
                    <SelectItem value="Treinamento realizado">Treinamento realizado</SelectItem>
                    <SelectItem value="Aguardando retorno">Aguardando retorno</SelectItem>
                    <SelectItem value="Cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {DAYS.filter(d => d.key !== 'sex').map(d => (
                <TabsContent key={d.key} value={d.key} className="mt-4 space-y-2">
                  {filteredDayVisits(d.key).length === 0 ? (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                      Nenhuma visita planejada para {d.label.toLowerCase()}.
                    </div>
                  ) : filteredDayVisits(d.key).map(v => (
                    <button
                      key={v.id}
                      onClick={() => { setOpenVisit(v); }}
                      className="w-full text-left flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors shadow-sm"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Building2 className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{v.clinic}</p>
                          <p className="text-xs text-muted-foreground truncate">{v.address}</p>
                          <p className="text-xs text-muted-foreground mt-0.5"><span className="font-medium">Objetivo:</span> {v.goal}</p>
                        </div>
                      </div>
                      <Badge className={`${STATUS_BADGE[v.status]} border-0 shrink-0`}>{v.status}</Badge>
                    </button>
                  ))}
                </TabsContent>
              ))}

              {/* Sexta — Roteiro de brindes */}
              <TabsContent value="sex" className="mt-4 space-y-4">
                <div className="rounded-lg border-2 border-primary/30 bg-gradient-to-r from-primary/10 via-secondary/5 to-transparent p-4">
                  <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Gift className="w-4 h-4 text-primary" /> 🎁 Roteiro de Entrega de Brindes
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Gerado automaticamente com base na meta semanal</p>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">Bateram a meta</p>
                  {gifts.achieved.map(g => (
                    <div key={g.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg border bg-green-50/40 shadow-sm">
                      <div className="min-w-0">
                        <p className="font-medium text-sm">{g.clinic}</p>
                        <p className="text-xs text-muted-foreground">
                          {g.simulations} simulações · {g.gift} · Recepcionista: {g.receptionist}
                        </p>
                      </div>
                      {g.delivered ? (
                        <Badge className="bg-green-600 text-white gap-1 border-0">
                          <CheckCircle2 className="w-3 h-3" /> Entregue ✓
                        </Badge>
                      ) : (
                        <Button size="sm" onClick={() => handleDelivered(g.id)} className="gap-1 bg-green-600 hover:bg-green-700 text-white">
                          <CheckCircle2 className="w-4 h-4" /> Brinde Entregue
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-red-700 uppercase tracking-wide">Não bateram a meta</p>
                  {gifts.missed.map(m => (
                    <div key={m.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg border border-red-200 bg-red-50/40 shadow-sm">
                      <div className="min-w-0">
                        <p className="font-medium text-sm">{m.clinic}</p>
                        <p className="text-xs text-muted-foreground">{m.simulations} simulações · Abaixo da meta</p>
                      </div>
                      <Button size="sm" variant="outline" className="gap-1 border-red-300 text-red-700 hover:bg-red-50" onClick={() => { setCobrarTarget(m); setCobrarNote(''); }}>
                        <Phone className="w-4 h-4" /> Cobrar Recepção
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end pt-2">
                  <Button variant="outline" className="gap-2" onClick={handleShare}>
                    <Share2 className="w-4 h-4" /> Compartilhar Roteiro
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Fechamento do Dia */}
        {activeTab !== 'sex' && (() => {
          const todayKey = activeTab as keyof typeof INITIAL_DAYS;
          const todayVisits = days[todayKey] || [];
          if (todayVisits.length === 0) return null;
          const planejadas = todayVisits.length;
          const realizadas = todayVisits.filter(v =>
            v.status !== 'Pendente' && v.status !== 'Em andamento' && v.status !== 'Cancelada'
          ).length;
          const cadastradas = todayVisits.filter(v =>
            v.status === 'Clínica cadastrada' || v.status === 'Clínica ativada'
          ).length;
          const ativadas = todayVisits.filter(v => v.status === 'Clínica ativada').length;
          const aguardando = todayVisits.filter(v =>
            v.status === 'Aguardando retorno' || v.status === 'Reagendada'
          ).length;
          return (
            <Card className="shadow-sm border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4 text-primary" /> Fechamento do Dia —{' '}
                  {DAYS.find(d => d.key === activeTab)?.label} {DAYS.find(d => d.key === activeTab)?.date}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                  <div className="text-center p-2 rounded-lg bg-muted/40">
                    <p className="text-xl font-bold">{planejadas}</p>
                    <p className="text-[10px] text-muted-foreground">Planejadas</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-green-50">
                    <p className="text-xl font-bold text-green-700">{realizadas}</p>
                    <p className="text-[10px] text-muted-foreground">Realizadas</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-purple-50">
                    <p className="text-xl font-bold text-purple-700">{cadastradas}</p>
                    <p className="text-[10px] text-muted-foreground">Cadastros</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-indigo-50">
                    <p className="text-xl font-bold text-indigo-700">{ativadas}</p>
                    <p className="text-[10px] text-muted-foreground">Ativações</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-amber-50">
                    <p className="text-xl font-bold text-amber-700">{aguardando}</p>
                    <p className="text-[10px] text-muted-foreground">Retorno</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })()}
          </TabsContent>

          <TabsContent value="portfolio" className="mt-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <Badge variant="secondary" className="text-sm">
                {portfolio.length} clínica{portfolio.length === 1 ? '' : 's'} cadastrada{portfolio.length === 1 ? '' : 's'}
              </Badge>
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={handleExcelImport}
                />
                <Button variant="outline" className="gap-2" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="w-4 h-4" /> Importar Excel
                </Button>
                <Button className="gap-2 bg-gradient-to-r from-primary to-secondary text-white" onClick={() => setAddClinicOpen(true)}>
                  <Plus className="w-4 h-4" /> Adicionar Clínica
                </Button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou bairro..."
                  value={portfolioSearch}
                  onChange={e => setPortfolioSearch(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
              <Select value={portfolioStatusFilter} onValueChange={setPortfolioStatusFilter}>
                <SelectTrigger className="w-full sm:w-48 h-9">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="Lead">Lead</SelectItem>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {portfolioLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredPortfolio.length === 0 ? (
              <div className="text-center py-12 text-sm text-muted-foreground">
                <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">Nenhuma clínica no portfólio</p>
                <p className="text-xs mt-1 opacity-60">Adicione clínicas manualmente ou importe via Excel.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredPortfolio.map(c => (
                  <Card key={c.id} className="shadow-sm">
                    <CardContent className="pt-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-sm truncate">{c.nome}</p>
                          <Badge variant="outline" className="mt-1 text-[10px]">{c.tipo}</Badge>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-7 w-7">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => toast.info('Edição em breve')}>
                              <Pencil className="w-4 h-4 mr-2" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRemoveClinic(c.id)} className="text-red-600">
                              <Trash2 className="w-4 h-4 mr-2" /> Remover
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <MapPin className="w-3 h-3" /> {c.bairro}, {c.cidade}
                      </p>
                      {c.telefone && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Phone className="w-3 h-3" /> {c.telefone}
                        </p>
                      )}
                      {c.responsavel && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Users className="w-3 h-3" /> {c.responsavel}
                        </p>
                      )}
                      <div className="flex items-center justify-between pt-1">
                        <Badge className={`${portfolioStatusBadge(c.status)} border-0`}>{c.status}</Badge>
                        {c.ultimaVisita && (
                          <span className="text-[10px] text-muted-foreground">Última visita: {c.ultimaVisita}</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="ia" className="mt-6 space-y-4">
            <div className="rounded-lg border-2 border-primary/20 bg-gradient-to-r from-primary/10 via-secondary/5 to-transparent p-4">
              <p className="text-sm text-foreground">
                Preencha as orientações abaixo para que a IA gere um roteiro semanal personalizado. Todos os campos são opcionais — quanto mais informações, mais preciso o roteiro.
              </p>
            </div>

            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" /> Orientações para a IA
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Cidade</label>
                    <Input
                      placeholder="Ex: Salvador, Belo Horizonte, São Paulo..."
                      value={aiCidade}
                      onChange={e => setAiCidade(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ai-bairros">Bairros de foco</Label>
                    <Input
                      id="ai-bairros"
                      placeholder="Ex.: Savassi, Lourdes, Centro"
                      value={aiBairros}
                      onChange={(e) => setAiBairros(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ai-especialidade">Especialidade prioritária</Label>
                    <Input
                      id="ai-especialidade"
                      placeholder="Ex.: Odontologia, Estética, Ortopedia"
                      value={aiEspecialidade}
                      onChange={(e) => setAiEspecialidade(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ai-tipo">Tipo de estabelecimento</Label>
                    <Select value={aiTipoLocal} onValueChange={setAiTipoLocal}>
                      <SelectTrigger id="ai-tipo">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="Clínica">Clínicas</SelectItem>
                        <SelectItem value="Hospital">Hospitais</SelectItem>
                        <SelectItem value="Consultório">Consultórios</SelectItem>
                        <SelectItem value="Clínicas e Hospitais">Clínicas e Hospitais</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ai-faturamento">Faturamento médio da clínica</Label>
                    <Input
                      id="ai-faturamento"
                      placeholder="Ex.: R$ 50 mil/mês, acima de R$ 100 mil"
                      value={aiFaturamentoMedio}
                      onChange={(e) => setAiFaturamentoMedio(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ai-clinicas-dia">Clínicas por dia (meta)</Label>
                    <Input
                      id="ai-clinicas-dia"
                      type="number"
                      min={1}
                      max={15}
                      placeholder="Ex.: 4"
                      value={aiClinicasPorDia}
                      onChange={(e) => setAiClinicasPorDia(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="ai-notas">Observações adicionais</Label>
                    <Button
                      type="button"
                      size="sm"
                      variant={isRecording ? 'destructive' : 'outline'}
                      className="gap-2 h-8"
                      onClick={isRecording ? stopRecording : startRecording}
                      disabled={isTranscribing}
                    >
                      {isTranscribing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Transcrevendo...
                        </>
                      ) : isRecording ? (
                        <>
                          <MicOff className="w-4 h-4" /> Parar gravação
                        </>
                      ) : (
                        <>
                          <Mic className="w-4 h-4" /> Falar
                        </>
                      )}
                    </Button>
                  </div>
                  <Textarea
                    id="ai-notas"
                    placeholder="Digite ou fale para transcrever automaticamente. Ex.: priorizar clínicas novas, evitar região Barreiro na quinta, focar em ativações."
                    value={aiNotas}
                    onChange={(e) => setAiNotas(e.target.value)}
                    rows={4}
                  />
                  {isRecording && (
                    <p className="text-xs text-destructive flex items-center gap-1.5">
                      <span className="inline-block w-2 h-2 rounded-full bg-destructive animate-pulse" />
                      Gravando... clique em "Parar gravação" para transcrever.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col items-center gap-2 py-6">
              <Button
                size="lg"
                onClick={() => void handleGenerateAI()}
                disabled={aiLoading || isRecording || isTranscribing}
                className="gap-2 bg-gradient-to-r from-primary to-secondary text-white shadow-lg hover:shadow-xl"
              >
                {aiLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                {aiLoading ? 'Gerando...' : '✨ Gerar Roteiro com Inteligência Artificial'}
              </Button>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="ai-keep-marks"
                  checked={aiKeepMarks}
                  onCheckedChange={(c) => setAiKeepMarks(!!c)}
                />
                <Label htmlFor="ai-keep-marks" className="text-xs font-normal cursor-pointer text-muted-foreground">
                  Manter marcações de "Conversamos / Não conversamos" ao regenerar
                </Label>
              </div>
            </div>

            {aiRoute && (() => {
              const allLines = aiRoute.split('\n');
              const itemEntries = allLines
                .map((line, idx) => ({ line, idx, clinic: extractClinicName(line) }))
                .filter(e => isAiItemLine(e.line));
              const clinicOptions = Array.from(
                new Set(itemEntries.map(e => e.clinic).filter((c): c is string => !!c)),
              ).sort((a, b) => a.localeCompare(b, 'pt-BR'));
              const inClinic = (clinic: string | null) =>
                aiClinicFilter === 'all' || clinic === aiClinicFilter;
              const scoped = itemEntries.filter(e => inClinic(e.clinic));
              const statusOf = (idx: number) => aiRouteStatus[idx] || 'pendente';
              const scopedMetrics = {
                total: scoped.length,
                pendente: scoped.filter(e => statusOf(e.idx) === 'pendente').length,
                conversamos: scoped.filter(e => statusOf(e.idx) === 'conversamos').length,
                nao: scoped.filter(e => statusOf(e.idx) === 'nao').length,
              };
              const visibleIdxs = new Set(
                scoped
                  .filter(e => aiRouteFilter === 'todos' || statusOf(e.idx) === aiRouteFilter)
                  .map(e => e.idx),
              );
              const allVisibleSelected =
                visibleIdxs.size > 0 &&
                Array.from(visibleIdxs).every(i => selectedItems.has(i));
              const toggleAllVisible = () => {
                setSelectedItems(prev => {
                  const next = new Set(prev);
                  if (allVisibleSelected) {
                    visibleIdxs.forEach(i => next.delete(i));
                  } else {
                    visibleIdxs.forEach(i => next.add(i));
                  }
                  return next;
                });
              };
              return (
                <>
                  {/* Metrics panel */}
                  <Card className="shadow-sm">
                    <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 space-y-0 pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Target className="w-4 h-4 text-primary" /> Meu andamento
                        {aiClinicFilter !== 'all' && (
                          <Badge variant="outline" className="ml-1 text-[10px]">
                            {aiClinicFilter}
                          </Badge>
                        )}
                      </CardTitle>
                      <Select value={aiClinicFilter} onValueChange={setAiClinicFilter}>
                        <SelectTrigger className="h-8 w-full sm:w-[240px] text-xs">
                          <SelectValue placeholder="Filtrar por clínica" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas as clínicas / hospitais</SelectItem>
                          {clinicOptions.map(c => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="rounded-lg border bg-muted/30 p-3">
                        <p className="text-xs text-muted-foreground">Total de itens</p>
                        <p className="text-2xl font-semibold">{scopedMetrics.total}</p>
                      </div>
                      <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3">
                        <p className="text-xs text-amber-700">Pendentes</p>
                        <p className="text-2xl font-semibold text-amber-700">{scopedMetrics.pendente}</p>
                      </div>
                      <div className="rounded-lg border border-green-200 bg-green-50/50 p-3">
                        <p className="text-xs text-green-700">Conversamos</p>
                        <p className="text-2xl font-semibold text-green-700">{scopedMetrics.conversamos}</p>
                      </div>
                      <div className="rounded-lg border border-red-200 bg-red-50/50 p-3">
                        <p className="text-xs text-red-700">Não conversamos</p>
                        <p className="text-2xl font-semibold text-red-700">{scopedMetrics.nao}</p>
                      </div>
                      <div className="col-span-2 md:col-span-4 flex items-center justify-between rounded-lg bg-primary/5 border border-primary/20 px-3 py-2">
                        <span className="text-xs text-muted-foreground">Taxa de conversão (Conversamos / Total)</span>
                        <span className="text-lg font-semibold text-primary">
                          {scopedMetrics.total > 0
                            ? `${Math.round((scopedMetrics.conversamos / scopedMetrics.total) * 100)}%`
                            : '—'}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

              <Card className="shadow-sm">
                 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                   <CardTitle
                     id={AI_ROUTE_TITLE_ID}
                     className="text-base flex items-center gap-2"
                     aria-describedby={
                       !aiFormatValid && aiFormatIssues.length > 0 ? AI_FORMAT_ALERT_ID : undefined
                     }
                   >
                    <Sparkles className="w-4 h-4 text-primary" /> Roteiro Gerado pela IA
                    {aiSource && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge
                            tabIndex={0}
                            data-testid="ai-source-badge"
                            data-source={aiSource}
                            variant="outline"
                            className={
                              aiSource === 'tavily'
                                ? 'ml-1 border-green-300 bg-green-50 text-green-700 cursor-help focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                                : aiSource === 'tavily_cache'
                                  ? 'ml-1 border-blue-300 bg-blue-50 text-blue-700 cursor-help focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                                  : 'ml-1 border-amber-300 bg-amber-50 text-amber-700 cursor-help focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                            }
                            aria-label={`Origem do roteiro: ${aiSource}`}
                          >
                            {aiSource === 'tavily' && '🌐 Tavily'}
                            {aiSource === 'tavily_cache' && '💾 Cache'}
                            {aiSource === 'suggested' && '✨ Sugestões IA'}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs text-xs leading-relaxed">
                          {aiSource === 'tavily' && (
                            <>
                              <p className="font-semibold">Tavily (busca ao vivo)</p>
                              <p>Clínicas obtidas em tempo real da internet via API Tavily. Usado quando há bairros informados e a busca retorna resultados novos.</p>
                            </>
                          )}
                          {aiSource === 'tavily_cache' && (
                            <>
                              <p className="font-semibold">Cache Tavily</p>
                              <p>Resultados reaproveitados de uma busca anterior (TTL de 7 dias) para a mesma cidade, bairro, especialidade e tipo. Reduz custo e latência.</p>
                            </>
                          )}
                          {aiSource === 'suggested' && (
                            <>
                              <p className="font-semibold">Sugestões da IA</p>
                              <p>Nenhum dado externo disponível — a IA gerou nomes plausíveis para prospecção. Usado quando não há bairros, Tavily não está configurado ou a busca falhou.</p>
                            </>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Select value={aiRouteFilter} onValueChange={(v) => setAiRouteFilter(v as typeof aiRouteFilter)}>
                      <SelectTrigger className="h-8 w-[170px] text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Mostrar todos</SelectItem>
                        <SelectItem value="pendente">⏳ Só pendentes</SelectItem>
                        <SelectItem value="conversamos">✅ Só conversamos</SelectItem>
                        <SelectItem value="nao">❌ Só não conversamos</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button size="sm" variant="outline" className="gap-2" onClick={handleCopyAiRoute}>
                      <Copy className="w-4 h-4" /> Copiar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {!aiFormatValid && aiFormatIssues.length > 0 && (
                    <div
                      ref={aiFormatAlertRef}
                      id={AI_FORMAT_ALERT_ID}
                      role="alert"
                      aria-live="polite"
                      aria-atomic="true"
                      aria-labelledby={AI_ROUTE_TITLE_ID}
                      tabIndex={-1}
                      data-testid="ai-format-alert"
                      className="mb-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="font-semibold mb-1">
                            ⚠️ O roteiro pode não renderizar corretamente:
                          </div>
                          <ul className="list-disc pl-4 space-y-0.5">
                            {aiFormatIssues.map((i, k) => (
                              <li key={k}>{i}</li>
                            ))}
                          </ul>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          data-testid="ai-regenerate-btn"
                          disabled={aiLoading}
                          onClick={() => void handleGenerateAI()}
                          className="shrink-0 h-7 gap-1 border-amber-400 text-amber-800 hover:bg-amber-100"
                        >
                          {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                          Gerar novamente
                        </Button>
                      </div>
                    </div>
                  )}
                  {/* Bulk actions bar */}
                  <div className="flex flex-wrap items-center gap-2 mb-3 rounded-md border bg-muted/20 px-2.5 py-2 text-xs">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="ai-select-all-visible"
                        checked={allVisibleSelected}
                        onCheckedChange={() => toggleAllVisible()}
                        disabled={visibleIdxs.size === 0}
                      />
                      <Label htmlFor="ai-select-all-visible" className="cursor-pointer text-xs">
                        Selecionar visíveis ({visibleIdxs.size})
                      </Label>
                    </div>
                    <span className="text-muted-foreground">
                      {selectedItems.size} selecionado(s)
                    </span>
                    <div className="ml-auto flex flex-wrap items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 gap-1 border-green-300 text-green-700 hover:bg-green-50"
                        disabled={selectedItems.size === 0}
                        onClick={() => bulkMarkSelected('conversamos')}
                      >
                        ✅ Marcar Conversamos
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 gap-1 border-red-300 text-red-700 hover:bg-red-50"
                        disabled={selectedItems.size === 0}
                        onClick={() => bulkMarkSelected('nao')}
                      >
                        ❌ Marcar Não conversamos
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs"
                        disabled={selectedItems.size === 0}
                        onClick={() => bulkMarkSelected('pendente')}
                      >
                        Resetar
                      </Button>
                      {selectedItems.size > 0 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs"
                          onClick={() => setSelectedItems(new Set())}
                        >
                          Limpar seleção
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1.5 text-sm">
                    {allLines.map((line, idx) => {
                      const isItem = isAiItemLine(line);
                      if (!isItem) {
                        // Hide non-item lines when a filter is active to keep the review focused.
                        if (aiRouteFilter !== 'todos' || aiClinicFilter !== 'all') return null;
                        return (
                          <div key={idx} className="whitespace-pre-wrap font-sans">
                            {line || '\u00A0'}
                          </div>
                        );
                      }
                      const current = aiRouteStatus[idx] || 'pendente';
                      if (aiRouteFilter !== 'todos' && current !== aiRouteFilter) return null;
                      const clinic = extractClinicName(line);
                      if (!inClinic(clinic)) return null;
                      const selected = selectedItems.has(idx);
                      return (
                        <div
                          key={idx}
                          className={`flex items-start gap-2 rounded-md border px-2.5 py-1.5 ${
                            selected ? 'border-primary/60 bg-primary/5' : 'border-border/60 bg-muted/20'
                          }`}
                        >
                          <Checkbox
                            checked={selected}
                            onCheckedChange={(c) => {
                              setSelectedItems(prev => {
                                const next = new Set(prev);
                                if (c) next.add(idx); else next.delete(idx);
                                return next;
                              });
                            }}
                            className="mt-0.5"
                            aria-label="Selecionar item"
                          />
                          <div className="flex-1 whitespace-pre-wrap font-sans">{line}</div>
                          <Select
                            value={current}
                            onValueChange={(v) =>
                              updateItemStatus(idx, line, v as 'conversamos' | 'nao' | 'pendente')
                            }
                          >
                            <SelectTrigger
                              className={`h-7 w-[150px] text-xs ${
                                current === 'conversamos'
                                  ? 'border-green-400 text-green-700'
                                  : current === 'nao'
                                  ? 'border-red-300 text-red-700'
                                  : ''
                              }`}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pendente">⏳ Pendente</SelectItem>
                              <SelectItem value="conversamos">✅ Conversamos</SelectItem>
                              <SelectItem value="nao">❌ Não conversamos</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
                </>
              );
            })()}

            {!aiRoute && !aiLoading && (
              <div className="text-center text-muted-foreground py-12">
                <Sparkles className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">Nenhum roteiro gerado ainda</p>
                <p className="text-xs mt-1 opacity-60">
                  Clique em "Gerar Roteiro com IA" para criar seu roteiro da semana.
                </p>
                <p className="text-xs mt-1 opacity-40">Requer OPENAI_API_KEY configurado no Supabase.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Visit side sheet */}
        <Sheet open={!!openVisit} onOpenChange={(o) => {
          if (!o) {
            setOpenVisit(null);
            setVisitResultStatus('Realizada');
            setVisitResultActions([]);
            setVisitResultNotes('');
            setVisitClinicName('');
            setVisitClinicPhone('');
            setVisitClinicResponsible('');
          }
        }}>
          <SheetContent className="w-full sm:max-w-md overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2"><Building2 className="w-5 h-5 text-primary" /> {openVisit?.clinic}</SheetTitle>
              <SheetDescription>Detalhes da visita planejada</SheetDescription>
            </SheetHeader>
            {openVisit && (
              <div className="space-y-4 mt-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Endereço</p>
                  <p className="text-sm">{openVisit.address}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Responsável</p>
                  <p className="text-sm">{openVisit.responsible || '—'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Telefone</p>
                  <p className="text-sm flex items-center gap-2"><Phone className="w-3 h-3 text-muted-foreground" /> {openVisit.phone || '—'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Objetivo da Visita</p>
                  <p className="text-sm">{openVisit.goal}</p>
                </div>
                <div className="space-y-4 border-t pt-4 mt-2">
                  {/* Status da visita */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Resultado da visita</label>
                    <Select value={visitResultStatus} onValueChange={(v) => setVisitResultStatus(v as VisitStatus)}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Realizada">✅ Realizada</SelectItem>
                        <SelectItem value="Clínica cadastrada">🏥 Clínica cadastrada</SelectItem>
                        <SelectItem value="Clínica ativada">⚡ Clínica ativada</SelectItem>
                        <SelectItem value="Treinamento realizado">📚 Treinamento realizado</SelectItem>
                        <SelectItem value="Aguardando retorno">🕐 Aguardando retorno</SelectItem>
                        <SelectItem value="Reagendada">📅 Reagendada</SelectItem>
                        <SelectItem value="Sem contato">📵 Sem contato</SelectItem>
                        <SelectItem value="Não visitada">❌ Não visitada</SelectItem>
                        <SelectItem value="Cancelada">🚫 Cancelada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Mini-form cadastro de clínica */}
                  {visitResultStatus === 'Clínica cadastrada' && (
                    <div className="rounded-lg border border-purple-200 bg-purple-50/40 p-3 space-y-2">
                      <p className="text-xs font-semibold text-purple-700 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5" /> Dados da nova clínica
                      </p>
                      <Input
                        placeholder="Nome da clínica"
                        value={visitClinicName}
                        onChange={e => setVisitClinicName(e.target.value)}
                        className="h-9 text-sm"
                      />
                      <Input
                        placeholder="Responsável"
                        value={visitClinicResponsible}
                        onChange={e => setVisitClinicResponsible(e.target.value)}
                        className="h-9 text-sm"
                      />
                      <Input
                        placeholder="Telefone"
                        value={visitClinicPhone}
                        onChange={e => setVisitClinicPhone(e.target.value)}
                        className="h-9 text-sm"
                      />
                    </div>
                  )}

                  {/* Ações secundárias */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Ações realizadas (opcional)</label>
                    <div className="space-y-2">
                      {[
                        { id: 'usuarios', label: 'Usuários da recepção criados' },
                        { id: 'simulacao', label: 'Primeira simulação realizada' },
                        { id: 'retorno', label: 'Requer nova visita' },
                      ].map(action => (
                        <div key={action.id} className="flex items-center gap-2">
                          <Checkbox
                            id={action.id}
                            checked={visitResultActions.includes(action.id)}
                            onCheckedChange={(checked) => {
                              setVisitResultActions(prev =>
                                checked ? [...prev, action.id] : prev.filter(a => a !== action.id)
                              );
                            }}
                          />
                          <Label htmlFor={action.id} className="text-sm font-normal cursor-pointer">
                            {action.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Observações */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Observações (opcional)</label>
                    <Textarea
                      rows={3}
                      value={visitResultNotes}
                      onChange={e => setVisitResultNotes(e.target.value)}
                      placeholder="O que foi conversado, próximos passos..."
                    />
                  </div>

                  <Button onClick={handleSaveVisitResult} className="w-full gap-2">
                    <Save className="w-4 h-4" /> Salvar resultado
                  </Button>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>

        {/* Cobrar Recepção modal */}
        <Dialog open={!!cobrarTarget} onOpenChange={(o) => { if (!o) { setCobrarTarget(null); setCobrarNote(''); } }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Phone className="w-5 h-5 text-primary" /> Cobrar Recepção · {cobrarTarget?.clinic}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Textarea
                rows={4}
                value={cobrarNote}
                onChange={e => setCobrarNote(e.target.value)}
                placeholder="Anote o que foi conversado e os próximos passos..."
              />
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => { setCobrarTarget(null); setCobrarNote(''); }}>Cancelar</Button>
              <Button onClick={handleSaveCobranca} className="gap-2"><Save className="w-4 h-4" /> Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Clinic dialog */}
        <Dialog open={addClinicOpen} onOpenChange={setAddClinicOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" /> Adicionar Clínica
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">Nome*</Label>
                <Input value={newClinic.nome} onChange={e => setNewClinic(p => ({ ...p, nome: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Tipo*</Label>
                  <Select value={newClinic.tipo} onValueChange={(v) => setNewClinic(p => ({ ...p, tipo: v as PortfolioClinic['tipo'] }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Clínica">Clínica</SelectItem>
                      <SelectItem value="Hospital">Hospital</SelectItem>
                      <SelectItem value="Consultório">Consultório</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Status*</Label>
                  <Select value={newClinic.status} onValueChange={(v) => setNewClinic(p => ({ ...p, status: v as PortfolioClinic['status'] }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Lead">Lead</SelectItem>
                      <SelectItem value="Ativo">Ativo</SelectItem>
                      <SelectItem value="Inativo">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Bairro*</Label>
                  <Input value={newClinic.bairro} onChange={e => setNewClinic(p => ({ ...p, bairro: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Cidade*</Label>
                  <Input value={newClinic.cidade} onChange={e => setNewClinic(p => ({ ...p, cidade: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Telefone</Label>
                <Input value={newClinic.telefone} onChange={e => setNewClinic(p => ({ ...p, telefone: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Responsável</Label>
                <Input value={newClinic.responsavel} onChange={e => setNewClinic(p => ({ ...p, responsavel: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setAddClinicOpen(false)}>Cancelar</Button>
              <Button onClick={handleAddClinic} className="gap-2"><Save className="w-4 h-4" /> Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}