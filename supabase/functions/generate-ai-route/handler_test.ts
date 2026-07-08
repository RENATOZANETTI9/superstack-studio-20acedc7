import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { handleRequest } from "./index.ts";
import { buildCacheKey, CACHE_TTL_MS } from "./helpers.ts";

// ─── Fake Supabase admin client ────────────────────────────
interface CacheRow {
  cache_key: string;
  bairro: string;
  especialidade: string;
  tipo: string;
  results: any[];
  expires_at: string;
}

function makeFakeAdmin(seed: CacheRow[] = []) {
  const rows = new Map<string, CacheRow>();
  for (const r of seed) rows.set(r.cache_key, r);
  const upserts: CacheRow[] = [];

  const from = (_table: string) => {
    // Read chain
    const selectChain = () => {
      const state: { key?: string; minExpires?: string } = {};
      const chain: any = {
        eq(col: string, val: string) {
          if (col === "cache_key") state.key = val;
          return chain;
        },
        gt(col: string, val: string) {
          if (col === "expires_at") state.minExpires = val;
          return chain;
        },
        async maybeSingle() {
          const r = state.key ? rows.get(state.key) : undefined;
          if (!r) return { data: null, error: null };
          if (state.minExpires && !(new Date(r.expires_at) > new Date(state.minExpires))) {
            return { data: null, error: null };
          }
          return { data: { results: r.results, expires_at: r.expires_at }, error: null };
        },
      };
      return chain;
    };

    return {
      select: (_cols: string) => selectChain(),
      async upsert(row: CacheRow, _opts: any) {
        rows.set(row.cache_key, row);
        upserts.push(row);
        return { data: row, error: null };
      },
    };
  };

  return { admin: { from }, rows, upserts };
}

// ─── Stubs de fetch ────────────────────────────────────────
function llmResponse(body: string): Response {
  return new Response(
    JSON.stringify({ choices: [{ message: { content: body } }] }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}

const VALID_ROTEIRO = `## Segunda-feira — 13/07/2026

1. **Clínica Alpha** | Savassi | Tel: (31) 99999-0000 | Responsável: Dra. Marina
   - Objetivo: relacionamento
   - Faturamento estimado: R$ 60k–90k/mês

2. **Clínica Beta** | Savassi | Tel: (31) 98888-0000 | Responsável: Dr. Ricardo
   - Objetivo: apresentação

## Dicas para a semana
- Priorize manhã
`;

const baseEnv = (extra: Record<string, string | undefined> = {}) => (k: string) => {
  const map: Record<string, string | undefined> = {
    LOVABLE_API_KEY: "test-lovable-key",
    TAVILY_API_KEY: "test-tavily-key",
    ...extra,
  };
  return map[k];
};

function makeReq(body: any): Request {
  return new Request("http://localhost/generate-ai-route", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// ─── Testes ────────────────────────────────────────────────

Deno.test("integração: falha do Tavily → source='suggested' e fallback preenche campos", async () => {
  const { admin, upserts } = makeFakeAdmin();
  const calls: string[] = [];
  const stubFetch = (async (url: string | URL, _init?: RequestInit) => {
    const u = String(url);
    calls.push(u);
    if (u.includes("tavily.com")) {
      return new Response("upstream down", { status: 503 });
    }
    return llmResponse(VALID_ROTEIRO);
  }) as unknown as typeof fetch;

  const req = makeReq({
    cidade: "Belo Horizonte", bairros: "Savassi", especialidade: "Odontologia",
    tipoLocal: "clínica", semana: "13-17/07/2026",
  });
  const res = await handleRequest(req, { env: baseEnv(), fetch: stubFetch, admin });
  assertEquals(res.status, 200);
  const json = await res.json();

  assertEquals(json.source, "suggested");
  assertEquals(json.meta.tavily_errors, 1);
  assertEquals(json.meta.cache_hits, 0);
  assertEquals(json.meta.tavily_hits, 0);
  assertEquals(json.meta.format_valid, true);
  assert(Array.isArray(json.structured.dias));
  assert(json.structured.dias.length >= 1);
  // fallback aplicado: todo item tem telefone/responsável/faturamento
  for (const dia of json.structured.dias) {
    for (const it of dia.itens) {
      assert(it.telefone && /\(\d{2}\) 9\d{4}-\d{4}/.test(it.telefone));
      assert(it.responsavel && it.responsavel.length > 0);
      assert(it.faturamento && it.faturamento.startsWith("R$"));
    }
  }
  // cache não deve ter sido gravado (Tavily falhou)
  assertEquals(upserts.length, 0);
  // pelo menos 1 chamada a tavily e 1 ao LLM
  assert(calls.some((c) => c.includes("tavily.com")));
  assert(calls.some((c) => c.includes("lovable.dev") || c.includes("openai.com")));
});

Deno.test("integração: cache fresco → source='tavily_cache' e Tavily não é chamado", async () => {
  const cidade = "Belo Horizonte", bairro = "Savassi", esp = "Odontologia", tipo = "clínica";
  const key = buildCacheKey(cidade, bairro, esp, tipo);
  const future = new Date(Date.now() + CACHE_TTL_MS / 2).toISOString();
  const { admin } = makeFakeAdmin([{
    cache_key: key, bairro, especialidade: esp, tipo,
    results: [{ title: "Clínica Cacheada", content: "endereço x" }],
    expires_at: future,
  }]);

  const calls: string[] = [];
  const stubFetch = (async (url: string | URL) => {
    const u = String(url);
    calls.push(u);
    if (u.includes("tavily.com")) throw new Error("Tavily não deveria ser chamado");
    return llmResponse(VALID_ROTEIRO);
  }) as unknown as typeof fetch;

  const req = makeReq({ cidade, bairros: bairro, especialidade: esp, tipoLocal: tipo });
  const res = await handleRequest(req, { env: baseEnv(), fetch: stubFetch, admin });
  const json = await res.json();

  assertEquals(res.status, 200);
  assertEquals(json.source, "tavily_cache");
  assertEquals(json.meta.cache_hits, 1);
  assertEquals(json.meta.tavily_hits, 0);
  assertEquals(json.meta.tavily_errors, 0);
  assert(!calls.some((c) => c.includes("tavily.com")));
});

Deno.test("integração: cache expirado é ignorado e Tavily é consultado + upsert com TTL ~7d", async () => {
  const cidade = "BH", bairro = "Centro", esp = "saúde", tipo = "clínica";
  const key = buildCacheKey(cidade, bairro, esp, tipo);
  const past = new Date(Date.now() - 86400000).toISOString();
  const { admin, upserts } = makeFakeAdmin([{
    cache_key: key, bairro, especialidade: esp, tipo,
    results: [{ title: "old", content: "old" }], expires_at: past,
  }]);

  const stubFetch = (async (url: string | URL) => {
    const u = String(url);
    if (u.includes("tavily.com")) {
      return new Response(JSON.stringify({
        results: [{ title: "Clínica Real", content: "desc" }],
      }), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    return llmResponse(VALID_ROTEIRO);
  }) as unknown as typeof fetch;

  const before = Date.now();
  const res = await handleRequest(
    makeReq({ cidade, bairros: bairro }),
    { env: baseEnv(), fetch: stubFetch, admin },
  );
  const after = Date.now();
  const json = await res.json();

  assertEquals(json.source, "tavily");
  assertEquals(json.meta.cache_hits, 0);
  assert(json.meta.tavily_hits > 0);
  // upsert gravou com cache_key correto e expires_at ~7d à frente
  assertEquals(upserts.length, 1);
  assertEquals(upserts[0].cache_key, key);
  const expMs = new Date(upserts[0].expires_at).getTime();
  assert(expMs >= before + CACHE_TTL_MS - 5000);
  assert(expMs <= after + CACHE_TTL_MS + 5000);
});

Deno.test("integração: sem AI key configurada → 500 com mensagem", async () => {
  const { admin } = makeFakeAdmin();
  const stubFetch = (async () => llmResponse("noop")) as unknown as typeof fetch;
  const env = (_k: string) => undefined;
  const res = await handleRequest(
    makeReq({ cidade: "BH", bairros: "Savassi" }),
    { env, fetch: stubFetch, admin },
  );
  assertEquals(res.status, 500);
  const j = await res.json();
  assert(j.error && /AI key/i.test(j.error));
});