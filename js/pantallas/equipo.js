// Equipo y permisos: perfiles dentro del negocio y lo que cada rol puede hacer.
// Solo lo ven las cuentas principales (permiso «equipo»). El dueño siempre puede todo.
import { html, useState } from '../lib/preact-htm.js';
import { useApp } from '../ctx.js';
import { cambiarPermiso, resumen, inicioDia } from '../datos.js';
import { PERMISOS, rolDe, puedeEditarRol, puedeEditarPermiso } from '../permisos.js';
import { Reparto, color } from '../graficos.js';
import { Icono, Chips, iniciales, TONOS, avisar, hace } from '../ui.js';

export function Equipo() {
  const { S, D, E, tel, abrir, yo, puede } = useApp();
  const roles = S.roles;
  const editables = roles.filter(r => !r.fijo);
  const [rolSel, setRolSel] = useState(editables[0] ? editables[0].id : '');
  const hoy0 = inicioDia(Date.now()), r = resumen(hoy0, hoy0 + 86400000, '');
  const ventasDe = pid => S.ventas.filter(v => v.por === pid && v.t >= hoy0 && !v.anulada && !v.dev).length;
  const porPersona = S.perfiles.filter(p => r.porPersona[p.id]).map((p, i) => ({ n: p.n, v: r.porPersona[p.id], c: color(S.perfiles.indexOf(p)), i: 'personas' }));
  const tocar = (rol, k, on) => {
    if (rol.fijo) { avisar('El dueño siempre puede todo'); return; }
    if (!puedeEditarRol(yo, rol.id) || !puedeEditarPermiso(yo, k)) { avisar('Solo el dueño puede cambiar esto'); return; }
    cambiarPermiso(rol.id, k, !on);
    avisar((on ? 'Quitado: ' : 'Permitido: ') + PERMISOS.find(p => p.k === k).n.toLowerCase() + ' · ' + rol.n);
  };

  const Personas = html`<section class="tarjeta entra" style="padding-bottom:6px">
    <div class="tarjeta-tit">${S.perfiles.filter(p => !p.inactivo).length} personas<button type="button" class="btn2 chico lleno toca" onClick=${() => abrir('perfil', {})}>+ Perfil</button></div>
    <div class="lista">${S.perfiles.map((p, i) => { const rr = rolDe(S, p), puedo = p.id === yo.id || puedeEditarRol(yo, p.rol); return html`
      <button type="button" key=${p.id} class="item toca entra" style=${{ '--i': i, color: 'var(--ink)', opacity: p.inactivo ? 0.5 : 1, cursor: puedo ? 'pointer' : 'default' }} onClick=${() => puedo ? abrir('perfil', { pid: p.id }) : avisar('Solo el dueño puede cambiar este perfil')}>
        <span class=${'logo redondo ' + TONOS[i % 5]} style="width:40px;height:40px;font-size:14px">${iniciales(p.n)}</span>
        <span class="crece" style="display:flex;flex-direction:column;gap:2px"><b style="font-size:14px;font-weight:600">${p.n}${p.id === yo.id ? ' (tú)' : ''}</b>
          <span class="sub faint">${p.inactivo ? 'Desactivado' : (E ? (p.sucs && p.sucs.length ? p.sucs.join(', ') : 'Todos los locales') + ' · ' : '') + ventasDe(p.id) + ' ventas hoy' + (p.pin ? '' : ' · sin PIN')}</span></span>
        <span class=${'pildora ' + (p.rol === 'dueno' ? 't-vio' : p.rol === 'admin' ? 't-ver' : 't-azu')}>${rr ? rr.n : 'Sin rol'}</span>
      </button>`; })}</div>
  </section>`;

  const Ventas = puede('ganancias') && porPersona.length ? html`<section class="tarjeta entra" style="--i:2"><div class="tarjeta-tit">Ventas por persona<span class="sub">hoy</span></div><${Reparto} segs=${porPersona} f=${D.m} titulo="Vendido hoy" /></section>` : null;

  const Matriz = html`<section class="tarjeta entra" data-tour="equipo" style="--i:1">
    <div class="tarjeta-tit">Qué puede hacer cada rol<button type="button" class="btn2 chico acento toca" onClick=${() => abrir('rol')}>+ Rol</button></div>
    <span class="sub" style="display:block;margin:-4px 0 10px">Toca para dar o quitar un permiso. El dueño siempre puede todo.</span>
    <div style="overflow-x:auto"><table class="matriz">
      <thead><tr><th>Permiso</th>${roles.map(rl => html`<th>${rl.n}</th>`)}</tr></thead>
      <tbody>${PERMISOS.map(pm => html`<tr key=${pm.k}><td><span class="fila" style="gap:8px"><span class="simb-c" style="--c:var(--c1)"><${Icono} n=${pm.i} t=${14} /></span>${pm.n}</span></td>
        ${roles.map(rl => { const on = rl.fijo || !!rl.p[pm.k], bloq = rl.fijo || !puedeEditarRol(yo, rl.id) || !puedeEditarPermiso(yo, pm.k); return html`<td><button type="button" class=${'permiso-btn toca ' + (on ? 'on' : 'off')} role="switch" aria-checked=${on ? 'true' : 'false'} aria-label=${pm.n + ' · ' + rl.n} title=${bloq ? (rl.fijo ? 'El dueño siempre puede todo' : 'Solo el dueño puede cambiar esto') : ''} style=${{ opacity: bloq ? 0.55 : 1 }} onClick=${() => tocar(rl, pm.k, on)}><${Icono} n=${on ? 'check' : 'menos1'} t=${15} g=${2.8} /></button></td>`; })}
      </tr>`)}</tbody>
    </table></div>
  </section>`;

  const rolActual = roles.find(x => x.id === rolSel) || editables[0];
  const PorRol = rolActual ? html`<section class="tarjeta entra" style="--i:1">
    <div class="tarjeta-tit">Qué puede hacer cada rol<button type="button" class="btn2 chico acento toca" onClick=${() => abrir('rol')}>+ Rol</button></div>
    <${Chips} opciones=${editables.map(x => ({ v: x.id, n: x.n }))} valor=${rolActual.id} onCambio=${setRolSel} desliza chico />
    <div class="lista" style="margin-top:8px">${PERMISOS.map(pm => { const on = !!rolActual.p[pm.k], bloq = !puedeEditarRol(yo, rolActual.id) || !puedeEditarPermiso(yo, pm.k); return html`
      <button type="button" key=${rolActual.id + pm.k} class="item toca" role="switch" aria-checked=${on ? 'true' : 'false'} style=${{ color: 'var(--ink)', opacity: bloq ? 0.6 : 1 }} onClick=${() => tocar(rolActual, pm.k, on)}>
        <span class="simb-c" style=${{ '--c': on ? 'var(--in)' : 'var(--faint)', width: '32px', height: '32px' }}><${Icono} n=${pm.i} t=${16} /></span>
        <span class="crece" style="font-size:14px">${pm.n}${pm.principal ? html`<span class="sub faint" style="display:block;font-size:11px">Lo tienen las cuentas principales</span>` : null}</span>
        <span class=${'inter' + (on ? ' on' : '')}></span>
      </button>`; })}</div>
    <span class="sub faint" style="display:block;margin-top:8px">El dueño siempre puede todo. Un administrador no puede cambiar a otros administradores.</span>
  </section>` : null;

  if (tel) return html`<div class="fila entra"><h1 class="titulo crece">Equipo</h1></div>${Personas}${Ventas}${PorRol}`;
  return html`<div class="dos-uno" style="align-items:start">${Matriz}<div class="pila">${Personas}${Ventas}</div></div>`;
}
