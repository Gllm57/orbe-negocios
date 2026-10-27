// Gastos del mes y cuentas por pagar. En el teléfono vive dentro de «Más».
import { html } from '../lib/preact-htm.js';
import { useApp } from '../ctx.js';
import { porPagar, gastosEntre, pagarGasto, inicioDia } from '../datos.js';
import { Reparto, Monto, color } from '../graficos.js';
import { Icono, avisar, fechaCorta, simbolo } from '../ui.js';
import { venceTxt } from './hoy.js';

const COLOR_CAT = { 'Mercancía': '#5b4cff', 'Alquiler': '#e08a00', 'Servicios': '#8a3ffc', 'Sueldos': '#0e9aa7', 'Transporte': '#12a37a', 'Otro': '#6b7b86' };

export function inicioMes() { const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); return d.getTime(); }

export function BloqueGastos({ compacto }) {
  const { D, abrir, tel } = useApp();
  const pp = porPagar(), gm = gastosEntre(inicioMes(), Date.now() + 1);
  const totMes = gm.reduce((a, g) => a + g.v, 0);
  const cats = {}; gm.forEach(g => { cats[g.cat] = (cats[g.cat] || 0) + g.v; });
  const segs = Object.keys(cats).sort((a, b) => cats[b] - cats[a]).map(k => ({ n: k, v: cats[k], c: COLOR_CAT[k] || 'var(--c4)' }));
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
    <div class="tarjeta-tit">Gastos del mes</div>
    ${segs.length ? html`<${Reparto} segs=${segs} f=${D.m} titulo="Gastado este mes" />` : html`<p class="vacio">Sin gastos este mes.</p>`}
  </section>`;

  const Recientes = html`<section class="tarjeta entra" style="--i:2;padding-bottom:6px">
    <div class="tarjeta-tit">Gastos recientes<button type="button" class="btn2 chico rojo toca" onClick=${() => abrir('gasto')}>+ Gasto</button></div>
    <div class="lista">${gm.slice().sort((a, b) => b.t - a.t).slice(0, compacto ? 4 : 12).map((g, i) => html`<div class="item entra" key=${g.id} style=${{ '--i': i }}>
      <span class="simb-c" style=${{ '--c': COLOR_CAT[g.cat] || 'var(--c4)', width: '32px', height: '32px' }}><${Icono} n=${simbolo(g.cat)} t=${16} /></span>
      <span class="crece" style="display:flex;flex-direction:column;gap:2px"><span style="font-size:14px">${g.n}</span><span class="sub faint">${fechaCorta(g.t)} · ${g.cat} · ${g.m}</span></span>
      <b class="num out" style="font-size:14px">−${D.m(g.v)}</b>
    </div>`)}</div>
  </section>`;

  return { PorPagar, Mes, Recientes };
}

export function Gastos() {
  const { D } = useApp();
  const b = BloqueGastos({});
  const gm = gastosEntre(inicioMes(), Date.now() + 1), pp = porPagar();
  const tot = gm.reduce((a, g) => a + g.v, 0), dias = new Date().getDate();
  const cifras = [['Gastado este mes', tot, gm.length + ' gastos', 'var(--out)', 'dinero'], ['Por pagar', pp.reduce((a, g) => a + g.v, 0), pp.length + (pp.length === 1 ? ' cuenta' : ' cuentas'), 'var(--amber)', 'calendario'],
    ['Próximo vencimiento', pp.length ? pp[0].v : 0, pp.length ? pp[0].n + ' · ' + venceTxt(pp[0].vence).toLowerCase() : 'Nada pendiente', 'var(--ink)', 'reloj'], ['Promedio por día', tot / Math.max(1, dias), 'en ' + dias + ' días del mes', 'var(--ink)', 'grafico']];
  return html`<div class="cifras">${cifras.map((k, i) => html`<div class="tarjeta cifra entra" style=${{ '--i': i }}><span class="fila" style="gap:8px"><span class="simb-c" style=${{ '--c': k[3] === 'var(--ink)' ? 'var(--c1)' : k[3] }}><${Icono} n=${k[4]} t=${14} g=${2.2} /></span><span class="sub">${k[0]}</span></span><${Monto} v=${k[1]} f=${D.m} clase="v" /><span class="sub faint corta">${k[2]}</span></div>`)}</div>
    <div class="tres estira">${b.PorPagar}${b.Recientes}${b.Mes}</div>`;
}
