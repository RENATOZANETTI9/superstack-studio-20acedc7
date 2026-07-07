const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'LOVABLE_API_KEY não configurada.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const contentType = req.headers.get('content-type') ?? '';
    let audioBlob: Blob;
    let filename = 'recording.webm';

    if (contentType.includes('application/json')) {
      // Client sent base64
      const { audio, mimeType } = await req.json();
      if (!audio) {
        return new Response(
          JSON.stringify({ error: 'Áudio não fornecido.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
      const binary = atob(audio);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const mt = (mimeType as string) || 'audio/webm';
      audioBlob = new Blob([bytes], { type: mt });
      const ext = mt.includes('mp4') || mt.includes('m4a') ? 'mp4'
        : mt.includes('mpeg') ? 'mp3'
        : mt.includes('wav') ? 'wav'
        : 'webm';
      filename = `recording.${ext}`;
    } else {
      const form = await req.formData();
      const f = form.get('file');
      if (!(f instanceof File)) {
        return new Response(
          JSON.stringify({ error: 'Arquivo de áudio ausente.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
      audioBlob = f;
      filename = f.name || filename;
    }

    const upstream = new FormData();
    upstream.append('model', 'openai/gpt-4o-transcribe');
    upstream.append('file', audioBlob, filename);

    const res = await fetch('https://ai.gateway.lovable.dev/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}` },
      body: upstream,
    });

    if (!res.ok) {
      const err = await res.text().catch(() => '');
      console.error('Transcription upstream error:', res.status, err);
      return new Response(
        JSON.stringify({ error: `Falha na transcrição (${res.status})`, details: err }),
        { status: res.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const data = await res.json();
    return new Response(
      JSON.stringify({ text: data.text ?? '' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    console.error('transcribe-audio error', e);
    return new Response(
      JSON.stringify({ error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});