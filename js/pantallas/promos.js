// Promociones: 2x1, 3x2, % de descuento o precio por mayor, para productos elegidos o un grupo entero.
// Se aplican solas al vender y salen en el recibo.
import { html, useState } from '../lib/preact-htm.js';
import { useApp } from '../ctx.js';
import { listaProductos, guardarPromo, borrarPromo, promoAplica } from '../datos.js';
import { Hoja, Icono, Chips, Interruptor, avisar, fechaCorta } from '../ui.js';
import { buscar } from '../buscar.js';
import { textosProducto, colorGrupo } from './grupos.js';
import { numero } from './pagos.js';

export const textoPromo = (x, D) => x.tipo === 'nxm' ? 'Lleva ' + x.n1 + ', paga ' + x.n2 : x.tipo === 'pct' ? x.v + ' % de descuento' : 'A ' + D.m(x.precio) + ' desde ' + x.n1 + ' unidades';

export function Promos({ d, cerrar }) {
  const { S, D, abrir, puede } = useApp();
  const lista = S.promos || [], prods = listaProductos(), ahora = Date.now();
  const cuantos = x => prods.filter(p => promoAplica(x, p)).length;
  return html`<${Hoja} titulo="Promociones" onCerrar=${cerrar} contenido=${c => ({
    cuerpo: html`<span class="sub" style="margin-top:-6px;line-height:1.45">Se aplican solas al vender: 2x1, 3x2, un porcentaje o precio por mayor. Salen en el recibo.</span>
      ${lista.length ? html`<div class="lista">${lista.map((x, i) => { const vencida = x.hasta && x.hasta < ahora; return html`<button type="button" key=${x.id} class="item toca entra" style=${{ '--i': i, color: 'var(--ink)', opacity: x.activa && !vencida ? 1 : 0.55 }} onClick=${() => c(() => abrir('promo', { prid: x.id }))}>
          <span class="ic t-ros"><${Icono} n="porciento" t=${16} /></span>
          <span class="crece" style="display:flex;flex-direction:column;gap:2px;min-width:0"><b class="corta" style="font-size:14px">${x.n}</b><span class="sub corta">${textoPromo(x, D)} · ${cuantos(x)} ${cuantos(x) === 1 ? 'producto' : 'productos'}${vencida ? ' · terminó' : x.hasta ? ' · hasta ' + fechaCorta(x.hasta) : ''}${!x.activa ? ' · pausada' : ''}</span></span>
          <${Icono} n="sig" t=${16} c="var(--faint)" /></button>`; })}</div>`
        : html`<div class="tarjeta pila entra" style="align-items:center;text-align:center;box-shadow:none;background:var(--fill2)"><span class="ic t-ros"><${Icono} n="porciento" t=${18} /></span><b>Todavía no tienes promociones</b><span class="sub">Por ejemplo: refrescos 2x1 los viernes o 10 % en limpieza.</span></div>`}`,
    pie: puede('productos') ? html`<button type="button" class="btn toca" onClick=${() => c(() => abrir('promo', {}))}>+ Nueva promoción</button>` : null
  })} />`;
}

export function Promo({ d, cerrar }) {
  const { S, D, abrir } = useApp();
  const x0 = (S.promos || []).find(x => x.id === d.prid) || null;
  const prods = listaProductos();
  const [f, setF] = useState(() => x0 ? Object.assign({}, x0, { v: String(x0.v || ''), precio: x0.precio ? String(x0.precio).replace('.', ',') : '' }) : { n: '', tipo: 'nxm', n1: 2, n2: 1, v: '10', precio: '', pids: [], g: '', hasta: 0, activa: true });
  const [alcance, setAlcance] = useState(x0 && x0.g ? 'grupo' : 'prods');
  const [q, setQ] = useState('');
  const pon = o => setF(x => Object.assign({}, x, o));
  const visibles = q.trim() ? buscar(prods, q, textosProducto(S)) : prods.slice().sort((a, b) => f.pids.includes(b.id) - f.pids.includes(a.id));
  const toca = p => pon({ pids: f.pids.includes(p.id) ? f.pids.filter(x => x !== p.id) : f.pids.concat([p.id]) });
  const nombreSug = () => f.tipo === 'nxm' ? f.n1 + 'x' + f.n2 : f.tipo === 'pct' ? numero(f.v) + ' % off' : 'Precio por mayor';
  const guardar = c => {
    const datos = { id: x0 ? x0.id : undefined, n: (f.n || '').trim() || nombreSug(), tipo: f.tipo, activa: f.activa, hasta: f.hasta || 0, pids: alcance === 'prods' ? f.pids : [], g: alcance === 'grupo' ? f.g : '' };
    if (f.tipo === 'nxm') { if (!(f.n1 > f.n2 && f.n2 >= 1)) { avisar('El que lleva debe ser mayor que el que paga'); return; } Object.assign(datos, { n1: f.n1, n2: f.n2 }); }
    if (f.tipo === 'pct') { const v = numero(f.v); if (!(v > 0 && v < 100)) { avisar('El porcentaje va de 1 a 99'); return; } datos.v = v; }
    if (f.tipo === 'desde') { const pr = numero(f.precio); if (!(f.n1 >= 2 && pr > 0)) { avisar('Escribe desde cuántas unidades y el precio'); return; } Object.assign(datos, { n1: f.n1, precio: pr }); }
    if (alcance === 'prods' && !f.pids.length) { avisar('Elige al menos un producto'); return; }
    if (alcance === 'grupo' && !f.g) { avisar('Elige el grupo'); return; }
    guardarPromo(datos); c(() => { avisar('Promoción guardada'); abrir('promos'); });
  };
  const Num = (k, min, txt) => html`<div class="fila" style="gap:8px"><span class="sub crece">${txt}</span><button type="button" class="icono-btn chico toca" aria-label="Menos" onClick=${() => pon({ [k]: Math.max(min, f[k] - 1) })}><${Icono} n="menos1" t=${14} g=${2.6} /></button><b class="num" style="min-width:28px;text-align:center;font-size:18px">${f[k]}</b><button type="button" class="icono-btn chico toca" aria-label="Más" onClick=${() => pon({ [k]: f[k] + 1 })}><${Icono} n="mas1" t=${14} g=${2.6} /></button></div>`;
  const aLocal = t => { if (!t) return ''; const x = new Date(t), p2 = n => String(n).padStart(2, '0'); return x.getFullYear() + '-' + p2(x.getMonth() + 1) + '-' + p2(x.getDate()); };
  return html`<${Hoja} titulo=${x0 ? 'Editar promoción' : 'Nueva promoción'} onCerrar=${cerrar} contenido=${c => ({
    cuerpo: html`
      <div class="campo"><span>Tipo</span><${Chips} opciones=${[{ v: 'nxm', n: 'Lleva y paga menos' }, { v: 'pct', n: 'Porcentaje' }, { v: 'desde', n: 'Precio por mayor' }]} valor=${f.tipo} onCambio=${v => pon({ tipo: v, n1: v === 'desde' ? 6 : 2, n2: 1 })} chico /></div>
      ${f.tipo === 'nxm' && html`<div class="tarjeta pila entra" style="box-shadow:none;background:var(--fill2);gap:8px">${Num('n1', 2, 'Lleva')}${Num('n2', 1, 'Paga')}<span class="sub">Ej.: lleva ${f.n1} y paga ${f.n2}: ${f.n1 - f.n2} ${f.n1 - f.n2 === 1 ? 'sale gratis' : 'salen gratis'}.</span></div>`}
      ${f.tipo === 'pct' && html`<label class="campo entra"><span>Porcentaje de descuento</span><input class="num" type="text" inputmode="decimal" value=${f.v} aria-label="Porcentaje" onInput=${e => pon({ v: e.target.value })} /></label>`}
      ${f.tipo === 'desde' && html`<div class="tarjeta pila entra" style="box-shadow:none;background:var(--fill2);gap:8px">${Num('n1', 2, 'Desde cuántas unidades')}<label class="campo"><span>Precio de cada uno al mayor</span><input class="num" type="text" inputmode="decimal" value=${f.precio} aria-label="Precio al mayor" onInput=${e => pon({ precio: e.target.value })} /></label></div>`}
      <div class="campo"><span>¿A qué se aplica?</span><div class="segmento" style="width:100%">${[['prods', 'Productos'], ['grupo', 'Un grupo']].map(o => html`<button type="button" style="flex:1" class=${alcance === o[0] ? 'on' : ''} onClick=${() => setAlcance(o[0])}>${o[1]}</button>`)}</div></div>
      ${alcance === 'grupo' ? (S.grupos.length ? html`<div class="chips">${S.grupos.map(g => html`<button type="button" key=${g.id} class=${'chip chico toca' + (f.g === g.id ? ' on' : '')} onClick=${() => pon({ g: g.id })}><i class="punto-grupo" style=${{ background: colorGrupo(g) }}></i>${g.n}</button>`)}</div>` : html`<span class="sub">Todavía no tienes grupos. Créalos en la caja con «Grupos».</span>`)
        : html`<label class="buscador" style="width:100%;background:var(--fill2)"><${Icono} n="buscar" t=${16} c="var(--muted)" /><input type="search" value=${q} placeholder=${'Buscar entre ' + prods.length} aria-label="Buscar productos para la promoción" onInput=${e => setQ(e.target.value)} /></label>
          <div class="lista">${visibles.slice(0, 40).map(p => { const on = f.pids.includes(p.id); return html`<button type="button" key=${p.id} class="item toca" role="checkbox" aria-checked=${on ? 'true' : 'false'} style="color:var(--ink)" onClick=${() => toca(p)}><span class=${'casilla' + (on ? ' on' : '')}>${on && html`<${Icono} n="check" t=${13} g=${3} />`}</span><span class="crece corta" style="font-size:14px">${p.n}</span><span class="sub num">${D.m(p.p)}</span></button>`; })}</div>`}
      <label class="campo"><span>Nombre (opcional)</span><input type="text" value=${f.n} placeholder=${nombreSug()} autocomplete="off" onInput=${e => pon({ n: e.target.value })} /></label>
      <label class="campo"><span>Termina (opcional)</span><input type="date" value=${aLocal(f.hasta)} aria-label="Fecha de fin" onChange=${e => pon({ hasta: e.target.value ? new Date(e.target.value + 'T23:59:59').getTime() : 0 })} /></label>
      <${Interruptor} on=${f.activa} onCambio=${v => pon({ activa: v })} titulo="Activa" sub="Apágala para pausarla sin borrarla." />`,
    pie: html`<button type="button" class="btn toca" onClick=${() => guardar(c)}>Guardar promoción</button>${x0 && html`<button type="button" class="btn2 rojo toca" style="min-height:50px;border-radius:25px" onClick=${() => { borrarPromo(x0.id); c(() => { avisar('Promoción borrada'); abrir('promos'); }); }}>Borrar</button>`}`
  })} />`;
}
