// Todas las hojas (teléfono) o ventanas (computadora) de la app.
import { html, useState, useEffect, useRef } from '../lib/preact-htm.js';
import { useApp } from '../ctx.js';
import { leer, vender, abonar, anotarGasto, editarGasto, borrarGasto, guardarProducto, borrarProducto, reponer, nuevoCliente, editarCliente, borrarCliente, cerrarDia, empezarDeNuevo, deudores, deudaDe, resumen, inicioDia, gastosEntre, guardarSucursales, guardarPerfil, nuevoRol, perfilActual, anularVenta, devolver, cambiarNegocio, guardarTasa, listarCopias, leerCopia, restaurar, valido, listaProductos, listaClientes, vigentes } from '../datos.js';
import { rolDe, puedeEditarRol, PERMISOS } from '../permisos.js';
import { PAISES, TIPOS, pais, tipo, leerTasa, nombreTasa, FUENTES_AR } from '../paises.js';
import { Hoja, Icono, Interruptor, Chips, avisar, iniciales, TONOS, hora, fechaCorta, hace, simbolo } from '../ui.js';
const conSimbolo = lista => lista.map(x => ({ v: x, n: html`<span class="simb"><${Icono} n=${simbolo(x)} t=${13} g=${2.2} /></span>${x}` }));
import { Monto } from '../graficos.js';

const CATS = ['Mercancía', 'Alquiler', 'Servicios', 'Sueldos', 'Transporte', 'Otro'];
const VENCE = [{ v: 7, n: 'En 7 días' }, { v: 15, n: 'En 15 días' }, { v: 30, n: 'En 30 días' }];
const esEfectivo = m => /Efectivo/.test(m);
const numero = t => { const v = parseFloat(String(t).replace(/\s/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.')); return isFinite(v) ? v : 0; };
const telWA = t => { const d = String(t || '').replace(/\D/g, ''); return d.length >= 10 ? d : ''; };
const abrirWA = (tel, texto) => window.open('https://wa.me/' + telWA(tel) + '?text=' + encodeURIComponent(texto), '_blank', 'noopener');
const Pie2 = (txt, fn, clase) => html`<button type="button" class=${'btn2 toca ' + (clase || '')} style="min-height:50px;border-radius:25px" onClick=${fn}>${txt}</button>`;

// Una venta en una lista (últimas ventas, historial). Las anuladas se ven tachadas; las devoluciones, en negativo.
export function FilaVenta({ v, i, fecha }) {
  const { D, E, abrir } = useApp();
  const titulo = v.dev ? 'Devolución de #' + v.dev + ' · ' + v.items.map(it => -it.q + ' × ' + it.n).join(', ') : '#' + v.n + ' · ' + v.items.map(it => it.q + ' × ' + it.n).join(', ');
  return html`<button type="button" class="item toca entra" style=${{ '--i': i, color: 'var(--ink)', opacity: v.anulada ? 0.6 : 1 }} onClick=${() => abrir('recibo', { venta: v })}>
    <span class="crece" style="display:flex;flex-direction:column;gap:1px"><b class="corta" style="font-size:14px;font-weight:600">${titulo}</b><span class="sub faint">${fecha ? fechaCorta(v.t) + ' ' : ''}${hora(v.t)} · ${v.anulada ? 'Anulada' : v.pagos.map(p => p.m).join(' + ')}${E ? ' · ' + v.suc : ''}</span></span>
    ${v.anulada ? html`<span class="pildora t-ros">Anulada</span>` : null}
    <b class=${'num' + (v.anulada ? ' faint' : v.dev ? ' out' : v.fiado ? ' amber' : '')} style=${{ fontSize: '14px', textDecoration: v.anulada ? 'line-through' : 'none' }}>${D.m(v.total)}</b>
  </button>`;
}

// Pregunta antes de hacer algo que no se deshace solo.
function Confirmar({ d, cerrar }) {
  return html`<${Hoja} titulo=${d.titulo} onCerrar=${cerrar} contenido=${c => ({
    cuerpo: html`<p style="margin:0;line-height:1.5">${d.texto}</p>`,
    pie: html`<button type="button" class="btn toca" style="background:var(--out)" onClick=${() => c(d.si)}>${d.boton}</button>${Pie2('Cancelar', () => c())}`
  })} />`;
}

export function HojaActual({ hoja, cerrar }) {
  const H = { cobrar: Cobrar, recibo: Recibo, anular: Anular, devolver: Devolver, gasto: Gasto, abono: Abono, recordar: Recordar, cierre: Cierre, producto: Producto, reponer: Reponer, nuevoCliente: NuevoCliente, cliente: Cliente, buscar: Buscar, borrar: Borrar, confirmar: Confirmar, locales: Locales, perfil: Perfil, rol: Rol, negocio: Negocio, tasa: Tasa, copias: Copias, registro: Registro }[hoja.t];
  return H ? html`<${H} d=${hoja.datos} cerrar=${cerrar} />` : null;
}

// ---------- cobrar ----------
function Cobrar({ d, cerrar }) {
  const { S, P, D, T, abrir, suc, tel, puede } = useApp();
  const fiadoN = T.id === 'tienda' || T.id === 'comida' ? 'Fiado' : 'Por cobrar';
  const metodos = S.negocio.pays.concat(puede('fiado') ? [fiadoN] : []);
  const [m, setM] = useState(metodos[0]);
  const [mixto, setMixto] = useState(false);
  const [parte, setParte] = useState(0.5);
  const [m2, setM2] = useState(metodos[1] || metodos[0]);
  const [recibe, setRecibe] = useState(0);
  const [cli, setCli] = useState('');
  const total = D.redondo(d.tt.total);
  const fiado = m === fiadoN, efectivo = esEfectivo(m) && !mixto && !fiado;
  const dado = recibe >= total ? recibe : total;
  const p1 = D.redondo(total * parte), p2 = D.redondo(total - p1);
  const clientes = deudores();
  const listo = c => {
    if (fiado && !cli) { avisar('Elige a quién se lo anotas'); return; }
    const pagos = fiado ? [{ m: 'Fiado', v: total }] : mixto ? [{ m, v: p1 }, { m: m2, v: p2 }] : [{ m, v: total }];
    const items = d.items.map(it => Object.assign({}, it));
    const venta = vender({ items, pagos, cli, suc: suc || S.negocio.sucursales[0], fiado, total });
    venta.recibido = efectivo ? dado : 0; venta.imp = d.tt.imp; venta.impTxt = d.tt.txt;
    d.onListo && d.onListo();
    c(() => abrir('recibo', { venta, nueva: true }));
  };
  return html`<${Hoja} titulo=${T.vender === 'Pedido' ? 'Cobrar pedido' : 'Cobrar'} onCerrar=${cerrar} contenido=${c => ({
    cuerpo: html`
      <div style="display:flex;flex-direction:column;align-items:center;gap:2px;padding:4px 0 6px"><b class="num" style="font-size:40px;letter-spacing:-0.02em">${D.m(total)}</b>${D.dual && html`<span class="sub num">${D.s(total)}</span>`}${d.tt.txt && html`<span class="sub faint num">${d.tt.txt}: ${D.m(d.tt.imp)}</span>`}</div>
      <div class="campo"><span>Forma de pago</span><${Chips} opciones=${conSimbolo(metodos)} valor=${m} onCambio=${v => { setM(v); setRecibe(0); if (v === m2) setM2(metodos.find(x => x !== v && x !== fiadoN)); }} desliza=${tel} calido=${v => v === fiadoN} /></div>
      ${efectivo && html`<div class="campo entra"><span>¿Con cuánto te paga?</span>
        <div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px">${D.billetes(total).map((v, i) => html`<button type="button" class=${'chip toca' + (v === dado ? ' on' : '')} style="justify-content:center;padding:0 4px;color:var(--ink)" onClick=${() => setRecibe(v)}>${i === 0 ? 'Exacto' : D.m(v)}</button>`)}</div>
        <div class="fila" style="border-radius:16px;background:var(--in-soft);padding:12px 14px"><span class="crece in" style="font-size:14px;font-weight:600">Vuelto</span><${Monto} v=${dado - total} f=${D.m} clase="in" /></div>
      </div>`}
      ${!fiado && S.negocio.pays.length > 1 && html`<${Interruptor} on=${mixto} onCambio=${setMixto} titulo="Pago mixto" sub="Una parte con una forma y el resto con otra" />`}
      ${mixto && !fiado && html`<div class="tarjeta pila entra" style="background:var(--fill2);box-shadow:none">
        <span class="sub">Paga con ${m}</span>
        <div class="rejilla-3">${[0.25, 0.5, 0.75].map(f => html`<button type="button" class=${'chip toca' + (parte === f ? ' on' : '')} style="justify-content:center;color:var(--ink)" onClick=${() => setParte(f)}>${D.m(D.redondo(total * f))}</button>`)}</div>
        <span class="sub">Y el resto, <b class="num" style="color:var(--ink)">${D.m(p2)}</b>, con</span>
        <${Chips} opciones=${S.negocio.pays.filter(x => x !== m)} valor=${m2} onCambio=${setM2} chico />
      </div>`}
      ${fiado && html`<div class="campo entra"><span>¿A quién se lo anotas?</span>
        <div class="chips">${clientes.map((x, i) => html`<button type="button" class=${'chip toca' + (cli === x.id ? ' on calido' : '')} style="padding-left:6px;color:var(--ink)" onClick=${() => setCli(x.id)}><span class=${'logo redondo ' + TONOS[i % 5]} style="width:28px;height:28px;font-size:11px">${iniciales(x.n)}</span>${x.n.split(' ')[0]}</button>`)}
        <button type="button" class="chip toca" style="border:1.5px dashed var(--line);background:transparent" onClick=${() => c(() => abrir('nuevoCliente', { volver: d }))}>+ Nuevo</button></div>
      </div>`}`,
    pie: html`<button type="button" class=${'btn toca' + (fiado ? ' ambar' : '')} onClick=${() => listo(c)}>${fiado ? 'Anotar ' + D.m(total) + (cli ? ' a ' + clientes.find(x => x.id === cli).n.split(' ')[0] : '') : 'Cobrar ' + D.m(total)}</button>`
  })} />`;
}

// ---------- recibo ----------
export function textoRecibo(v, S, D, P) {
  const cli = S.clientes.find(c => c.id === v.cli);
  return [S.negocio.nombre + (S.negocio.razon ? ' · ' + S.negocio.razon : ''), S.negocio.fiscal ? P.fiscal[0] + ' ' + S.negocio.fiscal : '', 'Recibo #' + v.n + ' · ' + new Date(v.t).toLocaleString('es'), (S.perfiles || []).find(p => p.id === v.por) ? 'Te atendió ' + S.perfiles.find(p => p.id === v.por).n.split(' ')[0] : '', '',
    ...v.items.map(it => it.q + ' x ' + it.n + ': ' + D.m(it.q * it.p)), '', 'Total: ' + D.m(v.total) + (D.dual ? ' (' + D.s(v.total) + ')' : ''),
    ...v.pagos.map(p => p.m + ': ' + D.m(p.v)), cli ? 'Cliente: ' + cli.n : '', '', '¡Gracias por tu compra!'].filter((x, i, a) => x !== '' || a[i - 1] !== '').join('\n');
}
function Recibo({ d, cerrar }) {
  const { S, P, D, tel, abrir, puede } = useApp();
  const v = S.ventas.find(x => x.id === d.venta.id) || d.venta, cli = S.clientes.find(c => c.id === v.cli), atendio = S.perfiles.find(p => p.id === v.por);
  const quien = id => { const p = S.perfiles.find(x => x.id === id); return p ? p.n.split(' ')[0] : ''; };
  const quedan = v.items.some(it => it.q - ((v.devuelto || {})[it.pid] || 0) > 0);
  const corregir = puede('anular') && !v.anulada && !v.dev;
  const enviar = () => { abrirWA(cli && cli.tel, textoRecibo(v, S, D, P)); };
  return html`<${Hoja} titulo=${d.nueva ? (v.fiado ? 'Anotado' : 'Venta guardada') : v.dev ? 'Devolución #' + v.n : 'Venta #' + v.n} onCerrar=${cerrar} contenido=${c => ({
    cuerpo: html`
      ${d.nueva && html`<div style="display:flex;flex-direction:column;align-items:center;gap:8px;text-align:center"><span style="width:64px;height:64px;border-radius:50%;background:var(--in);display:grid;place-items:center;animation:pop .55s var(--spring) both"><${Icono} n="check" t=${30} g=${2.8} c="#0b0a14" /></span>
        <span class="sub">${navigator.onLine ? (v.fiado ? 'Sumado a lo que te debe ' + (cli ? cli.n.split(' ')[0] : '') + '.' : 'Sumada a la caja de hoy.') : 'Guardada en este aparato. Se sube cuando vuelva el internet.'}</span></div>`}
      ${v.anulada && html`<div class="tarjeta fila entra" style="background:var(--out-soft, color-mix(in srgb, var(--out) 14%, transparent));box-shadow:none;gap:10px"><${Icono} n="deshacer" t=${18} c="var(--out)" /><span class="sub" style="color:var(--ink);line-height:1.4"><b>Venta anulada</b> ${hace(v.anulada.t)}${quien(v.anulada.por) ? ' por ' + quien(v.anulada.por) : ''}. Motivo: ${v.anulada.motivo}. No cuenta en la caja ni en los reportes.</span></div>`}
      ${v.devuelto && !v.anulada && html`<div class="tarjeta fila entra" style="background:var(--fill2);box-shadow:none;gap:10px"><${Icono} n="deshacer" t=${18} c="var(--muted)" /><span class="sub" style="color:var(--ink)">Devolvieron: ${v.items.filter(it => v.devuelto[it.pid]).map(it => v.devuelto[it.pid] + ' × ' + it.n).join(', ')}</span></div>`}
      ${v.dev && html`<div class="tarjeta fila entra" style="background:var(--fill2);box-shadow:none;gap:10px"><${Icono} n="deshacer" t=${18} c="var(--muted)" /><span class="sub" style="color:var(--ink)">Devolución de la venta #${v.dev}${v.motivo ? ' · ' + v.motivo : ''}</span></div>`}
      <div style=${'border-radius:16px;background:#f7f6fc;color:#1a1733;padding:16px;display:flex;flex-direction:column;gap:7px;font-size:13px;font-family:ui-monospace,Menlo,Consolas,monospace;position:relative;overflow:hidden' + (v.anulada ? ';opacity:.75' : '')}>
        ${v.anulada && html`<span class="sello">ANULADA</span>`}
        <b style="text-align:center;font-size:14px">${S.negocio.nombre}</b>
        ${S.negocio.razon && html`<span style="text-align:center;color:#625f7d">${S.negocio.razon}${S.negocio.fiscal ? ' · ' + P.fiscal[0] + ' ' + S.negocio.fiscal : ''}</span>`}
        <span style="text-align:center;color:#625f7d">${v.dev ? 'Devolución' : 'Recibo'} #${v.n} · ${fechaCorta(v.t)} ${hora(v.t)}${cli ? ' · ' + cli.n : ''}</span>
        ${atendio && html`<span style="text-align:center;color:#625f7d">Te atendió ${atendio.n.split(' ')[0]}${S.negocio.sucursales.length > 1 ? ' · ' + v.suc : ''}</span>`}
        <span style="border-top:1px dashed #c9c6e0"></span>
        ${v.items.map(it => html`<span class="fila" style="justify-content:space-between;gap:8px"><span>${Math.abs(it.q)} x ${it.n}</span><span>${D.m(it.q * it.p)}</span></span>`)}
        <span style="border-top:1px dashed #c9c6e0"></span>
        ${v.imp > 0 && html`<span class="fila" style="justify-content:space-between;color:#625f7d"><span>${v.impTxt}</span><span>${D.m(v.imp)}</span></span>`}
        <span class="fila" style="justify-content:space-between;font-weight:700;font-size:15px"><span>TOTAL</span><span>${D.m(v.total)}</span></span>
        ${D.dual && html`<span style="text-align:right;color:#625f7d">${D.s(v.total)}</span>`}
        ${v.pagos.map(p => html`<span class="fila" style="justify-content:space-between;color:#625f7d"><span>${p.m}</span><span>${D.m(p.v)}</span></span>`)}
        ${v.recibido > v.total && html`<span class="fila" style="justify-content:space-between;color:#625f7d"><span>Recibido ${D.m(v.recibido)} · vuelto</span><span>${D.m(v.recibido - v.total)}</span></span>`}
      </div>`,
    pie: html`${!v.anulada && html`<button type="button" class="btn wa toca" onClick=${enviar}>Enviar por WhatsApp</button>`}
      ${!tel && !v.anulada && html`<button type="button" class="btn2 toca" style="min-height:54px;border-radius:27px" onClick=${() => window.print()}>Imprimir</button>`}
      ${corregir && html`<div class="rejilla-2">${quedan ? Pie2(html`<${Icono} n="deshacer" t=${16} />Devolver`, () => c(() => abrir('devolver', { vid: v.id }))) : null}${Pie2('Anular venta', () => c(() => abrir('anular', { vid: v.id })), 'rojo')}</div>`}
      ${Pie2('Listo', () => c())}`
  })} />`;
}

// ---------- anular o devolver ----------
const MOTIVOS_ANULAR = ['Me equivoqué al cobrar', 'El cliente se arrepintió', 'Venta de prueba', 'Otro motivo'];
const MOTIVOS_DEV = ['Producto dañado', 'No le sirvió', 'Se equivocó de producto', 'Otro motivo'];
function Anular({ d, cerrar }) {
  const { S, D } = useApp();
  const v = S.ventas.find(x => x.id === d.vid);
  const [motivo, setMotivo] = useState(MOTIVOS_ANULAR[0]);
  if (!v) return null;
  return html`<${Hoja} titulo=${'¿Anular la venta #' + v.n + '?'} onCerrar=${cerrar} contenido=${c => ({
    cuerpo: html`<p style="margin:0;line-height:1.5">Deja de contar en la caja y en los reportes${v.fiado ? ', se quita de lo que debe el cliente' : ''} y lo vendido vuelve al inventario. Queda en el historial marcada como anulada.</p>
      <div class="tarjeta fila" style="background:var(--fill2);box-shadow:none"><span class="crece sub corta">${v.items.map(it => it.q + ' × ' + it.n).join(', ')}</span><b class="num">${D.m(v.total)}</b></div>
      <div class="campo"><span>¿Por qué?</span><${Chips} opciones=${MOTIVOS_ANULAR} valor=${motivo} onCambio=${setMotivo} /></div>`,
    pie: html`<button type="button" class="btn toca" style="background:var(--out)" onClick=${() => { anularVenta(v.id, motivo); c(() => avisar('Venta #' + v.n + ' anulada')); }}>Anular venta</button>${Pie2('Cancelar', () => c())}`
  })} />`;
}
function Devolver({ d, cerrar }) {
  const { S, D, tel } = useApp();
  const v = S.ventas.find(x => x.id === d.vid);
  const [q, setQ] = useState({});
  const [m, setM] = useState(v && v.pagos[0].m !== 'Fiado' ? v.pagos[0].m : S.negocio.pays[0]);
  const [motivo, setMotivo] = useState(MOTIVOS_DEV[0]);
  if (!v) return null;
  const max = it => it.q - ((v.devuelto || {})[it.pid] || 0);
  // Si el impuesto se cobró aparte, se devuelve en la misma proporción.
  const bruto = v.items.reduce((a, it) => a + it.q * it.p, 0), factor = bruto ? v.total / bruto : 1;
  const monto = D.redondo(v.items.reduce((a, it) => a + (q[it.pid] || 0) * it.p, 0) * factor);
  const pon = (it, dd) => setQ(Object.assign({}, q, { [it.pid]: Math.max(0, Math.min(max(it), (q[it.pid] || 0) + dd)) }));
  const listo = c => {
    if (!monto) { avisar('Elige qué devuelven'); return; }
    devolver(v.id, q, m, motivo, monto);
    c(() => avisar(v.fiado ? 'Devuelto: se restó ' + D.m(monto) + ' de lo que debe' : 'Devuelto · entrega ' + D.m(monto) + ' en ' + m));
  };
  return html`<${Hoja} titulo=${'Devolver de la venta #' + v.n} onCerrar=${cerrar} contenido=${c => ({
    cuerpo: html`<span class="sub" style="margin-top:-6px">Elige qué y cuántos devuelven. Vuelve al inventario.</span>
      <div class="tarjeta" style="background:var(--fill2);box-shadow:none;padding:4px 14px"><div class="lista">${v.items.map(it => { const mx = max(it), x = q[it.pid] || 0; return html`<div class="item" key=${it.pid} style=${{ opacity: mx ? 1 : 0.5 }}>
        <span class="crece" style="display:flex;flex-direction:column;gap:1px"><b style="font-size:14px;font-weight:600">${it.n}</b><span class="sub faint num">${mx ? 'Compró ' + it.q + (mx < it.q ? ' · quedan ' + mx : '') + ' · ' + D.m(it.p) + ' c/u' : 'Ya se devolvió todo'}</span></span>
        ${mx ? html`<span class="fila" style="gap:6px"><button type="button" class="icono-btn chico toca" aria-label=${'Uno menos de ' + it.n} onClick=${() => pon(it, -1)}><${Icono} n="menos1" t=${14} g=${2.6} /></button><b class="num" style="min-width:26px;text-align:center">${x}</b><button type="button" class="icono-btn chico toca" aria-label=${'Uno más de ' + it.n} onClick=${() => pon(it, 1)}><${Icono} n="mas1" t=${14} g=${2.6} /></button></span>` : null}
      </div>`; })}</div></div>
      ${v.fiado ? html`<span class="sub">Fue fiado: lo devuelto se resta de lo que debe.</span>` : html`<div class="campo"><span>¿Cómo le devuelves el dinero?</span><${Chips} opciones=${conSimbolo(S.negocio.pays)} valor=${m} onCambio=${setM} desliza=${tel} /></div>`}
      <div class="campo"><span>¿Por qué?</span><${Chips} opciones=${MOTIVOS_DEV} valor=${motivo} onCambio=${setMotivo} chico /></div>`,
    pie: html`<button type="button" class=${'btn toca' + (monto ? '' : ' apagado')} onClick=${() => listo(c)}>${monto ? 'Devolver ' + D.m(monto) : 'Elige qué devuelven'}</button>`
  })} />`;
}

// ---------- gasto (nuevo o editar) ----------
function Gasto({ d, cerrar }) {
  const { S, D, P, tel, abrir } = useApp();
  const g0 = d.gid ? S.gastos.find(g => g.id === d.gid) : null;
  const [monto, setMonto] = useState(g0 ? String(g0.v).replace('.', ',') : '');
  const [n, setN] = useState(g0 && g0.n !== g0.cat ? g0.n : '');
  const [cat, setCat] = useState(g0 ? g0.cat : 'Mercancía');
  const [despues, setDespues] = useState(g0 ? !g0.pagado : false);
  const [vence, setVence] = useState(g0 ? 0 : 7);
  const [m, setM] = useState(g0 && g0.m ? g0.m : S.negocio.pays[0]);
  const guardar = c => {
    const v = numero(monto); if (!v) { avisar('Escribe el monto'); return; }
    const g = { n: n.trim() || cat, cat, v, m, pagado: !despues, vence: despues ? (vence ? Date.now() + vence * 86400000 : (g0 && g0.vence) || Date.now() + 7 * 86400000) : 0 };
    if (g0) { if (g0.pagado !== g.pagado) g.t = Date.now(); editarGasto(g0.id, g); c(() => avisar('Gasto cambiado')); return; }
    anotarGasto(g);
    c(() => avisar(despues ? 'Anotado en «Por pagar»' : 'Gasto guardado · ' + D.m(v)));
  };
  const borrar = c => c(() => abrir('confirmar', { titulo: '¿Borrar este gasto?', texto: g0.n + ' · ' + D.m(g0.v) + '. Queda anotado en el registro de cambios.', boton: 'Sí, borrar', si: () => { borrarGasto(g0.id); avisar('Gasto borrado'); } }));
  return html`<${Hoja} titulo=${g0 ? 'Editar gasto' : 'Anotar gasto'} onCerrar=${cerrar} contenido=${c => ({
    cuerpo: html`
      <label class="campo"><span>Monto (${P.id === 'VE' ? 'dólares' : P.cur})</span><input class="grande num" type="text" inputmode="decimal" placeholder="0" value=${monto} onInput=${e => setMonto(e.target.value)} /></label>
      <div class="campo"><span>¿En qué?</span><${Chips} opciones=${conSimbolo(CATS)} valor=${cat} onCambio=${setCat} /></div>
      <label class="campo"><span>Nota (opcional)</span><input type="text" placeholder=${cat} value=${n} onInput=${e => setN(e.target.value)} /></label>
      <${Interruptor} on=${despues} onCambio=${setDespues} titulo="Lo pago después" sub="Va a «Por pagar» y Orbe te avisa antes de que venza" />
      ${despues ? html`<div class="entra">${g0 && g0.vence && !vence ? html`<span class="sub" style="display:block;margin-bottom:8px">Vence el ${fechaCorta(g0.vence)}. Para cambiarlo, elige:</span>` : null}<${Chips} opciones=${VENCE} valor=${vence} onCambio=${setVence} calido=${() => true} /></div>`
        : html`<div class="campo"><span>¿Cómo lo pagaste?</span><${Chips} opciones=${conSimbolo(S.negocio.pays)} valor=${m} onCambio=${setM} desliza=${tel} /></div>`}`,
    pie: html`<button type="button" class="btn toca" onClick=${() => guardar(c)}>${g0 ? 'Guardar cambios' : 'Guardar gasto'}</button>${g0 ? Pie2('Borrar gasto', () => borrar(c), 'rojo') : null}`
  })} />`;
}

// ---------- abono ----------
function Abono({ d, cerrar }) {
  const { S, D, tel } = useApp();
  const c0 = deudores().find(x => x.id === d.cid) || { n: '', deuda: 0 };
  const [parte, setParte] = useState(1);
  const [m, setM] = useState(S.negocio.pays[0]);
  const valor = D.redondo(c0.deuda * parte);
  return html`<${Hoja} titulo="Anotar abono" onCerrar=${cerrar} contenido=${c => ({
    cuerpo: html`
      <div class="fila"><b class="crece" style="font-size:16px">${c0.n}</b><span class="amber num" style="font-weight:600">Debe ${D.m(c0.deuda)}</span></div>
      <div class="campo"><span>¿Cuánto paga?</span><div class="rejilla-3">${[[1, 'Todo'], [0.5, 'La mitad'], [0.25, 'Una parte']].map(x => html`<button type="button" class=${'chip toca' + (parte === x[0] ? ' on' : '')} style="flex-direction:column;justify-content:center;gap:0;min-height:56px;color:var(--ink)" onClick=${() => setParte(x[0])}><span class="sub" style="font-weight:500">${x[1]}</span><b class="num">${D.m(D.redondo(c0.deuda * x[0]))}</b></button>`)}</div></div>
      <div class="campo"><span>¿Cómo pagó?</span><${Chips} opciones=${conSimbolo(S.negocio.pays)} valor=${m} onCambio=${setM} desliza=${tel} /></div>`,
    pie: html`<button type="button" class="btn toca" onClick=${() => { abonar(d.cid, valor, m); c(() => avisar(parte === 1 ? c0.n.split(' ')[0] + ' ya no debe nada' : c0.n.split(' ')[0] + ' abonó ' + D.m(valor))); }}>Anotar abono de ${D.m(valor)}</button>`
  })} />`;
}

// ---------- recordar ----------
function Recordar({ d, cerrar }) {
  const { S, D } = useApp();
  const c0 = deudores().find(x => x.id === d.cid) || { n: '', deuda: 0 };
  const texto = 'Hola ' + c0.n.split(' ')[0] + ', te escribe ' + S.negocio.nombre + '. Te recuerdo que tienes pendiente ' + D.m(c0.deuda) + (D.dual ? ' (' + D.s(c0.deuda) + ')' : '') + '.\nPuedes pagar por ' + S.negocio.pays.slice(0, 2).join(' o ') + '. ¡Gracias!';
  return html`<${Hoja} titulo="Recordar pago" onCerrar=${cerrar} contenido=${c => ({
    cuerpo: html`
      <div style="border-radius:20px;background:#0e1f1a;padding:16px;display:flex;flex-direction:column;gap:8px">
        <span style="font-size:12px;color:#7ff0c3;font-weight:600">Mensaje listo para ${c0.n}${c0.tel ? ' · ' + c0.tel : ''}</span>
        <span class="entra" style="align-self:flex-end;max-width:90%;border-radius:16px 16px 4px 16px;background:#005c4b;color:#e9fef6;padding:10px 12px;font-size:14px;line-height:1.45;white-space:pre-line">${texto}</span>
      </div>
      <span class="sub" style="line-height:1.45">Se abre WhatsApp con el mensaje escrito. Más adelante se podrá enviar solo.</span>`,
    pie: html`<button type="button" class="btn wa toca" onClick=${() => { abrirWA(c0.tel, texto); c(() => avisar('Mensaje listo en WhatsApp')); }}>Abrir WhatsApp</button>`
  })} />`;
}

// ---------- cierre del día ----------
function Cierre({ d, cerrar }) {
  const { S, D, puede } = useApp();
  const hoy0 = inicioDia(Date.now());
  const r = resumen(hoy0, Date.now() + 1, '');
  const gastosHoy = gastosEntre(hoy0, Date.now() + 1).reduce((a, g) => a + g.v, 0);
  const metodos = Object.keys(r.porPago).filter(k => k !== 'Fiado');
  const [contado, setContado] = useState(() => { const o = {}; metodos.forEach(k => { o[k] = D.redondo(r.porPago[k]); }); return o; });
  const dif = metodos.filter(esEfectivo).reduce((a, k) => a + (contado[k] - D.redondo(r.porPago[k])), 0);
  return html`<${Hoja} titulo="Cierre del día" onCerrar=${cerrar} contenido=${c => ({
    cuerpo: html`
      <span class="sub" style="margin-top:-6px">Cuenta lo que hay en la caja. Lo digital ya está sumado.</span>
      <div class="tarjeta" style="background:var(--fill2);box-shadow:none;padding:4px 14px"><div class="lista">
        ${metodos.length ? metodos.map(k => { const esp = D.redondo(r.porPago[k]), ef = esEfectivo(k), df = D.redondo(contado[k] - esp); return html`<div class="item" key=${k}>
          <span class="crece" style="display:flex;flex-direction:column;gap:2px"><b style="font-size:14px;font-weight:600">${k}</b><span class="sub num" style=${{ color: ef ? (df === 0 ? 'var(--in)' : 'var(--amber)') : '' }}>${ef ? (df === 0 ? 'Esperado ' + D.m(esp) + ' · cuadra' : (df < 0 ? 'Faltan ' : 'Sobran ') + D.m(Math.abs(df))) : 'Ya confirmado'}</span></span>
          ${ef ? html`<span class="fila" style="gap:6px"><button type="button" class="icono-btn chico toca" aria-label="Contar menos" onClick=${() => setContado(Object.assign({}, contado, { [k]: Math.max(0, D.redondo(contado[k] - D.paso)) }))}><${Icono} n="menos1" t=${14} g=${2.6} /></button><b class="num" style="min-width:84px;text-align:center">${D.m(contado[k])}</b><button type="button" class="icono-btn chico toca" aria-label="Contar más" onClick=${() => setContado(Object.assign({}, contado, { [k]: D.redondo(contado[k] + D.paso) }))}><${Icono} n="mas1" t=${14} g=${2.6} /></button></span>` : html`<b class="num">${D.m(esp)}</b>`}
        </div>`; }) : html`<p class="vacio">Todavía no hay ventas hoy.</p>`}
      </div></div>
      <div class="rejilla-2">${[['Total vendido', r.total, 'var(--ink)'], puede('ganancias') ? ['Ganancia', r.ganancia, 'var(--in)'] : ['Ventas', r.n, 'var(--ink)', true], ['Fiado hoy', r.fiado, 'var(--amber)'], ['Gastos hoy', gastosHoy, 'var(--out)']].map(k => html`<div class="tarjeta cifra" style="background:var(--fill2);box-shadow:none;padding:12px"><span class="sub" style="font-size:11px">${k[0]}</span><b class="num" style=${{ color: k[2], fontSize: '17px' }}>${k[3] ? k[1] : D.m(k[1])}</b></div>`)}</div>`,
    pie: html`<button type="button" class="btn toca" onClick=${() => { cerrarDia(contado, { total: r.total, ganancia: r.ganancia, dif }); c(() => avisar(dif === 0 ? 'Día cerrado. Todo cuadra' : 'Día cerrado con ' + (dif < 0 ? 'faltante' : 'sobrante') + ' de ' + D.m(Math.abs(dif)))); }}>Cerrar el día</button>`
  })} />`;
}

// ---------- producto o servicio ----------
function Producto({ d, cerrar }) {
  const { S, D, T, abrir } = useApp();
  const p0 = S.productos.find(p => p.id === d.pid) || null;
  const [f, setF] = useState(p0 ? { n: p0.n, p: String(p0.p), c: String(p0.c), q: p0.q == null ? '' : String(p0.q), min: String(p0.min), dur: p0.dur || 60, cod: p0.cod || '' } : { n: '', p: '', c: '', q: '', min: '', dur: 60, cod: '' });
  const pon = o => setF(x => Object.assign({}, x, o));
  const p = numero(f.p), co = numero(f.c);
  const guardar = c => {
    if (!f.n.trim() || !p) { avisar('Escribe el nombre y el precio'); return; }
    const cod = f.cod.trim();
    if (cod && listaProductos().some(x => x.cod === cod && (!p0 || x.id !== p0.id))) { avisar('Ese código ya lo tiene otro producto'); return; }
    guardarProducto({ id: p0 ? p0.id : undefined, n: f.n.trim(), ab: f.n.trim().slice(0, 2).toUpperCase(), p, c: co, q: T.inv ? Math.round(numero(f.q)) : null, min: T.inv ? Math.round(numero(f.min)) : 0, dur: T.inv ? 0 : f.dur, cod });
    c(() => avisar('Guardado: ' + f.n.trim()));
  };
  const borrar = c => c(() => abrir('confirmar', { titulo: '¿Borrar ' + p0.n + '?', texto: 'Ya no sale para vender ni en el inventario. Las ventas que tuvo se quedan en los reportes.', boton: 'Sí, borrar', si: () => { borrarProducto(p0.id); avisar('Borrado: ' + p0.n); } }));
  return html`<${Hoja} titulo=${(p0 ? 'Editar ' : 'Nuevo ') + (T.inv ? 'producto' : 'servicio')} onCerrar=${cerrar} contenido=${c => ({
    cuerpo: html`
      <label class="campo"><span>Nombre</span><input type="text" value=${f.n} placeholder=${T.inv ? 'Ej.: Arroz 1 kg' : 'Ej.: Corte de cabello'} onInput=${e => pon({ n: e.target.value })} /></label>
      <div class="rejilla-2" style="gap:10px"><label class="campo"><span>Precio</span><input type="text" inputmode="decimal" value=${f.p} placeholder="0" onInput=${e => pon({ p: e.target.value })} /></label><label class="campo"><span>Te cuesta</span><input type="text" inputmode="decimal" value=${f.c} placeholder="0" onInput=${e => pon({ c: e.target.value })} /></label></div>
      ${p > 0 && html`<span class="sub entra">Ganas <b class="in num">${D.m(p - co)}</b> por cada uno (${Math.round((p - co) / p * 100)} %)</span>`}
      ${T.inv ? html`<div class="rejilla-2" style="gap:10px"><label class="campo"><span>Tienes</span><input type="text" inputmode="numeric" value=${f.q} placeholder="0" onInput=${e => pon({ q: e.target.value })} /></label><label class="campo"><span>Avísame con menos de</span><input type="text" inputmode="numeric" value=${f.min} placeholder="0" onInput=${e => pon({ min: e.target.value })} /></label></div>`
        : html`<div class="campo"><span>Dura</span><${Chips} opciones=${[{ v: 30, n: '30 min' }, { v: 45, n: '45 min' }, { v: 60, n: '1 hora' }, { v: 120, n: '2 horas' }]} valor=${f.dur} onCambio=${v => pon({ dur: v })} /></div>`}
      ${T.inv && html`<label class="campo"><span>Código de barras (opcional)</span><input class="num" type="text" inputmode="numeric" autocomplete="off" value=${f.cod} placeholder="Pásalo por el lector o escríbelo" onInput=${e => pon({ cod: e.target.value })} /></label>`}`,
    pie: html`<button type="button" class="btn toca" onClick=${() => guardar(c)}>Guardar</button>${p0 ? Pie2('Borrar ' + (T.inv ? 'producto' : 'servicio'), () => borrar(c), 'rojo') : null}`
  })} />`;
}

function Reponer({ d, cerrar }) {
  const { S } = useApp();
  const p = S.productos.find(x => x.id === d.pid) || { n: '', q: 0, min: 0 };
  const [cuanto, setCuanto] = useState(Math.max(6, p.min * 2 - p.q));
  return html`<${Hoja} titulo=${'Reponer ' + p.n} onCerrar=${cerrar} contenido=${c => ({
    cuerpo: html`<span class="sub">Tienes ${p.q}. El mínimo es ${p.min}.</span>
      <div class="fila" style="justify-content:center;gap:18px;padding:8px 0"><button type="button" class="icono-btn toca" aria-label="Menos" onClick=${() => setCuanto(Math.max(1, cuanto - 1))}><${Icono} n="menos1" /></button><b class="num" style="font-size:40px;min-width:90px;text-align:center">+${cuanto}</b><button type="button" class="icono-btn toca" aria-label="Más" onClick=${() => setCuanto(cuanto + 1)}><${Icono} n="mas1" /></button></div>
      <${Chips} opciones=${[6, 12, 24, 48].map(v => ({ v, n: '+' + v }))} valor=${cuanto} onCambio=${setCuanto} />`,
    pie: html`<button type="button" class="btn toca" onClick=${() => { reponer(p.id, cuanto); c(() => avisar(p.n + ': ahora tienes ' + (p.q + cuanto))); }}>Sumar ${cuanto} al inventario</button>`
  })} />`;
}

// ---------- clientes ----------
function NuevoCliente({ d, cerrar }) {
  const { S, D, abrir } = useApp();
  const c0 = d.cid ? S.clientes.find(x => x.id === d.cid) : null;
  const [f, setF] = useState(c0 ? { n: c0.n, tel: c0.tel || '', tipo: c0.tipo || 'persona' } : { n: '', tel: '', tipo: 'persona' });
  const guardar = c => {
    if (!f.n.trim()) { avisar('Escribe el nombre'); return; }
    if (c0) { editarCliente(c0.id, { n: f.n.trim(), tel: f.tel, tipo: f.tipo }); c(() => { avisar('Cliente guardado'); abrir('cliente', { cid: c0.id }); }); return; }
    nuevoCliente({ n: f.n.trim(), tel: f.tel, tipo: f.tipo }); c(() => { avisar('Cliente guardado'); if (d.volver) abrir('cobrar', d.volver); });
  };
  const borrar = c => {
    const debe = deudaDe(c0.id);
    if (debe > 0.004) { avisar(c0.n.split(' ')[0] + ' todavía debe ' + D.m(debe) + '. Primero anota el pago.'); return; }
    c(() => abrir('confirmar', { titulo: '¿Borrar a ' + c0.n + '?', texto: 'Ya no sale en tu lista de clientes. Sus compras se quedan en los reportes.', boton: 'Sí, borrar', si: () => { borrarCliente(c0.id); avisar('Cliente borrado'); } }));
  };
  return html`<${Hoja} titulo=${c0 ? 'Editar cliente' : 'Nuevo cliente'} onCerrar=${cerrar} contenido=${c => ({
    cuerpo: html`<label class="campo"><span>Nombre</span><input type="text" value=${f.n} onInput=${e => setF(Object.assign({}, f, { n: e.target.value }))} autocomplete="name" /></label>
      <label class="campo"><span>WhatsApp</span><input type="tel" inputmode="tel" value=${f.tel} placeholder="0414-555-1234" onInput=${e => setF(Object.assign({}, f, { tel: e.target.value }))} /></label>
      ${S.negocio.escala === 'empresa' && html`<div class="campo"><span>Es</span><${Chips} opciones=${[{ v: 'persona', n: 'Persona' }, { v: 'empresa', n: 'Empresa' }]} valor=${f.tipo} onCambio=${v => setF(Object.assign({}, f, { tipo: v }))} /></div>`}`,
    pie: html`<button type="button" class="btn toca" onClick=${() => guardar(c)}>Guardar</button>${c0 ? Pie2('Borrar cliente', () => borrar(c), 'rojo') : null}`
  })} />`;
}

function Cliente({ d, cerrar }) {
  const { S, D, abrir, puede } = useApp();
  const c0 = deudores().find(x => x.id === d.cid);
  if (!c0) return null;
  const mov = vigentes().filter(v => v.cli === c0.id).map(v => ({ t: v.t, txt: v.dev ? 'Devolución de #' + v.dev : (v.fiado ? 'Fiado #' : 'Compra #') + v.n, v: v.total, fiado: v.fiado, venta: v }))
    .concat(S.abonos.filter(a => a.cli === c0.id).map(a => ({ t: a.t, txt: 'Abono · ' + a.m, v: -a.v }))).sort((a, b) => b.t - a.t).slice(0, 15);
  return html`<${Hoja} titulo=${c0.n} onCerrar=${cerrar} contenido=${c => ({
    cuerpo: html`
      <div class="rejilla-2"><div class="tarjeta cifra" style="background:var(--amber-soft);box-shadow:none;padding:12px"><span class="sub">Debe</span><b class="num amber" style="font-size:20px">${D.m(c0.deuda)}</b></div><div class="tarjeta cifra" style="background:var(--fill2);box-shadow:none;padding:12px"><span class="sub">Compras</span><b class="num" style="font-size:20px">${c0.compras}</b></div></div>
      <div class="fila"><span class="sub crece">${c0.tel ? 'WhatsApp: ' + c0.tel : 'Sin WhatsApp anotado'}</span>${puede('clientes') && html`<button type="button" class="btn2 chico toca" onClick=${() => c(() => abrir('nuevoCliente', { cid: c0.id }))}><${Icono} n="lapiz" t=${14} />Editar</button>`}</div>
      <div class="lista">${mov.length ? mov.map((m, i) => html`<button type="button" class="item toca entra" style=${{ '--i': i, color: 'var(--ink)', cursor: m.venta ? 'pointer' : 'default' }} onClick=${() => m.venta && c(() => abrir('recibo', { venta: m.venta }))}><span class="crece" style="display:flex;flex-direction:column;gap:1px"><span style="font-size:14px">${m.txt}</span><span class="sub faint">${fechaCorta(m.t)} · ${hora(m.t)}</span></span><b class=${'num ' + (m.v < 0 ? 'in' : m.fiado ? 'amber' : '')}>${D.m(m.v)}</b></button>`) : html`<p class="vacio">Sin movimientos todavía.</p>`}</div>`,
    pie: c0.deuda > 0 ? html`<button type="button" class="btn wa toca" onClick=${() => c(() => abrir('recordar', { cid: c0.id }))}>Recordar por WhatsApp</button>${puede('clientes') && html`<button type="button" class="btn2 toca" style="min-height:50px;border-radius:25px" onClick=${() => c(() => abrir('abono', { cid: c0.id }))}>Anotar abono</button>`}` : null
  })} />`;
}

// ---------- buscar (computadora) ----------
function Buscar({ d, cerrar }) {
  const { S, D, abrir, ir } = useApp();
  const t = d.q.toLowerCase();
  const prods = listaProductos().filter(p => p.n.toLowerCase().includes(t) || (p.cod || '').includes(t));
  const clis = listaClientes().filter(c => c.n.toLowerCase().includes(t));
  return html`<${Hoja} titulo=${'Buscar «' + d.q + '»'} onCerrar=${cerrar} contenido=${c => ({
    cuerpo: html`${!prods.length && !clis.length && html`<p class="vacio">No encontré nada con «${d.q}».</p>`}
      ${prods.length > 0 && html`<span class="sub">Productos</span><div class="lista">${prods.map(p => html`<button type="button" class="item toca" style="color:var(--ink)" onClick=${() => c(() => abrir('producto', { pid: p.id }))}><span class="crece">${p.n}</span><span class="sub">${p.q != null ? p.q + ' und · ' : ''}</span><b class="num">${D.m(p.p)}</b></button>`)}</div>`}
      ${clis.length > 0 && html`<span class="sub">Clientes</span><div class="lista">${clis.map(x => html`<button type="button" class="item toca" style="color:var(--ink)" onClick=${() => c(() => abrir('cliente', { cid: x.id }))}><span class="crece">${x.n}</span><${Icono} n="sig" t=${16} c="var(--faint)" /></button>`)}</div>`}`,
    pie: null
  })} />`;
}

function Borrar({ d, cerrar }) {
  return html`<${Hoja} titulo="¿Empezar de nuevo?" onCerrar=${cerrar} contenido=${c => ({
    cuerpo: html`<p style="margin:0;line-height:1.5">Se borra el negocio de este aparato: ventas, clientes, gastos e inventario. Antes guardamos una copia por si te arrepientes.</p>`,
    pie: html`<button type="button" class="btn toca" style="background:var(--out)" onClick=${() => c(() => { empezarDeNuevo().then(() => { location.hash = ''; }); })}>Sí, empezar de nuevo</button><button type="button" class="btn2 toca" style="min-height:50px;border-radius:25px" onClick=${() => c()}>Cancelar</button>`
  })} />`;
}

// ---------- locales y sucursales ----------
function Locales({ d, cerrar }) {
  const { S } = useApp();
  const antes = S.negocio.sucursales;
  const NOM = ['Centro', 'Norte', 'Este', 'Oeste', 'Sur', 'Sucursal 6', 'Sucursal 7', 'Sucursal 8'];
  const [nombres, setNombres] = useState(antes.length === 1 ? [antes[0] === 'Principal' ? '' : antes[0], ''] : antes.slice());
  const pon = (k, v) => { const ns = nombres.slice(); ns[k] = v; setNombres(ns); };
  const guardar = c => {
    const finales = nombres.map((x, k) => x.trim() || (k < antes.length && antes[k] !== 'Principal' ? antes[k] : NOM[k]));
    const ren = {}; antes.forEach((a, k) => { if (finales[k] && finales[k] !== a) ren[a] = finales[k]; });
    guardarSucursales(finales, ren);
    c(() => avisar(finales.length > antes.length ? 'Listo. Ahora tienes ' + finales.length + ' locales' : 'Locales guardados'));
  };
  return html`<${Hoja} titulo="Locales y sucursales" onCerrar=${cerrar} contenido=${c => ({
    cuerpo: html`<span class="sub" style="line-height:1.45">${antes.length === 1 ? 'Ponle nombre a tu local de siempre y al nuevo. Lo vendido hasta hoy queda en el primero.' : 'Cambia los nombres o agrega otro. Lo vendido se mueve con el nombre.'}</span>
      ${nombres.map((x, k) => html`<label class="campo entra" key=${k} style=${{ '--i': k }}><span>${k === 0 && antes.length === 1 ? 'Tu local de siempre' : k >= antes.length ? 'Local nuevo' : 'Local ' + (k + 1)}</span><input type="text" value=${x} placeholder=${k < antes.length && antes[k] !== 'Principal' ? antes[k] : NOM[k]} onInput=${e => pon(k, e.target.value)} /></label>`)}
      ${nombres.length < 8 && html`<button type="button" class="btn2 acento toca" onClick=${() => setNombres(nombres.concat(['']))}>+ Otro local</button>`}`,
    pie: html`<button type="button" class="btn toca" onClick=${() => guardar(c)}>Guardar</button>`
  })} />`;
}

// ---------- perfiles del equipo ----------
function Perfil({ d, cerrar }) {
  const { S, E, yo, puede } = useApp();
  const p0 = S.perfiles.find(p => p.id === d.pid) || null;
  // Sin permiso de equipo solo se cambia el nombre y el PIN propio, nunca el rol.
  const admin = puede('equipo');
  const esDueno = p0 && p0.rol === 'dueno', soloDatos = esDueno || !admin;
  const rolesPosibles = S.roles.filter(r => !r.fijo && puedeEditarRol(yo, r.id));
  const [f, setF] = useState(p0 ? { n: p0.n, rol: p0.rol, pin: p0.pin || '', sucs: p0.sucs || [], inactivo: !!p0.inactivo } : { n: '', rol: (rolesPosibles.find(r => r.id === 'cajero') || rolesPosibles[0] || {}).id, pin: '', sucs: [], inactivo: false });
  const pon = o => setF(x => Object.assign({}, x, o));
  const guardar = c => {
    if (!f.n.trim()) { avisar('Escribe el nombre'); return; }
    if (f.pin && !/^\d{4}$/.test(f.pin)) { avisar('El PIN son 4 números'); return; }
    if (p0 && p0.id === yo.id && f.inactivo) { avisar('No puedes desactivar tu propio perfil'); return; }
    guardarPerfil(Object.assign({ id: p0 ? p0.id : undefined }, { n: f.n.trim(), pin: f.pin }, soloDatos ? {} : { rol: f.rol, sucs: f.sucs, inactivo: f.inactivo }));
    c(() => avisar(p0 ? 'Perfil guardado' : 'Perfil creado: ' + f.n.trim().split(' ')[0] + (f.pin ? ' entra con su PIN' : '')));
  };
  const rolActual = S.roles.find(r => r.id === f.rol);
  return html`<${Hoja} titulo=${p0 ? (p0.id === yo.id ? 'Tu perfil' : 'Editar perfil') : 'Nuevo perfil'} onCerrar=${cerrar} contenido=${c => ({
    cuerpo: html`
      <label class="campo"><span>Nombre</span><input type="text" value=${f.n} placeholder="Ej.: Luisa Pino" autocomplete="off" onInput=${e => pon({ n: e.target.value })} /></label>
      ${esDueno || !admin ? esDueno && html`<div class="tarjeta fila" style="background:var(--accent-soft);box-shadow:none"><${Icono} n="escudo" t=${18} c="var(--accent)" /><span class="sub" style="color:var(--ink)">Es el dueño: siempre puede todo y nadie le puede quitar permisos.</span></div>`
        : html`<div class="campo"><span>Rol</span><${Chips} opciones=${rolesPosibles.map(r => ({ v: r.id, n: r.n }))} valor=${f.rol} onCambio=${v => pon({ rol: v })} /></div>
          ${rolActual && html`<span class="sub faint entra" key=${f.rol}>Puede: ${Object.keys(rolActual.p).filter(k => rolActual.p[k]).length} de ${PERMISOS.length} permisos. Los cambias en «Qué puede hacer cada rol».</span>`}`}
      <label class="campo"><span>PIN de 4 números (para entrar)</span><input class="num" type="text" inputmode="numeric" maxlength="4" autocomplete="off" value=${f.pin} placeholder="Sin PIN" onInput=${e => pon({ pin: e.target.value.replace(/\D/g, '').slice(0, 4) })} /></label>
      ${E && !soloDatos && html`<div class="campo"><span>Trabaja en</span><div class="chips">
        <button type="button" class=${'chip toca' + (!f.sucs.length ? ' on' : '')} onClick=${() => pon({ sucs: [] })}>Todos los locales</button>
        ${S.negocio.sucursales.map(s => { const on = f.sucs.includes(s); return html`<button type="button" class=${'chip toca' + (on ? ' on' : '')} onClick=${() => pon({ sucs: on ? f.sucs.filter(x => x !== s) : f.sucs.concat([s]) })}>${s}</button>`; })}
      </div></div>`}
      ${p0 && !soloDatos && p0.id !== yo.id && html`<${Interruptor} on=${!f.inactivo} onCambio=${v => pon({ inactivo: !v })} titulo="Perfil activo" sub="Si lo apagas, ya no puede entrar. Sus ventas se quedan." />`}`,
    pie: html`<button type="button" class="btn toca" onClick=${() => guardar(c)}>${p0 ? 'Guardar' : 'Crear perfil'}</button>`
  })} />`;
}

function Rol({ d, cerrar }) {
  const [n, setN] = useState('');
  return html`<${Hoja} titulo="Nuevo rol" onCerrar=${cerrar} contenido=${c => ({
    cuerpo: html`<label class="campo"><span>Nombre del rol</span><input type="text" value=${n} placeholder="Ej.: Repartidor, Contador" onInput=${e => setN(e.target.value)} /></label>
      <span class="sub">Empieza solo con «Vender y cobrar». Después le das los permisos que quieras.</span>`,
    pie: html`<button type="button" class="btn toca" onClick=${() => { if (!n.trim()) { avisar('Escribe el nombre'); return; } nuevoRol(n.trim()); c(() => avisar('Rol creado: ' + n.trim())); }}>Crear rol</button>`
  })} />`;
}

// ---------- datos del negocio ----------
function Negocio({ d, cerrar }) {
  const { S, P, T } = useApp();
  const n = S.negocio;
  const [f, setF] = useState({ nombre: n.nombre, razon: n.razon || '', fiscal: n.fiscal || '', tipo: n.tipo, escala: n.escala, pais: n.pais });
  const pon = o => setF(x => Object.assign({}, x, o));
  const P2 = pais(f.pais), T2 = tipo(f.tipo), otroPais = f.pais !== n.pais;
  const guardar = c => {
    if (!f.nombre.trim()) { avisar('Escribe el nombre'); return; }
    const cambios = { nombre: f.nombre.trim(), razon: f.razon.trim(), fiscal: f.fiscal.trim(), tipo: f.tipo, escala: f.escala, pais: f.pais };
    // Otro país: sus formas de pago e impuesto. La tasa se vuelve a leer.
    if (otroPais) Object.assign(cambios, { pays: P2.pays.slice(), taxOn: P2.tax[1] > 0 });
    const que = 'Cambió los datos del negocio' + (otroPais ? ' (país: ' + P.n + ' → ' + P2.n + ')' : '') + (f.tipo !== n.tipo ? ' (tipo: ' + T.n + ' → ' + T2.n + ')' : '');
    cambiarNegocio(cambios, que);
    if (otroPais) guardarTasa({ modo: 'auto', valor: 0, fecha: '', fuente: 'oficial' });
    c(() => avisar('Datos guardados'));
  };
  return html`<${Hoja} titulo=${n.escala === 'empresa' ? 'Datos de la empresa' : 'Datos del negocio'} onCerrar=${cerrar} contenido=${c => ({
    cuerpo: html`
      <label class="campo"><span>Nombre</span><input type="text" value=${f.nombre} autocomplete="organization" onInput=${e => pon({ nombre: e.target.value })} /></label>
      <div class="campo"><span>Tamaño</span><div class="segmento" style="width:100%">${[['negocio', 'Negocio'], ['empresa', 'Empresa']].map(o => html`<button type="button" style="flex:1" class=${f.escala === o[0] ? 'on' : ''} onClick=${() => pon({ escala: o[0] })}>${o[1]}</button>`)}</div></div>
      <div class="rejilla-2" style="gap:10px">
        <label class="campo"><span>Razón social${f.escala === 'empresa' ? '' : ' (opcional)'}</span><input type="text" value=${f.razon} placeholder=${f.nombre + (P2.suf ? ' ' + P2.suf : '')} onInput=${e => pon({ razon: e.target.value })} /></label>
        <label class="campo"><span>${P2.fiscal[0]}${f.escala === 'empresa' ? '' : ' (opcional)'}</span><input type="text" value=${f.fiscal} placeholder=${P2.fiscal[1] || 'Número fiscal'} onInput=${e => pon({ fiscal: e.target.value })} /></label>
      </div>
      <div class="campo"><span>Tipo</span><${Chips} opciones=${TIPOS.map(t => ({ v: t.id, n: html`<span class="simb"><${Icono} n=${t.id} t=${13} g=${2.2} /></span>${t.n}` }))} valor=${f.tipo} onCambio=${v => pon({ tipo: v })} /></div>
      ${T2.inv !== T.inv && html`<span class="sub entra" style="line-height:1.45">${T2.inv ? 'Ahora vas a llevar inventario: ponle existencia a tus productos en Inventario.' : 'Ahora vendes servicios: se deja de contar el inventario.'}</span>`}
      <label class="campo"><span>País y moneda</span><select value=${f.pais} onChange=${e => pon({ pais: e.target.value })}>${PAISES.map(x => html`<option value=${x.id}>${x.f} ${x.n} · ${x.cur}</option>`)}</select></label>
      ${otroPais && html`<div class="tarjeta fila entra" style="background:var(--amber-soft);box-shadow:none;gap:10px;align-items:flex-start"><${Icono} n="alerta" t=${18} c="var(--amber)" /><span class="sub" style="color:var(--ink);line-height:1.45"><b>Ojo:</b> los precios y montos guardados no se convierten. Si cambias de ${P.cur} a ${P2.cur}, el número se queda igual. Las formas de pago pasan a las de ${P2.n}.</span></div>`}`,
    pie: html`<button type="button" class="btn toca" onClick=${() => guardar(c)}>Guardar</button>`
  })} />`;
}

// ---------- tasa del dólar (Venezuela y Argentina) ----------
function Tasa({ d, cerrar }) {
  const { S, P, D, enLinea } = useApp();
  const ve = P.id === 'VE';
  const [modo, setModo] = useState(S.tasa.modo || 'auto');
  const [fuente, setFuente] = useState(S.tasa.fuente || 'oficial');
  const [valor, setValor] = useState(S.tasa.valor ? String(S.tasa.valor).replace('.', ',') : '');
  const [leyendo, setLeyendo] = useState(false);
  const nf = new Intl.NumberFormat(P.loc, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const t = numero(valor), mon = ve ? 'Bs ' : '$ ';
  const leerYa = async (fu) => {
    if (!enLinea) { avisar('Sin internet: escríbela a mano'); return; }
    setLeyendo(true); const v = await leerTasa(P.id, fu || fuente); setLeyendo(false);
    if (v) { setValor(String(v).replace('.', ',')); avisar('Tasa leída: ' + mon + nf.format(v)); } else avisar('No se pudo leer. Prueba más tarde o escríbela a mano');
  };
  const guardar = c => {
    if (modo === 'manual' && !t) { avisar('Escribe la tasa'); return; }
    // Automática: si no se pudo leer la del dólar elegido, se vuelve a intentar sola cuando haya internet.
    const leida = modo === 'auto' && t && (fuente === S.tasa.fuente || t !== S.tasa.valor);
    guardarTasa(modo === 'manual' ? { modo, fuente, valor: t } : leida ? { modo, fuente, valor: t } : { modo, fuente, fecha: '' });
    c(() => avisar(modo === 'manual' ? 'Tasa fija: ' + mon + nf.format(t) : 'Tasa automática' + (leida ? '' : ': se lee cuando haya internet')));
  };
  return html`<${Hoja} titulo=${ve ? 'Tasa del dólar' : 'Cotización del dólar'} onCerrar=${cerrar} contenido=${c => ({
    cuerpo: html`
      <div style="display:flex;flex-direction:column;align-items:center;gap:2px;padding:4px 0 6px"><span class="sub">1 dólar</span><b class="num" style="font-size:36px;letter-spacing:-0.02em">${mon + nf.format(t || D.tasa)}</b><span class="sub faint">${!t ? 'Valor de referencia: todavía no se ha leído' : modo === 'manual' ? 'Escrita a mano' : (ve ? 'Oficial del BCV' : 'Dólar ' + FUENTES_AR.find(x => x.v === fuente).n.toLowerCase()) + (S.tasa.fecha ? ' · ' + S.tasa.fecha : '')}</span></div>
      <div class="segmento" style="width:100%">${[['auto', 'Automática'], ['manual', 'A mano']].map(o => html`<button type="button" style="flex:1" class=${modo === o[0] ? 'on' : ''} onClick=${() => setModo(o[0])}>${o[1]}</button>`)}</div>
      ${!ve && html`<div class="campo"><span>¿Qué dólar usas?</span><${Chips} opciones=${FUENTES_AR} valor=${fuente} onCambio=${v => { setFuente(v); if (modo === 'auto') leerYa(v); }} /></div>`}
      ${modo === 'manual' ? html`<label class="campo entra"><span>Tasa (${ve ? 'bolívares' : 'pesos'} por dólar)</span><input class="grande num" type="text" inputmode="decimal" value=${valor} placeholder="0" onInput=${e => setValor(e.target.value)} /></label>
          <span class="sub" style="line-height:1.45">Se usa esta hasta que la cambies. Útil si cobras a otra tasa o no tienes internet.</span>`
        : html`<span class="sub" style="line-height:1.45">Orbe la lee de internet una vez al día. Si no hay conexión, usa la última que guardó.</span>
          <button type="button" class=${'btn2 acento toca' + (leyendo ? ' apagado' : '')} onClick=${() => leerYa()}>${leyendo ? 'Leyendo…' : 'Leer ahora'}</button>`}
      ${t > 0 && html`<span class="sub num">Ejemplo: ${ve ? '$ 10 son Bs ' + nf.format(10 * t) : '$ ' + nf.format(10000) + ' son US$ ' + nf.format(10000 / t)}</span>`}`,
    pie: html`<button type="button" class="btn toca" onClick=${() => guardar(c)}>Guardar</button>`
  })} />`;
}

// ---------- copias: restaurar una automática o un archivo ----------
function Copias({ d, cerrar }) {
  const { abrir } = useApp();
  const [lista, setLista] = useState(null);
  const archivo = useRef(null);
  useEffect(() => { listarCopias().then(setLista); }, []);
  const preguntar = (c, datos, de) => c(() => abrir('confirmar', {
    titulo: '¿Restaurar esta copia?', boton: 'Sí, restaurar',
    texto: 'Se vuelve a ' + de + ' (' + (datos.negocio ? datos.negocio.nombre + ', ' : '') + datos.ventas.length + ' ventas). Lo que tienes ahora se guarda aparte, así puedes volver si te arrepientes.',
    si: () => restaurar(datos).then(ok => avisar(ok ? 'Copia restaurada' : 'Esa copia no sirve'))
  }));
  const elegirArchivo = (c, e) => {
    const f = e.target.files && e.target.files[0]; if (!f) return;
    f.text().then(txt => { let x = null; try { x = JSON.parse(txt); } catch (er) { /* no es JSON */ }
      if (valido(x)) preguntar(c, x, 'el archivo «' + f.name + '»'); else avisar('Ese archivo no es una copia de Orbe Negocios'); });
    e.target.value = '';
  };
  const cuando = t => t ? fechaCorta(t) + ' · ' + hora(t) : 'Fecha desconocida';
  return html`<${Hoja} titulo="Restaurar una copia" onCerrar=${cerrar} contenido=${c => ({
    cuerpo: html`<span class="sub" style="line-height:1.45;margin-top:-6px">Orbe guarda una copia cada día en este aparato (las últimas 7). También puedes subir una copia que descargaste.</span>
      <div class="lista">${lista === null ? html`<p class="vacio">Buscando copias…</p>` : lista.length ? lista.map((x, i) => html`<button type="button" key=${x.k} class="item toca entra" style=${{ '--i': i, color: 'var(--ink)' }} onClick=${() => leerCopia(x.k).then(datos => datos ? preguntar(c, datos, 'la copia del ' + cuando(x.t)) : avisar('No se pudo leer esa copia'))}>
        <span class="simb-c" style="--c:var(--c1);width:34px;height:34px"><${Icono} n="guardar" t=${16} /></span>
        <span class="crece" style="display:flex;flex-direction:column;gap:1px"><b style="font-size:14px;font-weight:600">${cuando(x.t)}</b><span class="sub faint">${x.nombre} · ${x.negocio || 'sin negocio'} · ${x.ventas} ventas</span></span>
        <${Icono} n="sig" t=${16} c="var(--faint)" /></button>`) : html`<p class="vacio">Todavía no hay copias. La primera se hace hoy.</p>`}</div>
      <input ref=${archivo} type="file" accept=".json,application/json" hidden onChange=${e => elegirArchivo(c, e)} />`,
    pie: html`<button type="button" class="btn2 acento toca" style="min-height:52px;border-radius:26px" onClick=${() => archivo.current && archivo.current.click()}><${Icono} n="subir" t=${16} />Subir un archivo de copia</button>`
  })} />`;
}

// ---------- registro de cambios ----------
function Registro({ d, cerrar }) {
  const { S } = useApp();
  const quien = id => { const p = S.perfiles.find(x => x.id === id); return p ? p.n : 'Alguien'; };
  const lista = (S.registro || []).slice().reverse();
  return html`<${Hoja} titulo="Registro de cambios" onCerrar=${cerrar} contenido=${c => ({
    cuerpo: html`<span class="sub" style="margin-top:-6px">Anulaciones, devoluciones, borrados y cambios del negocio: quién y cuándo.</span>
      <div class="lista">${lista.length ? lista.slice(0, 100).map((x, i) => html`<div class="item entra" key=${x.t + '' + i} style=${{ '--i': Math.min(i, 12) }}>
        <span class=${'logo redondo ' + TONOS[Math.max(0, S.perfiles.findIndex(p => p.id === x.por)) % 5]} style="width:32px;height:32px;font-size:12px">${iniciales(quien(x.por))}</span>
        <span class="crece" style="display:flex;flex-direction:column;gap:1px"><span style="font-size:14px">${x.que}</span><span class="sub faint">${quien(x.por).split(' ')[0]} · ${fechaCorta(x.t)} ${hora(x.t)}</span></span></div>`) : html`<p class="vacio">Todavía no hay cambios anotados.</p>`}</div>`,
    pie: null
  })} />`;
}
