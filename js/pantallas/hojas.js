// Todas las hojas (teléfono) o ventanas (computadora) de la app.
import { html, useState } from '../lib/preact-htm.js';
import { useApp } from '../ctx.js';
import { leer, vender, abonar, anotarGasto, guardarProducto, reponer, nuevoCliente, cerrarDia, empezarDeNuevo, deudores, resumen, inicioDia, gastosEntre } from '../datos.js';
import { Hoja, Icono, Interruptor, Chips, avisar, iniciales, TONOS, hora, fechaCorta, hace } from '../ui.js';
import { Monto } from '../graficos.js';

const CATS = ['Mercancía', 'Alquiler', 'Servicios', 'Sueldos', 'Transporte', 'Otro'];
const VENCE = [{ v: 7, n: 'En 7 días' }, { v: 15, n: 'En 15 días' }, { v: 30, n: 'En 30 días' }];
const esEfectivo = m => /Efectivo/.test(m);
const numero = t => { const v = parseFloat(String(t).replace(/\s/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.')); return isFinite(v) ? v : 0; };
const telWA = t => { const d = String(t || '').replace(/\D/g, ''); return d.length >= 10 ? d : ''; };
const abrirWA = (tel, texto) => window.open('https://wa.me/' + telWA(tel) + '?text=' + encodeURIComponent(texto), '_blank', 'noopener');

export function HojaActual({ hoja, cerrar }) {
  const H = { cobrar: Cobrar, recibo: Recibo, gasto: Gasto, abono: Abono, recordar: Recordar, cierre: Cierre, producto: Producto, reponer: Reponer, nuevoCliente: NuevoCliente, cliente: Cliente, buscar: Buscar, borrar: Borrar }[hoja.t];
  return H ? html`<${H} d=${hoja.datos} cerrar=${cerrar} />` : null;
}

// ---------- cobrar ----------
function Cobrar({ d, cerrar }) {
  const { S, P, D, T, abrir, suc, tel } = useApp();
  const fiadoN = T.id === 'tienda' || T.id === 'comida' ? 'Fiado' : 'Por cobrar';
  const metodos = S.negocio.pays.concat([fiadoN]);
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
    const venta = vender({ items, pagos, cli, suc: suc || S.negocio.sucursales[0], fiado });
    venta.recibido = efectivo ? dado : 0; venta.imp = d.tt.imp; venta.impTxt = d.tt.txt;
    d.onListo && d.onListo();
    c(() => abrir('recibo', { venta, nueva: true }));
  };
  return html`<${Hoja} titulo=${T.vender === 'Pedido' ? 'Cobrar pedido' : 'Cobrar'} onCerrar=${cerrar} contenido=${c => ({
    cuerpo: html`
      <div style="display:flex;flex-direction:column;align-items:center;gap:2px;padding:4px 0 6px"><b class="num" style="font-size:40px;letter-spacing:-0.02em">${D.m(total)}</b>${D.dual && html`<span class="sub num">${D.s(total)}</span>`}${d.tt.txt && html`<span class="sub faint num">${d.tt.txt}: ${D.m(d.tt.imp)}</span>`}</div>
      <div class="campo"><span>Forma de pago</span><${Chips} opciones=${metodos} valor=${m} onCambio=${v => { setM(v); setRecibe(0); if (v === m2) setM2(metodos.find(x => x !== v && x !== fiadoN)); }} desliza=${tel} calido=${v => v === fiadoN} /></div>
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
  return [S.negocio.nombre + (S.negocio.razon ? ' · ' + S.negocio.razon : ''), S.negocio.fiscal ? P.fiscal[0] + ' ' + S.negocio.fiscal : '', 'Recibo #' + v.n + ' · ' + new Date(v.t).toLocaleString('es'), '',
    ...v.items.map(it => it.q + ' x ' + it.n + ': ' + D.m(it.q * it.p)), '', 'Total: ' + D.m(v.total) + (D.dual ? ' (' + D.s(v.total) + ')' : ''),
    ...v.pagos.map(p => p.m + ': ' + D.m(p.v)), cli ? 'Cliente: ' + cli.n : '', '', '¡Gracias por tu compra!'].filter((x, i, a) => x !== '' || a[i - 1] !== '').join('\n');
}
function Recibo({ d, cerrar }) {
  const { S, P, D, tel } = useApp();
  const v = d.venta, cli = S.clientes.find(c => c.id === v.cli);
  const enviar = () => { abrirWA(cli && cli.tel, textoRecibo(v, S, D, P)); };
  return html`<${Hoja} titulo=${d.nueva ? (v.fiado ? 'Anotado' : 'Venta guardada') : 'Venta #' + v.n} onCerrar=${cerrar} contenido=${c => ({
    cuerpo: html`
      ${d.nueva && html`<div style="display:flex;flex-direction:column;align-items:center;gap:8px;text-align:center"><span style="width:64px;height:64px;border-radius:50%;background:var(--in);display:grid;place-items:center;animation:pop .55s var(--spring) both"><${Icono} n="check" t=${30} g=${2.8} c="#0b0a14" /></span>
        <span class="sub">${navigator.onLine ? (v.fiado ? 'Sumado a lo que te debe ' + (cli ? cli.n.split(' ')[0] : '') + '.' : 'Sumada a la caja de hoy.') : 'Guardada en este aparato. Se sube cuando vuelva el internet.'}</span></div>`}
      <div style="border-radius:16px;background:#f7f6fc;color:#1a1733;padding:16px;display:flex;flex-direction:column;gap:7px;font-size:13px;font-family:ui-monospace,Menlo,Consolas,monospace">
        <b style="text-align:center;font-size:14px">${S.negocio.nombre}</b>
        ${S.negocio.razon && html`<span style="text-align:center;color:#625f7d">${S.negocio.razon}${S.negocio.fiscal ? ' · ' + P.fiscal[0] + ' ' + S.negocio.fiscal : ''}</span>`}
        <span style="text-align:center;color:#625f7d">Recibo #${v.n} · ${fechaCorta(v.t)} ${hora(v.t)}${cli ? ' · ' + cli.n : ''}</span>
        <span style="border-top:1px dashed #c9c6e0"></span>
        ${v.items.map(it => html`<span class="fila" style="justify-content:space-between;gap:8px"><span>${it.q} x ${it.n}</span><span>${D.m(it.q * it.p)}</span></span>`)}
        <span style="border-top:1px dashed #c9c6e0"></span>
        ${v.imp > 0 && html`<span class="fila" style="justify-content:space-between;color:#625f7d"><span>${v.impTxt}</span><span>${D.m(v.imp)}</span></span>`}
        <span class="fila" style="justify-content:space-between;font-weight:700;font-size:15px"><span>TOTAL</span><span>${D.m(v.total)}</span></span>
        ${D.dual && html`<span style="text-align:right;color:#625f7d">${D.s(v.total)}</span>`}
        ${v.pagos.map(p => html`<span class="fila" style="justify-content:space-between;color:#625f7d"><span>${p.m}</span><span>${D.m(p.v)}</span></span>`)}
        ${v.recibido > v.total && html`<span class="fila" style="justify-content:space-between;color:#625f7d"><span>Recibido ${D.m(v.recibido)} · vuelto</span><span>${D.m(v.recibido - v.total)}</span></span>`}
      </div>`,
    pie: html`<button type="button" class="btn wa toca" onClick=${enviar}>Enviar por WhatsApp</button>
      ${!tel && html`<button type="button" class="btn2 toca" style="min-height:54px;border-radius:27px" onClick=${() => window.print()}>Imprimir</button>`}
      <button type="button" class="btn2 toca" style="min-height:50px;border-radius:25px" onClick=${() => c()}>Listo</button>`
  })} />`;
}

// ---------- gasto ----------
function Gasto({ d, cerrar }) {
  const { S, D, P, tel } = useApp();
  const [monto, setMonto] = useState('');
  const [n, setN] = useState('');
  const [cat, setCat] = useState('Mercancía');
  const [despues, setDespues] = useState(false);
  const [vence, setVence] = useState(7);
  const [m, setM] = useState(S.negocio.pays[0]);
  const guardar = c => {
    const v = numero(monto); if (!v) { avisar('Escribe el monto'); return; }
    anotarGasto({ n: n.trim() || cat, cat, v, m, pagado: !despues, vence: despues ? Date.now() + vence * 86400000 : 0 });
    c(() => avisar(despues ? 'Anotado en «Por pagar»' : 'Gasto guardado · ' + D.m(v)));
  };
  return html`<${Hoja} titulo="Anotar gasto" onCerrar=${cerrar} contenido=${c => ({
    cuerpo: html`
      <label class="campo"><span>Monto (${P.id === 'VE' ? 'dólares' : P.cur})</span><input class="grande num" type="text" inputmode="decimal" placeholder="0" value=${monto} onInput=${e => setMonto(e.target.value)} /></label>
      <div class="campo"><span>¿En qué?</span><${Chips} opciones=${CATS} valor=${cat} onCambio=${setCat} /></div>
      <label class="campo"><span>Nota (opcional)</span><input type="text" placeholder=${cat} value=${n} onInput=${e => setN(e.target.value)} /></label>
      <${Interruptor} on=${despues} onCambio=${setDespues} titulo="Lo pago después" sub="Va a «Por pagar» y Orbe te avisa antes de que venza" />
      ${despues ? html`<div class="entra"><${Chips} opciones=${VENCE} valor=${vence} onCambio=${setVence} calido=${() => true} /></div>`
        : html`<div class="campo"><span>¿Cómo lo pagaste?</span><${Chips} opciones=${S.negocio.pays} valor=${m} onCambio=${setM} desliza=${tel} /></div>`}`,
    pie: html`<button type="button" class="btn toca" onClick=${() => guardar(c)}>Guardar gasto</button>`
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
      <div class="campo"><span>¿Cómo pagó?</span><${Chips} opciones=${S.negocio.pays} valor=${m} onCambio=${setM} desliza=${tel} /></div>`,
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
  const { S, D } = useApp();
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
      <div class="rejilla-2">${[['Total vendido', r.total, 'var(--ink)'], ['Ganancia', r.ganancia, 'var(--in)'], ['Fiado hoy', r.fiado, 'var(--amber)'], ['Gastos hoy', gastosHoy, 'var(--out)']].map(k => html`<div class="tarjeta cifra" style="background:var(--fill2);box-shadow:none;padding:12px"><span class="sub" style="font-size:11px">${k[0]}</span><b class="num" style=${{ color: k[2], fontSize: '17px' }}>${D.m(k[1])}</b></div>`)}</div>`,
    pie: html`<button type="button" class="btn toca" onClick=${() => { cerrarDia(contado, { total: r.total, ganancia: r.ganancia, dif }); c(() => avisar(dif === 0 ? 'Día cerrado. Todo cuadra' : 'Día cerrado con ' + (dif < 0 ? 'faltante' : 'sobrante') + ' de ' + D.m(Math.abs(dif)))); }}>Cerrar el día</button>`
  })} />`;
}

// ---------- producto o servicio ----------
function Producto({ d, cerrar }) {
  const { S, D, T } = useApp();
  const p0 = S.productos.find(p => p.id === d.pid) || null;
  const [f, setF] = useState(p0 ? { n: p0.n, p: String(p0.p), c: String(p0.c), q: p0.q == null ? '' : String(p0.q), min: String(p0.min), dur: p0.dur || 60 } : { n: '', p: '', c: '', q: '', min: '', dur: 60 });
  const pon = o => setF(x => Object.assign({}, x, o));
  const p = numero(f.p), co = numero(f.c);
  const guardar = c => {
    if (!f.n.trim() || !p) { avisar('Escribe el nombre y el precio'); return; }
    guardarProducto({ id: p0 ? p0.id : undefined, n: f.n.trim(), ab: f.n.trim().slice(0, 2).toUpperCase(), p, c: co, q: T.inv ? Math.round(numero(f.q)) : null, min: T.inv ? Math.round(numero(f.min)) : 0, dur: T.inv ? 0 : f.dur });
    c(() => avisar('Guardado: ' + f.n.trim()));
  };
  return html`<${Hoja} titulo=${(p0 ? 'Editar ' : 'Nuevo ') + (T.inv ? 'producto' : 'servicio')} onCerrar=${cerrar} contenido=${c => ({
    cuerpo: html`
      <label class="campo"><span>Nombre</span><input type="text" value=${f.n} placeholder=${T.inv ? 'Ej.: Arroz 1 kg' : 'Ej.: Corte de cabello'} onInput=${e => pon({ n: e.target.value })} /></label>
      <div class="rejilla-2" style="gap:10px"><label class="campo"><span>Precio</span><input type="text" inputmode="decimal" value=${f.p} placeholder="0" onInput=${e => pon({ p: e.target.value })} /></label><label class="campo"><span>Te cuesta</span><input type="text" inputmode="decimal" value=${f.c} placeholder="0" onInput=${e => pon({ c: e.target.value })} /></label></div>
      ${p > 0 && html`<span class="sub entra">Ganas <b class="in num">${D.m(p - co)}</b> por cada uno (${Math.round((p - co) / p * 100)} %)</span>`}
      ${T.inv ? html`<div class="rejilla-2" style="gap:10px"><label class="campo"><span>Tienes</span><input type="text" inputmode="numeric" value=${f.q} placeholder="0" onInput=${e => pon({ q: e.target.value })} /></label><label class="campo"><span>Avísame con menos de</span><input type="text" inputmode="numeric" value=${f.min} placeholder="0" onInput=${e => pon({ min: e.target.value })} /></label></div>`
        : html`<div class="campo"><span>Dura</span><${Chips} opciones=${[{ v: 30, n: '30 min' }, { v: 45, n: '45 min' }, { v: 60, n: '1 hora' }, { v: 120, n: '2 horas' }]} valor=${f.dur} onCambio=${v => pon({ dur: v })} /></div>`}`,
    pie: html`<button type="button" class="btn toca" onClick=${() => guardar(c)}>Guardar</button>`
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
  const { S, abrir } = useApp();
  const [f, setF] = useState({ n: '', tel: '', tipo: 'persona' });
  return html`<${Hoja} titulo="Nuevo cliente" onCerrar=${cerrar} contenido=${c => ({
    cuerpo: html`<label class="campo"><span>Nombre</span><input type="text" value=${f.n} onInput=${e => setF(Object.assign({}, f, { n: e.target.value }))} autocomplete="name" /></label>
      <label class="campo"><span>WhatsApp</span><input type="tel" inputmode="tel" value=${f.tel} placeholder="0414-555-1234" onInput=${e => setF(Object.assign({}, f, { tel: e.target.value }))} /></label>
      ${S.negocio.escala === 'empresa' && html`<div class="campo"><span>Es</span><${Chips} opciones=${[{ v: 'persona', n: 'Persona' }, { v: 'empresa', n: 'Empresa' }]} valor=${f.tipo} onCambio=${v => setF(Object.assign({}, f, { tipo: v }))} /></div>`}`,
    pie: html`<button type="button" class="btn toca" onClick=${() => { if (!f.n.trim()) { avisar('Escribe el nombre'); return; } nuevoCliente({ n: f.n.trim(), tel: f.tel, tipo: f.tipo }); c(() => { avisar('Cliente guardado'); if (d.volver) abrir('cobrar', d.volver); }); }}>Guardar</button>`
  })} />`;
}

function Cliente({ d, cerrar }) {
  const { S, D, abrir } = useApp();
  const c0 = deudores().find(x => x.id === d.cid);
  if (!c0) return null;
  const mov = S.ventas.filter(v => v.cli === c0.id).map(v => ({ t: v.t, txt: (v.fiado ? 'Fiado #' : 'Compra #') + v.n, v: v.total, fiado: v.fiado, venta: v }))
    .concat(S.abonos.filter(a => a.cli === c0.id).map(a => ({ t: a.t, txt: 'Abono · ' + a.m, v: -a.v }))).sort((a, b) => b.t - a.t).slice(0, 15);
  return html`<${Hoja} titulo=${c0.n} onCerrar=${cerrar} contenido=${c => ({
    cuerpo: html`
      <div class="rejilla-2"><div class="tarjeta cifra" style="background:var(--amber-soft);box-shadow:none;padding:12px"><span class="sub">Debe</span><b class="num amber" style="font-size:20px">${D.m(c0.deuda)}</b></div><div class="tarjeta cifra" style="background:var(--fill2);box-shadow:none;padding:12px"><span class="sub">Compras</span><b class="num" style="font-size:20px">${c0.compras}</b></div></div>
      ${c0.tel && html`<span class="sub">WhatsApp: ${c0.tel}</span>`}
      <div class="lista">${mov.length ? mov.map((m, i) => html`<div class="item entra" style=${{ '--i': i }}><span class="crece" style="display:flex;flex-direction:column;gap:1px"><span style="font-size:14px">${m.txt}</span><span class="sub faint">${fechaCorta(m.t)} · ${hora(m.t)}</span></span><b class=${'num ' + (m.v < 0 ? 'in' : m.fiado ? 'amber' : '')}>${m.v < 0 ? '−' + D.m(-m.v) : D.m(m.v)}</b></div>`) : html`<p class="vacio">Sin movimientos todavía.</p>`}</div>`,
    pie: c0.deuda > 0 ? html`<button type="button" class="btn wa toca" onClick=${() => c(() => abrir('recordar', { cid: c0.id }))}>Recordar por WhatsApp</button><button type="button" class="btn2 toca" style="min-height:50px;border-radius:25px" onClick=${() => c(() => abrir('abono', { cid: c0.id }))}>Anotar abono</button>` : null
  })} />`;
}

// ---------- buscar (computadora) ----------
function Buscar({ d, cerrar }) {
  const { S, D, abrir, ir } = useApp();
  const t = d.q.toLowerCase();
  const prods = S.productos.filter(p => p.n.toLowerCase().includes(t) || (p.cod || '').includes(t));
  const clis = S.clientes.filter(c => c.n.toLowerCase().includes(t));
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
    pie: html`<button type="button" class="btn toca" style="background:var(--out)" onClick=${() => c(() => { empezarDeNuevo(); location.hash = ''; })}>Sí, empezar de nuevo</button><button type="button" class="btn2 toca" style="min-height:50px;border-radius:25px" onClick=${() => c()}>Cancelar</button>`
  })} />`;
}
