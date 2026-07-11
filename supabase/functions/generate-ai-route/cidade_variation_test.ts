import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { handleRequest } from "./index.ts";

// Fake admin (no cache — irrelevant here)
function fakeAdmin() {
  return {
    from: () => ({
      select: () => ({
        eq: function () { return this; },
        gt: function () { return this; },
        maybeSingle: async () => ({ data: null, error: null }),
      }),
      upsert: async () => ({ data: null, error: null }),
    }),
  };
}

const env = (k: string) => (k === "LOVABLE_API_KEY" ? "test-key" : undefined);

function llmResp(body: string): Response {
  return new Response(
    JSON.stringify({ choices: [{ message: { content: body } }] }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}

function makeStubFetch(captured: { url: string; body: any }[]) {
  return (async (url: string | URL, init?: RequestInit) => {
    const u = String(url);
    let body: any = null;
    try { body = init?.body ? JSON.parse(init.body as string) : null; } catch { /* ignore */ }
    captured.push({ url: u, body });
    // Echo the cidade extracted from the prompt so we can assert per-city variation.
    const prompt = body?.messages?.[0]?.content || "";
    const cidadeMatch = prompt.match(/Cidade:\s*([^\n]+)/i)?.[1]?.trim() || "?";
    const bairroMatch = prompt.match(/Bairros de foco:\s*([^\n]+)/i)?.[1]?.trim() || "?";
    const roteiro = `## Segunda-feira — 01/01

1. **Clínica ${cidadeMatch}** | ${bairroMatch} | Tel: (00) 90000-0000 | Responsável: Dra. Test
   - Objetivo: prospecção

## Dicas para a semana
- dica
`;
    return llmResp(roteiro);
  }) as unknown as typeof fetch;
}

Deno.test("cidade variation: roteiro reflete a cidade enviada em 3+ cidades", async () => {
  const cidades = [
    { cidade: "Belo Horizonte", bairro: "Savassi" },
    { cidade: "Curitiba", bairro: "Batel" },
    { cidade: "Recife", bairro: "Boa Viagem" },
    { cidade: "Porto Alegre", bairro: "Moinhos" },
  ];

  const results: { cidade: string; roteiro: string; meta: any; promptCidade: string }[] = [];

  for (const c of cidades) {
    const captured: { url: string; body: any }[] = [];
    const res = await handleRequest(
      new Request("http://localhost/generate-ai-route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cidade: c.cidade, bairros: c.bairro }),
      }),
      { env, fetch: makeStubFetch(captured), admin: fakeAdmin() },
    );
    assertEquals(res.status, 200, `${c.cidade} → ${res.status}`);
    const json = await res.json();
    const llmCall = captured.find(x => /lovable\.dev|openai\.com/.test(x.url));
    assert(llmCall, `LLM não chamado para ${c.cidade}`);
    const prompt: string = llmCall!.body?.messages?.[0]?.content || "";
    assert(prompt.includes(`Cidade: ${c.cidade}`), `prompt sem cidade correta em ${c.cidade}`);
    assert(prompt.includes(c.bairro), `prompt sem bairro em ${c.cidade}`);
    assertEquals(json.meta.cidade, c.cidade, `meta.cidade mismatch em ${c.cidade}`);
    // structured deve mencionar a cidade (via echo do stub)
    const allNames = json.structured.dias.flatMap((d: any) => d.itens.map((i: any) => i.clinica)).join(" ");
    assert(allNames.includes(c.cidade), `structured não reflete cidade em ${c.cidade}: ${allNames}`);
    results.push({ cidade: c.cidade, roteiro: json.roteiro, meta: json.meta, promptCidade: c.cidade });
  }

  // Roteiros devem ser distintos entre cidades
  const uniqueRoteiros = new Set(results.map(r => r.roteiro));
  assertEquals(uniqueRoteiros.size, cidades.length, "roteiros idênticos entre cidades");
});

Deno.test("cidade variation: telefone gerado usa DDD da cidade", async () => {
  const cases = [
    { cidade: "Belo Horizonte", ddd: "31" },
    { cidade: "São Paulo", ddd: "11" },
    { cidade: "Rio de Janeiro", ddd: "21" },
    { cidade: "Curitiba", ddd: "41" },
  ];
  for (const c of cases) {
    // Roteiro sem telefone → enrichStructured deve preencher com DDD certo
    const stubFetch = (async (url: string | URL, init?: RequestInit) => {
      const u = String(url);
      if (u.includes("tavily.com")) return new Response("{}", { status: 200 });
      const roteiro = `## Segunda-feira — 01/01

1. **Clínica X** | Centro
   - Objetivo: visita

## Dicas para a semana
- x
`;
      return llmResp(roteiro);
    }) as unknown as typeof fetch;

    const res = await handleRequest(
      new Request("http://localhost/generate-ai-route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cidade: c.cidade }),
      }),
      { env, fetch: stubFetch, admin: fakeAdmin() },
    );
    const json = await res.json();
    const telefones = json.structured.dias.flatMap((d: any) => d.itens.map((i: any) => i.telefone));
    assert(telefones.length > 0, `sem itens em ${c.cidade}`);
    for (const t of telefones) {
      assert(t.startsWith(`(${c.ddd})`), `telefone ${t} não usa DDD ${c.ddd} para ${c.cidade}`);
    }
  }
});