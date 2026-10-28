// Grupos de productos: filtro en la caja y el inventario, y hojas para crearlos y llenarlos.
import { html, useState } from '../lib/preact-htm.js';
import { useApp } from '../ctx.js';
import { listaProductos, guardarGrupo, borrarGrupo, asignarGrupo } from '../datos.js';
import { Hoja, Icono, avisar } from '../ui.js';
import { buscar } from '../buscar.js';

// Ocho colores distintos para los grupos (se ven bien en claro y en oscuro).
export const COLORES_GRUPO = ['#7b6cff', '#22b07d', '#e8961a', '#3d9be9', '#f0567a', '#a35bf0', '#12a5a0', '#b07a3c'];
export const colorGrupo = g => COLORES_GRUPO[(g ? g.c || 0 : 0) % COLORES_GRUPO.length];
// Iniciales de un nombre: «Queso blanco» → QB, «Pan» → PA (sin «de», «x» ni números).
export const iniciales2 = n => { const ps = String(n).split(/\s+/).filter(w => w && !/^(de|del|la|el|los|las|con|en|y|x|\d.*)$/i.test(w)); return (ps.length > 1 ? ps[0][0] + ps[1][0] : (ps[0] || n).slice(0, 2)).toUpperCase(); };
export const grupoDe = (S, p) => S.grupos.find(g => g.id === p.g) || null;
// Textos con los que se busca un producto: nombre, código y nombre de su grupo.
export const textosProducto = S => p => { const g = grupoDe(S, p); return [p.n, p.cod, g ? g.n : '']; };

// Fila de grupos para filtrar. valor: '' (todos), id de grupo o 'sin' (sin grupo).
export function FiltroGrupos({ valor, onCambio, lista, crear }) {
  const { S, tel, abrir, puede } = useApp();
  const prods = lista || listaProductos();
  if (!S.grupos.length) {
    // Con muchos productos y sin grupos, se sugiere crearlos.
    return prods.length > 12 && crear !== false && puede('productos') ? html`<button type="button" class="chip chico toca" style="align-self:flex-start;border:1.5px dashed var(--line);background:transparent" onClick=${() => abrir('grupos')}>+ Ordena tus ${prods.length} productos en grupos</button>` : null;
  }
  const cuenta = id => prods.filter(p => id === 'sin' ? !p.g || !S.grupos.some(g => g.id === p.g) : p.g === id).length;
  const sinGrupo = cuenta('sin');
  return html`<div class=${'chips grupos-filtro' + (tel ? ' desliza' : '')} role="group" aria-label="Grupos">
    <button type="button" class=${'chip chico toca' + (!valor ? ' on' : '')} aria-pressed=${!valor ? 'true' : 'false'} onClick=${() => onCambio('')}>Todo <span class="faint num">${prods.length}</span></button>
    ${S.grupos.map(g => html`<button type="button" key=${g.id} class=${'chip chico toca' + (valor === g.id ? ' on' : '')} aria-pressed=${valor === g.id ? 'true' : 'false'} onClick=${() => onCambio(valor === g.id ? '' : g.id)}><i class="punto-grupo" style=${{ background: colorGrupo(g) }}></i>${g.n} <span class="faint num">${cuenta(g.id)}</span></button>`)}
    ${sinGrupo > 0 && html`<button type="button" class=${'chip chico toca' + (valor === 'sin' ? ' on' : '')} onClick=${() => onCambio(valor === 'sin' ? '' : 'sin')}>Sin grupo <span class="faint num">${sinGrupo}</span></button>`}
    ${puede('productos') && crear !== false && html`<button type="button" class="chip chico toca" style="border:1.5px dashed var(--line);background:transparent" aria-label="Organizar grupos" onClick=${() => abrir('grupos')}><${Icono} n="lapiz" t=${13} />Grupos</button>`}
  </div>`;
}
export const filtrarGrupo = (prods, S, g) => !g ? prods : g === 'sin' ? prods.filter(p => !p.g || !S.grupos.some(x => x.id === p.g)) : prods.filter(p => p.g === g);

// ---------- lista de grupos ----------
export function Grupos({ d, cerrar }) {
  const { S, T, abrir } = useApp();
  const prods = listaProductos();
  const [nuevo, setNuevo] = useState('');
  const crear = c => {
    const n = nuevo.trim(); if (!n) { avisar('Escribe el nombre del grupo'); return; }
    if (S.grupos.some(g => g.n.toLowerCase() === n.toLowerCase())) { avisar('Ya hay un grupo con ese nombre'); return; }
    const gid = guardarGrupo({ n }); setNuevo('');
    c(() => abrir('grupo', { gid, nuevo: true }));
  };
  return html`<${Hoja} titulo=${'Grupos de ' + (T.inv ? 'productos' : 'servicios')} onCerrar=${cerrar} contenido=${c => ({
    cuerpo: html`<span class="sub" style="margin-top:-6px;line-height:1.45">Ordena lo que vendes en grupos (Bebidas, Limpieza, Ropa…). En la caja tocas el grupo y ves solo eso.</span>
      <div class="lista">${S.grupos.map((g, i) => { const n = prods.filter(p => p.g === g.id).length; return html`<button type="button" key=${g.id} class="item toca entra" style=${{ '--i': i, color: 'var(--ink)' }} onClick=${() => c(() => abrir('grupo', { gid: g.id }))}>
        <span class="simb-c" style=${{ '--c': colorGrupo(g), width: '34px', height: '34px' }}><${Icono} n="etiqueta" t=${16} /></span>
        <span class="crece" style="display:flex;flex-direction:column;gap:1px"><b style="font-size:14px;font-weight:600">${g.n}</b><span class="sub faint">${n} ${n === 1 ? (T.inv ? 'producto' : 'servicio') : (T.inv ? 'productos' : 'servicios')}</span></span>
        <${Icono} n="sig" t=${16} c="var(--faint)" /></button>`; })}
        ${S.grupos.length ? null : html`<p class="vacio">Todavía no tienes grupos.</p>`}</div>
      <label class="campo"><span>Grupo nuevo</span><input type="text" value=${nuevo} placeholder="Ej.: Bebidas" autocomplete="off" onInput=${e => setNuevo(e.target.value)} onKeyDown=${e => { if (e.key === 'Enter') crear(c); }} /></label>`,
    pie: html`<button type="button" class="btn toca" onClick=${() => crear(c)}>Crear grupo</button>`
  })} />`;
}

// ---------- un grupo: nombre, color y qué productos tiene (se marcan varios de una vez) ----------
export function Grupo({ d, cerrar }) {
  const { S, D, T, abrir } = useApp();
  const g0 = S.grupos.find(g => g.id === d.gid);
  const prods = listaProductos();
  const [n, setN] = useState(g0 ? g0.n : '');
  const [c0, setC] = useState(g0 ? g0.c || 0 : 0);
  const [marcados, setMarcados] = useState(() => prods.filter(p => g0 && p.g === g0.id).map(p => p.id));
  const [q, setQ] = useState('');
  if (!g0) return null;
  const visibles = q.trim() ? buscar(prods, q, textosProducto(S)) : prods.slice().sort((a, b) => (marcados.includes(b.id) - marcados.includes(a.id)) || ((a.g ? 1 : 0) - (b.g ? 1 : 0)));
  const toca = p => setMarcados(marcados.includes(p.id) ? marcados.filter(x => x !== p.id) : marcados.concat([p.id]));
  const guardar = c => {
    if (!n.trim()) { avisar('Escribe el nombre'); return; }
    guardarGrupo({ id: g0.id, n: n.trim(), c: c0 }); asignarGrupo(g0.id, marcados);
    c(() => avisar(n.trim() + ': ' + marcados.length + (marcados.length === 1 ? ' producto' : ' productos')));
  };
  const borrar = c => c(() => abrir('confirmar', { titulo: '¿Borrar el grupo ' + g0.n + '?', texto: 'Sus productos no se borran: quedan sin grupo.', boton: 'Sí, borrar grupo', si: () => { borrarGrupo(g0.id); avisar('Grupo borrado'); } }));
  const otro = p => { const g = grupoDe(S, p); return g && g.id !== g0.id ? g : null; };
  return html`<${Hoja} titulo=${d.nuevo ? 'Grupo nuevo: ' + g0.n : 'Grupo ' + g0.n} onCerrar=${cerrar} contenido=${c => ({
    cuerpo: html`
      <label class="campo"><span>Nombre</span><input type="text" value=${n} autocomplete="off" onInput=${e => setN(e.target.value)} /></label>
      <div class="campo"><span>Color</span><div class="chips">${[0, 1, 2, 3, 4, 5, 6, 7].map(i => html`<button type="button" class=${'color-grupo toca' + (c0 === i ? ' on' : '')} style=${{ background: COLORES_GRUPO[i] }} aria-label=${'Color ' + (i + 1)} aria-pressed=${c0 === i ? 'true' : 'false'} onClick=${() => setC(i)}></button>`)}</div></div>
      <div class="campo"><span>Marca lo que va en este grupo · ${marcados.length} ${marcados.length === 1 ? 'marcado' : 'marcados'}</span>
        <label class="buscador" style="width:100%;background:var(--fill2)"><${Icono} n="buscar" t=${16} c="var(--muted)" /><input type="search" value=${q} placeholder=${'Buscar entre ' + prods.length} aria-label="Buscar productos" onInput=${e => setQ(e.target.value)} /></label>
        <div class="lista">${visibles.slice(0, 80).map(p => { const on = marcados.includes(p.id), og = otro(p); return html`<button type="button" key=${p.id} class="item toca" role="checkbox" aria-checked=${on ? 'true' : 'false'} style="color:var(--ink)" onClick=${() => toca(p)}>
          <span class=${'casilla' + (on ? ' on' : '')}>${on && html`<${Icono} n="check" t=${13} g=${3} />`}</span>
          <span class="crece" style="display:flex;flex-direction:column;gap:1px;min-width:0"><span class="corta" style="font-size:14px">${p.n}</span>${og && html`<span class="sub faint">Ahora en ${og.n}${on ? ' · se mueve aquí' : ''}</span>`}</span>
          <span class="sub num">${D.m(p.p)}</span></button>`; })}
          ${visibles.length > 80 ? html`<p class="sub" style="padding:8px 0">Hay ${visibles.length - 80} más: búscalos por nombre.</p>` : null}
          ${visibles.length ? null : html`<p class="vacio">No encontré «${q}».</p>`}</div></div>`,
    pie: html`<button type="button" class="btn toca" onClick=${() => guardar(c)}>Guardar grupo</button><button type="button" class="btn2 rojo toca" style="min-height:50px;border-radius:25px" onClick=${() => borrar(c)}>Borrar grupo</button>`
  })} />`;
}
