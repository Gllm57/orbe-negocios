// Recorrido guiado por toda la app: ilumina cada parte y explica para qué sirve.
// Se adapta al aparato (teléfono o computadora) y a los permisos de quien lo ve: solo muestra lo que puede usar.
import { html, useState, useEffect, useLayoutEffect, useRef } from './lib/preact-htm.js';
import { useApp } from './ctx.js';
import { Icono, LogoOrbe } from './ui.js';
import { pais, dosMonedas } from './paises.js';

function pasosPara({ S, T, tel, puede, ver, E }) {
  const vender = T.vender === 'Pedido' ? 'pedidos' : T.vender === 'Cobrar' ? 'cobros' : 'ventas';
  const dual = dosMonedas(pais(S.negocio.pais));
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

const quieto = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const DUR = 650;
// La misma curva que usa toda la app (--spring), para que el desplazamiento y la luz se muevan juntos.
function curva(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx, cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const X = t => ((ax * t + bx) * t + cx) * t, Y = t => ((ay * t + by) * t + cy) * t, dX = t => (3 * ax * t + 2 * bx) * t + cx;
  return x => { let t = x; for (let k = 0; k < 6; k++) { const d = dX(t); if (Math.abs(d) < 1e-6) break; t -= (X(t) - x) / d; } return Y(Math.min(1, Math.max(0, t))); };
}
const resorte = curva(0.32, 0.72, 0, 1);
const fijo = el => { for (let p = el; p && p !== document.body; p = p.parentElement) if (getComputedStyle(p).position === 'fixed' && !p.classList.contains('app-fondo')) return true; return false; };
function contenedor(el) {
  for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
    const o = getComputedStyle(p).overflowY;
    if ((o === 'auto' || o === 'scroll') && p.scrollHeight > p.clientHeight + 1) return p;
  }
  return null;
}
const cuadros = n => new Promise(ok => { const f = k => k ? requestAnimationFrame(() => f(k - 1)) : ok(); f(n); });

export function Recorrido({ onFin }) {
  const ctx = useApp();
  const pasos = useRef(pasosPara(ctx)).current;
  const [i, setI] = useState(0);
  const [vista, setVista] = useState({ luz: null, top: null, left: null, flecha: null });
  const [saliendo, setSaliendo] = useState(false);
  const dir = useRef(1), caja = useRef(null), toque = useRef(null), anim = useRef(0);
  const paso = pasos[i];
  const tel = ctx.tel;

  // Mientras dura el recorrido, las pantallas aparecen sin su animación de entrada (así lo iluminado no se mueve).
  useEffect(() => { document.documentElement.classList.add('en-recorrido'); return () => document.documentElement.classList.remove('en-recorrido'); }, []);

  // Ubica la tarjeta según lo iluminado y su propio alto: debajo, encima, al costado (computadora)
  // o, si lo iluminado es muy alto, se ilumina solo su parte de arriba y la tarjeta va debajo.
  // Lo que de verdad se ve: alto visible (en Safari cambia con la barra de abajo), zona segura
  // (isla dinámica arriba, indicador de inicio abajo) y dónde empieza la barra de navegación.
  function bordes() {
    let sonda = document.getElementById('tour-sonda');
    if (!sonda) { sonda = document.createElement('div'); sonda.id = 'tour-sonda'; sonda.setAttribute('aria-hidden', 'true'); sonda.style.cssText = 'position:fixed;top:0;left:0;width:0;visibility:hidden;pointer-events:none;padding-top:var(--sa-top);padding-bottom:var(--sa-bottom)'; document.body.appendChild(sonda); }
    const cs = getComputedStyle(sonda), vv = window.visualViewport;
    const vh = vv ? vv.height : innerHeight, vw = vv ? vv.width : innerWidth;
    const arriba = parseFloat(cs.paddingTop) || 0, abajo = parseFloat(cs.paddingBottom) || 0;
    const nav = tel && document.querySelector('.nav-tel');
    const navTop = nav ? nav.getBoundingClientRect().top : vh - abajo;
    return { vw, vh, arriba, abajo, sup: arriba + 10, inf: Math.min(navTop, vh - abajo) - 10 };
  }
  // Ubica la tarjeta según lo iluminado y su propio alto: debajo, encima, al costado (computadora)
  // o, si lo iluminado es muy alto, se ilumina solo su parte de arriba y la tarjeta va debajo.
  // Nunca queda debajo de la isla dinámica, del indicador de inicio ni de la barra de navegación.
  function ubicar(luz) {
    const B = bordes(), vw = B.vw, ancho = Math.min(380, vw - 32), m = 14;
    const alto = Math.min(caja.current ? caja.current.offsetHeight : 200, B.inf - B.sup), sup = B.sup, inf = B.inf;
    if (!luz) return { luz: null, top: sup + Math.max(0, (inf - sup - alto) / 2), left: (vw - ancho) / 2, flecha: null, max: inf - sup };
    const left = tel ? (vw - ancho) / 2 : Math.min(Math.max(16, luz.left + luz.w / 2 - ancho / 2), vw - ancho - 16);
    const x = Math.min(Math.max(luz.left + luz.w / 2 - left, 26), ancho - 26);
    if (luz.top + luz.h + m + alto <= inf) return { luz, top: luz.top + luz.h + m, left, flecha: { lado: 'arriba', x }, max: inf - sup };
    if (luz.top - m - alto >= sup) return { luz, top: luz.top - m - alto, left, flecha: { lado: 'abajo', x }, max: inf - sup };
    if (!tel) {
      const vis = Math.min(luz.h, inf - luz.top), top = Math.min(Math.max(sup, luz.top + vis / 2 - alto / 2), inf - alto);
      const y = Math.min(Math.max(luz.top + vis / 2 - top, 26), alto - 26);
      if (vw - (luz.left + luz.w) >= ancho + m + 16) return { luz, top, left: luz.left + luz.w + m, flecha: { lado: 'izq', y }, max: inf - sup };
      if (luz.left >= ancho + m + 16) return { luz, top, left: luz.left - m - ancho, flecha: { lado: 'der', y }, max: inf - sup };
    }
    // Muy alto: se ilumina la parte de arriba y la tarjeta va justo debajo.
    const h = Math.max(48, inf - alto - m - luz.top);
    const corta = Object.assign({}, luz, { h: Math.min(luz.h, h) });
    const top = Math.min(corta.top + corta.h + m, inf - alto);
    return { luz: corta, top, left, flecha: top >= corta.top + corta.h ? { lado: 'arriba', x } : null, max: inf - sup };
  }
  const rectDe = (r, dy) => {
    const B = bordes(), pad = 8, t = Math.max(B.arriba + 4, r.top - dy - pad), b = Math.min(B.vh - 4, r.bottom - dy + pad);
    return { top: t, left: Math.max(6, r.left - pad), w: Math.min(B.vw - 12, r.width + pad * 2), h: Math.max(24, b - t) };
  };

  // Cada paso: cambia de sección si hace falta, espera a que la pantalla nueva esté dibujada,
  // calcula a dónde hay que desplazar y mueve la pantalla y la luz a la vez, con la misma curva.
  useEffect(() => {
    let vivo = true, ro = null;
    cancelAnimationFrame(anim.current);
    (async () => {
      if (paso.sec && location.hash !== '#' + paso.sec) {
        ctx.ir(paso.sec);
        for (let k = 0; k < 60 && vivo && location.hash !== '#' + paso.sec; k++) await cuadros(1);
        await cuadros(2);
      }
      if (!vivo) return;
      if (!paso.sel) { setVista(ubicar(null)); return; }
      let el = null;
      for (let k = 0; k < 40 && vivo && !(el = document.querySelector(paso.sel)); k++) await cuadros(1);
      if (!vivo) return;
      if (!el) { mover(dir.current); return; }
      const r = el.getBoundingClientRect(), c = fijo(el) ? null : contenedor(el);
      let dy = 0;
      if (c) {
        const cr = c.getBoundingClientRect(), sup = document.querySelector('.barra-sup'), B = bordes();
        const areaTop = Math.max(cr.top + (sup && c.contains(sup) ? sup.offsetHeight : 0), B.sup), areaBot = Math.min(cr.bottom, B.inf);
        const alto = caja.current ? caja.current.offsetHeight : 200, areaH = areaBot - areaTop;
        const deseado = tel ? areaTop + 10 : r.height + alto + 40 < areaH ? areaTop + (areaH - (r.height + 14 + alto)) / 2 : areaTop + 20;
        const desde = c.scrollTop, hasta = Math.max(0, Math.min(c.scrollHeight - c.clientHeight, desde + r.top - deseado));
        dy = hasta - desde;
        if (Math.abs(dy) > 1) {
          const t0 = performance.now(), dur = quieto() ? 0 : DUR;
          const paso1 = now => { if (!vivo) return; const x = dur ? Math.min(1, (now - t0) / dur) : 1; c.scrollTop = desde + dy * resorte(x); if (x < 1) anim.current = requestAnimationFrame(paso1); };
          anim.current = requestAnimationFrame(paso1);
        }
      }
      const real = rectDe(r, dy); setVista(Object.assign(ubicar(real), { real }));
      // Si algo cambia de tamaño después (un gráfico que se acomoda), la luz se ajusta sola.
      if (window.ResizeObserver) {
        let primero = true;
        ro = new ResizeObserver(() => { if (primero) { primero = false; return; } if (vivo) { const real = rectDe(el.getBoundingClientRect(), 0); setVista(Object.assign(ubicar(real), { real })); } });
        setTimeout(() => vivo && ro.observe(el), DUR + 50);
      }
    })();
    const re = () => { const el = paso.sel && document.querySelector(paso.sel), real = el ? rectDe(el.getBoundingClientRect(), 0) : null; setVista(Object.assign(ubicar(real), { real })); };
    addEventListener('resize', re);
    if (window.visualViewport) visualViewport.addEventListener('resize', re);
    return () => { vivo = false; cancelAnimationFrame(anim.current); if (ro) ro.disconnect(); removeEventListener('resize', re); if (window.visualViewport) visualViewport.removeEventListener('resize', re); };
  }, [i]);
  // Si el texto nuevo cambia el alto de la tarjeta, se reubica antes de pintarse.
  useLayoutEffect(() => {
    if (!caja.current || vista.top == null) return;
    const v = ubicar(vista.real || vista.luz);
    if (Math.abs(v.top - vista.top) > 1 || Math.abs(v.left - vista.left) > 1 || (v.luz && vista.luz && Math.abs(v.luz.h - vista.luz.h) > 1)) setVista(Object.assign(v, { real: vista.real }));
  });

  function mover(d) {
    dir.current = d;
    const n = i + d;
    if (n < 0) return;
    if (n >= pasos.length) { terminar(); return; }
    setI(n);
  }
  function terminar() {
    if (saliendo) return;
    setSaliendo(true);
    setTimeout(() => { ctx.ir('hoy'); onFin(); }, quieto() ? 0 : 300);
  }
  useEffect(() => {
    const k = e => {
      if (e.key === 'Escape') { e.preventDefault(); terminar(); }
      else if (e.key === 'ArrowRight' || e.key === 'Enter') { e.preventDefault(); mover(1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); mover(-1); }
    };
    addEventListener('keydown', k, true);
    return () => removeEventListener('keydown', k, true);
  });
  // En el teléfono: deslizar la tarjeta a la izquierda avanza y a la derecha retrocede.
  const empieza = e => { const t = e.touches[0]; toque.current = { x: t.clientX, y: t.clientY }; };
  const suelta = e => {
    if (!toque.current) return;
    const t = e.changedTouches[0], dx = t.clientX - toque.current.x, dy = t.clientY - toque.current.y; toque.current = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) mover(dx < 0 ? 1 : -1);
  };

  const { luz, flecha } = vista, vw = window.visualViewport ? visualViewport.width : innerWidth, vh = window.visualViewport ? visualViewport.height : innerHeight, ancho = Math.min(380, vw - 32);
  const estiloLuz = luz ? { transform: 'translate(' + luz.left + 'px,' + luz.top + 'px)', width: luz.w + 'px', height: luz.h + 'px' } : { transform: 'translate(' + vw / 2 + 'px,' + vh / 2 + 'px)', width: '0px', height: '0px' };
  const estiloCaja = { width: ancho + 'px', maxHeight: vista.max ? vista.max + 'px' : null, transform: 'translate(' + (vista.left == null ? (vw - ancho) / 2 : vista.left) + 'px,' + (vista.top == null ? vh / 2 - 100 : vista.top) + 'px)' };
  return html`<div class=${'tour' + (saliendo ? ' sale' : '')} role="dialog" aria-modal="true" aria-label="Recorrido guiado">
    <div class="tour-tapa"></div>
    <div class=${'tour-luz' + (luz ? '' : ' sin')} style=${estiloLuz}><i class="tour-pulso" key=${'p' + i}></i></div>
    <div class="tour-caja" ref=${caja} style=${estiloCaja} onTouchStart=${empieza} onTouchEnd=${suelta}>
      ${flecha && html`<i class=${'tour-flecha ' + flecha.lado} style=${flecha.y != null ? { top: flecha.y + 'px' } : { left: flecha.x + 'px' }}></i>`}<div class="tour-dentro">
      <div class=${'tour-contenido ' + (dir.current > 0 ? 'de-der' : 'de-izq')} key=${i}>
        ${paso.icono && html`<div style="display:flex;justify-content:center;margin-bottom:4px"><${LogoOrbe} t=${56} orbita=${!paso.fin} /></div>`}
        <span class="sub" style="font-size:12px;font-weight:600;color:var(--accent)">Paso ${i + 1} de ${pasos.length}</span>
        <b style="font-size:18px;letter-spacing:-0.01em;line-height:1.25">${paso.titulo}</b>
        <p class="sub" style="margin:0;line-height:1.5;color:var(--ink);opacity:.85">${paso.texto}</p>
      </div>
      <div class="tour-progreso" aria-hidden="true"><i style=${{ transform: 'scaleX(' + (i + 1) / pasos.length + ')' }}></i></div>
      <div class="fila" style="gap:8px;margin-top:2px">
        ${paso.fin ? null : html`<button type="button" class="btn2 chico toca" onClick=${terminar}>Salir</button>`}
        <span class="crece"></span>
        ${i > 0 && !paso.fin ? html`<button type="button" class="icono-btn chico toca" aria-label="Paso anterior" onClick=${() => mover(-1)}><${Icono} n="atras" t=${16} /></button>` : null}
        <button type="button" class="btn2 chico lleno toca" onClick=${() => mover(1)}>${paso.fin ? 'Terminar' : i === 0 ? 'Empezar' : 'Siguiente'}${paso.fin ? null : html` <${Icono} n="sig" t=${14} g=${2.6} />`}</button>
      </div>
    </div></div>
  </div>`;
}

// Tarjeta que ofrece el recorrido la primera vez que alguien entra con su perfil.
export function OfertaRecorrido() {
  const { yo, verRecorrido, omitirRecorrido } = useApp();
  if (!yo || yo.tour) return null;
  return html`<section class="tarjeta entra oferta-tour" data-tour-oferta>
    <span class="oferta-logo"><${LogoOrbe} t=${44} orbita /></span>
    <span style="display:flex;flex-direction:column;gap:2px;min-width:0"><b style="font-size:15px">¿Primera vez, ${yo.n.split(' ')[0]}?</b><span class="sub" style="line-height:1.4">Te muestro cómo funciona Orbe en un minuto.</span></span>
    <span class="oferta-btns">
      <button type="button" class="btn2 chico toca" onClick=${omitirRecorrido}>Ahora no</button>
      <button type="button" class="btn2 chico lleno toca" onClick=${verRecorrido}>Ver recorrido</button>
    </span>
  </section>`;
}
