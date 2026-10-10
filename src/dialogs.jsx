import { useState, useEffect, useRef } from 'react';
import { DAYS, m, norm, SC, saveSC, scanMode, scanReady, ymd, pd, ad } from './lib.js';

// <dialog> sterowany właściwością `open`; zawartość montuje się tylko przy otwarciu.
export function Modal({ open, onClose, children }) {
  const r = useRef();
  useEffect(() => { const d = r.current; if (open && !d.open) d.showModal(); if (!open && d.open) d.close(); }, [open]);
  return <dialog ref={r} onClose={onClose}>{open ? children : null}</dialog>;
}

export function PlanDialog({ plan, sm, onScan, onAdd, onImport, onClose }) {
  const [js, setJs] = useState(''), [pe, setPe] = useState('');
  const [c, setC] = useState(() => { const s = SC(); return { prov: 'gemini', key: '', model: '', fallback: '', url: '', code: '', ...s, mode: scanMode(s) }; });
  const svc = useRef();
  useEffect(() => { if (svc.current && !scanReady()) svc.current.open = true; }, []);
  const scan = () => (sm || scanReady() ? onScan() : setPe('Najpierw ustaw klucz API lub usługę skanowania i kliknij Zapisz albo dodaj zajęcia ręcznie.'));
  const exp = () => {
    const j = JSON.stringify({ title: plan.meta.title, group: plan.meta.group, zj: plan.zj, events: plan.ev }, null, 1);
    setJs(j);
    const manual = () => setPe('Zaznacz tekst i skopiuj go (Ctrl/Cmd+C).');
    try { navigator.clipboard.writeText(j).then(() => setPe('Skopiowano do schowka.'), manual); } catch { manual(); }
  };
  const imp = () => {
    let r; try { r = JSON.parse(js); } catch { setPe('To nie jest poprawny JSON.'); return; }
    if (Array.isArray(r)) r = { events: r };
    const ev = (r.events || []).map(norm).filter(Boolean);
    if (!ev.length) { setPe('Nie znalazłem w tekście żadnych bloków zajęć.'); return; }
    onImport(ev, r);
  };
  return (
    <>
      <b>Plan zajęć</b>
      <div style={{ display: 'grid', gap: 8, margin: '12px 0' }}>
        <button onClick={scan}>Skanuj plan z obrazu</button>
        <button onClick={onAdd}>Dodaj blok ręcznie</button>
      </div>
      <details>
        <summary>Eksport i import (JSON)</summary>
        <p className="sub" style={{ margin: '4px 0' }}>Przenieś plan między urządzeniami albo wklej gotowy. Import zastępuje bieżący plan.</p>
        <textarea rows={6} spellCheck={false} value={js} onChange={(e) => setJs(e.target.value)} />
        <div style={{ display: 'flex', gap: 8, marginTop: 6 }}><button onClick={exp}>Wyeksportuj</button><button onClick={imp}>Importuj z pola</button></div>
      </details>
      {!sm && (
        <details ref={svc}>
          <summary>Skanowanie obrazu (poza Claude)</summary>
          <div style={{ display: 'grid', gap: 6, marginTop: 6 }}>
            <label className="sub">Tryb
              <select style={{ width: '100%', marginTop: 2 }} value={c.mode} onChange={(e) => setC({ ...c, mode: e.target.value })}>
                <option value="direct">Bezpośrednio, z własnym kluczem API</option>
                <option value="worker">Przez własną usługę (Worker)</option>
              </select>
            </label>
            <label className="sub">Dostawca AI
              <select style={{ width: '100%', marginTop: 2 }} value={c.mode === 'direct' && c.prov === 'auto' ? 'gemini' : c.prov} onChange={(e) => setC({ ...c, prov: e.target.value })}>
                {c.mode === 'worker' && <option value="auto">Auto (według kluczy w usłudze)</option>}
                <option value="gemini">Gemini</option><option value="claude">Claude</option>
              </select>
            </label>
            {c.mode === 'direct' ? (
              <>
                <input type="password" placeholder="Klucz API" autoComplete="off" value={c.key} onChange={(e) => setC({ ...c, key: e.target.value })} />
                <input placeholder="Model (opcjonalnie)" autoComplete="off" value={c.model} onChange={(e) => setC({ ...c, model: e.target.value })} />
                <input placeholder="Model zapasowy na wypadek przeciążenia (opcjonalnie)" autoComplete="off" value={c.fallback} onChange={(e) => setC({ ...c, fallback: e.target.value })} />
                <p className="sub" style={{ margin: 0 }}>Klucz zapisuje się tylko w tej przeglądarce: nie trafia do repozytorium ani na inne urządzenia. Użyj klucza z niskim limitem.</p>
              </>
            ) : (
              <>
                <input placeholder="https://…workers.dev" autoComplete="off" value={c.url} onChange={(e) => setC({ ...c, url: e.target.value })} />
                <input type="password" placeholder="Kod dostępu" autoComplete="off" value={c.code} onChange={(e) => setC({ ...c, code: e.target.value })} />
              </>
            )}
            <button onClick={() => {
              const url = c.url.trim(), key = c.key.trim();
              if (c.mode === 'worker' && !/^https:\/\//.test(url)) { setPe('Adres usługi musi zaczynać się od https://.'); return; }
              if (c.mode === 'worker' && /(gemini|aistudio)\.google\.com|anthropic\.com/.test(url)) { setPe('To adres strony dostawcy, a nie usługi skanowania. Wybierz tryb „Bezpośrednio” i wklej tylko klucz API.'); return; }
              if (c.mode === 'direct' && !key) { setPe('Wklej klucz API.'); return; }
              saveSC({ ...c, key, url, model: c.model.trim(), fallback: c.fallback.trim() });
              setPe(c.mode === 'direct' && c.prov !== 'claude' && !key.startsWith('AIza') ? 'Zapisano. Uwaga: klucze Gemini zwykle zaczynają się od „AIza”. Skopiuj go z aistudio.google.com/apikey.' : 'Zapisano.');
            }}>Zapisz</button>
          </div>
        </details>
      )}
      <div className="msg" role="status">{pe}</div>
      <div style={{ textAlign: 'right' }}><button onClick={onClose}>Zamknij</button></div>
    </>
  );
}

const FL = [['title', 'Przedmiot'], ['day', 'Dzień'], ['start', 'Początek'], ['end', 'Koniec'], ['type', 'Typ (np. Wykład)'], ['weeks', 'Tygodnie (puste = wszystkie)'], ['room', 'Sala'], ['teacher', 'Prowadzący'], ['group', 'Grupa'], ['note', 'Uwagi']];

export function EditDialog({ ev, onSave, onDelete, onClose }) {
  const [f, setF] = useState(() => ev || { day: 6, start: '08:15', end: '10:00', type: 'Wykład', weeks: '', title: '', room: '', teacher: '', group: '', note: '' });
  const [err, setErr] = useState('');
  const save = () => {
    const n = norm(f);
    if (!n || m(n.end) <= m(n.start)) { setErr('Podaj godzinę rozpoczęcia i późniejszą godzinę zakończenia.'); return; }
    onSave(n);
  };
  return (
    <>
      <b>{ev ? 'Edytuj blok zajęć' : 'Nowy blok zajęć'}</b>
      <div className="zl ef">
        {FL.map(([k, l]) => (
          <label key={k}>{l}
            {k === 'day'
              ? <select value={f.day} onChange={(e) => setF({ ...f, day: +e.target.value })}>{DAYS.map((d, j) => <option key={j} value={j + 1}>{d}</option>)}</select>
              : <input type={k === 'start' || k === 'end' ? 'time' : 'text'} value={f[k] || ''} onChange={(e) => setF({ ...f, [k]: e.target.value })} />}
          </label>
        ))}
      </div>
      <div className="msg" role="status">{err}</div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', flexWrap: 'wrap' }}>
        {ev ? <button onClick={onDelete}>Usuń blok</button> : <span />}
        <span><button onClick={onClose}>Anuluj</button> <button className="on" onClick={save}>Zapisz</button></span>
      </div>
    </>
  );
}

export function DatesDialog({ plan, mode, onSave, onDelete, onClose }) {
  const [z, setZ] = useState(plan.zj), [step, setStep] = useState(7), [sure, setSure] = useState(false);
  const fill = () => { if (!z[0]) return; const a = pd(z[0]); setZ(z.map((_, i) => ymd(ad(a, i * (+step || 7))))); };
  return (
    <>
      <b>{mode === 'zjazd' ? 'Terminy zjazdów' : 'Tygodnie semestru'}</b>
      <p className="sub" style={{ margin: '4px 0' }}>{mode === 'zjazd' ? 'Data pierwszego dnia każdego zjazdu (sobota). Dopasuj do harmonogramu uczelni.' : 'Data poniedziałku każdego tygodnia semestru.'}</p>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        Co <input type="number" min="1" max="60" style={{ width: 64 }} value={step} onChange={(e) => setStep(e.target.value)} /> dni od 1. terminu <button onClick={fill}>Wypełnij</button>
      </div>
      <div className="zl">
        {z.map((d, i) => <label key={i}>{i + 1}.<input type="date" value={d} onChange={(e) => setZ(z.map((x, j) => (j === i ? e.target.value : x)))} /></label>)}
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <button onClick={() => (sure ? onDelete() : setSure(true))}>{sure ? 'Na pewno? Kliknij ponownie' : 'Usuń plan'}</button>
        <span><button onClick={onClose}>Anuluj</button> <button className="on" onClick={() => onSave(z.map((x, i) => x || plan.zj[i]))}>Zapisz</button></span>
      </div>
    </>
  );
}
