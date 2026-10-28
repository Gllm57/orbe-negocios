// Piezas compartidas de la interfaz.
import { html, useState, useEffect, useRef } from './lib/preact-htm.js';

export const ICONOS = {
  inicio: 'M3 12l9-8 9 8M5 10v10h14V10',
  carrito: 'M4 5h2l2.4 10h9.2L20 8H7M10 20h.01M17 20h.01',
  personas: 'M16 20v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 10a4 4 0 100-8 4 4 0 000 8zM22 20v-2a4 4 0 00-3-3.9M16 2.1a4 4 0 010 7.8',
  deshacer: 'M9 14L4 9l5-5M4 9h10.5a5.5 5.5 0 010 11H11',
  lapiz: 'M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z',
  subir: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12',
  caja: 'M21 8l-9-5-9 5 9 5 9-5zM3 8v8l9 5 9-5V8M12 13v8',
  lista: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  mas: 'M5 12h.01M12 12h.01M19 12h.01',
  campana: 'M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0',
  candado: 'M5 11h14v10H5zM8 11V7a4 4 0 018 0v4',
  sube: 'M3 17l6-6 4 4 8-8M14 7h7v7',
  dinero: 'M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6',
  calendario: 'M8 2v4M16 2v4M3 9h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z',
  wifi: 'M2 8.8a15 15 0 0120 0M5 12.5a10 10 0 0114 0M8.5 16a5 5 0 017 0M12 20h.01',
  guardar: 'M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2zM17 21v-8H7v8M7 3v5h8',
  mundo: 'M12 22a10 10 0 100-20 10 10 0 000 20zM2 12h20M12 2a15 15 0 010 20M12 2a15 15 0 000 20',
  tarjeta: 'M2 5h20v14H2zM2 10h20',
  porciento: 'M19 5L5 19M6.5 9a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM17.5 20a2.5 2.5 0 100-5 2.5 2.5 0 000 5z',
  escudo: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  doc: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M8 13h8M8 17h5',
  grafico: 'M3 3v18h18M7 14l4-4 4 4 5-6',
  edificio: 'M3 21h18M5 21V5a2 2 0 012-2h6a2 2 0 012 2v16M15 9h4a2 2 0 012 2v10M9 7h2M9 11h2M9 15h2',
  tienda: 'M3 9l1.5-5h15L21 9M3 9h18M4 9v11h16V9M9 20v-6h6v6',
  comida: 'M7 2v9M4 2v5a3 3 0 006 0V2M7 11v11M17 2c-2 2-3 4-3 7 0 2 1 3 3 3v10',
  citas: 'M8 2v4M16 2v4M3 9h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z',
  online: 'M6 7h12l1 14H5L6 7zM9 7a3 3 0 016 0',
  indep: 'M3 7h18v13H3zM8 7V5a2 2 0 012-2h4a2 2 0 012 2v2M3 13h18',
  check: 'M5 12l5 5L20 7',
  cerrar: 'M6 6l12 12M18 6L6 18',
  atras: 'M15 18l-6-6 6-6',
  sig: 'M9 18l6-6-6-6',
  mas1: 'M12 5v14M5 12h14',
  menos1: 'M5 12h14',
  buscar: 'M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.3-4.3',
  codigo: 'M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2M7 8v8M11 8v8M15 8v8M18 8v8',
  sol: 'M12 17a5 5 0 100-10 5 5 0 000 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4',
  descarga: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3',
  alerta: 'M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z',
  basura: 'M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6',
  billete: 'M2 6h20v12H2zM12 15a3 3 0 100-6 3 3 0 000 6zM6 9v.01M18 15v.01',
  movil: 'M7 2h10a1 1 0 011 1v18a1 1 0 01-1 1H7a1 1 0 01-1-1V3a1 1 0 011-1zM11 18h2',
  transfer: 'M17 3l4 4-4 4M21 7H9M7 21l-4-4 4-4M3 17h12',
  cripto: 'M12 22a10 10 0 100-20 10 10 0 000 20zM8 8h8M12 8v9',
  reloj: 'M12 22a10 10 0 100-20 10 10 0 000 20zM12 6v6l4 2',
  casa: 'M4 11l8-7 8 7v9H4zM10 20v-5h4v5',
  rayo: 'M13 3L5 13h6l-1 8 8-10h-6z',
  bus: 'M5 4h14v13H5zM5 11h14M8 20v-3M16 20v-3',
  etiqueta: 'M20 12l-8 8-9-9V4h7zM7.5 7.5h.01',
  ajustes: 'M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z'
};

export function Icono({ n, t = 20, g = 2, c = 'currentColor', estilo }) {
  return html`<svg width=${t} height=${t} viewBox="0 0 24 24" fill="none" stroke=${c} stroke-width=${g} stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style=${estilo}><path d=${ICONOS[n] || ''}></path></svg>`;
}

// Logo de Orbe Negocios: los círculos se dibujan al aparecer; al tocarlo (o pasar el ratón) da una vuelta.
// «orbita» lo hace girar despacio todo el tiempo (para los logos grandes).
// Bandera del país, circular (SVG guardado en la app, funciona sin internet y en Windows también).
export const Bandera = ({ id, t = 20 }) => html`<img class="bandera" src=${'icons/banderas/' + String(id || 'VE').toLowerCase() + '.svg'} width=${t} height=${t} alt="" aria-hidden="true" decoding="async" />`;

export function LogoOrbe({ t = 42, orbita = false }) {
  const [vuelta, setVuelta] = useState(0);
  const girar = () => setVuelta(v => v + 1);
  return html`<svg width=${t} height=${t} viewBox="0 0 92 92" class=${'logo-orbe' + (orbita ? ' orbita' : '')} role="img" aria-label="Orbe Negocios" onClick=${girar} onMouseEnter=${girar}>
    <rect width="92" height="92" rx="26" fill="#16142a"></rect>
    <g key=${vuelta} class=${'lo-g' + (vuelta ? ' gira' : '')}>
      <g class="lo-orbita">
        <circle class="lo-c lo-c1" cx="35" cy="39.7" r="23" pathLength="100"></circle>
        <circle class="lo-c lo-c2" cx="57" cy="39.7" r="23" pathLength="100"></circle>
        <circle class="lo-c lo-c3" cx="46" cy="58.7" r="23" pathLength="100"></circle>
      </g>
    </g>
  </svg>`;
}

// ---------- avisos ----------
let ponerAviso = () => {};
export const avisar = t => ponerAviso(t);
export function Avisos() {
  const [txt, setTxt] = useState('');
  const [n, setN] = useState(0);
  useEffect(() => {
    let tm;
    ponerAviso = t => { setTxt(t); setN(x => x + 1); clearTimeout(tm); tm = setTimeout(() => setTxt(''), 2400); };
    return () => clearTimeout(tm);
  }, []);
  return txt ? html`<div class="aviso-toast" role="status" key=${n}><${Icono} n="check" t=${18} g=${2.6} c="#3ddc9f" />${txt}</div>` : null;
}

// ---------- interruptor ----------
export function Interruptor({ on, onCambio, titulo, sub }) {
  return html`<button type="button" class="opcion" role="switch" aria-checked=${on ? 'true' : 'false'} onClick=${() => onCambio(!on)}>
    <span style="flex:1;display:flex;flex-direction:column;gap:2px"><b style="font-size:14px;font-weight:600">${titulo}</b>${sub && html`<span class="sub">${sub}</span>`}</span>
    <span class=${'inter' + (on ? ' on' : '')}></span>
  </button>`;
}

export function Chips({ opciones, valor, onCambio, desliza, calido, chico }) {
  return html`<div class=${'chips' + (desliza ? ' desliza' : '')}>
    ${opciones.map(o => { const v = typeof o === 'string' ? o : o.v, n = typeof o === 'string' ? o : o.n, on = v === valor;
      return html`<button type="button" key=${v} class=${'chip toca' + (on ? ' on' : '') + (on && calido && calido(v) ? ' calido' : '') + (chico ? ' chico' : '')} aria-pressed=${on ? 'true' : 'false'} onClick=${() => onCambio(v)}>${n}</button>`; })}
  </div>`;
}

// ---------- hoja (teléfono) o ventana (computadora) ----------
// contenido(cerrar) devuelve { cuerpo, pie }. Nunca enfoca un campo al abrir.
export function Hoja({ titulo, onCerrar, contenido }) {
  const [sale, setSale] = useState(false);
  const hoja = useRef(null), arrastre = useRef(null);
  const cerrar = despues => { if (sale) return; setSale(true); setTimeout(() => { onCerrar(); if (typeof despues === 'function') despues(); }, 280); };
  useEffect(() => {
    const tecla = e => { if (e.key === 'Escape') cerrar(); };
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, [sale]);
  // Arrastrar hacia abajo para cerrar: hace falta un gesto claro (14 px para empezar).
  const baja = e => { if (document.documentElement.classList.contains('pc')) return; arrastre.current = { y: e.clientY, dy: 0, activo: false }; e.currentTarget.setPointerCapture && e.currentTarget.setPointerCapture(e.pointerId); };
  const mueve = e => {
    const a = arrastre.current; if (!a) return;
    a.dy = e.clientY - a.y;
    if (!a.activo && a.dy > 14) a.activo = true;
    if (a.activo && hoja.current) { hoja.current.style.transition = 'none'; hoja.current.style.transform = 'translateY(' + Math.max(0, a.dy - 14) + 'px)'; }
  };
  const suelta = () => {
    const a = arrastre.current; arrastre.current = null; if (!a || !hoja.current) return;
    hoja.current.style.transition = ''; hoja.current.style.transform = '';
    if (a.activo && a.dy > 90) cerrar();
  };
  const { cuerpo, pie } = contenido(cerrar);
  return html`<div class=${'velo' + (sale ? ' sale' : '')} onClick=${() => cerrar()}></div>
    <div class=${'hoja' + (sale ? ' sale' : '')} ref=${hoja} role="dialog" aria-modal="true" aria-label=${titulo}>
      <div class="hoja-cab" onPointerDown=${baja} onPointerMove=${mueve} onPointerUp=${suelta} onPointerCancel=${suelta}>
        <span class="rayita"></span>
        <div class="fila"><h2>${titulo}</h2><button type="button" class="icono-btn chico toca" aria-label="Cerrar" onClick=${() => cerrar()}><${Icono} n="cerrar" t=${16} g=${2.4} /></button></div>
      </div>
      <div class="hoja-cuerpo">${cuerpo}</div>
      ${pie && html`<div class="hoja-pie">${pie}</div>`}
    </div>`;
}

// Símbolo para una forma de pago, una categoría de gasto o una sucursal.
const SIMBOLOS = [
  [/Efectivo/i, 'billete'], [/Tarjeta/i, 'tarjeta'], [/USDT|Binance|cripto/i, 'cripto'],
  [/Transfer|SPEI|Zelle|Interac|Pix|De Una/i, 'transfer'], [/Pago Móvil|Nequi|Daviplata|Yape|Plin|SINPE|Yappy|Bizum|MB Way|CoDi|QR|Cash App|Venmo|Satispay|Mercado Pago/i, 'movil'],
  [/Fiado|Por cobrar|Crédito/i, 'reloj'], [/Mercancía|Compras/i, 'caja'], [/Alquiler/i, 'casa'], [/Servicios/i, 'rayo'], [/Sueldo/i, 'personas'], [/Transporte/i, 'bus'],
  [/Centro|Norte|Sur|Este|Oeste|Principal|Sucursal|Local/i, 'edificio'], [/Otros?$/i, 'mas']
];
export const simbolo = n => { const s = SIMBOLOS.find(x => x[0].test(n || '')); return s ? s[1] : 'etiqueta'; };

export const iniciales = n => (n || '').split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() || 'ON';
export const TONOS = ['t-vio', 't-ver', 't-amb', 't-azu', 't-ros'];
export function hace(t) {
  const d = Math.floor((Date.now() - t) / 86400000);
  if (d <= 0) return 'hoy'; if (d === 1) return 'ayer'; return 'hace ' + d + ' días';
}
export const hora = t => new Date(t).toLocaleTimeString('es', { hour: 'numeric', minute: '2-digit' });
export const fechaCorta = t => new Date(t).toLocaleDateString('es', { day: 'numeric', month: 'short' }).replace('.', '');
