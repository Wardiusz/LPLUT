// Cloudflare Worker: pośrednik między stroną z planem a API Claude albo Gemini.
// Klucze API zostają w Workerze i nigdy nie trafiają do przeglądarki.
// Dostawcę wybierasz na stronie (Plan → Usługa skanowania). "Auto" używa Claude,
// a gdy brak jego klucza, Gemini.
//
// Ustawienia (Workers → Settings → Variables and Secrets):
//   ANTHROPIC_API_KEY (Secret)  klucz z console.anthropic.com   — wymagany dla Claude
//   GEMINI_API_KEY    (Secret)  klucz z Google AI Studio        — wymagany dla Gemini
//   ACCESS_CODE       (Secret, zalecany)  kod, który wpiszesz na stronie
//   ALLOWED_ORIGIN    (zmienna, zalecana) adres Twojej strony, np. https://login.github.io
//   MODEL_CLAUDE      (zmienna, opcjonalna) domyślnie claude-sonnet-5-5
//   MODEL_GEMINI      (zmienna, opcjonalna) domyślnie gemini-3.5-flash
// Wystarczy klucz jednego dostawcy.

async function viaClaude(env, { image, mediaType, prompt }) {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: env.MODEL_CLAUDE || 'claude-sonnet-5-5',
      max_tokens: 8000,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: image } },
            { type: 'text', text: prompt },
          ],
        },
      ],
    }),
  });
  if (!r.ok) return { status: r.status };
  const d = await r.json();
  return { text: (d.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('') };
}

async function viaGemini(env, { image, mediaType, prompt }) {
  const model = env.MODEL_GEMINI || 'gemini-3.5-flash';
  const r = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: 'POST',
      headers: { 'x-goog-api-key': env.GEMINI_API_KEY, 'content-type': 'application/json' },
      body: JSON.stringify({
        contents: [
          { parts: [{ inline_data: { mime_type: mediaType, data: image } }, { text: prompt }] },
        ],
        generationConfig: { responseMimeType: 'application/json' },
      }),
    }
  );
  if (!r.ok) return { status: r.status };
  const d = await r.json();
  const parts = (d.candidates && d.candidates[0] && d.candidates[0].content.parts) || [];
  return { text: parts.map((p) => p.text || '').join('') };
}

export default {
  async fetch(req, env) {
    const cors = {
      'access-control-allow-origin': env.ALLOWED_ORIGIN || '*',
      'access-control-allow-headers': 'content-type,x-access-code',
      'access-control-allow-methods': 'POST,OPTIONS',
    };
    const out = (obj, status = 200) =>
      new Response(JSON.stringify(obj), {
        status,
        headers: { ...cors, 'content-type': 'application/json' },
      });

    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (req.method !== 'POST') return out({ error: 'method' }, 405);
    if (env.ACCESS_CODE && req.headers.get('x-access-code') !== env.ACCESS_CODE) {
      return out({ error: 'forbidden' }, 403);
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return out({ error: 'bad json' }, 400);
    }
    const { image, mediaType = 'image/jpeg', prompt } = body;
    if (!image || !prompt || image.length > 7_000_000) return out({ error: 'bad request' }, 400);

    const has = { claude: !!env.ANTHROPIC_API_KEY, gemini: !!env.GEMINI_API_KEY };
    let prov = body.provider || 'auto';
    if (prov === 'auto') prov = has.claude ? 'claude' : has.gemini ? 'gemini' : '';
    if (!has[prov]) return out({ error: 'provider_unavailable' }, 400);

    const res = await (prov === 'claude' ? viaClaude : viaGemini)(env, { image, mediaType, prompt });
    if (res.status) return out({ error: 'upstream', provider: prov, status: res.status }, 502);

    const found = (res.text || '').match(/\{[\s\S]*\}/);
    if (!found) return out({ error: 'no json' }, 502);
    try {
      return out(JSON.parse(found[0]));
    } catch {
      return out({ error: 'bad json from model' }, 502);
    }
  },
};
