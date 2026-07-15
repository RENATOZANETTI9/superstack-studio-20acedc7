import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const t0 = Date.now();
  const key = Deno.env.get('TAVILY_API_KEY');
  const configured = !!key;
  const keyValidShape = configured && /^tvly-/i.test((key || '').trim());

  let liveTestOk = false;
  let status: number | null = null;
  let errorMessage: string | null = null;
  let sampleResultsCount = 0;

  if (keyValidShape) {
    try {
      const res = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: key,
          query: 'clínica odontológica São Paulo',
          search_depth: 'basic',
          max_results: 2,
          include_answer: false,
        }),
      });
      status = res.status;
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        sampleResultsCount = Array.isArray(data?.results) ? data.results.length : 0;
        liveTestOk = sampleResultsCount > 0;
      } else {
        errorMessage = (await res.text().catch(() => '')).slice(0, 200);
      }
    } catch (err) {
      errorMessage = String((err as any)?.message || err).slice(0, 200);
    }
  } else if (configured) {
    errorMessage = 'TAVILY_API_KEY não começa com "tvly-"';
  } else {
    errorMessage = 'TAVILY_API_KEY não configurada';
  }

  const body = {
    tavily_configured: configured,
    tavily_key_valid_shape: keyValidShape,
    live_test_ok: liveTestOk,
    live_test_status: status,
    sample_results_count: sampleResultsCount,
    error_message: errorMessage,
    checked_at: new Date().toISOString(),
    duration_ms: Date.now() - t0,
  };

  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200,
  });
});
