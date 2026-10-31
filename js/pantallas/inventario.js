// Inventario (tienda, comida, venta en línea) o Servicios (citas, independientes).
import { html, useState } from '../lib/preact-htm.js';
import { useApp } from '../ctx.js';
import { bajoMinimo, bajoMeta, resumen, inicioDia, listaProductos, promosVigentes } from '../datos.js';
import { verQ } from '../carrito.js';
import { BarrasH, Reparto, color } from '../graficos.js';
import { Chips, Icono, TONOS, avisar, FotoProd } from '../ui.js';
import { FiltroGrupos, filtrarGrupo, textosProducto, grupoDe, colorGrupo } from './grupos.js';
import { buscar, parecidos } from '../buscar.js';

export function Inventario() {
  const { S, T, D, tel, abrir, puede } = useApp();
  // Permisos: cambiar productos, reponer y ver costos o ganancias.
  const pp = puede('productos'), vg = puede('ganancias');
  const editarP = d => pp ? abrir('producto', d) : avisar('Tu perfil no puede cambiar productos');
  const [filtro, setFiltro] = useState('Todo');
  const [q, setQ] = useState('');
  const [grupo, setGrupo] = useState('');
  // Buscar (tolerante) y filtrar por grupo; con «nuevo» el producto creado entra en el grupo que se está viendo.
  const elegir = lista => { const g = filtrarGrupo(lista, S, grupo); return q.trim() ? buscar(g, q, textosProducto(S)) : g; };
  const Buscador = html`<div class="pila" style="gap:10px">
    <label class="buscador entra" style=${{ width: '100%', background: 'var(--surface)', maxWidth: tel ? 'none' : '420px' }}><${Icono} n="buscar" t=${16} c="var(--muted)" /><input type="search" value=${q} onInput=${e => setQ(e.target.value)} placeholder=${'Buscar entre ' + listaProductos().length} aria-label="Buscar en el inventario" /></label>
    <${FiltroGrupos} valor=${grupo} onCambio=${setGrupo} />
  </div>`;
  const NoHay = (lista, base) => q.trim() && !lista.length ? html`<p class="vacio">No encontré «${q}». ${(() => { const s = parecidos(base, q, textosProducto(S)); return s.length ? '¿Quisiste decir ' + s.map(p => p.n).join(', ') + '?' : ''; })()}</p>` : null;
  const PillGrupo = p => { const g = grupoDe(S, p); return g ? html`<span class="pildora" style=${{ background: 'color-mix(in srgb, ' + colorGrupo(g) + ' 16%, transparent)', color: 'var(--ink)' }}><i class="punto-grupo" style=${{ background: colorGrupo(g) }}></i>${g.n}</span>` : html`<span class="faint">—</span>`; };
  const mes = resumen(inicioDia(Date.now()) - 29 * 86400000, Date.now() + 1, '');
  const top = Object.keys(mes.porProd).map(k => Object.assign({ id: k }, mes.porProd[k])).sort((a, b) => b.v - a.v);

  if (!T.inv) {
    const servicios = elegir(listaProductos());
    const Lista = html`<div class="pila" data-tour="productos">${NoHay(servicios, listaProductos())}${servicios.map((p, i) => { const x = mes.porProd[p.id] || { q: 0, v: 0 }; return html`
      <button type="button" key=${p.id} class="tarjeta fila toca entra" style=${{ '--i': i, border: 0, color: 'var(--ink)', textAlign: 'left' }} onClick=${() => editarP({ pid: p.id })}>
        ${FotoProd(p, 0, html`<span class=${'ic ' + TONOS[i % 5]} style="font-size:12px;font-weight:700">${p.ab}</span>`)}
        <span class="crece" style="display:flex;flex-direction:column;gap:2px"><b style="font-size:14px;font-weight:600">${p.n}</b><span class="sub">${p.dur >= 60 ? p.dur / 60 + ' h' : p.dur + ' min'} · ${x.q} este mes</span></span>
        <b class="num">${D.m(p.p)}</b>
      </button>`; })}</div>`;
    const Graf = html`<section class="tarjeta entra"><div class="tarjeta-tit">Lo que más te dejan<span class="sub">30 días</span></div>
      <${BarrasH} datos=${top.slice(0, 6).map(t => ({ n: t.n, v: t.v, txt: D.m(t.v), sub: t.q + ' veces' }))} /></section>`;
    if (tel) return html`<div class="fila entra"><h1 class="titulo crece">Servicios</h1>${pp && html`<button type="button" class="btn2 chico acento toca" onClick=${() => editarP({})}>+ Agregar</button>`}</div>
      <span class="sub" style="margin-top:-6px">Con su precio y lo que dura. La agenda de citas llega en la Fase 2.</span>${Buscador}${Lista}${Graf}`;
    return html`<div class="dos-uno"><div class="pila"><div class="fila"><span class="sub crece">La agenda de citas llega en la Fase 2.</span>${pp && html`<button type="button" class="btn2 lleno toca" onClick=${() => editarP({ g: grupo && grupo !== 'sin' ? grupo : '' })}>+ Servicio</button>`}</div>${Buscador}${Lista}</div>${Graf}</div>`;
  }

  const conStock = listaProductos().filter(p => p.q != null);
  // Servicios dentro de una tienda (mano de obra, instalación…): no llevan existencia.
  const servicios = elegir(listaProductos().filter(p => p.q == null));
  const bajos = bajoMinimo();
  const valor = conStock.reduce((a, p) => a + p.q * p.c, 0);
  const margen = conStock.length ? conStock.reduce((a, p) => a + (p.p > 0 ? (p.p - p.c) / p.p : 0), 0) / conStock.length : 0;
  const base = filtro === 'Por reponer' ? bajos : conStock;
  const lista = q.trim() ? elegir(base) : elegir(base).slice().sort((a, b) => (a.q < a.min ? 0 : 1) - (b.q < b.min ? 0 : 1));
  const estado = p => p.q === 0 ? ['Agotado', 't-ros', 'var(--out)'] : p.q < p.min ? ['Bajo', 't-amb', 'var(--amber)'] : ['Bien', 't-ver', 'var(--in)'];

  const Tarjetas = html`<div class="pila" data-tour="productos">${lista.map((p, i) => { const e = estado(p); return html`
    <button type="button" key=${p.id} class="tarjeta fila toca entra" style=${{ '--i': i, border: 0, color: 'var(--ink)', textAlign: 'left' }} onClick=${() => editarP({ pid: p.id })}>
      ${FotoProd(p, 0, html`<span class=${'ic ' + TONOS[i % 5]} style="font-size:12px;font-weight:700">${p.ab}</span>`)}
      <span class="crece" style="display:flex;flex-direction:column;gap:6px">
        <span class="fila" style="gap:8px"><b class="crece corta" style="font-size:14px;font-weight:600">${p.n}</b>${vg && p.c > 0 && p.p < p.c * 1.05 ? html`<span class="pildora t-ros">Sin ganancia</span>` : null}<b class="num" style=${{ fontSize: '13px', color: e[2] }}>${verQ(p.q, p.u || 'und')}</b></span>
        <span class="barra-prog"><i style=${{ width: Math.min(100, Math.round(p.q / Math.max(1, p.min * 2) * 100)) + '%', background: e[2] }}></i></span>
        ${p.vars && p.vars.length ? html`<span class="sub num" style="font-size:11px">${p.vars.map(v => v.n + ' ' + verQ(v.q || 0)).join(' · ')}</span>` : null}
        <span class="sub faint num" style="font-size:11px">${vg ? 'Costo ' + D.m(p.c) + ' · ' : ''}Precio ${D.m(p.p)}${p.u ? ' / ' + p.u : ''}${vg ? ' · Ganas ' + (p.p ? Math.round((p.p - p.c) / p.p * 100) : 0) + ' %' : ''}</span>
      </span>
    </button>`; })}</div>`;

  // Herramientas en una fila: escanear, factura del proveedor, promociones y precios.
  const herr = [(pp || puede('reponer')) && ['camara', 'Escanear', () => abrir('escaner', { para: 'inventario' }), 0, '#6a5cf2'], (pp || puede('reponer')) && ['doc', 'Factura', () => abrir('factura'), 0, '#3d9be9'],
    pp && ['porciento', 'Promos', () => abrir('promos'), promosVigentes().length, '#e8436a'], pp && ['etiqueta', 'Precios', () => abrir('precios'), bajoMeta().length ? -1 : 0, '#e8961a']].filter(Boolean);
  const Herramientas = herr.length ? html`<div class="herramientas entra" data-tour="escanear">${herr.map(h => html`<button type="button" key=${h[1]} class="toca" onClick=${h[2]}><span style=${{ background: h[4] }}><${Icono} n=${h[0]} t=${18} c="#fff" /></span><b>${h[1]}</b>${h[3] > 0 ? html`<em>${h[3]}</em>` : h[3] < 0 ? html`<i class="punto-aviso" style="top:8px;right:14px"></i>` : null}</button>`)}</div>` : null;
  const servs = listaProductos().filter(p => p.q == null);
  const Pestañas = html`<div class="segmento ancho entra" role="tablist" aria-label="Qué ver">${[['Todo', 'Productos ' + conStock.length], ['Por reponer', 'Por reponer ' + bajos.length]].concat(servs.length || pp ? [['Servicios', 'Servicios' + (servs.length ? ' ' + servs.length : '')]] : []).map(o => html`<button type="button" role="tab" aria-selected=${filtro === o[0] ? 'true' : 'false'} class=${filtro === o[0] ? 'on' : ''} onClick=${() => setFiltro(o[0])}>${o[1]}</button>`)}</div>`;
  const Resumen = vg && conStock.length ? html`<div class="resumen-inv entra"><span><b class="num">${D.m(valor)}</b> en estantes</span><span><b class="num in">${Math.round(margen * 100)} %</b> de ganancia</span>${bajos.length ? html`<span><b class="num amber">${bajos.length}</b> por reponer</span>` : null}</div>` : null;
  const ListaServicios = html`<div class="pila" data-tour="productos">${servicios.length ? html`<section class="tarjeta" style="padding:4px 14px"><div class="lista">${servicios.map(p => html`<button type="button" key=${p.id} class="item toca" style="color:var(--ink)" onClick=${() => editarP({ pid: p.id })}>${FotoProd(p, 34, html`<span class="ic t-azu" style="width:34px;height:34px;font-size:11px;font-weight:700">${p.ab}</span>`)}<span class="crece corta" style="font-size:14px;font-weight:600">${p.n}</span><b class="num">${D.m(p.p)}</b></button>`)}</div></section>`
    : html`<p class="vacio">Agrega lo que cobras sin ser un producto: instalación, revisión, envío… También al vender, con «+ Servicio o cargo».</p>`}
    ${pp && html`<button type="button" class="btn2 acento toca" style="align-self:flex-start" onClick=${() => editarP({ svc: true })}>+ Servicio</button>`}</div>`;

  if (tel) return html`
    <div class="fila entra" style="gap:8px"><h1 class="titulo crece">Inventario</h1>${pp && html`<button type="button" class="icono-btn toca boton-agregar" aria-label="Agregar producto" onClick=${() => editarP({ g: grupo && grupo !== 'sin' ? grupo : '' })}><${Icono} n="mas1" t=${20} g=${2.6} /></button>`}</div>
    <label class="buscador buscador-oscuro entra"><${Icono} n="buscar" t=${17} /><input type="search" value=${q} onInput=${e => setQ(e.target.value)} placeholder=${'Buscar entre ' + listaProductos().length} aria-label="Buscar en el inventario" />${(pp || puede('reponer')) && html`<button type="button" class="buscador-cam toca" aria-label="Escanear con la cámara" onClick=${() => abrir('escaner', { para: 'inventario' })}><${Icono} n="camara" t=${17} /></button>`}</label>
    ${Herramientas}
    ${Pestañas}
    ${filtro !== 'Servicios' && html`<${FiltroGrupos} valor=${grupo} onCambio=${setGrupo} />`}
    ${filtro !== 'Servicios' && Resumen}
    ${filtro === 'Servicios' ? ListaServicios : html`${NoHay(lista, base)}${Tarjetas}${!lista.length && !q.trim() ? html`<p class="vacio">${filtro === 'Por reponer' ? 'Nada por reponer.' : grupo ? 'No hay nada en este grupo.' : 'Todavía no tienes productos.'}</p>` : null}`}`;

  return html`
    <div class="cifras">
      <div class="tarjeta cifra entra"><span class="sub">Valor en estantes</span><span class="v num">${vg ? D.m(valor) : '—'}</span><span class="sub faint">a precio de costo</span></div>
      <div class="tarjeta cifra entra" style="--i:1"><span class="sub">Ganas en promedio</span><span class="v num in">${vg ? Math.round(margen * 100) + ' %' : '—'}</span><span class="sub faint">por cada venta</span></div>
      <div class="tarjeta cifra entra" style="--i:2"><span class="sub">Por reponer</span><span class="v num amber">${bajos.length}</span><span class="sub faint">debajo del mínimo</span></div>
      <div class="tarjeta cifra entra" style="--i:3"><span class="sub">Productos</span><span class="v num">${conStock.length}</span><span class="sub faint">con existencia</span></div>
    </div>
    <div class="pila">
        <div class="fila" style="flex-wrap:wrap;gap:12px">${Pestañas}<span style="flex:1"></span>${Herramientas}${pp && html`<button type="button" class="btn2 lleno toca" onClick=${() => filtro === 'Servicios' ? editarP({ svc: true }) : editarP({ g: grupo && grupo !== 'sin' ? grupo : '' })}>${filtro === 'Servicios' ? '+ Servicio' : '+ Producto'}</button>`}</div>
        ${Buscador}
        ${filtro === 'Servicios' ? ListaServicios : html`<div class="tabla-caja"><table class="tabla">
          <thead><tr><th>Producto</th><th>Grupo</th><th>Código</th><th class="der">Costo</th><th class="der">Precio</th><th class="der">Tienes</th><th class="der">Mínimo</th><th>Estado</th><th></th></tr></thead>
          <tbody>${lista.map((p, i) => { const e = estado(p); return html`<tr key=${p.id} style=${{ animationDelay: i * 25 + 'ms' }}>
            <td>${p.foto ? html`<span class="fila" style="gap:10px;display:inline-flex;vertical-align:middle">${FotoProd(p, 30)}<b style="font-weight:600">${p.n}</b></span>` : html`<b style="font-weight:600">${p.n}</b>`}${p.usd > 0 ? html` <span class="pildora t-ver" title="Precio atado al dólar">US$ ${p.usd}</span>` : null}${vg && p.c > 0 && p.p < p.c * 1.05 ? html` <span class="pildora t-ros">Sin ganancia</span>` : null}</td><td>${PillGrupo(p)}</td><td class="muted num">${p.cod || '—'}</td>
            <td class="der num muted">${vg ? D.m(p.c) : '—'}</td><td class="der num">${D.m(p.p)}</td>
            <td class="der num"><b style=${{ color: e[2] }}>${p.q}</b></td><td class="der num muted">${p.min}</td>
            <td><span class=${'pildora ' + e[1]}>${e[0]}</span></td>
            <td class="der"><span class="fila" style="gap:6px;justify-content:flex-end">${puede('reponer') && html`<button type="button" class="btn2 chico verde toca" onClick=${() => abrir('reponer', { pid: p.id })}>Reponer</button>`}${pp && html`<button type="button" class="btn2 chico toca" onClick=${() => editarP({ pid: p.id })}>Editar</button>`}</span></td>
          </tr>`; })}</tbody>
        </table>${lista.length ? null : q.trim() ? NoHay(lista, base) : html`<p class="vacio">${grupo ? 'No hay nada en este grupo.' : 'Nada por reponer.'}</p>`}</div>`}
    </div>
    <div class="mitades">
      ${vg && html`<section class="tarjeta entra" style="--i:3"><div class="tarjeta-tit">Lo que más te deja<span class="sub">ganancia, 30 días</span></div>
        <${BarrasH} datos=${top.slice().sort((a, b) => b.g - a.g).slice(0, 6).map((t, i) => ({ n: t.n, v: t.g, txt: D.m(t.g), c: color(i), sub: t.q + ' vendidos' }))} /></section>`}
      ${vg && html`<section class="tarjeta entra" style="--i:4"><div class="tarjeta-tit">Dónde está tu dinero<span class="sub">a costo</span></div>
        <${BarrasH} datos=${conStock.slice().sort((a, b) => b.q * b.c - a.q * a.c).slice(0, 6).map((p, i) => ({ n: p.n, v: p.q * p.c, txt: D.m(p.q * p.c), c: color(i + 2), sub: p.q + ' und' }))} /></section>`}
    </div>`;
}
