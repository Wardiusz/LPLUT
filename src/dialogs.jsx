import { useState, useEffect, useRef } from 'react';
import { DAYS, m, norm, SC, saveSC, ymd, pd, ad } from './lib.js';

// <dialog> sterowany właściwością `open`; zawartość montuje się tylko przy otwarciu.
export function Modal({ open, onClose, children }) {
  const r = useRef();
  useEffect(() => { const d = r.current; if (open && !d.open) d.showModal(); if (!open && d.open) d.close(); }, [open]);
  return <dialog ref={r} onClose={onClose}>{open ? children : null}</dialog>;
}

export function PlanDialog({ plan, sm, onScan, onAdd, onImport, onClose }) {
  const [js, setJs] = useState(''), [pe, setPe] = useState('');
  const [c, setC] = useState(() => ({ url: '', code: '', prov: 'auto', ...SC() }));
  const svc = useRef();
  useEffect(() => { if (svc.current && !SC().url) svc.current.open = true; }, []);
  const scan = () => (sm || SC().url ? onScan() : setPe('Najpierw ustaw usługę skanowania albo dodaj zajęcia ręcznie.'));
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
          <summary>Usługa skanowania</summary>
          <p className="sub" style={{ margin: '4px 0' }}>Poza Claude skanowanie wymaga własnej usługi (worker/scan-worker.js).</p>
          <div style={{ display: 'grid', gap: 6 }}>
            <label className="sub">Dostawca AI
              <select style={{ width: '100%', marginTop: 2 }} value={c.prov} onChange={(e) => setC({ ...c, prov: e.target.value })}>
                <option value="auto">Auto (według kluczy w usłudze)</option><option value="claude">Claude</option><option value="gemini">Gemini</option>
              </select>
            </label>
            <input placeholder="https://…workers.dev" autoComplete="off" value={c.url} onChange={(e) => setC({ ...c, url: e.target.value })} />
            <input type="password" placeholder="Kod dostępu" autoComplete="off" value={c.code} onChange={(e) => setC({ ...c, code: e.target.value })} />
            <button onClick={() => { saveSC({ ...c, url: c.url.trim() }); setPe('Zapisano.'); }}>Zapisz</button>
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

export function DatesDialog({ plan, onSave, onDelete, onClose }) {
  const [z, setZ] = useState(plan.zj), [step, setStep] = useState(7), [sure, setSure] = useState(false);
  const fill = () => { if (!z[0]) return; const a = pd(z[0]); setZ(z.map((_, i) => ymd(ad(a, i * (+step || 7))))); };
  return (
    <>
      <b>Terminy zjazdów</b>
      <p className="sub" style={{ margin: '4px 0' }}>Data pierwszego dnia każdego zjazdu (sobota). Dopasuj do harmonogramu uczelni.</p>
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
