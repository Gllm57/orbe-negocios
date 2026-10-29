// Todas las hojas (teléfono) o ventanas (computadora) de la app.
import { html, useState, useEffect, useRef } from '../lib/preact-htm.js';
import { useApp } from '../ctx.js';
import { leer, vender, abonar, anotarGasto, editarGasto, borrarGasto, guardarProducto, borrarProducto, reponer, nuevoCliente, editarCliente, borrarCliente, cerrarDia, empezarDeNuevo, fiadoDe, pagosDeAbono, deudores, deudaDe, resumen, inicioDia, gastosEntre, guardarSucursales, guardarPerfil, cambiarPin, borrarPerfil, claveItem, turnoActual, cajaEntre, cerrarTurno, inicioVisible, nuevoRol, perfilActual, anularVenta, devolver, cambiarNegocio, guardarTasa, listarCopias, leerCopia, restaurar, valido, listaProductos, listaClientes, vigentes, tasaMetodo, tasaDe, guardarTasaExtra, remarcar, quitarCeros, verificarPagos, bajoCosto, revisarIntegridad, anonimizarCliente, guardarGrupo } from '../datos.js';
import { rolDe, puedeEditarRol, PERMISOS } from '../permisos.js';
import { telInternacional, PAISES, TIPOS, pais, tipo, leerTasa, nombreTasa, FUENTES_AR, TASAS_EXTRA, esDivisa, esElectronico, monedaEfectivo, billetesDe } from '../paises.js';
import { Hoja, Icono, Interruptor, Chips, avisar, iniciales, TONOS, hora, fechaCorta, hace, simbolo, Bandera, MarcaNegocio, achicarImagen } from '../ui.js';
import { Monto, Linea } from '../graficos.js';
import { usePagos, conSimbolo, numero, esEfectivo } from './pagos.js';
import { infoTasas } from './tasas.js';
import { Grupos, Grupo, colorGrupo, textosProducto, iniciales2 } from './grupos.js';
import { Escaner, mismoCodigo } from './escaner.js';
import { Precios } from './precios.js';
import { Caja, MovCaja } from './caja.js';
import { Variante, Cantidad, Linea as LineaVenta, Descuento, Cargo } from './lineas.js';
import { Promos, Promo } from './promos.js';
import { Factura } from './factura.js';
import { verQ } from '../carrito.js';
import { imprimir, lineasRecibo, lineasZ, ajustesImpresora } from '../impresora.js';
import { Orden, NuevaOrden, AbonoOrden, CancelarOrden } from './ordenes.js';
import { buscar, parecidos } from '../buscar.js';

const CATS = ['Mercancía', 'Alquiler', 'Servicios', 'Sueldos', 'Transporte', 'Otro'];
const VENCE = [{ v: 7, n: 'En 7 días' }, { v: 15, n: 'En 15 días' }, { v: 30, n: 'En 30 días' }];
const telWA = t => telInternacional(t, (leer().negocio || {}).pais);
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
  const H = { cobrar: Cobrar, recibo: Recibo, anular: Anular, devolver: Devolver, gasto: Gasto, abono: Abono, recordar: Recordar, cierre: Cierre, producto: Producto, reponer: Reponer, nuevoCliente: NuevoCliente, cliente: Cliente, buscar: Buscar, borrar: Borrar, confirmar: Confirmar, locales: Locales, perfil: Perfil, rol: Rol, negocio: Negocio, tasa: Tasa, copias: Copias, registro: Registro, remarcar: Remarcar, conciliar: Conciliar, ceros: Ceros, cierres: Cierres, cierreZ: CierreZ, grupos: Grupos, grupo: Grupo, escaner: Escaner, pin: Pin, orden: Orden, nuevaOrden: NuevaOrden, abonoOrden: AbonoOrden, cancelarOrden: CancelarOrden, precios: Precios, caja: Caja, movCaja: MovCaja, variante: Variante, cantidad: Cantidad, linea: LineaVenta, descuento: Descuento, cargo: Cargo, factura: Factura, promos: Promos, promo: Promo }[hoja.t];
  return H ? html`<${H} d=${hoja.datos} cerrar=${cerrar} />` : null;
}

// ---------- cobrar ----------
function Cobrar({ d, cerrar }) {
  const { S, P, D, T, abrir, suc, tel, puede } = useApp();
  const fiadoN = T.id === 'tienda' || T.id === 'comida' ? 'Fiado' : 'Por cobrar';
  const [cli, setCli] = useState(d.cli || '');
  const [verCli, setVerCli] = useState(!!d.cli);
  // Orden de trabajo o pedido: lo ya adelantado se descuenta y se paga con «Anticipo» (ya entró a la caja).
  const anticipo = D.redondo(d.anticipo || 0);
  const clientes = deudores(), cliObj = clientes.find(x => x.id === cli), saldoCli = cliObj ? cliObj.saldo : 0;
  const metodos = S.negocio.pays.concat(puede('fiado') ? [fiadoN] : [], saldoCli > 0 ? ['Saldo a favor'] : []);
  const total = D.redondo(d.tt.total - anticipo);
  const fp = usePagos(total, metodos, undefined, m => P.id === 'VE' && S.negocio.igtf && esDivisa(m) ? 1.03 : 1);
  const [recibe, setRecibe] = useState(0);
  const [vueltoElegido, setVueltoEn] = useState(null);
  const [comoSaldo, setComoSaldo] = useState(false);
  // Con pagos combinados también se puede fiar solo una parte.
  const partes0 = fp.pagos().map(p => p.m === fiadoN ? Object.assign({}, p, { m: 'Fiado' }) : p);
  // IGTF (Venezuela): 3 % sobre lo que se paga en divisas, si el negocio lo cobra.
  const conIgtf = P.id === 'VE' && S.negocio.igtf;
  const partes = conIgtf ? partes0.map(p => esDivisa(p.m) ? Object.assign({}, p, { v: D.redondo(p.v * 1.03) }) : p) : partes0;
  const igtf = conIgtf ? D.redondo(partes.reduce((a, p) => a + p.v, 0) - partes0.reduce((a, p) => a + p.v, 0)) : 0;
  const totalCobrar = D.redondo(total + igtf);
  const fiado = partes.some(p => p.m === 'Fiado'), parteFiada = partes.reduce((a, p) => a + (p.m === 'Fiado' ? p.v : 0), 0);
  const usaSaldo = partes.reduce((a, p) => a + (p.m === 'Saldo a favor' ? p.v : 0), 0);
  const efectivo = fp.efectivo;
  // Billetes en la moneda de esa forma de pago: euros para «Efectivo €», bolívares para «Efectivo Bs».
  const monEf = efectivo ? monedaEfectivo(P, fp.m) : null;
  const conv = monEf && monEf.otra ? (monEf.eur ? { a: x => D.aEur(x), de: x => D.deEur(x) } : { a: x => D.aOtra(x, tasaMetodo(fp.m)), de: x => D.deOtra(x, tasaMetodo(fp.m)) }) : null;
  const opcionesPago = conv ? (() => { const t0 = Math.round(conv.a(totalCobrar) * 100) / 100, out = [t0];
      billetesDe(monEf.cod).forEach(u => { const x = Math.ceil(t0 / u - 1e-9) * u; if (x > t0 + 1e-9 && !out.includes(x) && out.length < 4) out.push(x); });
      return out.sort((a, b) => a - b).map((x, i) => ({ v: i ? conv.de(x) : totalCobrar, ver: i ? monEf.s + ' ' + x.toLocaleString(P.loc) : 'Exacto' })); })()
    : D.billetes(totalCobrar).map((v, i) => ({ v, ver: i ? D.m(v) : 'Exacto' }));
  const vueltoEn = vueltoElegido || (monEf && monEf.eur ? 'e' : monEf && monEf.otra ? 's' : 'p');
  const dado = recibe >= totalCobrar ? recibe : totalCobrar;
  const vuelto = efectivo ? D.redondo(dado - totalCobrar) : fp.vuelto;
  const pideCli = fiado || usaSaldo > 0 || verCli || comoSaldo;
  const listo = c => {
    if (!fp.ok) { avisar(fp.falta > 0 ? 'Falta ' + D.m(fp.falta) + ' por repartir' : 'Sobran ' + D.m(-fp.falta)); return; }
    if ((fiado || usaSaldo > 0 || comoSaldo) && !cli) { avisar('Elige el cliente'); return; }
    if (usaSaldo > saldoCli + 0.004) { avisar('Su saldo a favor es ' + D.m(saldoCli)); return; }
    const items = d.items.map(it => Object.assign({}, it));
    const venta = vender({ items, pagos: (anticipo > 0 ? [{ m: 'Anticipo', v: anticipo }] : []).concat(total > 0 ? partes : []), cli, suc: suc || S.negocio.sucursales[0], fiado: fiado || usaSaldo > 0, total: total + anticipo, igtf });
    if (d.orden) venta.orden = d.orden;
    // Lo que se ahorró por promociones y descuentos queda en la venta (sale en el recibo).
    const ahorro = D.redondo(items.reduce((a, it) => a + (it.pLista != null ? it.q * (it.pLista - it.p) : 0), 0));
    if (ahorro > 0) venta.descuento = ahorro;
    venta.recibido = vuelto > 0 ? totalCobrar + vuelto : 0; venta.imp = d.tt.imp; venta.impTxt = d.tt.txt; if (d.tt.desglose && d.tt.desglose.length > 1) venta.impDesglose = d.tt.desglose;
    if (vuelto > 0 && comoSaldo && cli) { venta.vueltoSaldo = vuelto; abonar(cli, [{ m: efectivo ? fp.m : (partes.find(p => esEfectivo(p.m)) || partes[0]).m, v: vuelto }], 'Vuelto como saldo a favor'); }
    else if (vuelto > 0 && vueltoEn !== 'p') venta.vueltoEn = vueltoEn;
    d.onListo && d.onListo(venta);
    c(() => abrir('recibo', { venta, nueva: true }));
  };
  const textoBoton = !fp.ok ? (fp.falta > 0 ? 'Falta ' + D.m(fp.falta) : 'Sobran ' + D.m(-fp.falta))
    : fiado && parteFiada >= total - 0.001 ? 'Anotar ' + D.m(total) + (cliObj ? ' a ' + cliObj.n.split(' ')[0] : '')
    : 'Cobrar ' + D.m(totalCobrar) + (fiado ? ' · ' + D.m(parteFiada) + ' fiado' : '');
  const fmt2 = x => new Intl.NumberFormat(P.loc, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(x);
  return html`<${Hoja} titulo=${d.titulo || (T.vender === 'Pedido' ? 'Cobrar pedido' : 'Cobrar')} onCerrar=${cerrar} contenido=${c => ({
    cuerpo: html`
      <div style="display:flex;flex-direction:column;align-items:center;gap:2px;padding:4px 0 6px"><b class="num" style="font-size:40px;letter-spacing:-0.02em">${D.m(totalCobrar)}</b>${anticipo > 0 && html`<span class="sub num">Total ${D.m(total + anticipo)} · ya adelantó ${D.m(anticipo)}</span>`}${D.dual && html`<span class="sub num">${D.s(totalCobrar)}${S.negocio.euro ? ' · ' + D.e(totalCobrar) : ''}</span>`}${d.tt.txt && html`<span class="sub faint num">${d.tt.txt}: ${D.m(d.tt.imp)}</span>`}${igtf > 0 && html`<span class="sub num entra" style="color:var(--amber-text)">Incluye IGTF 3 % por pago en divisas: ${D.m(igtf)}</span>`}
        ${D.dual && html`<button type="button" class="enlace-tasa toca" onClick=${() => c(() => abrir('tasa', { volver: d }))}>${nombreTasa(P, S.tasa)} ${P.id === 'VE' ? 'Bs' : P.s} ${fmt2(D.tasa)}${S.negocio.euro ? ' · € ' + (P.id === 'VE' ? 'Bs ' : P.s + ' ') + fmt2(D.tasaEur) : ''} · ver o cambiar</button>`}</div>
      ${fp.vista({ desliza: tel, calido: v => v === fiadoN || v === 'Saldo a favor', ayuda: 'Ej.: una parte por ' + (S.negocio.pays[0] || '') + ' y otra por ' + (S.negocio.pays[S.negocio.pays.length - 1] || '') + (puede('fiado') ? ', o una parte fiada' : '') })}
      ${efectivo && html`<div class="campo entra"><span>¿Con cuánto te paga?</span>
        <div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px">${opcionesPago.map(o => html`<button type="button" class=${'chip toca' + (Math.abs(o.v - dado) < 0.005 ? ' on' : '')} style="justify-content:center;padding:0 4px;color:var(--ink)" onClick=${() => setRecibe(o.v)}>${o.ver}</button>`)}</div>
      </div>`}
      ${vuelto > 0 && html`<div class="pila entra" style="gap:8px">
        <div class="fila" style="border-radius:16px;background:var(--in-soft);padding:12px 14px"><span class="crece in" style="font-size:14px;font-weight:600">${comoSaldo ? 'Queda a favor del cliente' : 'Vuelto'}</span><span style="display:flex;flex-direction:column;align-items:flex-end"><${Monto} v=${comoSaldo ? vuelto : vueltoEn === 's' ? D.aOtra(vuelto, tasaMetodo('Efectivo Bs')) : vueltoEn === 'e' ? D.aEur(vuelto) : vuelto} f=${comoSaldo ? D.m : vueltoEn === 's' ? (x => (P.id === 'VE' ? 'Bs ' : 'US$ ') + fmt2(x)) : vueltoEn === 'e' ? (x => '€ ' + fmt2(x)) : D.m} clase="in" />${D.dual && !comoSaldo && html`<span class="sub num">${vueltoEn !== 'p' ? '= ' + D.m(vuelto) : '= ' + (P.id === 'VE' ? 'Bs ' : 'US$ ') + fmt2(D.aOtra(vuelto, tasaMetodo('Efectivo Bs')))}</span>`}</span></div>
        <div class="chips">
          ${D.dual && [['p', 'Vuelto en ' + (P.id === 'VE' ? '$' : P.s)], ['s', 'Vuelto en ' + (P.id === 'VE' ? 'Bs' : 'US$')]].concat(S.negocio.euro ? [['e', 'Vuelto en €']] : []).map(o => html`<button type="button" class=${'chip chico toca' + (!comoSaldo && vueltoEn === o[0] ? ' on' : '')} onClick=${() => { setComoSaldo(false); setVueltoEn(o[0]); }}>${o[1]}</button>`)}
          <button type="button" class=${'chip chico toca' + (comoSaldo ? ' on' : '')} onClick=${() => setComoSaldo(!comoSaldo)}>Dejar como saldo a favor</button>
        </div>
      </div>`}
      ${pideCli ? html`<div class="campo entra"><span>${fiado ? '¿A quién se lo anotas?' + (parteFiada < total - 0.001 ? ' (' + D.m(parteFiada) + ')' : '') : comoSaldo ? '¿De quién es el saldo a favor?' : 'Cliente'}</span>
        <div class="chips">${clientes.map((x, i) => html`<button type="button" class=${'chip toca' + (cli === x.id ? ' on calido' : '')} style="padding-left:6px;color:var(--ink)" onClick=${() => setCli(cli === x.id ? '' : x.id)}><span class=${'logo redondo ' + TONOS[i % 5]} style="width:28px;height:28px;font-size:11px">${iniciales(x.n)}</span>${x.n.split(' ')[0]}${x.saldo > 0 ? html`<span class="sub in" style="font-size:11px">+${D.m(x.saldo)}</span>` : null}</button>`)}
        <button type="button" class="chip toca" style="border:1.5px dashed var(--line);background:transparent" onClick=${() => c(() => abrir('nuevoCliente', { volver: d }))}>+ Nuevo</button></div>
        ${saldoCli > 0 && !usaSaldo && html`<span class="sub in">${cliObj.n.split(' ')[0]} tiene ${D.m(saldoCli)} a favor: elige «Saldo a favor» para usarlo.</span>`}
      </div>` : html`<button type="button" class="btn2 chico toca" style="align-self:flex-start" onClick=${() => setVerCli(true)}><${Icono} n="personas" t=${15} />Anotar a un cliente</button>`}`,
    pie: html`<button type="button" class=${'btn toca' + (fiado && parteFiada >= total - 0.001 ? ' ambar' : '') + (fp.ok ? '' : ' apagado')} onClick=${() => listo(c)}>${textoBoton}</button>`
  })} />`;
}

// ---------- recibo ----------
export function textoRecibo(v, S, D, P) {
  const cli = S.clientes.find(c => c.id === v.cli);
  return [S.negocio.nombre + (S.negocio.razon ? ' · ' + S.negocio.razon : ''), S.negocio.fiscal ? P.fiscal[0] + ' ' + S.negocio.fiscal : '', 'Recibo #' + v.n + ' · ' + new Date(v.t).toLocaleString('es'), (S.perfiles || []).find(p => p.id === v.por) ? 'Te atendió ' + S.perfiles.find(p => p.id === v.por).n.split(' ')[0] : '', '',
    ...v.items.map(it => it.q + ' x ' + it.n + ': ' + D.m(it.q * it.p)), '', 'Total: ' + D.m(v.total) + (D.dual ? ' (' + D.s(v.total) + ')' : ''),
    v.igtf > 0 ? 'IGTF 3 %: ' + D.m(v.igtf) : '',
    ...v.pagos.map(p => p.m + (p.ref ? ' (ref ' + p.ref + ')' : '') + ': ' + D.m(p.v)), cli ? 'Cliente: ' + cli.n : '', '', '¡Gracias por tu compra!'].filter((x, i, a) => x !== '' || a[i - 1] !== '').join('\n');
}
function Recibo({ d, cerrar }) {
  const { S, P, D, tel, abrir, puede } = useApp();
  const v = S.ventas.find(x => x.id === d.venta.id) || d.venta, cli = S.clientes.find(c => c.id === v.cli), atendio = S.perfiles.find(p => p.id === v.por);
  const quien = id => { const p = S.perfiles.find(x => x.id === id); return p ? p.n.split(' ')[0] : ''; };
  const quedan = v.items.some(it => it.q - ((v.devuelto || {})[claveItem(it)] || 0) > 0);
  const corregir = puede('anular') && !v.anulada && !v.dev;
  const enviar = () => { abrirWA(cli && cli.tel, textoRecibo(v, S, D, P)); };
  const imprimirTicket = (venta, cajon) => imprimir(lineasRecibo(venta, { S, P, D }), { cajon, logo: S.negocio.logo }).catch(er => avisar(er && er.message === 'sin-bluetooth' ? 'Este aparato no permite Bluetooth: usa la impresión del sistema' : 'No se pudo imprimir: revisa que la impresora esté encendida'));
  // Impresión automática al cobrar (y el cajón, si se pagó en efectivo).
  useEffect(() => { if (d.nueva && !v.anulada && ajustesImpresora().auto) imprimirTicket(v, v.pagos.some(p => esEfectivo(p.m))); }, []);
  return html`<${Hoja} titulo=${d.nueva ? (v.fiado ? 'Anotado' : 'Venta guardada') : v.dev ? 'Devolución #' + v.n : 'Venta #' + v.n} onCerrar=${cerrar} contenido=${c => ({
    cuerpo: html`
      ${d.nueva && html`<div style="display:flex;flex-direction:column;align-items:center;gap:8px;text-align:center"><span style="width:64px;height:64px;border-radius:50%;background:var(--in);display:grid;place-items:center;animation:pop .55s var(--spring) both"><${Icono} n="check" t=${30} g=${2.8} c="#0b0a14" /></span>
        <span class="sub">${navigator.onLine ? (v.fiado ? 'Sumado a lo que te debe ' + (cli ? cli.n.split(' ')[0] : '') + '.' : 'Sumada a la caja de hoy.') : 'Guardada en este aparato. Se sube cuando vuelva el internet.'}</span></div>`}
      ${v.anulada && html`<div class="tarjeta fila entra" style="background:var(--out-soft, color-mix(in srgb, var(--out) 14%, transparent));box-shadow:none;gap:10px"><${Icono} n="deshacer" t=${18} c="var(--out)" /><span class="sub" style="color:var(--ink);line-height:1.4"><b>Venta anulada</b> ${hace(v.anulada.t)}${quien(v.anulada.por) ? ' por ' + quien(v.anulada.por) : ''}. Motivo: ${v.anulada.motivo}. No cuenta en la caja ni en los reportes.</span></div>`}
      ${v.devuelto && !v.anulada && html`<div class="tarjeta fila entra" style="background:var(--fill2);box-shadow:none;gap:10px"><${Icono} n="deshacer" t=${18} c="var(--muted)" /><span class="sub" style="color:var(--ink)">Devolvieron: ${v.items.filter(it => v.devuelto[claveItem(it)]).map(it => v.devuelto[claveItem(it)] + ' × ' + it.n).join(', ')}</span></div>`}
      ${v.dev && html`<div class="tarjeta fila entra" style="background:var(--fill2);box-shadow:none;gap:10px"><${Icono} n="deshacer" t=${18} c="var(--muted)" /><span class="sub" style="color:var(--ink)">Devolución de la venta #${v.dev}${v.motivo ? ' · ' + v.motivo : ''}</span></div>`}
      <div style=${'border-radius:16px;background:#f7f6fc;color:#1a1733;padding:16px;display:flex;flex-direction:column;gap:7px;font-size:13px;font-family:ui-monospace,Menlo,Consolas,monospace;position:relative;overflow:hidden' + (v.anulada ? ';opacity:.75' : '')}>
        ${v.anulada && html`<span class="sello">ANULADA</span>`}
        ${S.negocio.logo && html`<img src=${S.negocio.logo} alt="" style="display:block;margin:0 auto 2px;max-width:96px;max-height:56px;object-fit:contain" />`}
        <b style="text-align:center;font-size:14px">${S.negocio.nombre}</b>
        ${S.negocio.razon && html`<span style="text-align:center;color:#625f7d">${S.negocio.razon}${S.negocio.fiscal ? ' · ' + P.fiscal[0] + ' ' + S.negocio.fiscal : ''}</span>`}
        <span style="text-align:center;color:#625f7d">${v.dev ? 'Devolución' : 'Recibo'} #${v.n} · ${fechaCorta(v.t)} ${hora(v.t)}${cli ? ' · ' + cli.n : ''}</span>
        ${atendio && html`<span style="text-align:center;color:#625f7d">Te atendió ${atendio.n.split(' ')[0]}${S.negocio.sucursales.length > 1 ? ' · ' + v.suc : ''}</span>`}
        <span style="border-top:1px dashed #c9c6e0"></span>
        ${v.items.map(it => html`<span class="fila" style="justify-content:space-between;gap:8px"><span>${verQ(Math.abs(it.q), it.u)} x ${it.n}</span><span>${D.m(it.q * (it.pLista != null ? it.pLista : it.p))}</span></span>
          ${it.pLista != null && Math.abs(it.pLista - it.p) > 1e-9 && html`<span class="fila" style="justify-content:space-between;gap:8px;color:#0d7f5f;font-size:12px"><span>  ${it.promo ? 'Promo ' + it.promo : it.desc ? 'Descuento ' + it.desc + ' %' : 'Descuento'}</span><span>−${D.m(it.q * (it.pLista - it.p))}</span></span>`}`)}
        ${v.descuento > 0 && html`<span class="fila" style="justify-content:space-between;color:#0d7f5f;font-weight:600"><span>Ahorraste</span><span>${D.m(v.descuento)}</span></span>`}
        <span style="border-top:1px dashed #c9c6e0"></span>
        ${v.imp > 0 && !v.impDesglose && html`<span class="fila" style="justify-content:space-between;color:#625f7d"><span>${v.impTxt}</span><span>${D.m(v.imp)}</span></span>`}
        ${v.impDesglose && v.impDesglose.map(x => html`<span class="fila" style="justify-content:space-between;color:#625f7d"><span>${x.r ? P.tax[0] + ' ' + x.r + ' % sobre ' + D.m(x.base) : 'Exento: ' + D.m(x.base)}</span><span>${x.r ? D.m(x.imp) : ''}</span></span>`)}
        <span class="fila" style="justify-content:space-between;font-weight:700;font-size:15px"><span>TOTAL</span><span>${D.m(v.total)}</span></span>
        ${D.dual && html`<span style="text-align:right;color:#625f7d">${D.s(v.total)}</span>`}
        ${v.igtf > 0 && html`<span class="fila" style="justify-content:space-between;color:#625f7d"><span>IGTF 3 % (divisas)</span><span>${D.m(v.igtf)}</span></span>`}
        ${v.pagos.map(p => html`<span class="fila" style="justify-content:space-between;color:#625f7d;gap:8px"><span>${p.m}${p.ref ? ' · Ref ' + p.ref : ''}${p.ok ? ' ✓' : ''}</span><span>${D.m(p.v)}</span></span>`)}
        ${v.vueltoSaldo > 0 && html`<span class="fila" style="justify-content:space-between;color:#625f7d"><span>Vuelto a favor del cliente</span><span>${D.m(v.vueltoSaldo)}</span></span>`}
        ${v.recibido > 0 && !v.vueltoSaldo && html`<span class="fila" style="justify-content:space-between;color:#625f7d"><span>Recibido ${D.m(v.recibido)} · vuelto</span><span>${v.vueltoEn === 's' ? (P.id === 'VE' ? 'Bs ' : 'US$ ') + new Intl.NumberFormat(P.loc, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(D.aOtra(v.recibido - v.total - (v.igtf || 0), v.tasa)) : v.vueltoEn === 'e' ? '€ ' + new Intl.NumberFormat(P.loc, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(D.aEur(v.recibido - v.total - (v.igtf || 0), v.tasaEur)) : D.m(v.recibido - v.total - (v.igtf || 0))}</span></span>`}
      </div>
      ${corregir && html`<div class="chips" style="justify-content:center">${quedan ? html`<button type="button" class="btn2 chico toca" onClick=${() => c(() => abrir('devolver', { vid: v.id }))}><${Icono} n="deshacer" t=${14} />Devolver productos</button>` : null}<button type="button" class="btn2 chico rojo toca" onClick=${() => c(() => abrir('anular', { vid: v.id }))}>Anular venta</button></div>`}`,
    pie: html`${!v.anulada && html`<button type="button" class="btn wa toca" onClick=${enviar}>Enviar por WhatsApp</button>`}
      ${!v.anulada && html`<button type="button" class="btn2 toca" style="min-height:54px;border-radius:27px" onClick=${() => imprimirTicket(v)}><${Icono} n="doc" t=${16} />Imprimir ticket</button>`}
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
  const [motivo, setMotivo] = useState(MOTIVOS_DEV[0]);
  const vv = v || { items: [], pagos: [], total: 0 };
  const max = it => it.q - ((vv.devuelto || {})[claveItem(it)] || 0);
  // Si el impuesto se cobró aparte, se devuelve en la misma proporción.
  const bruto = vv.items.reduce((a, it) => a + it.q * it.p, 0), factor = bruto ? vv.total / bruto : 1;
  const monto = D.redondo(vv.items.reduce((a, it) => a + (q[claveItem(it)] || 0) * it.p, 0) * factor);
  // Lo que se fió se descuenta de la deuda; el resto se devuelve en dinero (también combinado).
  const aDeuda = Math.min(monto, fiadoDe(vv)), enDinero = D.redondo(monto - aDeuda);
  const pv = vv.pagos.find(p => p.m !== 'Fiado');
  const fp = usePagos(enDinero, S.negocio.pays, pv && pv.m);
  if (!v) return null;
  const pon = (it, dd) => setQ(Object.assign({}, q, { [claveItem(it)]: Math.max(0, Math.min(max(it), (q[claveItem(it)] || 0) + dd)) }));
  const listo = c => {
    if (!monto) { avisar('Elige qué devuelven'); return; }
    if (enDinero > 0 && !fp.ok) { avisar('Reparte bien lo que devuelves'); return; }
    const pagos = enDinero > 0 ? fp.pagos() : [];
    devolver(v.id, q, pagos, motivo, monto);
    c(() => avisar(aDeuda && !enDinero ? 'Devuelto: se restó ' + D.m(aDeuda) + ' de lo que debe' : 'Devuelto · entrega ' + D.m(enDinero) + ' en ' + pagos.map(p => p.m).join(' + ') + (aDeuda ? ' y se restó ' + D.m(aDeuda) + ' de la deuda' : '')));
  };
  return html`<${Hoja} titulo=${'Devolver de la venta #' + v.n} onCerrar=${cerrar} contenido=${c => ({
    cuerpo: html`<span class="sub" style="margin-top:-6px">Elige qué y cuántos devuelven. Vuelve al inventario.</span>
      <div class="tarjeta" style="background:var(--fill2);box-shadow:none;padding:4px 14px"><div class="lista">${v.items.map(it => { const mx = max(it), x = q[claveItem(it)] || 0; return html`<div class="item" key=${claveItem(it)} style=${{ opacity: mx ? 1 : 0.5 }}>
        <span class="crece" style="display:flex;flex-direction:column;gap:1px"><b style="font-size:14px;font-weight:600">${it.n}</b><span class="sub faint num">${mx ? 'Compró ' + it.q + (mx < it.q ? ' · quedan ' + mx : '') + ' · ' + D.m(it.p) + ' c/u' : 'Ya se devolvió todo'}</span></span>
        ${mx ? html`<span class="fila" style="gap:6px"><button type="button" class="icono-btn chico toca" aria-label=${'Uno menos de ' + it.n} onClick=${() => pon(it, -1)}><${Icono} n="menos1" t=${14} g=${2.6} /></button><b class="num" style="min-width:26px;text-align:center">${x}</b><button type="button" class="icono-btn chico toca" aria-label=${'Uno más de ' + it.n} onClick=${() => pon(it, 1)}><${Icono} n="mas1" t=${14} g=${2.6} /></button></span>` : null}
      </div>`; })}</div></div>
      ${aDeuda > 0 && html`<span class="sub">${enDinero ? D.m(aDeuda) + ' se restan de lo que debe (fue fiado).' : 'Fue fiado: lo devuelto se resta de lo que debe.'}</span>`}
      ${(enDinero > 0 || !monto) && fiadoDe(vv) < vv.total && fp.vista({ titulo: '¿Cómo le devuelves el dinero?', desliza: tel, ayuda: 'Ej.: una parte en efectivo y otra por transferencia' })}
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
  const fp = usePagos(numero(monto), S.negocio.pays, g0 && g0.pagos ? g0.pagos[0].m : g0 && g0.m);
  const guardar = c => {
    const v = numero(monto); if (!v) { avisar('Escribe el monto'); return; }
    if (!despues && !fp.ok) { avisar('Falta repartir ' + D.m(fp.falta)); return; }
    const pagos = despues ? [] : fp.pagos();
    const g = { n: n.trim() || cat, cat, v, m: despues ? (g0 && g0.m) || S.negocio.pays[0] : pagos[0].m, pagos: despues ? null : pagos, pagado: !despues, vence: despues ? (vence ? Date.now() + vence * 86400000 : (g0 && g0.vence) || Date.now() + 7 * 86400000) : 0 };
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
        : fp.vista({ titulo: '¿Cómo lo pagaste?', desliza: tel, ayuda: 'Ej.: una parte en efectivo y otra por ' + (S.negocio.pays[0] || 'transferencia') })}`,
    pie: html`<button type="button" class="btn toca" onClick=${() => guardar(c)}>${g0 ? 'Guardar cambios' : 'Guardar gasto'}</button>${g0 ? Pie2('Borrar gasto', () => borrar(c), 'rojo') : null}`
  })} />`;
}

// ---------- abono ----------
function Abono({ d, cerrar }) {
  const { S, D, tel } = useApp();
  const c0 = deudores().find(x => x.id === d.cid) || { n: '', deuda: 0 };
  const [parte, setParte] = useState(1);
  const [otro, setOtro] = useState('');
  const valor = parte === 'otro' ? Math.min(D.redondo(numero(otro)), c0.deuda) : D.redondo(c0.deuda * parte);
  const fp = usePagos(valor, S.negocio.pays);
  const listo = c => {
    if (!valor) { avisar('Escribe cuánto paga'); return; }
    if (!fp.ok) { avisar('Falta repartir ' + D.m(fp.falta)); return; }
    abonar(d.cid, fp.pagos());
    c(() => avisar(valor >= c0.deuda - 0.004 ? c0.n.split(' ')[0] + ' ya no debe nada' : c0.n.split(' ')[0] + ' abonó ' + D.m(valor)));
  };
  return html`<${Hoja} titulo="Anotar abono" onCerrar=${cerrar} contenido=${c => ({
    cuerpo: html`
      <div class="fila"><b class="crece" style="font-size:16px">${c0.n}</b><span class="amber num" style="font-weight:600">Debe ${D.m(c0.deuda)}</span></div>
      <div class="campo"><span>¿Cuánto paga?</span><div class="rejilla-2">${[[1, 'Todo'], [0.5, 'La mitad'], [0.25, 'Una parte'], ['otro', 'Otro monto']].map(x => html`<button type="button" class=${'chip toca' + (parte === x[0] ? ' on' : '')} style="flex-direction:column;justify-content:center;gap:0;min-height:56px;color:var(--ink)" onClick=${() => setParte(x[0])}><span class="sub" style="font-weight:500">${x[1]}</span><b class="num">${x[0] === 'otro' ? (otro ? D.m(valor) : 'Escribir') : D.m(D.redondo(c0.deuda * x[0]))}</b></button>`)}</div></div>
      ${parte === 'otro' && html`<label class="campo entra"><span>Monto que paga</span><input class="grande num" type="text" inputmode="decimal" placeholder="0" value=${otro} onInput=${e => setOtro(e.target.value)} /></label>`}
      ${fp.vista({ titulo: '¿Cómo pagó?', desliza: tel })}`,
    pie: html`<button type="button" class=${'btn toca' + (valor && fp.ok ? '' : ' apagado')} onClick=${() => listo(c)}>Anotar abono de ${D.m(valor)}</button>`
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
  const { S, P, D, puede, abrir } = useApp();
  // Dos modos: cierre del día (todo el día) o cierre de turno (desde el turno anterior, con lo que este dejó en la caja).
  const turno = !!d.turno, tu = turnoActual();
  const hoy0 = inicioDia(Date.now()), desde = turno ? tu.desde : hoy0;
  const r0 = resumen(desde, Date.now() + 1, '');
  // Lo que entró: ventas y abonos de clientes, por forma de pago.
  const porPago = Object.assign({}, r0.porPago);
  S.abonos.filter(a => a.t >= desde).forEach(a => pagosDeAbono(a).forEach(p => { porPago[p.m] = (porPago[p.m] || 0) + p.v; }));
  // Lo que se pagó con el anticipo de una orden ya entró a la caja el día del anticipo.
  delete porPago.Anticipo;
  const r = Object.assign({}, r0, { porPago });
  // El efectivo esperado suma el fondo, los ingresos y los ajustes, y resta retiros y gastos pagados en efectivo.
  const caja = turno ? cajaEntre(tu.desde, Date.now() + 1, tu.base) : cajaEntre(hoy0, Date.now() + 1);
  const esp = k => D.redondo(esEfectivo(k) ? (caja.esperado[k] || 0) : (r.porPago[k] || 0));
  const gastosHoy = gastosEntre(desde, Date.now() + 1).reduce((a, g) => a + g.v, 0);
  const metodos = Object.keys(r.porPago).concat(Object.keys(caja.esperado).filter(k => esEfectivo(k) && Math.abs(caja.esperado[k]) > 0.004)).filter((k, i, a) => a.indexOf(k) === i && k !== 'Fiado' && k !== 'Saldo a favor');
  const efectivos = metodos.filter(esEfectivo), digitales = metodos.filter(k => !esEfectivo(k)).sort((a, b) => r.porPago[b] - r.porPago[a]);
  const [contado, setContado] = useState(() => { const o = {}; metodos.forEach(k => { o[k] = esp(k); }); return o; });
  // Cada efectivo se cuenta en su moneda: en Venezuela, «Efectivo Bs» en bolívares; «Efectivo €» en euros.
  const fmt2 = new Intl.NumberFormat(P.loc, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const enSu = k => { const mon = monedaEfectivo(P, k); return { mon, a: v => mon.eur ? D.aEur(v) : mon.otra ? D.aOtra(v, tasaMetodo(k)) : v, de: x => mon.eur ? D.deEur(x) : mon.otra ? D.deOtra(x, tasaMetodo(k)) : x, ver: x => mon.otra ? mon.s + ' ' + fmt2.format(x) : D.m(x) }; };
  const [texto, setTexto] = useState(() => { const o = {}; efectivos.forEach(k => { const e = enSu(k); o[k] = String(Math.round(e.a(esp(k)) * 100) / 100).replace('.', ','); }); return o; });
  // Al cerrar un turno: cuánto se queda en la caja para el siguiente (de entrada, el fondo con que se empezó).
  const fondoDe = k => { const x = caja.partes[k] || {}; return D.redondo((x.base || 0) + (x.fondo || 0)); };
  const [deja, setDeja] = useState(() => { const o = {}; efectivos.forEach(k => { o[k] = Math.max(0, Math.min(fondoDe(k), esp(k))); }); return o; });
  const ponContado = (k, vMain, txt) => { setContado(cc => Object.assign({}, cc, { [k]: Math.max(0, D.redondo(vMain)) })); setTexto(tt => Object.assign({}, tt, { [k]: txt != null ? txt : String(Math.round(enSu(k).a(Math.max(0, vMain)) * 100) / 100).replace('.', ',') })); };
  // Contar por billetes.
  const [billetes, setBilletes] = useState({});
  const [abierto, setAbierto] = useState('');
  const contarBillete = (k, b, dd) => {
    const bk = Object.assign({}, billetes[k] || {}); bk[b] = Math.max(0, (bk[b] || 0) + dd);
    const suma = Object.keys(bk).reduce((a, x) => a + Number(x) * bk[x], 0);
    setBilletes(Object.assign({}, billetes, { [k]: bk }));
    ponContado(k, enSu(k).de(suma));
  };
  const dif = D.redondo(efectivos.reduce((a, k) => a + (contado[k] - esp(k)), 0));
  const totalDigital = digitales.reduce((a, k) => a + r.porPago[k], 0);
  const estado = df => Math.abs(df) < 0.005 ? ['Cuadra', 't-ver'] : df < 0 ? ['Faltan ' + D.m(-df), 't-amb'] : ['Sobran ' + D.m(df), 't-azu'];
  const cifras = [puede('ganancias') ? ['Ganancia', D.m(r.ganancia), 'var(--in)'] : ['Ventas', String(r.n), 'var(--ink)'], ['Fiado', D.m(r.fiado), 'var(--amber)'], ['Gastos', D.m(gastosHoy), 'var(--out)']];
  return html`<${Hoja} titulo=${turno ? 'Cerrar turno' : 'Cierre del día'} onCerrar=${cerrar} contenido=${c => ({
    cuerpo: html`
      <div class="cierre-resumen">
        <span class="sub">${turno ? 'Vendido en este turno · desde las ' + hora(inicioVisible(desde)) : 'Vendido hoy'} · ${r.n} ${r.n === 1 ? 'venta' : 'ventas'}</span>
        <b class="num cierre-total">${D.m(r.total)}</b>
        ${D.dual && html`<span class="sub num">${D.s(r.total)}</span>`}
        <div class="cierre-cifras">${cifras.map(k => html`<div><span class="sub">${k[0]}</span><b class="num" style=${{ color: k[2] }}>${k[1]}</b></div>`)}</div>
      </div>

      ${efectivos.length > 0 && html`<div class="cierre-seccion"><span class="cierre-tit"><${Icono} n="billete" t=${15} />Cuenta el efectivo</span>
        ${efectivos.map(k => { const ek = esp(k), df = D.redondo(contado[k] - ek), e = enSu(k), bk = billetes[k] || {}, est = estado(df), x = caja.partes[k] || {};
          const det = [x.base ? 'dejaron ' + D.m(x.base) : '', x.fondo ? 'fondo ' + D.m(x.fondo) : '', x.ventas ? 'ventas ' + D.m(x.ventas) : '', x.ingresos ? 'ingresos ' + D.m(x.ingresos) : '', x.retiros ? 'retiros −' + D.m(x.retiros) : '', x.gastos ? 'gastos −' + D.m(x.gastos) : '', x.ajustes ? 'turnos ' + D.m(x.ajustes) : ''].filter(Boolean);
          return html`<div class="cierre-efectivo" key=${k}>
          <div class="fila" style="gap:8px"><b class="crece" style="font-size:15px">${k}</b><span class=${'pildora ' + est[1]}>${est[0]}</span></div>
          <span class="sub num">Esperado ${e.ver(e.a(ek))}${e.mon.otra ? ' · ' + D.m(ek) : ''}</span>
          ${det.length > 1 && html`<span class="sub faint num" style="font-size:12px;margin-top:-6px">${det.join(' · ')}</span>`}
          <div class="cierre-contador">
            <button type="button" class="icono-btn toca" aria-label=${'Contar menos en ' + k} onClick=${() => ponContado(k, contado[k] - (e.mon.otra ? e.de(billetesDe(e.mon.cod)[1]) : D.paso))}><${Icono} n="menos1" t=${16} g=${2.6} /></button>
            <label class="cierre-monto"><span class="sub">${e.mon.otra ? e.mon.s : P.s}</span><input class="num" type="text" inputmode="decimal" autocomplete="off" aria-label=${'Contado en ' + k} value=${texto[k]} onInput=${ev => ponContado(k, e.de(numero(ev.target.value)), ev.target.value)} /></label>
            <button type="button" class="icono-btn toca" aria-label=${'Contar más en ' + k} onClick=${() => ponContado(k, contado[k] + (e.mon.otra ? e.de(billetesDe(e.mon.cod)[1]) : D.paso))}><${Icono} n="mas1" t=${16} g=${2.6} /></button>
          </div>
          ${e.mon.otra && html`<span class="sub num" style="text-align:center">= ${D.m(contado[k])}</span>`}
          <button type="button" class=${'btn2 chico toca' + (abierto === k ? ' acento' : '')} style="align-self:center" onClick=${() => setAbierto(abierto === k ? '' : k)}>${abierto === k ? 'Listo' : 'Contar billetes de ' + e.mon.s}</button>
          ${abierto === k && html`<div class="billetes entra">${billetesDe(e.mon.cod).map(b => html`<div class="billete"><span class="num">${e.mon.s} ${b.toLocaleString(P.loc)}</span><span class="fila" style="gap:4px"><button type="button" class="icono-btn chico toca" style="width:30px;height:30px" aria-label=${'Un billete menos de ' + b} onClick=${() => contarBillete(k, b, -1)}><${Icono} n="menos1" t=${12} g=${2.6} /></button><b class="num" style="min-width:22px;text-align:center">${bk[b] || 0}</b><button type="button" class="icono-btn chico toca" style="width:30px;height:30px" aria-label=${'Un billete más de ' + b} onClick=${() => contarBillete(k, b, 1)}><${Icono} n="mas1" t=${12} g=${2.6} /></button></span></div>`)}</div>`}
        </div>`; })}
      </div>`}

      ${digitales.length > 0 && html`<div class="cierre-seccion"><span class="cierre-tit"><${Icono} n="check" t=${15} />Digital, ya confirmado</span>
        <div class="cierre-digital">${digitales.map(k => html`<div class="fila" key=${k}><span class="simb"><${Icono} n=${simbolo(k)} t=${13} g=${2.2} /></span><span class="crece corta">${k}</span><b class="num">${D.m(r.porPago[k])}</b></div>`)}
          <div class="fila cierre-suma"><span class="crece">Total digital</span><b class="num">${D.m(totalDigital)}</b></div></div>
      </div>`}

      ${metodos.length ? null : html`<p class="vacio">${turno ? 'Todavía no hay movimientos en este turno.' : 'Todavía no hay ventas hoy.'}</p>`}
      ${efectivos.length > 0 && html`<div class=${'cierre-resultado ' + (Math.abs(dif) < 0.005 ? 'ok' : 'mal')}><${Icono} n=${Math.abs(dif) < 0.005 ? 'check' : 'alerta'} t=${18} /><span class="crece">${Math.abs(dif) < 0.005 ? 'La caja cuadra' : (dif < 0 ? 'Faltan ' : 'Sobran ') + D.m(Math.abs(dif)) + ' en efectivo'}</span></div>`}
      ${turno && efectivos.length > 0 && html`<div class="cierre-seccion"><span class="cierre-tit"><${Icono} n="candado" t=${15} />Se queda en la caja para el siguiente turno</span>
        ${efectivos.map(k => { const e = enSu(k); return html`<div class="cierre-efectivo" key=${'d' + k}><div class="fila" style="gap:8px"><b class="crece" style="font-size:14px">${k}</b>
          <div class="chips">${[['Todo', contado[k]], ['El fondo', Math.min(fondoDe(k), contado[k])], ['Nada', 0]].map(o => html`<button type="button" class=${'chip chico toca' + (Math.abs((deja[k] || 0) - o[1]) < 0.005 ? ' on' : '')} onClick=${() => setDeja(Object.assign({}, deja, { [k]: D.redondo(o[1]) }))}>${o[0]}</button>`)}</div></div>
          <span class="sub num">Deja ${e.ver(deja[k] || 0)} · entrega ${e.ver(Math.max(0, contado[k] - (deja[k] || 0)))}</span></div>`; })}
      </div>`}`,
    pie: turno ? html`<button type="button" class="btn toca" onClick=${() => { const dejaOk = {}; efectivos.forEach(k => { dejaOk[k] = Math.min(deja[k] || 0, contado[k]); }); const esperado = {}; efectivos.forEach(k => { esperado[k] = esp(k); }); const cont = {}; efectivos.forEach(k => { cont[k] = contado[k]; }); const t = cerrarTurno(cont, dejaOk, esperado); c(() => { avisar('Turno ' + t.n + ' cerrado' + (Math.abs(dif) < 0.005 ? ': todo cuadra' : ' con ' + (dif < 0 ? 'faltante' : 'sobrante') + ' de ' + D.m(Math.abs(dif)))); abrir('caja'); }); }}>Cerrar turno</button>`
      : html`<button type="button" class="btn toca" onClick=${() => { const turnos = S.turnos.filter(x => x.hasta >= hoy0).map(x => ({ n: x.n, por: x.por, desde: x.desde, hasta: x.hasta, dif: Object.keys(x.dif || {}).reduce((a, k) => a + x.dif[k], 0) })); const movs = cajaEntre(hoy0, Date.now() + 1).partes; const z = cerrarDia(contado, { total: r.total, ganancia: r.ganancia, dif, billetes, porPago: r.porPago, turnos, caja: movs }); c(() => { avisar(dif === 0 ? 'Día cerrado. Todo cuadra' : 'Día cerrado con ' + (dif < 0 ? 'faltante' : 'sobrante') + ' de ' + D.m(Math.abs(dif))); abrir('cierreZ', { id: z.id }); }); }}>Cerrar el día</button>
      ${S.cierres.length > 0 && Pie2('Cierres anteriores', () => c(() => abrir('cierres')))}`
  })} />`;
}

// ---------- producto o servicio ----------
function Producto({ d, cerrar }) {
  const { S, D, T, P, abrir } = useApp();
  const p0 = S.productos.find(p => p.id === d.pid) || null;
  const [f, setF] = useState(p0 ? { n: p0.n, p: String(p0.p), c: String(p0.c), q: p0.q == null ? '' : String(p0.q), min: String(p0.min), dur: p0.dur || 60, cod: p0.cod || '', usd: p0.usd ? String(p0.usd).replace('.', ',') : '' } : { n: d.n || '', p: '', c: '', q: d.q != null ? String(d.q) : '', min: '', dur: 60, cod: d.cod || '', usd: '' });
  const [enDolar, setEnDolar] = useState(!!(p0 && p0.usd));
  // Impuesto del producto: general, una tasa reducida del país o exento.
  const [imp, setImp] = useState(p0 && p0.imp != null ? p0.imp : 'gen');
  // Grupo: uno de los que hay o uno nuevo escrito aquí mismo.
  const [grupo, setGrupo] = useState(p0 ? p0.g || '' : d.g || '');
  const [grupoNuevo, setGrupoNuevo] = useState(null);
  // Se vende por unidad o por peso o medida (kilo, gramo, litro, metro); y puede tener variantes (talla, color…).
  const [u, setU] = useState(p0 && p0.u ? p0.u : '');
  // En una tienda, un servicio (mano de obra, instalación, revisión…) no lleva existencia.
  const [svc, setSvc] = useState(p0 ? T.inv && p0.q == null : !!d.svc);
  const inv = T.inv && !svc;
  const [vars, setVars] = useState(() => (p0 && p0.vars ? p0.vars : []).map(v => ({ id: v.id, n: v.n, q: v.q != null ? String(v.q).replace('.', ',') : '', p: v.p ? String(v.p).replace('.', ',') : '', cod: v.cod || '' })));
  const ponVar = (i, o) => setVars(vs => vs.map((v, k) => k === i ? Object.assign({}, v, o) : v));
  const nuevaVar = n => ({ id: 'v' + Math.random().toString(36).slice(2, 8), n: n || '', q: '', p: '', cod: '' });
  const gen = S.negocio.taxGen != null ? S.negocio.taxGen : P.tax[1];
  const opcionesImp = [{ v: 'gen', n: 'General ' + gen + ' %' }].concat((P.red || []).filter(r => r > 0).map(r => ({ v: r, n: r + ' %' })), [{ v: 0, n: 'Exento' }]);
  const pon = o => setF(x => Object.assign({}, x, o));
  // Argentina: el precio se puede atar al dólar y se recalcula solo cuando cambia la tasa.
  const atable = D.dual && P.id !== 'VE', usd = numero(f.usd);
  const p = enDolar && atable ? D.bonito(usd * D.tasa) : numero(f.p), co = numero(f.c);
  const guardar = c => {
    if (!f.n.trim() || !p) { avisar('Escribe el nombre y el precio'); return; }
    const cod = f.cod.trim();
    const otroCon = cod && listaProductos().find(x => mismoCodigo(x.cod, cod) && (!p0 || x.id !== p0.id));
    if (otroCon) { avisar('Ese código ya lo tiene ' + otroCon.n); return; }
    const varsOk = vars.filter(v => v.n.trim()).map(v => Object.assign({ id: v.id, n: v.n.trim(), q: T.inv ? (u ? numero(v.q) : Math.round(numero(v.q))) : null }, numero(v.p) > 0 ? { p: numero(v.p) } : {}, v.cod.trim() ? { cod: v.cod.trim() } : {}));
    const codRep = varsOk.find(v => v.cod && (mismoCodigo(v.cod, cod) || varsOk.some(w => w !== v && mismoCodigo(w.cod, v.cod)) || listaProductos().some(x => (!p0 || x.id !== p0.id) && (mismoCodigo(x.cod, v.cod) || (x.vars || []).some(w => mismoCodigo(w.cod, v.cod))))));
    if (codRep) { avisar('El código de ' + codRep.n + ' ya lo tiene otro producto o variante'); return; }
    const cant = x => u ? Math.round(numero(x) * 1000) / 1000 : Math.round(numero(x));
    guardarProducto({ id: p0 ? p0.id : undefined, n: f.n.trim(), ab: iniciales2(f.n.trim()), p, c: co, q: inv ? (varsOk.length ? varsOk.reduce((a2, v) => a2 + (v.q || 0), 0) : cant(f.q)) : null, min: inv ? cant(f.min) : 0, u: inv && u ? u : undefined, vars: inv && varsOk.length ? varsOk : undefined, dur: T.inv ? 0 : f.dur, cod, usd: enDolar && atable ? usd : 0, imp: imp === 'gen' ? undefined : imp, g: grupoNuevo && grupoNuevo.trim() ? guardarGrupo({ n: grupoNuevo.trim() }) : grupo });
    // Si se creó desde el escáner, se vuelve a él con el producto ya reconocido.
    c(() => { avisar('Guardado: ' + f.n.trim()); if (d.escaner && cod) abrir('escaner', Object.assign({}, d.escaner, { mostrar: cod })); });
  };
  const borrar = c => c(() => abrir('confirmar', { titulo: '¿Borrar ' + p0.n + '?', texto: 'Ya no sale para vender ni en el inventario. Las ventas que tuvo se quedan en los reportes.', boton: 'Sí, borrar', si: () => { borrarProducto(p0.id); avisar('Borrado: ' + p0.n); } }));
  return html`<${Hoja} titulo=${(p0 ? 'Editar ' : 'Nuevo ') + (inv ? 'producto' : 'servicio')} onCerrar=${cerrar} contenido=${c => ({
    cuerpo: html`
      <label class="campo"><span>Nombre</span><input type="text" value=${f.n} placeholder=${T.inv ? 'Ej.: Arroz 1 kg' : 'Ej.: Corte de cabello'} onInput=${e => pon({ n: e.target.value })} /></label>
      ${atable && html`<${Interruptor} on=${enDolar} onCambio=${setEnDolar} titulo="Precio atado al dólar" sub=${'Se recalcula solo con el ' + nombreTasa(P, S.tasa).toLowerCase()} />`}
      ${enDolar && atable && html`<label class="campo entra"><span>Precio en dólares</span><input class="num" type="text" inputmode="decimal" value=${f.usd} placeholder="0" onInput=${e => pon({ usd: e.target.value })} /></label>${usd > 0 && html`<span class="sub num">Hoy son ${D.m(p)} (US$ 1 = ${D.m(D.tasa)})</span>`}`}
      <div class="rejilla-2" style="gap:10px">${enDolar && atable ? html`<div class="campo"><span>Precio</span><b class="num" style="min-height:52px;display:flex;align-items:center;font-size:18px">${D.m(p)}</b></div>` : html`<label class="campo"><span>Precio</span><input type="text" inputmode="decimal" value=${f.p} placeholder="0" onInput=${e => pon({ p: e.target.value })} /></label>`}<label class="campo"><span>Te cuesta</span><input type="text" inputmode="decimal" value=${f.c} placeholder="0" onInput=${e => pon({ c: e.target.value })} /></label></div>
      ${p > 0 && html`<span class="sub entra">Ganas <b class="in num">${D.m(p - co)}</b> por cada uno (${Math.round((p - co) / p * 100)} %)</span>`}
      ${T.inv && html`<${Interruptor} on=${svc} onCambio=${setSvc} titulo="Es un servicio" sub="Mano de obra, instalación, revisión, envío… No lleva existencia." />`}
      ${inv && html`<div class="campo"><span>Se vende por</span><${Chips} opciones=${[{ v: '', n: 'Unidad' }, { v: 'kg', n: 'Kilo' }, { v: 'g', n: 'Gramo' }, { v: 'l', n: 'Litro' }, { v: 'm', n: 'Metro' }]} valor=${u} onCambio=${setU} chico />${u && html`<span class="sub faint entra" style="font-size:12px">El precio es por ${u}. Al vender se escribe cuánto lleva (o cuánto quiere gastar). Lee las etiquetas de balanza que empiezan con 2.</span>`}</div>`}
      ${inv && vars.length > 0 ? html`<span class="sub">Tienes ${vars.reduce((a2, v) => a2 + numero(v.q), 0)}${u ? ' ' + u : ''} en total (la suma de las variantes).</span>`
      : inv ? html`<div class="rejilla-2" style="gap:10px"><label class="campo"><span>Tienes${u ? ' (' + u + ')' : ''}</span><input type="text" inputmode=${u ? 'decimal' : 'numeric'} value=${f.q} placeholder="0" onInput=${e => pon({ q: e.target.value })} /></label><label class="campo"><span>Avísame con menos de</span><input type="text" inputmode="numeric" value=${f.min} placeholder="0" onInput=${e => pon({ min: e.target.value })} /></label></div>`
        : T.inv ? null : html`<div class="campo"><span>Dura</span><${Chips} opciones=${[{ v: 30, n: '30 min' }, { v: 45, n: '45 min' }, { v: 60, n: '1 hora' }, { v: 120, n: '2 horas' }]} valor=${f.dur} onCambio=${v => pon({ dur: v })} /></div>`}
      <div class="campo"><span>Grupo</span><div class="chips">
        <button type="button" class=${'chip chico toca' + (!grupo && grupoNuevo == null ? ' on' : '')} onClick=${() => { setGrupo(''); setGrupoNuevo(null); }}>Sin grupo</button>
        ${S.grupos.map(g => html`<button type="button" key=${g.id} class=${'chip chico toca' + (grupo === g.id && grupoNuevo == null ? ' on' : '')} onClick=${() => { setGrupo(g.id); setGrupoNuevo(null); }}><i class="punto-grupo" style=${{ background: colorGrupo(g) }}></i>${g.n}</button>`)}
        <button type="button" class=${'chip chico toca' + (grupoNuevo != null ? ' on' : '')} style="border:1.5px dashed var(--line)" onClick=${() => setGrupoNuevo(grupoNuevo == null ? '' : null)}>+ Nuevo</button></div>
        ${grupoNuevo != null && html`<input class="entra" type="text" value=${grupoNuevo} placeholder="Nombre del grupo nuevo" autocomplete="off" onInput=${e => setGrupoNuevo(e.target.value)} />`}</div>
      ${S.negocio.taxOn && html`<div class="campo"><span>${P.tax[0]} de este ${T.inv ? 'producto' : 'servicio'}</span><${Chips} opciones=${opcionesImp} valor=${imp} onCambio=${setImp} chico /></div>`}
      ${inv && !u && html`<div class="campo"><span>Variantes (talla, color, sabor…)</span>
        ${vars.length ? html`<div class="tarjeta pila" style="box-shadow:none;background:var(--fill2);padding:8px 12px;gap:0">${vars.map((v, i) => html`<div class="variante-fila entra" key=${v.id}>
          <div class="fila" style="gap:6px"><input type="text" class="crece" value=${v.n} placeholder="Ej.: M · Rojo" aria-label="Nombre de la variante" autocomplete="off" onInput=${e => ponVar(i, { n: e.target.value })} /><button type="button" class="icono-btn chico toca" style="width:30px;height:30px" aria-label="Quitar variante" onClick=${() => setVars(vars.filter((_, k) => k !== i))}><${Icono} n="cerrar" t=${12} g=${2.6} /></button></div>
          <div class="variante-datos">
            <label><span>Tiene</span><input class="num" type="text" inputmode="numeric" value=${v.q} placeholder="0" aria-label="Existencia de la variante" onInput=${e => ponVar(i, { q: e.target.value })} /></label>
            <label><span>Precio</span><input class="num" type="text" inputmode="decimal" value=${v.p} placeholder=${p ? D.m(p) : 'igual'} aria-label="Precio de la variante" onInput=${e => ponVar(i, { p: e.target.value })} /></label>
            <label><span>Código</span><input class="num" type="text" inputmode="numeric" value=${v.cod} placeholder="opcional" aria-label="Código de la variante" autocomplete="off" onInput=${e => ponVar(i, { cod: e.target.value })} /></label>
          </div>
        </div>`)}</div>` : null}
        <div class="chips"><button type="button" class="chip chico toca" onClick=${() => setVars(vars.concat([nuevaVar()]))}>+ Variante</button>
          ${!vars.length && [['S', 'M', 'L', 'XL'], ['Chico', 'Mediano', 'Grande']].map(g => html`<button type="button" class="chip chico toca" onClick=${() => setVars(g.map(nuevaVar))}>${g.join(' · ')}</button>`)}</div>
        ${vars.length > 0 && html`<span class="sub faint" style="font-size:12px">Sin precio, la variante usa el del producto. Al vender se elige cuál.</span>`}</div>`}
      ${inv && html`<label class="campo"><span>Código de barras (opcional)</span><input class="num" type="text" inputmode="numeric" autocomplete="off" value=${f.cod} placeholder="Pásalo por el lector o escríbelo" onInput=${e => pon({ cod: e.target.value })} /></label>`}`,
    pie: html`<button type="button" class="btn toca" onClick=${() => guardar(c)}>Guardar</button>${p0 ? Pie2('Borrar ' + (T.inv ? 'producto' : 'servicio'), () => borrar(c), 'rojo') : null}`
  })} />`;
}

function Reponer({ d, cerrar }) {
  const { S, D, P, puede } = useApp();
  const p = S.productos.find(x => x.id === d.pid) || { n: '', q: 0, min: 0, c: 0, p: 0 };
  const [cuanto, setCuanto] = useState(Math.max(6, p.min * 2 - p.q));
  const [costo, setCosto] = useState(p.c ? String(p.c).replace('.', ',') : '');
  const cN = numero(costo), subio = cN > 0 && cN > p.c + 0.004, margen = p.p > 0 && cN > 0 ? (p.p - cN) / p.p : 0;
  return html`<${Hoja} titulo=${'Reponer ' + p.n} onCerrar=${cerrar} contenido=${c => ({
    cuerpo: html`<span class="sub">Tienes ${p.q}. El mínimo es ${p.min}.</span>
      <div class="fila" style="justify-content:center;gap:18px;padding:8px 0"><button type="button" class="icono-btn toca" aria-label="Menos" onClick=${() => setCuanto(Math.max(1, cuanto - 1))}><${Icono} n="menos1" /></button><b class="num" style="font-size:40px;min-width:90px;text-align:center">+${cuanto}</b><button type="button" class="icono-btn toca" aria-label="Más" onClick=${() => setCuanto(cuanto + 1)}><${Icono} n="mas1" /></button></div>
      <${Chips} opciones=${[6, 12, 24, 48].map(v => ({ v, n: '+' + v }))} valor=${cuanto} onCambio=${setCuanto} />
      ${puede('ganancias') && html`<label class="campo"><span>¿A cuánto lo compraste esta vez? (c/u)</span><input class="num" type="text" inputmode="decimal" value=${costo} placeholder=${String(p.c)} onInput=${e => setCosto(e.target.value)} /></label>
        ${subio && html`<div class=${'tarjeta fila entra'} style=${{ background: margen < 0.05 ? 'var(--out-soft)' : 'var(--amber-soft)', boxShadow: 'none', gap: '10px', alignItems: 'flex-start' }}><${Icono} n="alerta" t=${18} c=${margen < 0.05 ? 'var(--out)' : 'var(--amber)'} /><span class="sub" style="color:var(--ink);line-height:1.45">Subió ${Math.round((cN / p.c - 1) * 100)} %. Con el precio de ${D.m(p.p)} ${margen < 0 ? 'pierdes ' + D.m(cN - p.p) + ' en cada uno' : 'ganas ' + Math.round(margen * 100) + ' %'}. ${margen < 0.2 ? 'Conviene subir el precio.' : ''}</span></div>`}`}`,
    pie: html`<button type="button" class="btn toca" onClick=${() => { reponer(p.id, cuanto, cN); c(() => avisar(p.n + ': ahora tienes ' + (p.q + cuanto) + (subio ? ' · costo nuevo ' + D.m(cN) : ''))); }}>Sumar ${cuanto} al inventario</button>`
  })} />`;
}

// ---------- clientes ----------
function NuevoCliente({ d, cerrar }) {
  const { S, D, abrir } = useApp();
  const c0 = d.cid ? S.clientes.find(x => x.id === d.cid) : null;
  const [f, setF] = useState(c0 ? { n: c0.n, tel: c0.tel || '', tipo: c0.tipo || 'persona', consent: !!c0.consent } : { n: '', tel: '', tipo: 'persona', consent: false });
  const permiso = f.consent ? { consent: (c0 && c0.consent) || Date.now() } : { consent: 0 };
  const guardar = c => {
    if (!f.n.trim()) { avisar('Escribe el nombre'); return; }
    if (c0) { editarCliente(c0.id, Object.assign({ n: f.n.trim(), tel: f.tel, tipo: f.tipo }, permiso)); c(() => { avisar('Cliente guardado'); abrir('cliente', { cid: c0.id }); }); return; }
    nuevoCliente(Object.assign({ n: f.n.trim(), tel: f.tel, tipo: f.tipo }, permiso)); c(() => { avisar('Cliente guardado'); if (d.volver) abrir('cobrar', d.volver); });
  };
  // Privacidad (GDPR, LGPD y similares): el cliente puede pedir sus datos o que se borren.
  const exportarCliente = x => {
    const datos = { cliente: { nombre: x.n, telefono: x.tel, tipo: x.tipo, consentimiento: x.consent ? new Date(x.consent).toISOString() : null }, compras: vigentes().filter(v => v.cli === x.id).map(v => ({ numero: v.n, fecha: new Date(v.t).toISOString(), total: v.total, productos: v.items.map(it => it.q + ' x ' + it.n) })), pagos: S.abonos.filter(a => a.cli === x.id).map(a => ({ fecha: new Date(a.t).toISOString(), monto: a.v, forma: a.m })) };
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' })); a.download = 'datos-' + x.n.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w]+/g, '-').toLowerCase() + '.json'; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    avisar('Datos de ' + x.n.split(' ')[0] + ' descargados');
  };
  const borrar = c => {
    const debe = deudaDe(c0.id);
    if (debe > 0.004) { avisar(c0.n.split(' ')[0] + ' todavía debe ' + D.m(debe) + '. Primero anota el pago.'); return; }
    c(() => abrir('confirmar', { titulo: '¿Borrar a ' + c0.n + '?', texto: 'Se borran su nombre y su teléfono, y ya no sale en tu lista. Sus compras se quedan en los reportes sin sus datos personales.', boton: 'Sí, borrar sus datos', si: () => { anonimizarCliente(c0.id); avisar('Datos del cliente borrados'); } }));
  };
  return html`<${Hoja} titulo=${c0 ? 'Editar cliente' : 'Nuevo cliente'} onCerrar=${cerrar} contenido=${c => ({
    cuerpo: html`<label class="campo"><span>Nombre</span><input type="text" value=${f.n} onInput=${e => setF(Object.assign({}, f, { n: e.target.value }))} autocomplete="name" /></label>
      <label class="campo"><span>WhatsApp</span><input type="tel" inputmode="tel" value=${f.tel} placeholder="0414-555-1234" onInput=${e => setF(Object.assign({}, f, { tel: e.target.value }))} /></label>
      ${S.negocio.escala === 'empresa' && html`<div class="campo"><span>Es</span><${Chips} opciones=${[{ v: 'persona', n: 'Persona' }, { v: 'empresa', n: 'Empresa' }]} valor=${f.tipo} onCambio=${v => setF(Object.assign({}, f, { tipo: v }))} /></div>`}
      <${Interruptor} on=${f.consent} onCambio=${v => setF(Object.assign({}, f, { consent: v }))} titulo="Aceptó que guardemos sus datos" sub="Nombre y teléfono, para recibos y recordatorios. En muchos países hay que pedirlo." />`,
    pie: html`<button type="button" class="btn toca" onClick=${() => guardar(c)}>Guardar</button>${c0 ? html`<div class="rejilla-2">${Pie2('Exportar sus datos', () => exportarCliente(c0))}${Pie2('Borrar cliente', () => borrar(c), 'rojo')}</div>` : null}`
  })} />`;
}

function Cliente({ d, cerrar }) {
  const { S, D, abrir, puede } = useApp();
  const c0 = deudores().find(x => x.id === d.cid);
  if (!c0) return null;
  const mov = vigentes().filter(v => v.cli === c0.id).map(v => ({ t: v.t, txt: v.dev ? 'Devolución de #' + v.dev : (v.fiado ? 'Fiado #' : 'Compra #') + v.n, v: v.total, fiado: v.fiado, venta: v }))
    .concat(S.abonos.filter(a => a.cli === c0.id).map(a => ({ t: a.t, txt: (a.nota || 'Abono') + ' · ' + a.m, v: -a.v }))).sort((a, b) => b.t - a.t).slice(0, 15);
  return html`<${Hoja} titulo=${c0.n} onCerrar=${cerrar} contenido=${c => ({
    cuerpo: html`
      <div class="rejilla-2">${c0.saldo > 0 ? html`<div class="tarjeta cifra" style="background:var(--in-soft);box-shadow:none;padding:12px"><span class="sub">A su favor</span><b class="num in" style="font-size:20px">${D.m(c0.saldo)}</b></div>` : html`<div class="tarjeta cifra" style="background:var(--amber-soft);box-shadow:none;padding:12px"><span class="sub">Debe</span><b class="num amber" style="font-size:20px">${D.m(c0.deuda)}</b>${S.negocio.fiadoUsd && c0.deuda > 0 && html`<span class="sub num">US$ ${(c0.deuda / tasaDe()).toFixed(2).replace('.', ',')} · sigue al dólar</span>`}</div>`}<div class="tarjeta cifra" style="background:var(--fill2);box-shadow:none;padding:12px"><span class="sub">Compras</span><b class="num" style="font-size:20px">${c0.compras}</b></div></div>
      <div class="fila"><span class="sub crece">${c0.tel ? 'WhatsApp: ' + c0.tel : 'Sin WhatsApp anotado'}${c0.consent ? ' · aceptó guardar sus datos' : ''}</span>${puede('clientes') && html`<button type="button" class="btn2 chico toca" onClick=${() => c(() => abrir('nuevoCliente', { cid: c0.id }))}><${Icono} n="lapiz" t=${14} />Editar</button>`}</div>
      <div class="lista">${mov.length ? mov.map((m, i) => html`<button type="button" class="item toca entra" style=${{ '--i': i, color: 'var(--ink)', cursor: m.venta ? 'pointer' : 'default' }} onClick=${() => m.venta && c(() => abrir('recibo', { venta: m.venta }))}><span class="crece" style="display:flex;flex-direction:column;gap:1px"><span style="font-size:14px">${m.txt}</span><span class="sub faint">${fechaCorta(m.t)} · ${hora(m.t)}</span></span><b class=${'num ' + (m.v < 0 ? 'in' : m.fiado ? 'amber' : '')}>${D.m(m.v)}</b></button>`) : html`<p class="vacio">Sin movimientos todavía.</p>`}</div>`,
    pie: c0.deuda > 0 ? html`<button type="button" class="btn wa toca" onClick=${() => c(() => abrir('recordar', { cid: c0.id }))}>Recordar por WhatsApp</button>${puede('clientes') && html`<button type="button" class="btn2 toca" style="min-height:50px;border-radius:25px" onClick=${() => c(() => abrir('abono', { cid: c0.id }))}>Anotar abono</button>`}` : null
  })} />`;
}

// ---------- buscar (computadora) ----------
function Buscar({ d, cerrar }) {
  const { S, D, abrir, ir } = useApp();
  // Tolerante a acentos, errores de tipeo y plurales; si no hay nada, sugiere lo más parecido.
  const prods = buscar(listaProductos(), d.q, textosProducto(S)).slice(0, 30);
  const clis = buscar(listaClientes(), d.q, x => [x.n, x.tel]).slice(0, 20);
  const sugeridos = !prods.length && !clis.length ? parecidos(listaProductos(), d.q, textosProducto(S)) : [];
  return html`<${Hoja} titulo=${'Buscar «' + d.q + '»'} onCerrar=${cerrar} contenido=${c => ({
    cuerpo: html`${!prods.length && !clis.length && html`<p class="vacio">No encontré nada con «${d.q}».</p>`}
      ${sugeridos.length > 0 && html`<span class="sub">¿Quisiste decir…?</span><div class="lista">${sugeridos.map(p => html`<button type="button" class="item toca" style="color:var(--ink)" onClick=${() => c(() => abrir('producto', { pid: p.id }))}><span class="crece">${p.n}</span><b class="num">${D.m(p.p)}</b></button>`)}</div>`}
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
  const { S, E, yo, puede, abrir } = useApp();
  const p0 = S.perfiles.find(p => p.id === d.pid) || null;
  // Sin permiso de equipo solo se cambia el nombre y el PIN propio, nunca el rol.
  const admin = puede('equipo');
  const esDueno = p0 && p0.rol === 'dueno', soloDatos = esDueno || !admin, soyYo = p0 && p0.id === yo.id;
  const rolesPosibles = S.roles.filter(r => !r.fijo && puedeEditarRol(yo, r.id));
  const [f, setF] = useState(p0 ? { n: p0.n, rol: p0.rol, pin: '', pin2: '', sucs: p0.sucs || [], inactivo: !!p0.inactivo } : { n: '', rol: (rolesPosibles.find(r => r.id === 'cajero') || rolesPosibles[0] || {}).id, pin: '', pin2: '', sucs: [], inactivo: false });
  const pon = o => setF(x => Object.assign({}, x, o));
  const guardar = c => {
    if (!f.n.trim()) { avisar('Escribe el nombre'); return; }
    if (!p0 && f.pin && !/^\d{4}$/.test(f.pin)) { avisar('El PIN son 4 números'); return; }
    if (!p0 && f.pin !== f.pin2) { avisar('Los dos PIN no son iguales'); return; }
    if (soyYo && f.inactivo) { avisar('No puedes desactivar tu propio perfil'); return; }
    guardarPerfil(Object.assign({ id: p0 ? p0.id : undefined }, { n: f.n.trim() }, p0 ? {} : { pin: f.pin }, soloDatos ? {} : { rol: f.rol, sucs: f.sucs, inactivo: f.inactivo }));
    c(() => avisar(p0 ? 'Perfil guardado' : 'Perfil creado: ' + f.n.trim().split(' ')[0] + (f.pin ? ' entra con su PIN' : '')));
  };
  // Eliminar: solo quien maneja el equipo, nunca al dueño ni a uno mismo.
  const puedeBorrar = p0 && admin && !esDueno && !soyYo && puedeEditarRol(yo, p0.rol);
  const borrar = c => c(() => abrir('confirmar', { titulo: '¿Eliminar el perfil de ' + p0.n + '?', texto: 'Ya no podrá entrar. Sus ventas y lo que hizo se quedan en el historial con su nombre.', boton: 'Sí, eliminar perfil', si: () => { borrarPerfil(p0.id); avisar('Perfil eliminado'); } }));
  const rolActual = S.roles.find(r => r.id === f.rol);
  const i = Math.max(0, S.perfiles.indexOf(p0));
  return html`<${Hoja} titulo=${p0 ? (soyYo ? 'Tu perfil' : 'Editar perfil') : 'Nuevo perfil'} onCerrar=${cerrar} contenido=${c => ({
    cuerpo: html`
      ${p0 && html`<div class="fila" style="gap:12px"><span class=${'logo redondo ' + TONOS[i % 5]} style="width:52px;height:52px;font-size:18px">${iniciales(f.n || p0.n)}</span>
        <span class="crece" style="display:flex;flex-direction:column;gap:2px;min-width:0"><b class="corta" style="font-size:17px">${f.n || p0.n}</b><span class="sub">${(S.roles.find(r => r.id === p0.rol) || {}).n || ''}${p0.inactivo ? ' · desactivado' : ''}</span></span></div>`}
      <label class="campo"><span>Nombre</span><input type="text" value=${f.n} placeholder="Ej.: Luisa Pino" autocomplete="off" onInput=${e => pon({ n: e.target.value })} /></label>
      ${esDueno || !admin ? esDueno && html`<div class="tarjeta fila" style="background:var(--accent-soft);box-shadow:none"><${Icono} n="escudo" t=${18} c="var(--accent)" /><span class="sub" style="color:var(--ink)">Es el dueño: siempre puede todo y nadie le puede quitar permisos.</span></div>`
        : html`<div class="campo"><span>Rol</span><${Chips} opciones=${rolesPosibles.map(r => ({ v: r.id, n: r.n }))} valor=${f.rol} onCambio=${v => pon({ rol: v })} /></div>
          ${rolActual && html`<span class="sub faint entra" key=${f.rol}>Puede: ${Object.keys(rolActual.p).filter(k => rolActual.p[k]).length} de ${PERMISOS.length} permisos. Los cambias en «Qué puede hacer cada rol».</span>`}`}
      ${p0 ? html`<div class="tarjeta fila" style="background:var(--fill2);box-shadow:none;gap:12px">
          <span class="simb-c" style=${{ '--c': p0.pin ? 'var(--in)' : 'var(--amber)', width: '36px', height: '36px' }}><${Icono} n="candado" t=${17} /></span>
          <span class="crece" style="display:flex;flex-direction:column;gap:2px"><b style="font-size:14px">${p0.pin ? 'Entra con PIN' : 'Sin PIN'}</b><span class="sub">${p0.pin ? '••••' : 'Cualquiera puede entrar con este perfil'}</span></span>
          <button type="button" class="btn2 chico acento toca" onClick=${() => c(() => abrir('pin', { pid: p0.id, volver: true }))}>${p0.pin ? 'Cambiar PIN' : 'Poner PIN'}</button>
        </div>`
        : html`<div class="rejilla-2" style="gap:10px">
          <label class="campo"><span>PIN de 4 números</span><input class="num" type="password" inputmode="numeric" maxlength="4" autocomplete="new-password" value=${f.pin} placeholder="Sin PIN" onInput=${e => pon({ pin: e.target.value.replace(/\D/g, '').slice(0, 4) })} /></label>
          <label class="campo"><span>Repite el PIN</span><input class="num" type="password" inputmode="numeric" maxlength="4" autocomplete="new-password" value=${f.pin2} placeholder="····" onInput=${e => pon({ pin2: e.target.value.replace(/\D/g, '').slice(0, 4) })} /></label>
        </div>`}
      ${E && !soloDatos && html`<div class="campo"><span>Trabaja en</span><div class="chips">
        <button type="button" class=${'chip toca' + (!f.sucs.length ? ' on' : '')} onClick=${() => pon({ sucs: [] })}>Todos los locales</button>
        ${S.negocio.sucursales.map(s => { const on = f.sucs.includes(s); return html`<button type="button" class=${'chip toca' + (on ? ' on' : '')} onClick=${() => pon({ sucs: on ? f.sucs.filter(x => x !== s) : f.sucs.concat([s]) })}>${s}</button>`; })}
      </div></div>`}
      ${p0 && !soloDatos && !soyYo && html`<${Interruptor} on=${!f.inactivo} onCambio=${v => pon({ inactivo: !v })} titulo="Perfil activo" sub="Si lo apagas, ya no puede entrar. Lo puedes volver a encender." />`}`,
    pie: html`<button type="button" class="btn toca" onClick=${() => guardar(c)}>${p0 ? 'Guardar' : 'Crear perfil'}</button>${puedeBorrar && html`<button type="button" class="btn2 rojo toca" style="min-height:50px;border-radius:25px" onClick=${() => borrar(c)}><${Icono} n="basura" t=${16} />Eliminar perfil</button>`}`
  })} />`;
}

// ---------- cambiar el PIN ----------
// El propio PIN se cambia sabiendo el actual; quien maneja el equipo puede poner uno nuevo a otros sin saberlo.
function Pin({ d, cerrar }) {
  const { S, yo, puede, abrir } = useApp();
  const p0 = S.perfiles.find(p => p.id === d.pid); if (!p0) return null;
  const soyYo = p0.id === yo.id, pideActual = soyYo && !!p0.pin;
  const [f, setF] = useState({ actual: '', nuevo: '', otra: '' });
  const [mal, setMal] = useState(0);
  const pon = o => setF(x => Object.assign({}, x, o));
  const solo4 = v => v.replace(/\D/g, '').slice(0, 4);
  const volver = () => { if (d.volver) abrir('perfil', { pid: p0.id }); };
  const guardar = c => {
    if (pideActual && f.actual !== p0.pin) { setMal(Date.now()); avisar('El PIN actual no es ese'); return; }
    if (!/^\d{4}$/.test(f.nuevo)) { avisar('El PIN nuevo son 4 números'); return; }
    if (f.nuevo !== f.otra) { setMal(Date.now()); avisar('Los dos PIN nuevos no son iguales'); return; }
    cambiarPin(p0.id, f.nuevo); c(() => { avisar('PIN ' + (p0.pin ? 'cambiado' : 'puesto') + (soyYo ? '' : ' a ' + p0.n.split(' ')[0])); volver(); });
  };
  const quitar = c => {
    if (pideActual && f.actual !== p0.pin) { setMal(Date.now()); avisar('Escribe primero el PIN actual'); return; }
    cambiarPin(p0.id, ''); c(() => { avisar('PIN quitado'); volver(); });
  };
  const Campo = (k, t, ph) => html`<label class="campo"><span>${t}</span><input class="num pin-campo" type="password" inputmode="numeric" maxlength="4" autocomplete=${k === 'actual' ? 'current-password' : 'new-password'} value=${f[k]} placeholder=${ph} onInput=${e => pon({ [k]: solo4(e.target.value) })} /></label>`;
  return html`<${Hoja} titulo=${(p0.pin ? 'Cambiar PIN' : 'Poner PIN') + (soyYo ? '' : ' de ' + p0.n.split(' ')[0])} onCerrar=${cerrar} contenido=${c => ({
    cuerpo: html`<span class="sub" style="line-height:1.45;margin-top:-4px">${soyYo ? 'Con el PIN nadie más puede entrar con tu perfil.' : 'Dale el PIN nuevo a ' + p0.n.split(' ')[0] + '. Puede cambiarlo después desde su perfil.'}</span>
      <div class=${'pila' + (mal ? ' sacude' : '')} key=${mal} style="gap:12px">
        ${pideActual && Campo('actual', 'PIN actual', '····')}
        <div class="rejilla-2" style="gap:10px">${Campo('nuevo', 'PIN nuevo', '····')}${Campo('otra', 'Repítelo', '····')}</div>
      </div>
      ${f.nuevo.length === 4 && f.otra.length === 4 && html`<span class=${'sub entra ' + (f.nuevo === f.otra ? 'in' : 'out')} style="font-weight:600">${f.nuevo === f.otra ? '✓ Los dos coinciden' : 'No coinciden'}</span>`}`,
    pie: html`<button type="button" class="btn toca" onClick=${() => guardar(c)}>Guardar PIN</button>${p0.pin && html`<button type="button" class="btn2 rojo toca" style="min-height:50px;border-radius:25px" onClick=${() => quitar(c)}>Quitar el PIN</button>`}`
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
  const [f, setF] = useState({ nombre: n.nombre, razon: n.razon || '', fiscal: n.fiscal || '', tipo: n.tipo, escala: n.escala, pais: n.pais, logo: n.logo || '', tel: n.tel || '', dir: n.dir || '' });
  const [latido, setLatido] = useState(false);
  // Logo: se elige una imagen del teléfono o la computadora y se achica para guardarla.
  const elegirLogo = async e => {
    const a = e.target.files && e.target.files[0]; e.target.value = '';
    if (!a) return;
    if (!/^image\//.test(a.type)) { avisar('Elige una imagen (PNG, JPG o similar)'); return; }
    try { pon({ logo: await achicarImagen(a, 256) }); setLatido(true); setTimeout(() => setLatido(false), 380); } catch (er) { avisar('No pude abrir esa imagen'); }
  };
  const pon = o => setF(x => Object.assign({}, x, o));
  const P2 = pais(f.pais), T2 = tipo(f.tipo), otroPais = f.pais !== n.pais;
  const guardar = c => {
    if (!f.nombre.trim()) { avisar('Escribe el nombre'); return; }
    const cambios = { nombre: f.nombre.trim(), razon: f.razon.trim(), fiscal: f.fiscal.trim(), tipo: f.tipo, escala: f.escala, pais: f.pais, logo: f.logo, tel: f.tel.trim(), dir: f.dir.trim() };
    // Otro país: sus formas de pago e impuesto. La tasa se vuelve a leer.
    if (otroPais) Object.assign(cambios, { pays: P2.pays.slice(), taxOn: P2.tax[1] > 0 });
    const que = 'Cambió los datos del negocio' + (otroPais ? ' (país: ' + P.n + ' → ' + P2.n + ')' : '') + (f.tipo !== n.tipo ? ' (tipo: ' + T.n + ' → ' + T2.n + ')' : '') + (f.logo !== (n.logo || '') ? (f.logo ? ' (logo nuevo)' : ' (quitó el logo)') : '');
    cambiarNegocio(cambios, que);
    if (otroPais) guardarTasa({ modo: 'auto', valor: 0, fecha: '', fuente: 'oficial' });
    c(() => avisar('Datos guardados'));
  };
  return html`<${Hoja} titulo=${n.escala === 'empresa' ? 'Datos de la empresa' : 'Datos del negocio'} onCerrar=${cerrar} contenido=${c => ({
    cuerpo: html`
      <div class="logo-grande">
        <label class="toca" style="cursor:pointer" aria-label="Elegir el logo"><span class=${'logo-envuelto' + (latido ? ' cambio' : '')}><${MarcaNegocio} n=${{ nombre: f.nombre || n.nombre, logo: f.logo }} t=${72} /></span><input type="file" accept="image/*" hidden onChange=${elegirLogo} /></label>
        <span class="crece" style="display:flex;flex-direction:column;gap:8px;min-width:0">
          <span class="sub" style="line-height:1.4">${f.logo ? 'Sale arriba en la app y en tus recibos.' : 'Pon el logo de tu ' + (f.escala === 'empresa' ? 'empresa' : 'negocio') + ': sale arriba en la app y en tus recibos.'}</span>
          <span class="chips"><label class="btn2 chico acento toca" style="cursor:pointer"><${Icono} n="subir" t=${14} />${f.logo ? 'Cambiar logo' : 'Subir logo'}<input type="file" accept="image/*" hidden onChange=${elegirLogo} /></label>${f.logo && html`<button type="button" class="btn2 chico toca" onClick=${() => pon({ logo: '' })}>Quitar</button>`}</span>
        </span>
      </div>
      <label class="campo"><span>Nombre</span><input type="text" value=${f.nombre} autocomplete="organization" onInput=${e => pon({ nombre: e.target.value })} /></label>
      <div class="rejilla-2" style="gap:10px">
        <label class="campo"><span>Teléfono (opcional)</span><input type="tel" inputmode="tel" value=${f.tel} placeholder="0414-000-0000" autocomplete="tel" onInput=${e => pon({ tel: e.target.value })} /></label>
        <label class="campo"><span>Dirección (opcional)</span><input type="text" value=${f.dir} placeholder="Av. Bolívar 12" autocomplete="street-address" onInput=${e => pon({ dir: e.target.value })} /></label>
      </div>
      <span class="sub faint" style="margin-top:-6px;font-size:12px">Salen en tus recibos y en las órdenes impresas o en PDF.</span>
      <div class="campo"><span>Tamaño</span><div class="segmento" style="width:100%">${[['negocio', 'Negocio'], ['empresa', 'Empresa']].map(o => html`<button type="button" style="flex:1" class=${f.escala === o[0] ? 'on' : ''} onClick=${() => pon({ escala: o[0] })}>${o[1]}</button>`)}</div></div>
      <div class="rejilla-2" style="gap:10px">
        <label class="campo"><span>Razón social${f.escala === 'empresa' ? '' : ' (opcional)'}</span><input type="text" value=${f.razon} placeholder=${f.nombre + (P2.suf ? ' ' + P2.suf : '')} onInput=${e => pon({ razon: e.target.value })} /></label>
        <label class="campo"><span>${P2.fiscal[0]}${f.escala === 'empresa' ? '' : ' (opcional)'}</span><input type="text" value=${f.fiscal} placeholder=${P2.fiscal[1] || 'Número fiscal'} onInput=${e => pon({ fiscal: e.target.value })} /></label>
      </div>
      <div class="campo"><span>Tipo</span><${Chips} opciones=${TIPOS.map(t => ({ v: t.id, n: html`<span class="simb"><${Icono} n=${t.id} t=${13} g=${2.2} /></span>${t.n}` }))} valor=${f.tipo} onCambio=${v => pon({ tipo: v })} /></div>
      ${T2.inv !== T.inv && html`<span class="sub entra" style="line-height:1.45">${T2.inv ? 'Ahora vas a llevar inventario: ponle existencia a tus productos en Inventario.' : 'Ahora vendes servicios: se deja de contar el inventario.'}</span>`}
      <label class="campo"><span class="fila" style="gap:8px"><${Bandera} id=${f.pais} t=${18} />País y moneda</span><select value=${f.pais} onChange=${e => pon({ pais: e.target.value })}>${PAISES.map(x => html`<option value=${x.id}>${x.n} · ${x.cur}</option>`)}</select></label>
      ${otroPais && html`<div class="tarjeta fila entra" style="background:var(--amber-soft);box-shadow:none;gap:10px;align-items:flex-start"><${Icono} n="alerta" t=${18} c="var(--amber)" /><span class="sub" style="color:var(--ink);line-height:1.45"><b>Ojo:</b> los precios y montos guardados no se convierten. Si cambias de ${P.cur} a ${P2.cur}, el número se queda igual. Las formas de pago pasan a las de ${P2.n}.</span></div>`}`,
    pie: html`<button type="button" class="btn toca" onClick=${() => guardar(c)}>Guardar</button>`
  })} />`;
}

// ---------- tasas del dólar (Venezuela y Argentina) ----------
function Tasa({ d, cerrar }) {
  const { S, P, D, enLinea, puede, abrir } = useApp();
  // Todos pueden ver las tasas; solo las cuentas habilitadas («Cambiar las tasas») pueden cambiarlas.
  const editar = puede('tasas');
  const resumenTasas = infoTasas(S, P, D);
  const ve = P.id === 'VE', mon = ve ? 'Bs ' : P.s + ' ', extras = TASAS_EXTRA[P.id] || [];
  // Solo Venezuela y Argentina tienen de dónde leer la tasa sola; en los demás países se escribe a mano.
  const conFuente = P.id === 'VE' || P.id === 'AR';
  const [modo, setModo] = useState(conFuente ? S.tasa.modo || 'auto' : 'manual');
  const [fuente, setFuente] = useState(S.tasa.fuente || 'oficial');
  const [valor, setValor] = useState(S.tasa.valor ? String(S.tasa.valor).replace('.', ',') : '');
  const [otras, setOtras] = useState(() => extras.reduce((o, x) => (o[x.k] = S.tasas[x.k] && S.tasas[x.k].valor ? String(S.tasas[x.k].valor).replace('.', ',') : '', o), {}));
  const [porPago, setPorPago] = useState(Object.assign({}, S.negocio.tasaPago));
  const [euro, setEuro] = useState(S.tasas.euro && S.tasas.euro.valor ? String(S.tasas.euro.valor).replace('.', ',') : '');
  const [leyendo, setLeyendo] = useState('');
  const nf = new Intl.NumberFormat(P.loc, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const t = numero(valor);
  const leerYa = async (k, fu) => {
    if (!enLinea) { avisar('Sin internet: escríbela a mano'); return; }
    setLeyendo(k); const v = await leerTasa(P.id, k === 'principal' ? (fu || fuente) : k); setLeyendo('');
    if (!v) { avisar('No se pudo leer. Prueba más tarde o escríbela a mano'); return; }
    if (k === 'principal') setValor(String(v).replace('.', ',')); else if (k === 'euro') setEuro(String(v).replace('.', ',')); else setOtras(o => Object.assign({}, o, { [k]: String(v).replace('.', ',') }));
    avisar('Leída: ' + mon + nf.format(v));
  };
  const guardar = c => {
    if (modo === 'manual' && !t) { avisar('Escribe la tasa'); return; }
    const leida = modo === 'auto' && t && (fuente === S.tasa.fuente || t !== S.tasa.valor);
    guardarTasa(modo === 'manual' || leida ? { modo, fuente, valor: t } : { modo, fuente, fecha: '' }, D.bonito);
    extras.forEach(x => { const v = numero(otras[x.k]); if (v && v !== (S.tasas[x.k] || {}).valor) guardarTasaExtra(x.k, { valor: v, modo: 'manual' }); });
    const ev = numero(euro); if (ev && ev !== (S.tasas.euro || {}).valor) guardarTasaExtra('euro', { valor: ev, modo: 'manual' });
    cambiarNegocio({ tasaPago: porPago });
    c(() => avisar('Tasas guardadas'));
  };
  // Leer de una vez todas las que tienen de dónde leerse.
  const leerTodas = async () => {
    if (!enLinea) { avisar('Sin internet: escríbelas a mano'); return; }
    setLeyendo('todas');
    const ks = ['principal'].concat(extras.filter(x => x.auto).map(x => x.k), S.negocio.euro ? ['euro'] : []);
    let n = 0;
    for (const k of ks) { const v = await leerTasa(P.id, k === 'principal' ? fuente : k); if (v) { n++; if (k === 'principal') setValor(String(v).replace('.', ',')); else if (k === 'euro') setEuro(String(v).replace('.', ',')); else setOtras(o => Object.assign({}, o, { [k]: String(v).replace('.', ',') })); } }
    setLeyendo(''); avisar(n ? n + (n === 1 ? ' tasa leída' : ' tasas leídas') + '. Toca Guardar' : 'No se pudo leer. Prueba más tarde o escríbelas a mano');
  };
  const ESTADO = { hoy: ['Leída hoy', 'var(--in-text)'], 'a mano': ['A mano', 'var(--accent-text)'], vieja: ['Sin actualizar', 'var(--amber-text)'], estimada: ['Estimada', 'var(--amber-text)'] };
  // Historial de la tasa principal: últimos 30 días.
  const hist = (S.historialTasas || []).filter(h => h.f === (S.tasa.fuente || 'oficial')).slice(-30);
  const cambio = hist.length > 1 ? (hist[hist.length - 1].v / hist[hist.length - 2].v - 1) * 100 : 0;
  const mes = hist.length > 1 ? (hist[hist.length - 1].v / hist[0].v - 1) * 100 : 0;
  return html`<${Hoja} titulo=${'Tasas de hoy'} onCerrar=${() => { cerrar(); if (d.volver) setTimeout(() => abrir('cobrar', d.volver), 0); }} contenido=${c => ({
    cuerpo: html`
      <div class="tasas-resumen">${resumenTasas.map((x, i) => html`<div class=${'tasa-tarjeta' + (i === 0 ? ' principal' : '')} key=${x.k}>
        <span class="sub">${x.n}</span>
        <b class="num">${mon + nf.format(x.v)}</b>
        <span class="fila" style="gap:6px;flex-wrap:wrap"><span class="num" style=${{ fontSize: '12px', fontWeight: 600, color: ESTADO[x.estado][1] }}>${ESTADO[x.estado][0]}</span>${x.cambio != null && Math.abs(x.cambio) >= 0.05 ? html`<span class="num" style=${{ fontSize: '12px', fontWeight: 600, color: x.cambio > 0 ? 'var(--amber-text)' : 'var(--in-text)' }}>${x.cambio > 0 ? '▲' : '▼'} ${Math.abs(x.cambio).toFixed(1).replace('.', ',')} %</span>` : null}</span>
      </div>`)}</div>
      ${editar && conFuente && html`<button type="button" class=${'btn2 acento toca' + (leyendo ? ' apagado' : '')} onClick=${leerTodas}><${Icono} n="descarga" t=${15} />${leyendo === 'todas' ? 'Leyendo…' : 'Actualizar todas de internet'}</button>`}
      ${!editar && html`<div class="tarjeta fila" style="background:var(--fill2);box-shadow:none;gap:10px"><${Icono} n="candado" t=${16} c="var(--muted)" /><span class="sub" style="line-height:1.45">Puedes verlas, pero cambiarlas solo lo hacen las cuentas habilitadas. Pídeselo al dueño.</span></div>`}
      ${hist.length > 2 && html`<div class="tarjeta" style="background:var(--fill2);box-shadow:none;padding:12px 14px">
        <div class="fila" style="margin-bottom:6px"><span class="sub crece">Últimos ${hist.length} días</span><span class="pildora" style=${{ background: cambio > 0.5 ? 'var(--amber-soft)' : 'var(--in-soft)', color: cambio > 0.5 ? 'var(--amber-text)' : 'var(--in-text)' }}>${cambio >= 0 ? '+' : ''}${cambio.toFixed(1).replace('.', ',')} % hoy · ${mes >= 0 ? '+' : ''}${mes.toFixed(1).replace('.', ',')} % en el mes</span></div>
        <${Linea} datos=${hist.map(h => ({ l: h.dia.slice(8) + '/' + h.dia.slice(5, 7), v: h.v, tip: mon + nf.format(h.v) }))} alto=${100} id="tasa" ajustar />
      </div>`}
      ${editar && html`<div class="pila" style="gap:14px">
      <span class="sub" style="font-weight:600;margin-top:4px">Cambiar</span>
      ${conFuente && html`<div class="segmento" style="width:100%">${[['auto', 'Automática'], ['manual', 'A mano']].map(o => html`<button type="button" style="flex:1" class=${modo === o[0] ? 'on' : ''} onClick=${() => setModo(o[0])}>${o[1]}</button>`)}</div>`}
      ${P.id === 'AR' && html`<div class="campo"><span>¿Qué dólar muestras?</span><${Chips} opciones=${FUENTES_AR} valor=${fuente} onCambio=${v => { setFuente(v); if (modo === 'auto') leerYa('principal', v); }} /></div>`}
      ${modo === 'manual' ? html`<label class="campo entra"><span>Tasa (${ve ? 'bolívares' : P.cur} por dólar)</span><input class="grande num" type="text" inputmode="decimal" value=${valor} placeholder="0" onInput=${e => setValor(e.target.value)} /></label>`
        : html`<button type="button" class=${'btn2 acento toca' + (leyendo === 'principal' ? ' apagado' : '')} onClick=${() => leerYa('principal')}>${leyendo === 'principal' ? 'Leyendo…' : 'Leer ahora'}</button>`}
      ${S.negocio.euro && html`<div class="campo"><span>Euro</span>
        <div class="fila" style="gap:8px"><span class="crece sub num">${numero(euro) ? '1 € = ' + mon + nf.format(numero(euro)) + (ve ? ' · 1 € = $ ' + nf.format(numero(euro) / (t || D.tasa)) : ' · 1 € = US$ ' + nf.format(numero(euro) / (t || D.tasa))) : 'Sin leer: se estima con el dólar'}</span>
          <div class="pago-monto" style="width:150px;min-height:44px"><span class="pago-moneda" style="display:grid;place-items:center">${mon.trim()}</span><input class="num" type="text" inputmode="decimal" autocomplete="off" placeholder="—" value=${euro} aria-label="Tasa del euro" onInput=${e => setEuro(e.target.value)} /></div>
          ${conFuente ? html`<button type="button" class="icono-btn chico toca" aria-label="Leer tasa del euro" title="Leer de internet" onClick=${() => leerYa('euro')}><${Icono} n="descarga" t=${14} /></button>` : html`<span style="width:36px"></span>`}</div></div>`}
      ${extras.length > 0 && html`<div class="campo"><span>Otras tasas que usas</span>
        <div class="pila" style="gap:8px">${extras.map(x => html`<div class="fila" style="gap:8px"><span class="crece" style="font-size:14px;font-weight:600">${x.n}</span>
          <div class="pago-monto" style="width:150px;min-height:44px"><span class="pago-moneda" style="display:grid;place-items:center">${mon.trim()}</span><input class="num" type="text" inputmode="decimal" autocomplete="off" placeholder="—" value=${otras[x.k]} aria-label=${'Tasa ' + x.n} onInput=${e => setOtras(Object.assign({}, otras, { [x.k]: e.target.value }))} /></div>
          ${x.auto ? html`<button type="button" class="icono-btn chico toca" aria-label=${'Leer tasa ' + x.n} title="Leer de internet" onClick=${() => leerYa(x.k)}><${Icono} n="descarga" t=${14} /></button>` : html`<span style="width:36px"></span>`}</div>`)}</div></div>
        <div class="campo"><span>¿Con qué tasa cobras cada forma de pago?</span>
          <div class="pila" style="gap:6px">${S.negocio.pays.map(m => html`<div class="pago-linea" style="grid-template-columns:minmax(0,1fr) minmax(0,1fr)">
            <span class="fila" style="gap:8px;font-size:14px;font-weight:600;min-width:0"><span class="simb"><${Icono} n=${simbolo(m)} t=${13} g=${2.2} /></span><span class="corta">${m}</span></span>
            <label class="pago-forma"><select style="padding-left:14px" value=${porPago[m] || ''} aria-label=${'Tasa para ' + m} onChange=${e => setPorPago(Object.assign({}, porPago, { [m]: e.target.value || undefined }))}>${[{ k: '', n: ve ? 'Tasa BCV' : 'Principal' }].concat(extras).map(x => html`<option value=${x.k}>${x.n}</option>`)}</select></label></div>`)}</div>
          <span class="sub faint" style="line-height:1.4">Al cobrar en ${ve ? 'bolívares' : 'dólares'} con esa forma de pago, Orbe usa su tasa.</span></div>`}
      </div>`}`,
    pie: editar ? html`<button type="button" class="btn toca" onClick=${() => guardar(c)}>Guardar</button>` : html`<button type="button" class="btn2 toca" style="min-height:50px;border-radius:25px" onClick=${() => c()}>Listo</button>`
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
  const [rev, setRev] = useState(null);
  const malo = rev && (rev.ventas || rev.cierres || rev.registro);
  return html`<${Hoja} titulo="Registro de cambios" onCerrar=${cerrar} contenido=${c => ({
    cuerpo: html`<span class="sub" style="margin-top:-6px">Anulaciones, devoluciones, borrados y cambios del negocio: quién y cuándo.</span>
      <div class="tarjeta fila" style=${{ background: rev ? (malo ? 'var(--out-soft)' : 'var(--in-soft)') : 'var(--fill2)', boxShadow: 'none', gap: '10px' }}>
        <${Icono} n=${rev && !malo ? 'check' : 'escudo'} t=${18} c=${rev ? (malo ? 'var(--out)' : 'var(--in)') : 'var(--accent)'} />
        <span class="sub crece" style="color:var(--ink);line-height:1.4">${!rev ? 'Cada venta, cierre y cambio queda firmado y encadenado al anterior. Si alguien lo altera, se nota.' : malo ? 'Algo se alteró: ' + (rev.ventas ? 'la venta #' + rev.ventas.x.n : rev.cierres ? 'el cierre Z #' + rev.cierres.x.n : 'un cambio del registro') + ' no coincide con su firma.' : 'Todo en orden: ' + rev.n + ' registros revisados, ninguno alterado.'}</span>
        <button type="button" class="btn2 chico acento toca" onClick=${() => setRev(revisarIntegridad())}>Revisar</button></div>
      <div class="lista">${lista.length ? lista.slice(0, 100).map((x, i) => html`<div class="item entra" key=${x.t + '' + i} style=${{ '--i': Math.min(i, 12) }}>
        <span class=${'logo redondo ' + TONOS[Math.max(0, S.perfiles.findIndex(p => p.id === x.por)) % 5]} style="width:32px;height:32px;font-size:12px">${iniciales(quien(x.por))}</span>
        <span class="crece" style="display:flex;flex-direction:column;gap:1px"><span style="font-size:14px">${x.que}</span><span class="sub faint">${quien(x.por).split(' ')[0]} · ${fechaCorta(x.t)} ${hora(x.t)}</span></span></div>`) : html`<p class="vacio">Todavía no hay cambios anotados.</p>`}</div>`,
    pie: null
  })} />`;
}

// ---------- remarcar precios en bloque ----------
function Remarcar({ d, cerrar }) {
  const { S, D, T } = useApp();
  const todos = listaProductos().filter(p => !(p.usd > 0));
  const [pct, setPct] = useState(10);
  const [otro, setOtro] = useState('');
  const [alcance, setAlcance] = useState(d.alcance || 'todos');
  const [redondear, setRedondear] = useState(true);
  const subieron = todos.filter(p => p.cAntes && p.c > p.cAntes), pocos = todos.filter(p => p.p > 0 && (p.p - p.c) / p.p < 0.2);
  const lista = alcance === 'subieron' ? subieron : alcance === 'margen' ? pocos : todos;
  const x = pct === 'otro' ? numero(otro) : pct;
  const nuevo = p => redondear ? D.bonito(p.p * (1 + x / 100)) : D.redondo(p.p * (1 + x / 100));
  return html`<${Hoja} titulo="Remarcar precios" onCerrar=${cerrar} contenido=${c => ({
    cuerpo: html`<span class="sub" style="margin-top:-6px;line-height:1.45">Sube (o baja) los precios de golpe. Los que están atados al dólar se actualizan solos y no entran aquí.</span>
      <div class="campo"><span>¿Cuánto?</span><${Chips} opciones=${[5, 10, 15, 20, 30].map(v => ({ v, n: '+' + v + ' %' })).concat([{ v: 'otro', n: 'Otro' }])} valor=${pct} onCambio=${setPct} /></div>
      ${pct === 'otro' && html`<label class="campo entra"><span>Porcentaje (usa − para bajar)</span><input class="num" type="text" inputmode="decimal" value=${otro} placeholder="Ej.: 12 o -5" onInput=${e => setOtro(e.target.value)} /></label>`}
      <div class="campo"><span>¿Cuáles?</span><${Chips} opciones=${[{ v: 'todos', n: 'Todos (' + todos.length + ')' }, { v: 'subieron', n: 'Les subió el costo (' + subieron.length + ')' }, { v: 'margen', n: 'Ganan menos de 20 % (' + pocos.length + ')' }]} valor=${alcance} onCambio=${setAlcance} chico /></div>
      <${Interruptor} on=${redondear} onCambio=${setRedondear} titulo="Redondear" sub="A números fáciles de cobrar" />
      <div class="tarjeta" style="background:var(--fill2);box-shadow:none;padding:4px 14px"><div class="lista">${lista.slice(0, 8).map(p => html`<div class="item"><span class="crece corta" style="font-size:14px">${p.n}</span><span class="sub num" style="text-decoration:line-through">${D.m(p.p)}</span><b class="num">${D.m(x ? nuevo(p) : p.p)}</b></div>`)}${lista.length > 8 ? html`<p class="sub" style="padding:8px 0">y ${lista.length - 8} más…</p>` : null}${lista.length ? null : html`<p class="vacio">No hay productos con ese filtro.</p>`}</div></div>`,
    pie: html`<button type="button" class=${'btn toca' + (x && lista.length ? '' : ' apagado')} onClick=${() => { if (!x || !lista.length) return; remarcar(lista.map(p => p.id), x, redondear ? D.bonito : D.redondo); c(() => avisar(lista.length + ' precios remarcados ' + (x > 0 ? '+' : '') + x + ' %')); }}>Remarcar ${lista.length} ${T.inv ? 'productos' : 'servicios'}</button>`
  })} />`;
}

// ---------- conciliar pagos con el banco ----------
function Conciliar({ d, cerrar }) {
  const { S, D, P } = useApp();
  const archivo = useRef(null);
  const [dias, setDias] = useState(7);
  const [encontrados, setEncontrados] = useState(null);
  const desde = Date.now() - dias * 86400000;
  const pagos = [];
  vigentes().filter(v => v.t >= desde).forEach(v => v.pagos.forEach((p, k) => { if (esElectronico(p.m) && p.v > 0) pagos.push({ clave: v.id + ':' + k, v, p }); }));
  const conRef = pagos.filter(x => x.p.ref), sinRef = pagos.filter(x => !x.p.ref);
  // Busca cada referencia en el texto del estado de cuenta (CSV, TXT o lo que exporte el banco).
  const leer = e => {
    const f = e.target.files && e.target.files[0]; if (!f) return;
    f.text().then(txt => {
      const numeros = (txt.match(/\d{4,}/g) || []);
      const ok = conRef.filter(x => !x.p.ok && numeros.some(n => n.endsWith(x.p.ref) || x.p.ref.endsWith(n.slice(-6)))).map(x => x.clave);
      setEncontrados(ok);
      if (ok.length) verificarPagos(ok);
      avisar(ok.length ? ok.length + ' pagos verificados' : 'Ninguna referencia coincidió');
    });
    e.target.value = '';
  };
  const Fila = x => html`<div class="item"><span class="crece" style="display:flex;flex-direction:column;gap:1px;min-width:0"><b class="corta" style="font-size:14px;font-weight:600">#${x.v.n} · ${x.p.m}${x.p.ref ? ' · Ref ' + x.p.ref : ''}</b><span class="sub faint">${fechaCorta(x.v.t)} ${hora(x.v.t)}</span></span>
    <b class="num">${D.m(x.p.v)}</b>${x.p.ok ? html`<span class="pildora t-ver">✓</span>` : x.p.ref ? html`<span class="pildora t-amb">Por ver</span>` : html`<span class="pildora">Sin ref</span>`}</div>`;
  return html`<${Hoja} titulo="Conciliar con el banco" onCerrar=${cerrar} contenido=${c => ({
    cuerpo: html`<span class="sub" style="margin-top:-6px;line-height:1.45">Descarga el estado de cuenta de tu banco (CSV o TXT) y súbelo aquí. Orbe busca las referencias de ${S.negocio.pays.filter(esElectronico).slice(0, 3).join(', ')} y marca los pagos que llegaron.</span>
      <${Chips} opciones=${[{ v: 1, n: 'Hoy' }, { v: 7, n: '7 días' }, { v: 30, n: '30 días' }]} valor=${dias} onCambio=${setDias} chico />
      <div class="rejilla-3">${[['Verificados', conRef.filter(x => x.p.ok).length, 'var(--in)'], ['Por verificar', conRef.filter(x => !x.p.ok).length, 'var(--amber)'], ['Sin referencia', sinRef.length, 'var(--muted)']].map(k => html`<div class="tarjeta cifra" style="background:var(--fill2);box-shadow:none;padding:12px"><span class="sub" style="font-size:11px">${k[0]}</span><b class="num" style=${{ color: k[2], fontSize: '20px' }}>${k[1]}</b></div>`)}</div>
      ${!S.negocio.pedirRef && html`<span class="sub" style="color:var(--amber-text)">Activa «Pedir referencia» en Formas de pago para que el cajero la anote al cobrar.</span>`}
      <div class="lista">${conRef.filter(x => !x.p.ok).concat(conRef.filter(x => x.p.ok)).slice(0, 30).map(Fila)}${conRef.length ? null : html`<p class="vacio">No hay pagos con referencia en estos días.</p>`}</div>
      <input ref=${archivo} type="file" accept=".csv,.txt,text/csv,text/plain" hidden onChange=${leer} />`,
    pie: html`<button type="button" class="btn toca" onClick=${() => archivo.current && archivo.current.click()}><${Icono} n="subir" t=${18} />Subir estado de cuenta</button>`
  })} />`;
}

// ---------- quitar ceros a la moneda (redenominación) ----------
function Ceros({ d, cerrar }) {
  const { S, P, D } = useApp();
  const [n, setN] = useState(3);
  const ve = P.id === 'VE', f = Math.pow(10, n), ej = ve ? D.tasa : (listaProductos()[0] || { p: 1000 }).p;
  return html`<${Hoja} titulo="Quitar ceros a la moneda" onCerrar=${cerrar} contenido=${c => ({
    cuerpo: html`<p style="margin:0;line-height:1.5">Cuando el gobierno le quita ceros a la moneda, Orbe convierte todo de una vez: ${ve ? 'las tasas guardadas (tus precios están en dólares y no cambian)' : 'precios, costos, ventas, deudas y gastos'}. El historial se mantiene.</p>
      <div class="campo"><span>¿Cuántos ceros?</span><${Chips} opciones=${[3, 5, 6].map(v => ({ v, n: v + ' ceros' }))} valor=${n} onCambio=${setN} /></div>
      <div class="tarjeta fila" style="background:var(--fill2);box-shadow:none;justify-content:space-between"><span class="sub">${ve ? 'Tasa' : 'Ejemplo'}</span><span class="num"><span style="text-decoration:line-through;opacity:.6">${ej.toLocaleString(P.loc)}</span> → <b>${(Math.round(ej / f * 100) / 100).toLocaleString(P.loc)}</b></span></div>
      <span class="sub">Antes se guarda una copia, por si hay que volver atrás.</span>`,
    pie: html`<button type="button" class="btn toca" style="background:var(--out)" onClick=${() => c(() => quitarCeros(n).then(() => avisar('Listo: se quitaron ' + n + ' ceros')))}>Quitar ${n} ceros</button>`
  })} />`;
}

// ---------- cierres Z ----------
function Cierres({ d, cerrar }) {
  const { S, D, abrir } = useApp();
  const lista = S.cierres.slice().reverse();
  return html`<${Hoja} titulo="Cierres del día" onCerrar=${cerrar} contenido=${c => ({
    cuerpo: html`<span class="sub" style="margin-top:-6px">Cada cierre Z queda numerado y firmado. Toca uno para verlo o imprimirlo.</span>
      <div class="lista">${lista.length ? lista.map((z, i) => html`<button type="button" class="item toca entra" key=${z.id} style=${{ '--i': Math.min(i, 12), color: 'var(--ink)' }} onClick=${() => c(() => abrir('cierreZ', { id: z.id }))}>
        <span class="simb-c" style="--c:var(--c1);width:34px;height:34px"><${Icono} n="candado" t=${15} /></span>
        <span class="crece" style="display:flex;flex-direction:column;gap:1px"><b style="font-size:14px;font-weight:600">Cierre Z #${z.n || S.cierres.indexOf(z) + 1}</b><span class="sub faint">${fechaCorta(z.t)} ${hora(z.t)}${z.resumen && z.resumen.dif ? ' · ' + (z.resumen.dif < 0 ? 'faltaron ' : 'sobraron ') + D.m(Math.abs(z.resumen.dif)) : ' · cuadró'}</span></span>
        <b class="num">${D.m(z.resumen ? z.resumen.total : 0)}</b></button>`) : html`<p class="vacio">Todavía no hay cierres.</p>`}</div>`,
    pie: null
  })} />`;
}
function CierreZ({ d, cerrar }) {
  const { S, D, P, tel } = useApp();
  const z = S.cierres.find(x => x.id === d.id);
  if (!z) return null;
  const quien = (S.perfiles.find(p => p.id === z.por) || {}).n;
  const pp = (z.resumen && z.resumen.porPago) || {};
  const linea = (a, b, fuerte) => html`<span class="fila" style=${{ justifyContent: 'space-between', gap: '8px', fontWeight: fuerte ? 700 : 400, color: fuerte ? 'inherit' : '#625f7d' }}><span>${a}</span><span>${b}</span></span>`;
  return html`<${Hoja} titulo=${'Cierre Z #' + (z.n || S.cierres.indexOf(z) + 1)} onCerrar=${cerrar} contenido=${c => ({
    cuerpo: html`<div style="border-radius:16px;background:#f7f6fc;color:#1a1733;padding:16px;display:flex;flex-direction:column;gap:7px;font-size:13px;font-family:ui-monospace,Menlo,Consolas,monospace">
      ${S.negocio.logo && html`<img src=${S.negocio.logo} alt="" style="display:block;margin:0 auto 2px;max-width:96px;max-height:56px;object-fit:contain" />`}
      <b style="text-align:center;font-size:14px">${S.negocio.nombre}</b>
      ${S.negocio.fiscal && html`<span style="text-align:center;color:#625f7d">${S.negocio.razon || ''} · ${P.fiscal[0]} ${S.negocio.fiscal}</span>`}
      <span style="text-align:center;color:#625f7d">CIERRE Z #${z.n || S.cierres.indexOf(z) + 1} · ${fechaCorta(z.t)} ${hora(z.t)}${quien ? ' · ' + quien : ''}</span>
      <span style="border-top:1px dashed #c9c6e0"></span>
      ${z.desde ? linea('Ventas', '#' + z.desde + ' a #' + z.hasta) : null}
      ${z.anuladas ? linea('Anuladas', String(z.anuladas)) : null}
      ${Object.keys(pp).map(k => linea(k, D.m(pp[k])))}
      <span style="border-top:1px dashed #c9c6e0"></span>
      ${z.impuestos ? linea(P.tax[0] + ' cobrado', D.m(z.impuestos)) : null}
      ${z.igtf ? linea('IGTF', D.m(z.igtf)) : null}
      ${linea('TOTAL', D.m(z.resumen ? z.resumen.total : 0), true)}
      ${z.resumen && z.resumen.dif ? linea(z.resumen.dif < 0 ? 'Faltante en caja' : 'Sobrante en caja', D.m(Math.abs(z.resumen.dif))) : linea('Caja', 'cuadra')}
      ${(() => { const cj = (z.resumen && z.resumen.caja) || {}, suma = k => Object.keys(cj).reduce((a, m) => a + (cj[m][k] || 0), 0);
        const filas = [['Fondo inicial', suma('fondo')], ['Ingresos de efectivo', suma('ingresos')], ['Retiros de efectivo', -suma('retiros')], ['Gastos pagados en efectivo', -suma('gastos')]].filter(x => Math.abs(x[1]) > 0.004);
        return filas.length ? html`<span style="border-top:1px dashed #c9c6e0"></span>${filas.map(x => linea(x[0], D.m(x[1])))}` : null; })()}
      ${((z.resumen && z.resumen.turnos) || []).map(t => linea('Turno ' + t.n + ' · ' + ((S.perfiles.find(p => p.id === t.por) || {}).n || '').split(' ')[0] + ' ' + hora(t.desde) + '–' + hora(t.hasta), Math.abs(t.dif) < 0.005 ? 'cuadró' : (t.dif < 0 ? 'faltó ' : 'sobró ') + D.m(Math.abs(t.dif))))}
      <span style="border-top:1px dashed #c9c6e0"></span>
      <span style="color:#8a87a6;font-size:11px;word-break:break-all">Firma ${(z.h || '').slice(0, 32)}</span>
    </div>`,
    pie: html`<button type="button" class="btn toca" onClick=${() => imprimir(lineasZ(z, { S, P, D }), { logo: S.negocio.logo }).catch(() => avisar('No se pudo imprimir: revisa la impresora'))}><${Icono} n="doc" t=${16} />Imprimir</button>${Pie2('Listo', () => c())}`
  })} />`;
}
