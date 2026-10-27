// Recorrido guiado por toda la app: ilumina cada parte y explica para qué sirve.
// Se adapta al aparato (teléfono o computadora) y a los permisos de quien lo ve: solo muestra lo que puede usar.
import { html, useState, useEffect, useRef } from './lib/preact-htm.js';
import { useApp } from './ctx.js';
import { Icono, LogoOrbe } from './ui.js';

function pasosPara({ S, T, tel, puede, ver, E }) {
  const vender = T.vender === 'Pedido' ? 'pedidos' : T.vender === 'Cobrar' ? 'cobros' : 'ventas';
  const dual = S.negocio.pais === 'VE' || S.negocio.pais === 'AR';
  const p = [
    { titulo: 'Bienvenido a Orbe Negocios', texto: 'Te muestro lo principal en un minuto. Puedes salir cuando quieras y verlo otra vez en Ajustes.', icono: true },
    tel
      ? { sec: 'hoy', sel: '[data-tour=resumen]', titulo: 'Cómo va el día', texto: 'Lo vendido hoy, comparado con ayer y con tu promedio. Las barras muestran a qué hora vendes más.' }
      : { sec: 'hoy', sel: '.cifras', titulo: 'Tu panel', texto: 'Lo vendido hoy, lo que ganaste, lo que te deben y lo que tienes por pagar. Todo se actualiza al instante.' },
    tel ? { sec: 'hoy', sel: '[data-tour=accesos]', titulo: 'Lo de todos los días', texto: 'Desde aquí vendes, anotas un gasto o haces el cierre del día con un toque.' } : null,
    { sec: 'hoy', sel: '[data-tour=pendientes]', titulo: 'Pendientes de hoy', texto: 'Orbe te avisa a quién cobrarle, qué reponer, qué cuentas vencen' + (dual ? ' y la tasa del dólar' : '') + '. Toca cualquiera para resolverlo.' },
    tel ? { sel: '.nav-tel', titulo: 'Las secciones', texto: 'Abajo cambias de sección. Solo ves las que tu perfil tiene permitidas.' }
      : { sel: '.lateral nav', titulo: 'El menú', texto: 'Ordenado en Día a día, Operación y Gestión. Los números de colores son cosas pendientes.' },
    !tel ? { sel: '.barra-sup .buscador', titulo: 'Buscar', texto: 'Escribe un producto o un cliente y pulsa Enter. Lo encuentras desde cualquier pantalla.' } : null,
    ver('vender') && (tel
      ? { sec: 'vender', sel: '.productos', titulo: 'Vender', texto: 'Toca un producto para sumarlo a la venta. Si lo tocas otra vez, suma uno más.' }
      : { sec: 'vender', sel: '[data-tour=lector]', titulo: 'La caja', texto: 'Pasa el lector de códigos o escribe el nombre y pulsa Enter. F1 te trae aquí; F12 cobra; Esc vacía la venta.' }),
    ver('vender') && { sec: 'vender', sel: tel ? '[data-tour=cobrar]' : '.caja-pc .ticket', titulo: 'Cobrar', texto: 'Al cobrar eliges la forma de pago. Puedes combinar varias: por ejemplo, una parte por ' + (S.negocio.pays[0] || 'transferencia') + ' y el resto por ' + (S.negocio.pays[S.negocio.pays.length - 1] || 'efectivo') + (puede('fiado') ? ', o dejar una parte fiada' : '') + '.' },
    { sec: 'clientes', sel: tel ? '[data-tour=deben]' : '.tabla-caja', titulo: 'Clientes', texto: 'Quién te debe y desde cuándo. Con un toque le mandas el recordatorio por WhatsApp' + (puede('clientes') ? ' o anotas lo que te pagó, también combinado' : '') + '.' },
    { sec: 'inventario', sel: tel ? '[data-tour=productos] > :first-child' : '.tabla-caja', titulo: T.inv ? 'Inventario' : 'Servicios', texto: T.inv ? 'Lo que tienes y lo que falta. Orbe te avisa cuando algo baja del mínimo. Toca un producto para cambiarlo o borrarlo.' : 'Tus servicios con su precio y lo que duran. Toca uno para cambiarlo.' },
    !tel && ver('gastos') ? { sec: 'gastos', sel: '.tres', titulo: 'Gastos y por pagar', texto: 'Anota lo que gastas y las cuentas que pagas después. Orbe te avisa antes de que venzan.' } : null,
    tel && (puede('gastos') || puede('cierre')) ? { sec: 'mas', sel: '[data-tour=mas-acciones]', titulo: 'Gastos y cierre', texto: 'Anota gastos y cuentas por pagar, y al final del día cuenta la caja: Orbe te dice si cuadra.' } : null,
    ver('reportes') ? { sec: 'reportes', sel: tel ? '.pantalla > section, .pantalla > .tarjeta' : '.contenido .cifras', titulo: 'Reportes', texto: 'Cuánto vendiste, cuánto ganaste de verdad después de gastos, cómo te pagan y qué se vende más.' } : null,
    ver('equipo') ? { sec: 'equipo', sel: tel ? '.pantalla .tarjeta' : '[data-tour=equipo]', titulo: 'Tu equipo', texto: 'Con «+ Perfil» creas a cada persona con su rol y su PIN. Con «+ Rol» y los interruptores decides qué puede hacer cada rol.' } : null,
    { sec: 'mas', sel: '[data-tour=perfil]', titulo: 'Tu perfil', texto: 'Cambia tu nombre o PIN, o pásale el aparato a otra persona con «Cambiar de perfil».' },
    puede('ajustes') ? { sec: 'mas', sel: '[data-tour=copias]', titulo: 'Copias', texto: 'Orbe guarda una copia cada día. Si algo sale mal, aquí la restauras. También puedes descargarla.' } : null,
    { titulo: '¡Listo!', texto: 'Eso es lo principal. Si quieres ver este recorrido otra vez, está en Ajustes → Ayuda.', icono: true, fin: true }
  ];
  return p.filter(Boolean);
}

export function Recorrido({ onFin }) {
  const ctx = useApp();
  const pasos = useRef(pasosPara(ctx)).current;
  const [i, setI] = useState(0);
  const [luz, setLuz] = useState(null);
  const dir = useRef(1), secAntes = useRef(null);
  const paso = pasos[i];

  const medir = el => {
    const r = el.getBoundingClientRect(), vh = innerHeight, pad = 8;
    const top = Math.max(8, r.top - pad), bottom = Math.min(vh - 8, r.bottom + pad);
    setLuz({ top, left: Math.max(8, r.left - pad), w: Math.min(innerWidth - 16, r.width + pad * 2), h: Math.max(24, bottom - top) });
  };
  useEffect(() => {
    let vivo = true, intentos = 0;
    const cambia = paso.sec && paso.sec !== secAntes.current;
    if (paso.sec) { secAntes.current = paso.sec; ctx.ir(paso.sec); }
    if (!paso.sel) { setLuz(null); return; }
    const buscar = () => {
      if (!vivo) return;
      const el = document.querySelector(paso.sel);
      if (!el) { if (intentos++ < 15) { setTimeout(buscar, 80); return; } mover(dir.current); return; }
      el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      setTimeout(() => vivo && medir(el), 420);
    };
    setTimeout(buscar, cambia ? 480 : 60);
    const re = () => { const el = paso.sel && document.querySelector(paso.sel); if (el) medir(el); };
    addEventListener('resize', re);
    return () => { vivo = false; removeEventListener('resize', re); };
  }, [i]);

  function mover(d) {
    dir.current = d;
    const n = i + d;
    if (n < 0) return;
    if (n >= pasos.length) { terminar(); return; }
    setI(n);
  }
  function terminar() { ctx.ir('hoy'); onFin(); }
  useEffect(() => {
    const k = e => {
      if (e.key === 'Escape') { e.preventDefault(); terminar(); }
      else if (e.key === 'ArrowRight' || e.key === 'Enter') { e.preventDefault(); mover(1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); mover(-1); }
    };
    addEventListener('keydown', k, true);
    return () => removeEventListener('keydown', k, true);
  });

  // Dónde va la tarjeta: debajo de lo iluminado si cabe; si no, encima; si tampoco, abajo de la pantalla.
  const vh = typeof innerHeight === 'number' ? innerHeight : 800, vw = innerWidth, ancho = Math.min(380, vw - 32);
  let pos = { top: Math.max(16, vh / 2 - 150) + 'px', left: (vw - ancho) / 2 + 'px' };
  if (luz) {
    const left = ctx.tel ? 16 : Math.min(Math.max(16, luz.left), vw - ancho - 16);
    if (vh - (luz.top + luz.h) >= 230) pos = { top: luz.top + luz.h + 14 + 'px', left: left + 'px' };
    else if (luz.top >= 230) pos = { bottom: vh - luz.top + 14 + 'px', left: left + 'px' };
    else pos = { bottom: '16px', left: left + 'px' };
  }
  const visibles = pasos.length;
  return html`<div class="tour" role="dialog" aria-modal="true" aria-label="Recorrido guiado">
    <div class="tour-tapa"></div>
    <div class="tour-luz" style=${luz ? { top: luz.top + 'px', left: luz.left + 'px', width: luz.w + 'px', height: luz.h + 'px' } : { top: vh / 2 + 'px', left: vw / 2 + 'px', width: '0px', height: '0px' }}></div>
    <div class="tour-caja" key=${i} style=${Object.assign({ width: ancho + 'px' }, pos)}>
      ${paso.icono && html`<div style="display:flex;justify-content:center;margin-bottom:4px"><${LogoOrbe} t=${56} orbita=${!paso.fin} /></div>`}
      <span class="sub" style="font-size:12px;font-weight:600;color:var(--accent)">Paso ${i + 1} de ${visibles}</span>
      <b style="font-size:18px;letter-spacing:-0.01em">${paso.titulo}</b>
      <p class="sub" style="margin:0;line-height:1.5;color:var(--ink);opacity:.85">${paso.texto}</p>
      <div class="tour-puntos" aria-hidden="true">${pasos.map((_, k) => html`<i class=${k === i ? 'on' : k < i ? 'ya' : ''}></i>`)}</div>
      <div class="fila" style="gap:8px;margin-top:4px">
        ${paso.fin ? null : html`<button type="button" class="btn2 chico toca" onClick=${terminar}>Salir</button>`}
        <span class="crece"></span>
        ${i > 0 && !paso.fin ? html`<button type="button" class="icono-btn chico toca" aria-label="Paso anterior" onClick=${() => mover(-1)}><${Icono} n="atras" t=${16} /></button>` : null}
        <button type="button" class="btn2 chico lleno toca" onClick=${() => mover(1)}>${paso.fin ? 'Terminar' : i === 0 ? 'Empezar' : 'Siguiente'}${paso.fin ? null : html` <${Icono} n="sig" t=${14} g=${2.6} />`}</button>
      </div>
    </div>
  </div>`;
}

// Tarjeta que ofrece el recorrido la primera vez que alguien entra con su perfil.
export function OfertaRecorrido() {
  const { yo, verRecorrido, omitirRecorrido } = useApp();
  if (!yo || yo.tour) return null;
  return html`<section class="tarjeta fila entra oferta-tour" data-tour-oferta>
    <span class="oferta-logo"><${LogoOrbe} t=${44} orbita /></span>
    <span class="crece" style="display:flex;flex-direction:column;gap:2px;min-width:0"><b style="font-size:15px">¿Primera vez, ${yo.n.split(' ')[0]}?</b><span class="sub" style="line-height:1.4">Te muestro cómo funciona Orbe en un minuto.</span></span>
    <span class="fila" style="gap:6px;flex-wrap:wrap;justify-content:flex-end">
      <button type="button" class="btn2 chico toca" onClick=${omitirRecorrido}>Ahora no</button>
      <button type="button" class="btn2 chico lleno toca" onClick=${verRecorrido}>Ver recorrido</button>
    </span>
  </section>`;
}
