// Acceso rápido a las tasas (países con dos monedas): siempre a la vista, con el cambio del día,
// y con un toque se abren para revisarlas o cambiarlas.
import { html } from '../lib/preact-htm.js';
import { useApp } from '../ctx.js';
import { diaClave } from '../datos.js';
import { Icono } from '../ui.js';
import { TASAS_EXTRA, FUENTES_AR } from '../paises.js';

// Todas las tasas que usa el negocio: valor, cuánto cambió desde el registro anterior y si está al día.
export function infoTasas(S, P, D) {
  const hoy = diaClave(Date.now()), ve = P.id === 'VE';
  const cambio = f => { const h = (S.historialTasas || []).filter(x => x.f === f); return h.length > 1 ? (h[h.length - 1].v / h[h.length - 2].v - 1) * 100 : null; };
  const estado = t => !t || !t.valor ? 'estimada' : t.modo === 'manual' ? 'a mano' : t.fecha === hoy ? 'hoy' : 'vieja';
  const principal = { k: 'principal', n: ve ? 'Dólar BCV' : P.id === 'AR' ? 'Dólar ' + ((FUENTES_AR.find(f => f.v === S.tasa.fuente) || FUENTES_AR[0]).n).toLowerCase() : 'Dólar', s: '$', v: D.tasa, cambio: cambio(S.tasa.fuente || 'oficial'), estado: estado(S.tasa), fecha: S.tasa.fecha };
  const extras = (TASAS_EXTRA[P.id] || []).filter(x => S.tasas[x.k] && S.tasas[x.k].valor).map(x => ({ k: x.k, n: x.n, s: '$', v: S.tasas[x.k].valor, cambio: cambio(x.k), estado: estado(S.tasas[x.k]), fecha: S.tasas[x.k].fecha }));
  const euro = S.negocio.euro ? [{ k: 'euro', n: 'Euro', s: '€', v: D.tasaEur, cambio: cambio('euro'), estado: estado(S.tasas.euro), fecha: (S.tasas.euro || {}).fecha }] : [];
  return [principal].concat(euro, extras);
}

const flecha = c => c == null || Math.abs(c) < 0.05 ? '' : (c > 0 ? '▲ ' : '▼ ') + Math.abs(c).toFixed(1).replace('.', ',') + ' %';

// Teléfono: tira con las tasas, debajo del encabezado (Hoy y Vender).
export function BarraTasas() {
  const { S, P, D, abrir } = useApp();
  if (!D.dual) return null;
  const lista = infoTasas(S, P, D), mon = P.id === 'VE' ? 'Bs' : P.s, nf = new Intl.NumberFormat(P.loc, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const vieja = lista.some(t => t.estado === 'vieja' || t.estado === 'estimada');
  return html`<button type="button" class="barra-tasas toca entra" aria-label="Ver y cambiar las tasas" onClick=${() => abrir('tasa')}>
    <span class="barra-tasas-lista">${lista.map(t => html`<span class="tasa-mini" key=${t.k}>
      <span class="sub">${t.n}</span>
      <b class="num">${mon} ${nf.format(t.v)}</b>
      ${flecha(t.cambio) && html`<span class="num" style=${{ color: t.cambio > 0 ? 'var(--amber-text)' : 'var(--in-text)', fontSize: '11px', fontWeight: 600 }}>${flecha(t.cambio)}</span>`}
    </span>`)}</span>
    <span class="barra-tasas-ir">${vieja && html`<i class="punto-aviso" title="Hay tasas sin actualizar"></i>`}<${Icono} n="lapiz" t=${15} /></span>
  </button>`;
}

// Computadora: chip en la barra de arriba, visible en todas las secciones.
export function ChipTasa() {
  const { S, P, D, abrir } = useApp();
  if (!D.dual) return null;
  const lista = infoTasas(S, P, D), mon = P.id === 'VE' ? 'Bs' : P.s, nf = new Intl.NumberFormat(P.loc, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const vieja = lista.some(t => t.estado === 'vieja' || t.estado === 'estimada');
  return html`<button type="button" class="chip-tasa toca" title="Ver y cambiar las tasas" onClick=${() => abrir('tasa')}>
    ${vieja && html`<i class="punto-aviso"></i>`}
    ${lista.slice(0, 2).map(t => html`<span key=${t.k}><span class="sub">${t.s === '€' ? '€' : t.n.replace('Dólar ', '$ ')}</span> <b class="num">${mon} ${nf.format(t.v)}</b>${flecha(t.cambio) ? html` <span class="num" style=${{ color: t.cambio > 0 ? 'var(--amber-text)' : 'var(--in-text)', fontSize: '11px' }}>${flecha(t.cambio)}</span>` : null}</span>`)}
    <${Icono} n="lapiz" t=${13} c="var(--muted)" />
  </button>`;
}
