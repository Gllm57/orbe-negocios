// Botón Orbe (celular): el logo en el centro de la barra de abajo. Al tocarlo sube un panel con
// lo que se crea a diario (venta, orden, gasto…) y las secciones que no caben en la barra.
// Solo aparecen las opciones que el perfil tiene permitidas.
import { html, useState, useEffect } from '../lib/preact-htm.js';
import { useApp } from '../ctx.js';
import { ordenAtrasada } from '../datos.js';
import { Icono } from '../ui.js';

const COLORES = { venta: '#6a5cf2', orden: '#2f7fd1', gasto: '#e8436a', escanear: '#12a37a', cliente: '#c98512', caja: '#8f84ff' };

export function BotonOrbe({ seccion }) {
  const { S, T, ir, abrir, puede, ver } = useApp();
  const [abierto, setAbierto] = useState(false);
  useEffect(() => {
    if (!abierto) return;
    const tecla = e => { if (e.key === 'Escape') setAbierto(false); };
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, [abierto]);
  // Al elegir algo, primero se cierra el panel y luego se abre lo elegido (así la animación no se corta).
  const hacer = fn => () => { setAbierto(false); setTimeout(fn, 180); };
  const atrasadas = S.ordenes.filter(o => ordenAtrasada(o)).length;
  const crear = [
    puede('vender') && ['venta', 'carrito', T.vender === 'Pedido' ? 'Pedido' : 'Venta', () => ir('vender')],
    puede('ordenes') && ['orden', 'orden', 'Orden', () => abrir('nuevaOrden', {})],
    puede('gastos') && ['gasto', 'dinero', 'Gasto', () => abrir('gasto')],
    (puede('productos') || puede('reponer')) && T.inv && ['escanear', 'camara', 'Escanear', () => abrir('escaner', { para: 'inventario' })],
    puede('clientes') && ['cliente', 'personas', 'Cliente', () => abrir('nuevoCliente', {})],
    puede('vender') && ['caja', 'billete', 'Caja', () => abrir('caja')]
  ].filter(Boolean);
  const irA = [
    ver('clientes') && ['clientes', 'personas', 'Clientes', 0],
    ver('ordenes') && ['ordenes', 'orden', 'Órdenes', atrasadas],
    ver('reportes') && ['reportes', 'grafico', 'Reportes', 0],
    ver('equipo') && ['equipo', 'escudo', 'Equipo', 0]
  ].filter(Boolean);
  const dentro = ['clientes', 'ordenes', 'reportes', 'equipo'].includes(seccion);
  return html`
    <div class=${'orbe-velo' + (abierto ? ' on' : '')} onClick=${() => setAbierto(false)} aria-hidden="true"></div>
    <div class=${'orbe-panel' + (abierto ? ' on' : '')} role="dialog" aria-label="Menú de Orbe" aria-hidden=${abierto ? 'false' : 'true'}>
      ${crear.length > 0 && html`<span class="orbe-tit">Crear</span>
        <div class="orbe-crear">${crear.map((x, i) => html`<button type="button" key=${x[0]} class="toca" style=${{ '--d': i * 30 + 'ms', '--c': COLORES[x[0]] }} tabindex=${abierto ? 0 : -1} onClick=${hacer(x[3])}><span><${Icono} n=${x[1]} t=${22} c="#fff" /></span><b>${x[2]}</b></button>`)}</div>`}
      ${irA.length > 0 && html`<span class="orbe-tit">Ir a</span>
        <div class="orbe-ir">${irA.map((x, i) => html`<button type="button" key=${x[0]} class=${'toca' + (seccion === x[0] ? ' on' : '')} style=${{ '--d': 180 + i * 25 + 'ms' }} tabindex=${abierto ? 0 : -1} onClick=${hacer(() => ir(x[0]))}><${Icono} n=${x[1]} t=${17} />${x[2]}${x[3] ? html`<em>${x[3]}</em>` : null}</button>`)}</div>`}
    </div>
    <button type="button" class=${'boton-orbe toca' + (abierto ? ' abierto' : '') + (dentro ? ' dentro' : '')} data-tour="boton-orbe" aria-label=${abierto ? 'Cerrar el menú' : 'Abrir el menú de Orbe'} aria-expanded=${abierto ? 'true' : 'false'} onClick=${() => setAbierto(!abierto)}>
      <svg viewBox="0 0 92 92" width="44" height="44" aria-hidden="true"><g class="bo-logo"><circle cx="35" cy="39.7" r="23" stroke="#8f84ff" /><circle cx="57" cy="39.7" r="23" stroke="#3ddc9f" /><circle cx="46" cy="58.7" r="23" stroke="#f0a020" /></g></svg>
      <span class="bo-x"><${Icono} n="cerrar" t=${24} g=${2.4} c="#fff" /></span>
      ${atrasadas > 0 && !abierto && html`<i class="bo-punto" aria-label=${atrasadas + ' órdenes atrasadas'}></i>`}
    </button>`;
}

// Computadora: botón «Nuevo ▾» en la barra de arriba, con lo que se crea a diario.
export function BotonNuevo() {
  const { T, ir, abrir, puede } = useApp();
  const [abierto, setAbierto] = useState(false);
  useEffect(() => {
    if (!abierto) return;
    const fuera = e => { if (!e.target.closest('.nuevo-menu')) setAbierto(false); };
    const tecla = e => { if (e.key === 'Escape') setAbierto(false); };
    document.addEventListener('pointerdown', fuera); window.addEventListener('keydown', tecla);
    return () => { document.removeEventListener('pointerdown', fuera); window.removeEventListener('keydown', tecla); };
  }, [abierto]);
  const ops = [
    puede('vender') && ['venta', 'carrito', T.vender === 'Pedido' ? 'Pedido' : 'Venta', 'F12 para cobrar', () => ir('vender')],
    puede('ordenes') && ['orden', 'orden', 'Orden de trabajo', 'O un pedido con entrega', () => abrir('nuevaOrden', {})],
    puede('gastos') && ['gasto', 'dinero', 'Gasto', 'Lo que pagas o debes', () => abrir('gasto')],
    puede('clientes') && ['cliente', 'personas', 'Cliente', 'Con su teléfono', () => abrir('nuevoCliente', {})],
    puede('productos') && ['escanear', 'etiqueta', T.inv ? 'Producto' : 'Servicio', 'Con precio y existencia', () => abrir('producto', {})]
  ].filter(Boolean);
  if (!ops.length) return null;
  return html`<div class="nuevo-menu">
    <button type="button" class="btn2 lleno toca" aria-haspopup="menu" aria-expanded=${abierto ? 'true' : 'false'} onClick=${() => setAbierto(!abierto)}><${Icono} n="mas1" t=${16} g=${2.4} />Nuevo<span class=${'nuevo-flecha' + (abierto ? ' on' : '')}>▾</span></button>
    <div class=${'nuevo-lista' + (abierto ? ' on' : '')} role="menu">${ops.map((o, i) => html`<button type="button" key=${o[0]} role="menuitem" class="toca" style=${{ '--d': i * 25 + 'ms' }} tabindex=${abierto ? 0 : -1} onClick=${() => { setAbierto(false); o[4](); }}><span style=${{ background: COLORES[o[0]] }}><${Icono} n=${o[1]} t=${16} c="#fff" /></span><span class="crece" style="display:flex;flex-direction:column"><b>${o[2]}</b><small>${o[3]}</small></span></button>`)}</div>
  </div>`;
}
