// Vender (teléfono) y Caja (computadora). En la computadora: lector de códigos, F12 cobra, Esc vacía.
import { html, useState, useEffect, useRef } from '../lib/preact-htm.js';
import { useApp } from '../ctx.js';
import { Icono, avisar, TONOS, hora } from '../ui.js';
import { resumen, inicioDia } from '../datos.js';
import { Reparto, Monto, color } from '../graficos.js';

export function totales(items, neg, P) {
  const sub = items.reduce((a, it) => a + it.q * it.p, 0), tasa = P.tax[1] / 100;
  if (!neg.taxOn || !tasa) return { sub, imp: 0, total: sub, txt: '' };
  if (neg.taxIncl) { const imp = sub - sub / (1 + tasa); return { sub, imp, total: sub, txt: 'Incluye ' + P.tax[0] + ' ' + P.tax[1] + ' %' }; }
  const imp = sub * tasa; return { sub, imp, total: sub + imp, txt: '+ ' + P.tax[0] + ' ' + P.tax[1] + ' %' };
}

let carritoGuardado = {};

export function Vender() {
  const { S, P, T, D, tel, abrir, suc, puede } = useApp();
  const [cart, setCartRaw] = useState(carritoGuardado);
  const setCart = c => { carritoGuardado = c; setCartRaw(c); };
  const [q, setQ] = useState('');
  const lector = useRef(null);
  const prods = S.productos;
  const items = prods.filter(p => cart[p.id]).map(p => ({ pid: p.id, n: p.n, q: cart[p.id], p: p.p, c: p.c }));
  const n = items.reduce((a, it) => a + it.q, 0);
  const tt = totales(items, S.negocio, P);
  const total = D.redondo(tt.total);
  const sumar = (p, d = 1) => {
    const ya = cart[p.id] || 0;
    if (d > 0 && p.q != null && ya + d > p.q) { avisar(p.q === 0 ? p.n + ': agotado' : 'Solo quedan ' + p.q + ' de ' + p.n); return; }
    const c = Object.assign({}, cart); c[p.id] = ya + d; if (c[p.id] <= 0) delete c[p.id]; setCart(c);
  };
  const cobrar = () => { if (!n) return; abrir('cobrar', { items, tt, onListo: () => setCart({}) }); };
  useEffect(() => {
    if (tel) return;
    const tecla = e => {
      if (document.querySelector('.hoja')) return;
      if (e.key === 'F12') { e.preventDefault(); cobrar(); }
      if (e.key === 'F1') { e.preventDefault(); lector.current && lector.current.focus(); }
      if (e.key === 'Escape' && n) { setCart({}); avisar('Venta vaciada'); }
    };
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  });
  const buscar = e => {
    if (e.key !== 'Enter') return;
    const t = q.trim().toLowerCase(); if (!t) return;
    const p = prods.find(x => x.cod && x.cod === t) || prods.find(x => x.n.toLowerCase().includes(t));
    if (p) { sumar(p); avisar('Leído: ' + p.n); setQ(''); } else avisar('No encontré «' + q + '»');
  };
  const visibles = q && tel ? prods.filter(p => p.n.toLowerCase().includes(q.toLowerCase())) : prods;

  const Grilla = html`<div class="productos">${visibles.map((p, i) => { const c = cart[p.id] || 0; return html`
    <button type="button" key=${p.id} class=${'prod toca entra' + (c ? ' on' : '')} style=${{ '--i': i, color: 'var(--ink)' }} onClick=${() => sumar(p)} aria-label=${'Agregar ' + p.n}>
      ${c ? html`<span class="cant" key=${c}>${c}</span>` : null}
      <span class=${'ic ' + TONOS[i % 5]} style="width:36px;height:36px;font-size:13px;font-weight:700">${p.ab}</span>
      <b>${p.n}</b><small class="num">${D.m(p.p)}${p.dur ? ' · ' + (p.dur >= 60 ? p.dur / 60 + ' h' : p.dur + ' min') : ''}</small>
      ${p.q === 0 && html`<span class="sin">Agotado</span>`}
    </button>`; })}</div>`;

  const Lineas = html`<div class="lista lineas" style="min-height:${tel ? 0 : 120}px">${items.length ? items.map(it => html`<div class="item entra" key=${it.pid}>
    <span class="crece" style="display:flex;flex-direction:column;gap:1px"><b class="corta" style="font-size:14px;font-weight:600">${it.n}</b><span class="sub faint num">${D.m(it.p)} c/u</span></span>
    <span class="fila" style="gap:4px">
      <button type="button" class="icono-btn chico toca" style="width:30px;height:30px" aria-label=${'Quitar uno de ' + it.n} onClick=${() => sumar(prods.find(p => p.id === it.pid), -1)}><${Icono} n="menos1" t=${14} g=${2.6} /></button>
      <b class="num" style="min-width:24px;text-align:center">${it.q}</b>
      <button type="button" class="icono-btn chico toca" style="width:30px;height:30px" aria-label=${'Agregar uno de ' + it.n} onClick=${() => sumar(prods.find(p => p.id === it.pid), 1)}><${Icono} n="mas1" t=${14} g=${2.6} /></button>
    </span>
    <b class="num" style="min-width:76px;text-align:right">${D.m(it.q * it.p)}</b>
  </div>`) : html`<p class="vacio">${tel ? 'Toca lo que vas a ' + (T.inv ? 'vender' : 'cobrar') + '.' : 'Pasa el lector o toca un producto. Cada lectura suma uno.'}</p>`}</div>`;

  const Total = html`<div class="fila" style="align-items:flex-end">
    <span class="crece" style="display:flex;flex-direction:column;gap:1px"><span class="sub">Total · ${n} ${n === 1 ? (T.inv ? 'producto' : 'servicio') : (T.inv ? 'productos' : 'servicios')}</span><b class="num" style="font-size:28px;letter-spacing:-0.02em">${D.m(total)}</b>
      ${D.dual && n ? html`<span class="sub num">${D.s(total)}</span>` : null}${tt.txt && n ? html`<span class="sub faint num">${tt.txt}: ${D.m(tt.imp)}</span>` : null}</span>
    ${n ? html`<button type="button" class="btn2 chico toca" onClick=${() => setCart({})}>Vaciar${tel ? '' : html` <span class="tecla">Esc</span>`}</button>` : null}
  </div>`;

  const Boton = html`<button type="button" class=${'btn toca' + (n ? '' : ' apagado')} onClick=${cobrar}>${n ? 'Cobrar ' + D.m(total) : 'Agrega ' + (T.inv ? 'productos' : 'servicios')}${!tel && n ? html` <span class="tecla" style="color:#fff;border-color:rgba(255,255,255,.4)">F12</span>` : null}</button>`;

  if (tel) return html`
    <div class="fila entra"><h1 class="titulo crece">${T.vender === 'Pedido' ? 'Nuevo pedido' : T.vender === 'Cobrar' ? 'Cobrar' : 'Nueva venta'}</h1><span class="sub">Toca para sumar</span></div>
    <label class="buscador entra" style="width:100%;background:var(--surface)"><${Icono} n="buscar" t=${16} c="var(--muted)" /><input type="search" value=${q} onInput=${e => setQ(e.target.value)} placeholder="Buscar" aria-label="Buscar producto" /></label>
    ${Grilla}
    <div class="tarjeta pila entra">${n ? Lineas : null}${Total}</div>
    ${Boton}`;

  // Panel «Hoy en esta caja»: aprovecha el espacio debajo de los productos con lo que el cajero necesita a mano.
  function HoyCaja() {
    const hoy0 = inicioDia(Date.now()), r = resumen(hoy0, Date.now() + 1, suc);
    const ultimas = S.ventas.filter(v => v.t >= hoy0 && (!suc || v.suc === suc)).slice(-6).reverse();
    const pagos = Object.keys(r.porPago).map((k, i) => ({ n: k, v: r.porPago[k], c: k === 'Fiado' ? 'var(--c3)' : color(i) }));
    return html`<div class="mitades">
      <section class="tarjeta entra" style="--i:3"><div class="tarjeta-tit">Hoy${suc ? ' en ' + suc : ' en la caja'}<span class="sub">${r.n} ventas</span></div>
        <div class="rejilla-3" style="margin-bottom:14px">
          <div class="cifra"><span class="sub">Vendido</span><${Monto} v=${r.total} f=${D.m} clase="v" /></div>
          <div class="cifra"><span class="sub">Ticket promedio</span><${Monto} v=${r.ticket} f=${D.m} clase="v" /></div>
          <div class="cifra"><span class="sub">Fiado</span><${Monto} v=${r.fiado} f=${D.m} clase="v amber" /></div>
        </div>
        ${pagos.length ? html`<${Reparto} segs=${pagos} f=${D.m} titulo="Cómo te pagaron" tam=${104} grosor=${9} hueco=${3} />` : html`<p class="vacio">Todavía no hay ventas hoy.</p>`}
      </section>
      <section class="tarjeta entra" style="--i:4;padding-bottom:6px"><div class="tarjeta-tit">Últimas ventas<span class="sub">toca para ver el recibo</span></div>
        <div class="lista">${ultimas.length ? ultimas.map((v, i) => html`<button type="button" key=${v.id} class="item toca entra" style=${{ '--i': i, color: 'var(--ink)' }} onClick=${() => abrir('recibo', { venta: v })}>
          <span class="crece" style="display:flex;flex-direction:column;gap:1px"><b class="corta" style="font-size:14px;font-weight:600">#${v.n} · ${v.items.map(it => it.q + ' × ' + it.n).join(', ')}</b><span class="sub faint">${hora(v.t)} · ${v.pagos.map(p => p.m).join(' + ')}</span></span>
          <b class=${'num' + (v.fiado ? ' amber' : '')}>${D.m(v.total)}</b></button>`) : html`<p class="vacio">Aquí aparecen las ventas de hoy.</p>`}</div>
      </section>
    </div>`;
  }

  return html`<div class="caja-pc">
    <div class="pila" style="gap:14px;min-width:0">
      <label class="buscador" style="width:100%;min-height:54px;border-radius:18px;background:var(--surface);border:1.5px solid var(--line)">
        <${Icono} n="codigo" t=${22} c="var(--accent)" />
        <input ref=${lector} type="text" value=${q} onInput=${e => setQ(e.target.value)} onKeyDown=${buscar} placeholder="Pasa el lector de códigos o escribe el nombre y pulsa Enter" aria-label="Código o nombre" style="font-size:16px" />
        <span class="tecla">F1</span>
      </label>
      ${Grilla}
      ${HoyCaja()}
      <div class="chips sub">${[['F1', 'Buscar'], ['Enter', 'Agregar'], ['F12', 'Cobrar'], ['Esc', 'Vaciar']].map(k => html`<span class="fila" style="gap:6px"><span class="tecla">${k[0]}</span>${k[1]}</span>`)}</div>
    </div>
    <div class="tarjeta pila ticket">
      <div class="tarjeta-tit" style="margin:0">Venta #${(S.ventas.length ? S.ventas[S.ventas.length - 1].n : 1000) + 1}<span class="sub">${S.negocio.escala === 'empresa' ? 'Caja 1' : ''}</span></div>
      ${Lineas}
      <div style="border-top:1px solid var(--line);padding-top:12px">${Total}</div>
      ${Boton}
    </div>
  </div>`;
}
