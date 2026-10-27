// ¿Quién está usando Orbe? Cada persona entra con su perfil y su PIN.
// El PIN se marca en un teclado en pantalla: el teclado del teléfono nunca se abre solo.
import { html, useState, useEffect } from '../lib/preact-htm.js';
import { useDatos, entrar } from '../datos.js';
import { rolDe } from '../permisos.js';
import { Icono, LogoOrbe, iniciales, TONOS, avisar } from '../ui.js';

export function Teclado({ largo = 4, onListo, error }) {
  const [v, setV] = useState('');
  const [mal, setMal] = useState(false);
  const toca = d => {
    if (v.length >= largo) return;
    const nv = v + d; setV(nv);
    if (nv.length === largo) setTimeout(() => { if (!onListo(nv)) { setMal(true); setTimeout(() => { setMal(false); setV(''); }, 450); } }, 120);
  };
  const borra = () => setV(v.slice(0, -1));
  useEffect(() => {
    // En la computadora también se puede escribir con el teclado físico (solo cuando la persona teclea).
    const k = e => { if (/^\d$/.test(e.key)) toca(e.key); else if (e.key === 'Backspace') borra(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  });
  return html`<div class="pila" style="align-items:center;gap:22px">
    <div class=${'puntos-pin' + (mal ? ' mal' : '')} role="status" aria-label=${v.length + ' de ' + largo + ' números'}>${Array.from({ length: largo }, (_, i) => html`<i class=${i < v.length ? 'on' : ''}></i>`)}</div>
    ${error && html`<span class="sub out">${error}</span>`}
    <div class="teclado">${['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '<'].map(d => d === '' ? html`<span></span>` : html`<button type="button" class="toca" aria-label=${d === '<' ? 'Borrar' : d} onClick=${() => d === '<' ? borra() : toca(d)}>${d === '<' ? html`<${Icono} n="atras" t=${22} />` : d}</button>`)}</div>
  </div>`;
}

export function Acceso({ tel }) {
  const S = useDatos();
  const activos = S.perfiles.filter(p => !p.inactivo);
  const [elegido, setElegido] = useState(null);
  // Un solo perfil sin PIN: entra directo.
  useEffect(() => { if (activos.length === 1 && !activos[0].pin) entrar(activos[0].id); }, []);
  const tocar = p => { if (!p.pin) { entrar(p.id); avisar('Hola, ' + p.n.split(' ')[0]); } else setElegido(p); };
  const caja = contenido => html`<div style=${tel ? 'min-height:100dvh;display:flex;flex-direction:column;padding:calc(56px + env(safe-area-inset-top)) 22px calc(24px + env(safe-area-inset-bottom))' : 'min-height:100vh;display:grid;place-items:center;padding:32px 16px'}>
    <div class=${tel ? 'pila' : 'tarjeta pila'} style=${tel ? 'flex:1;gap:18px' : 'width:min(480px,100%);padding:32px;gap:18px;border-radius:28px'}>${contenido}</div></div>`;

  if (elegido) return caja(html`
    <button type="button" class="icono-btn toca" aria-label="Volver" onClick=${() => setElegido(null)}><${Icono} n="atras" /></button>
    <div class="pila entra" style="align-items:center;gap:8px;text-align:center">
      <span class=${'logo redondo ' + TONOS[S.perfiles.indexOf(elegido) % 5]} style="width:72px;height:72px;font-size:24px">${iniciales(elegido.n)}</span>
      <h1 style="font-size:24px">Hola, ${elegido.n.split(' ')[0]}</h1><span class="sub">Escribe tu PIN</span>
    </div>
    <div class="entra" style="--i:2;margin-top:8px"><${Teclado} onListo=${pin => { if (pin === elegido.pin) { entrar(elegido.id); avisar('Hola, ' + elegido.n.split(' ')[0]); return true; } return false; }} /></div>
    <span class="sub faint" style="text-align:center;margin-top:auto">¿Olvidaste tu PIN? Pídele al dueño que te ponga uno nuevo.</span>`);

  return caja(html`
    <div class="fila entra" style="gap:12px"><${LogoOrbe} t=${44} orbita /><span style="display:flex;flex-direction:column"><b style="font-size:17px">${S.negocio.nombre}</b><span class="sub">Orbe Negocios</span></span></div>
    <h1 class="entra" style="--i:2;font-size:26px;margin-top:10px">¿Quién está usando Orbe?</h1>
    <div class="perfiles">${activos.map((p, i) => { const r = rolDe(S, p); return html`
      <button type="button" key=${p.id} class="tarjeta toca entra perfil-btn" style=${{ '--i': 3 + i }} onClick=${() => tocar(p)}>
        <span class=${'logo redondo ' + TONOS[S.perfiles.indexOf(p) % 5]} style="width:56px;height:56px;font-size:18px">${iniciales(p.n)}</span>
        <b>${p.n}</b><span class="sub">${r ? r.n : ''}${p.pin ? '' : ' · sin PIN'}</span>
      </button>`; })}</div>
    <span class="sub faint" style="margin-top:auto;text-align:center">Cada persona ve solo lo que el dueño le permite.</span>`);
}
