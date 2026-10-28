// Datos de Orbe Negocios. Todo se guarda primero en el aparato (funciona sin internet).
// Regla de Orbe: si algo se daña al cargar, se aparta y nunca se borra.
import { useState, useEffect } from './lib/preact-htm.js';
import { pais, tipo, dinero, TASA_VE_RESPALDO, esDivisa, EUR_USD } from './paises.js';
import { ROLES_BASE } from './permisos.js';
import { encadenar, revisar, firmaVenta, firmaRegistro, firmaCierre } from './hash.js';

const CLAVE = 'orbe-negocios';
const subs = new Set();
let S = vacio();

function vacio() { return { v: 2, negocio: null, productos: [], clientes: [], ventas: [], abonos: [], gastos: [], cierres: [], perfiles: [], roles: ROLES_BASE(), registro: [], ajustes: { tema: 'auto', perfil: '' }, tasa: { modo: 'auto', valor: 0, fuente: 'oficial', fecha: '' }, tasas: {}, historialTasas: [], grupos: [] }; }
// Datos guardados con versiones anteriores: se completan sin perder nada.
function migrar(d) {
  if (!Array.isArray(d.roles) || !d.roles.length) d.roles = ROLES_BASE();
  // El permiso de anular llegó después: administrador y encargado lo tienen de entrada.
  d.roles = d.roles.map(r => r.p && r.p.anular === undefined && (r.id === 'admin' || r.id === 'encargado') ? Object.assign({}, r, { p: Object.assign({}, r.p, { anular: true }) }) : r);
  // Cambiar las tasas llegó después: de entrada solo el administrador (y el dueño, que siempre puede todo).
  d.roles = d.roles.map(r => r.p && r.p.tasas === undefined ? Object.assign({}, r, { p: Object.assign({}, r.p, { tasas: r.id === 'admin' }) }) : r);
  if (d.negocio && (!Array.isArray(d.perfiles) || !d.perfiles.length)) { d.perfiles = [{ id: 'u0', n: 'Dueño', rol: 'dueno', pin: '', sucs: [], creado: Date.now() }]; d.ajustes = Object.assign({}, d.ajustes, { perfil: 'u0' }); }
  if (!Array.isArray(d.registro)) d.registro = [];
  if (!d.tasa || typeof d.tasa !== 'object' || (d.tasaVE && !d.tasa.valor)) d.tasa = { modo: 'auto', valor: d.tasaVE || 0, fuente: 'oficial', fecha: d.tasaFecha || '' };
  delete d.tasaVE; delete d.tasaFecha;
  if (!d.tasas || typeof d.tasas !== 'object') d.tasas = {};
  if (!Array.isArray(d.historialTasas)) d.historialTasas = [];
  if (!Array.isArray(d.grupos)) d.grupos = [];
  if (d.negocio && d.negocio.pedirRef === undefined) d.negocio = Object.assign({}, d.negocio, { pedirRef: d.negocio.pais === 'VE', tasaPago: d.negocio.tasaPago || {} });
  // Datos de antes de la cadena de integridad: se firman al cargarlos (la cadena empieza ahí).
  ['ventas', 'registro', 'cierres'].forEach((k, i) => { if (Array.isArray(d[k]) && d[k].some(x => !x.h)) encadenar(d[k], [firmaVenta, firmaRegistro, firmaCierre][i]); });
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
export function cambiar(fn) { const antes = S; S = Object.assign({}, S, fn(S)); firmarNuevos(antes); memo.clear(); guardar(); subs.forEach(f => f()); }
// Cadena de integridad: cada venta, cierre y cambio nuevo se firma con el hash del anterior.
function firmarNuevos(antes) {
  if (S.ventas !== (antes && antes.ventas) && S.ventas.some(v => !v.h)) encadenar(S.ventas, firmaVenta);
  if (S.registro !== (antes && antes.registro) && S.registro.some(v => !v.h)) encadenar(S.registro, firmaRegistro);
  if (S.cierres !== (antes && antes.cierres) && S.cierres.some(v => !v.h)) encadenar(S.cierres, firmaCierre);
}
export function revisarIntegridad() { return { ventas: revisar(S.ventas, firmaVenta), cierres: revisar(S.cierres, firmaCierre), registro: revisar(S.registro, firmaRegistro), n: S.ventas.length + S.cierres.length + S.registro.length }; }
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
// Grupos de ejemplo de cada tipo de negocio (por la abreviatura del producto).
const GRUPOS_EJ = {
  tienda: [['Víveres', ['HM', 'AR', 'CF', 'AC']], ['Bebidas', ['RF']], ['Lácteos y huevos', ['HV', 'QS']], ['Panadería', ['PN']], ['Limpieza', ['JB']]],
  comida: [['Platos', ['HB', 'PC', 'PZ', 'CB']], ['Acompañantes', ['EM', 'PF']], ['Bebidas', ['JN', 'RF', 'CF']]],
  citas: [['Cabello', ['CO', 'CB', 'TI', 'PI']], ['Uñas', ['MA', 'PE']]],
  online: [['Ropa', ['CA', 'GO', 'SU']], ['Accesorios', ['TZ', 'TB', 'ST']], ['Envíos', ['EN']]],
  indep: [['Diseño', ['LG', 'RS']], ['Servicios', ['FT', 'VT']], ['Clases y asesorías', ['CL', 'AS']]]
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
  const negocio = { nombre: cfg.nombre || nombreSugerido(T.id, cfg.escala), razon: cfg.razon || '', fiscal: cfg.fiscal || '', pais: P.id, tipo: T.id, escala: E ? 'empresa' : 'negocio', pays: cfg.pays && cfg.pays.length ? cfg.pays : P.pays.slice(), taxOn: cfg.taxOn ?? P.tax[1] > 0, taxIncl: cfg.taxIncl ?? true, sucursales, creado: Date.now(), pedirRef: P.id === 'VE', igtf: false, fiadoUsd: false, tasaPago: {} };
  const perfiles = [{ id: 'u0', n: (cfg.dueno || '').trim() || 'Dueño', rol: 'dueno', pin: '', sucs: [], creado: Date.now() }];
  if (conEjemplo) perfiles.push(
    { id: 'u1', n: 'Carla Méndez', rol: 'encargado', pin: '1111', sucs: [], creado: Date.now() },
    { id: 'u2', n: 'Luis Pino', rol: 'cajero', pin: '2222', sucs: sucursales.length > 1 ? [sucursales[0]] : [], creado: Date.now() });
  const grupos = (GRUPOS_EJ[T.id] || []).map((g, i) => ({ id: 'g' + i, n: g[0], c: i }));
  productos.forEach(p => { const i = (GRUPOS_EJ[T.id] || []).findIndex(g => g[1].includes(p.ab)); if (i >= 0) p.g = 'g' + i; });
  const base = { grupos, negocio, productos: productos.map(({ pop, ...p }) => p), clientes: [], ventas: [], abonos: [], gastos: [], cierres: [], perfiles, roles: ROLES_BASE(), registro: [], ajustes: Object.assign({}, S.ajustes, { perfil: 'u0' }) };
  // Países con moneda inestable sin fuente automática: la tasa arranca con la de referencia y se escribe a mano.
  if (P.usd2 && P.id !== 'AR') base.tasa = { modo: 'manual', valor: P.r, fuente: 'oficial', fecha: diaClave(Date.now()) };
  if (conEjemplo) Object.assign(base, ejemplo(negocio, productos, D, perfiles));
  else base.historialTasas = [];
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
  // En Venezuela y Argentina la tasa sube un poco cada día: cada venta y gasto guarda la de su día.
  const ve = neg.pais === 'VE', ar = !!pais(neg.pais).usd2, historialTasas = [];
  if (ve || ar) {
    const base = S.tasa.valor || (ve ? TASA_VE_RESPALDO : pais(neg.pais).r), ritmo = ve ? 0.006 : 0.003;
    const tasaDia = t => Math.round(base / (1 + ritmo * Math.max(0, (hoy0 - inicioDia(t)) / DIA)) * 100) / 100;
    ventas.forEach(v => { v.tasa = tasaDia(v.t); });
    gastos.forEach(g => { g.tasa = tasaDia(g.t); });
    for (let d = 63; d >= 1; d--) historialTasas.push({ dia: diaClave(hoy0 - d * DIA), f: 'oficial', v: tasaDia(hoy0 - d * DIA) });
  }
  // Lo vendido sale del inventario, pero el ejemplo arranca con lo que hay ahora.
  return { clientes, ventas, abonos, gastos, cierres: [], historialTasas };
}

// ---------- acciones ----------
// Parte fiada de una venta: con pagos combinados puede ser solo una parte (p. ej. la mitad por Pago Móvil y el resto fiado).
export const fiadoDe = v => v.pagos.reduce((a, p) => a + (p.m === 'Fiado' || p.m === 'Saldo a favor' ? p.v : 0), 0);
// ---------- tasas ----------
// La tasa principal (la de mostrar) y las extra (paralela, USDT, propia). Cada forma de pago puede cobrarse con una.
export function tasaDe(k) {
  const prin = S.tasa.valor || (S.negocio && S.negocio.pais === 'VE' ? TASA_VE_RESPALDO : S.negocio ? pais(S.negocio.pais).r : 1);
  if (!k || k === 'oficial') return prin;
  return (S.tasas[k] && S.tasas[k].valor) || prin;
}
export const tasaMetodo = m => tasaDe(((S.negocio && S.negocio.tasaPago) || {})[m]);
// Tasa del euro (bolívares o moneda local por euro). Si no se ha leído, se estima con el dólar.
export const tasaEuro = () => (S.tasas.euro && S.tasas.euro.valor) || tasaDe() * EUR_USD;
const dolarDe = (v, t) => S.negocio.pais === 'VE' ? v : v / (t || tasaDe());
const anotarHistorial = (s, f, v) => { const dia = diaClave(Date.now()), h = (s.historialTasas || []).filter(x => !(x.dia === dia && x.f === f)); return h.concat([{ dia, f, v }]).slice(-600); };
const juntar = pagos => pagos.map(p => p.m).join(' + ');
export const sigNumero = () => (S.ventas.length ? S.ventas[S.ventas.length - 1].n : 1000) + 1;
const stockMas = (productos, lineas, signo) => productos.map(p => { const q = lineas[p.id]; return q && p.q != null ? Object.assign({}, p, { q: Math.max(0, p.q + signo * q) }) : p; });
const porLinea = items => items.reduce((o, it) => (o[it.pid] = (o[it.pid] || 0) + it.q, o), {});
// Registro de cambios: quién hizo qué y cuándo (anulaciones, devoluciones, borrados, cambios del negocio).
const nota = (s, que) => ({ registro: (s.registro || []).concat([{ t: Date.now(), por: s.ajustes.perfil || '', que }]).slice(-500) });

export function vender({ items, pagos, cli, suc, fiado, total: conImpuesto, igtf }) {
  // Si el impuesto va aparte, el total cobrado es mayor que la suma de los productos.
  const total = conImpuesto || items.reduce((a, it) => a + it.q * it.p, 0);
  const venta = { id: id(), n: sigNumero(), t: Date.now(), items, total, pagos, cli: cli || '', suc: suc || S.negocio.sucursales[0], fiado: !!fiado, por: S.ajustes.perfil || '', tasa: S.tasa.valor || 0 };
  if (igtf) venta.igtf = igtf;
  if (S.negocio.euro) venta.tasaEur = tasaEuro();
  // Fiado en dólares (Argentina): la deuda se guarda también en dólares para que no pierda valor.
  if (S.negocio.fiadoUsd) venta.pagos = pagos.map(p => p.m === 'Fiado' || p.m === 'Saldo a favor' ? Object.assign({}, p, { fu: dolarDe(p.v) }) : p);
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
// pagos: cómo se devuelve el dinero (puede ser combinado). Si la venta tuvo parte fiada, eso se descuenta primero de la deuda.
export function devolver(vid, lineas, pagos, motivo, monto) {
  const v = S.ventas.find(x => x.id === vid);
  if (!v || v.anulada || v.dev) return null;
  const items = v.items.filter(it => lineas[it.pid] > 0).map(it => ({ pid: it.pid, n: it.n, q: -lineas[it.pid], p: it.p, c: it.c }));
  if (!items.length) return null;
  const total = monto ? -monto : items.reduce((a, it) => a + it.q * it.p, 0);
  const aDeuda = Math.min(-total, fiadoDe(v));
  const salen = (aDeuda > 0 ? [{ m: 'Fiado', v: aDeuda }] : []).concat(pagos || []).filter(p => p.v > 0).map(p => ({ m: p.m, v: -p.v }));
  const dev = { id: id(), n: sigNumero(), t: Date.now(), items, total, pagos: salen.length ? salen : [{ m: (pagos && pagos[0] && pagos[0].m) || 'Efectivo', v: total }], cli: v.cli, suc: v.suc, fiado: aDeuda > 0, por: S.ajustes.perfil || '', dev: v.n, motivo };
  const devuelto = Object.assign({}, v.devuelto); Object.keys(lineas).forEach(k => { if (lineas[k] > 0) devuelto[k] = (devuelto[k] || 0) + lineas[k]; });
  cambiar(s => Object.assign({
    ventas: s.ventas.map(x => x.id === vid ? Object.assign({}, x, { devuelto }) : x).concat([dev]),
    productos: stockMas(s.productos, lineas, 1)
  }, nota(s, 'Devolución de la venta #' + v.n + ' (' + motivo + ')')));
  return dev;
}
export function abonar(cli, pagos, nota) {
  const v = pagos.reduce((a, p) => a + p.v, 0);
  const ab = { id: id(), t: Date.now(), cli, v, m: juntar(pagos), pagos, por: S.ajustes.perfil || '', tasa: S.tasa.valor || 0 };
  if (S.negocio.fiadoUsd) ab.fu = dolarDe(v);
  if (nota) ab.nota = nota;
  cambiar(s => ({ abonos: s.abonos.concat([ab]) }));
}
export const pagosDeAbono = a => a.pagos || [{ m: a.m, v: a.v }];
const conPagos = g => g.pagos && g.pagos.length ? Object.assign({}, g, { m: juntar(g.pagos) }) : g;
export function anotarGasto(g) { cambiar(s => ({ gastos: s.gastos.concat([Object.assign({ id: id(), t: Date.now(), suc: s.negocio.sucursales[0], por: s.ajustes.perfil || '', tasa: s.tasa.valor || 0 }, conPagos(g))]) })); }
export function editarGasto(gid, g) { cambiar(s => ({ gastos: s.gastos.map(x => x.id === gid ? Object.assign({}, x, conPagos(g)) : x) })); }
export function borrarGasto(gid) {
  const g = S.gastos.find(x => x.id === gid); if (!g) return;
  cambiar(s => Object.assign({ gastos: s.gastos.filter(x => x.id !== gid) }, nota(s, 'Borró el gasto «' + g.n + '»')));
}
export function pagarGasto(gid) { cambiar(s => ({ gastos: s.gastos.map(g => g.id === gid ? Object.assign({}, g, { pagado: true, t: Date.now() }) : g) })); }
export function guardarProducto(p) { cambiar(s => ({ productos: p.id && s.productos.some(x => x.id === p.id) ? s.productos.map(x => { if (x.id !== p.id) return x; const n = Object.assign({}, x, p); if (p.imp === undefined) delete n.imp; return n; }) : s.productos.concat([Object.assign({ id: 'p' + id(), cod: '' }, p)]) })); }
// Borrar producto o cliente: se ocultan, pero su historial de ventas se queda.
export function borrarProducto(pid) {
  const p = S.productos.find(x => x.id === pid); if (!p) return;
  cambiar(s => Object.assign({ productos: s.productos.map(x => x.id === pid ? Object.assign({}, x, { borrado: Date.now() }) : x) }, nota(s, 'Borró el producto «' + p.n + '»')));
}
// Reponer: si cambió lo que cuesta, se guarda como costo de reposición (el de hoy) y se anota.
// ---------- grupos de productos ----------
export function guardarGrupo(g) {
  const nuevo = Object.assign({ id: 'g' + id(), c: S.grupos.length % 8 }, g);
  cambiar(s => ({ grupos: g.id && s.grupos.some(x => x.id === g.id) ? s.grupos.map(x => x.id === g.id ? Object.assign({}, x, g) : x) : s.grupos.concat([nuevo]) }));
  return g.id || nuevo.id;
}
// Borrar un grupo: sus productos quedan sin grupo (no se borra ninguno).
export function borrarGrupo(gid) {
  const g = S.grupos.find(x => x.id === gid); if (!g) return;
  cambiar(s => Object.assign({ grupos: s.grupos.filter(x => x.id !== gid), productos: s.productos.map(p => p.g === gid ? Object.assign({}, p, { g: '' }) : p) }, nota(s, 'Borró el grupo «' + g.n + '»')));
}
// Poner varios productos en un grupo de una vez (y sacar del grupo los que se desmarcaron).
export function asignarGrupo(gid, ids) {
  cambiar(s => ({ productos: s.productos.map(p => ids.includes(p.id) ? (p.g === gid ? p : Object.assign({}, p, { g: gid })) : p.g === gid ? Object.assign({}, p, { g: '' }) : p) }));
}
export function reponer(pid, cuanto, costo) {
  const p0 = S.productos.find(p => p.id === pid);
  const cambio = p0 && costo > 0 && Math.abs(costo - p0.c) > 0.004;
  cambiar(s => Object.assign({ productos: s.productos.map(p => p.id === pid && p.q != null ? Object.assign({}, p, { q: p.q + cuanto }, cambio ? { c: costo, cAntes: p.c } : {}) : p) }, cambio ? nota(s, 'Costo de «' + p0.n + '» pasó de ' + p0.c + ' a ' + costo) : {}));
}
// Ponerle (o cambiarle) el código de barras a un producto desde el escáner.
export function asignarCodigo(pid, cod) {
  const p0 = S.productos.find(p => p.id === pid); if (!p0) return;
  cambiar(s => Object.assign({ productos: s.productos.map(p => p.id === pid ? Object.assign({}, p, { cod }) : p) }, nota(s, 'Puso el código ' + cod + ' a «' + p0.n + '»' + (p0.cod ? ' (antes ' + p0.cod + ')' : ''))));
}
// Ajuste rápido de existencia (escáner): suma o resta unidades sin tocar el costo, y queda anotado.
export function ajustarStock(pid, cuanto) {
  const p0 = S.productos.find(p => p.id === pid); if (!p0 || !cuanto) return 0;
  const nuevo = Math.max(0, (p0.q || 0) + cuanto), real = nuevo - (p0.q || 0);
  cambiar(s => Object.assign({ productos: s.productos.map(p => p.id === pid ? Object.assign({}, p, { q: nuevo }) : p) }, nota(s, (real >= 0 ? 'Sumó ' + real + ' a' : 'Restó ' + -real + ' de') + ' «' + p0.n + '» con el escáner (' + (p0.q || 0) + ' → ' + nuevo + ')')));
  return nuevo;
}
// Remarcar: sube (o baja) los precios en bloque un porcentaje, con redondeo «bonito».
export function remarcar(ids, pct, redondo) {
  cambiar(s => Object.assign({ productos: s.productos.map(p => ids.includes(p.id) ? Object.assign({}, p, { p: redondo(p.p * (1 + pct / 100)), pAntes: p.p }) : p) }, nota(s, 'Remarcó ' + ids.length + ' precios ' + (pct > 0 ? '+' : '') + pct + ' %')));
}
export function nuevoCliente(c) { const nuevo = Object.assign({ id: 'c' + id(), tipo: 'persona', limite: 0, tel: '' }, c); cambiar(s => ({ clientes: s.clientes.concat([nuevo]) })); return nuevo; }
export function editarCliente(cid, c) { cambiar(s => ({ clientes: s.clientes.map(x => x.id === cid ? Object.assign({}, x, c) : x) })); }
export function borrarCliente(cid) {
  const c = S.clientes.find(x => x.id === cid); if (!c || deudaDe(cid) > 0.004) return false;
  cambiar(s => Object.assign({ clientes: s.clientes.map(x => x.id === cid ? Object.assign({}, x, { borrado: Date.now() }) : x) }, nota(s, 'Borró al cliente «' + c.n + '»')));
  return true;
}
// Cierre Z: numerado y correlativo, con lo vendido por forma de pago y los impuestos del día.
// Borrar los datos personales de un cliente: queda anónimo; sus compras siguen contando sin su nombre.
export function anonimizarCliente(cid) {
  const c = S.clientes.find(x => x.id === cid); if (!c || deudaDe(cid) > 0.004) return false;
  cambiar(s => Object.assign({ clientes: s.clientes.map(x => x.id === cid ? { id: x.id, n: 'Cliente borrado', tipo: x.tipo, tel: '', limite: 0, borrado: Date.now(), anonimo: true } : x) }, nota(s, 'Borró los datos personales de un cliente')));
  return true;
}
export function cerrarDia(contado, resumen) {
  const n = (S.cierres.length ? S.cierres[S.cierres.length - 1].n || S.cierres.length : 0) + 1;
  const hoy = S.ventas.filter(v => v.t >= inicioDia(Date.now()));
  const z = { id: id(), n, t: Date.now(), dia: diaClave(Date.now()), contado, resumen, por: S.ajustes.perfil || '',
    desde: hoy.length ? hoy[0].n : 0, hasta: hoy.length ? hoy[hoy.length - 1].n : 0, anuladas: hoy.filter(v => v.anulada).length,
    impuestos: hoy.filter(v => !v.anulada).reduce((a, v) => a + (v.imp || 0), 0), igtf: hoy.filter(v => !v.anulada).reduce((a, v) => a + (v.igtf || 0), 0) };
  cambiar(s => ({ cierres: s.cierres.concat([z]) }));
  return z;
}
// ---------- perfiles y permisos ----------
export const perfilActual = () => (S.perfiles || []).find(p => p.id === S.ajustes.perfil && !p.inactivo) || null;
export function entrar(pid) { cambiar(s => ({ ajustes: Object.assign({}, s.ajustes, { perfil: pid }) })); }
export function salir() { cambiar(s => ({ ajustes: Object.assign({}, s.ajustes, { perfil: '' }) })); }
export function guardarPerfil(p) {
  cambiar(s => ({ perfiles: p.id && s.perfiles.some(x => x.id === p.id) ? s.perfiles.map(x => x.id === p.id ? Object.assign({}, x, p) : x) : s.perfiles.concat([Object.assign({ id: 'u' + id(), pin: '', sucs: [], creado: Date.now() }, p)]) }));
}
// Cambiar o quitar el PIN de un perfil (en el registro se anota quién lo cambió, nunca el PIN).
export function cambiarPin(pid, pin) {
  const p0 = S.perfiles.find(p => p.id === pid); if (!p0) return;
  cambiar(s => Object.assign({ perfiles: s.perfiles.map(p => p.id === pid ? Object.assign({}, p, { pin }) : p) }, nota(s, (pin ? (p0.pin ? 'Cambió' : 'Puso') : 'Quitó') + ' el PIN de ' + p0.n)));
}
// Eliminar un perfil: ya no aparece ni puede entrar, pero sus ventas y su nombre se quedan en el historial.
export function borrarPerfil(pid) {
  const p0 = S.perfiles.find(p => p.id === pid); if (!p0 || p0.rol === 'dueno') return;
  cambiar(s => Object.assign({ perfiles: s.perfiles.map(p => p.id === pid ? Object.assign({}, p, { borrado: Date.now(), inactivo: true, pin: '' }) : p) }, nota(s, 'Eliminó el perfil de ' + p0.n)));
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
export function guardarTasa(t, redondo) {
  cambiar(s => {
    const out = { tasa: Object.assign({}, s.tasa, t, t.valor ? { fecha: diaClave(Date.now()) } : {}) };
    if (t.valor) {
      out.historialTasas = anotarHistorial(s, out.tasa.fuente || 'oficial', t.valor);
      // Precios atados al dólar: se recalculan con la tasa nueva.
      if (redondo && s.negocio && s.negocio.pais !== 'VE' && s.productos.some(p => p.usd > 0)) out.productos = s.productos.map(p => p.usd > 0 ? Object.assign({}, p, { p: redondo(p.usd * t.valor) }) : p);
    }
    return out;
  });
}
export function guardarTasaExtra(k, t) {
  cambiar(s => {
    const x = Object.assign({}, s.tasas[k], t, t.valor ? { fecha: diaClave(Date.now()) } : {});
    return Object.assign({ tasas: Object.assign({}, s.tasas, { [k]: x }) }, t.valor ? { historialTasas: anotarHistorial(s, k, t.valor) } : {});
  });
}
// Quitar ceros (redenominación): divide todos los montos guardados. Antes se aparta una copia.
export async function quitarCeros(n) {
  await apartar('antes-de-quitar-ceros');
  const f = Math.pow(10, n), q = v => typeof v === 'number' ? Math.round(v / f * 100) / 100 : v;
  const ve = S.negocio.pais === 'VE';
  const pagosQ = ps => (ps || []).map(p => Object.assign({}, p, { v: q(p.v) }));
  cambiar(s => {
    const tasaQ = x => x ? Object.assign({}, x, { valor: q(x.valor) }) : x;
    // Si la tasa nunca se leyó, se parte de la de referencia para no perderla.
    const out = { tasa: Object.assign({}, s.tasa, { valor: q(s.tasa.valor || tasaDe()) }), tasas: Object.keys(s.tasas).reduce((o, k) => (o[k] = tasaQ(s.tasas[k]), o), {}), historialTasas: s.historialTasas.map(h => Object.assign({}, h, { v: q(h.v) })),
      ventas: s.ventas.map(v => ve ? Object.assign({}, v, { tasa: q(v.tasa) }) : v), gastos: s.gastos.map(g => ve ? Object.assign({}, g, { tasa: q(g.tasa) }) : g) };
    // En Venezuela los precios están en dólares: solo cambia la tasa. En los demás países se dividen todos los montos.
    if (!ve) Object.assign(out, {
      productos: s.productos.map(p => Object.assign({}, p, { p: q(p.p), c: q(p.c) })),
      ventas: s.ventas.map(v => Object.assign({}, v, { h: undefined, total: q(v.total), imp: q(v.imp), igtf: q(v.igtf), recibido: q(v.recibido), items: v.items.map(it => Object.assign({}, it, { p: q(it.p), c: q(it.c) })), pagos: pagosQ(v.pagos) })),
      abonos: s.abonos.map(a => Object.assign({}, a, { v: q(a.v), pagos: a.pagos ? pagosQ(a.pagos) : a.pagos })),
      gastos: s.gastos.map(g => Object.assign({}, g, { v: q(g.v), pagos: g.pagos ? pagosQ(g.pagos) : g.pagos })),
      clientes: s.clientes.map(c => Object.assign({}, c, { limite: q(c.limite) }))
    });
    return Object.assign(out, nota(s, 'Le quitó ' + n + ' ceros a la moneda'));
  });
}
// Conciliación: marca como verificados los pagos cuya referencia aparece en el estado de cuenta del banco.
export function verificarPagos(claves) {
  if (!claves.length) return;
  cambiar(s => Object.assign({ ventas: s.ventas.map(v => v.pagos.some((p, k) => claves.includes(v.id + ':' + k)) ? Object.assign({}, v, { pagos: v.pagos.map((p, k) => claves.includes(v.id + ':' + k) ? Object.assign({}, p, { ok: Date.now() }) : p) }) : v) }, nota(s, 'Verificó ' + claves.length + ' pagos con el banco')));
}
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
    let total = 0, cost = 0, fiado = 0, totalAlt = 0, ganAlt = 0, repo = 0, totalEur = 0, ganEur = 0;
    // En Venezuela y Argentina: lo mismo en la otra moneda (Bs o US$) con la tasa del día de cada venta.
    const ve = S.negocio.pais === 'VE', alt = (x, t) => ve ? x * (t || tasaDe()) : x / (t || tasaDe());
    // En euros, con la tasa del euro de su día (o, si no se guardó, la del dólar de ese día por la relación de hoy).
    const rel = tasaEuro() / tasaDe(), eur = (x, v) => { const te = v.tasaEur || (v.tasa || tasaDe()) * rel; return ve ? x * (v.tasa || tasaDe()) / te : x / te; };
    const costoHoy = {}; S.productos.forEach(p => { costoHoy[p.id] = p.c; });
    vs.forEach(v => {
      total += v.total; cost += costo(v);
      totalAlt += alt(v.total, v.tasa); ganAlt += alt(v.total - costo(v), v.tasa); totalEur += eur(v.total, v); ganEur += eur(v.total - costo(v), v);
      v.items.forEach(it => { repo += it.q * (it.p - (costoHoy[it.pid] != null ? costoHoy[it.pid] : it.c)); });
      fiado += fiadoDe(v);
      v.pagos.forEach(p => { porPago[p.m] = (porPago[p.m] || 0) + p.v; });
      porHora[new Date(v.t).getHours()] += v.total;
      porSuc[v.suc] = (porSuc[v.suc] || 0) + v.total;
      porPersona[v.por || ''] = (porPersona[v.por || ''] || 0) + v.total;
      v.items.forEach(it => { const x = porProd[it.pid] || (porProd[it.pid] = { n: it.n, q: 0, v: 0, g: 0 }); x.q += it.q; x.v += it.q * it.p; x.g += it.q * (it.p - it.c); });
    });
    const n = vs.filter(v => !v.dev).length;
    return { n, total, ganancia: total - cost, costo: cost, fiado, porPago, porHora, porSuc, porProd, porPersona, ticket: n ? total / n : 0, totalAlt, ganAlt, totalEur, ganEur, ganReposicion: repo };
  });
}

export function serieDias(dias, suc) {
  return m('sd' + dias + suc + diaClave(Date.now()), () => {
    const hoy0 = inicioDia(Date.now()), out = [];
    for (let d = dias - 1; d >= 0; d--) {
      const a = hoy0 - d * DIA, r = resumen(a, a + DIA, suc);
      out.push({ t: a, total: r.total, ganancia: r.ganancia, porSuc: r.porSuc, n: r.n, totalAlt: r.totalAlt, totalEur: r.totalEur });
    }
    return out;
  });
}

export function deudaDe(cid) {
  return m('de' + cid, () => {
    // Fiado en dólares: se suma en dólares y se pasa a la moneda local con la tasa de hoy.
    // Lo fiado antes de activarlo sigue en pesos.
    if (S.negocio.pais !== 'VE') {
      let pesos = 0, usd = 0;
      vigentes().filter(v => v.cli === cid).forEach(v => v.pagos.forEach(p => { if (p.m === 'Fiado' || p.m === 'Saldo a favor') { if (p.fu != null) usd += p.fu; else pesos += p.v; } }));
      S.abonos.filter(a => a.cli === cid).forEach(x => { if (x.fu != null) usd -= x.fu; else pesos -= x.v; });
      return pesos + usd * tasaDe();
    }
    return vigentes().filter(v => v.cli === cid).reduce((a, v) => a + fiadoDe(v), 0) - S.abonos.filter(a => a.cli === cid).reduce((a, x) => a + x.v, 0);
  });
}
export function deudores() {
  return m('deudores', () => listaClientes().map(c => {
    const fiados = vigentes().filter(v => v.cli === c.id && !v.dev && fiadoDe(v) > 0);
    const deuda = deudaDe(c.id);
    const desde = fiados.length ? fiados[0].t : 0;
    const suyas = vigentes().filter(v => v.cli === c.id && !v.dev);
    const ultima = suyas.reduce((a, v) => Math.max(a, v.t), 0);
    return Object.assign({}, c, { deuda: Math.max(0, deuda), saldo: Math.max(0, -deuda), desde, ultima, compras: suyas.length });
  }).sort((a, b) => b.deuda - a.deuda));
}
export function porPagar() { return m('pp', () => S.gastos.filter(g => !g.pagado).sort((a, b) => a.vence - b.vence)); }
// Un gasto en la otra moneda, con la tasa de su día.
export const gastoAlt = g => S.negocio.pais === 'VE' ? g.v * (g.tasa || tasaDe()) : g.v / (g.tasa || tasaDe());
export const gastoEur = g => { const t = g.tasa || tasaDe(), te = t * tasaEuro() / tasaDe(); return S.negocio.pais === 'VE' ? g.v * t / te : g.v / te; };
export function gastosEntre(desde, hasta) { return m('ge' + desde + hasta, () => S.gastos.filter(g => g.pagado && g.t >= desde && g.t < hasta)); }
// Productos que se venden por debajo de lo que cuesta reponerlos (o casi sin ganancia).
export function bajoCosto() { return m('bc', () => listaProductos().filter(p => p.c > 0 && p.p < p.c * 1.05)); }
export function bajoMinimo() { return m('bm', () => listaProductos().filter(p => p.q != null && p.min > 0 && p.q < p.min)); }
export function cierreDeHoy() { const k = diaClave(Date.now()); return S.cierres.find(c => c.dia === k) || null; }
