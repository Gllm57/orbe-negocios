// Carrito de venta: cantidades por línea (producto o producto~variante, con decimales si se vende por peso),
// promociones automáticas y descuentos a mano (por línea o a toda la venta).
// Cada línea queda con su precio de lista (pLista) y el precio final (p): así totales, impuestos, ganancias y reportes no cambian.
import { promosVigentes, promoAplica } from './datos.js';

// libres: cargos escritos al momento (mano de obra, instalación…) que no están en la lista de productos.
export const nuevoCarrito = () => ({ q: {}, meta: {}, desc: null, libres: {} });
export const UNIDADES = { kg: 'kg', g: 'g', l: 'l', m: 'm' };
export const porPeso = p => !!(p && p.u && UNIDADES[p.u]);
// Cantidad bonita: «3», «0,75 kg».
export const verQ = (q, u) => (Number.isInteger(q) ? String(q) : String(Math.round(q * 1000) / 1000).replace('.', ',')) + (u ? ' ' + u : '');
export const varDe = (p, vid) => (p && Array.isArray(p.vars) ? p.vars.find(v => v.id === vid) : null) || null;
// Existencia disponible de la línea (de la variante si tiene).
export const existencia = (p, vid) => { const v = varDe(p, vid); return v ? (v.q != null ? v.q : null) : p.q; };

// Mejor promoción para una línea (la que deja el precio más bajo).
function promoDe(p, q, pLista, promos) {
  let mejor = null;
  promos.filter(x => promoAplica(x, p)).forEach(x => {
    let precio = pLista, txt = '';
    if (x.tipo === 'pct' && x.v > 0) { precio = pLista * (1 - x.v / 100); txt = '-' + x.v + ' %'; }
    else if (x.tipo === 'nxm' && x.n1 > x.n2 && q >= x.n1 && !porPeso(p)) { const gratis = Math.floor(q / x.n1) * (x.n1 - x.n2); precio = pLista * (q - gratis) / q; txt = x.n1 + 'x' + x.n2; }
    else if (x.tipo === 'desde' && x.n1 > 0 && q >= x.n1 && x.precio > 0 && x.precio < pLista) { precio = x.precio; txt = 'desde ' + verQ(x.n1); }
    if (precio < pLista - 1e-9 && (!mejor || precio < mejor.p)) mejor = { p: precio, txt, n: x.n, id: x.id };
  });
  return mejor;
}

// Líneas listas para cobrar.
export function lineasDe(cart, prods) {
  const promos = promosVigentes();
  const items = [];
  Object.keys(cart.q).forEach(k => {
    const q = cart.q[k]; if (!(q > 0)) return;
    const lib = (cart.libres || {})[k];
    if (lib) { const pm = (cart.meta[k] || {}).pm, desc = (cart.meta[k] || {}).desc || 0, base = pm != null ? pm : lib.p; items.push(Object.assign({ pid: k, n: lib.n, q, p: base * (1 - desc / 100), c: 0, k, libre: true }, desc ? { desc, pLista: base } : {})); return; }
    const [pid, vid] = k.split('~'), p = prods.find(x => x.id === pid); if (!p) return;
    const v = varDe(p, vid), meta = cart.meta[k] || {};
    const base = v && v.p > 0 ? v.p : p.p, pLista = meta.pm != null ? meta.pm : base;
    const it = Object.assign({ pid: p.id, n: v ? p.n + ' · ' + v.n : p.n, q, p: pLista, c: p.c, k }, v ? { vid: v.id, nb: p.n } : {}, p.imp != null ? { imp: p.imp } : {}, porPeso(p) ? { u: p.u } : {});
    if (meta.desc > 0) { it.p = pLista * (1 - meta.desc / 100); it.desc = meta.desc; }
    else { const pr = promoDe(p, q, pLista, promos); if (pr) { it.p = pr.p; it.promo = pr.n === pr.txt ? pr.n : pr.n + ' (' + pr.txt + ')'; } }
    if (Math.abs(it.p - base) > 1e-9 || meta.pm != null) it.pLista = base;
    items.push(it);
  });
  // Descuento a toda la venta: se reparte entre las líneas, en proporción.
  const sub = items.reduce((a, it) => a + it.q * it.p, 0);
  let descGlobal = 0;
  if (cart.desc && sub > 0) {
    const monto = cart.desc.tipo === 'pct' ? sub * Math.min(100, cart.desc.v) / 100 : Math.min(sub, cart.desc.v);
    const f = 1 - monto / sub; descGlobal = monto;
    items.forEach(it => { it.pLista = it.pLista != null ? it.pLista : it.p; it.p = it.p * f; });
  }
  const ahorro = items.reduce((a, it) => a + (it.pLista != null ? it.q * (it.pLista - it.p) : 0), 0);
  return { items, ahorro, descGlobal, descTxt: cart.desc ? (cart.desc.tipo === 'pct' ? cart.desc.v + ' %' : '') : '' };
}
// Cuántas cosas lleva: los productos por peso cuentan como uno.
export const cuantos = items => items.reduce((a, it) => a + (it.u ? 1 : it.q), 0);
