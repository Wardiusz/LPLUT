import { useState, useEffect, useRef } from 'react';
import { m, norm, SC, saveSC, scanMode, scanReady, ymd, pd, ad } from './lib.js';
import { tr, dayList } from './i18n.js';

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
  const scan = () => (sm || scanReady() ? onScan() : setPe(tr('needSetup')));
  const exp = () => {
    const j = JSON.stringify({ title: plan.meta.title, group: plan.meta.group, zj: plan.zj, events: plan.ev }, null, 1);
    setJs(j);
    const manual = () => setPe(tr('copyManual'));
    try { navigator.clipboard.writeText(j).then(() => setPe(tr('copied')), manual); } catch { manual(); }
  };
  const imp = () => {
    let r; try { r = JSON.parse(js); } catch { setPe(tr('badJson')); return; }
    if (Array.isArray(r)) r = { events: r };
    const ev = (r.events || []).map(norm).filter(Boolean);
    if (!ev.length) { setPe(tr('noBlocks')); return; }
    onImport(ev, r);
  };
  return (
    <>
      <b>{tr('pdTitle')}</b>
      <div style={{ display: 'grid', gap: 8, margin: '12px 0' }}>
        <button onClick={scan}>{tr('scanImg')}</button>
        <button onClick={onAdd}>{tr('addBlock')}</button>
      </div>
      <details>
        <summary>{tr('expImp')}</summary>
        <p className="sub" style={{ margin: '4px 0' }}>{tr('expImpHelp')}</p>
        <textarea rows={6} spellCheck={false} value={js} onChange={(e) => setJs(e.target.value)} />
        <div style={{ display: 'flex', gap: 8, marginTop: 6 }}><button onClick={exp}>{tr('exportBtn')}</button><button onClick={imp}>{tr('importBtn')}</button></div>
      </details>
      {!sm && (
        <details ref={svc}>
          <summary>{tr('scanSettings')}</summary>
          <div style={{ display: 'grid', gap: 6, marginTop: 6 }}>
            <label className="sub">{tr('mode')}
              <select style={{ width: '100%', marginTop: 2 }} value={c.mode} onChange={(e) => setC({ ...c, mode: e.target.value })}>
                <option value="direct">{tr('modeDirect')}</option>
                <option value="worker">{tr('modeWorker')}</option>
              </select>
            </label>
            <label className="sub">{tr('provider')}
              <select style={{ width: '100%', marginTop: 2 }} value={c.mode === 'direct' && c.prov === 'auto' ? 'gemini' : c.prov} onChange={(e) => setC({ ...c, prov: e.target.value })}>
                {c.mode === 'worker' && <option value="auto">{tr('provAuto')}</option>}
                <option value="gemini">Gemini</option><option value="claude">Claude</option>
              </select>
            </label>
            {c.mode === 'direct' ? (
              <>
                <input type="password" placeholder={tr('apiKey')} autoComplete="off" value={c.key} onChange={(e) => setC({ ...c, key: e.target.value })} />
                <input placeholder={tr('modelOpt')} autoComplete="off" value={c.model} onChange={(e) => setC({ ...c, model: e.target.value })} />
                <input placeholder={tr('fallbackModel')} autoComplete="off" value={c.fallback} onChange={(e) => setC({ ...c, fallback: e.target.value })} />
                <p className="sub" style={{ margin: 0 }}>{tr('keyNote')}</p>
              </>
            ) : (
              <>
                <input placeholder="https://…workers.dev" autoComplete="off" value={c.url} onChange={(e) => setC({ ...c, url: e.target.value })} />
                <input type="password" placeholder={tr('accessCode')} autoComplete="off" value={c.code} onChange={(e) => setC({ ...c, code: e.target.value })} />
              </>
            )}
            <button onClick={() => {
              const url = c.url.trim(), key = c.key.trim();
              if (c.mode === 'worker' && !/^https:\/\//.test(url)) { setPe(tr('urlHttps')); return; }
              if (c.mode === 'worker' && /(gemini|aistudio)\.google\.com|anthropic\.com/.test(url)) { setPe(tr('urlProvider')); return; }
              if (c.mode === 'direct' && !key) { setPe(tr('pasteKey')); return; }
              saveSC({ ...c, key, url, model: c.model.trim(), fallback: c.fallback.trim() });
              setPe(c.mode === 'direct' && c.prov !== 'claude' && !key.startsWith('AIza') ? tr('geminiKeyWarn') : tr('saved'));
            }}>{tr('save')}</button>
          </div>
        </details>
      )}
      <div className="msg" role="status">{pe}</div>
      <div style={{ textAlign: 'right' }}><button onClick={onClose}>{tr('close')}</button></div>
    </>
  );
}

const FL = () => [['title', 'fTitle'], ['day', 'fDay'], ['start', 'fStart'], ['end', 'fEnd'], ['type', 'fType'], ['weeks', 'fWeeks'], ['room', 'fRoom'], ['teacher', 'fTeacher'], ['group', 'fGroup'], ['note', 'fNote']];

export function EditDialog({ ev, onSave, onDelete, onClose }) {
  const [f, setF] = useState(() => ev || { day: 6, start: '08:15', end: '10:00', type: tr('defType'), weeks: '', title: '', room: '', teacher: '', group: '', note: '' });
  const [err, setErr] = useState('');
  const save = () => {
    const n = norm(f);
    if (!n || m(n.end) <= m(n.start)) { setErr(tr('timeErr')); return; }
    onSave(n);
  };
  return (
    <>
      <b>{ev ? tr('editBlock') : tr('newBlock')}</b>
      <div className="zl ef">
        {FL().map(([k, l]) => (
          <label key={k}>{tr(l)}
            {k === 'day'
              ? <select value={f.day} onChange={(e) => setF({ ...f, day: +e.target.value })}>{dayList().map((d, j) => <option key={j} value={j + 1}>{d}</option>)}</select>
              : <input type={k === 'start' || k === 'end' ? 'time' : 'text'} value={f[k] || ''} onChange={(e) => setF({ ...f, [k]: e.target.value })} />}
          </label>
        ))}
      </div>
      <div className="msg" role="status">{err}</div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', flexWrap: 'wrap' }}>
        {ev ? <button onClick={onDelete}>{tr('delBlock')}</button> : <span />}
        <span><button onClick={onClose}>{tr('cancel')}</button> <button className="on" onClick={save}>{tr('save')}</button></span>
      </div>
    </>
  );
}

export function DatesDialog({ plan, mode, onSave, onDelete, onClose }) {
  const [z, setZ] = useState(plan.zj), [step, setStep] = useState(7), [sure, setSure] = useState(false);
  const fill = () => { if (!z[0]) return; const a = pd(z[0]); setZ(z.map((_, i) => ymd(ad(a, i * (+step || 7))))); };
  return (
    <>
      <b>{mode === 'zjazd' ? tr('datesTitle') : tr('weeksTitle')}</b>
      <p className="sub" style={{ margin: '4px 0' }}>{mode === 'zjazd' ? tr('datesHelpS') : tr('datesHelpW')}</p>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        {tr('every')} <input type="number" min="1" max="60" style={{ width: 64 }} value={step} onChange={(e) => setStep(e.target.value)} /> {tr('daysFrom')} <button onClick={fill}>{tr('fillBtn')}</button>
      </div>
      <div className="zl">
        {z.map((d, i) => <label key={i}>{i + 1}.<input type="date" value={d} onChange={(e) => setZ(z.map((x, j) => (j === i ? e.target.value : x)))} /></label>)}
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <button onClick={() => (sure ? onDelete() : setSure(true))}>{sure ? tr('sure') : tr('delPlan')}</button>
        <span><button onClick={onClose}>{tr('cancel')}</button> <button className="on" onClick={() => onSave(z.map((x, i) => x || plan.zj[i]))}>{tr('save')}</button></span>
      </div>
    </>
  );
}
