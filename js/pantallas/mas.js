// Más (teléfono): gastos, cierre, reportes y ajustes. En la computadora es la pantalla de Ajustes.
import { html } from '../lib/preact-htm.js';
import { useApp } from '../ctx.js';
import { cambiarAjustes, cambiarNegocio, exportar, resumen, gastosEntre, inicioDia } from '../datos.js';
import { Monto } from '../graficos.js';
import { Icono, Interruptor, Chips, avisar } from '../ui.js';
import { BloqueGastos, inicioMes } from './gastos.js';
import { descargar, ventasCSV } from './reportes.js';

function Ajustes() {
  const { S, P, T, abrir, tel } = useApp();
  const n = S.negocio;
  const Tarjeta = (titulo, icono, hijos, i) => html`<section class="tarjeta entra" style=${{ '--i': i }}>
    <div class="fila" style="gap:10px;margin-bottom:6px"><span class="ic t-vio" style="width:32px;height:32px;border-radius:10px"><${Icono} n=${icono} t=${16} g=${2.2} /></span><b style="font-size:15px">${titulo}</b></div>${hijos}</section>`;
  const Dato = (a, b) => html`<div class="fila" style="justify-content:space-between;padding:9px 0;border-top:1px solid var(--line);font-size:13px"><span class="muted">${a}</span><b style="font-weight:600;text-align:right">${b}</b></div>`;
  const tarjetas = [
    Tarjeta(n.escala === 'empresa' ? 'Empresa' : 'Negocio', n.escala === 'empresa' ? 'edificio' : T.id, html`
      ${Dato('Nombre', n.nombre)}${n.razon ? Dato('Razón social', n.razon) : null}${n.fiscal ? Dato(P.fiscal[0], n.fiscal) : null}
      ${Dato('Tipo', T.n)}`, 0),
    Tarjeta(n.sucursales.length > 1 ? 'Locales y sucursales' : 'Tu local', 'edificio', html`
      ${n.sucursales.length > 1 ? n.sucursales.map((x, k) => Dato('Local ' + (k + 1), x)) : html`<p class="sub" style="margin:4px 0 10px;line-height:1.45">Tienes un solo local, así que Orbe no te muestra sucursales. Si abres otro, agrégalo aquí.</p>`}
      <div class="chips" style="margin-top:8px"><button type="button" class="btn2 chico acento toca" onClick=${() => abrir('locales')}>${n.sucursales.length > 1 ? 'Cambiar o agregar' : '+ Agregar otro local'}</button></div>`, 1),
    Tarjeta('País y moneda', 'mundo', html`${Dato('País', P.f + ' ' + P.n)}${Dato('Moneda', P.id === 'VE' ? 'Dólares y bolívares' : P.id === 'AR' ? 'Pesos y dólares' : P.cur)}${P.id === 'VE' ? Dato('Tasa BCV', S.tasaVE ? 'Bs ' + S.tasaVE.toFixed(2).replace('.', ',') + ' · ' + S.tasaFecha : 'Se lee sola cuando hay internet') : null}`, 1),
    Tarjeta('Formas de pago', 'tarjeta', html`<div class="chips" style="margin-top:6px">${P.pays.map(x => { const on = n.pays.includes(x); return html`<button type="button" class=${'chip chico toca' + (on ? ' on' : '')} aria-pressed=${on ? 'true' : 'false'} onClick=${() => { if (on && n.pays.length === 1) return; cambiarNegocio({ pays: on ? n.pays.filter(y => y !== x) : P.pays.filter(y => y === x || n.pays.includes(y)) }); }}>${x}</button>`; })}</div>`, 2),
    Tarjeta('Impuesto', 'porciento', html`
      <${Interruptor} on=${n.taxOn && P.tax[1] > 0} onCambio=${v => P.tax[1] ? cambiarNegocio({ taxOn: v }) : avisar('En tu país varía según la zona')} titulo=${'Cobrar ' + P.tax[0] + (P.tax[1] ? ' ' + P.tax[1] + ' %' : '')} sub="Sale en el recibo" />
      ${n.taxOn && P.tax[1] > 0 && html`<div class="segmento" style="width:100%">${[[true, 'Incluido en el precio'], [false, 'Aparte']].map(o => html`<button type="button" style="flex:1" class=${n.taxIncl === o[0] ? 'on' : ''} onClick=${() => cambiarNegocio({ taxIncl: o[0] })}>${o[1]}</button>`)}</div>`}`, 3),
    Tarjeta('Apariencia', 'sol', html`<div style="margin-top:6px"><${Chips} opciones=${[{ v: 'auto', n: 'Automático' }, { v: 'claro', n: 'Claro' }, { v: 'oscuro', n: 'Oscuro' }]} valor=${S.ajustes.tema || 'auto'} onCambio=${v => cambiarAjustes({ tema: v })} chico /></div>`, 4),
    Tarjeta('Copias y sin conexión', 'guardar', html`
      ${Dato('Dónde se guarda', 'En este aparato')}${Dato('Sin internet', 'Sigue funcionando')}
      <div class="chips" style="margin-top:8px">
        <button type="button" class="btn2 chico toca" onClick=${() => { descargar('orbe-negocios-copia-' + new Date().toISOString().slice(0, 10) + '.json', exportar(), 'application/json'); avisar('Copia descargada'); }}><${Icono} n="descarga" t=${15} />Descargar copia</button>
        <button type="button" class="btn2 chico toca" onClick=${() => { descargar('orbe-ventas.csv', ventasCSV(0, Date.now() + 1), 'text/csv;charset=utf-8'); avisar('Excel descargado'); }}><${Icono} n="doc" t=${15} />Ventas en Excel</button>
      </div>`, 5),
    Tarjeta('Empezar de nuevo', 'basura', html`<p class="sub" style="margin:4px 0 10px;line-height:1.45">Borra este negocio de este aparato para probar otro país o tipo. Antes se guarda una copia.</p><button type="button" class="btn2 chico rojo toca" onClick=${() => abrir('borrar')}>Empezar de nuevo</button>`, 6)
  ];
  return tel ? html`<div class="pila">${tarjetas}</div>` : html`<div class="tres">${tarjetas}</div>`;
}

export function Mas() {
  const { D, tel, ir, abrir } = useApp();
  if (!tel) return html`<${Ajustes} />`;
  const desde = inicioMes(), r = resumen(desde, Date.now() + 1, '');
  const gastos = gastosEntre(desde, Date.now() + 1).reduce((a, g) => a + g.v, 0);
  const real = r.ganancia - gastos;
  const b = BloqueGastos({ compacto: true });
  const mes = new Date().toLocaleDateString('es', { month: 'long' });
  return html`
    <h1 class="titulo entra">Más</h1>
    <button type="button" class="tarjeta toca entra" style="border:0;text-align:left;color:var(--ink);background:linear-gradient(160deg, color-mix(in srgb, var(--c2) 22%, var(--surface)), var(--surface));display:flex;flex-direction:column;gap:10px" onClick=${() => ir('reportes')}>
      <span class="fila"><span class="sub crece">Ganancia real de ${mes}</span><span class="pildora t-vio">Ver reportes <${Icono} n="sig" t=${12} g=${2.6} /></span></span>
      <${Monto} v=${real} f=${D.m} clase="titulo" />
      <span class="rejilla-3 num" style="gap:8px">${[['Ventas', r.total], ['Costo', -r.costo], ['Gastos', -gastos]].map(k => html`<span style="display:flex;flex-direction:column;gap:1px;min-width:0"><span class="sub" style="font-size:11px">${k[0]}</span><b class="corta" style="font-size:13px">${D.m(k[1])}</b></span>`)}</span>
    </button>
    <div class="rejilla-2">
      <button type="button" class="btn2 rojo toca" style="min-height:52px" onClick=${() => abrir('gasto')}>Anotar gasto</button>
      <button type="button" class="btn2 acento toca" style="min-height:52px" onClick=${() => abrir('cierre')}>Cierre del día</button>
    </div>
    ${b.PorPagar}${b.Mes}${b.Recientes}
    <h2 class="sub" style="font-size:13px;margin:6px 4px -4px">Ajustes</h2>
    <${Ajustes} />`;
}
