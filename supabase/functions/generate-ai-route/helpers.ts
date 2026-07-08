// Extracted helpers for unit testing (parseRoteiro, validateFormat, fallback generators)

export const DDDS: Record<string, string> = {
  'Belo Horizonte': '31', 'BH': '31', 'São Paulo': '11', 'SP': '11',
  'Rio de Janeiro': '21', 'RJ': '21', 'Curitiba': '41', 'Brasília': '61',
};
export const NOMES_RESP = ['Dra. Marina', 'Dr. Ricardo', 'Patrícia Lima', 'Dra. Beatriz', 'Dr. Felipe', 'Carla Souza', 'Ana Beatriz', 'Roberta Lopes', 'Dr. Henrique'];

export function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
export function gerarTelefone(seed: string, cidade = 'Belo Horizonte'): string {
  const ddd = DDDS[cidade] || '31';
  const h = hashStr(seed);
  const p1 = String(90000 + (h % 9999)).slice(0, 5);
  const p2 = String(1000 + ((h >> 8) % 8999)).slice(0, 4);
  return `(${ddd}) 9${p1.slice(1)}-${p2}`;
}
export function gerarResponsavel(seed: string): string {
  return NOMES_RESP[hashStr(seed) % NOMES_RESP.length];
}
export function gerarFaturamento(faturamentoMedio: string, seed: string): string {
  if (faturamentoMedio) return `R$ ${faturamentoMedio}`;
  const faixas = ['R$ 40k–60k/mês', 'R$ 60k–90k/mês', 'R$ 90k–120k/mês', 'R$ 120k–180k/mês'];
  return faixas[hashStr(seed) % faixas.length];
}

export interface RoteiroItem {
  clinica: string; bairro?: string; telefone?: string;
  responsavel?: string; objetivo?: string; faturamento?: string;
}
export interface RoteiroDia { dia: string; data?: string; itens: RoteiroItem[]; }
export interface RoteiroStructured { dias: RoteiroDia[]; dicas: string[]; }

export function parseRoteiro(text: string): RoteiroStructured {
  const dias: RoteiroDia[] = [];
  const dicas: string[] = [];
  let currentDay: RoteiroDia | null = null;
  let currentItem: RoteiroItem | null = null;
  let inDicas = false;

  const lines = text.split('\n');
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    if (line.startsWith('##')) {
      const header = line.replace(/^#+\s*/, '');
      if (/dicas/i.test(header)) { inDicas = true; currentDay = null; currentItem = null; continue; }
      inDicas = false;
      const [dia, data] = header.split(/\s+[—–-]\s+/, 2);
      currentDay = { dia: dia.trim(), data: data?.trim(), itens: [] };
      currentItem = null;
      dias.push(currentDay);
      continue;
    }

    if (inDicas) {
      const clean = line.replace(/^[-•*\d\.\)]\s*/, '').trim();
      if (clean) dicas.push(clean);
      continue;
    }

    const itemMatch = line.match(/^\d+[\.\)]\s+(.*)/);
    if (itemMatch && currentDay) {
      const body = itemMatch[1];
      const nome = (body.match(/\*\*(.+?)\*\*/)?.[1] || body.split('|')[0] || '').trim();
      const parts = body.split('|').map(p => p.trim());
      currentItem = {
        clinica: nome,
        bairro: parts[1]?.replace(/\*+/g, '').trim(),
        telefone: parts.find(p => /tel[:.]/i.test(p))?.replace(/tel[:.]?\s*/i, '').trim(),
        responsavel: parts.find(p => /respons/i.test(p))?.replace(/respons[áa]vel[:.]?\s*/i, '').trim(),
      };
      currentDay.itens.push(currentItem);
      continue;
    }

    const sub = line.match(/^[-•*]\s*(objetivo|faturamento)[^:]*:\s*(.+)/i);
    if (sub && currentItem) {
      if (/objetivo/i.test(sub[1])) currentItem.objetivo = sub[2].trim();
      else currentItem.faturamento = sub[2].trim();
    }
  }
  return { dias, dicas };
}

export function enrichStructured(s: RoteiroStructured, cidade: string, faturamentoMedio: string): RoteiroStructured {
  for (const dia of s.dias) {
    for (const item of dia.itens) {
      const seed = `${item.clinica}|${item.bairro || ''}`;
      if (!item.telefone || !/\d/.test(item.telefone)) item.telefone = gerarTelefone(seed, cidade);
      if (!item.responsavel) item.responsavel = gerarResponsavel(seed);
      if (!item.faturamento) item.faturamento = gerarFaturamento(faturamentoMedio, seed);
      if (!item.objetivo) item.objetivo = 'Visita de relacionamento e apresentação da campanha';
    }
  }
  return s;
}

export function validateFormat(text: string): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  if (!/^##\s+/m.test(text)) issues.push('Sem cabeçalhos "## Dia"');
  if (!/^\s*\d+[\.\)]\s+/m.test(text)) issues.push('Sem itens numerados "1."');
  return { valid: issues.length === 0, issues };
}