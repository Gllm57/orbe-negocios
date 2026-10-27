// Datos de Orbe Negocios. Todo se guarda primero en el aparato (funciona sin internet).
// Regla de Orbe: si algo se daña al cargar, se aparta y nunca se borra.
import { useState, useEffect } from './lib/preact-htm.js';
import { pais, tipo, dinero } from './paises.js';
import { ROLES_BASE } from './permisos.js';

const CLAVE = 'orbe-negocios';
const subs = new Set();
let S = vacio();

function vacio() { return { v: 2, negocio: null, productos: [], clientes: [], ventas: [], abonos: [], gastos: [], cierres: [], perfiles: [], roles: ROLES_BASE(), registro: [], ajustes: { tema: 'auto', perfil: '' }, tasa: { modo: 'auto', valor: 0, fuente: 'oficial', fecha: '' } }; }
// Datos guardados con versiones anteriores: se completan sin perder nada.
function migrar(d) {
  if (!Array.isArray(d.roles) || !d.roles.length) d.roles = ROLES_BASE();
  // El permiso de anular llegó después: administrador y encargado lo tienen de entrada.
  d.roles = d.roles.map(r => r.p && r.p.anular === undefined && (r.id === 'admin' || r.id === 'encargado') ? Object.assign({}, r, { p: Object.assign({}, r.p, { anular: true }) }) : r);
  if (d.negocio && (!Array.isArray(d.perfiles) || !d.perfiles.length)) { d.perfiles = [{ id: 'u0', n: 'Dueño', rol: 'dueno', pin: '', sucs: [], creado: Date.now() }]; d.ajustes = Object.assign({}, d.ajustes, { perfil: 'u0' }); }
  if (!Array.isArray(d.registro)) d.registro = [];
  if (!d.tasa || typeof d.tasa !== 'object' || (d.tasaVE && !d.tasa.valor)) d.tasa = { modo: 'auto', valor: d.tasaVE || 0, fuente: 'oficial', fecha: d.tasaFecha || '' };
  delete d.tasaVE; delete d.tasaFecha;
  d.v = 2;
  return d;
}

export function valido(d) { return !!d && typeof d === 'object' && Array.isArray(d.ventas) && Array.isArray(d.productos) && Array.isArray(d.clientes); }
const preparar = d => migrar(Object.assign(vacio(), JSON.parse(JSON.stringify(d))));

// ---------- guardado: IndexedDB (mucho espacio) y, si el navegador no lo deja, localStorage ----------
let db = null;
function abrirDB() {
  return new Promise((ok, mal) => {
    try {
      const r = indexedDB.open(CLAVE, 1);
      r.onupgradeneeded = () => r.result.createObjectStore('kv');
      r.onsuccess = () => ok(r.result);
      r.onerror = () => mal(r.error);
      r.onblocked = () => mal(new Error('bloqueada'));
    } catch (e) { mal(e); }
  });
}
function idb(modo, fn) {
  return new Promise((ok, mal) => {
    const tx = db.transaction('kv', modo), r = fn(tx.objectStore('kv'));
    tx.oncomplete = () => ok(r ? r.result : undefined);
    tx.onerror = () => mal(tx.error); tx.onabort = () => mal(tx.error);
  });
}
const idbLeer = k => idb('readonly', st => st.get(k));
const idbPoner = (k, v) => idb('readwrite', st => st.put(v, k));

function leerLS() {
  let crudo = null;
  try { crudo = localStorage.getItem(CLAVE); } catch (e) { return null; }
  if (!crudo) return null;
  try { const d = JSON.parse(crudo); if (valido(d)) return d; throw new Error('forma inválida'); }
  catch (e) { try { localStorage.setItem(CLAVE + '-rescate-' + Date.now(), crudo); } catch (e2) { /* sin espacio */ } return null; }
}
// Lo mínimo para la pantalla de carga (tema y nombre), que se lee antes que todo lo demás.
function guardarMini() { try { localStorage.setItem(CLAVE + '-mini', JSON.stringify({ tema: S.ajustes.tema, nombre: S.negocio ? S.negocio.nombre : '' })); } catch (e) { /* sin espacio */ } }

// Arranque: lee de IndexedDB; la primera vez trae lo que había en localStorage (y lo deja apartado, nunca lo borra).
export async function iniciarDatos() {
  try { db = await abrirDB(); } catch (e) { db = null; }
  let d = null;
  if (db) {
    try { d = await idbLeer('datos'); } catch (e) { d = null; }
    if (d && !valido(d)) { try { await idbPoner('rescate-' + Date.now(), d); } catch (e) { /* nada */ } d = null; }
    if (!d) {
      d = leerLS();
      if (d) {
        try {
          await idbPoner('datos', d);
          localStorage.setItem(CLAVE + '-antes-de-indexeddb', localStorage.getItem(CLAVE));
          localStorage.removeItem(CLAVE);
        } catch (e) { /* si falla, se sigue usando localStorage la próxima vez */ }
      }
    }
  } else d = leerLS();
  S = d ? preparar(d) : vacio();
  // Si venía de una versión anterior, se guarda ya completado.
  if (d && d.v !== S.v) guardarYa(); else guardarMini();
  await copiaDelDia();
}

let tGuardar = 0;
function guardar() {
  clearTimeout(tGuardar);
  tGuardar = setTimeout(guardarYa, 120);
}
async function guardarYa() {
  guardarMini();
  try {
    if (db) await idbPoner('datos', S);
    else localStorage.setItem(CLAVE, JSON.stringify(S));
  } catch (e) { console.warn('No se pudo guardar', e); }
  copiaDelDia();
}
// Guardar antes de cerrar la pestaña, por si quedó algo pendiente.
window.addEventListener('pagehide', () => { if (tGuardar) { clearTimeout(tGuardar); guardarYa(); } });

// ---------- copias automáticas: una por día, se guardan las últimas 7 ----------
const DIAS_COPIA = 7;
let diaCopiado = '';
async function copiaDelDia() {
  const hoyK = diaClave(Date.now());
  if (diaCopiado === hoyK || !S.negocio) return;
  diaCopiado = hoyK;
  try {
    if (!db) { localStorage.setItem(CLAVE + '-copia', JSON.stringify(S)); localStorage.setItem(CLAVE + '-copia-dia', hoyK); return; }
    if (await idbLeer('copia-' + hoyK)) return;
    await idbPoner('copia-' + hoyK, { t: Date.now(), datos: S });
    const ks = (await idb('readonly', st => st.getAllKeys())).filter(k => /^copia-\d/.test(k)).sort();
    const sobran = ks.slice(0, Math.max(0, ks.length - DIAS_COPIA));
    if (sobran.length) await idb('readwrite', st => { sobran.forEach(k => st.delete(k)); });
  } catch (e) { console.warn('No se pudo hacer la copia del día', e); }
}
// Lista de copias guardadas en este aparato (las automáticas y las que se hicieron antes de borrar o restaurar).
export async function listarCopias() {
  const out = [];
  const ficha = (k, nombre, t, d) => valido(d) && out.push({ k, nombre, t, ventas: d.ventas.length, negocio: d.negocio ? d.negocio.nombre : '' });
  try {
    if (db) {
      const ks = await idb('readonly', st => st.getAllKeys());
      for (const k of ks.filter(k => /^(copia|antes)-/.test(k)).sort().reverse()) {
        const x = await idbLeer(k);
        if (x) ficha(k, /^antes-de-restaurar/.test(k) ? 'Antes de restaurar' : /^antes-de-borrar/.test(k) ? 'Antes de empezar de nuevo' : 'Copia automática', x.t, x.datos);
      }
    }
    const ls = localStorage.getItem(CLAVE + '-copia');
    if (ls) ficha('ls-copia', 'Copia anterior', 0, JSON.parse(ls));
  } catch (e) { /* sin copias legibles */ }
  return out;
}
export async function leerCopia(k) {
  if (k === 'ls-copia') return JSON.parse(localStorage.getItem(CLAVE + '-copia'));
  const x = await idbLeer(k); return x ? x.datos : null;
}
async function apartar(nombre) {
  try { if (db) await idbPoner(nombre + '-' + Date.now(), { t: Date.now(), datos: S }); else localStorage.setItem(CLAVE + '-' + nombre, JSON.stringify(S)); } catch (e) { /* sin espacio */ }
}
// Restaurar: lo de ahora se aparta primero, así también se puede deshacer.
export async function restaurar(d) {
  if (!valido(d)) return false;
  await apartar('antes-de-restaurar');
  const nuevo = preparar(d), quien = S.ajustes.perfil;
  nuevo.ajustes = Object.assign({}, nuevo.ajustes, { tema: S.ajustes.tema, perfil: nuevo.perfiles.some(p => p.id === quien) ? quien : '' });
  diaCopiado = diaClave(Date.now());
  S = nuevo; memo.clear(); guardarYa(); subs.forEach(f => f());
  return true;
}

export const leer = () => S;
export function cambiar(fn) { S = Object.assign({}, S, fn(S)); memo.clear(); guardar(); subs.forEach(f => f()); }
export function useDatos() {
  const [, forzar] = useState(0);
  useEffect(() => { const f = () => forzar(x => x + 1); subs.add(f); return () => subs.delete(f); }, []);
  return S;
}

// ---------- fechas ----------
export function diaClave(t) { const d = new Date(t); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
export function inicioDia(t) { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); }
const DIA = 86400000;
const id = () => Math.random().toString(36).slice(2, 10);

// ---------- catálogos de ejemplo (precios de referencia en dólares) ----------
// [abreviatura, nombre, precio, costo, existencia, mínimo, minutos, popularidad]
const CATALOGO = {
  tienda: [['HM', 'Harina de maíz', 1.30, 0.95, 48, 12, 0, 9], ['AR', 'Arroz 1 kg', 1.45, 1.05, 36, 10, 0, 7], ['CF', 'Café 250 g', 3.20, 2.30, 6, 8, 0, 5], ['AC', 'Aceite 1 L', 3.80, 2.90, 20, 6, 0, 4], ['HV', 'Huevos x 30', 4.50, 3.40, 4, 6, 0, 4], ['QS', 'Queso 1 kg', 5.60, 4.10, 12, 4, 0, 3], ['RF', 'Refresco 2 L', 2.10, 1.50, 30, 8, 0, 6], ['PN', 'Pan', 0.60, 0.35, 60, 20, 0, 10], ['JB', 'Jabón', 1.10, 0.75, 24, 6, 0, 3]],
  comida: [['HB', 'Hamburguesa', 4.50, 2.10, 60, 15, 0, 9], ['PC', 'Perro caliente', 2.50, 1.00, 50, 15, 0, 6], ['EM', 'Empanada', 1.20, 0.45, 90, 20, 0, 8], ['PF', 'Papas fritas', 2.00, 0.70, 45, 10, 0, 7], ['PZ', 'Pizza personal', 5.00, 2.20, 5, 8, 0, 4], ['JN', 'Jugo natural', 1.80, 0.60, 30, 10, 0, 5], ['RF', 'Refresco', 1.20, 0.60, 72, 24, 0, 7], ['CF', 'Café', 1.00, 0.25, 120, 30, 0, 6], ['CB', 'Combo del día', 6.50, 3.00, 20, 5, 0, 5]],
  citas: [['CO', 'Corte', 8, 1, 0, 0, 30, 9], ['CB', 'Corte y barba', 12, 1.5, 0, 0, 45, 6], ['TI', 'Tinte', 25, 7, 0, 0, 90, 2], ['MA', 'Manicure', 10, 2, 0, 0, 45, 5], ['PE', 'Pedicure', 12, 2.5, 0, 0, 50, 3], ['PI', 'Peinado', 15, 2, 0, 0, 60, 2]],
  online: [['CA', 'Camiseta estampada', 15, 6, 40, 10, 0, 8], ['GO', 'Gorra', 12, 5, 16, 6, 0, 4], ['TZ', 'Taza', 9, 3.5, 5, 6, 0, 5], ['TB', 'Bolsa de tela', 10, 4, 22, 5, 0, 3], ['ST', 'Stickers x 5', 4, 1, 90, 20, 0, 6], ['SU', 'Sudadera', 28, 12, 9, 4, 0, 2], ['EN', 'Envío', 3, 3, -1, 0, 0, 7]],
  indep: [['LG', 'Diseño de logo', 120, 0, 0, 0, 600, 1], ['FT', 'Sesión de fotos', 80, 10, 0, 0, 120, 2], ['CL', 'Clase 1 hora', 15, 0, 0, 0, 60, 6], ['AS', 'Asesoría 1 hora', 30, 0, 0, 0, 60, 3], ['VT', 'Visita técnica', 25, 3, 0, 0, 90, 3], ['RS', 'Paquete redes', 60, 0, 0, 0, 240, 1]]
};
const VENTAS_DIA = { tienda: 26, comida: 38, citas: 8, online: 7, indep: 2 };
const NOMBRES = { tienda: 'Bodega La Esquina', comida: 'Sabor Express', citas: 'Estudio Bella', online: 'Estampa Store', indep: 'Ana Ruiz Estudio' };
const NOMBRES_EMP = { tienda: 'Comercial La Esquina', comida: 'Grupo Sabor Express', citas: 'Estudios Bella', online: 'Estampa Store', indep: 'Ruiz y Asociados' };
export const nombreSugerido = (t, esc) => (esc === 'empresa' ? NOMBRES_EMP : NOMBRES)[t] || 'Mi negocio';

function azar(semilla) { let a = semilla >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function elegir(r, pesos) { const tot = pesos.reduce((a, b) => a + b, 0); let x = r() * tot; for (let i = 0; i < pesos.length; i++) { x -= pesos[i]; if (x <= 0) return i; } return pesos.length - 1; }

// ---------- crear el negocio ----------
export function crearNegocio(cfg, conEjemplo) {
  const P = pais(cfg.pais), T = tipo(cfg.tipo), D = dinero(P), E = cfg.escala === 'empresa';
  // Si tiene un solo local no se habla de sucursales en ninguna parte de la app.
  const nSuc = Math.max(1, Math.min(5, cfg.sucN || 1)), NOM = ['Centro', 'Norte', 'Este', 'Oeste', 'Sur'];
  const sucursales = nSuc === 1 ? ['Principal'] : Array.from({ length: nSuc }, (_, i) => ((cfg.sucNombres || [])[i] || '').trim() || NOM[i]);
  const productos = CATALOGO[T.id].map((x, i) => ({ id: 'p' + i, ab: x[0], n: x[1], p: D.precio(x[2]), c: D.precio(x[3]), q: x[4] < 0 ? null : Math.round(x[4] * (E ? 3 : 1)), min: Math.round(x[5] * (E ? 3 : 1)), dur: x[6] || 0, pop: x[7], cod: '759' + String(1234000 + i * 37) }));
  const negocio = { nombre: cfg.nombre || nombreSugerido(T.id, cfg.escala), razon: cfg.razon || '', fiscal: cfg.fiscal || '', pais: P.id, tipo: T.id, escala: E ? 'empresa' : 'negocio', pays: cfg.pays && cfg.pays.length ? cfg.pays : P.pays.slice(), taxOn: cfg.taxOn ?? P.tax[1] > 0, taxIncl: cfg.taxIncl ?? true, sucursales, creado: Date.now() };
  const perfiles = [{ id: 'u0', n: (cfg.dueno || '').trim() || 'Dueño', rol: 'dueno', pin: '', sucs: [], creado: Date.now() }];
  if (conEjemplo) perfiles.push(
    { id: 'u1', n: 'Carla Méndez', rol: 'encargado', pin: '1111', sucs: [], creado: Date.now() },
    { id: 'u2', n: 'Luis Pino', rol: 'cajero', pin: '2222', sucs: sucursales.length > 1 ? [sucursales[0]] : [], creado: Date.now() });
  const base = { negocio, productos: productos.map(({ pop, ...p }) => p), clientes: [], ventas: [], abonos: [], gastos: [], cierres: [], perfiles, roles: ROLES_BASE(), registro: [], ajustes: Object.assign({}, S.ajustes, { perfil: 'u0' }) };
  if (conEjemplo) Object.assign(base, ejemplo(negocio, productos, D, perfiles));
  cambiar(() => base);
}

function ejemplo(neg, productos, D, perfiles) {
  const r = azar(20261027), E = neg.escala === 'empresa', ahora = Date.now(), hoy0 = inicioDia(ahora);
  const clientes = (E
    ? [['Constructora Andina', 'empresa', 2000], ['Hotel Miramar', 'empresa', 1500], ['Colegio San José', 'empresa', 1000], ['Carmen Díaz', 'persona', 0], ['María Pérez', 'persona', 0], ['Luis Gómez', 'persona', 0]]
    : [['María Pérez', 'persona', 0], ['José Rivas', 'persona', 0], ['Carmen Díaz', 'persona', 0], ['Luis Gómez', 'persona', 0], ['Ana Torres', 'persona', 0], ['Pedro Gil', 'persona', 0]]
  ).map((c, i) => ({ id: 'c' + i, n: c[0], tipo: c[1], limite: c[2] ? D.precio(c[2]) : 0, tel: '0414-555-' + String(2110 + i * 37) }));
  const pesosPago = neg.pays.map((_, i) => [5, 3, 2, 1.2, 0.8, 0.6][i] || 0.5);
  const pesosHora = [0, 0, 0, 0, 0, 0, 0, 1, 3, 5, 6, 8, 9, 7, 5, 4, 5, 7, 8, 6, 3, 1, 0, 0];
  const pesosSuc = neg.sucursales.map((_, i) => 1 / (i + 1.4));
  const porDia = VENTAS_DIA[neg.tipo] * (E ? 2.5 : 1) * (neg.sucursales.length > 1 && !E ? 1.6 : 1);
  const ventas = []; const stock = {}; productos.forEach(p => { stock[p.id] = 0; });
  let n = 1000;
  const horaAhora = new Date(ahora).getHours();
  for (let d = 63; d >= 0; d--) {
    const dia0 = hoy0 - d * DIA, sem = new Date(dia0).getDay();
    const factor = (sem === 0 ? 0.55 : sem === 6 ? 1.25 : sem === 5 ? 1.15 : 1) * (0.85 + (63 - d) / 63 * 0.3) * (0.85 + r() * 0.3);
    const cuantas = Math.round(porDia * factor);
    for (let k = 0; k < cuantas; k++) {
      const hora = elegir(r, pesosHora);
      if (d === 0 && hora > horaAhora) continue;
      const t = dia0 + hora * 3600000 + Math.floor(r() * 3600000);
      if (t > ahora) continue;
      const lineas = {}; const nItems = neg.tipo === 'indep' || neg.tipo === 'citas' ? 1 : 1 + elegir(r, [5, 3, 1.5, 0.5]);
      for (let j = 0; j < nItems; j++) { const pi = elegir(r, productos.map(p => p.pop)); lineas[pi] = (lineas[pi] || 0) + 1 + (r() < 0.2 ? 1 : 0); }
      const items = Object.keys(lineas).map(pi => { const p = productos[pi]; return { pid: p.id, n: p.n, q: lineas[pi], p: p.p, c: p.c }; });
      const total = D.redondo(items.reduce((a, it) => a + it.q * it.p, 0));
      // Cada cliente fía en una ventana distinta: unos deben de hace poco y otros ya están vencidos.
      const ci = elegir(r, clientes.map((c, i) => E && i < 3 ? 3 : 1));
      const fiado = d < [6, 11, 24, 3, 9, 2][ci] && r() < 0.1;
      const cli = fiado || r() < 0.15 ? clientes[ci].id : '';
      const m = fiado ? 'Fiado' : neg.pays[elegir(r, pesosPago)];
      items.forEach(it => { stock[it.pid] += it.q; });
      ventas.push({ id: id(), n: n++, t, items, total, pagos: [{ m, v: total }], cli, suc: neg.sucursales[elegir(r, pesosSuc)], fiado, por: perfiles[elegir(r, [2, 4, 5].slice(0, perfiles.length))].id });
    }
  }
  ventas.sort((a, b) => a.t - b.t); ventas.forEach((v, i) => { v.n = 1001 + i; });
  // Abonos: los clientes pagaron parte de lo fiado hace más de una semana.
  const abonos = [];
  clientes.forEach((c, i) => {
    const deuda = ventas.filter(v => v.fiado && v.cli === c.id && v.t < ahora - 7 * DIA).reduce((a, v) => a + v.total, 0);
    if (deuda > 0 && i % 2 === 0) abonos.push({ id: id(), t: ahora - (3 + i) * DIA, cli: c.id, v: D.redondo(deuda * 0.6), m: neg.pays[0] });
  });
  const kb = E ? 4 : 1, mesIni = new Date(hoy0); mesIni.setDate(1);
  const gastos = [
    ['Alquiler del local', 'Alquiler', 250, mesIni.getTime() + 2 * DIA, true],
    ['Luz y agua', 'Servicios', 38, ahora - 1 * DIA, true],
    ['Sueldo ayudante', 'Sueldos', 120, ahora - 2 * DIA, true],
    ['Transporte', 'Transporte', 6, ahora - 3 * DIA, true],
    ['Internet', 'Servicios', 25, ahora - 7 * DIA, true],
    ['Mercancía', 'Mercancía', 180, ahora - 9 * DIA, true],
    ['Distribuidora Central', 'Mercancía', 84, ahora, false, ahora + DIA],
    ['Alquiler del local', 'Alquiler', 250, ahora, false, ahora + 5 * DIA]
  ].map(g => ({ id: id(), n: g[0], cat: g[1], v: D.precio(g[2] * kb), t: g[3], pagado: g[4], vence: g[5] || 0, m: neg.pays[0], suc: neg.sucursales[0] }));
  // Lo vendido sale del inventario, pero el ejemplo arranca con lo que hay ahora.
  return { clientes, ventas, abonos, gastos, cierres: [] };
}

// ---------- acciones ----------
export const sigNumero = () => (S.ventas.length ? S.ventas[S.ventas.length - 1].n : 1000) + 1;
const stockMas = (productos, lineas, signo) => productos.map(p => { const q = lineas[p.id]; return q && p.q != null ? Object.assign({}, p, { q: Math.max(0, p.q + signo * q) }) : p; });
const porLinea = items => items.reduce((o, it) => (o[it.pid] = (o[it.pid] || 0) + it.q, o), {});
// Registro de cambios: quién hizo qué y cuándo (anulaciones, devoluciones, borrados, cambios del negocio).
const nota = (s, que) => ({ registro: (s.registro || []).concat([{ t: Date.now(), por: s.ajustes.perfil || '', que }]).slice(-500) });

export function vender({ items, pagos, cli, suc, fiado, total: conImpuesto }) {
  // Si el impuesto va aparte, el total cobrado es mayor que la suma de los productos.
  const total = conImpuesto || items.reduce((a, it) => a + it.q * it.p, 0);
  const venta = { id: id(), n: sigNumero(), t: Date.now(), items, total, pagos, cli: cli || '', suc: suc || S.negocio.sucursales[0], fiado: !!fiado, por: S.ajustes.perfil || '', tasa: S.tasa.valor || 0 };
  cambiar(s => ({ ventas: s.ventas.concat([venta]), productos: stockMas(s.productos, porLinea(items), -1) }));
  return venta;
}
// Anular: la venta queda en el historial marcada, deja de contar y lo vendido vuelve al inventario.
export function anularVenta(vid, motivo) {
  const v = S.ventas.find(x => x.id === vid);
  if (!v || v.anulada || v.dev) return false;
  const quedan = {}; v.items.forEach(it => { const q = it.q - ((v.devuelto || {})[it.pid] || 0); if (q > 0) quedan[it.pid] = (quedan[it.pid] || 0) + q; });
  cambiar(s => Object.assign({
    ventas: s.ventas.map(x => x.id === vid ? Object.assign({}, x, { anulada: { t: Date.now(), por: s.ajustes.perfil || '', motivo } }) : x),
    productos: stockMas(s.productos, quedan, 1)
  }, nota(s, 'Anuló la venta #' + v.n + ' (' + motivo + ')')));
  return true;
}
// Devolución: un movimiento nuevo en negativo (cuenta el día que se devuelve) y lo devuelto vuelve al inventario.
// Si la venta fue fiada, lo devuelto se descuenta de lo que debe el cliente.
export function devolver(vid, lineas, m, motivo, monto) {
  const v = S.ventas.find(x => x.id === vid);
  if (!v || v.anulada || v.dev) return null;
  const items = v.items.filter(it => lineas[it.pid] > 0).map(it => ({ pid: it.pid, n: it.n, q: -lineas[it.pid], p: it.p, c: it.c }));
  if (!items.length) return null;
  const total = monto ? -monto : items.reduce((a, it) => a + it.q * it.p, 0);
  const dev = { id: id(), n: sigNumero(), t: Date.now(), items, total, pagos: [{ m: v.fiado ? 'Fiado' : m, v: total }], cli: v.cli, suc: v.suc, fiado: v.fiado, por: S.ajustes.perfil || '', dev: v.n, motivo };
  const devuelto = Object.assign({}, v.devuelto); Object.keys(lineas).forEach(k => { if (lineas[k] > 0) devuelto[k] = (devuelto[k] || 0) + lineas[k]; });
  cambiar(s => Object.assign({
    ventas: s.ventas.map(x => x.id === vid ? Object.assign({}, x, { devuelto }) : x).concat([dev]),
    productos: stockMas(s.productos, lineas, 1)
  }, nota(s, 'Devolución de la venta #' + v.n + ' (' + motivo + ')')));
  return dev;
}
export function abonar(cli, v, m) { cambiar(s => ({ abonos: s.abonos.concat([{ id: id(), t: Date.now(), cli, v, m, por: s.ajustes.perfil || '' }]) })); }
export function anotarGasto(g) { cambiar(s => ({ gastos: s.gastos.concat([Object.assign({ id: id(), t: Date.now(), suc: s.negocio.sucursales[0], por: s.ajustes.perfil || '' }, g)]) })); }
export function editarGasto(gid, g) { cambiar(s => ({ gastos: s.gastos.map(x => x.id === gid ? Object.assign({}, x, g) : x) })); }
export function borrarGasto(gid) {
  const g = S.gastos.find(x => x.id === gid); if (!g) return;
  cambiar(s => Object.assign({ gastos: s.gastos.filter(x => x.id !== gid) }, nota(s, 'Borró el gasto «' + g.n + '»')));
}
export function pagarGasto(gid) { cambiar(s => ({ gastos: s.gastos.map(g => g.id === gid ? Object.assign({}, g, { pagado: true, t: Date.now() }) : g) })); }
export function guardarProducto(p) { cambiar(s => ({ productos: p.id && s.productos.some(x => x.id === p.id) ? s.productos.map(x => x.id === p.id ? Object.assign({}, x, p) : x) : s.productos.concat([Object.assign({ id: 'p' + id(), cod: '' }, p)]) })); }
// Borrar producto o cliente: se ocultan, pero su historial de ventas se queda.
export function borrarProducto(pid) {
  const p = S.productos.find(x => x.id === pid); if (!p) return;
  cambiar(s => Object.assign({ productos: s.productos.map(x => x.id === pid ? Object.assign({}, x, { borrado: Date.now() }) : x) }, nota(s, 'Borró el producto «' + p.n + '»')));
}
export function reponer(pid, cuanto) { cambiar(s => ({ productos: s.productos.map(p => p.id === pid && p.q != null ? Object.assign({}, p, { q: p.q + cuanto }) : p) })); }
export function nuevoCliente(c) { const nuevo = Object.assign({ id: 'c' + id(), tipo: 'persona', limite: 0, tel: '' }, c); cambiar(s => ({ clientes: s.clientes.concat([nuevo]) })); return nuevo; }
export function editarCliente(cid, c) { cambiar(s => ({ clientes: s.clientes.map(x => x.id === cid ? Object.assign({}, x, c) : x) })); }
export function borrarCliente(cid) {
  const c = S.clientes.find(x => x.id === cid); if (!c || deudaDe(cid) > 0.004) return false;
  cambiar(s => Object.assign({ clientes: s.clientes.map(x => x.id === cid ? Object.assign({}, x, { borrado: Date.now() }) : x) }, nota(s, 'Borró al cliente «' + c.n + '»')));
  return true;
}
export function cerrarDia(contado, resumen) { cambiar(s => ({ cierres: s.cierres.concat([{ id: id(), t: Date.now(), dia: diaClave(Date.now()), contado, resumen }]) })); }
// ---------- perfiles y permisos ----------
export const perfilActual = () => (S.perfiles || []).find(p => p.id === S.ajustes.perfil && !p.inactivo) || null;
export function entrar(pid) { cambiar(s => ({ ajustes: Object.assign({}, s.ajustes, { perfil: pid }) })); }
export function salir() { cambiar(s => ({ ajustes: Object.assign({}, s.ajustes, { perfil: '' }) })); }
export function guardarPerfil(p) {
  cambiar(s => ({ perfiles: p.id && s.perfiles.some(x => x.id === p.id) ? s.perfiles.map(x => x.id === p.id ? Object.assign({}, x, p) : x) : s.perfiles.concat([Object.assign({ id: 'u' + id(), pin: '', sucs: [], creado: Date.now() }, p)]) }));
}
export function cambiarPermiso(rolId, k, v) { cambiar(s => ({ roles: s.roles.map(r => r.id === rolId && !r.fijo ? Object.assign({}, r, { p: Object.assign({}, r.p, { [k]: v }) }) : r) })); }
export function nuevoRol(n) { const r = { id: 'r' + id(), n, p: { vender: true } }; cambiar(s => ({ roles: s.roles.concat([r]) })); return r; }
export function cambiarAjustes(a) { cambiar(s => ({ ajustes: Object.assign({}, s.ajustes, a) })); }
export function cambiarNegocio(n, que) { cambiar(s => Object.assign({ negocio: Object.assign({}, s.negocio, n) }, que ? nota(s, que) : {})); }
// Agregar o renombrar locales. Al renombrar, las ventas y gastos pasan al nombre nuevo.
export function guardarSucursales(nombres, renombres) {
  const ren = renombres || {};
  cambiar(s => ({
    negocio: Object.assign({}, s.negocio, { sucursales: nombres }),
    ventas: Object.keys(ren).length ? s.ventas.map(v => ren[v.suc] ? Object.assign({}, v, { suc: ren[v.suc] }) : v) : s.ventas,
    gastos: Object.keys(ren).length ? s.gastos.map(g => ren[g.suc] ? Object.assign({}, g, { suc: ren[g.suc] }) : g) : s.gastos
  }));
}
// Tasa: automática (se lee de internet una vez al día) o escrita a mano. En Argentina se elige oficial, blue o MEP.
export function guardarTasa(t) { cambiar(s => ({ tasa: Object.assign({}, s.tasa, t, t.valor ? { fecha: diaClave(Date.now()) } : {}) })); }
export async function empezarDeNuevo() {
  await apartar('antes-de-borrar');
  cambiar(() => Object.assign(vacio(), { ajustes: Object.assign({}, S.ajustes, { perfil: '' }) }));
}
export function exportar() { return JSON.stringify(S, null, 1); }

// ---------- cálculos (se recalculan solo cuando cambian los datos) ----------
const memo = new Map();
function m(clave, fn) { if (!memo.has(clave)) memo.set(clave, fn()); return memo.get(clave); }

const delSuc = suc => v => !suc || v.suc === suc;
// Las ventas anuladas no cuentan en ningún cálculo; las devoluciones sí (restan).
export const vigentes = () => m('vig', () => S.ventas.filter(v => !v.anulada));
export const listaProductos = () => m('prods', () => S.productos.filter(p => !p.borrado));
export const listaClientes = () => m('clis', () => S.clientes.filter(c => !c.borrado));
export function ventasEntre(desde, hasta, suc) { return m('ve' + desde + hasta + suc, () => vigentes().filter(v => v.t >= desde && v.t < hasta && delSuc(suc)(v))); }
const costo = v => v.items.reduce((a, it) => a + it.q * it.c, 0);

export function resumen(desde, hasta, suc) {
  return m('re' + desde + hasta + suc, () => {
    const vs = ventasEntre(desde, hasta, suc);
    const porPago = {}, porHora = new Array(24).fill(0), porSuc = {}, porProd = {}, porPersona = {};
    let total = 0, cost = 0, fiado = 0;
    vs.forEach(v => {
      total += v.total; cost += costo(v);
      if (v.fiado) fiado += v.total;
      v.pagos.forEach(p => { porPago[p.m] = (porPago[p.m] || 0) + p.v; });
      porHora[new Date(v.t).getHours()] += v.total;
      porSuc[v.suc] = (porSuc[v.suc] || 0) + v.total;
      porPersona[v.por || ''] = (porPersona[v.por || ''] || 0) + v.total;
      v.items.forEach(it => { const x = porProd[it.pid] || (porProd[it.pid] = { n: it.n, q: 0, v: 0, g: 0 }); x.q += it.q; x.v += it.q * it.p; x.g += it.q * (it.p - it.c); });
    });
    const n = vs.filter(v => !v.dev).length;
    return { n, total, ganancia: total - cost, costo: cost, fiado, porPago, porHora, porSuc, porProd, porPersona, ticket: n ? total / n : 0 };
  });
}

export function serieDias(dias, suc) {
  return m('sd' + dias + suc + diaClave(Date.now()), () => {
    const hoy0 = inicioDia(Date.now()), out = [];
    for (let d = dias - 1; d >= 0; d--) {
      const a = hoy0 - d * DIA, r = resumen(a, a + DIA, suc);
      out.push({ t: a, total: r.total, ganancia: r.ganancia, porSuc: r.porSuc, n: r.n });
    }
    return out;
  });
}

export function deudaDe(cid) {
  return m('de' + cid, () => vigentes().filter(v => v.fiado && v.cli === cid).reduce((a, v) => a + v.total, 0) - S.abonos.filter(a => a.cli === cid).reduce((a, x) => a + x.v, 0));
}
export function deudores() {
  return m('deudores', () => listaClientes().map(c => {
    const fiados = vigentes().filter(v => v.fiado && v.cli === c.id && !v.dev);
    const deuda = deudaDe(c.id);
    const desde = fiados.length ? fiados[0].t : 0;
    const suyas = vigentes().filter(v => v.cli === c.id && !v.dev);
    const ultima = suyas.reduce((a, v) => Math.max(a, v.t), 0);
    return Object.assign({}, c, { deuda: Math.max(0, deuda), desde, ultima, compras: suyas.length });
  }).sort((a, b) => b.deuda - a.deuda));
}
export function porPagar() { return m('pp', () => S.gastos.filter(g => !g.pagado).sort((a, b) => a.vence - b.vence)); }
export function gastosEntre(desde, hasta) { return m('ge' + desde + hasta, () => S.gastos.filter(g => g.pagado && g.t >= desde && g.t < hasta)); }
export function bajoMinimo() { return m('bm', () => listaProductos().filter(p => p.q != null && p.min > 0 && p.q < p.min)); }
export function cierreDeHoy() { const k = diaClave(Date.now()); return S.cierres.find(c => c.dia === k) || null; }
