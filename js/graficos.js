// Gráficos de Orbe: barras que crecen, líneas que se dibujan, donas y anillos que se llenan.
import { html, useState, useEffect, useRef, useMemo } from './lib/preact-htm.js';
import { Icono, simbolo } from './ui.js';

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

// Mide la altura libre de un contenedor (para que el gráfico llene su tarjeta sin dejar espacio vacío).
function useAltoLibre(activo, minimo) {
  const ref = useRef(null);
  const [alto, setAlto] = useState(minimo);
  useEffect(() => {
    if (!activo || !ref.current || !window.ResizeObserver) return;
    const ro = new ResizeObserver(([e]) => { const h = Math.floor(e.contentRect.height); if (h > 0) setAlto(Math.max(minimo, h)); });
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, [activo, minimo]);
  return [ref, alto];
}
const Llena = ({ activo, refCaja, minimo, children }) => activo
  ? html`<div class="gr-llena" ref=${refCaja} style=${{ minHeight: minimo + 'px' }}><div class="gr-llena-dentro">${children}</div></div>`
  : children;

// Barras verticales, simples o apiladas. datos: [{ l, v, segs?: [{ v, c }], tip }]
export function Barras({ datos, alto: alto0 = 160, colorBase = 'var(--c1)', resaltar = -1, hueco = 6, llenar = false }) {
  const [refLibre, libre] = useAltoLibre(llenar, alto0);
  const alto = llenar ? libre - 4 : alto0;
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
  return html`<${Llena} activo=${llenar} refCaja=${refLibre} minimo=${alto0}><div class="gr" ref=${caja} onMouseLeave=${quitar}>
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
  </div></${Llena}>`;
}

// Línea con área. datos: [{ l, v, tip }]
// ajustar: la escala empieza cerca del mínimo (para valores que cambian poco, como una tasa).
export function Linea({ datos, alto: alto0 = 200, c = 'var(--c1)', etiquetas = 6, id = 'ln', llenar = false, ajustar = false }) {
  const [refLibre, libre] = useAltoLibre(llenar, alto0);
  const alto = llenar ? libre - 18 : alto0;
  const ancho = 600, pad = 8;
  const vmax = Math.max(1e-9, ...datos.map(d => d.v)), vmin = ajustar ? Math.min(...datos.map(d => d.v)) : 0;
  const piso = ajustar ? vmin - (vmax - vmin) * 0.15 : 0, max = ajustar ? vmax + (vmax - vmin) * 0.1 - piso || 1 : vmax * 1.1;
  const pts = datos.map((d, i) => [pad + i * (ancho - 2 * pad) / Math.max(1, datos.length - 1), alto - 24 - (d.v - piso) / max * (alto - 40)]);
  const linea = useMemo(() => pts.map((p, i) => {
    if (!i) return 'M' + p[0] + ',' + p[1];
    const a = pts[i - 1], cx = (a[0] + p[0]) / 2;
    return 'C' + cx + ',' + a[1] + ' ' + cx + ',' + p[1] + ' ' + p[0] + ',' + p[1];
  }).join(' '), [datos, alto]);
  const area = linea + ' L' + pts[pts.length - 1][0] + ',' + (alto - 24) + ' L' + pts[0][0] + ',' + (alto - 24) + ' Z';
  const caja = useRef(null);
  const [sel, setSel] = useState(-1);
  const mover = e => {
    const r = caja.current.getBoundingClientRect();
    const x = ((e.touches ? e.touches[0].clientX : e.clientX) - r.left) / r.width * ancho;
    let mejor = 0; pts.forEach((p, i) => { if (Math.abs(p[0] - x) < Math.abs(pts[mejor][0] - x)) mejor = i; });
    setSel(mejor);
  };
  const cada = Math.max(1, Math.round(datos.length / etiquetas));
  const p = sel >= 0 ? pts[sel] : null;
  return html`<${Llena} activo=${llenar} refCaja=${refLibre} minimo=${alto0}><div class="gr gr-linea" ref=${caja} onMouseMove=${mover} onMouseLeave=${() => setSel(-1)} onTouchStart=${mover} onTouchMove=${mover}>
    <svg key=${'s' + datos.length + id} class="revela" viewBox=${'0 0 ' + ancho + ' ' + alto} width="100%" height=${alto} preserveAspectRatio="none" role="img" aria-label=${'Gráfico: ' + datos.map(d => d.l + ' ' + (d.tip || d.v)).join(', ')}>
      <defs><linearGradient id=${'g' + id} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color=${c} stop-opacity="0.32"></stop><stop offset="100%" stop-color=${c} stop-opacity="0"></stop></linearGradient></defs>
      ${[0.25, 0.5, 0.75].map(k => html`<line x1="0" x2=${ancho} y1=${(alto - 24) - k * (alto - 40)} y2=${(alto - 24) - k * (alto - 40)} stroke="var(--line)" stroke-dasharray="3 5" vector-effect="non-scaling-stroke"></line>`)}
      <path class="area" d=${area} fill=${'url(#g' + id + ')'}></path>
      <path class="trazo" d=${linea} stroke=${c} vector-effect="non-scaling-stroke"></path>
      ${p && html`<line x1=${p[0]} x2=${p[0]} y1="8" y2=${alto - 24} stroke="var(--line)" vector-effect="non-scaling-stroke"></line>`}
    </svg>
    ${p && html`<span style=${{ position: 'absolute', left: (p[0] / ancho * 100) + '%', top: p[1] + 'px', width: '12px', height: '12px', margin: '-6px 0 0 -6px', borderRadius: '50%', background: c, border: '3px solid var(--surface)', pointerEvents: 'none' }}></span>
      <div class="gr-globo" style=${{ left: (p[0] / ancho * 100) + '%', top: (p[1] - 10) + 'px' }}>${datos[sel].l} · ${datos[sel].tip || datos[sel].v}</div>`}
    <div style=${{ display: 'flex', justifyContent: 'space-between', marginTop: '-18px', fontSize: '10px', color: 'var(--faint)', padding: '0 2px' }}>
      ${datos.map((d, i) => i % cada === 0 || i === datos.length - 1 ? html`<span>${d.l}</span>` : null)}
    </div>
  </div></${Llena}>`;
}

// Orbes: anillos concéntricos, como en Orbe personal (ringsSvg). items: [{ p (0 a 1), c }], el primero va afuera.
export function Orbes({ items, tam = 124, grosor = 11, hueco = 4, children }) {
  const c = tam / 2;
  return html`<span class="orbes" style=${{ width: tam + 'px', height: tam + 'px' }}>
    <svg class="rings" width=${tam} height=${tam} viewBox=${'0 0 ' + tam + ' ' + tam} aria-hidden="true">
      ${items.map((it, k) => {
        const r = c - grosor / 2 - k * (grosor + hueco);
        if (r < grosor) return null;
        const pr = Math.max(0, Math.min(1, it.p || 0));
        return html`<g key=${k + '-' + it.c}>
          <circle cx=${c} cy=${c} r=${r.toFixed(2)} fill="none" style=${{ stroke: it.c, strokeOpacity: 0.18, strokeWidth: grosor }}></circle>
          ${pr > 0.002 && html`<circle class="rg" cx=${c} cy=${c} r=${r.toFixed(2)} fill="none" stroke-linecap="round" pathLength=${(1 / pr).toFixed(4)} stroke-dasharray="1 1000" transform=${'rotate(-90 ' + c + ' ' + c + ')'} style=${{ stroke: it.c, strokeWidth: grosor, animationDelay: (k * 0.08).toFixed(2) + 's' }}></circle>`}
        </g>`;
      })}
    </svg>
    ${children ? html`<span class="orbes-centro num">${children}</span>` : null}
  </span>`;
}

// Un solo orbe con su porcentaje en el centro (por ejemplo, la meta del día).
export function Anillo({ p, tam = 64, grosor = 7, c = 'var(--in)', children }) {
  return html`<${Orbes} items=${[{ p, c }]} tam=${tam} grosor=${grosor} hueco=${0}>${children}</${Orbes}>`;
}

// Reparto con orbes y lista con símbolos, como «Ingresos y gastos del mes» en Orbe personal.
// segs: [{ n, v, c, i? (símbolo), d? (cambio en %), bueno? }]
export function Reparto({ segs, f, total, titulo = 'Total', tam = 124, grosor = 11, hueco = 4, max = 4 }) {
  const tot = total ?? segs.reduce((a, s) => a + s.v, 0);
  // «Otros» siempre al final, aunque sume más.
  const orden = segs.slice().sort((a, b) => (a.n === 'Otros') - (b.n === 'Otros') || b.v - a.v);
  const pct = v => { const q = tot ? v / tot * 100 : 0; return (q > 0 && q < 1 ? '<1' : Math.round(q)) + ' %'; };
  return html`<div class="reparto">
    <div class="fila" style="gap:16px">
      <${Orbes} items=${orden.slice(0, max).map(s => ({ p: tot ? s.v / tot : 0, c: s.c }))} tam=${tam} grosor=${grosor} hueco=${hueco} />
      <span class="crece" style="display:flex;flex-direction:column;gap:4px">
        <span class="sub">${titulo}</span><b class="num" style="font-size:22px;letter-spacing:-0.02em">${f(tot)}</b>
      </span>
    </div>
    <ul class="lista-orbe">${orden.map((s, k) => html`<li key=${s.n} class="entra" style=${{ '--i': k, '--c': s.c }}>
      <span class="simbolo"><${Icono} n=${s.i || simbolo(s.n)} t=${16} g=${2} /></span>
      <span class="crece corta"><b>${s.n}</b>${s.d != null && isFinite(s.d) ? html`<span class=${'delta ' + (s.bueno ? 'g' : 'b')}>${s.d > 0 ? '▲' : s.d < 0 ? '▼' : '='} ${Math.abs(Math.round(s.d))}%</span>` : null}</span>
      <span class="faint num pct">${pct(s.v)}</span>
      <b class="num">${f(s.v)}</b>
      <span class="pista" aria-hidden="true"><i style=${{ width: Math.max(0.5, tot ? s.v / tot * 100 : 0).toFixed(2) + '%' }}></i></span>
    </li>`)}</ul>
  </div>`;
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
