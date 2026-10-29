// Cargar la factura del proveedor con una foto: se lee el texto, se arman las líneas (cantidad, producto, costo)
// y se revisan antes de sumarlas al inventario. Los productos que no existen se crean con un precio sugerido.
import { html, useState } from '../lib/preact-htm.js';
import { useApp } from '../ctx.js';
import { listaProductos, reponer, guardarProducto, anotarGasto, precioMeta, margenMeta } from '../datos.js';
import { Hoja, Icono, Chips, Interruptor, avisar } from '../ui.js';
import { buscar, normal } from '../buscar.js';
import { textosProducto, iniciales2 } from './grupos.js';
import { leerTexto } from './escaner.js';
import { numero } from './pagos.js';

// ---------- leer el texto de la factura ----------
const NO_PRODUCTO = /\b(sub\s?total|total|iva|igv|itbms|impuesto|rif|nit|cuit|ruc|factura|fecha|tel[eé]fono|telf?|direcci[oó]n|cliente|vendedor|caja|cambio|efectivo|pago|gracias|descuento|base imponible|n[°º]|control)\b/i;
// Números que son parte del nombre (1 kg, 500 g, 2 L, x 30): no se toman como cantidad ni precio.
const MEDIDA = /(\bx\s?\d+\b|\d+(?:[.,]\d+)?\s?(?:kg|kgs|g|gr|grs|l|lt|lts|ml|cc|cm|mm|m|oz|lb|und|un|uds)\b)/gi;
const NUM = /\d{1,3}(?:[.,]\d{3})+(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?/g;
export function leerFactura(texto) {
  const filas = texto.split(/\n+/).map(x => x.replace(/[|_]/g, ' ').replace(/\s+/g, ' ').trim()).filter(Boolean);
  let total = 0, proveedor = '';
  const lineas = [];
  filas.forEach((f, i) => {
    if (!proveedor && i < 4 && /[a-záéíóúñ]{3}/i.test(f) && !NO_PRODUCTO.test(f) && !/\d{3,}/.test(f)) proveedor = f.replace(/[^\p{L}\p{N} .,&'-]/gu, '').trim();
    if (/\btotal\b/i.test(f) && !/sub\s?total/i.test(f)) { const ns = f.replace(MEDIDA, ' ').match(NUM); if (ns) total = numero(ns[ns.length - 1]); return; }
    if (NO_PRODUCTO.test(f)) return;
    const sinMedida = f.replace(MEDIDA, m => ' '.repeat(m.length));
    const ns = (sinMedida.match(NUM) || []).map(numero);
    const nombre = f.replace(/^\s*\d+(?:[.,]\d+)?\s*(x\s)?/i, '').replace(/(\s+\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2})?)+\s*$/g, '').replace(/[^\p{L}\p{N} .,%/-]/gu, ' ').replace(/\s+/g, ' ').trim();
    if ((nombre.match(/\p{L}/gu) || []).length < 3 || !ns.length) return;
    let q = 1, costo = ns[ns.length - 1], tot = ns[ns.length - 1];
    if (ns.length >= 3) { q = ns[0]; costo = ns[ns.length - 2]; tot = ns[ns.length - 1]; if (q > 0 && Math.abs(q * costo - tot) > Math.max(0.05, tot * 0.03)) costo = tot / q; }
    else if (ns.length === 2) {
      const [a, b] = ns;
      if (Number.isInteger(a) && a > 0 && a < 1000 && /^\s*\d/.test(f)) { q = a; tot = b; costo = b / a; }
      else { costo = a; tot = b; q = a > 0 ? Math.max(1, Math.round(b / a)) : 1; }
    }
    if (!(q > 0) || !(costo > 0)) return;
    lineas.push({ txt: nombre, q: Math.round(q * 1000) / 1000, costo: Math.round(costo * 100) / 100, tot: Math.round(tot * 100) / 100 });
  });
  return { proveedor, total: total || Math.round(lineas.reduce((a, l) => a + l.tot, 0) * 100) / 100, lineas };
}

// Foto → lienzo en gris y con más contraste (se lee mejor).
function aLienzo(archivo) {
  return new Promise((ok, mal) => {
    const url = URL.createObjectURL(archivo), img = new Image();
    img.onload = () => { const k = Math.min(1, 2200 / Math.max(img.width, img.height)), cv = document.createElement('canvas'); cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k); const cx = cv.getContext('2d'); cx.filter = 'grayscale(1) contrast(1.4)'; cx.drawImage(img, 0, 0, cv.width, cv.height); URL.revokeObjectURL(url); ok(cv); };
    img.onerror = () => { URL.revokeObjectURL(url); mal(new Error('imagen')); };
    img.src = url;
  });
}

export function Factura({ d, cerrar }) {
  const { S, D, T, tel, puede } = useApp();
  const prods = listaProductos().filter(p => p.q != null);
  const [paso, setPaso] = useState('foto');
  const [avance, setAvance] = useState(0);
  const [filas, setFilas] = useState([]);
  const [proveedor, setProveedor] = useState('');
  const [gasto, setGasto] = useState(true);
  const [pagada, setPagada] = useState(true);
  // El producto más parecido al nombre leído (o ninguno: se crea nuevo).
  // Se buscan las palabras que importan (sin «de», «la», medidas ni números) y tienen que estar todas.
  const clave = txt => normal(txt).replace(MEDIDA, ' ').split(' ').filter(w => w.length > 2 && !/^\d/.test(w) && !/^(del|las|los|con|para|por|und|uds)$/.test(w)).join(' ');
  const parecido = txt => { const k = clave(txt); if (!k) return ''; const r = buscar(prods, k, textosProducto(S)); return r.length ? r[0].id : ''; };
  const candidatos = txt => buscar(prods, txt, textosProducto(S), true).slice(0, 6);
  const elegir = async e => {
    const a = e.target.files && e.target.files[0]; e.target.value = '';
    if (!a) return;
    setPaso('leyendo'); setAvance(0);
    try {
      const cv = await aLienzo(a), txt = await leerTexto(cv, setAvance), r = leerFactura(txt);
      if (!r.lineas.length) { setPaso('foto'); avisar('No encontré productos en la foto. Prueba de frente, con buena luz y sin sombras.'); return; }
      setProveedor(r.proveedor);
      setFilas(r.lineas.map((l, i) => ({ i, on: true, txt: l.txt, q: String(l.q).replace('.', ','), costo: String(l.costo).replace('.', ','), pid: parecido(l.txt) })));
      setPaso('revisar');
    } catch (er) { setPaso('foto'); avisar(navigator.onLine ? 'No pude leer la foto. Prueba otra vez.' : 'La primera vez que lees una factura necesitas internet'); }
  };
  const pon = (i, o) => setFilas(fs => fs.map(f => f.i === i ? Object.assign({}, f, o) : f));
  const usadas = filas.filter(f => f.on && numero(f.q) > 0);
  const totalF = usadas.reduce((a, f) => a + numero(f.q) * numero(f.costo), 0);
  const aplicar = c => {
    if (!puede('reponer') && !puede('productos')) { avisar('Tu perfil no puede cambiar el inventario'); return; }
    if (!usadas.length) { avisar('Marca al menos una línea'); return; }
    let nuevos = 0, repuestos = 0;
    usadas.forEach(f => {
      const q = numero(f.q), costo = numero(f.costo);
      if (f.pid) { reponer(f.pid, q, costo); repuestos++; }
      else if (puede('productos')) { const p = { c: costo }; guardarProducto({ n: f.txt.trim(), ab: iniciales2(f.txt.trim()), p: D.bonito(precioMeta(p)), c: costo, q, min: 0, cod: '' }); nuevos++; }
    });
    if (gasto && puede('gastos') && totalF > 0) anotarGasto(Object.assign({ n: 'Factura ' + (proveedor.trim() || 'de proveedor'), cat: 'Mercancía', v: D.redondo(totalF), m: S.negocio.pays[0] }, pagada ? { pagado: true, pagos: [{ m: S.negocio.pays[0], v: D.redondo(totalF) }] } : { pagado: false, vence: Date.now() + 15 * 86400000 }));
    c(() => avisar(repuestos + (repuestos === 1 ? ' producto repuesto' : ' productos repuestos') + (nuevos ? ' · ' + nuevos + (nuevos === 1 ? ' nuevo' : ' nuevos') : '')));
  };
  return html`<${Hoja} titulo="Cargar factura del proveedor" onCerrar=${cerrar} contenido=${c => ({
    cuerpo: paso === 'foto' ? html`
        <span class="sub" style="line-height:1.45;margin-top:-6px">Tómale una foto a la factura: Orbe lee los productos, las cantidades y los costos. Tú revisas antes de guardar.</span>
        <label class="factura-foto toca"><span class="ic t-vio" style="width:56px;height:56px;border-radius:18px"><${Icono} n="camara" t=${26} /></span><b>Tomar o elegir la foto</b><span class="sub">De frente, con buena luz y que se vea entera</span><input type="file" accept="image/*" capture="environment" hidden onChange=${elegir} /></label>
        <span class="sub faint" style="font-size:12px;line-height:1.4">La primera vez descarga el lector de texto (unos 6 MB); después funciona sin internet.</span>`
      : paso === 'leyendo' ? html`<div class="pila entra" style="align-items:center;text-align:center;padding:30px 10px"><i class="girando" style="width:34px;height:34px;color:var(--accent)"></i><b>Leyendo la factura… ${Math.round(avance * 100)} %</b><span class="sub">Esto toma unos segundos.</span></div>`
      : html`
        <label class="campo"><span>Proveedor</span><input type="text" value=${proveedor} placeholder="Nombre del proveedor" autocomplete="off" onInput=${e => setProveedor(e.target.value)} /></label>
        <span class="sub">${filas.length} ${filas.length === 1 ? 'línea leída' : 'líneas leídas'}. Revisa cada una: a cuál producto va, cuántos y a cuánto.</span>
        <div class="pila" style="gap:8px">${filas.map(f => { const cand = candidatos(f.txt), p = prods.find(x => x.id === f.pid); return html`<div class=${'factura-fila entra' + (f.on ? '' : ' fuera')} key=${f.i}>
          <div class="fila" style="gap:8px"><button type="button" class=${'casilla toca' + (f.on ? ' on' : '')} role="checkbox" aria-checked=${f.on ? 'true' : 'false'} aria-label="Usar esta línea" onClick=${() => pon(f.i, { on: !f.on })}>${f.on && html`<${Icono} n="check" t=${13} g=${3} />`}</button>
            <input type="text" class="crece" value=${f.txt} aria-label="Nombre en la factura" onInput=${e => pon(f.i, { txt: e.target.value })} /></div>
          <select value=${f.pid} aria-label="Producto" onChange=${e => pon(f.i, { pid: e.target.value })}>
            <option value="">➕ Producto nuevo</option>
            ${cand.concat(p && !cand.includes(p) ? [p] : []).map(x => html`<option value=${x.id}>${x.n} (tienes ${x.q})</option>`)}
            ${prods.filter(x => !cand.includes(x) && x !== p).map(x => html`<option value=${x.id}>${x.n}</option>`)}
          </select>
          <div class="variante-datos" style="grid-template-columns:70px minmax(0,1fr) minmax(0,1fr)">
            <label><span>Cantidad</span><input class="num" type="text" inputmode="decimal" value=${f.q} aria-label="Cantidad" onInput=${e => pon(f.i, { q: e.target.value })} /></label>
            <label><span>Costo c/u</span><input class="num" type="text" inputmode="decimal" value=${f.costo} aria-label="Costo" onInput=${e => pon(f.i, { costo: e.target.value })} /></label>
            <label><span>${p ? 'Antes costaba' : 'Precio sugerido'}</span><b class="num" style="min-height:38px;display:flex;align-items:center;font-size:14px;color:${p && numero(f.costo) > p.c + 0.004 ? 'var(--amber-text)' : 'var(--ink)'}">${p ? D.m(p.c) : D.m(D.bonito(precioMeta({ c: numero(f.costo) })))}</b></label>
          </div></div>`; })}</div>
        <div class="tarjeta fila" style="box-shadow:none;background:var(--fill2)"><span class="crece sub">Total de lo marcado</span><b class="num" style="font-size:18px">${D.m(totalF)}</b></div>
        ${puede('gastos') && html`<${Interruptor} on=${gasto} onCambio=${setGasto} titulo="Anotarla como gasto" sub="Compra de mercancía" />
          ${gasto && html`<${Chips} opciones=${[{ v: true, n: 'Ya la pagué' }, { v: false, n: 'La pago después (15 días)' }]} valor=${pagada} onCambio=${setPagada} chico />`}`}
        <span class="sub faint" style="font-size:12px">Los productos nuevos se crean con un precio para ganar ${Math.round(margenMeta() * 100)} %. Lo cambias cuando quieras.</span>`,
    pie: paso === 'revisar' ? html`<button type="button" class="btn toca" onClick=${() => aplicar(c)}>Sumar ${usadas.length} ${usadas.length === 1 ? 'producto' : 'productos'} al inventario</button><button type="button" class="btn2 toca" style="min-height:50px;border-radius:25px" onClick=${() => { setPaso('foto'); setFilas([]); }}>Otra foto</button>` : null
  })} />`;
}
