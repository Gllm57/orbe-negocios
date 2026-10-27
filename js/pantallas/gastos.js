// Gastos del mes y cuentas por pagar. En el teléfono vive dentro de «Más».
import { html } from '../lib/preact-htm.js';
import { useApp } from '../ctx.js';
import { porPagar, gastosEntre, pagarGasto, inicioDia } from '../datos.js';
import { Dona, Leyenda, Monto, color } from '../graficos.js';
import { Icono, avisar, fechaCorta } from '../ui.js';
import { venceTxt } from './hoy.js';

export function inicioMes() { const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); return d.getTime(); }

export function BloqueGastos({ compacto }) {
  const { D, abrir, tel } = useApp();
  const pp = porPagar(), gm = gastosEntre(inicioMes(), Date.now() + 1);
  const totMes = gm.reduce((a, g) => a + g.v, 0);
  const cats = {}; gm.forEach(g => { cats[g.cat] = (cats[g.cat] || 0) + g.v; });
  const segs = Object.keys(cats).sort((a, b) => cats[b] - cats[a]).map((k, i) => ({ n: k, v: cats[k], c: color(i + 1) }));
  const pagar = g => { pagarGasto(g.id); avisar('Pagado: ' + g.n); };

  const PorPagar = html`<section class="tarjeta entra" style="padding-bottom:6px">
    <div class="tarjeta-tit">Por pagar<b class="num amber" style="font-size:14px">${D.m(pp.reduce((a, g) => a + g.v, 0))}</b></div>
    <div class="lista">${pp.length ? pp.map((g, i) => { const d = Math.round((inicioDia(g.vence) - inicioDia(Date.now())) / 86400000); return html`<div class="item entra" key=${g.id} style=${{ '--i': i }}>
      <span class="crece" style="display:flex;flex-direction:column;gap:2px"><b style="font-size:14px;font-weight:600">${g.n}</b><span class="sub" style=${{ color: d <= 1 ? 'var(--out)' : 'var(--amber)' }}>${venceTxt(g.vence)}</span></span>
      <b class="num" style="font-size:14px">${D.m(g.v)}</b>
      <button type="button" class="btn2 chico verde toca" onClick=${() => pagar(g)}>Pagado</button>
    </div>`; }) : html`<p class="vacio" style="padding:12px 0">No debes nada a nadie.</p>`}</div>
  </section>`;

  const Mes = html`<section class="tarjeta entra" style="--i:1">
    <div class="tarjeta-tit">Gastos del mes<${Monto} v=${totMes} f=${D.m} clase="out" /></div>
    ${segs.length ? html`<div class=${tel ? 'fila' : 'pila'} style="align-items:center;gap:16px"><${Dona} segs=${segs} tam=${tel ? 120 : 160} grosor=${16} centro=${D.corto(totMes)} /><div style="flex:1;width:100%"><${Leyenda} segs=${segs} f=${D.m} /></div></div>` : html`<p class="vacio">Sin gastos este mes.</p>`}
  </section>`;

  const Recientes = html`<section class="tarjeta entra" style="--i:2;padding-bottom:6px">
    <div class="tarjeta-tit">Gastos recientes<button type="button" class="btn2 chico rojo toca" onClick=${() => abrir('gasto')}>+ Gasto</button></div>
    <div class="lista">${gm.slice().sort((a, b) => b.t - a.t).slice(0, compacto ? 4 : 12).map((g, i) => html`<div class="item entra" key=${g.id} style=${{ '--i': i }}>
      <span class="crece" style="display:flex;flex-direction:column;gap:2px"><span style="font-size:14px">${g.n}</span><span class="sub faint">${fechaCorta(g.t)} · ${g.cat} · ${g.m}</span></span>
      <b class="num out" style="font-size:14px">−${D.m(g.v)}</b>
    </div>`)}</div>
  </section>`;

  return { PorPagar, Mes, Recientes };
}

export function Gastos() {
  const b = BloqueGastos({});
  return html`<div class="dos-uno"><div class="pila">${b.PorPagar}${b.Recientes}</div>${b.Mes}</div>`;
}
