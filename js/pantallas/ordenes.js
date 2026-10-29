// Órdenes de trabajo y pedidos: se reciben, se les hace seguimiento por estados y notas,
// se cobran con anticipo y saldo, y se mandan en PDF por WhatsApp o se imprimen.
import { html, useState, useEffect, useRef } from '../lib/preact-htm.js';
import { useApp } from '../ctx.js';
import { ESTADOS_ORDEN, numeroOrden, anticipoDe, ordenAbierta, ordenAtrasada, nuevaOrden, editarOrden, estadoOrden, notaOrden, avisadoOrden, anticipoOrden, entregarOrden, cancelarOrden, listaProductos, listaClientes, nuevoCliente, vender } from '../datos.js';
import { Hoja, Icono, Chips, avisar, iniciales, TONOS, hora, fechaCorta } from '../ui.js';
import { buscar } from '../buscar.js';
import { textosProducto } from './grupos.js';
import { usePagos, numero } from './pagos.js';
import { totales } from './vender.js';
import { pdfOrden, compartirPDF, imprimirOrden, mensajeOrden, enlaceWA, cargarPDF } from '../ordenpdf.js';

const DIA = 86400000;
export const estadoDe = k => ESTADOS_ORDEN.find(e => e.k === k) || { k, n: k === 'cancelada' ? 'Cancelada' : k, tono: 't-ros', c: 'var(--out)' };
const avance = o => o.estado === 'cancelada' ? 0 : (ESTADOS_ORDEN.findIndex(e => e.k === o.estado) + 1) / ESTADOS_ORDEN.length;
// Cuándo se entrega, dicho como lo diría una persona.
export function cuando(t, ahora = Date.now()) {
  if (!t) return 'sin fecha';
  const d0 = new Date(ahora); d0.setHours(0, 0, 0, 0);
  const dias = Math.floor((t - d0.getTime()) / DIA), h = hora(t);
  if (dias === 0) return 'hoy ' + h; if (dias === 1) return 'mañana ' + h; if (dias === -1) return 'ayer ' + h;
  if (dias > 1 && dias < 7) return new Date(t).toLocaleDateString('es', { weekday: 'short' }).replace('.', '') + ' ' + h;
  return fechaCorta(t) + ' ' + h;
}
const atrasoTxt = (o, ahora = Date.now()) => { const d = Math.floor((ahora - o.entrega) / DIA); return d >= 1 ? 'Atrasada ' + d + (d === 1 ? ' día' : ' días') : 'Atrasada'; };
export function useOrden() {
  const { S, P } = useApp();
  return { total: o => totales(o.items, S.negocio, P).total, saldo: o => Math.max(0, totales(o.items, S.negocio, P).total - anticipoDe(o.id)) };
}
const nombreCli = (S, o) => (S.clientes.find(c => c.id === o.cli) || {}).n || 'Sin cliente';

// ---------- tarjeta de una orden ----------
function TarjetaOrden({ o, i, compacta, arrastrable, tablero }) {
  const { S, D, abrir } = useApp();
  const { total, saldo } = useOrden();
  const e = estadoDe(o.estado), tarde = ordenAtrasada(o), ant = anticipoDe(o.id), resp = (S.perfiles.find(p => p.id === o.resp) || {}).n;
  return html`<button type="button" class=${'orden-tarjeta toca entra' + (tarde ? ' tarde' : '') + (o.estado === 'entregada' || o.estado === 'cancelada' ? ' cerrada' : '')} style=${{ '--i': i || 0 }}
    draggable=${arrastrable ? 'true' : 'false'} onDragStart=${ev => { ev.dataTransfer.setData('text/plain', o.id); ev.dataTransfer.effectAllowed = 'move'; }}
    onClick=${() => abrir('orden', { oid: o.id })}>
    <span class="fila" style="gap:8px"><b class="num orden-num">${numeroOrden(o)}</b>${tarde && html`<span class="pildora t-ros"><span class="punto"></span>${atrasoTxt(o)}</span>`}<span class="crece"></span>
      ${compacta ? html`<span class="sub">${o.estado === 'entregada' ? fechaCorta(o.entregada || o.t) : cuando(o.entrega).split(' ')[0]}</span>`
        : tablero ? (o.estado === 'lista' && o.avisado && !tarde ? html`<span class="pildora t-ver">Avisado</span>` : null)
        : html`<span class=${'pildora ' + e.tono}>${o.estado === 'lista' && o.avisado ? 'Lista · avisado' : e.n}</span>`}</span>
    <b class="orden-que">${o.que}</b>
    <span class="sub corta">${nombreCli(S, o)}${compacta ? '' : ' · entrega ' + cuando(o.entrega) + (resp ? ' · ' + resp.split(' ')[0] : '')}</span>
    ${!compacta && o.estado !== 'cancelada' && html`<span class="barra-prog"><i style=${{ width: Math.round(avance(o) * 100) + '%', background: e.c }}></i></span>`}
    ${o.estado === 'cancelada' ? html`<span class="sub">Cancelada</span>`
      : html`<span class="fila sub num" style="gap:6px"><span class="crece corta">${compacta ? D.m(total(o)) : 'Total ' + D.m(total(o)) + (ant > 0 ? ' · abonó ' + D.m(ant) : '')}</span>${o.estado !== 'entregada' && saldo(o) > 0 && html`<b style="color:var(--ink)">Debe ${D.m(saldo(o))}</b>`}${o.estado === 'entregada' && html`<span class="pildora t-ver">Cobrada</span>`}</span>`}
  </button>`;
}

// ---------- la sección ----------
export function Ordenes() {
  const { S, D, tel, abrir, puede } = useApp();
  const { saldo } = useOrden();
  const [filtro, setFiltro] = useState('abiertas');
  const [q, setQ] = useState('');
  const [sobre, setSobre] = useState('');
  const pp = puede('ordenes'), ahora = Date.now();
  const todas = S.ordenes.slice().reverse();
  const abiertas = todas.filter(ordenAbierta), atrasadas = abiertas.filter(o => ordenAtrasada(o, ahora));
  const porCobrar = abiertas.reduce((a, o) => a + saldo(o), 0), anticipos = abiertas.reduce((a, o) => a + anticipoDe(o.id), 0);
  const textos = o => { const c = S.clientes.find(x => x.id === o.cli) || {}; return [numeroOrden(o), o.que, c.n, c.tel, o.det, o.items.map(it => it.n).join(' ')]; };
  const buscadas = q.trim() ? buscar(todas, q, textos, true) : todas;
  // Primero las atrasadas, después por fecha de entrega (las sin fecha al final).
  const orden = lista => lista.slice().sort((a, b) => (ordenAtrasada(b, ahora) - ordenAtrasada(a, ahora)) || ((a.entrega || 9e15) - (b.entrega || 9e15)));
  const nueva = () => pp ? abrir('nuevaOrden', {}) : avisar('Tu perfil no puede crear órdenes');
  const cuenta = k => abiertas.filter(o => o.estado === k).length;
  const opciones = [{ v: 'abiertas', n: 'Abiertas ' + abiertas.length }].concat(atrasadas.length ? [{ v: 'atrasadas', n: 'Atrasadas ' + atrasadas.length }] : [],
    ESTADOS_ORDEN.slice(0, 3).map(e => ({ v: e.k, n: e.n + (e.k === 'lista' ? 's' : e.k === 'recibida' ? 's' : '') + ' ' + cuenta(e.k) })), [{ v: 'entregada', n: 'Entregadas' }, { v: 'cancelada', n: 'Canceladas' }]);
  const filtrada = orden(buscadas.filter(o => filtro === 'abiertas' ? ordenAbierta(o) : filtro === 'atrasadas' ? ordenAtrasada(o, ahora) : o.estado === filtro));
  const Cifras = html`<div class="rejilla-2" style="gap:10px">
    <div class="tarjeta cifra entra"><span class="sub">Abiertas</span><span class="v num" style="font-size:22px">${abiertas.length}</span><span class=${'sub' + (atrasadas.length ? ' out' : ' faint')}>${atrasadas.length ? atrasadas.length + (atrasadas.length === 1 ? ' atrasada' : ' atrasadas') : 'ninguna atrasada'}</span></div>
    <div class="tarjeta cifra entra" style="--i:1"><span class="sub">Por cobrar</span><span class="v num" style="font-size:22px">${D.m(porCobrar)}</span><span class="sub faint">${anticipos > 0 ? 'anticipos ' + D.m(anticipos) : 'sin anticipos'}</span></div>
  </div>`;
  const Buscador = html`<label class="buscador entra" style=${{ width: '100%', background: 'var(--surface)', maxWidth: tel ? 'none' : '380px' }}><${Icono} n="buscar" t=${16} c="var(--muted)" /><input type="search" value=${q} onInput=${e => setQ(e.target.value)} placeholder="Buscar por cliente, número o equipo" aria-label="Buscar órdenes" /></label>`;
  const Vacio = html`<div class="tarjeta pila entra" style="align-items:center;text-align:center;padding:26px 18px">
    <span class="ic t-vio" style="width:52px;height:52px;border-radius:16px"><${Icono} n="orden" t=${24} /></span>
    <b style="font-size:16px">${S.ordenes.length ? 'No hay órdenes aquí' : 'Todavía no tienes órdenes'}</b>
    <span class="sub" style="line-height:1.45;max-width:320px">Anota lo que te dejan para reparar o lo que te encargan, con fecha de entrega, anticipo y seguimiento.</span>
    ${pp && !S.ordenes.length && html`<button type="button" class="btn2 lleno toca" onClick=${nueva}>+ Crear la primera orden</button>`}</div>`;

  if (tel) return html`
    <div class="fila entra"><h1 class="titulo crece">Órdenes</h1>${pp && html`<button type="button" class="btn2 chico lleno toca" data-tour="nueva-orden" onClick=${nueva}>+ Nueva orden</button>`}</div>
    ${Cifras}${Buscador}
    <${Chips} opciones=${opciones} valor=${filtro} onCambio=${setFiltro} desliza chico />
    <div class="pila" data-tour="ordenes">${filtrada.length ? filtrada.map((o, i) => html`<${TarjetaOrden} key=${o.id} o=${o} i=${i} />`) : Vacio}</div>`;

  // Computadora: tablero por estado; las tarjetas se arrastran de una columna a otra.
  const semana = ahora - 7 * DIA;
  const columnas = ESTADOS_ORDEN.map(e => ({ e, lista: e.k === 'entregada' ? buscadas.filter(o => o.estado === 'entregada' && (o.entregada || o.t) >= semana) : orden(buscadas.filter(o => o.estado === e.k)) }));
  const soltar = (ev, k) => {
    ev.preventDefault(); setSobre('');
    const o = S.ordenes.find(x => x.id === ev.dataTransfer.getData('text/plain'));
    if (!o || o.estado === k || !ordenAbierta(o)) return;
    if (!pp) { avisar('Tu perfil no puede cambiar órdenes'); return; }
    if (k === 'entregada') { abrir('orden', { oid: o.id, entregar: true }); return; }
    estadoOrden(o.id, k); avisar(numeroOrden(o) + ': ' + estadoDe(k).n.toLowerCase());
  };
  const canceladas = buscadas.filter(o => o.estado === 'cancelada');
  return html`
    <div class="fila entra" style="gap:12px;flex-wrap:wrap">${Buscador}<span class="sub crece">${abiertas.length} abiertas${atrasadas.length ? ' · ' : ''}${atrasadas.length ? html`<b class="out">${atrasadas.length} atrasadas</b>` : ''} · por cobrar ${D.m(porCobrar)}</span>
      ${pp && html`<button type="button" class="btn2 lleno toca" data-tour="nueva-orden" onClick=${nueva}>+ Nueva orden</button>`}</div>
    <div class="tablero-ordenes" data-tour="ordenes">${columnas.map(({ e, lista }) => html`
      <section key=${e.k} class=${'orden-col' + (sobre === e.k ? ' sobre' : '')} onDragOver=${ev => { ev.preventDefault(); if (sobre !== e.k) setSobre(e.k); }} onDragLeave=${ev => { if (!ev.currentTarget.contains(ev.relatedTarget)) setSobre(''); }} onDrop=${ev => soltar(ev, e.k)}>
        <h3 class="fila"><i class="punto-grupo" style=${{ background: e.c }}></i><span class="crece">${e.k === 'entregada' ? 'Entregadas (7 días)' : e.n + (e.k === 'proceso' ? '' : 's')}</span><span class="sub num">${lista.length}</span></h3>
        ${lista.map((o, i) => html`<${TarjetaOrden} key=${o.id} o=${o} i=${i} compacta=${e.k === 'entregada'} tablero arrastrable=${pp && ordenAbierta(o)} />`)}
        ${!lista.length && html`<p class="sub faint" style="text-align:center;padding:14px 6px">${e.k === 'recibida' ? 'Las órdenes nuevas llegan aquí' : 'Arrastra una orden aquí'}</p>`}
      </section>`)}</div>
    ${canceladas.length > 0 && html`<details class="tarjeta entra"><summary class="sub" style="cursor:pointer">Canceladas (${canceladas.length})</summary><div class="lista" style="margin-top:8px">${canceladas.map(o => html`<button type="button" class="item toca" style="color:var(--ink)" onClick=${() => abrir('orden', { oid: o.id })}><b class="num orden-num">${numeroOrden(o)}</b><span class="crece corta">${o.que} · ${nombreCli(S, o)}</span><span class="sub">${fechaCorta(o.cancelada || o.t)}</span></button>`)}</div></details>`}`;
}

// ---------- detalle y seguimiento ----------
export function Orden({ d, cerrar }) {
  const { S, P, D, T, abrir, puede } = useApp();
  const { total, saldo } = useOrden();
  const o = S.ordenes.find(x => x.id === d.oid);
  const [txt, setTxt] = useState('');
  const pdf = useRef(null), pdfDe = useRef(''), cierra = useRef(null);
  const ctx = { S, P, D };
  const pp = puede('ordenes');
  // El PDF se prepara apenas se abre la orden: así el teléfono deja compartirlo al tocar el botón.
  const firma = o ? JSON.stringify([o.estado, o.items, o.que, o.det, o.entrega, o.resp, anticipoDe(o.id), S.negocio.logo ? S.negocio.logo.length : 0, S.negocio.condOrden]) : '';
  useEffect(() => { if (!o || pdfDe.current === firma) return; pdfDe.current = firma; pdf.current = null; pdfOrden(o, ctx).then(b => { if (pdfDe.current === firma) pdf.current = b; }).catch(() => {}); }, [firma]);
  useEffect(() => { if (o && d.entregar) avisar('Toca «Entregar» para cobrar y cerrar la orden'); }, []);
  if (!o) return null;
  const e = estadoDe(o.estado), abierta = ordenAbierta(o), ant = anticipoDe(o.id), tot = total(o), deb = saldo(o);
  const cli = S.clientes.find(c => c.id === o.cli) || {};
  const quien = id => ((S.perfiles.find(p => p.id === id) || {}).n || '').split(' ')[0];
  const idx = ESTADOS_ORDEN.findIndex(x => x.k === o.estado);

  const avisar2 = () => { if (!cli.tel) { avisar('El cliente no tiene teléfono: agrégalo en Editar orden'); return false; } window.open(enlaceWA(cli.tel, mensajeOrden(Object.assign({}, o, { estado: 'lista' }), ctx), P.id), '_blank', 'noopener'); avisadoOrden(o.id); return true; };
  const pasar = k => {
    if (!pp) { avisar('Tu perfil no puede cambiar órdenes'); return; }
    if (k === 'entregada') { entregar(); return; }
    estadoOrden(o.id, k); avisar(numeroOrden(o) + ': ' + estadoDe(k).n.toLowerCase());
  };
  // Entregar: se cobra lo que falta (si falta algo) y la orden queda unida a esa venta.
  function entregar() {
    const c = cierra.current;
    if (!pp) { avisar('Tu perfil no puede entregar órdenes'); return; }
    if (!puede('vender')) { avisar('Tu perfil no puede cobrar'); return; }
    const items = o.items.map(it => Object.assign({}, it)), tt = totales(items, S.negocio, P);
    if (!items.length) { avisar('Agrega los trabajos o productos antes de entregar'); return; }
    if (D.redondo(tt.total - ant) <= 0.004) {
      const venta = vender({ items, pagos: [{ m: 'Anticipo', v: D.redondo(tt.total) }], cli: o.cli, suc: o.suc, total: tt.total });
      venta.orden = o.id; venta.imp = tt.imp; venta.impTxt = tt.txt;
      entregarOrden(o.id, venta.id);
      c(() => { avisar(numeroOrden(o) + ' entregada: ya estaba pagada'); abrir('recibo', { venta, nueva: true }); });
      return;
    }
    c(() => abrir('cobrar', { items, tt, cli: o.cli, anticipo: ant, orden: o.id, titulo: 'Entregar ' + numeroOrden(o), onListo: venta => entregarOrden(o.id, venta.id) }));
  }
  const enviar = async () => {
    try {
      const b = pdf.current || await pdfOrden(o, ctx);
      const r = await compartirPDF(b, o, ctx);
      if (r !== 'cancelado') notaOrden(o.id, r === 'compartido' ? 'Se envió el PDF' : 'Se descargó el PDF' + (cli.tel ? ' y se abrió WhatsApp' : ''));
    } catch (er) { avisar('No pude preparar el PDF. Prueba otra vez.'); }
  };
  const agregarNota = () => { const t = txt.trim(); if (!t) return; notaOrden(o.id, t); setTxt(''); if (document.activeElement) document.activeElement.blur(); avisar('Nota agregada'); };
  const Principal = !abierta ? null
    : o.estado === 'recibida' ? html`<button type="button" class="btn2 acento toca orden-accion" onClick=${() => pasar('proceso')}><${Icono} n="sig" t=${16} />Empezar el trabajo</button>`
    : o.estado === 'proceso' ? html`<button type="button" class="btn2 verde toca orden-accion" onClick=${() => { pasar('lista'); if (cli.tel) avisar2(); }}><${Icono} n="check" t=${16} g=${2.6} />Marcar como lista${cli.tel ? ' y avisar al cliente' : ''}</button>`
    : html`<div class="rejilla-2" style="gap:10px">${!o.avisado && cli.tel ? html`<button type="button" class="btn2 verde toca orden-accion" onClick=${avisar2}>Avisar que está lista</button>` : html`<span class="sub" style="align-self:center;text-align:center">${o.avisado ? 'Avisado ' + cuando(o.avisado) : 'Lista para entregar'}</span>`}<button type="button" class="btn2 lleno toca orden-accion" onClick=${() => entregar()}>${deb > 0 ? 'Entregar y cobrar ' + D.m(deb) : 'Entregar'}</button></div>`;

  return html`<${Hoja} titulo=${numeroOrden(o) + ' · ' + (cli.n || 'Sin cliente').split(' ')[0]} onCerrar=${cerrar} contenido=${c => (cierra.current = c, {
    cuerpo: html`
      <span class="sub" style="margin-top:-8px">${o.que}</span>
      ${o.estado === 'cancelada' ? html`<div class="tarjeta fila" style="background:var(--out-soft);box-shadow:none;gap:10px"><${Icono} n="alerta" t=${18} c="var(--out)" /><span class="sub" style="color:var(--ink)">Cancelada ${fechaCorta(o.cancelada || o.t)}${(o.hist.slice().reverse().find(h => h.e === 'cancelada') || {}).txt ? ': ' + o.hist.slice().reverse().find(h => h.e === 'cancelada').txt : ''}</span></div>`
        : html`<div class="orden-pasos" role="group" aria-label="Estado de la orden">${ESTADOS_ORDEN.map((x, i) => html`<button type="button" key=${x.k} class=${'toca' + (i < idx ? ' hecho' : i === idx ? ' actual' : '')} disabled=${!abierta || !pp} aria-current=${i === idx ? 'step' : 'false'} onClick=${() => i !== idx && pasar(x.k)}><b>${i < idx ? html`<${Icono} n="check" t=${14} g=${3} />` : i + 1}</b>${x.n}</button>`)}</div>`}
      ${pp && Principal}
      <div class="rejilla-2" style="gap:10px">
        <button type="button" class="btn2 toca wa-suave" onClick=${enviar}><${Icono} n="descarga" t=${15} />PDF por WhatsApp</button>
        <button type="button" class="btn2 toca" onClick=${() => { imprimirOrden(o, ctx); notaOrden(o.id, 'Se imprimió'); }}><${Icono} n="doc" t=${15} />Imprimir</button>
      </div>
      <div class="tarjeta pila" style="box-shadow:none;background:var(--fill2);padding:12px 14px;gap:6px">
        ${o.items.map(it => html`<div class="fila sub num" style="gap:8px"><span class="crece corta" style="color:var(--ink)">${it.q > 1 ? it.q + ' × ' : ''}${it.n}</span><span>${D.m(it.q * it.p)}</span></div>`)}
        ${!o.items.length && html`<span class="sub">Sin trabajos ni productos todavía.</span>`}
        <div class="fila" style="border-top:1px solid var(--line);padding-top:8px;margin-top:2px"><span class="crece sub">Total</span><b class="num">${D.m(tot)}</b></div>
        ${ant > 0 && html`<div class="fila sub num"><span class="crece">Anticipos y abonos</span><span>−${D.m(ant)}</span></div>`}
        ${o.estado !== 'cancelada' && html`<div class="fila"><b class="crece">${o.estado === 'entregada' ? 'Cobrada' : 'Debe'}</b><b class="num" style="font-size:18px">${D.m(o.estado === 'entregada' ? tot : deb)}</b></div>`}
        ${D.dual && o.estado !== 'entregada' && deb > 0 && html`<span class="sub num" style="text-align:right">${D.s(deb)}</span>`}
        ${abierta && pp && deb > 0 && html`<button type="button" class="enlace-tasa toca" style="align-self:flex-start" onClick=${() => c(() => abrir('abonoOrden', { oid: o.id }))}>+ Anotar un abono</button>`}
      </div>
      <div class="pila" style="gap:4px">
        <span class="sub">Cliente: <b style="color:var(--ink)">${cli.n || '—'}</b>${cli.tel ? ' · ' + cli.tel : ''}</span>
        <span class="sub">Entrega: <b style=${{ color: ordenAtrasada(o) ? 'var(--out-text)' : 'var(--ink)' }}>${o.entrega ? cuando(o.entrega) : 'sin fecha'}</b>${o.resp ? ' · Responsable: ' + quien(o.resp) : ''}</span>
        ${o.det && html`<span class="sub" style="white-space:pre-wrap;line-height:1.45">${o.det}</span>`}
      </div>
      <b style="font-size:14px;margin-top:4px">Seguimiento</b>
      ${abierta && pp && html`<div class="fila" style="gap:8px"><label class="buscador crece" style="background:var(--fill2)"><input type="text" value=${txt} placeholder="Escribe una nota para el seguimiento…" aria-label="Nota para el seguimiento" autocomplete="off" onInput=${ev => setTxt(ev.target.value)} onKeyDown=${ev => { if (ev.key === 'Enter') agregarNota(); }} /></label><button type="button" class="btn2 chico acento toca" onClick=${agregarNota}>Anotar</button></div>`}
      <div class="orden-linea">${o.hist.slice().reverse().map((h, i) => { const ex = h.e ? estadoDe(h.e) : null; return html`<div key=${h.t + '-' + i} class="entra" style=${{ '--c': ex ? ex.c : h.ant ? 'var(--in)' : 'var(--faint)', '--i': i }}>
        <b>${ex ? ex.n : h.ant ? h.tipo + ' ' + D.m(h.ant) : 'Nota'}</b><span class="sub"> · ${quien(h.por) || '—'} · ${cuando(h.t)}</span>
        ${h.ant ? html`<span class="sub" style="display:block">${h.m}</span>` : h.txt && html`<span class="sub" style="display:block;white-space:pre-wrap">${h.txt}</span>`}</div>`; })}</div>`,
    pie: abierta && pp ? html`<div class="rejilla-2" style="gap:10px"><button type="button" class="btn2 toca" style="min-height:50px;border-radius:25px" onClick=${() => c(() => abrir('nuevaOrden', { oid: o.id }))}><${Icono} n="lapiz" t=${15} />Editar orden</button><button type="button" class="btn2 rojo toca" style="min-height:50px;border-radius:25px" onClick=${() => c(() => abrir('cancelarOrden', { oid: o.id }))}>Cancelar orden</button></div>`
      : o.venta && S.ventas.find(v => v.id === o.venta) ? html`<button type="button" class="btn2 toca" style="min-height:50px;border-radius:25px" onClick=${() => c(() => abrir('recibo', { venta: S.ventas.find(v => v.id === o.venta) }))}>Ver el recibo de la venta</button>` : null
  })} />`;
}

// ---------- crear o editar ----------
const aLocal = t => { if (!t) return ''; const x = new Date(t), p = n => String(n).padStart(2, '0'); return x.getFullYear() + '-' + p(x.getMonth() + 1) + '-' + p(x.getDate()) + 'T' + p(x.getHours()) + ':' + p(x.getMinutes()); };
const enDias = (dias, h = 17) => { const x = new Date(); x.setDate(x.getDate() + dias); x.setHours(h, 0, 0, 0); return x.getTime(); };

export function NuevaOrden({ d, cerrar }) {
  const { S, D, T, abrir, yo, tel } = useApp();
  const o0 = d.oid ? S.ordenes.find(x => x.id === d.oid) : null;
  const tipoBase = T.id === 'comida' || T.id === 'online' ? 'pedido' : 'trabajo';
  const [f, setF] = useState(() => o0 ? { tipo: o0.tipo, cli: o0.cli, que: o0.que, det: o0.det || '', items: o0.items.map(it => Object.assign({}, it)), entrega: o0.entrega || 0, resp: o0.resp || '' }
    : { tipo: d.tipo || tipoBase, cli: d.cli || '', que: '', det: '', items: [], entrega: enDias(1), resp: yo ? yo.id : '' });
  const pon = x => setF(v => Object.assign({}, v, x));
  const [qc, setQc] = useState('');
  const [telNuevo, setTelNuevo] = useState('');
  const [qp, setQp] = useState('');
  const [agregando, setAgregando] = useState(false);
  const [ant, setAnt] = useState('');
  const antV = o0 ? 0 : D.redondo(numero(ant));
  const fp = usePagos(antV, S.negocio.pays);
  const cli = S.clientes.find(c => c.id === f.cli);
  const clientes = listaClientes(), sugeridos = qc.trim() ? buscar(clientes, qc, c => [c.n, c.tel], true).slice(0, 4) : [];
  const prods = listaProductos(), hallados = qp.trim() ? buscar(prods, qp, textosProducto(S)).slice(0, 5) : [];
  const total = f.items.reduce((a, it) => a + it.q * it.p, 0);
  const ponItem = (i, x) => pon({ items: f.items.map((it, k) => k === i ? Object.assign({}, it, x) : it) });
  const agregar = it => { pon({ items: f.items.concat([it]) }); setQp(''); setAgregando(false); if (document.activeElement) document.activeElement.blur(); };
  const libre = n => agregar({ pid: 'libre:' + Math.random().toString(36).slice(2, 8), n, q: 1, p: 0, c: 0, libre: true });
  const perfiles = S.perfiles.filter(p => !p.inactivo && !p.borrado);
  const guardar = c => {
    let cid = f.cli;
    if (!cid && !qc.trim()) { avisar('Elige o escribe el cliente'); return; }
    if (!f.que.trim()) { avisar(f.tipo === 'pedido' ? 'Escribe qué te piden' : 'Escribe qué te dejan o qué hay que hacer'); return; }
    if (f.items.some(it => !it.n.trim())) { avisar('Hay un trabajo sin nombre'); return; }
    if (antV > 0 && !fp.ok) { avisar('Reparte el anticipo entre las formas de pago'); return; }
    if (antV > total + 0.004 && total > 0) { avisar('El anticipo es más que el total'); return; }
    if (!cid) cid = nuevoCliente({ n: qc.trim(), tel: telNuevo.trim() }).id;
    const datos = { tipo: f.tipo, cli: cid, que: f.que.trim(), det: f.det.trim(), items: f.items.map(it => Object.assign({}, it, { n: it.n.trim() })), entrega: f.entrega || 0, resp: f.resp };
    if (o0) { editarOrden(o0.id, datos); c(() => { avisar('Orden guardada'); abrir('orden', { oid: o0.id }); }); return; }
    const o = nuevaOrden(datos, antV > 0 ? fp.pagos() : null);
    c(() => { avisar(numeroOrden(o) + ' creada'); abrir('orden', { oid: o.id }); });
  };
  const rapidas = [[0, 'Hoy'], [1, 'Mañana'], [3, 'En 3 días'], [7, 'En 1 semana']];
  return html`<${Hoja} titulo=${o0 ? 'Editar ' + numeroOrden(o0) : 'Nueva orden'} onCerrar=${cerrar} contenido=${c => ({
    cuerpo: html`
      ${!o0 && html`<div class="segmento" style="width:100%">${[['trabajo', 'Orden de trabajo'], ['pedido', 'Pedido']].map(x => html`<button type="button" style="flex:1" class=${f.tipo === x[0] ? 'on' : ''} onClick=${() => pon({ tipo: x[0] })}>${x[1]}</button>`)}</div>`}
      <div class="campo"><span>Cliente</span>
        ${cli ? html`<div class="tarjeta fila entra" style="box-shadow:none;background:var(--fill2);padding:10px 12px;gap:10px"><span class=${'logo redondo ' + TONOS[Math.max(0, S.clientes.indexOf(cli)) % 5]} style="width:34px;height:34px;font-size:12px">${iniciales(cli.n)}</span><span class="crece" style="display:flex;flex-direction:column"><b style="font-size:14px">${cli.n}</b><span class="sub">${cli.tel || 'sin teléfono'}</span></span><button type="button" class="btn2 chico toca" onClick=${() => { pon({ cli: '' }); setQc(''); }}>Cambiar</button></div>`
        : html`<input type="text" value=${qc} placeholder="Nombre del cliente" autocomplete="off" aria-label="Cliente" onInput=${e => setQc(e.target.value)} />
          ${sugeridos.length > 0 && html`<div class="lista entra">${sugeridos.map(x => html`<button type="button" key=${x.id} class="item toca" style="color:var(--ink)" onClick=${() => { pon({ cli: x.id }); setQc(''); }}><span class="crece">${x.n}</span><span class="sub">${x.tel || ''}</span></button>`)}</div>`}
          ${qc.trim() && !sugeridos.some(x => x.n.toLowerCase() === qc.trim().toLowerCase()) && html`<div class="tarjeta pila entra" style="box-shadow:none;background:var(--accent-soft);padding:10px 12px;gap:8px"><span class="sub" style="color:var(--ink)">Cliente nuevo: <b>${qc.trim()}</b></span><input type="tel" inputmode="tel" value=${telNuevo} placeholder="Teléfono (para avisarle por WhatsApp)" autocomplete="off" aria-label="Teléfono del cliente nuevo" onInput=${e => setTelNuevo(e.target.value)} /></div>`}`}
      </div>
      <label class="campo"><span>${f.tipo === 'pedido' ? 'Qué te piden' : 'Qué se recibe y qué hay que hacer'}</span><input type="text" value=${f.que} placeholder=${f.tipo === 'pedido' ? 'Ej.: 3 tortas de cumpleaños' : 'Ej.: Laptop HP 15 — no enciende'} autocomplete="off" onInput=${e => pon({ que: e.target.value })} /></label>
      <label class="campo"><span>${f.tipo === 'pedido' ? 'Detalles del pedido' : 'Detalles y estado en que llega'} (opcional)</span><textarea rows="2" value=${f.det} placeholder=${f.tipo === 'pedido' ? 'Sabor, tamaño, dirección de envío…' : 'Con cargador. Rayón en la tapa. Clave de desbloqueo…'} onInput=${e => pon({ det: e.target.value })}></textarea></label>
      <div class="campo"><span>${T.inv ? 'Trabajos, repuestos y productos' : 'Trabajos y servicios'}</span>
        <div class="tarjeta pila" style="box-shadow:none;background:var(--fill2);padding:8px 12px;gap:0">
          ${f.items.map((it, i) => html`<div class="orden-item entra" key=${it.pid + i}>
            ${it.libre ? html`<input type="text" class="crece" value=${it.n} placeholder="Trabajo" aria-label="Nombre del trabajo" onInput=${e => ponItem(i, { n: e.target.value })} />` : html`<span class="crece corta" style="font-size:14px">${it.n}</span>`}
            <input class="num orden-q" type="text" inputmode="numeric" value=${String(it.q)} aria-label="Cantidad" onInput=${e => ponItem(i, { q: Math.max(1, Math.round(numero(e.target.value)) || 1) })} />
            <input class="num orden-p" type="text" inputmode="decimal" value=${it.p ? String(it.p).replace('.', ',') : ''} placeholder="Precio" aria-label="Precio" onChange=${e => ponItem(i, { p: D.redondo(numero(e.target.value)) })} />
            <button type="button" class="icono-btn chico toca" style="width:30px;height:30px" aria-label="Quitar" onClick=${() => pon({ items: f.items.filter((_, k) => k !== i) })}><${Icono} n="cerrar" t=${12} g=${2.6} /></button>
          </div>`)}
          ${agregando ? html`<div class="pila entra" style="gap:6px;padding:8px 0">
              <label class="buscador" style="width:100%;background:var(--surface)"><${Icono} n="buscar" t=${15} c="var(--muted)" /><input type="search" value=${qp} placeholder=${'Busca ' + (T.inv ? 'un producto' : 'un servicio') + ' o escribe el trabajo'} aria-label="Agregar trabajo o producto" onInput=${e => setQp(e.target.value)} onKeyDown=${e => { if (e.key === 'Enter' && qp.trim()) libre(qp.trim()); }} /></label>
              ${hallados.map(p => html`<button type="button" key=${p.id} class="item toca" style="color:var(--ink);padding:8px 2px;border:0;background:none;display:flex;gap:10px" onClick=${() => agregar({ pid: p.id, n: p.n, q: 1, p: p.p, c: p.c, ...(p.imp != null ? { imp: p.imp } : {}) })}><span class="crece corta" style="text-align:left">${p.n}</span>${p.q != null ? html`<span class="sub">${p.q} und</span>` : null}<b class="num">${D.m(p.p)}</b></button>`)}
              <div class="chips">${qp.trim() ? html`<button type="button" class="chip chico toca on" onClick=${() => libre(qp.trim())}>+ Agregar «${qp.trim()}»</button>` : ['Diagnóstico', 'Mano de obra', 'Revisión'].map(n => html`<button type="button" class="chip chico toca" onClick=${() => libre(n)}>+ ${n}</button>`)}<button type="button" class="chip chico toca" onClick=${() => { setAgregando(false); setQp(''); }}>Listo</button></div>
            </div>`
          : html`<button type="button" class="enlace-tasa toca" style="align-self:flex-start;padding:10px 0" onClick=${() => setAgregando(true)}>+ Agregar trabajo o producto</button>`}
          ${f.items.length > 0 && html`<div class="fila" style="border-top:1px solid var(--line);padding:9px 0 3px"><span class="crece sub">Total</span><b class="num">${D.m(total)}</b></div>`}
        </div>
        <span class="sub faint" style="font-size:12px">Puedes dejarlo vacío y agregarlo después del diagnóstico.${T.inv ? ' Los productos se descuentan del inventario al entregar.' : ''}</span>
      </div>
      <div class="campo"><span>Entrega</span>
        <div class="chips">${rapidas.map(r => { const v = enDias(r[0], r[0] === 0 ? Math.max(new Date().getHours() + 2, 17) % 24 : 17); const on = f.entrega && new Date(f.entrega).toDateString() === new Date(v).toDateString(); return html`<button type="button" class=${'chip chico toca' + (on ? ' on' : '')} onClick=${() => pon({ entrega: v })}>${r[1]}</button>`; })}<button type="button" class=${'chip chico toca' + (!f.entrega ? ' on' : '')} onClick=${() => pon({ entrega: 0 })}>Sin fecha</button></div>
        <input type="datetime-local" value=${aLocal(f.entrega)} aria-label="Fecha y hora de entrega" onChange=${e => pon({ entrega: e.target.value ? new Date(e.target.value).getTime() : 0 })} />
      </div>
      ${perfiles.length > 1 && html`<div class="campo"><span>Responsable</span><${Chips} opciones=${perfiles.map(p => ({ v: p.id, n: p.n.split(' ')[0] }))} valor=${f.resp} onCambio=${v => pon({ resp: v })} chico desliza=${tel} /></div>`}
      ${!o0 && html`<label class="campo"><span>Anticipo (opcional)</span><input class="num" type="text" inputmode="decimal" value=${ant} placeholder="0" aria-label="Anticipo" onInput=${e => setAnt(e.target.value)} /></label>
        ${antV > 0 && html`<div class="entra">${fp.vista({ titulo: '¿Cómo pagó el anticipo?', desliza: tel })}</div>`}`}`,
    pie: html`<button type="button" class="btn toca" onClick=${() => guardar(c)}>${o0 ? 'Guardar cambios' : 'Guardar orden' + (total > 0 ? ' · ' + D.m(total) : '')}</button>`
  })} />`;
}

// ---------- abono a una orden ----------
export function AbonoOrden({ d, cerrar }) {
  const { S, D, tel, abrir } = useApp();
  const { saldo } = useOrden();
  const o = S.ordenes.find(x => x.id === d.oid);
  const deb = o ? saldo(o) : 0;
  const [txt, setTxt] = useState(deb > 0 ? String(D.redondo(deb)).replace('.', ',') : '');
  const v = Math.min(D.redondo(numero(txt)), deb);
  const fp = usePagos(v, S.negocio.pays);
  if (!o) return null;
  const listo = c => {
    if (!(v > 0)) { avisar('Escribe cuánto abona'); return; }
    if (!fp.ok) { avisar('Falta repartir ' + D.m(fp.falta)); return; }
    anticipoOrden(o.id, fp.pagos());
    c(() => { avisar('Abono de ' + D.m(v) + ' a ' + numeroOrden(o)); abrir('orden', { oid: o.id }); });
  };
  return html`<${Hoja} titulo=${'Abono a ' + numeroOrden(o)} onCerrar=${cerrar} contenido=${c => ({
    cuerpo: html`<div class="fila"><b class="crece" style="font-size:16px">${o.que}</b><span class="amber num" style="font-weight:600">Debe ${D.m(deb)}</span></div>
      <label class="campo"><span>¿Cuánto abona?</span><input class="grande num" type="text" inputmode="decimal" value=${txt} onInput=${e => setTxt(e.target.value)} /></label>
      ${fp.vista({ titulo: '¿Cómo pagó?', desliza: tel })}`,
    pie: html`<button type="button" class=${'btn toca' + (v > 0 && fp.ok ? '' : ' apagado')} onClick=${() => listo(c)}>Anotar abono de ${D.m(v)}</button>`
  })} />`;
}

// ---------- cancelar ----------
export function CancelarOrden({ d, cerrar }) {
  const { S, D, abrir } = useApp();
  const o = S.ordenes.find(x => x.id === d.oid);
  const [motivo, setMotivo] = useState('');
  const [como, setComo] = useState('devolver');
  if (!o) return null;
  const ant = anticipoDe(o.id), cli = S.clientes.find(c => c.id === o.cli) || { n: 'el cliente' };
  const listo = c => { cancelarOrden(o.id, motivo.trim(), como); c(() => avisar(numeroOrden(o) + ' cancelada' + (ant > 0 ? como === 'devolver' ? ' · anticipo devuelto' : ' · anticipo como saldo a favor' : ''))); };
  return html`<${Hoja} titulo=${'¿Cancelar ' + numeroOrden(o) + '?'} onCerrar=${cerrar} contenido=${c => ({
    cuerpo: html`<span class="sub" style="line-height:1.45">${o.que}. La orden queda guardada como cancelada, con su historial.</span>
      <div class="campo"><span>Motivo</span><${Chips} opciones=${['El cliente desistió', 'No tiene reparación', 'Sin repuesto', 'Otro'].map(x => ({ v: x, n: x }))} valor=${motivo} onCambio=${setMotivo} chico /></div>
      ${ant > 0 && html`<div class="campo"><span>El anticipo de ${D.m(ant)}</span>
        <${Chips} opciones=${[{ v: 'devolver', n: 'Se le devuelve' }, { v: 'saldo', n: 'Queda a favor de ' + cli.n.split(' ')[0] }]} valor=${como} onCambio=${setComo} />
        <span class="sub faint">${como === 'devolver' ? 'Sale hoy de la caja, por las mismas formas en que lo pagó.' : 'Lo puede usar en su próxima compra como «Saldo a favor».'}</span></div>`}`,
    pie: html`<button type="button" class="btn toca" style="background:var(--out)" onClick=${() => listo(c)}>Sí, cancelar la orden</button><button type="button" class="btn2 toca" style="min-height:50px;border-radius:25px" onClick=${() => c(() => abrir('orden', { oid: o.id }))}>No, volver</button>`
  })} />`;
}

// Panel de la computadora: las órdenes abiertas, primero las atrasadas y luego por fecha de entrega.
export function OrdenesHoy() {
  const { S, ir, abrir } = useApp();
  const ahora = Date.now();
  const abiertas = S.ordenes.filter(ordenAbierta).sort((a, b) => (ordenAtrasada(b, ahora) - ordenAtrasada(a, ahora)) || ((a.entrega || 9e15) - (b.entrega || 9e15)));
  const pill = o => ordenAtrasada(o, ahora) ? [atrasoTxt(o, ahora), 't-ros'] : o.estado === 'lista' ? ['Lista', 't-ver'] : [o.entrega ? cuando(o.entrega) : estadoDe(o.estado).n, estadoDe(o.estado).tono];
  return html`<section class="tarjeta" data-tour="ordenes-hoy" style="padding-bottom:6px">
    <div class="tarjeta-tit">Órdenes abiertas<button type="button" class="enlace-tasa toca" onClick=${() => ir('ordenes')}>Ver tablero →</button></div>
    ${abiertas.length ? html`<div class="lista">${abiertas.slice(0, 5).map(o => { const pl = pill(o), cli = (S.clientes.find(c => c.id === o.cli) || {}).n; return html`<button type="button" key=${o.id} class="item toca" style="color:var(--ink)" onClick=${() => abrir('orden', { oid: o.id })}>
      <span class="crece" style="display:flex;flex-direction:column;gap:1px;min-width:0"><b class="corta" style="font-size:14px;font-weight:600"><span class="orden-num">${numeroOrden(o)}</span> · ${o.que}</b><span class="sub faint corta">${cli || 'Sin cliente'}</span></span>
      <span class=${'pildora ' + pl[1]}>${pl[0]}</span></button>`; })}</div>`
      : html`<p class="vacio" style="padding:10px 0">No hay órdenes abiertas.</p>`}
  </section>`;
}
