// Caja: fondo con el que se abre, retiros e ingresos de efectivo, y turnos de cada cajero.
import { html, useState } from '../lib/preact-htm.js';
import { useApp } from '../ctx.js';
import { cajaEntre, turnoActual, cajaAbierta, movCaja, movsEntre, inicioDia, tasaMetodo, inicioVisible } from '../datos.js';
import { monedaEfectivo } from '../paises.js';
import { Hoja, Icono, Chips, avisar, hora } from '../ui.js';
import { numero, esEfectivo } from './pagos.js';
import { ajustesImpresora, abrirCajon } from '../impresora.js';

// Formas de pago en efectivo del negocio (cada una se cuenta en su moneda).
export const efectivosDe = S => S.negocio.pays.filter(esEfectivo);
export function useMoneda() {
  const { P, D } = useApp();
  const fmt2 = new Intl.NumberFormat(P.loc, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return k => { const mon = monedaEfectivo(P, k); return { mon, a: v => mon.eur ? D.aEur(v) : mon.otra ? D.aOtra(v, tasaMetodo(k)) : v, de: x => mon.eur ? D.deEur(x) : mon.otra ? D.deOtra(x, tasaMetodo(k)) : x, ver: v => mon.otra ? mon.s + ' ' + fmt2.format(mon.eur ? D.aEur(v) : D.aOtra(v, tasaMetodo(k))) : D.m(v) }; };
}
const NOMBRE_MOV = { fondo: 'Fondo inicial', retiro: 'Retiro', ingreso: 'Ingreso', ajuste: 'Diferencia' };
const TONO_MOV = { fondo: 't-vio', retiro: 't-ros', ingreso: 't-ver', ajuste: 't-amb' };

export function Caja({ d, cerrar }) {
  const { S, D, abrir, puede } = useApp();
  const enSu = useMoneda();
  const hoy0 = inicioDia(Date.now()), tu = turnoActual(), abierta = cajaAbierta();
  const dia = cajaEntre(hoy0, Date.now() + 1), turno = cajaEntre(tu.desde, Date.now() + 1, tu.base);
  const efect = efectivosDe(S).concat(Object.keys(dia.esperado).filter(k => esEfectivo(k) && !S.negocio.pays.includes(k)));
  const movs = movsEntre(hoy0, Date.now() + 1).slice().reverse();
  const turnos = S.turnos.filter(x => x.hasta >= hoy0).slice().reverse();
  const quien = id => ((S.perfiles.find(p => p.id === id) || {}).n || '—').split(' ')[0];
  const pc = puede('cierre') || puede('vender');
  return html`<${Hoja} titulo="Caja" onCerrar=${cerrar} contenido=${c => ({
    cuerpo: html`
      <div class=${'tarjeta fila ' + (abierta ? '' : 'entra')} style=${{ boxShadow: 'none', gap: '12px', background: abierta ? 'var(--in-soft)' : 'var(--amber-soft)' }}>
        <span class=${'ic ' + (abierta ? 't-ver' : 't-amb')}><${Icono} n=${abierta ? 'check' : 'candado'} t=${18} g=${2.4} /></span>
        <span class="crece" style="display:flex;flex-direction:column;gap:2px"><b style="font-size:14px">${abierta ? 'Caja abierta' : 'Caja sin fondo'}</b>
          <span class="sub">${tu.anterior ? 'Turno desde las ' + hora(tu.desde) + ' · antes cerró ' + quien(tu.anterior.por) : abierta ? 'Desde las ' + hora(inicioVisible(hoy0)) : 'Anota con cuánto efectivo empiezas el día'}</span></span>
        ${!abierta && pc && html`<button type="button" class="btn2 chico lleno toca" onClick=${() => c(() => abrir('movCaja', { tipo: 'fondo' }))}>Abrir caja</button>`}
      </div>
      <div class="cierre-seccion"><span class="cierre-tit"><${Icono} n="billete" t=${15} />Efectivo que debe haber ahora</span>
        ${efect.map(k => { const x = turno.partes[k] || {}, e = enSu(k); const det = [x.base ? 'deja ' + D.m(x.base) : '', x.fondo ? 'fondo ' + D.m(x.fondo) : '', x.ventas ? 'ventas ' + D.m(x.ventas) : '', x.ingresos ? '+' + D.m(x.ingresos) : '', x.retiros ? 'retiros −' + D.m(x.retiros) : '', x.gastos ? 'gastos −' + D.m(x.gastos) : '', x.ajustes ? 'ajuste ' + D.m(x.ajustes) : ''].filter(Boolean);
          return html`<div class="cierre-efectivo" key=${k}><div class="fila"><b class="crece" style="font-size:15px">${k}</b><b class="num" style="font-size:17px">${e.ver(turno.esperado[k] || 0)}</b></div>
            <span class="sub num">${det.length ? det.join(' · ') : 'Sin movimientos todavía'}</span></div>`; })}
      </div>
      ${ajustesImpresora().modo === 'bluetooth' && html`<button type="button" class="btn2 toca" onClick=${() => abrirCajon().then(() => avisar('Cajón abierto')).catch(() => avisar('No se pudo abrir el cajón: revisa la impresora'))}><${Icono} n="candado" t=${15} />Abrir el cajón</button>`}
      ${pc && html`<div class="rejilla-2" style="gap:10px">
        <button type="button" class="btn2 rojo toca" style="min-height:50px" onClick=${() => c(() => abrir('movCaja', { tipo: 'retiro' }))}><${Icono} n="menos1" t=${15} g=${2.6} />Retirar efectivo</button>
        <button type="button" class="btn2 verde toca" style="min-height:50px" onClick=${() => c(() => abrir('movCaja', { tipo: 'ingreso' }))}><${Icono} n="mas1" t=${15} g=${2.6} />Agregar efectivo</button>
      </div>`}
      ${(movs.length > 0 || turnos.length > 0) && html`<div class="cierre-seccion"><span class="cierre-tit"><${Icono} n="reloj" t=${15} />Hoy</span>
        <div class="cierre-digital">
          ${turnos.map(t => { const dif = Object.keys(t.dif || {}).reduce((a, k) => a + t.dif[k], 0); return html`<div class="fila" key=${t.id}><span class="pildora t-azu">Turno ${t.n}</span><span class="crece corta sub">${quien(t.por)} · ${hora(t.desde)}–${hora(t.hasta)}</span><b class=${'num ' + (Math.abs(dif) < 0.005 ? 'in' : 'out')} style="font-size:13px">${Math.abs(dif) < 0.005 ? 'Cuadró' : (dif < 0 ? 'Faltó ' : 'Sobró ') + D.m(Math.abs(dif))}</b></div>`; })}
          ${movs.filter(x => x.tipo !== 'ajuste').map(x => html`<div class="fila" key=${x.id}><span class=${'pildora ' + TONO_MOV[x.tipo]}>${NOMBRE_MOV[x.tipo]}</span><span class="crece corta sub">${hora(x.t)} · ${quien(x.por)}${x.motivo ? ' · ' + x.motivo : ''}</span><b class="num" style="font-size:13px">${x.tipo === 'retiro' ? '−' : ''}${x.pagos.map(p => enSu(p.m).ver(p.v)).join(' + ')}</b></div>`)}
        </div></div>`}`,
    pie: html`${puede('vender') && html`<button type="button" class="btn toca" onClick=${() => c(() => abrir('cierre', { turno: true }))}>Cerrar mi turno</button>`}
      ${puede('cierre') && html`<button type="button" class="btn2 toca" style="min-height:50px;border-radius:25px" onClick=${() => c(() => abrir('cierre'))}>Cierre del día</button>`}`
  })} />`;
}

// Fondo, retiro o ingreso de efectivo.
export function MovCaja({ d, cerrar }) {
  const { S, D, tel, abrir } = useApp();
  const enSu = useMoneda();
  const efect = efectivosDe(S);
  const [tipo, setTipo] = useState(d.tipo || 'retiro');
  const [txt, setTxt] = useState({});
  const [m, setM] = useState(efect[0] || '');
  const [motivo, setMotivo] = useState('');
  // El fondo de ayer como sugerencia: lo que se dejó en la caja al cerrar el último turno o el fondo del último día.
  const ultimo = S.movCaja.filter(x => x.tipo === 'fondo').slice(-1)[0];
  const sugerido = k => { const p = ultimo && ultimo.pagos.find(x => x.m === k); return p ? p.v : 0; };
  const motivos = tipo === 'retiro' ? ['Depósito al banco', 'Pago a proveedor', 'Para el dueño', 'Otro'] : ['Sencillo para vueltos', 'Lo trajo el dueño', 'Otro'];
  const valor = k => enSu(k).de(numero(txt[k] || ''));
  const listo = c => {
    const pagos = (tipo === 'fondo' ? efect : [m]).map(k => ({ m: k, v: D.redondo(valor(k)) })).filter(p => p.v > 0);
    if (!pagos.length) { avisar(tipo === 'fondo' ? 'Escribe con cuánto empiezas' : 'Escribe el monto'); return; }
    if (tipo !== 'fondo' && !motivo) { avisar('Elige el motivo'); return; }
    movCaja(tipo, pagos, tipo === 'fondo' ? '' : motivo);
    c(() => { avisar(tipo === 'fondo' ? 'Caja abierta' : (tipo === 'retiro' ? 'Retiro anotado: ' : 'Ingreso anotado: ') + pagos.map(p => enSu(p.m).ver(p.v)).join(' + ')); abrir('caja'); });
  };
  const Campo = k => { const e = enSu(k); return html`<label class="campo" key=${k}><span>${tipo === 'fondo' ? k : 'Monto en ' + e.mon.s}</span>
    <input class="num grande" type="text" inputmode="decimal" autocomplete="off" value=${txt[k] != null ? txt[k] : ''} placeholder=${tipo === 'fondo' && sugerido(k) ? String(Math.round(e.a(sugerido(k)) * 100) / 100).replace('.', ',') : '0'} aria-label=${'Monto ' + k} onInput=${ev => setTxt(Object.assign({}, txt, { [k]: ev.target.value }))} />
    ${e.mon.otra && numero(txt[k] || '') > 0 ? html`<span class="sub num">= ${D.m(valor(k))}</span>` : null}</label>`; };
  if (!efect.length) return html`<${Hoja} titulo="Caja" onCerrar=${cerrar} contenido=${() => ({ cuerpo: html`<p class="vacio">Tu negocio no cobra en efectivo. Actívalo en Ajustes → Formas de pago.</p>` })} />`;
  return html`<${Hoja} titulo=${tipo === 'fondo' ? 'Abrir caja' : tipo === 'retiro' ? 'Retirar efectivo' : 'Agregar efectivo'} onCerrar=${cerrar} contenido=${c => ({
    cuerpo: html`
      ${tipo !== 'fondo' && html`<div class="segmento" style="width:100%">${[['retiro', 'Retirar'], ['ingreso', 'Agregar']].map(x => html`<button type="button" style="flex:1" class=${tipo === x[0] ? 'on' : ''} onClick=${() => { setTipo(x[0]); setMotivo(''); }}>${x[1]}</button>`)}</div>`}
      <span class="sub" style="line-height:1.45">${tipo === 'fondo' ? 'El efectivo con el que empiezas, para dar vuelto. Se suma a lo que debe haber al cerrar.' : tipo === 'retiro' ? 'Efectivo que sale de la caja y no es un gasto del negocio: un depósito, lo que se lleva el dueño…' : 'Efectivo que entra a la caja sin ser una venta, como sencillo para los vueltos.'}</span>
      ${tipo === 'fondo' ? efect.map(Campo) : html`
        ${efect.length > 1 && html`<div class="campo"><span>¿De qué efectivo?</span><${Chips} opciones=${efect.map(k => ({ v: k, n: k }))} valor=${m} onCambio=${setM} chico desliza=${tel} /></div>`}
        ${Campo(m)}
        <div class="campo"><span>Motivo</span><${Chips} opciones=${motivos.map(x => ({ v: x, n: x }))} valor=${motivo} onCambio=${setMotivo} chico /></div>`}`,
    pie: html`<button type="button" class="btn toca" onClick=${() => listo(c)}>${tipo === 'fondo' ? 'Abrir caja' : tipo === 'retiro' ? 'Anotar retiro' : 'Anotar ingreso'}</button>`
  })} />`;
}
