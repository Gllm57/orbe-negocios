// Inventario (tienda, comida, venta en línea) o Servicios (citas, independientes).
import { html, useState } from '../lib/preact-htm.js';
import { useApp } from '../ctx.js';
import { bajoMinimo, resumen, inicioDia } from '../datos.js';
import { BarrasH, Dona, Leyenda, color } from '../graficos.js';
import { Chips, Icono, TONOS } from '../ui.js';

export function Inventario() {
  const { S, T, D, tel, abrir } = useApp();
  const [filtro, setFiltro] = useState('Todo');
  const mes = resumen(inicioDia(Date.now()) - 29 * 86400000, Date.now() + 1, '');
  const top = Object.keys(mes.porProd).map(k => Object.assign({ id: k }, mes.porProd[k])).sort((a, b) => b.v - a.v);

  if (!T.inv) {
    const Lista = html`<div class="pila">${S.productos.map((p, i) => { const x = mes.porProd[p.id] || { q: 0, v: 0 }; return html`
      <button type="button" key=${p.id} class="tarjeta fila toca entra" style=${{ '--i': i, border: 0, color: 'var(--ink)', textAlign: 'left' }} onClick=${() => abrir('producto', { pid: p.id })}>
        <span class=${'ic ' + TONOS[i % 5]} style="font-size:12px;font-weight:700">${p.ab}</span>
        <span class="crece" style="display:flex;flex-direction:column;gap:2px"><b style="font-size:14px;font-weight:600">${p.n}</b><span class="sub">${p.dur >= 60 ? p.dur / 60 + ' h' : p.dur + ' min'} · ${x.q} este mes</span></span>
        <b class="num">${D.m(p.p)}</b>
      </button>`; })}</div>`;
    const Graf = html`<section class="tarjeta entra"><div class="tarjeta-tit">Lo que más te dejan<span class="sub">30 días</span></div>
      <${BarrasH} datos=${top.slice(0, 6).map(t => ({ n: t.n, v: t.v, txt: D.m(t.v), sub: t.q + ' veces' }))} /></section>`;
    if (tel) return html`<div class="fila entra"><h1 class="titulo crece">Servicios</h1><button type="button" class="btn2 chico acento toca" onClick=${() => abrir('producto', {})}>+ Agregar</button></div>
      <span class="sub" style="margin-top:-6px">Con su precio y lo que dura. La agenda de citas llega en la Fase 2.</span>${Graf}${Lista}`;
    return html`<div class="dos-uno"><div class="pila"><div class="fila"><span class="sub crece">La agenda de citas llega en la Fase 2.</span><button type="button" class="btn2 lleno toca" onClick=${() => abrir('producto', {})}>+ Servicio</button></div>${Lista}</div>${Graf}</div>`;
  }

  const conStock = S.productos.filter(p => p.q != null);
  const bajos = bajoMinimo();
  const valor = conStock.reduce((a, p) => a + p.q * p.c, 0);
  const margen = conStock.length ? conStock.reduce((a, p) => a + (p.p > 0 ? (p.p - p.c) / p.p : 0), 0) / conStock.length : 0;
  const lista = (filtro === 'Por reponer' ? bajos : conStock).slice().sort((a, b) => (a.q < a.min ? 0 : 1) - (b.q < b.min ? 0 : 1));
  const estado = p => p.q === 0 ? ['Agotado', 't-ros', 'var(--out)'] : p.q < p.min ? ['Bajo', 't-amb', 'var(--amber)'] : ['Bien', 't-ver', 'var(--in)'];
  const segs = top.slice(0, 4).map((t, i) => ({ n: t.n, v: t.v, c: color(i) })).concat(top.length > 4 ? [{ n: 'Otros', v: top.slice(4).reduce((a, t) => a + t.v, 0), c: 'var(--faint)' }] : []);

  const Cifras = html`<div class="rejilla-2">
    <div class="tarjeta cifra entra"><span class="sub">Valor en estantes</span><span class="v num" style="font-size:20px">${D.m(valor)}</span><span class="sub faint">a precio de costo</span></div>
    <div class="tarjeta cifra entra" style="--i:1"><span class="sub">Ganas en promedio</span><span class="v num in" style="font-size:20px">${Math.round(margen * 100)} %</span><span class="sub faint">por cada venta</span></div>
  </div>`;
  const Top = html`<section class="tarjeta entra" style="--i:2"><div class="tarjeta-tit">Lo que más vendes<span class="sub">30 días</span></div>
    <div class=${tel ? 'pila' : 'pila'} style="align-items:center;gap:16px"><${Dona} segs=${segs} tam=${150} grosor=${18} centro=${D.corto(mes.total)} sub="30 días" /><div style="width:100%"><${Leyenda} segs=${segs} f=${D.m} /></div></div></section>`;

  const Tarjetas = html`<div class="pila">${lista.map((p, i) => { const e = estado(p); return html`
    <button type="button" key=${p.id} class="tarjeta fila toca entra" style=${{ '--i': i, border: 0, color: 'var(--ink)', textAlign: 'left' }} onClick=${() => abrir('producto', { pid: p.id })}>
      <span class=${'ic ' + TONOS[i % 5]} style="font-size:12px;font-weight:700">${p.ab}</span>
      <span class="crece" style="display:flex;flex-direction:column;gap:6px">
        <span class="fila" style="gap:8px"><b class="crece corta" style="font-size:14px;font-weight:600">${p.n}</b><b class="num" style=${{ fontSize: '13px', color: e[2] }}>${p.q} und</b></span>
        <span class="barra-prog"><i style=${{ width: Math.min(100, Math.round(p.q / Math.max(1, p.min * 2) * 100)) + '%', background: e[2] }}></i></span>
        <span class="sub faint num" style="font-size:11px">Costo ${D.m(p.c)} · Precio ${D.m(p.p)} · Ganas ${p.p ? Math.round((p.p - p.c) / p.p * 100) : 0} %</span>
      </span>
    </button>`; })}</div>`;

  if (tel) return html`
    <div class="fila entra"><h1 class="titulo crece">Inventario</h1><button type="button" class="btn2 chico acento toca" onClick=${() => abrir('producto', {})}>+ Agregar</button></div>
    ${Cifras}
    ${bajos.length > 0 && html`<button type="button" class="tarjeta fila toca entra" style="border:0;background:var(--amber-soft);box-shadow:none;color:var(--ink);text-align:left" onClick=${() => setFiltro(filtro === 'Por reponer' ? 'Todo' : 'Por reponer')}>
      <span class="ic t-amb"><${Icono} n="alerta" t=${18} /></span><span class="crece" style="display:flex;flex-direction:column"><b style="font-size:14px;font-weight:600">${bajos.length} ${bajos.length === 1 ? 'producto' : 'productos'} por debajo del mínimo</b><span class="sub">${filtro === 'Por reponer' ? 'Toca para ver todo' : 'Toca para verlos'}</span></span></button>`}
    ${Top}
    <${Chips} opciones=${['Todo', 'Por reponer']} valor=${filtro} onCambio=${setFiltro} chico />
    ${Tarjetas}`;

  return html`
    <div class="cifras">
      <div class="tarjeta cifra entra"><span class="sub">Valor en estantes</span><span class="v num">${D.m(valor)}</span><span class="sub faint">a precio de costo</span></div>
      <div class="tarjeta cifra entra" style="--i:1"><span class="sub">Ganas en promedio</span><span class="v num in">${Math.round(margen * 100)} %</span><span class="sub faint">por cada venta</span></div>
      <div class="tarjeta cifra entra" style="--i:2"><span class="sub">Por reponer</span><span class="v num amber">${bajos.length}</span><span class="sub faint">debajo del mínimo</span></div>
      <div class="tarjeta cifra entra" style="--i:3"><span class="sub">Productos</span><span class="v num">${conStock.length}</span><span class="sub faint">con existencia</span></div>
    </div>
    <div class="pila">
        <div class="fila"><${Chips} opciones=${['Todo', 'Por reponer']} valor=${filtro} onCambio=${setFiltro} chico /><span style="flex:1"></span><button type="button" class="btn2 lleno toca" onClick=${() => abrir('producto', {})}>+ Producto</button></div>
        <div class="tabla-caja"><table class="tabla">
          <thead><tr><th>Producto</th><th>Código</th><th class="der">Costo</th><th class="der">Precio</th><th class="der">Tienes</th><th class="der">Mínimo</th><th>Estado</th><th></th></tr></thead>
          <tbody>${lista.map((p, i) => { const e = estado(p); return html`<tr key=${p.id} style=${{ animationDelay: i * 25 + 'ms' }}>
            <td><b style="font-weight:600">${p.n}</b></td><td class="muted num">${p.cod || '—'}</td>
            <td class="der num muted">${D.m(p.c)}</td><td class="der num">${D.m(p.p)}</td>
            <td class="der num"><b style=${{ color: e[2] }}>${p.q}</b></td><td class="der num muted">${p.min}</td>
            <td><span class=${'pildora ' + e[1]}>${e[0]}</span></td>
            <td class="der"><span class="fila" style="gap:6px;justify-content:flex-end"><button type="button" class="btn2 chico verde toca" onClick=${() => abrir('reponer', { pid: p.id })}>Reponer</button><button type="button" class="btn2 chico toca" onClick=${() => abrir('producto', { pid: p.id })}>Editar</button></span></td>
          </tr>`; })}</tbody>
        </table>${lista.length ? null : html`<p class="vacio">Nada por reponer.</p>`}</div>
    </div>
    <div class="tres">
      ${Top}
      <section class="tarjeta entra" style="--i:3"><div class="tarjeta-tit">Lo que más te deja<span class="sub">ganancia, 30 días</span></div>
        <${BarrasH} datos=${top.slice().sort((a, b) => b.g - a.g).slice(0, 6).map((t, i) => ({ n: t.n, v: t.g, txt: D.m(t.g), c: color(i), sub: t.q + ' vendidos' }))} /></section>
      <section class="tarjeta entra" style="--i:4"><div class="tarjeta-tit">Dónde está tu dinero<span class="sub">a costo</span></div>
        <${BarrasH} datos=${conStock.slice().sort((a, b) => b.q * b.c - a.q * a.c).slice(0, 6).map((p, i) => ({ n: p.n, v: p.q * p.c, txt: D.m(p.q * p.c), c: color(i + 2), sub: p.q + ' und' }))} /></section>
    </div>`;
}
