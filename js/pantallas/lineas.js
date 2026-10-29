// Hojas de la venta: elegir variante (talla, color…), cantidad por peso, cambiar una línea y descuento a toda la venta.
import { html, useState } from '../lib/preact-htm.js';
import { useApp } from '../ctx.js';
import { listaProductos, guardarProducto } from '../datos.js';
import { Hoja, Icono, Chips, Interruptor, avisar } from '../ui.js';
import { numero } from './pagos.js';
import { verQ, porPeso } from '../carrito.js';

// ---------- variante ----------
export function Variante({ d, cerrar }) {
  const { D } = useApp();
  const p = listaProductos().find(x => x.id === d.pid);
  if (!p) return null;
  return html`<${Hoja} titulo=${p.n} onCerrar=${cerrar} contenido=${c => ({
    cuerpo: html`<span class="sub" style="margin-top:-6px">¿Cuál?</span>
      <div class="variantes">${(p.vars || []).map((v, i) => { const sin = p.q != null && (v.q || 0) <= 0; return html`
        <button type="button" key=${v.id} class=${'variante toca entra' + (sin ? ' sin' : '')} style=${{ '--i': i }} disabled=${sin} onClick=${() => c(() => d.onElegir(v.id))}>
          <b>${v.n}</b><span class="sub num">${v.p > 0 ? D.m(v.p) : D.m(p.p)}${p.q != null ? ' · ' + (sin ? 'agotada' : verQ(v.q || 0) + ' disp.') : ''}</span>
        </button>`; })}</div>`
  })} />`;
}

// ---------- cantidad por peso o medida ----------
const RAPIDAS = { kg: [0.25, 0.5, 0.75, 1, 1.5, 2], g: [100, 250, 500, 750, 1000], l: [0.5, 1, 2, 5], m: [0.5, 1, 2, 5, 10] };
export function Cantidad({ d, cerrar }) {
  const { D } = useApp();
  const p = listaProductos().find(x => x.id === d.pid);
  const [modo, setModo] = useState('cant');
  const [txt, setTxt] = useState(d.q ? String(d.q).replace('.', ',') : '');
  if (!p) return null;
  const v = d.vid && (p.vars || []).find(x => x.id === d.vid), precio = v && v.p > 0 ? v.p : p.p;
  const x = numero(txt), q = modo === 'cant' ? x : precio > 0 ? x / precio : 0, qR = Math.round(q * 1000) / 1000;
  const listo = c => { if (!(qR > 0)) { avisar('Escribe cuánto lleva'); return; } c(() => d.onListo(qR)); };
  return html`<${Hoja} titulo=${p.n + (v ? ' · ' + v.n : '')} onCerrar=${cerrar} contenido=${c => ({
    cuerpo: html`<span class="sub" style="margin-top:-6px">${D.m(precio)} por ${p.u}</span>
      <div class="segmento" style="width:100%">${[['cant', 'Por ' + ({ kg: 'peso', g: 'peso', l: 'litros', m: 'metros' }[p.u] || 'cantidad')], ['monto', 'Por monto']].map(o => html`<button type="button" style="flex:1" class=${modo === o[0] ? 'on' : ''} onClick=${() => { setModo(o[0]); setTxt(''); }}>${o[1]}</button>`)}</div>
      ${modo === 'cant' && html`<div class="chips">${(RAPIDAS[p.u] || [1]).map(r => html`<button type="button" class=${'chip toca' + (Math.abs(x - r) < 1e-9 ? ' on' : '')} onClick=${() => setTxt(String(r).replace('.', ','))}>${verQ(r, p.u)}</button>`)}</div>`}
      <label class="campo"><span>${modo === 'cant' ? 'Cantidad en ' + p.u : 'Cuánto quiere gastar'}</span><input class="grande num" type="text" inputmode="decimal" autocomplete="off" value=${txt} placeholder="0" aria-label=${modo === 'cant' ? 'Cantidad' : 'Monto'} onInput=${e => setTxt(e.target.value)} /></label>
      ${qR > 0 && html`<div class="tarjeta fila entra" style="box-shadow:none;background:var(--fill2)"><span class="crece sub">${verQ(qR, p.u)} × ${D.m(precio)}</span><b class="num" style="font-size:18px">${D.m(qR * precio)}</b></div>`}`,
    pie: html`<button type="button" class=${'btn toca' + (qR > 0 ? '' : ' apagado')} onClick=${() => listo(c)}>${d.q ? 'Cambiar' : 'Agregar'}${qR > 0 ? ' ' + verQ(qR, p.u) : ''}</button>`
  })} />`;
}

// ---------- una línea de la venta ----------
export function Linea({ d, cerrar }) {
  const { D, puede } = useApp();
  const it = (d.items || []).find(x => x.k === d.k) || d.it;
  const [cant, setCant] = useState(it ? String(it.q).replace('.', ',') : '1');
  const [precio, setPrecio] = useState(it ? String(it.pLista != null ? it.pLista : it.p).replace('.', ',') : '');
  const [desc, setDesc] = useState(it && it.desc ? it.desc : 0);
  const [otro, setOtro] = useState('');
  if (!it) return null;
  const pd = puede('descuentos'), base = it.pLista != null ? it.pLista : it.p;
  const qN = numero(cant), pN = numero(precio), dN = desc === 'otro' ? numero(otro) : desc;
  const final = pN * (1 - Math.min(100, dN || 0) / 100);
  const listo = c => {
    if (!(qN > 0)) { avisar('La cantidad debe ser mayor que cero'); return; }
    if (!it.u && !Number.isInteger(qN)) { avisar('Este producto se vende por unidad'); return; }
    if (pd) d.onMeta(Object.assign({}, Math.abs(pN - base) > 1e-9 ? { pm: pN } : {}, dN > 0 ? { desc: Math.min(100, dN) } : {}));
    d.onCant(qN);
    c(() => {});
  };
  return html`<${Hoja} titulo=${it.n} onCerrar=${cerrar} contenido=${c => ({
    cuerpo: html`
      <label class="campo"><span>Cantidad${it.u ? ' en ' + it.u : ''}</span><input class="num" type="text" inputmode="decimal" autocomplete="off" value=${cant} aria-label="Cantidad" onInput=${e => setCant(e.target.value)} /></label>
      ${pd ? html`
        <label class="campo"><span>Precio ${it.u ? 'por ' + it.u : 'de cada uno'}</span><input class="num" type="text" inputmode="decimal" autocomplete="off" value=${precio} aria-label="Precio" onInput=${e => setPrecio(e.target.value)} /></label>
        <div class="campo"><span>Descuento a esta línea</span><${Chips} opciones=${[0, 5, 10, 15, 20].map(v => ({ v, n: v ? v + ' %' : 'Ninguno' })).concat([{ v: 'otro', n: 'Otro' }])} valor=${desc} onCambio=${setDesc} chico /></div>
        ${desc === 'otro' && html`<label class="campo entra"><span>Porcentaje</span><input class="num" type="text" inputmode="decimal" value=${otro} aria-label="Porcentaje de descuento" onInput=${e => setOtro(e.target.value)} /></label>`}
        ${it.promo && !dN && html`<span class="sub promo-txt">Tiene la promoción ${it.promo}. Si le pones un descuento a mano, la reemplaza.</span>`}
        <div class="tarjeta fila" style="box-shadow:none;background:var(--fill2)"><span class="crece sub num">${verQ(qN || 0, it.u)} × ${D.m(final)}</span><b class="num" style="font-size:18px">${D.m((qN || 0) * final)}</b></div>`
      : html`<span class="sub">Tu perfil no puede cambiar precios ni dar descuentos.</span>`}`,
    pie: html`<button type="button" class="btn toca" onClick=${() => listo(c)}>Listo</button><button type="button" class="btn2 rojo toca" style="min-height:50px;border-radius:25px" onClick=${() => { d.onCant(0); c(() => {}); }}>Quitar de la venta</button>`
  })} />`;
}

// ---------- descuento a toda la venta ----------
export function Descuento({ d, cerrar }) {
  const { D } = useApp();
  const [tipo, setTipo] = useState(d.desc ? d.desc.tipo : 'pct');
  const [v, setV] = useState(d.desc && d.desc.tipo === 'pct' && [5, 10, 15, 20].includes(d.desc.v) ? d.desc.v : d.desc ? 'otro' : 10);
  const [otro, setOtro] = useState(d.desc && !(d.desc.tipo === 'pct' && [5, 10, 15, 20].includes(d.desc.v)) ? String(d.desc.v).replace('.', ',') : '');
  const val = tipo === 'pct' ? (v === 'otro' ? numero(otro) : v) : numero(otro);
  const monto = tipo === 'pct' ? d.sub * Math.min(100, val) / 100 : Math.min(d.sub, val);
  const listo = c => { if (!(val > 0)) { avisar('Escribe el descuento'); return; } if (tipo === 'pct' && val > 100) { avisar('No puede ser más de 100 %'); return; } c(() => { d.onListo({ tipo, v: val }); avisar('Descuento de ' + D.m(monto)); }); };
  return html`<${Hoja} titulo="Descuento a la venta" onCerrar=${cerrar} contenido=${c => ({
    cuerpo: html`<span class="sub" style="margin-top:-6px">Se reparte entre todo lo que lleva. Queda anotado en el recibo.</span>
      <div class="segmento" style="width:100%">${[['pct', 'Porcentaje'], ['monto', 'Monto fijo']].map(o => html`<button type="button" style="flex:1" class=${tipo === o[0] ? 'on' : ''} onClick=${() => { setTipo(o[0]); setOtro(''); setV(o[0] === 'pct' ? 10 : 'otro'); }}>${o[1]}</button>`)}</div>
      ${tipo === 'pct' && html`<${Chips} opciones=${[5, 10, 15, 20].map(x => ({ v: x, n: x + ' %' })).concat([{ v: 'otro', n: 'Otro' }])} valor=${v} onCambio=${setV} />`}
      ${(tipo === 'monto' || v === 'otro') && html`<label class="campo entra"><span>${tipo === 'pct' ? 'Porcentaje' : 'Monto a descontar'}</span><input class="grande num" type="text" inputmode="decimal" value=${otro} placeholder="0" aria-label="Descuento" onInput=${e => setOtro(e.target.value)} /></label>`}
      <div class="tarjeta fila" style="box-shadow:none;background:var(--fill2)"><span class="crece sub num">${D.m(d.sub)} − ${D.m(monto)}</span><b class="num" style="font-size:18px">${D.m(d.sub - monto)}</b></div>`,
    pie: html`<button type="button" class="btn toca" onClick=${() => listo(c)}>Aplicar descuento</button>${d.desc && html`<button type="button" class="btn2 toca" style="min-height:50px;border-radius:25px" onClick=${() => c(() => d.onListo(null))}>Quitar descuento</button>`}`
  })} />`;
}

// ---------- servicio o cargo en la venta (mano de obra, instalación, revisión, envío…) ----------
export function Cargo({ d, cerrar }) {
  const { D, T, puede } = useApp();
  const guardados = listaProductos().filter(p => p.q == null);
  const [n, setN] = useState('');
  const [precio, setPrecio] = useState('');
  const [guardar, setGuardar] = useState(true);
  const pN = numero(precio);
  const listo = c => {
    if (!n.trim()) { avisar('Escribe qué es (ej.: Instalación)'); return; }
    if (!(pN > 0)) { avisar('Escribe el precio'); return; }
    const existe = guardados.find(p => p.n.toLowerCase() === n.trim().toLowerCase());
    if (existe) { c(() => d.onProducto(existe, pN !== existe.p ? pN : null)); return; }
    c(() => d.onNuevo(n.trim(), pN, guardar && puede('productos')));
  };
  return html`<${Hoja} titulo="Servicio o cargo" onCerrar=${cerrar} contenido=${c => ({
    cuerpo: html`<span class="sub" style="margin-top:-6px;line-height:1.45">Mano de obra, instalación, revisión, envío… Queda en la venta, el recibo y los reportes.</span>
      ${guardados.length > 0 && html`<div class="campo"><span>Los que ya tienes</span><div class="chips">${guardados.slice(0, 12).map(p => html`<button type="button" key=${p.id} class="chip toca" onClick=${() => c(() => d.onProducto(p))}>${p.n} <span class="faint num">${D.m(p.p)}</span></button>`)}</div></div>`}
      <label class="campo"><span>${guardados.length ? 'O uno nuevo' : 'Qué es'}</span><input type="text" value=${n} placeholder="Ej.: Instalación" autocomplete="off" aria-label="Nombre del servicio" onInput=${e => setN(e.target.value)} /></label>
      <div class="chips">${['Mano de obra', 'Instalación', 'Revisión', 'Envío a domicilio'].map(x => html`<button type="button" class=${'chip chico toca' + (n === x ? ' on' : '')} onClick=${() => setN(x)}>${x}</button>`)}</div>
      <label class="campo"><span>Precio</span><input class="grande num" type="text" inputmode="decimal" value=${precio} placeholder="0" aria-label="Precio del servicio" onInput=${e => setPrecio(e.target.value)} /></label>
      ${puede('productos') && T.inv && html`<${Interruptor} on=${guardar} onCambio=${setGuardar} titulo="Guardarlo en mi lista" sub="Para elegirlo con un toque la próxima vez." />`}`,
    pie: html`<button type="button" class=${'btn toca' + (n.trim() && pN > 0 ? '' : ' apagado')} onClick=${() => listo(c)}>Agregar${pN > 0 ? ' ' + D.m(pN) : ''}</button>`
  })} />`;
}
