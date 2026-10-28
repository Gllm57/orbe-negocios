// Forma de pago, sencilla o combinada. Se usa en todo lugar donde entra o sale dinero:
// cobrar, abonos, gastos y devoluciones. Ej.: una parte por Pago Móvil y el resto por Binance Pay.
// En Venezuela y Argentina cada parte se puede escribir en la otra moneda (Bs o US$).
import { html, useState } from '../lib/preact-htm.js';
import { useApp } from '../ctx.js';
import { Icono, Chips, Interruptor, simbolo } from '../ui.js';
import { tasaMetodo } from '../datos.js';
import { esElectronico, TASAS_EXTRA } from '../paises.js';

export const conSimbolo = lista => lista.map(x => ({ v: x, n: html`<span class="simb"><${Icono} n=${simbolo(x)} t=${13} g=${2.2} /></span>${x}` }));
export const numero = t => { const v = parseFloat(String(t).replace(/\s/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.')); return isFinite(v) ? v : 0; };
export const esEfectivo = m => /Efectivo/.test(m);

// Formas que normalmente se pagan en la otra moneda: en Venezuela, bolívares; en Argentina, dólares.
const enOtra = (P, m) => P.id === 'VE' ? /Bs|Pago Móvil/.test(m) : P.id === 'AR' ? /USDT|US\$/.test(m) : false;

export function usePagos(total, metodos, inicial) {
  const { S, P, D } = useApp();
  const [m, setM] = useState(inicial && metodos.includes(inicial) ? inicial : metodos[0]);
  const [ref, setRef] = useState('');
  // Pedir el número de referencia de los pagos electrónicos (para conciliar con el banco).
  const pideRef = mm => !!S.negocio.pedirRef && esElectronico(mm);
  const otra = x => (P.id === 'VE' ? 'Bs ' : 'US$ ') + new Intl.NumberFormat(P.loc, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(x);
  const nombreTasaDe = mm => { const k = (S.negocio.tasaPago || {})[mm]; const x = k && (TASAS_EXTRA[P.id] || []).find(t => t.k === k); return x ? 'tasa ' + x.n.toLowerCase() : ''; };
  const [varias, setVariasRaw] = useState(false);
  const [filas, setFilas] = useState([]);
  const tol = D.dec ? 0.01 : 1;
  const simb2 = P.id === 'VE' ? 'Bs' : 'US$';
  const fila = mm => ({ m: mm, txt: '', en: D.dual && enOtra(P, mm) ? 's' : 'p' });
  // Pasa lo escrito en la otra moneda a la principal (y al revés para mostrar).
  // Cada forma de pago se convierte con su propia tasa (oficial, paralela, USDT o la del negocio).
  const aPrincipal = (f, x) => f.en === 's' ? D.deOtra(x, tasaMetodo(f.m)) : x;
  const aOtra = (x, mm) => D.aOtra(x, tasaMetodo(mm));
  const valor = f => aPrincipal(f, numero(f.txt));
  const suma = filas.reduce((a, f) => a + valor(f), 0);
  const falta = varias ? D.redondo(total - suma) : 0;
  const hayEfectivo = filas.some(f => esEfectivo(f.m) && numero(f.txt) > 0);
  const vuelto = varias && falta < -tol && hayEfectivo ? -falta : 0;
  const ok = !varias || Math.abs(falta) <= tol || vuelto > 0;

  // Lo que se guarda: cada parte en la moneda principal; el redondeo y el vuelto se ajustan en la última parte que corresponda.
  function pagos() {
    if (!varias) return [Object.assign({ m, v: total }, pideRef(m) && ref.trim() ? { ref: ref.trim() } : {})];
    const out = filas.map(f => Object.assign({ m: f.m, v: D.redondo(valor(f)) }, pideRef(f.m) && (f.ref || '').trim() ? { ref: f.ref.trim() } : {})).filter(p => p.v > 0);
    const junt = []; out.forEach(p => { const x = junt.find(y => y.m === p.m && !y.ref && !p.ref); if (x) x.v = D.redondo(x.v + p.v); else junt.push(p); });
    let resto = D.redondo(total - junt.reduce((a, p) => a + p.v, 0));
    if (resto && junt.length) {
      const k = resto < 0 && vuelto ? junt.map(p => esEfectivo(p.m)).lastIndexOf(true) : junt.length - 1;
      junt[k].v = D.redondo(junt[k].v + resto);
    }
    return junt.filter(p => p.v > 0);
  }

  const setVarias = v => {
    setVariasRaw(v);
    if (v && !filas.length) setFilas([Object.assign(fila(m), { txt: '' }), fila(metodos.find(x => x !== m) || m)]);
  };
  const pon = (k, o) => setFilas(fs => fs.map((f, i) => i === k ? Object.assign({}, f, o) : f));
  const llenar = k => {
    const f = filas[k], ya = filas.reduce((a, x, i) => a + (i === k ? 0 : valor(x)), 0), r = Math.max(0, total - ya);
    const x = f.en === 's' ? aOtra(r, f.m) : r;
    pon(k, { txt: (f.en === 's' || D.dec ? x.toFixed(2) : String(Math.round(x))).replace('.', ',') });
  };

  // calido: para marcar «Fiado» en ámbar.
  // Se llama como función (no como componente) para que los campos no pierdan lo escrito al redibujar.
  function vista({ titulo = 'Forma de pago', desliza, calido, ayuda } = {}) {
    const pagado = Math.min(total, suma);
    return html`<div class="pila" style="gap:12px">
      ${!varias && html`<div class="campo"><span>${titulo}</span><${Chips} opciones=${conSimbolo(metodos)} valor=${m} onCambio=${setM} desliza=${desliza} calido=${calido} /></div>`}
      ${!varias && D.dual && total > 0 && nombreTasaDe(m) && html`<span class="sub num entra">Con ${m}: ${otra(aOtra(total, m))} · ${nombreTasaDe(m)}</span>`}
      ${!varias && pideRef(m) && html`<label class="campo entra"><span>Referencia de ${m} (opcional)</span><input class="num" type="text" inputmode="numeric" autocomplete="off" maxlength="20" placeholder="Últimos 4 a 6 números" value=${ref} onInput=${e => setRef(e.target.value.replace(/[^\dA-Za-z]/g, ''))} /></label>`}
      ${metodos.length > 1 && html`<${Interruptor} on=${varias} onCambio=${setVarias} titulo="Combinar formas de pago" sub=${ayuda || 'Ej.: una parte por ' + metodos[0] + ' y el resto por ' + (metodos[1] || metodos[0])} />`}
      ${varias && html`<div class="pagos-mix entra">
        ${filas.map((f, k) => { const v = valor(f); return html`<div class="pago-fila entra" key=${k} style=${{ '--i': k }}>
          <div class="pago-linea">
            <label class="pago-forma"><span class="simb"><${Icono} n=${simbolo(f.m)} t=${14} g=${2.2} /></span>
              <select value=${f.m} aria-label=${'Forma de pago ' + (k + 1)} onChange=${e => pon(k, { m: e.target.value, en: !f.txt && D.dual && enOtra(P, e.target.value) ? 's' : f.en })}>${metodos.map(x => html`<option value=${x}>${x}</option>`)}</select></label>
            <div class="pago-monto">
              ${D.dual && html`<button type="button" class="pago-moneda toca" aria-label="Cambiar moneda" title="Cambiar moneda" onClick=${() => pon(k, { en: f.en === 's' ? 'p' : 's', txt: '' })}>${f.en === 's' ? simb2 : P.s}</button>`}
              <input class="num" type="text" inputmode="decimal" autocomplete="off" placeholder="0" value=${f.txt} aria-label=${'Monto con ' + f.m} onInput=${e => pon(k, { txt: e.target.value })} />
            </div>
            ${filas.length > 2 ? html`<button type="button" class="icono-btn chico toca" aria-label="Quitar esta parte" onClick=${() => setFilas(filas.filter((_, i) => i !== k))}><${Icono} n="cerrar" t=${14} g=${2.4} /></button>` : null}
          </div>
          <div class="fila sub" style="gap:8px;min-height:22px;padding:0 4px">
            <span class="crece num faint">${v > 0 ? (f.en === 's' ? '= ' + D.m(v) : D.dual ? '= ' + otra(aOtra(v, f.m)) : '') + (nombreTasaDe(f.m) ? ' · ' + nombreTasaDe(f.m) : '') : ''}</span>
            ${falta > tol && !(numero(f.txt) > 0) ? html`<button type="button" class="pago-resto toca" onClick=${() => llenar(k)}>Poner lo que falta</button>` : null}
          </div>
          ${pideRef(f.m) && html`<input class="pago-ref num" type="text" inputmode="numeric" autocomplete="off" maxlength="20" placeholder=${'Referencia de ' + f.m + ' (opcional)'} value=${f.ref || ''} aria-label=${'Referencia de ' + f.m} onInput=${e => pon(k, { ref: e.target.value.replace(/[^\dA-Za-z]/g, '') })} />`}
        </div>`; })}
        ${filas.length < 5 && html`<button type="button" class="btn2 chico toca" style="align-self:flex-start" onClick=${() => setFilas(filas.concat([fila(metodos.find(x => !filas.some(f => f.m === x)) || metodos[0])]))}>+ Otra forma de pago</button>`}
        <div class="pago-cuenta">
          <span class="barra-prog" style="height:8px"><i style=${{ width: Math.round(pagado / (total || 1) * 100) + '%', background: ok ? 'var(--in)' : 'var(--accent)' }}></i></span>
          <span class="fila num" style="justify-content:space-between;font-size:13px">
            <span class="muted">Pagado ${D.m(suma)} de ${D.m(total)}</span>
            <b style=${{ color: vuelto ? 'var(--in)' : ok ? 'var(--in)' : falta > 0 ? 'var(--amber)' : 'var(--out)' }}>${vuelto ? 'Vuelto ' + D.m(vuelto) : ok ? 'Cuadra' : falta > 0 ? 'Falta ' + D.m(falta) : 'Sobra ' + D.m(-falta)}</b>
          </span>
        </div>
      </div>`}
    </div>`;
  }

  return { m, setM, varias, ok, falta, vuelto, pagos, vista, efectivo: !varias && esEfectivo(m) };
}
