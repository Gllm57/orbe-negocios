// Escáner con la cámara (celular): lee el código de barras o el nombre de un producto.
// Si ya está en el sistema, se suma o se resta existencia al momento (o se agrega a la venta);
// si no está, se crea su ficha con el código y, si se encuentra en internet, con el nombre puesto.
import { html, useState, useEffect, useRef } from '../lib/preact-htm.js';
import { useApp } from '../ctx.js';
import { listaProductos, ajustarStock, asignarCodigo } from '../datos.js';
import { Hoja, Icono, avisar } from '../ui.js';
import { buscar, normal } from '../buscar.js';
import { textosProducto, grupoDe, colorGrupo } from './grupos.js';

const BASE = new URL('../lib/', import.meta.url).href;
const cargar = src => new Promise((ok, mal) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = () => mal(new Error('No se pudo cargar ' + src)); document.head.appendChild(s); });
// Solo los códigos de los productos de tienda: ITF y Codabar dan lecturas falsas con la cámara.
const FORMATOS = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code'];
// Mismo código aunque uno venga como UPC (12 dígitos) y otro como EAN (13, con un 0 delante).
const limpio = c => { const x = String(c || '').replace(/\s+/g, ''); return /^\d+$/.test(x) ? x.replace(/^0+/, '') : x.toUpperCase(); };
export const mismoCodigo = (a, b) => !!limpio(a) && limpio(a) === limpio(b);

// Lector de códigos: el del sistema cuando existe (Android) o ZXing (iPhone y el resto), que se carga al usarlo.
async function crearLector() {
  if ('BarcodeDetector' in window) {
    try {
      const f = (await window.BarcodeDetector.getSupportedFormats()).filter(x => FORMATOS.includes(x));
      if (f.includes('ean_13')) { const det = new window.BarcodeDetector({ formats: f }); return async v => { const r = await det.detect(v); return r[0] ? r[0].rawValue : ''; }; }
    } catch (e) { /* sigue con ZXing */ }
  }
  if (!window.ZXing) await cargar(BASE + 'zxing.min.js');
  const Z = window.ZXing, F = Z.BarcodeFormat, pistas = new Map();
  pistas.set(Z.DecodeHintType.POSSIBLE_FORMATS, [F.EAN_13, F.EAN_8, F.UPC_A, F.UPC_E, F.CODE_128, F.CODE_39, F.QR_CODE]);
  pistas.set(Z.DecodeHintType.TRY_HARDER, true);
  const lector = new Z.MultiFormatReader(); lector.setHints(pistas);
  const cv = document.createElement('canvas'), cx = cv.getContext('2d', { willReadFrequently: true });
  return async v => {
    const w = v.videoWidth, h = v.videoHeight; if (!w || !h) return '';
    // Solo la franja del centro, donde está el recuadro: lee más rápido.
    const sw = Math.round(w * 0.92), sh = Math.round(h * 0.6), k = Math.min(1, 1000 / sw);
    cv.width = Math.round(sw * k); cv.height = Math.round(sh * k);
    cx.drawImage(v, (w - sw) / 2, (h - sh) / 2, sw, sh, 0, 0, cv.width, cv.height);
    try { return lector.decode(new Z.BinaryBitmap(new Z.HybridBinarizer(new Z.HTMLCanvasElementLuminanceSource(cv)))).getText(); } catch (e) { return ''; } finally { lector.reset(); }
  };
}

// Lector de nombres (texto en la foto). Pesa unos 6 MB: se descarga la primera vez y después funciona sin internet.
let ocr = null;
async function leerTexto(cv, progreso) {
  if (!ocr) {
    if (!window.Tesseract) await cargar(BASE + 'ocr/tesseract.min.js');
    ocr = await window.Tesseract.createWorker('spa', 1, {
      workerPath: BASE + 'ocr/worker.min.js', corePath: BASE + 'ocr/tesseract-core-lstm.wasm.js', langPath: BASE + 'ocr',
      logger: m => progreso && m.status === 'recognizing text' && progreso(m.progress)
    });
  }
  const { data } = await ocr.recognize(cv);
  return data.text || '';
}
// Del texto leído, las líneas que parecen un nombre (con letras, sin ruido).
const lineasUtiles = t => t.split(/\n+/).map(x => x.replace(/[^\p{L}\p{N} %.,'-]/gu, ' ').replace(/\s+/g, ' ').trim()).filter(x => (x.match(/\p{L}/gu) || []).length >= 3).slice(0, 8);
const titulo = t => t.toLowerCase().split(' ').map((w, i) => i && /^(de|del|la|el|los|las|con|en|y|x)$/.test(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

// Nombre del producto en Open Food Facts (base abierta de productos con código de barras).
async function nombreEnInternet(cod) {
  if (!/^\d{8,14}$/.test(cod) || !navigator.onLine) return '';
  const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 4500);
  try {
    const r = await fetch('https://world.openfoodfacts.org/api/v2/product/' + cod + '.json?fields=product_name,product_name_es,brands,quantity', { signal: ctl.signal });
    const j = await r.json(), p = j && j.product;
    if (!p) return '';
    const n = (p.product_name_es || p.product_name || '').trim(); if (!n) return '';
    const marca = (p.brands || '').split(',')[0].trim();
    return [n, marca && !normal(n).includes(normal(marca)) ? marca : '', (p.quantity || '').trim()].filter(Boolean).join(' ');
  } catch (e) { return ''; } finally { clearTimeout(t); }
}

function pitido() {
  try { navigator.vibrate && navigator.vibrate(40); } catch (e) { /* sin vibración */ }
  try {
    const A = window.AudioContext || window.webkitAudioContext; if (!A) return;
    const a = pitido.a || (pitido.a = new A()), o = a.createOscillator(), g = a.createGain();
    o.frequency.value = 1320; g.gain.setValueAtTime(0.0001, a.currentTime); g.gain.exponentialRampToValueAtTime(0.18, a.currentTime + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + 0.12);
    o.connect(g).connect(a.destination); o.start(); o.stop(a.currentTime + 0.13);
  } catch (e) { /* sin sonido */ }
}

// d.para: 'inventario' (sumar o restar existencia) o 'vender' (cada lectura suma a la venta). d.onAgregar(p) en la caja.
export function Escaner({ d, cerrar }) {
  const { S, D, T, abrir, puede } = useApp();
  const vender = d.para === 'vender';
  const puedeStock = puede('reponer') || puede('productos'), puedeCrear = puede('productos');
  const [modo, setModo] = useState('codigo');
  const [camara, setCamara] = useState('abriendo'); // abriendo | lista | sin
  const [res, setRes] = useState(null);
  const [cuanto, setCuanto] = useState(1);
  const [manual, setManual] = useState('');
  const [luz, setLuz] = useState(null); // null: el teléfono no tiene linterna
  const [leyendo, setLeyendo] = useState(null); // progreso del lector de nombres (0 a 1)
  const [ultimo, setUltimo] = useState(null); // en la caja: lo último que se agregó
  const [asignar, setAsignar] = useState(false); // código nuevo: elegir un producto que ya existe
  const [qa, setQa] = useState('');
  // Al volver de crear el producto se muestra ya reconocido.
  useEffect(() => {
    const p = d.mostrar && listaProductos().find(x => mismoCodigo(x.cod, d.mostrar)); if (!p) return;
    if (vender) { if (d.onAgregar && d.onAgregar(p) !== false) setUltimo({ p, t: Date.now() }); } else setRes({ tipo: 'esta', pid: p.id, cod: d.mostrar, nuevo: true });
  }, []);
  const video = useRef(null), flujo = useRef(null), pausa = useRef(false), modoRef = useRef(modo), lector = useRef(null), visto = useRef({ c: '', t: 0 }), previo = useRef({ c: '', t: 0 });
  modoRef.current = modo;
  pausa.current = !!res || leyendo != null;

  // Encender la cámara de atrás al abrir y apagarla al cerrar.
  useEffect(() => {
    let vivo = true, reloj = 0;
    (async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('sin cámara');
        const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
        if (!vivo) { s.getTracks().forEach(t => t.stop()); return; }
        flujo.current = s;
        const v = video.current; v.srcObject = s; v.setAttribute('playsinline', ''); v.muted = true;
        await v.play().catch(() => {});
        const pista = s.getVideoTracks()[0], cap = pista && pista.getCapabilities ? pista.getCapabilities() : {};
        if (cap.torch) setLuz(false);
        setCamara('lista');
        lector.current = await crearLector().catch(() => null);
        const vuelta = async () => {
          if (!vivo) return;
          if (modoRef.current === 'codigo' && !pausa.current && lector.current && v.readyState >= 2) {
            const c = await lector.current(v).catch(() => '');
            // Mientras el mismo código siga a la vista no cuenta otra vez: hay que sacarlo y volver a pasarlo.
            // Se acepta cuando dos lecturas seguidas dan lo mismo: así un cuadro borroso no inventa un código.
            const ahora = Date.now(), seguro = c && c === previo.current.c && ahora - previo.current.t < 900;
            previo.current = { c, t: ahora };
            if (seguro && vivo) { const igual = mismoCodigo(c, visto.current.c) && ahora - visto.current.t < 1000; visto.current = { c, t: ahora }; if (!igual) encontrado(c); }
          }
          reloj = setTimeout(vuelta, 160);
        };
        vuelta();
      } catch (e) { if (vivo) setCamara('sin'); }
    })();
    return () => { vivo = false; clearTimeout(reloj); if (flujo.current) flujo.current.getTracks().forEach(t => t.stop()); flujo.current = null; };
  }, []);

  const linterna = () => {
    const p = flujo.current && flujo.current.getVideoTracks()[0]; if (!p) return;
    p.applyConstraints({ advanced: [{ torch: !luz }] }).then(() => setLuz(!luz)).catch(() => setLuz(null));
  };

  function encontrado(cod) {
    pitido();
    const p = listaProductos().find(x => mismoCodigo(x.cod, cod));
    if (p && vender) {
      if (d.onAgregar && d.onAgregar(p) !== false) setUltimo({ p, t: Date.now() });
      return;
    }
    setCuanto(1);
    if (p) { setRes({ tipo: 'esta', pid: p.id, cod }); return; }
    setRes({ tipo: 'nuevo', cod, n: '', buscando: true });
    nombreEnInternet(cod).then(n => setRes(r => r && r.tipo === 'nuevo' && r.cod === cod ? Object.assign({}, r, { n, buscando: false }) : r));
  }
  const otro = () => { visto.current = { c: '', t: 0 }; previo.current = { c: '', t: 0 }; setRes(null); setCuanto(1); setAsignar(false); setQa(''); };
  // Ponerle el código leído a un producto que ya existe (por ejemplo, uno guardado sin código).
  const ponerCodigo = p => {
    asignarCodigo(p.id, res.cod); pitido(); avisar(p.n + ': código guardado');
    setAsignar(false); setQa('');
    if (vender) { if (d.onAgregar && d.onAgregar(p) !== false) setUltimo({ p, t: Date.now() }); otro(); return; }
    setRes({ tipo: 'esta', pid: p.id, cod: res.cod, nuevo: true });
  };
  const buscarManual = () => { const c = manual.trim(); if (!c) { avisar('Escribe el código'); return; } setManual(''); if (document.activeElement) document.activeElement.blur(); encontrado(c); };

  // Leer el nombre: se toma una foto del recuadro y se busca en la lista de productos.
  async function fotoNombre() {
    const v = video.current; if (!v || !v.videoWidth) { avisar('La cámara aún no está lista'); return; }
    const w = v.videoWidth, h = v.videoHeight, sw = Math.round(w * 0.9), sh = Math.round(h * 0.5);
    const cv = document.createElement('canvas'); cv.width = sw; cv.height = sh;
    const cx = cv.getContext('2d'); cx.filter = 'grayscale(1) contrast(1.35)'; cx.drawImage(v, (w - sw) / 2, (h - sh) / 2, sw, sh, 0, 0, sw, sh);
    pitido(); setLeyendo(0);
    try {
      const lineas = lineasUtiles(await leerTexto(cv, setLeyendo));
      const lista = listaProductos(), t = textosProducto(S), ids = [];
      lineas.concat(lineas.length > 1 ? [lineas.join(' ')] : []).forEach(l => buscar(lista, l, t, true).slice(0, 3).forEach(p => { if (!ids.includes(p.id)) ids.push(p.id); }));
      setRes({ tipo: 'texto', lineas, ids: ids.slice(0, 5) });
    } catch (e) { avisar(navigator.onLine ? 'No pude leer el texto. Prueba otra vez con más luz.' : 'La primera vez que lees un nombre necesitas internet'); }
    setLeyendo(null);
  }

  const mover = (p, signo, c) => {
    if (!puedeStock) { avisar('Tu perfil no puede cambiar el inventario'); return; }
    if (signo < 0 && (p.q || 0) === 0) { avisar(p.n + ' ya está en 0'); return; }
    const q = ajustarStock(p.id, signo * cuanto);
    setRes(Object.assign({}, res, { hecho: { signo, n: cuanto, q, t: Date.now() } }));
    avisar(p.n + ': ahora tienes ' + q);
  };

  const Producto = (p, c) => {
    const g = grupoDe(S, p), hecho = res.hecho;
    return html`<div class="escaner-res entra">
      <div class="fila" style="gap:12px">
        <span class="escaner-ic" style=${g ? { background: 'color-mix(in srgb, ' + colorGrupo(g) + ' 18%, transparent)', color: colorGrupo(g) } : null}><${Icono} n="check" t=${20} g=${2.6} /></span>
        <span class="crece" style="display:flex;flex-direction:column;gap:2px;min-width:0"><b class="corta" style="font-size:16px">${p.n}</b><span class="sub corta">${[g && g.n, D.m(p.p), p.cod].filter(Boolean).join(' · ')}</span></span>
      </div>
      ${res.nuevo && !hecho && html`<span class="pildora t-ver entra" style="align-self:flex-start"><${Icono} n="check" t=${12} g=${3} /> Listo: la próxima vez lo reconoce con su código</span>`}
      ${T.inv && p.q != null ? html`
        <div class="escaner-stock"><span class="sub">Tienes</span><b class=${'num' + (hecho ? ' latido' : '')} key=${hecho ? hecho.t : 0}>${p.q}</b><span class="sub">${p.min ? 'mínimo ' + p.min : 'unidades'}</span></div>
        ${puedeStock ? html`
          <div class="fila" style="justify-content:center;gap:16px">
            <button type="button" class="icono-btn toca" aria-label="Menos" onClick=${() => setCuanto(Math.max(1, cuanto - 1))}><${Icono} n="menos1" t=${16} g=${2.6} /></button>
            <b class="num" style="font-size:30px;min-width:64px;text-align:center">${cuanto}</b>
            <button type="button" class="icono-btn toca" aria-label="Más" onClick=${() => setCuanto(cuanto + 1)}><${Icono} n="mas1" t=${16} g=${2.6} /></button>
          </div>
          <div class="chips" style="justify-content:center">${[1, 6, 12, 24].map(v => html`<button type="button" class=${'chip chico toca' + (cuanto === v ? ' on' : '')} onClick=${() => setCuanto(v)}>${v}</button>`)}</div>
          <div class="rejilla-2" style="gap:10px">
            <button type="button" class="btn2 rojo toca escaner-accion" onClick=${() => mover(p, -1, c)}><${Icono} n="menos1" t=${15} g=${2.6} />Salieron ${cuanto}</button>
            <button type="button" class="btn2 verde toca escaner-accion" onClick=${() => mover(p, 1, c)}><${Icono} n="mas1" t=${15} g=${2.6} />Entraron ${cuanto}</button>
          </div>` : html`<p class="sub" style="text-align:center">Tu perfil puede ver, pero no cambiar el inventario.</p>`}` : null}
      ${puedeCrear && html`<button type="button" class="enlace-tasa toca" style="align-self:center" onClick=${() => c(() => abrir('producto', { pid: p.id }))}><${Icono} n="lapiz" t=${13} />Ver o editar la ficha</button>`}
    </div>`;
  };

  const Nuevo = c => {
    const lista = listaProductos(), elegibles = qa.trim() ? buscar(lista, qa, textosProducto(S)).slice(0, 6) : lista.filter(p => !p.cod).slice(0, 6);
    return html`<div class="escaner-res entra">
    <div class="fila" style="gap:12px">
      <span class="escaner-ic" style="background:var(--amber-soft);color:var(--amber-text)"><${Icono} n="codigo" t=${20} /></span>
      <span class="crece" style="display:flex;flex-direction:column;gap:2px;min-width:0"><b style="font-size:16px">Producto nuevo</b><span class="sub num corta">Código ${res.cod} · no está en tu ${T.inv ? 'inventario' : 'lista'}</span></span>
    </div>
    ${res.buscando ? html`<span class="sub fila" style="gap:8px"><i class="girando"></i>Buscando el nombre en internet…</span>` : res.n ? html`<span class="sub">Lo encontré como <b style="color:var(--ink)">${res.n}</b></span>` : null}
    ${!puedeCrear ? html`<p class="sub">Pídele a quien maneja los productos que lo registre.</p>`
      : !asignar ? html`<button type="button" class="btn toca" onClick=${() => c(() => abrir('producto', { cod: res.cod, n: res.n || '', escaner: { para: d.para, onAgregar: d.onAgregar } }))}><${Icono} n="mas1" t=${18} g=${2.6} />Agregar producto</button>
        <button type="button" class="enlace-tasa toca" style="align-self:center" onClick=${() => setAsignar(true)}>¿Ya lo tienes guardado? Ponle este código</button>`
      : html`<div class="pila entra" style="gap:8px">
        <span class="sub">¿A cuál de tus productos le pongo el código ${res.cod}?</span>
        <label class="buscador" style="width:100%;background:var(--surface)"><${Icono} n="buscar" t=${16} c="var(--muted)" /><input type="search" value=${qa} placeholder="Buscar el producto" aria-label="Buscar el producto para el código" onInput=${e => setQa(e.target.value)} /></label>
        <div class="lista">${elegibles.map(p => html`<button type="button" key=${p.id} class="item toca" style="color:var(--ink)" onClick=${() => ponerCodigo(p)}><span class="crece corta">${p.n}</span><span class="sub num">${p.cod ? 'tiene otro código' : 'sin código'}</span></button>`)}
          ${elegibles.length ? null : html`<p class="vacio">${qa.trim() ? 'No encontré «' + qa + '».' : 'Todos tienen código: búscalo por nombre.'}</p>`}</div>
        <button type="button" class="enlace-tasa toca" style="align-self:center" onClick=${() => { setAsignar(false); setQa(''); }}>Mejor lo agrego como nuevo</button>
      </div>`}
  </div>`;
  };

  const Texto = c => {
    const lista = listaProductos(), prods = res.ids.map(id => lista.find(p => p.id === id)).filter(Boolean);
    return html`<div class="escaner-res entra">
      ${prods.length ? html`<span class="sub">Toca el producto:</span>
        <div class="lista">${prods.map(p => html`<button type="button" key=${p.id} class="item toca" style="color:var(--ink)" onClick=${() => vender ? (d.onAgregar && d.onAgregar(p) !== false && (setUltimo({ p, t: Date.now() }), otro())) : (setCuanto(1), setRes({ tipo: 'esta', pid: p.id, cod: p.cod }))}>
          <span class="crece corta">${p.n}</span>${T.inv && p.q != null ? html`<span class="sub num">${p.q} und</span>` : null}<b class="num">${D.m(p.p)}</b></button>`)}</div>`
        : html`<span class="sub">${res.lineas.length ? 'No lo encontré entre tus productos.' : 'No se ve texto. Acércate, con buena luz, y prueba otra vez.'}</span>`}
      ${puedeCrear && res.lineas.length > 0 && html`<span class="sub">¿Es nuevo? Créalo con el nombre leído:</span>
        <div class="chips">${res.lineas.slice(0, 3).map(l => html`<button type="button" class="chip toca" onClick=${() => c(() => abrir('producto', { n: titulo(l) }))}>+ ${titulo(l)}</button>`)}</div>`}
    </div>`;
  };

  const p0 = res && res.tipo === 'esta' ? listaProductos().find(x => x.id === res.pid) : null;
  const ayuda = camara === 'sin' ? 'No pude abrir la cámara. Dale permiso en los ajustes del teléfono o escribe el código abajo.'
    : modo === 'codigo' ? (vender ? 'Apunta a los códigos: cada lectura suma uno a la venta.' : 'Apunta al código de barras del producto.')
    : 'Pon el nombre del producto dentro del recuadro y toca «Leer nombre».';

  return html`<${Hoja} titulo=${vender ? 'Escanear para vender' : 'Escanear productos'} onCerrar=${cerrar} contenido=${c => ({
    cuerpo: html`
      <div class="segmento" style="width:100%">${[['codigo', 'Código de barras', 'codigo'], ['nombre', 'Nombre', 'texto']].map(o => html`<button type="button" style="flex:1" class=${modo === o[0] ? 'on' : ''} onClick=${() => { setModo(o[0]); otro(); }}><${Icono} n=${o[2]} t=${14} />${o[1]}</button>`)}</div>
      <div class=${'escaner-visor ' + modo + (camara === 'lista' ? ' viva' : '') + (pausa.current ? ' quieta' : '') + (res ? ' chica' : '')}>
        <video ref=${video} playsinline muted autoplay aria-label="Cámara"></video>
        ${camara === 'abriendo' && html`<span class="escaner-aviso"><i class="girando"></i>Abriendo la cámara…</span>`}
        ${camara === 'sin' && html`<span class="escaner-aviso"><${Icono} n="camara" t=${28} />Sin cámara</span>`}
        <i class="escaner-marco"></i>${modo === 'codigo' && html`<i class="escaner-linea"></i>`}
        ${luz != null && html`<button type="button" class=${'escaner-luz toca' + (luz ? ' on' : '')} aria-label=${luz ? 'Apagar la linterna' : 'Encender la linterna'} onClick=${linterna}><${Icono} n="linterna" t=${18} /></button>`}
        ${leyendo != null && html`<span class="escaner-aviso"><i class="girando"></i>${ocr ? 'Leyendo… ' + Math.round(leyendo * 100) + ' %' : 'Preparando el lector de nombres (solo la primera vez)…'}</span>`}
        ${vender && ultimo && html`<span class="escaner-ultimo entra" key=${ultimo.t}>+1 ${ultimo.p.n}</span>`}
      </div>
      ${!res && html`<span class="sub" style="text-align:center;line-height:1.4">${ayuda}</span>`}
      ${res && res.tipo === 'esta' && p0 && Producto(p0, c)}
      ${res && res.tipo === 'nuevo' && Nuevo(c)}
      ${res && res.tipo === 'texto' && Texto(c)}
      ${modo === 'codigo' && !res && html`<div class="fila" style="gap:8px">
        <label class="buscador crece" style="background:var(--fill2)"><${Icono} n="codigo" t=${16} c="var(--muted)" /><input type="text" inputmode="numeric" autocomplete="off" value=${manual} placeholder="¿No lee? Escribe el código" aria-label="Escribir el código" onInput=${e => setManual(e.target.value)} onKeyDown=${e => { if (e.key === 'Enter') buscarManual(); }} /></label>
        <button type="button" class="btn2 chico toca" onClick=${buscarManual}>Buscar</button></div>`}`,
    pie: res ? html`<button type="button" class=${(res.tipo === 'nuevo' && puedeCrear ? 'btn2' : 'btn') + ' toca'} style="min-height:50px;border-radius:25px" onClick=${otro}><${Icono} n=${modo === 'codigo' ? 'codigo' : 'texto'} t=${16} />${modo === 'codigo' ? 'Escanear otro' : 'Leer otro nombre'}</button>`
      : modo === 'nombre' ? html`<button type="button" class=${'btn toca' + (camara !== 'lista' || leyendo != null ? ' apagado' : '')} onClick=${() => camara === 'lista' && leyendo == null && fotoNombre()}><${Icono} n="camara" t=${18} />Leer nombre</button>`
      : vender ? html`<button type="button" class="btn toca" onClick=${() => c()}>Listo</button>` : null
  })} />`;
}
