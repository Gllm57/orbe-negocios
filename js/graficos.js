// Gráficos de Orbe: barras que crecen, líneas que se dibujan, donas y anillos que se llenan.
import { html, useState, useEffect, useRef, useMemo } from './lib/preact-htm.js';

const COLORES = ['var(--c1)', 'var(--c2)', 'var(--c3)', 'var(--c4)', 'var(--c5)'];
export const color = i => COLORES[i % COLORES.length];
const suave = t => 1 - Math.pow(1 - t, 3);

// Cifra que cuenta desde su valor anterior hasta el nuevo.
export function Monto({ v, f, clase }) {
  const [mostrado, setMostrado] = useState(v);
  const prev = useRef(v);
  useEffect(() => {
    const desde = prev.current, hasta = v; prev.current = v;
    if (desde === hasta || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setMostrado(hasta); return; }
    let raf, t0;
    const paso = t => { if (!t0) t0 = t; const k = Math.min(1, (t - t0) / 700); setMostrado(desde + (hasta - desde) * suave(k)); if (k < 1) raf = requestAnimationFrame(paso); };
    raf = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(raf);
  }, [v]);
  return html`<span class=${'num ' + (clase || '')}>${f(mostrado)}</span>`;
}

// Barras verticales, simples o apiladas. datos: [{ l, v, segs?: [{ v, c }], tip }]
export function Barras({ datos, alto = 160, colorBase = 'var(--c1)', resaltar = -1, hueco = 6 }) {
  const [sel, setSel] = useState(-1);
  const max = Math.max(1e-9, ...datos.map(d => d.v));
  const caja = useRef(null);
  const [globo, setGlobo] = useState(null);
  const mostrar = (i, e) => {
    setSel(i);
    const r = caja.current.getBoundingClientRect(), b = e.currentTarget.getBoundingClientRect();
    const h = Math.max(3, datos[i].v / max * (alto - 20));
    setGlobo({ x: b.left - r.left + b.width / 2, y: alto - 18 - h - 6, txt: datos[i].tip || String(datos[i].v) });
  };
  const quitar = () => { setSel(-1); setGlobo(null); };
  return html`<div class="gr" ref=${caja} onMouseLeave=${quitar}>
    <div class=${'gr-barras' + (sel >= 0 ? ' atenua' : '')} style=${{ height: alto + 'px', '--hueco': hueco + 'px' }} role="img" aria-label=${datos.map(d => d.l + ': ' + (d.tip || d.v)).join(', ')}>
      ${datos.map((d, i) => {
        const h = d.v > 0 ? Math.max(3, d.v / max * (alto - 20)) : 2;
        const segs = d.segs && d.segs.length ? d.segs : [{ v: d.v, c: i === resaltar ? 'var(--c1)' : colorBase }];
        const suma = segs.reduce((a, s) => a + s.v, 0) || 1;
        return html`<button type="button" key=${d.l + i} class=${'col' + (sel === i ? ' on' : '')} onMouseEnter=${e => mostrar(i, e)} onClick=${e => sel === i ? quitar() : mostrar(i, e)} aria-label=${d.l + ': ' + (d.tip || d.v)}>
          <span class="barra" style=${{ height: h + 'px', '--i': i, opacity: d.v > 0 ? 1 : 0.35 }}>
            ${segs.map((s, j) => html`<i key=${j} style=${{ height: (s.v / suma * 100) + '%', background: s.c, opacity: !d.segs && i !== resaltar && resaltar >= 0 ? 0.5 : 1 }}></i>`)}
          </span>
          <span class="eti">${d.l}</span>
        </button>`;
      })}
    </div>
    ${globo && html`<div class="gr-globo" style=${{ left: globo.x + 'px', top: globo.y + 'px' }}>${globo.txt}</div>`}
  </div>`;
}

// Línea con área. datos: [{ l, v, tip }]
export function Linea({ datos, alto = 200, c = 'var(--c1)', etiquetas = 6, id = 'ln' }) {
  const ancho = 600, pad = 8;
  const max = Math.max(1e-9, ...datos.map(d => d.v)) * 1.1;
  const pts = datos.map((d, i) => [pad + i * (ancho - 2 * pad) / Math.max(1, datos.length - 1), alto - 24 - d.v / max * (alto - 40)]);
  const linea = useMemo(() => pts.map((p, i) => {
    if (!i) return 'M' + p[0] + ',' + p[1];
    const a = pts[i - 1], cx = (a[0] + p[0]) / 2;
    return 'C' + cx + ',' + a[1] + ' ' + cx + ',' + p[1] + ' ' + p[0] + ',' + p[1];
  }).join(' '), [datos]);
  const area = linea + ' L' + pts[pts.length - 1][0] + ',' + (alto - 24) + ' L' + pts[0][0] + ',' + (alto - 24) + ' Z';
  const ref = useRef(null), caja = useRef(null);
  const [largo, setLargo] = useState(2000);
  const [sel, setSel] = useState(-1);
  useEffect(() => { if (ref.current && ref.current.getTotalLength) setLargo(Math.ceil(ref.current.getTotalLength())); }, [linea]);
  const mover = e => {
    const r = caja.current.getBoundingClientRect();
    const x = ((e.touches ? e.touches[0].clientX : e.clientX) - r.left) / r.width * ancho;
    let mejor = 0; pts.forEach((p, i) => { if (Math.abs(p[0] - x) < Math.abs(pts[mejor][0] - x)) mejor = i; });
    setSel(mejor);
  };
  const cada = Math.max(1, Math.round(datos.length / etiquetas));
  const p = sel >= 0 ? pts[sel] : null;
  return html`<div class="gr gr-linea" ref=${caja} onMouseMove=${mover} onMouseLeave=${() => setSel(-1)} onTouchStart=${mover} onTouchMove=${mover}>
    <svg viewBox=${'0 0 ' + ancho + ' ' + alto} width="100%" height=${alto} preserveAspectRatio="none" role="img" aria-label=${'Gráfico: ' + datos.map(d => d.l + ' ' + (d.tip || d.v)).join(', ')}>
      <defs><linearGradient id=${'g' + id} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color=${c} stop-opacity="0.32"></stop><stop offset="100%" stop-color=${c} stop-opacity="0"></stop></linearGradient></defs>
      ${[0.25, 0.5, 0.75].map(k => html`<line x1="0" x2=${ancho} y1=${(alto - 24) - k * (alto - 40)} y2=${(alto - 24) - k * (alto - 40)} stroke="var(--line)" stroke-dasharray="3 5" vector-effect="non-scaling-stroke"></line>`)}
      <path key=${'a' + datos.length} class="area" d=${area} fill=${'url(#g' + id + ')'}></path>
      <path key=${'t' + datos.length} ref=${ref} class="trazo" d=${linea} stroke=${c} vector-effect="non-scaling-stroke" style=${{ '--largo': largo }}></path>
      ${p && html`<line x1=${p[0]} x2=${p[0]} y1="8" y2=${alto - 24} stroke="var(--line)" vector-effect="non-scaling-stroke"></line>`}
    </svg>
    ${p && html`<span style=${{ position: 'absolute', left: (p[0] / ancho * 100) + '%', top: p[1] + 'px', width: '12px', height: '12px', margin: '-6px 0 0 -6px', borderRadius: '50%', background: c, border: '3px solid var(--surface)', pointerEvents: 'none' }}></span>
      <div class="gr-globo" style=${{ left: (p[0] / ancho * 100) + '%', top: (p[1] - 10) + 'px' }}>${datos[sel].l} · ${datos[sel].tip || datos[sel].v}</div>`}
    <div style=${{ display: 'flex', justifyContent: 'space-between', marginTop: '-18px', fontSize: '10px', color: 'var(--faint)', padding: '0 2px' }}>
      ${datos.map((d, i) => i % cada === 0 || i === datos.length - 1 ? html`<span>${d.l}</span>` : null)}
    </div>
  </div>`;
}

// Dona por partes. segs: [{ n, v, c }]
export function Dona({ segs, tam = 150, grosor = 18, centro, sub }) {
  const [listo, setListo] = useState(false);
  useEffect(() => { const r = requestAnimationFrame(() => setListo(true)); return () => cancelAnimationFrame(r); }, []);
  const rr = (tam - grosor) / 2, circ = 2 * Math.PI * rr, tot = segs.reduce((a, s) => a + s.v, 0) || 1;
  let acum = 0;
  return html`<svg class="gr-dona" width=${tam} height=${tam} viewBox=${'0 0 ' + tam + ' ' + tam} role="img" aria-label=${segs.map(s => s.n + ' ' + Math.round(s.v / tot * 100) + ' %').join(', ')}>
    <circle cx=${tam / 2} cy=${tam / 2} r=${rr} fill="none" stroke="var(--fill)" stroke-width=${grosor}></circle>
    ${segs.map((s, i) => {
      const largo = Math.max(0, s.v / tot * circ - (segs.length > 1 ? 3 : 0));
      const off = -acum; acum += s.v / tot * circ;
      return html`<circle key=${s.n} class="seg" cx=${tam / 2} cy=${tam / 2} r=${rr} stroke=${s.c} stroke-width=${grosor} stroke-linecap="butt"
        stroke-dasharray=${(listo ? largo : 0) + ' ' + circ} stroke-dashoffset=${listo ? off : 0} transform=${'rotate(-90 ' + tam / 2 + ' ' + tam / 2 + ')'} style=${{ transitionDelay: (i * 80) + 'ms' }}></circle>`;
    })}
    ${centro && html`<text x="50%" y=${sub ? '47%' : '53%'} text-anchor="middle" class="centro num" fill="var(--ink)" font-size=${tam / 7.5}>${centro}</text>`}
    ${sub && html`<text x="50%" y="62%" text-anchor="middle" fill="var(--muted)" font-size="11">${sub}</text>`}
  </svg>`;
}

// Anillo de progreso (por ejemplo, la meta del día).
export function Anillo({ p, tam = 64, grosor = 7, c = 'var(--c2)', children }) {
  const [listo, setListo] = useState(false);
  useEffect(() => { const r = requestAnimationFrame(() => setListo(true)); return () => cancelAnimationFrame(r); }, []);
  const rr = (tam - grosor) / 2, circ = 2 * Math.PI * rr, k = Math.max(0, Math.min(1, p));
  return html`<span style=${{ position: 'relative', width: tam + 'px', height: tam + 'px', flex: 'none', display: 'grid', placeItems: 'center' }}>
    <svg width=${tam} height=${tam} style="position:absolute;inset:0" aria-hidden="true">
      <circle cx=${tam / 2} cy=${tam / 2} r=${rr} fill="none" stroke="var(--fill)" stroke-width=${grosor}></circle>
      <circle cx=${tam / 2} cy=${tam / 2} r=${rr} fill="none" stroke=${c} stroke-width=${grosor} stroke-linecap="round" stroke-dasharray=${circ} stroke-dashoffset=${listo ? circ * (1 - k) : circ} transform=${'rotate(-90 ' + tam / 2 + ' ' + tam / 2 + ')'} style="transition: stroke-dashoffset 1.1s var(--spring)"></circle>
    </svg>
    <span style="position:relative;font-size:12px;font-weight:700" class="num">${children}</span>
  </span>`;
}

// Barras horizontales con nombre y valor. datos: [{ n, v, txt, c, sub }]
export function BarrasH({ datos }) {
  const max = Math.max(1e-9, ...datos.map(d => d.v));
  return html`<div class="barras-h">
    ${datos.map((d, i) => html`<div class="bh entra" key=${d.n} style=${{ '--i': i }}>
      <div class="fila" style="gap:8px"><span class="crece corta" style="font-size:14px;font-weight:600">${d.n}</span><b class="num" style="font-size:14px">${d.txt}</b></div>
      <div class="barra-prog"><i style=${{ width: Math.max(2, d.v / max * 100) + '%', background: d.c || color(i), animationDelay: (i * 40) + 'ms' }}></i></div>
      ${d.sub && html`<small class="faint" style="font-size:12px">${d.sub}</small>`}
    </div>`)}
  </div>`;
}

// Leyenda con color, nombre, valor y porcentaje.
export function Leyenda({ segs, f }) {
  const tot = segs.reduce((a, s) => a + s.v, 0) || 1;
  return html`<div class="leyenda">${segs.map(s => html`<div class="l" key=${s.n}><i style=${{ background: s.c }}></i><span class="crece corta">${s.n}</span><b class="num">${f ? f(s.v) : s.v}</b><span class="faint num" style="width:38px;text-align:right">${Math.round(s.v / tot * 100)} %</span></div>`)}</div>`;
}
