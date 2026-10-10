import { useState, useEffect, useMemo, useRef } from 'react';
import { LS, EMPTY, iso, pd, ad, F, ymd, today, norm, validZj, fixZj, buildModel, zFor, snapDay, modeOf, adopt, load, persist, cloud, scanReady, readPlan, scanError } from './lib.js';
import { tr, I, dn } from './i18n.js';
import { Grid, Month } from './views.jsx';
import { Modal, PlanDialog, EditDialog, DatesDialog } from './dialogs.jsx';

const VIEWS = ['zjazd', 'day', 'week', 'month'];
const ui = () => { try { return JSON.parse(localStorage.getItem(LS + ':ui')) || {}; } catch { return {}; } };

function useNow() {
  const [n, setN] = useState(() => new Date());
  useEffect(() => { const t = setInterval(() => setN(new Date()), 30000); return () => clearInterval(t); }, []);
  return n;
}

export default function App() {
  const [plan, setPlan] = useState(() => fixZj(load() || EMPTY));
  const [view, setView] = useState(() => (VIEWS.includes(ui().v) ? ui().v : 'zjazd'));
  const [all, setAll] = useState(!!ui().a);
  const [theme, setTheme] = useState(() => { try { return localStorage.getItem(LS + ':theme') || 'auto'; } catch { return 'auto'; } });
  const [lang, setLang] = useState(() => { try { return localStorage.getItem(LS + ':lang') === 'en' ? 'en' : 'pl'; } catch { return 'pl'; } });
  I.lang = lang; // język dla tr() i formatowania dat w tym renderze
  const model = useMemo(() => buildModel(plan), [plan]);
  const tyg = model.mode === 'tyg', v = tyg && view === 'zjazd' ? 'week' : view; // plan dzienny nie ma widoku zjazdu
  const [zi, setZi] = useState(() => zFor(plan.zj, model.span, today()));
  const [cur, setCur] = useState(today);
  const [dlg, setDlg] = useState(null); // 'plan' | 'dates' | { i } (edycja bloku, i = -1 dla nowego)
  const [msg, setMsg] = useState('');
  const [sm, setSm] = useState(null); // Claude "sample" (tylko w claude.ai)
  const now = useNow(), file = useRef(), planRef = useRef(plan);
  planRef.current = plan;

  const jump = (p) => setZi(zFor(p.zj, modeOf(p.ev) === 'zjazd' ? 2 : 7, today()));
  const commit = (p) => { p = fixZj({ ...p, ts: Date.now() }); setPlan(p); persist(p); cloud.push(p); return p; };

  useEffect(() => { try { localStorage.setItem(LS + ':ui', JSON.stringify({ v: view, a: all })); } catch { /* */ } }, [view, all]);
  useEffect(() => {
    const r = document.documentElement;
    if (theme === 'auto') delete r.dataset.theme; else r.dataset.theme = theme;
    try { localStorage.setItem(LS + ':theme', theme); } catch { /* */ }
  }, [theme]);
  useEffect(() => { document.documentElement.lang = lang; document.title = tr('appTitle'); try { localStorage.setItem(LS + ':lang', lang); } catch { /* */ } }, [lang]);
  useEffect(() => { if (v === 'day') setCur((c) => snapDay(model, c)); }, []); // eslint-disable-line

  // Odczyt obrazu przez Claude i synchronizacja z kontem — tylko wewnątrz claude.ai.
  useEffect(() => {
    const c = window.claude; if (!c) return;
    let off = false;
    c.use('sample').then(async (s) => { try { if (s && (await s.limits()).images && !off) setSm(s); } catch { /* */ } }, () => {});
    (async () => {
      try {
        const [db, u] = await Promise.all([c.use('db'), c.use('user')]);
        const id = u && (await u.id()); if (!db || !id || off) return;
        const r = db.doc('data/users/' + id + '/plan'), sn = await r.get(); cloud.ref = r;
        const j = sn.exists ? sn.data() : null, mine = planRef.current;
        const a = j && (j.ts || 0) > (mine.ts || 0) ? adopt(JSON.parse(JSON.stringify(j))) : null;
        if (a) { const p = fixZj(a); setPlan(p); persist(p); jump(p); }
        else if ((!j || (j.ts || 0) < (mine.ts || 0)) && (mine.ev.length || mine.ts)) cloud.push(mine);
      } catch { /* brak konta lub uprawnień */ }
    })();
    return () => { off = true; };
  }, []);

  const applyPlan = (ev, r, text) => {
    const p = commit({ ...plan, ev, tm: undefined, meta: { title: r.title || '', group: r.group || '' }, ...(validZj(r.zj) ? { zj: r.zj, ds: true } : {}) });
    setView('zjazd'); jump(p); setMsg(text);
  };
  const scan = async (f) => {
    setMsg(tr('scanning'));
    try {
      const r = await readPlan(f, sm, setMsg), ev = (r.events || []).map(norm).filter(Boolean);
      if (!ev.length) throw { code: 'empty' };
      applyPlan(ev, r, tr('loaded', { n: ev.length }));
    } catch (e) { setMsg(scanError(e)); }
  };
  const pickFile = () => (sm || scanReady() ? file.current.click() : setDlg('plan'));

  const empty = !plan.ev.length, lab = model.mode === 'zjazd' ? tr('labSession') : tr('labTerm');
  const title = plan.meta.title && plan.meta.title !== 'Plan zajęć' ? plan.meta.title : tr('appTitle');
  const zz = Math.min(zi, Math.max(0, model.N - 1));
  const dcol = (d, short) => {
    const L = model.loc(d);
    return { h1: dn(iso(d) - 1), h2: F(d, { day: 'numeric', month: short ? 'short' : 'long' }) + (L ? ` · ${lab} ${L.n}${L.day !== iso(d) ? ' · ' + tr('asDay', { d: dn(L.day - 1).toLowerCase() }) : ''}` : ''), ev: L ? L.ev : [], td: ymd(d) === ymd(today()) };
  };
  const step = (n) => {
    if (v === 'zjazd') setZi(Math.min(model.N - 1, Math.max(0, zz + n)));
    else if (v === 'day') { const c = model.classDays(), t = n > 0 ? c.find((d) => d > cur) : [...c].reverse().find((d) => d < cur); setCur(t || ad(cur, n)); }
    else if (v === 'week') setCur(ad(cur, 7 * n));
    else setCur(new Date(cur.getFullYear(), cur.getMonth() + n, 1));
  };
  const goView = (v) => { setView(v); if (v === 'day') setCur((c) => snapDay(model, c)); };
  const grid = (cols) => <Grid cols={cols} t0={model.t0} t1={model.t1} now={now} onEdit={(i) => setDlg({ i })} />;

  let nav = null, body = null;
  if (!empty) {
    const arrows = <><button aria-label={tr('back')} onClick={() => step(-1)}>‹</button><button aria-label={tr('next')} onClick={() => step(1)}>›</button></>;
    if (v === 'zjazd') {
      const b = pd(plan.zj[zz]);
      nav = <>{arrows}
        <select aria-label={tr('tabSession')} value={zz} onChange={(e) => setZi(+e.target.value)}>
          {plan.zj.map((z, i) => <option key={i} value={i}>{model.mode === 'zjazd' ? tr('tabSession') : tr('tabWeek')} {i + 1} — {F(pd(z), { day: 'numeric', month: 'short' })}</option>)}
        </select>
        <span className="lbl">{F(b, { day: 'numeric' })}–{F(ad(b, model.span - 1), { day: 'numeric', month: 'long' })}</span></>;
      body = grid(Array.from({ length: model.span }, (_, o) => dcol(ad(b, o))));
    } else if (v === 'day') {
      const L = model.loc(cur), nx = model.classDays().find((d) => d > cur);
      nav = <>{arrows}<input type="date" aria-label={tr('date')} value={ymd(cur)} onChange={(e) => e.target.value && setCur(pd(e.target.value))} />
        <span className="lbl">{F(cur, { weekday: 'long', day: 'numeric', month: 'long' })}</span></>;
      body = L && L.ev.length ? grid([dcol(cur)])
        : <div className="empty">{tr('noClassesDay')}{nx && <><br /><br /><button onClick={() => setCur(nx)}>{tr('nextClasses')}{F(nx, { weekday: 'long', day: 'numeric', month: 'long' })}</button></>}</div>;
    } else if (v === 'week') {
      const mo = ad(cur, 1 - iso(cur)), used = new Set(model.ev.map((e) => e.day)), full = all || tyg;
      const cs = [0, 1, 2, 3, 4, 5, 6].filter((k) => full || used.has(k + 1)).map((k) => dcol(ad(mo, k), true));
      nav = <>{arrows}<span className="lbl">{F(mo, { day: 'numeric', month: 'short' })} – {F(ad(mo, 6), { day: 'numeric', month: 'short', year: 'numeric' })}</span>
        {!tyg && <label><input type="checkbox" checked={all} onChange={(e) => setAll(e.target.checked)} /> {tr('fullWeek')}</label>}</>;
      body = <>{!cs.some((c) => c.ev.length) && <div className="empty" style={{ marginBottom: 12 }}>{tr('noClassesWeek')}</div>}{grid(cs)}</>;
    } else {
      nav = <>{arrows}<span className="lbl">{F(new Date(cur.getFullYear(), cur.getMonth(), 1), { month: 'long', year: 'numeric' })}</span></>;
      body = <Month cur={cur} model={model} label={lab} onPick={(d) => { setCur(d); setView('day'); }} />;
    }
  }

  const ed = dlg && dlg.i !== undefined ? dlg : null;
  return (
    <div className="w">
      <header>
        <div><h1>{title}</h1>
          <div className="sub">{empty ? tr('noPlan') : [plan.meta.group, tr('blocks', { n: plan.ev.length })].filter(Boolean).join(' · ')}</div></div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={() => setDlg('plan')}>{tr('planBtn')}</button>
          {!empty && !(tyg && plan.tm) && <button onClick={() => setDlg('dates')}>{tyg ? tr('weeksBtn') : tr('datesBtn')}</button>}
          <span className="seg" role="group" aria-label={tr('lang')}>
            {['pl', 'en'].map((l) => <button key={l} className={lang === l ? 'on' : ''} aria-pressed={lang === l} onClick={() => setLang(l)}>{l.toUpperCase()}</button>)}
          </span>
          <span className="seg" role="group" aria-label={tr('theme')}>
            {['auto', 'light', 'dark'].map((k) => <button key={k} className={theme === k ? 'on' : ''} aria-pressed={theme === k} onClick={() => setTheme(k)}>{tr(k)}</button>)}
          </span>
        </div>
      </header>
      <input ref={file} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => { const f = e.target.files[0]; e.target.value = ''; if (f) scan(f); }} />
      <div id="st" role="status">{msg}</div>
      {empty ? (
        <div className="empty"><b style={{ fontSize: 18, color: 'var(--fg)' }}>{tr('emptyTitle')}</b><br /><br />
          {tr('emptyText')}<br /><br />
          <button className="on" onClick={pickFile}>{tr('pickImage')}</button> <button onClick={() => setDlg({ i: -1 })}>{tr('addManual')}</button> <button onClick={() => setDlg('plan')}>{tr('moreOpts')}</button></div>
      ) : (
        <>
          {!plan.ds && <div className="hint">{tyg ? tr('hintTerm') : tr('hintSession')}</div>}
          <div className="tabs">
            {[['zjazd', model.mode === 'zjazd' ? tr('tabSession') : tr('tabTerm')], ['day', tr('tabDay')], ['week', tr('tabWeek')], ['month', tr('tabMonth')]].filter(([k]) => !(tyg && k === 'zjazd')).map(([k, lbl]) => <button key={k} className={v === k ? 'on' : ''} onClick={() => goView(k)}>{lbl}</button>)}
          </div>
          <div className="bar">{nav}<span className="sp" /><button onClick={() => { setCur(today()); setZi(zFor(plan.zj, model.span, today())); }}>{tr('today')}</button></div>
          <main>{body}</main>
        </>
      )}

      <Modal open={dlg === 'plan'} onClose={() => setDlg((d) => (d === 'plan' ? null : d))}>
        <PlanDialog plan={plan} sm={sm} onClose={() => setDlg(null)} onAdd={() => setDlg({ i: -1 })}
          onScan={() => { setDlg(null); file.current.click(); }}
          onImport={(ev, r) => { setDlg(null); applyPlan(ev, r, tr('imported', { n: ev.length })); }} />
      </Modal>
      <Modal open={dlg === 'dates'} onClose={() => setDlg((d) => (d === 'dates' ? null : d))}>
        <DatesDialog plan={plan} mode={model.mode} onClose={() => setDlg(null)}
          onSave={(zj) => { const p = commit({ ...plan, zj, ds: true }); jump(p); setDlg(null); }}
          onDelete={() => { commit({ ...EMPTY }); setDlg(null); }} />
      </Modal>
      <Modal open={!!ed} onClose={() => setDlg((d) => (d && d.i !== undefined ? null : d))}>
        {ed && <EditDialog ev={ed.i >= 0 ? plan.ev[ed.i] : null} onClose={() => setDlg(null)}
          onSave={(n) => { const ev = [...plan.ev]; if (ed.i >= 0) ev[ed.i] = n; else ev.push(n); const had = plan.zj.length, p = commit({ ...plan, ev }); if (!had) jump(p); setDlg(null); }}
          onDelete={() => { commit({ ...plan, ev: plan.ev.filter((_, j) => j !== ed.i) }); setDlg(null); }} />}
      </Modal>
    </div>
  );
}
