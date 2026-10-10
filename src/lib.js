export const DAYS = ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota', 'Niedziela'];
export const LS = 'plan-zjazdy-v1';
// Terminy zjazdów z kalendarza uczelni (semestr zimowy 2026/27) — używane, gdy plan ma 10 zjazdów.
export const ZD = ['2026-10-03', '2026-10-10', '2026-10-24', '2026-11-07', '2026-11-14', '2026-11-28', '2026-12-05', '2026-12-19', '2027-01-16', '2027-01-23'];
// Kalendarz terminów dla planów dziennych (semestr zimowy 2026/27): wiersz = termin t1–t15, kolumny = pn, wt, śr, czw, pt.
// Terminy nie są tygodniami kalendarzowymi: czwartek i piątek mają inne numery niż poniedziałek, a "wirtualne" dni
// (np. pn 09.11 liczy się jak środa) zmieniają dzień zajęć.
const TR = ['05.10 06.10 07.10 01.10 02.10', '12.10 13.10 14.10 08.10 09.10', '19.10 20.10 21.10 15.10 16.10', '26.10 27.10 28.10 22.10 23.10',
  '02.11 03.11 04.11 29.10 30.10', '16.11 10.11 09.11 05.11 06.11', '23.11 17.11 18.11 12.11 13.11', '30.11 24.11 25.11 19.11 20.11',
  '07.12 01.12 02.12 26.11 27.11', '14.12 08.12 09.12 03.12 04.12', '21.12 15.12 16.12 10.12 11.12', '11.01 12.01 22.12 17.12 18.12',
  '18.01 19.01 13.01 14.01 15.01', '25.01 26.01 20.01 21.01 22.01', '01.02 02.02 27.01 28.01 29.01'];
export const TM = {};
TR.forEach((r, i) => r.split(' ').forEach((x, k) => { const [d, mo] = x.split('.'); TM[`${+mo < 9 ? 2027 : 2026}-${mo}-${d}`] = { day: k + 1, n: i + 1 }; }));
const TK = Object.keys(TM).sort(), TM_START = TK[0], TM_END = TK[TK.length - 1], TM_UNTIL = '2027-02-28';
export const EMPTY = { ev: [], meta: { title: 'Plan zajęć', group: '' }, zj: [], ds: false, ts: 0 };

// ---- daty i czas
export const m = (t) => { const [a, b] = t.split(':'); return +a * 60 + +b; };
export const iso = (d) => ((d.getDay() + 6) % 7) + 1;
export const ymd = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
export const pd = (s) => { const [a, b, c] = s.split('-'); return new Date(+a, b - 1, +c); };
export const ad = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
export const F = (d, o) => d.toLocaleDateString('pl-PL', o);
export const today = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); };
export const hue = (s) => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 360; return h; };

// ---- bloki zajęć
export const wk = (s) => {
  const r = new Set();
  String(s || '').replace(/(\d+)\s*-\s*(\d+)|(\d+)/g, (x, a, b, c) => { if (c) r.add(+c); else for (let i = +a; i <= +b; i++) r.add(i); });
  if (!r.size) for (let i = 1; i < 100; i++) r.add(i); // brak tygodni = każdy tydzień
  return r;
};
export const norm = (o) => {
  const d = +o.day, a = String(o.start || '').match(/(\d{1,2}):(\d\d)/), b = String(o.end || '').match(/(\d{1,2}):(\d\d)/);
  if (!(d >= 1 && d <= 7) || !a || !b) return null;
  const f = (x) => x[1].padStart(2, '0') + ':' + x[2];
  return { day: d, start: f(a), end: f(b), type: o.type || '', weeks: String(o.weeks || ''), title: o.title || 'Zajęcia', room: o.room || '', teacher: o.teacher || '', group: o.group || '', note: o.note || '' };
};
export const validZj = (z) => Array.isArray(z) && z.length > 0 && z.every((x) => /^\d{4}-\d\d-\d\d$/.test(x));
const modeOf = (ev) => (ev.every((e) => e.day >= 6) ? 'zjazd' : 'tyg');
export { modeOf };
const maxW = (ev) => { const ws = ev.flatMap((e) => (/\d/.test(e.weeks || '') ? [...wk(e.weeks)] : [])); return ws.length ? Math.max(...ws) : 15; };

// Uzupełnia i koryguje terminy tak, żeby pasowały do planu i jego trybu.
export function fixZj(p) {
  if (!p.ev.length) return { ...p, zj: [], ds: false, tm: undefined };
  const N = maxW(p.ev), mode = modeOf(p.ev);
  let q = p;
  // Terminy z poprzedniego planu o innym trybie (np. soboty dla planu dziennego) są nieaktualne.
  const stale = mode === 'tyg' ? q.zj.some((z) => iso(pd(z)) !== 1) : q.zj.length > 0 && q.zj.every((z) => iso(pd(z)) === 1);
  if (stale) q = { ...q, zj: [], ds: false };
  if (mode === 'zjazd') q = { ...q, tm: undefined };
  else if (q.tm === undefined) q = { ...q, tm: N <= 15 && ymd(today()) <= TM_UNTIL };
  if (mode === 'tyg' && q.tm) return { ...q, zj: [], ds: true }; // daty z kalendarza uczelni (TM)
  if (q.zj.length >= N) return q;
  if (q.zj.length) {
    let a = pd(q.zj[q.zj.length - 1]); const zj = [...q.zj];
    while (zj.length < N) { a = ad(a, 7); zj.push(ymd(a)); }
    return { ...q, zj, ds: false };
  }
  if (mode === 'zjazd' && N === ZD.length) return { ...q, zj: [...ZD], ds: true };
  const t = today(), first = mode === 'zjazd' ? ad(t, (6 - iso(t) + 7) % 7) : ad(t, 1 - iso(t));
  return { ...q, zj: Array.from({ length: N }, (_, i) => ymd(ad(first, i * 7))), ds: false };
}

// Model pochodny: bloki z indeksem i zbiorem tygodni, mapowanie daty na zjazd lub termin.
export function buildModel(p) {
  const ev = p.ev.map((e, i) => ({ ...e, i, w: wk(e.weeks) })), mode = modeOf(ev), span = mode === 'zjazd' ? 2 : 7, tm = mode === 'tyg' && !!p.tm;
  const loc = (d) => {
    if (tm) {
      const k = ymd(d), t = TM[k];
      if (t) return { n: t.n, day: t.day, ev: ev.filter((e) => e.day === t.day && e.w.has(t.n)) };
      if (k >= TM_START && k <= TM_END) return null; // dzień wolny od zajęć
    }
    for (let i = 0; i < p.zj.length; i++) {
      const o = Math.round((d - pd(p.zj[i])) / 864e5);
      if (o >= 0 && o < span) return { n: i + 1, day: iso(d), ev: ev.filter((e) => e.day === iso(d) && e.w.has(i + 1)) };
    }
    return null;
  };
  const classDays = () => {
    const base = tm ? Object.keys(TM).map(pd) : p.zj.flatMap((z) => Array.from({ length: span }, (_, o) => ad(pd(z), o)));
    return base.filter((d) => { const L = loc(d); return L && L.ev.length; }).sort((a, b) => a - b);
  };
  const t0 = ev.length ? Math.floor(Math.min(...ev.map((e) => m(e.start))) / 60) * 60 : 0;
  const t1 = ev.length ? Math.ceil(Math.max(...ev.map((e) => m(e.end))) / 60) * 60 : 0;
  return { ev, mode, span, loc, classDays, t0, t1, N: p.zj.length };
}
export const zFor = (zj, span, d) => { const i = zj.findIndex((z) => ad(pd(z), span - 1) >= d); return i < 0 ? Math.max(0, zj.length - 1) : i; };
export const snapDay = (model, c) => {
  const L = model.loc(c); if (L && L.ev.length) return c;
  const cd = model.classDays(); return cd.find((d) => d >= today()) || cd[0] || c;
};

// ---- zapis lokalny i w koncie Claude (działa tylko w claude.ai)
export const snap = (p) => ({ ev: p.ev, meta: p.meta, zj: p.zj, ds: p.ds, demo: false, zv: 2, ts: p.ts || 0, tm: p.tm === undefined ? null : p.tm });
export function adopt(j) {
  if (!(j && Array.isArray(j.ev)) || j.demo) return null;
  return { ev: j.ev, meta: j.meta || EMPTY.meta, zj: Array.isArray(j.zj) ? j.zj : [], ds: !!j.ds, ts: j.ts || 0, tm: j.tm == null ? undefined : !!j.tm };
}
export const load = () => { try { return adopt(JSON.parse(localStorage.getItem(LS))); } catch { return null; } };
export const persist = (p) => { try { localStorage.setItem(LS, JSON.stringify(snap(p))); } catch { /* brak dostępu do storage */ } };
export const cloud = {
  ref: null, t: 0,
  push(p) { if (!this.ref) return; clearTimeout(this.t); this.t = setTimeout(() => this.ref.set(snap(p)).catch(() => {}), 600); },
};

// ---- skanowanie: Claude (sample) w claude.ai albo własna usługa (Worker) poza nim
export const PROMPT = `Na obrazie jest tygodniowy plan zajęć uczelni (wiersze = dni, kolumny = godziny). Odczytaj WSZYSTKIE bloki zajęć. Zwróć wyłącznie JSON:
{"title":"nazwa planu, np. semestr","group":"grupa z nagłówka","events":[{"day":1-7 (1=poniedziałek, 6=sobota, 7=niedziela),"start":"HH:MM","end":"HH:MM","type":"Wykład|Laboratorium|Ćwiczenia|Wykład+laboratorium|...","weeks":"tekst z 'Tygodnie:' np. 1-5 albo 1-4, 6-8 (dla 'Tydz. 1' wpisz 1)","title":"nazwa przedmiotu","room":"sala","teacher":"prowadzący","group":"grupy z bloku","note":"dodatkowe uwagi, np. 'zajęcia bez przerwy'"}]}
Godziny: start to lewa etykieta pierwszej kolumny zajmowanej przez blok, end to prawa etykieta ostatniej kolumny (kolumny to 08:15–09:00, 09:15–10:00 itd.). Bloki ułożone jedne pod drugimi w tym samym wierszu to osobne zajęcia z różnymi tygodniami. Brak danych = pusty tekst. Nie dodawaj komentarzy.`;
export const SC = () => { try { return JSON.parse(localStorage.getItem(LS + ':scan')) || {}; } catch { return {}; } };
export const saveSC = (c) => { try { localStorage.setItem(LS + ':scan', JSON.stringify(c)); } catch { /* ignoruj */ } };

async function shrink(f) {
  const b = await createImageBitmap(f), k = Math.min(1, 2400 / Math.max(b.width, b.height)), c = document.createElement('canvas');
  c.width = Math.round(b.width * k); c.height = Math.round(b.height * k);
  c.getContext('2d').drawImage(b, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', 0.9).split(',')[1];
}
export const scanMode = (c) => c.mode || 'direct';
export const scanReady = () => { const c = SC(); return scanMode(c) === 'worker' ? !!c.url : !!c.key; };
const pickJson = (text) => {
  const f = (text || '').match(/\{[\s\S]*\}/); if (!f) throw { code: 'invalid_json' };
  try { return JSON.parse(f[0]); } catch { throw { code: 'invalid_json' }; }
};

// Bezpośrednio z przeglądarki do API dostawcy. Klucz użytkownika zostaje w jego przeglądarce.
async function direct(f, c) {
  const img = await shrink(f), claude = c.prov === 'claude', key = c.key.trim();
  const r = await fetch(
    claude ? 'https://api.anthropic.com/v1/messages' : `https://generativelanguage.googleapis.com/v1beta/models/${c.model || 'gemini-3.5-flash'}:generateContent`,
    {
      method: 'POST',
      headers: claude
        ? { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true', 'content-type': 'application/json' }
        : { 'x-goog-api-key': key, 'content-type': 'application/json' },
      body: JSON.stringify(claude
        ? { model: c.model || 'claude-sonnet-5-5', max_tokens: 8000, messages: [{ role: 'user', content: [{ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: img } }, { type: 'text', text: PROMPT }] }] }
        : { contents: [{ parts: [{ inline_data: { mime_type: 'image/jpeg', data: img } }, { text: PROMPT }] }], generationConfig: { responseMimeType: 'application/json' } }),
    },
  );
  let j = {}; try { j = await r.json(); } catch { /* brak treści */ }
  const msg = String((j.error && j.error.message) || '');
  if (!r.ok) {
    if ([400, 401, 403].includes(r.status) && /key|auth|permission|referer/i.test(msg)) throw { code: 'badkey' };
    throw { code: 'http' + r.status, err: msg.slice(0, 140) };
  }
  const text = claude
    ? (j.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('')
    : ((j.candidates && j.candidates[0] && j.candidates[0].content.parts) || []).map((p) => p.text || '').join('');
  return pickJson(text);
}

export async function readPlan(f, sm) {
  if (sm) return sm.json(PROMPT, { images: [f], modelTier: 'default' });
  const c = SC();
  if (scanMode(c) === 'direct') { if (!c.key) throw { code: 'nokey' }; return direct(f, c); }
  if (!c.url) throw { code: 'nourl' };
  const r = await fetch(c.url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-access-code': c.code || '' },
    body: JSON.stringify({ image: await shrink(f), mediaType: 'image/jpeg', prompt: PROMPT, provider: c.prov || 'auto' }),
  });
  if (!r.ok) { let j = {}; try { j = await r.json(); } catch { /* brak treści */ } throw { code: 'http' + r.status, err: j.error }; }
  return r.json();
}
const ERR = {
  not_granted: 'Odczyt wymaga zgody na użycie Claude — zezwól i spróbuj ponownie.', rate_limited: 'Za dużo zapytań. Spróbuj za chwilę.',
  image_rejected: 'Nie mogę przetworzyć tego pliku. Użyj PNG, JPG lub WebP.', invalid_json: 'Odpowiedź była niepełna. Spróbuj jeszcze raz.',
  nourl: 'Nie ustawiono usługi skanowania.', nokey: 'Nie ustawiono klucza API.', badkey: 'Dostawca odrzucił klucz API. Sprawdź klucz oraz ewentualne ograniczenia domeny.', http403: 'Zły kod dostępu do usługi skanowania.', http429: 'Za dużo zapytań do usługi skanowania.',
};
export function scanError(e) {
  if (e && e.err === 'provider_unavailable') return 'Wybrany dostawca nie ma klucza w usłudze skanowania. Zmień dostawcę lub dodaj klucz.';
  return ERR[e && e.code] || (e && /^http/.test(e.code || '') ? `Usługa skanowania zwróciła błąd (${e.code.slice(4)}${e.err ? ': ' + e.err : ''}).`
    : e instanceof TypeError ? 'Brak połączenia z usługą skanowania. Sprawdź internet, adres usługi i ustawienia CORS.'
    : 'Nie udało się odczytać planu. Spróbuj ostrzejszego zrzutu całej tabeli.');
}
