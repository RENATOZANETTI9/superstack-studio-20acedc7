import { assert, assertEquals, assertMatch, assertNotEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  parseRoteiro,
  validateFormat,
  enrichStructured,
  gerarTelefone,
  gerarResponsavel,
  gerarFaturamento,
  buildCacheKey,
  computeCacheExpiresAt,
  isCacheEntryFresh,
  CACHE_TTL_DAYS,
  CACHE_TTL_MS,
} from "./helpers.ts";

// ─── validateFormat ─────────────────────────────────────────
Deno.test("validateFormat: aceita roteiro bem formatado", () => {
  const txt = `## Segunda-feira — 10/07\n\n1. **Clínica X** | Savassi | Tel: (31) 99999-1111 | Responsável: Dra. Ana\n   - Objetivo: relacionamento\n`;
  const r = validateFormat(txt);
  assertEquals(r.valid, true);
  assertEquals(r.issues.length, 0);
});

Deno.test("validateFormat: detecta ausência de cabeçalhos ##", () => {
  const r = validateFormat(`1. **X** | Savassi`);
  assertEquals(r.valid, false);
  assert(r.issues.some(i => /cabeçalhos/i.test(i)));
});

Deno.test("validateFormat: detecta ausência de itens numerados", () => {
  const r = validateFormat(`## Segunda-feira\n- **X** | Savassi`);
  assertEquals(r.valid, false);
  assert(r.issues.some(i => /numerados/i.test(i)));
});

Deno.test("validateFormat: texto vazio é inválido em ambas dimensões", () => {
  const r = validateFormat("");
  assertEquals(r.valid, false);
  assertEquals(r.issues.length, 2);
});

// ─── parseRoteiro ───────────────────────────────────────────
Deno.test("parseRoteiro: extrai dias, itens e campos principais", () => {
  const txt = `## Segunda-feira — 10/07/2026

1. **Clínica Savassi Odonto** | Savassi | Tel: (31) 99999-1234 | Responsável: Dra. Marina
   - Objetivo: apresentar campanha
   - Faturamento estimado: R$ 90k–120k/mês

2. **Hospital Lourdes** | Lourdes | Tel: (31) 98888-4321 | Responsável: Dr. Ricardo
   - Objetivo: renovação

## Terça-feira — 11/07/2026

1. **Consultório Centro** | Centro | Tel: (31) 97777-0000 | Responsável: Carla Souza

## Dicas para a semana
- Priorize horário da manhã
- Leve brindes
`;
  const s = parseRoteiro(txt);
  assertEquals(s.dias.length, 2);
  assertEquals(s.dias[0].dia, "Segunda-feira");
  assertEquals(s.dias[0].data, "10/07/2026");
  assertEquals(s.dias[0].itens.length, 2);
  assertEquals(s.dias[0].itens[0].clinica, "Clínica Savassi Odonto");
  assertEquals(s.dias[0].itens[0].bairro, "Savassi");
  assertEquals(s.dias[0].itens[0].telefone, "(31) 99999-1234");
  assertEquals(s.dias[0].itens[0].responsavel, "Dra. Marina");
  assertEquals(s.dias[0].itens[0].objetivo, "apresentar campanha");
  assertEquals(s.dias[0].itens[0].faturamento, "R$ 90k–120k/mês");
  assertEquals(s.dias[1].itens[0].clinica, "Consultório Centro");
  assertEquals(s.dicas.length, 2);
  assertEquals(s.dicas[0], "Priorize horário da manhã");
});

Deno.test("parseRoteiro: texto vazio retorna estrutura vazia", () => {
  const s = parseRoteiro("");
  assertEquals(s.dias.length, 0);
  assertEquals(s.dicas.length, 0);
});

Deno.test("parseRoteiro: aceita itens com formato '1)' e sem sub-linhas", () => {
  const s = parseRoteiro(`## Quarta\n1) **Clin A** | Centro`);
  assertEquals(s.dias[0].itens[0].clinica, "Clin A");
  assertEquals(s.dias[0].itens[0].bairro, "Centro");
});

// ─── fallback determinístico ────────────────────────────────
Deno.test("gerarTelefone: formato (DDD) 9XXXX-XXXX e DDD por cidade", () => {
  const tel = gerarTelefone("Clínica X|Savassi", "Belo Horizonte");
  assertMatch(tel, /^\(31\) 9\d{4}-\d{4}$/);
  const telSp = gerarTelefone("Clínica X|Savassi", "São Paulo");
  assertMatch(telSp, /^\(11\) 9\d{4}-\d{4}$/);
  const telFallback = gerarTelefone("seed", "Cidade Inexistente");
  assertMatch(telFallback, /^\(31\) 9\d{4}-\d{4}$/);
});

Deno.test("gerarTelefone: determinístico para mesma seed", () => {
  assertEquals(
    gerarTelefone("Clínica X|Savassi", "Belo Horizonte"),
    gerarTelefone("Clínica X|Savassi", "Belo Horizonte"),
  );
  assertNotEquals(
    gerarTelefone("Clínica A|Savassi"),
    gerarTelefone("Clínica B|Savassi"),
  );
});

Deno.test("gerarResponsavel: retorna nome da lista e é determinístico", () => {
  const NOMES = ['Dra. Marina', 'Dr. Ricardo', 'Patrícia Lima', 'Dra. Beatriz', 'Dr. Felipe', 'Carla Souza', 'Ana Beatriz', 'Roberta Lopes', 'Dr. Henrique'];
  const r = gerarResponsavel("Clínica X|Savassi");
  assert(NOMES.includes(r));
  assertEquals(r, gerarResponsavel("Clínica X|Savassi"));
});

Deno.test("gerarFaturamento: usa faturamentoMedio quando fornecido", () => {
  assertEquals(gerarFaturamento("100k/mês", "seed"), "R$ 100k/mês");
});

Deno.test("gerarFaturamento: cai em faixa determinística quando vazio", () => {
  const faixas = ['R$ 40k–60k/mês', 'R$ 60k–90k/mês', 'R$ 90k–120k/mês', 'R$ 120k–180k/mês'];
  const f = gerarFaturamento("", "Clínica X|Savassi");
  assert(faixas.includes(f));
  assertEquals(f, gerarFaturamento("", "Clínica X|Savassi"));
});

// ─── enrichStructured ───────────────────────────────────────
Deno.test("enrichStructured: preenche campos ausentes com fallback", () => {
  const s = {
    dias: [{
      dia: "Segunda", itens: [
        { clinica: "Clin A", bairro: "Savassi" },
        { clinica: "Clin B", bairro: "Centro", telefone: "sem número", responsavel: "Dr. Já Definido" },
      ],
    }],
    dicas: [],
  };
  const out = enrichStructured(s, "Belo Horizonte", "");
  const a = out.dias[0].itens[0];
  assertMatch(a.telefone!, /^\(31\) 9\d{4}-\d{4}$/);
  assert(a.responsavel && a.responsavel.length > 0);
  assert(a.faturamento && a.faturamento.startsWith("R$"));
  assertEquals(a.objetivo, "Visita de relacionamento e apresentação da campanha");

  const b = out.dias[0].itens[1];
  // telefone sem dígitos deve ser substituído
  assertMatch(b.telefone!, /^\(31\) 9\d{4}-\d{4}$/);
  // responsavel já definido é preservado
  assertEquals(b.responsavel, "Dr. Já Definido");
});

Deno.test("enrichStructured: preserva telefone válido existente", () => {
  const s = {
    dias: [{ dia: "Segunda", itens: [{ clinica: "X", bairro: "Y", telefone: "(31) 91234-5678" }] }],
    dicas: [],
  };
  const out = enrichStructured(s, "Belo Horizonte", "");
  assertEquals(out.dias[0].itens[0].telefone, "(31) 91234-5678");
});

// ─── tavily_cache helpers ───────────────────────────────────
Deno.test("buildCacheKey: monta chave lowercase por cidade|bairro|especialidade|tipo", () => {
  const k = buildCacheKey("Belo Horizonte", "Savassi", "Odontologia", "Clínica");
  assertEquals(k, "belo horizonte|savassi|odontologia|clínica");
});

Deno.test("buildCacheKey: determinístico e case-insensitive", () => {
  assertEquals(
    buildCacheKey("BH", "Centro", "Saude", "hospital"),
    buildCacheKey("bh", "CENTRO", "saude", "HOSPITAL"),
  );
});

Deno.test("buildCacheKey: chaves distintas para bairros diferentes", () => {
  assertNotEquals(
    buildCacheKey("BH", "Savassi", "Odonto", "clínica"),
    buildCacheKey("BH", "Lourdes", "Odonto", "clínica"),
  );
});

Deno.test("computeCacheExpiresAt: TTL de 7 dias a partir do momento informado", () => {
  assertEquals(CACHE_TTL_DAYS, 7);
  assertEquals(CACHE_TTL_MS, 7 * 86400000);
  const now = new Date("2026-07-08T12:00:00.000Z");
  const exp = computeCacheExpiresAt(now);
  assertEquals(exp, "2026-07-15T12:00:00.000Z");
  const diff = new Date(exp).getTime() - now.getTime();
  assertEquals(diff, 7 * 86400000);
});

Deno.test("computeCacheExpiresAt: aceita TTL customizado", () => {
  const now = new Date("2026-01-01T00:00:00.000Z");
  const exp = computeCacheExpiresAt(now, 86400000); // 1 dia
  assertEquals(exp, "2026-01-02T00:00:00.000Z");
});

Deno.test("isCacheEntryFresh: true quando expires_at > now", () => {
  const now = new Date("2026-07-08T12:00:00.000Z");
  assert(isCacheEntryFresh("2026-07-15T12:00:00.000Z", now));
});

Deno.test("isCacheEntryFresh: false quando expires_at <= now (expirado)", () => {
  const now = new Date("2026-07-16T00:00:00.000Z");
  assertEquals(isCacheEntryFresh("2026-07-15T12:00:00.000Z", now), false);
});

Deno.test("isCacheEntryFresh: false para timestamp inválido", () => {
  assertEquals(isCacheEntryFresh("not-a-date", new Date()), false);
});