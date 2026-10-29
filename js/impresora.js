// Impresora de tickets (58 u 80 mm).
// Dos caminos: la impresión del sistema (AirPrint, Wi-Fi o USB: sirve en iPhone, Android y computadora)
// o una impresora Bluetooth directa con comandos ESC/POS (Chrome en Android y computadora), que además abre el cajón.
import { leer } from './datos.js';

// Caracteres por línea en letra normal.
export const ANCHO = { 58: 32, 80: 48 };
export const ajustesImpresora = () => Object.assign({ ancho: 80, modo: 'sistema', cajon: false, auto: false }, (leer().negocio || {}).impresora || {});
export const hayBluetooth = () => typeof navigator !== 'undefined' && !!navigator.bluetooth;

// ---------- armar el ticket como líneas de texto ----------
// Cada línea: { t: texto } o { a: izquierda, b: derecha }, con c (centrada), g (grande), n (negrita), sep (línea).
const cortar = (s, n) => String(s).length > n ? String(s).slice(0, n) : String(s);
export function aTexto(lineas, ancho) {
  const W = ANCHO[ancho] || 48, out = [];
  lineas.forEach(l => {
    if (l.sep) { out.push({ t: (l.sep === '=' ? '=' : '-').repeat(W) }); return; }
    const w = l.g ? Math.floor(W / 2) : W;
    if (l.b != null) {
      const b = String(l.b), a = String(l.a || ''); const libre = w - b.length - 1;
      if (a.length <= libre) out.push(Object.assign({}, l, { t: a + ' '.repeat(w - a.length - b.length) + b }));
      else { partir(a, w).forEach(x => out.push(Object.assign({}, l, { t: x, b: null }))); out.push(Object.assign({}, l, { t: ' '.repeat(Math.max(0, w - b.length)) + b })); }
      return;
    }
    partir(String(l.t || ''), w).forEach(x => out.push(Object.assign({}, l, { t: l.c ? centrar(x, w) : x })));
  });
  return out;
}
function partir(s, w) { const out = []; let linea = ''; s.split(' ').forEach(p => { while (p.length > w) { if (linea) { out.push(linea); linea = ''; } out.push(p.slice(0, w)); p = p.slice(w); } if ((linea + (linea ? ' ' : '') + p).length > w) { out.push(linea); linea = p; } else linea += (linea ? ' ' : '') + p; }); out.push(linea); return out; }
const centrar = (x, w) => { const e = Math.max(0, Math.floor((w - x.length) / 2)); return ' '.repeat(e) + x; };

// Recibo de una venta.
export function lineasRecibo(v, { S, P, D }) {
  const n = S.negocio, cli = S.clientes.find(c => c.id === v.cli), at = S.perfiles.find(p => p.id === v.por);
  const f = new Date(v.t), fecha = f.toLocaleDateString('es') + ' ' + f.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
  const L = [{ t: n.nombre, c: 1, g: 1, n: 1 }];
  if (n.razon && n.razon !== n.nombre) L.push({ t: n.razon, c: 1 });
  if (n.fiscal) L.push({ t: P.fiscal[0] + ' ' + n.fiscal, c: 1 });
  if (n.dir) L.push({ t: n.dir, c: 1 });
  if (n.tel) L.push({ t: 'Tel. ' + n.tel, c: 1 });
  L.push({ sep: '-' }, { a: (v.dev ? 'DEVOLUCION' : 'RECIBO') + ' #' + v.n, b: fecha, n: 1 });
  if (v.anulada) L.push({ t: '*** ANULADA ***', c: 1, n: 1 });
  if (cli) L.push({ t: 'Cliente: ' + cli.n });
  if (at) L.push({ t: 'Atendió: ' + at.n.split(' ')[0] + (n.sucursales.length > 1 ? ' · ' + v.suc : '') });
  L.push({ sep: '-' });
  v.items.forEach(it => {
    const lista = it.pLista != null ? it.pLista : it.p;
    L.push({ t: it.n }); L.push({ a: '  ' + fmtQ(it.q) + (it.u ? ' ' + it.u : '') + ' x ' + D.m(lista), b: D.m(it.q * lista) });
    if (it.pLista != null && Math.abs(it.pLista - it.p) > 1e-9) L.push({ a: '  ' + (it.promo ? 'Promo ' + it.promo : it.desc ? 'Descuento ' + it.desc + '%' : 'Descuento'), b: '-' + D.m(it.q * (it.pLista - it.p)) });
  });
  L.push({ sep: '-' });
  if (v.descuento > 0) L.push({ a: 'Ahorraste', b: D.m(v.descuento), n: 1 });
  if (v.imp > 0 && !v.impDesglose) L.push({ a: v.impTxt || P.tax[0], b: D.m(v.imp) });
  (v.impDesglose || []).forEach(x => L.push({ a: x.r ? P.tax[0] + ' ' + x.r + '% s/ ' + D.m(x.base) : 'Exento ' + D.m(x.base), b: x.r ? D.m(x.imp) : '' }));
  L.push({ a: 'TOTAL', b: D.m(v.total), g: 1, n: 1 });
  if (D.dual) L.push({ a: '', b: D.s(v.total) });
  if (v.igtf > 0) L.push({ a: 'IGTF 3% (divisas)', b: D.m(v.igtf) });
  v.pagos.forEach(p => L.push({ a: p.m + (p.ref ? ' Ref ' + p.ref : ''), b: D.m(p.v) }));
  if (v.recibido > 0 && !v.vueltoSaldo) L.push({ a: 'Recibido', b: D.m(v.recibido) }, { a: 'Vuelto', b: D.m(v.recibido - v.total - (v.igtf || 0)) });
  if (v.vueltoSaldo > 0) L.push({ a: 'Vuelto a favor', b: D.m(v.vueltoSaldo) });
  L.push({ sep: '-' }, { t: '¡Gracias por tu compra!', c: 1 });
  if (v.h) L.push({ t: 'Firma ' + v.h.slice(0, 16), c: 1 });
  return L;
}
const fmtQ = q => Number.isInteger(q) ? String(Math.abs(q)) : String(Math.abs(Math.round(q * 1000) / 1000)).replace('.', ',');

// Cierre Z.
export function lineasZ(z, { S, P, D }) {
  const n = S.negocio, quien = (S.perfiles.find(p => p.id === z.por) || {}).n, pp = (z.resumen && z.resumen.porPago) || {};
  const f = new Date(z.t);
  const L = [{ t: n.nombre, c: 1, g: 1, n: 1 }];
  if (n.fiscal) L.push({ t: (n.razon || '') + ' ' + P.fiscal[0] + ' ' + n.fiscal, c: 1 });
  L.push({ t: 'CIERRE Z #' + (z.n || 1), c: 1, n: 1 }, { t: f.toLocaleDateString('es') + ' ' + f.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }) + (quien ? ' · ' + quien : ''), c: 1 }, { sep: '-' });
  if (z.desde) L.push({ a: 'Ventas', b: '#' + z.desde + ' a #' + z.hasta });
  if (z.anuladas) L.push({ a: 'Anuladas', b: String(z.anuladas) });
  Object.keys(pp).forEach(k => L.push({ a: k, b: D.m(pp[k]) }));
  L.push({ sep: '-' });
  if (z.impuestos) L.push({ a: P.tax[0] + ' cobrado', b: D.m(z.impuestos) });
  if (z.igtf) L.push({ a: 'IGTF', b: D.m(z.igtf) });
  L.push({ a: 'TOTAL', b: D.m(z.resumen ? z.resumen.total : 0), g: 1, n: 1 });
  const dif = z.resumen && z.resumen.dif;
  L.push({ a: dif ? (dif < 0 ? 'Faltante en caja' : 'Sobrante en caja') : 'Caja', b: dif ? D.m(Math.abs(dif)) : 'cuadra' });
  ((z.resumen && z.resumen.turnos) || []).forEach(t => L.push({ a: 'Turno ' + t.n, b: Math.abs(t.dif) < 0.005 ? 'cuadró' : (t.dif < 0 ? 'faltó ' : 'sobró ') + D.m(Math.abs(t.dif)) }));
  if (z.h) L.push({ sep: '-' }, { t: 'Firma ' + z.h.slice(0, 24), c: 1 });
  return L;
}

// ---------- impresión del sistema ----------
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export function imprimirSistema(lineas, { ancho = 80, logo = '' } = {}) {
  const txt = aTexto(lineas, ancho);
  const z = document.createElement('div'); z.className = 'zona-imprimir ticket-imp';
  z.innerHTML = `<style>@page { size: ${ancho}mm auto; margin: 0; }</style>
    <div class="ticket-papel" style="width:${ancho === 58 ? 48 : 72}mm">${logo ? `<img src="${logo}" alt="" class="ticket-logo">` : ''}
    ${txt.map(l => `<div class="${(l.g ? 'tg ' : '') + (l.n ? 'tn' : '')}">${esc(l.t) || '&nbsp;'}</div>`).join('')}</div>`;
  document.querySelectorAll('.zona-imprimir').forEach(x => x.remove());
  document.body.appendChild(z); document.documentElement.classList.add('imprimiendo');
  const fin = () => { document.documentElement.classList.remove('imprimiendo'); z.remove(); window.removeEventListener('afterprint', fin); };
  window.addEventListener('afterprint', fin);
  const img = z.querySelector('img');
  if (img && !img.complete) { img.onload = () => window.print(); img.onerror = () => window.print(); } else setTimeout(() => window.print(), 60);
}

// ---------- ESC/POS por Bluetooth ----------
// Servicios que usan las impresoras térmicas Bluetooth más comunes.
const SERVICIOS = ['000018f0-0000-1000-8000-00805f9b34fb', 'e7810a71-73ae-499d-8c15-faa9aef0c3f2', '49535343-fe7d-4ae5-8fa9-9fafd205e455', '0000ff00-0000-1000-8000-00805f9b34fb', '0000fee7-0000-1000-8000-00805f9b34fb'];
let conexion = null;
export const conectada = () => !!(conexion && conexion.disp.gatt.connected);
export const nombreImpresora = () => conexion ? conexion.disp.name || 'Impresora' : '';
export async function conectarBluetooth() {
  if (!hayBluetooth()) throw new Error('sin-bluetooth');
  const disp = conexion && conexion.disp || await navigator.bluetooth.requestDevice({ acceptAllDevices: true, optionalServices: SERVICIOS });
  const gatt = disp.gatt.connected ? disp.gatt : await disp.gatt.connect();
  let car = null;
  for (const sv of await gatt.getPrimaryServices()) {
    for (const ch of await sv.getCharacteristics()) if (ch.properties.write || ch.properties.writeWithoutResponse) { car = ch; break; }
    if (car) break;
  }
  if (!car) throw new Error('sin-canal');
  conexion = { disp, car };
  disp.addEventListener('gattserverdisconnected', () => {});
  return disp.name || 'Impresora';
}
export function olvidarBluetooth() { if (conexion && conexion.disp.gatt.connected) conexion.disp.gatt.disconnect(); conexion = null; }
// Texto a bytes en Windows-1252 (acentos y ñ); lo que no exista se cambia por su letra sin tilde.
const CP = { '€': 0x80, '‚': 0x82, '„': 0x84, '…': 0x85, '‘': 0x91, '’': 0x92, '“': 0x93, '”': 0x94, '•': 0x95, '–': 0x96, '—': 0x97 };
export function aBytes(s) {
  const out = [];
  for (const ch of String(s)) {
    const c = ch.codePointAt(0);
    if (c < 0x80 || (c >= 0xA0 && c <= 0xFF)) out.push(c);
    else if (CP[ch]) out.push(CP[ch]);
    else { const b = ch.normalize('NFD').replace(/[̀-ͯ]/g, ''); out.push(b && b.codePointAt(0) < 0x80 ? b.codePointAt(0) : 0x3F); }
  }
  return out;
}
const ESC = 0x1B, GS = 0x1D;
export function escpos(lineas, { ancho = 80, cajon = false, cortar: corte = true } = {}) {
  const b = [ESC, 0x40, ESC, 0x74, 16];
  aTexto(lineas, ancho).forEach(l => {
    b.push(ESC, 0x45, l.n ? 1 : 0, GS, 0x21, l.g ? 0x11 : 0x00);
    b.push(...aBytes(l.t), 0x0A);
  });
  b.push(GS, 0x21, 0, ESC, 0x45, 0, 0x0A, 0x0A, 0x0A);
  if (corte) b.push(GS, 0x56, 0x42, 0x00);
  if (cajon) b.push(ESC, 0x70, 0x00, 0x19, 0xFA);
  return new Uint8Array(b);
}
export const pulsoCajon = () => new Uint8Array([ESC, 0x40, ESC, 0x70, 0x00, 0x19, 0xFA]);
async function enviar(bytes) {
  if (!conectada()) await conectarBluetooth();
  const { car } = conexion;
  for (let i = 0; i < bytes.length; i += 180) {
    const trozo = bytes.slice(i, i + 180);
    if (car.properties.writeWithoutResponse && car.writeValueWithoutResponse) await car.writeValueWithoutResponse(trozo); else await car.writeValue(trozo);
  }
}

// Imprimir con lo que el negocio eligió. «cajon»: abrir el cajón (solo Bluetooth).
export async function imprimir(lineas, { cajon = false, logo = '' } = {}) {
  const a = ajustesImpresora();
  if (a.modo === 'bluetooth' && hayBluetooth()) { await enviar(escpos(lineas, { ancho: a.ancho, cajon: cajon && a.cajon })); return 'bluetooth'; }
  imprimirSistema(lineas, { ancho: a.ancho, logo });
  return 'sistema';
}
export async function abrirCajon() {
  const a = ajustesImpresora();
  if (a.modo !== 'bluetooth' || !hayBluetooth()) throw new Error('sin-cajon');
  await enviar(pulsoCajon());
}
