import { m, hue, ad, iso, ymd, today } from './lib.js';
import { tr, dayList } from './i18n.js';

const P = 1.15; // px na minutę

// Układa nakładające się bloki w kolumnach obok siebie.
function lanes(es) {
  const s = [...es].sort((a, b) => m(a.start) - m(b.start) || m(b.end) - m(a.end)), L = [];
  const r = s.map((e) => { let i = L.findIndex((x) => x <= m(e.start)); if (i < 0) i = L.length; L[i] = m(e.end); return { e, l: i }; });
  return r.map((x) => ({ ...x, n: L.length || 1 }));
}

export function Grid({ cols, t0, t1, now, onEdit }) {
  const H = (t1 - t0) * P, hours = [];
  for (let t = t0; t <= t1; t += 60) hours.push(t);
  const nm = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
  const hm = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
  const y = (nm - t0) * P;
  return (
    <div className="tg" style={{ '--hh': 60 * P + 'px', ...(cols.length >= 5 && { '--mw': '112px' }) }}>
      <div className="ax">
        <div className="ch" />
        <div className="ab" style={{ height: H }}>
          {hours.map((t) => <i key={t} style={{ top: (t - t0) * P }}>{String(t / 60).padStart(2, '0')}:00</i>)}
        </div>
      </div>
      {cols.map((c, k) => (
        <div className="col" key={k}>
          <div className="ch"><b>{c.h1}</b><small>{c.h2}</small></div>
          <div className="cb" style={{ height: H }}>
            {lanes(c.ev).map(({ e, l, n }) => {
              const h = (m(e.end) - m(e.start)) * P, live = c.td && nm >= m(e.start) && nm < m(e.end);
              return (
                <div key={e.i} className={'ev' + (h < 80 ? ' s' : '') + (live ? ' live' : '')} onClick={() => onEdit(e.i)}
                  style={{ top: (m(e.start) - t0) * P, height: h - 2, left: (l / n) * 100 + '%', width: 100 / n + '%', '--h': hue(e.title) }}>
                  <b>{e.title}</b>
                  <span>{e.start}–{e.end} · {e.type}</span>
                  {e.room && <span>{e.room}</span>}
                  <span className="t">{e.teacher}</span>
                  {e.note && <span className="t">{e.note}</span>}
                  <span className="t">{tr('wk')} {e.weeks}</span>
                </div>
              );
            })}
            {c.td && y >= 0 && y <= H && <div className="now" data-t={hm} style={{ top: y }} />}
          </div>
        </div>
      ))}
    </div>
  );
}

export function Month({ cur, model, label, onPick }) {
  const f = new Date(cur.getFullYear(), cur.getMonth(), 1), st = ad(f, 1 - iso(f));
  const n = Math.ceil((iso(f) - 1 + new Date(f.getFullYear(), f.getMonth() + 1, 0).getDate()) / 7) * 7;
  return (
    <div className="mg">
      {dayList().map((d) => <div className="dh" key={d}>{d.slice(0, 3)}</div>)}
      {Array.from({ length: n }, (_, i) => {
        const d = ad(st, i), L = model.loc(d), ev = L ? [...L.ev].sort((a, b) => m(a.start) - m(b.start)) : [];
        return (
          <div key={i} className={'c' + (d.getMonth() !== f.getMonth() ? ' o' : '') + (ev.length ? ' z' : '')} onClick={() => onPick(d)}>
            <div className={'n' + (ymd(d) === ymd(today()) ? ' td' : '')}>{d.getDate()}{ev.length > 0 && <em>{label} {L.n}</em>}</div>
            {ev.map((e) => <div className="chip" key={e.i} style={{ '--h': hue(e.title) }} title={e.title}>{e.start} {e.title}</div>)}
          </div>
        );
      })}
    </div>
  );
}
