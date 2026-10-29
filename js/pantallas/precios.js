// Cuidar precios: meta de ganancia, precios que quedaron por debajo (porque subió el costo o la tasa)
// y cuánta ganancia se comió la inflación. Con un toque se ajustan.
import { html, useState } from '../lib/preact-htm.js';
import { useApp } from '../ctx.js';
import { bajoMeta, margenMeta, margenDe, precioMeta, costoReposicion, ajustarPrecios, cambiarNegocio, resumen } from '../datos.js';
import { pais } from '../paises.js';
import { Hoja, Icono, Chips, Interruptor, avisar } from '../ui.js';
import { numero } from './pagos.js';

export function Precios({ d, cerrar }) {
  const { S, P, D, abrir, puede } = useApp();
  const n = S.negocio, meta = margenMeta();
  const [otra, setOtra] = useState('');
  const [redondear, setRedondear] = useState(true);
  const lista = bajoMeta().slice().sort((a, b) => margenDe(a) - margenDe(b));
  const [fuera, setFuera] = useState([]);
  const elegidos = lista.filter(p => !fuera.includes(p.id));
  // Redondeo siempre hacia arriba, para no quedar otra vez debajo de la meta.
  const paso = P.id === 'VE' || P.r === 1 ? 0.01 : P.r >= 1000 ? 50 : P.r >= 100 ? 10 : P.r >= 10 ? 0.5 : 0.05;
  const arriba = x => { let y = redondear ? D.bonito(x) : D.redondo(x); if (y < x - 1e-9) y = redondear ? D.bonito(y + paso) : D.redondo(y + 0.01); return y; };
  const sugerido = p => arriba(precioMeta(p));
  // Lo que se comió la inflación este mes: lo que se ganó con el costo anotado menos lo que se ganaría reponiendo a precio de hoy.
  const mes0 = new Date(); mes0.setDate(1); mes0.setHours(0, 0, 0, 0);
  const r = resumen(mes0.getTime(), Date.now() + 1, ''), comido = Math.max(0, r.ganancia - r.ganReposicion);
  const local = n.pais !== 'VE' && !!pais(n.pais).usd2;
  const ponMeta = v => { if (!(v > 0 && v < 95)) { avisar('Escribe un porcentaje entre 1 y 94'); return; } cambiarNegocio({ margenMeta: v }, 'Cambió la meta de ganancia a ' + v + ' %'); };
  const aplicar = c => {
    if (!puede('productos')) { avisar('Tu perfil no puede cambiar precios'); return; }
    if (!elegidos.length) { avisar('Marca al menos un producto'); return; }
    ajustarPrecios(elegidos.map(p => ({ id: p.id, p: sugerido(p) })), 'Ajustó ' + elegidos.length + ' precios para ganar ' + Math.round(meta * 100) + ' %');
    c(() => avisar(elegidos.length + (elegidos.length === 1 ? ' precio ajustado' : ' precios ajustados')));
  };
  const valorMeta = Math.round(meta * 100);
  return html`<${Hoja} titulo="Cuidar precios" onCerrar=${cerrar} contenido=${c => ({
    cuerpo: html`<span class="sub" style="margin-top:-6px;line-height:1.45">Cuando sube lo que te cuesta reponer, tus precios se quedan atrás. Aquí ves cuáles y los ajustas de un toque.</span>
      ${comido > 0.009 && html`<div class="tarjeta fila entra" style="box-shadow:none;background:var(--amber-soft);gap:12px;align-items:flex-start">
        <span class="ic t-amb"><${Icono} n="alerta" t=${18} /></span>
        <span class="sub" style="color:var(--ink);line-height:1.45"><b>Este mes la inflación se comió ${D.m(comido)}</b> de tu ganancia: vendiste cosas a precios pensados para un costo que ya subió.</span></div>`}
      <div class="campo"><span>Tu meta de ganancia</span>
        <${Chips} opciones=${[20, 25, 30, 40, 50].map(v => ({ v, n: v + ' %' })).concat([{ v: 'otra', n: 'Otra' }])} valor=${[20, 25, 30, 40, 50].includes(valorMeta) && otra === '' ? valorMeta : 'otra'} onCambio=${v => { if (v === 'otra') setOtra(String(valorMeta)); else { setOtra(''); ponMeta(v); } }} chico />
        ${otra !== '' && html`<div class="fila entra" style="gap:8px"><input class="num" type="text" inputmode="decimal" value=${otra} aria-label="Meta de ganancia" onInput=${e => setOtra(e.target.value)} style="max-width:120px" /><button type="button" class="btn2 chico acento toca" onClick=${() => ponMeta(Math.round(numero(otra)))}>Guardar</button></div>`}
        <span class="sub faint" style="font-size:12px">De cada precio, cuánto te queda después de reponer el producto.</span>
      </div>
      ${local && html`<${Interruptor} on=${!!n.costoDolar} onCambio=${v => cambiarNegocio({ costoDolar: v }, (v ? 'Activó' : 'Desactivó') + ' costos que siguen al dólar')} titulo="Mis costos siguen al dólar" sub="Lo que anotaste como costo se lleva a la tasa de hoy para saber cuánto cuesta reponerlo." />`}
      ${lista.length ? html`
        <div class="fila"><b class="crece" style="font-size:14px">${lista.length} ${lista.length === 1 ? 'producto gana' : 'productos ganan'} menos de ${valorMeta} %</b><button type="button" class="enlace-tasa toca" onClick=${() => setFuera(elegidos.length ? lista.map(p => p.id) : [])}>${elegidos.length ? 'Ninguno' : 'Todos'}</button></div>
        <div class="tarjeta" style="box-shadow:none;background:var(--fill2);padding:2px 12px"><div class="lista">${lista.slice(0, 60).map(p => { const on = !fuera.includes(p.id), mg = margenDe(p), nuevo = sugerido(p); return html`
          <button type="button" key=${p.id} class="item toca" role="checkbox" aria-checked=${on ? 'true' : 'false'} style="color:var(--ink);border:0;background:none;width:100%;text-align:left" onClick=${() => setFuera(on ? fuera.concat([p.id]) : fuera.filter(x => x !== p.id))}>
            <span class=${'casilla' + (on ? ' on' : '')}>${on && html`<${Icono} n="check" t=${13} g=${3} />`}</span>
            <span class="crece" style="display:flex;flex-direction:column;gap:1px;min-width:0"><span class="corta" style="font-size:14px">${p.n}</span>
              <span class="sub num" style=${{ color: mg < 0.05 ? 'var(--out-text)' : 'var(--amber-text)' }}>${mg < 0 ? 'Pierdes ' + D.m(costoReposicion(p) - p.p) + ' en cada uno' : 'Gana ' + Math.round(mg * 100) + ' %'} · reponer ${D.m(costoReposicion(p))}</span></span>
            <span class="num" style="display:flex;flex-direction:column;align-items:flex-end;gap:1px"><span class="sub" style="text-decoration:line-through">${D.m(p.p)}</span><b>${D.m(nuevo)}</b></span>
          </button>`; })}</div></div>
        <${Interruptor} on=${redondear} onCambio=${setRedondear} titulo="Redondear" sub="A números fáciles de cobrar" />`
      : html`<div class="tarjeta pila entra" style="align-items:center;text-align:center;box-shadow:none;background:var(--in-soft)"><span class="ic t-ver"><${Icono} n="check" t=${18} g=${2.6} /></span><b>Todos tus precios ganan al menos ${valorMeta} %</b><span class="sub">Te avisamos en «Hoy» si algo se queda atrás.</span></div>`}
      <button type="button" class="enlace-tasa toca" style="align-self:flex-start" onClick=${() => c(() => abrir('remarcar'))}>Subir todos los precios un porcentaje</button>`,
    pie: lista.length ? html`<button type="button" class=${'btn toca' + (elegidos.length ? '' : ' apagado')} onClick=${() => aplicar(c)}>Ajustar ${elegidos.length} ${elegidos.length === 1 ? 'precio' : 'precios'}</button>` : null
  })} />`;
}
