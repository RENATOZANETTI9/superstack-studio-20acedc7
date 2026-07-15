import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { handleRequest } from "./index.ts";

function fakeAdmin() {
  const cache = new Map<string, any>();
  return {
    admin: {
      from: () => ({
        select: () => ({
          eq: function () { return this; },
          gt: function () { return this; },
          maybeSingle: async () => ({ data: null, error: null }),
        }),
        upsert: async (row: any) => { cache.set(row.cache_key, row); return { data: row, error: null }; },
      }),
    },
    cache,
  };
}

function llmResp(): Response {
  const body = `## Segunda-feira — 01/01

1. **Clínica X** | Savassi | Tel: (31) 99999-0000 | Responsável: Dra. A
   - Objetivo: prospecção

## Dicas para a semana
- dica
`;
  return new Response(
    JSON.stringify({ choices: [{ message: { content: body } }] }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}

// Chave com formato válido (`tvly-...`) para acionar a validação.
const env = (k: string) => {
  if (k === "LOVABLE_API_KEY") return "test-key";
  if (k === "TAVILY_API_KEY") return "tvly-fake-test-key-1234567890";
  return undefined;
};

function makeReq(cidade = "Belo Horizonte", bairros = "Savassi") {
  return new Request("http://localhost/generate-ai-route", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cidade, bairros }),
  });
}

Deno.test("tavily mock: sucesso → tavily_errors=0, source='tavily', fontes preenchidas", async () => {
  const { admin } = fakeAdmin();
  const tavilyCalls: number[] = [];
  let now = 0;
  const fetchStub = (async (url: string | URL) => {
    const u = String(url);
    if (u.includes("tavily.com")) {
      tavilyCalls.push(++now);
      return new Response(JSON.stringify({
        results: [
          { title: "Clínica Real 1", content: "endereço", url: "https://ex.com/1" },
          { title: "Clínica Real 2", content: "endereço", url: "https://ex.com/2" },
        ],
      }), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    return llmResp();
  }) as unknown as typeof fetch;

  const res = await handleRequest(makeReq(), { env, fetch: fetchStub, admin, sleep: async () => {} });
  assertEquals(res.status, 200);
  const json = await res.json();

  assertEquals(json.source, "tavily");
  assertEquals(json.meta.tavily_errors, 0);
  assert(json.meta.tavily_hits >= 2, `tavily_hits=${json.meta.tavily_hits}`);
  assertEquals(json.meta.tavily_key_valid_shape, true);
  assertEquals(json.meta.tavily_expected_but_missing, false);
  assert(Array.isArray(json.tavily_sources));
  assertEquals(json.tavily_sources.length, 2);
  assertEquals(json.tavily_sources[0].from, "live");
  assertEquals(json.tavily_sources[0].bairro, "Savassi");
  assert(json.meta.tavily_sources_summary.length === 2);
  // Uma tentativa apenas — não deve retry em sucesso
  assertEquals(tavilyCalls.length, 1);
});

Deno.test("tavily mock: falha permanente 401 → tavily_errors=1, source='suggested', LLM ainda usado", async () => {
  const { admin } = fakeAdmin();
  let tavilyCalls = 0;
  let llmCalled = false;
  const fetchStub = (async (url: string | URL) => {
    const u = String(url);
    if (u.includes("tavily.com")) {
      tavilyCalls++;
      return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
    }
    llmCalled = true;
    return llmResp();
  }) as unknown as typeof fetch;

  const res = await handleRequest(makeReq(), { env, fetch: fetchStub, admin, sleep: async () => {} });
  const json = await res.json();

  assertEquals(res.status, 200);
  assertEquals(json.source, "suggested");
  assertEquals(json.meta.tavily_errors, 1);
  assertEquals(json.meta.tavily_hits, 0);
  assertEquals(json.tavily_sources.length, 0);
  assertEquals(json.meta.tavily_expected_but_missing, true);
  assert(json.meta.tavily_error_details[0].status === 401);
  // 401 não é retriável — apenas 1 tentativa
  assertEquals(tavilyCalls, 1);
  // Fallback: LLM ainda foi chamado e roteiro utilizável foi retornado
  assert(llmCalled, "LLM deveria ter sido chamado como fallback");
  assert(json.roteiro.length > 0);
  assert(Array.isArray(json.structured.dias) && json.structured.dias.length > 0);
});

Deno.test("tavily mock: 503 transitório → retry com backoff e sucesso na 2ª tentativa", async () => {
  const { admin } = fakeAdmin();
  let tavilyCalls = 0;
  const sleepMs: number[] = [];
  const fetchStub = (async (url: string | URL) => {
    const u = String(url);
    if (u.includes("tavily.com")) {
      tavilyCalls++;
      if (tavilyCalls === 1) return new Response("upstream down", { status: 503 });
      return new Response(JSON.stringify({
        results: [{ title: "Recuperado", content: "ok" }],
      }), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    return llmResp();
  }) as unknown as typeof fetch;

  const res = await handleRequest(makeReq(), {
    env, fetch: fetchStub, admin,
    sleep: async (ms: number) => { sleepMs.push(ms); },
  });
  const json = await res.json();

  assertEquals(res.status, 200);
  assertEquals(tavilyCalls, 2, "deve ter feito 2 tentativas");
  assertEquals(sleepMs.length, 1);
  assert(sleepMs[0] >= 300, `backoff aplicado: ${sleepMs[0]}ms`);
  assertEquals(json.source, "tavily");
  assertEquals(json.meta.tavily_errors, 0, "sucesso após retry → sem erro final");
  assertEquals(json.meta.tavily_hits, 1);
});

Deno.test("tavily mock: comparação sucesso vs falha muda source e metadata", async () => {
  const success = async () => {
    const { admin } = fakeAdmin();
    const fetchStub = (async (url: string | URL) => {
      if (String(url).includes("tavily.com")) {
        return new Response(JSON.stringify({ results: [{ title: "A", content: "b" }] }),
          { status: 200, headers: { "Content-Type": "application/json" } });
      }
      return llmResp();
    }) as unknown as typeof fetch;
    return (await handleRequest(makeReq(), { env, fetch: fetchStub, admin, sleep: async () => {} })).json();
  };
  const failure = async () => {
    const { admin } = fakeAdmin();
    const fetchStub = (async (url: string | URL) => {
      if (String(url).includes("tavily.com")) return new Response("nope", { status: 401 });
      return llmResp();
    }) as unknown as typeof fetch;
    return (await handleRequest(makeReq(), { env, fetch: fetchStub, admin, sleep: async () => {} })).json();
  };

  const ok = await success();
  const bad = await failure();
  // Contrastes explícitos
  assert(ok.source !== bad.source, `source deveria diferir: ${ok.source} vs ${bad.source}`);
  assertEquals(ok.source, "tavily");
  assertEquals(bad.source, "suggested");
  assertEquals(ok.meta.tavily_errors, 0);
  assertEquals(bad.meta.tavily_errors, 1);
  assert(ok.meta.tavily_sources_count > 0);
  assertEquals(bad.meta.tavily_sources_count, 0);
  assertEquals(ok.meta.tavily_expected_but_missing, false);
  assertEquals(bad.meta.tavily_expected_but_missing, true);
});

// ── Invariante ────────────────────────────────────────────────────────────
// Contrato explícito: quando `tavily_errors === 0` e o Tavily foi consultado
// (bairros informados + chave válida), o response DEVE conter `tavily_sources`
// não-vazio e com pelo menos uma entrada `from === 'live'` (a chamada real
// aconteceu, não veio só do cache).
Deno.test("invariante: tavily_errors=0 ⇒ tavily_sources não-vazio com ao menos um from='live'", async () => {
  const scenarios: Array<{ name: string; results: any[] }> = [
    { name: "1 resultado", results: [{ title: "A", content: "x", url: "https://a" }] },
    { name: "3 resultados", results: [
      { title: "A", content: "x", url: "https://a" },
      { title: "B", content: "y", url: "https://b" },
      { title: "C", content: "z" },
    ] },
    { name: "resultados sem url", results: [{ title: "SemURL", content: "x" }] },
  ];

  for (const sc of scenarios) {
    const { admin } = fakeAdmin();
    const fetchStub = (async (url: string | URL) => {
      if (String(url).includes("tavily.com")) {
        return new Response(JSON.stringify({ results: sc.results }),
          { status: 200, headers: { "Content-Type": "application/json" } });
      }
      return llmResp();
    }) as unknown as typeof fetch;

    const res = await handleRequest(makeReq(), { env, fetch: fetchStub, admin, sleep: async () => {} });
    const json = await res.json();

    assertEquals(json.meta.tavily_errors, 0, `[${sc.name}] tavily_errors deve ser 0`);
    assert(Array.isArray(json.tavily_sources), `[${sc.name}] tavily_sources deve ser array`);
    assert(json.tavily_sources.length > 0, `[${sc.name}] tavily_sources não pode ser vazio`);
    const liveOnes = json.tavily_sources.filter((s: any) => s.from === "live");
    assert(liveOnes.length > 0, `[${sc.name}] deve ter ao menos uma fonte from='live'`);
    for (const s of liveOnes) {
      assert(typeof s.title === "string" && s.title.length > 0, `[${sc.name}] title deve ser não-vazio`);
      assert(typeof s.bairro === "string" && s.bairro.length > 0, `[${sc.name}] bairro deve ser não-vazio`);
    }
    // Meta summary deve refletir as fontes.
    assertEquals(json.meta.tavily_sources_count, json.tavily_sources.length,
      `[${sc.name}] tavily_sources_count deve bater com tavily_sources.length`);
    assertEquals(json.meta.tavily_expected_but_missing, false,
      `[${sc.name}] com fontes presentes, tavily_expected_but_missing deve ser false`);
  }
});