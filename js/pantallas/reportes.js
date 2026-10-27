// Reportes: ventas, ganancia real, formas de pago, productos y días de la semana.
import { html, useState } from '../lib/preact-htm.js';
import { useApp } from '../ctx.js';
import { resumen, serieDias, gastosEntre, inicioDia, leer } from '../datos.js';
import { Barras, Linea, Reparto, BarrasH, Monto, color } from '../graficos.js';
import { Icono, Chips, avisar, fechaCorta } from '../ui.js';
import { inicioMes } from './gastos.js';

const DIA = 86400000;
const PERIODOS = [{ v: 7, n: '7 días' }, { v: 30, n: '30 días' }, { v: 'mes', n: 'Este mes' }];
const SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export function descargar(nombre, texto, tipo) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([texto], { type: tipo }));
  a.download = nombre; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}
export function ventasCSV(desde, hasta) {
  const S = leer(), fila = c => c.map(x => '"' + String(x).replace(/"/g, '""') + '"').join(';');
  const filas = [fila(['Número', 'Fecha', 'Hora', 'Sucursal', 'Productos', 'Total', 'Forma de pago', 'Cliente', 'Fiado'])];
  S.ventas.filter(v => v.t >= desde && v.t < hasta).forEach(v => {
    const d = new Date(v.t), cli = S.clientes.find(c => c.id === v.cli);
    filas.push(fila([v.n, d.toLocaleDateString('es'), d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }), v.suc, v.items.map(it => it.q + ' x ' + it.n).join(', '), String(v.total.toFixed(2)).replace('.', ','), v.pagos.map(p => p.m).join(' + '), cli ? cli.n : '', v.fiado ? 'Sí' : 'No']));
  });
  return '﻿' + filas.join('\n');
}

export function Reportes() {
  const { S, P, D, E, tel, suc } = useApp();
  const [per, setPer] = useState(30);
  const hoy0 = inicioDia(Date.now());
  const dias = per === 'mes' ? Math.round((hoy0 - inicioMes()) / DIA) + 1 : per;
  const desde = hoy0 - (dias - 1) * DIA, hasta = Date.now() + 1;
  const r = resumen(desde, hasta, suc), serie = serieDias(dias, suc);
  const ant = resumen(desde - dias * DIA, desde, suc);
  const gastos = gastosEntre(desde, hasta).filter(g => !suc || g.suc === suc).reduce((a, g) => a + g.v, 0);
  const real = r.ganancia - gastos;
  const cambio = ant.total ? Math.round((r.total / ant.total - 1) * 100) : 0;
  const gastosAnt = gastosEntre(desde - dias * DIA, desde).filter(g => !suc || g.suc === suc).reduce((a, g) => a + g.v, 0);
  const flecha = (a, b, menosEsMejor) => { if (!b) return ['', 'var(--faint)']; const q = Math.round((a / b - 1) * 100); return [(q > 0 ? '▲ ' : q < 0 ? '▼ ' : '= ') + Math.abs(q) + ' % vs antes', (menosEsMejor ? q <= 0 : q >= 0) ? 'var(--in)' : 'var(--out)']; };
  const pagos = Object.keys(r.porPago).sort((a, b) => r.porPago[b] - r.porPago[a]).map((k, i) => ({ n: k, v: r.porPago[k], c: k === 'Fiado' ? 'var(--c3)' : color(i === 2 ? 3 : i), d: ant.porPago[k] ? (r.porPago[k] / ant.porPago[k] - 1) * 100 : null, bueno: !ant.porPago[k] || r.porPago[k] >= ant.porPago[k] }));
  const prods = Object.keys(r.porProd).map(k => r.porProd[k]).sort((a, b) => b.v - a.v);
  const porSem = [0, 0, 0, 0, 0, 0, 0], cuenta = [0, 0, 0, 0, 0, 0, 0];
  serie.forEach(d => { const w = new Date(d.t).getDay(); porSem[w] += d.total; cuenta[w]++; });
  const semana = [1, 2, 3, 4, 5, 6, 0].map(w => ({ l: SEMANA[w], v: cuenta[w] ? porSem[w] / cuenta[w] : 0, tip: SEMANA[w] + ' · promedio ' + D.m(cuenta[w] ? porSem[w] / cuenta[w] : 0) }));
  const mejor = semana.reduce((a, b) => b.v > a.v ? b : a, semana[0]);
  const resultado = [
    { l: 'Ventas', v: r.total, tip: 'Ventas · ' + D.m(r.total), segs: [{ v: r.total, c: 'var(--c1)' }] },
    { l: 'Costo', v: r.costo, tip: 'Costo de lo vendido · ' + D.m(r.costo), segs: [{ v: r.costo, c: 'var(--c4)' }] },
    { l: 'Gastos', v: gastos, tip: 'Gastos · ' + D.m(gastos), segs: [{ v: gastos, c: 'var(--c5)' }] },
    { l: 'Te queda', v: Math.max(0, real), tip: 'Ganancia real · ' + D.m(real), segs: [{ v: Math.max(0, real), c: 'var(--c2)' }] }
  ];
  const nombreArchivo = 'orbe-ventas-' + new Date(desde).toISOString().slice(0, 10) + '.csv';
  const Acciones = html`<div class="chips">
    <button type="button" class="btn2 chico toca" onClick=${() => { descargar(nombreArchivo, ventasCSV(desde, hasta), 'text/csv;charset=utf-8'); avisar('Excel descargado'); }}><${Icono} n="descarga" t=${15} />Excel</button>
    <button type="button" class="btn2 chico toca" onClick=${() => window.print()}><${Icono} n="doc" t=${15} />PDF</button>
  </div>`;

  const fv = flecha(r.total, ant.total), fg = flecha(r.ganancia, ant.ganancia), fgs = flecha(gastos, gastosAnt, true), fr = flecha(real, ant.ganancia - gastosAnt);
  const Cifras = [['Ventas', r.total, fv[0], 'var(--ink)', fv[1], 'sube'], ['Ganancia bruta', r.ganancia, fg[0] || (r.total ? Math.round(r.ganancia / r.total * 100) + ' % de lo vendido' : ''), 'var(--in)', fg[1], 'dinero'], ['Gastos', gastos, fgs[0] || 'alquiler, sueldos, servicios…', 'var(--out)', fgs[1], 'rayo'], ['Ganancia real', real, fr[0] || 'lo que de verdad te queda', real >= 0 ? 'var(--in)' : 'var(--out)', fr[1], 'check']];

  const bloques = {
    linea: html`<section class="tarjeta entra llena" style="--i:4"><div class="tarjeta-tit">Ventas por día<span class="sub">${r.n} ventas · ticket ${D.m(r.ticket)}</span></div>
      <${Linea} key=${dias + suc} datos=${serie.map(d => ({ l: fechaCorta(d.t), v: d.total, tip: D.m(d.total) }))} alto=${tel ? 170 : 220} id=${'rep' + dias} etiquetas=${tel ? 4 : 7} llenar=${!tel} /></section>`,
    resultado: html`<section class="tarjeta entra llena" style="--i:5"><div class="tarjeta-tit">De lo que vendes, te queda<b class="num in" style="font-size:14px">${r.total ? Math.round(real / r.total * 100) : 0} %</b></div>
      <${Barras} key=${'res' + dias + suc} datos=${resultado} alto=${tel ? 150 : 200} hueco=${tel ? 14 : 22} llenar=${!tel} /></section>`,
    pagos: html`<section class="tarjeta entra" style="--i:6"><div class="tarjeta-tit">Formas de pago</div>
      ${pagos.length ? html`<${Reparto} key=${'pg' + dias + suc} segs=${pagos} f=${D.m} titulo=${'Vendido en ' + (per === 'mes' ? 'el mes' : dias + ' días')} />` : html`<p class="vacio">Sin ventas.</p>`}</section>`,
    productos: html`<section class="tarjeta entra" style="--i:7"><div class="tarjeta-tit">Lo que más vendes<span class="sub">por ventas</span></div>
      <${BarrasH} datos=${prods.slice(0, 6).map(p => ({ n: p.n, v: p.v, txt: D.m(p.v), sub: p.q + ' vendidos · ganas ' + D.m(p.g) }))} /></section>`,
    semana: html`<section class="tarjeta entra llena" style="--i:8"><div class="tarjeta-tit">Tu mejor día<span class="sub">${mejor.l}, en promedio ${D.m(mejor.v)}</span></div>
      <${Barras} key=${'sem' + dias + suc} datos=${semana} alto=${tel ? 120 : 170} resaltar=${semana.indexOf(mejor)} llenar=${!tel} /></section>`,
    sucursales: E && !suc ? html`<section class="tarjeta entra" style="--i:9"><div class="tarjeta-tit">Por sucursal</div>
      <${BarrasH} datos=${S.negocio.sucursales.map((s, i) => ({ n: s, v: r.porSuc[s] || 0, txt: D.m(r.porSuc[s] || 0), c: color(i) }))} /></section>` : null
  };

  if (tel) return html`
    <div class="fila entra"><h1 class="titulo crece">Reportes</h1>${Acciones}</div>
    <${Chips} opciones=${PERIODOS} valor=${per} onCambio=${setPer} chico />
    <div class="rejilla-2">${Cifras.map((k, i) => html`<div class="tarjeta cifra entra" style=${{ '--i': i }}><span class="fila" style="gap:8px"><span class="simb-c" style=${{ '--c': k[3] === 'var(--ink)' ? 'var(--c1)' : k[3] }}><${Icono} n=${k[5]} t=${14} g=${2.2} /></span><span class="sub">${k[0]}</span></span><${Monto} v=${k[1]} f=${D.m} clase="v" /><span class="faint" style=${{ fontSize: '11px', color: k[4] }}>${k[2]}</span></div>`)}</div>
    ${bloques.linea}${bloques.resultado}${bloques.pagos}${bloques.productos}${bloques.semana}${bloques.sucursales}`;

  return html`
    <div class="fila"><${Chips} opciones=${PERIODOS} valor=${per} onCambio=${setPer} chico /><span style="flex:1"></span>${Acciones}</div>
    <div class="cifras">${Cifras.map((k, i) => html`<div class="tarjeta cifra entra" style=${{ '--i': i }}><span class="fila" style="gap:8px"><span class="simb-c" style=${{ '--c': k[3] === 'var(--ink)' ? 'var(--c1)' : k[3] }}><${Icono} n=${k[5]} t=${14} g=${2.2} /></span><span class="sub">${k[0]}</span></span><${Monto} v=${k[1]} f=${D.m} clase="v" /><span class="sub" style=${{ color: k[4] || 'var(--faint)' }}>${k[2]}</span></div>`)}</div>
    <div class="dos-uno">${bloques.linea}${bloques.resultado}</div>
    <div class="tres estira">${bloques.pagos}${bloques.productos}${bloques.semana}</div>
    ${bloques.sucursales}`;
}
