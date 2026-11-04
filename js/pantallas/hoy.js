// Hoy (teléfono) y Panel (computadora): cómo va el día, con gráficos en vivo.
import { html, useState } from '../lib/preact-htm.js';
import { useApp } from '../ctx.js';
import { resumen, serieDias, inicioDia, deudores, porPagar, bajoMinimo, bajoCosto, bajoMeta, margenMeta, cajaAbierta, cierreDeHoy, leer, diaClave, vigentes, ordenAbierta, ordenAtrasada, numeroOrden } from '../datos.js';
import { esElectronico } from '../paises.js';
import { Barras, Linea, Reparto, Monto, Anillo, color } from '../graficos.js';
import { Icono, LogoOrbe, iniciales, hora, fechaCorta, Bandera, MarcaNegocio, avisar } from '../ui.js';
import { nombreTasa } from '../paises.js';
import { FilaVenta } from './hojas.js';
import { OfertaRecorrido } from '../recorrido.js';
import { OrdenesHoy } from './ordenes.js';

const DIA = 86400000;

export function Hoy() {
  const { S, P, T, D, E, tel, ir, abrir, suc, setSuc, enLinea, puede } = useApp();
  const [verTodo, setVerTodo] = useState(false);
  // Tocar el nombre o el logo del negocio abre sus datos (con permiso de ajustes).
  const editarNegocio = () => puede('ajustes') ? abrir('negocio') : avisar('Solo quien puede cambiar los ajustes edita los datos del negocio');
  const verGan = puede('ganancias');
  const hoy0 = inicioDia(Date.now());
  const r = resumen(hoy0, hoy0 + DIA, suc), ayer = resumen(hoy0 - DIA, Date.now() - DIA, suc);
  const semana = serieDias(7, suc), mes = serieDias(30, suc);
  const meta = semana.slice(0, 6).reduce((a, d) => a + d.total, 0) / 6 || 1;
  const vs = ayer.total ? Math.round((r.total / ayer.total - 1) * 100) : 0;
  const deben = deudores().filter(c => c.deuda > 0), debenTot = deben.reduce((a, c) => a + c.deuda, 0);
  const pp = porPagar(), ppTot = pp.reduce((a, g) => a + g.v, 0);
  const bajos = bajoMinimo(), cierre = cierreDeHoy();
  const ahoraH = new Date().getHours();
  const horas = []; for (let h = 7; h <= 21; h++) horas.push({ l: h % 2 ? '' : String(h > 12 ? h - 12 : h), v: r.porHora[h], tip: (h > 12 ? h - 12 : h) + (h >= 12 ? ' pm' : ' am') + ' · ' + D.m(r.porHora[h]) });
  const pagos = Object.keys(r.porPago).sort((a, b) => r.porPago[b] - r.porPago[a]).map((k, i) => ({ n: k, v: r.porPago[k], c: k === 'Fiado' ? 'var(--c3)' : color(i === 2 ? 3 : i) }));
  const sucs = E ? S.negocio.sucursales.map((s, i) => ({ n: s, v: r.porSuc[s] || 0, c: color(i) })) : [];

  const pendientes = [];
  if (deben.length) pendientes.push({ i: 'campana', t: 't-amb', txt: deben.length + (deben.length === 1 ? ' cliente te debe ' : ' clientes te deben ') + D.m(debenTot), sub: 'Mándales el recordatorio por WhatsApp', go: () => ir('clientes') });
  if (bajos.length) pendientes.push({ i: 'caja', t: 't-azu', txt: bajos.length + (bajos.length === 1 ? ' producto por debajo del mínimo' : ' productos por debajo del mínimo'), sub: bajos.slice(0, 2).map(p => p.n).join(', '), go: () => ir('inventario') });
  if (pp.length && puede('gastos')) pendientes.push({ i: 'calendario', t: 't-ros', txt: pp[0].n + ': ' + D.m(pp[0].v), sub: venceTxt(pp[0].vence), go: () => ir('gastos') });
  // La tasa está en la tarjeta principal; aquí solo se avisa si quedó vieja (no se pudo leer hoy).
  if (D.dual && S.tasa.modo !== 'manual' && S.tasa.fecha !== diaClave(Date.now())) pendientes.push({ i: 'sube', t: 't-vio', txt: 'Actualiza la tasa', sub: nombreTasa(P, S.tasa) + ': se está usando la última guardada', go: () => abrir('tasa') });
  // La tasa saltó desde ayer: conviene revisar precios (o, en Venezuela, la tasa con la que cobras).
  if (D.dual) { const h = (S.historialTasas || []).filter(x => x.f === (S.tasa.fuente || 'oficial')); const q = h.length > 1 ? (h[h.length - 1].v / h[h.length - 2].v - 1) * 100 : 0;
    if (Math.abs(q) >= 3) pendientes.unshift({ i: 'alerta', t: 't-amb', txt: 'El dólar ' + (q > 0 ? 'subió ' : 'bajó ') + Math.abs(q).toFixed(1).replace('.', ',') + ' % desde ayer', sub: P.id === 'VE' || !puede('productos') ? 'Revisa las tasas con las que cobras' : 'Revisa tus precios', go: puede('productos') && P.id !== 'VE' ? () => abrir('precios') : () => abrir('tasa') }); }
  // Precios que se quedaron atrás: por debajo de la meta de ganancia (los que casi no dejan nada, en rojo).
  const sinGan = bajoCosto(), flojos = bajoMeta();
  if (flojos.length && puede('productos')) pendientes.push({ i: 'etiqueta', t: sinGan.length ? 't-ros' : 't-amb', txt: flojos.length + (flojos.length === 1 ? ' precio gana' : ' precios ganan') + ' menos de tu meta del ' + Math.round(margenMeta() * 100) + ' %', sub: sinGan.length ? sinGan.length + (sinGan.length === 1 ? ' casi no deja nada' : ' casi no dejan nada') + ': ' + sinGan.slice(0, 2).map(p => p.n).join(', ') : 'Toca para ajustarlos de un toque', go: () => abrir('precios') });
  if (S.negocio.pedirRef && puede('ajustes')) { const n = vigentes().filter(v => v.t > Date.now() - 7 * DIA).reduce((a, v) => a + v.pagos.filter(p => p.ref && !p.ok && esElectronico(p.m)).length, 0);
    if (n) pendientes.push({ i: 'check', t: 't-azu', txt: n + (n === 1 ? ' pago por verificar' : ' pagos por verificar') + ' con el banco', sub: 'Sube el estado de cuenta y Orbe los busca', go: () => abrir('conciliar') }); }
  // Caja sin fondo: se sugiere anotar con cuánto efectivo se empieza (no obliga).
  if (!cierre && !cajaAbierta() && puede('vender') && S.negocio.pays.some(m => /Efectivo/.test(m))) pendientes.push({ i: 'billete', t: 't-vio', txt: 'Abre la caja', sub: 'Anota con cuánto efectivo empiezas para que el cierre cuadre', go: () => abrir('movCaja', { tipo: 'fondo' }) });
  if (puede('cierre')) pendientes.push(cierre ? { i: 'check', t: 't-ver', txt: 'Día cerrado', sub: 'Cerraste a las ' + hora(cierre.t), go: null } : { i: 'candado', t: 't-ver', txt: 'Cierre del día', sub: 'Cuenta la caja cuando cierres', go: () => abrir('cierre') });

  // Órdenes: las atrasadas y las que se entregan hoy van a «Para hacer hoy».
  if (puede('ordenes')) {
    const fin = new Date(); fin.setHours(23, 59, 59, 999);
    const abiertas = S.ordenes.filter(ordenAbierta), tarde = abiertas.filter(o => ordenAtrasada(o)), paraHoy = abiertas.filter(o => !ordenAtrasada(o) && o.entrega && o.entrega <= fin.getTime() && o.estado !== 'lista');
    if (tarde.length) pendientes.unshift({ i: 'orden', t: 't-ros', txt: tarde.length + (tarde.length === 1 ? ' orden atrasada' : ' órdenes atrasadas'), sub: tarde.slice(0, 2).map(o => numeroOrden(o) + ' · ' + o.que).join(', '), go: () => tarde.length === 1 ? abrir('orden', { oid: tarde[0].id }) : ir('ordenes') });
    if (paraHoy.length) pendientes.push({ i: 'orden', t: 't-azu', txt: paraHoy.length + (paraHoy.length === 1 ? ' orden para entregar hoy' : ' órdenes para entregar hoy'), sub: paraHoy.slice(0, 2).map(o => numeroOrden(o) + ' · ' + o.que).join(', '), go: () => ir('ordenes') });
  }
  const recientes = leer().ventas.filter(v => !suc || v.suc === suc).slice(-6).reverse();

  // Lo urgente primero; lo que no se puede tocar (como «Día cerrado») va al final.
  const porHacer = pendientes.filter(p => p.go).concat(pendientes.filter(p => !p.go));
  const nVer = verTodo ? porHacer.length : Math.min(porHacer.length, tel ? 4 : 5);
  const Pendientes = html`<div class="tarjeta" data-tour="pendientes" style="padding-bottom:6px">
    <div class="tarjeta-tit">Para hacer hoy<span class="pildora t-vio">${pendientes.filter(p => p.go).length}</span></div>
    <div class="lista">${porHacer.slice(0, nVer).map((p, k) => html`<button type="button" key=${p.txt} class="item toca entra" style=${{ '--i': k, color: 'var(--ink)', cursor: p.go ? 'pointer' : 'default' }} onClick=${p.go || undefined}>
      <span class=${'ic ' + p.t} style="width:34px;height:34px;border-radius:11px"><${Icono} n=${p.i} t=${17} g=${2.2} /></span>
      <span class="crece" style="display:flex;flex-direction:column;gap:1px"><b style="font-size:14px;font-weight:600;line-height:1.35">${p.txt}</b><span class="sub faint">${p.sub}</span></span>
      ${p.go && html`<${Icono} n="sig" t=${16} c="var(--faint)" />`}
    </button>`)}</div>
    ${porHacer.length > nVer || verTodo ? html`<button type="button" class="ver-mas toca" onClick=${() => setVerTodo(!verTodo)}>${verTodo ? 'Ver menos' : 'Ver ' + (porHacer.length - nVer) + ' más'}</button>` : null}
  </div>`;

  const nVentas = tel ? 3 : 5;
  const Recientes = html`<div class="tarjeta" style="padding-bottom:6px">
    <div class="tarjeta-tit">Últimas ventas<span class="sub">${r.n} hoy</span></div>
    <div class="lista">${recientes.slice(0, nVentas).map((v, k) => html`<${FilaVenta} key=${v.id} v=${v} i=${k} fecha />`)}</div>
    ${!recientes.length && html`<p class="vacio">Todavía no hay ventas hoy.</p>`}
  </div>`;
  // Tarjeta oscura: lo vendido, la tasa, la barra del día y tres cifras que se tocan.
  const tasaTxt = D.dual ? nombreTasa(P, S.tasa).replace('Dólar ', '') + ' ' + new Intl.NumberFormat(P.loc, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(D.tasa) : '';
  const kpis = [verGan ? ['Ganancia', D.m(r.ganancia), 'v-verde', null] : ['Ticket', D.m(r.ticket), '', null], ['Te deben', D.m(debenTot), 'v-ambar', () => ir('clientes')], puede('gastos') ? ['Por pagar', D.m(ppTot), 'v-rojo', () => ir('gastos')] : ['Fiado hoy', D.m(r.fiado), 'v-ambar', null]];
  const Hero = (conBarras, alto) => html`<section class="hero entra" data-tour="resumen">
    <div class="fila" style="align-items:flex-start;gap:12px">
      <span class="crece" style="display:flex;flex-direction:column;gap:3px;min-width:0">
        <span class="sub">${T.vender === 'Cobrar' ? 'Cobrado hoy' : 'Vendido hoy'} · ${r.n} ${r.n === 1 ? 'venta' : 'ventas'}</span>
        <${Monto} v=${r.total} f=${D.m} clase="grande num" />
        ${D.dual && html`<span class="sub num">${D.s(r.total)}</span>`}
        <span class="fila" style="gap:6px;flex-wrap:wrap;margin-top:4px">
          ${D.dual && html`<button type="button" class="hero-tasa toca" onClick=${() => abrir('tasa')} aria-label="Ver y cambiar las tasas"><${Icono} n="sube" t=${13} />${tasaTxt}</button>`}
          ${ayer.total > 0 && html`<span class="hero-vs" style=${{ background: vs >= 0 ? 'rgba(61,220,159,.2)' : 'rgba(255,107,139,.2)', color: vs >= 0 ? '#7ff0c3' : '#ffb0bd' }}>${vs >= 0 ? '+' : ''}${vs} % vs ayer</span>`}
        </span>
      </span>
      <span class="hero-anillo"><${Anillo} p=${r.total / meta} tam=${tel ? 72 : 64} c="#3ddc9f">${Math.round(r.total / meta * 100)}%</${Anillo}><span class="sub" style="font-size:11px">de tu promedio</span></span>
    </div>
    ${conBarras && html`<${Barras} datos=${horas} alto=${alto} resaltar=${ahoraH - 7} hueco=${4} colorBase="rgba(255,255,255,.26)" colorRes="#3ddc9f" />`}
    ${tel && html`<div class="hero-kpis">${kpis.map(k => html`<button type="button" class="toca" disabled=${!k[3]} onClick=${k[3] || undefined}><span class="sub" style="font-size:11px">${k[0]}</span><b class=${'num ' + k[2]}>${k[1]}</b></button>`)}</div>`}
  </section>`;

  if (tel) return html`
    <header class="cab entra">
      <button type="button" class="cab-negocio toca crece" aria-label=${puede('ajustes') ? 'Editar los datos y el logo del negocio' : S.negocio.nombre} onClick=${editarNegocio}>
        <${MarcaNegocio} n=${S.negocio} lapiz=${puede('ajustes')} />
        <span class="crece"><b class="corta">${S.negocio.nombre}</b><span class="sub corta">${new Date().toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' })} · <${Bandera} id=${P.id} t=${14} /> ${E ? (suc || 'Todos los locales') : T.n}</span></span>
      </button>
      <span class="pildora" style=${{ background: enLinea ? 'var(--in-soft)' : 'var(--amber-soft)', color: enLinea ? 'var(--in-text)' : 'var(--amber-text)' }}><span class="punto"></span>${enLinea ? 'En línea' : 'Sin internet'}</span>
    </header>
    <${OfertaRecorrido} />
    ${E && html`<div class="chips desliza">${[''].concat(S.negocio.sucursales).map(x => html`<button type="button" class=${'chip chico toca' + (suc === x ? ' on' : '')} onClick=${() => setSuc(x)}>${x || 'Todas'}</button>`)}</div>`}
    ${Hero(true, 64)}
    ${Pendientes}
    ${Recientes}`;

  // ---------- computadora ----------
  return html`
    <${OfertaRecorrido} />
    <div class="panel-cifras">
      ${Hero(true, 48)}
      ${kpis.map((k, i) => html`<button type="button" class="tarjeta cifra entra toca" style=${{ '--i': i + 1, border: 0, textAlign: 'left', color: 'var(--ink)', cursor: k[3] ? 'pointer' : 'default' }} onClick=${k[3] || undefined}><span class="sub">${k[0]}${i === 0 ? ' de hoy' : ''}</span><b class=${'v num ' + ({ 'v-verde': 'in', 'v-ambar': 'amber', 'v-rojo': 'out' }[k[2]] || '')}>${k[1]}</b><span class="sub faint">${i === 0 ? (r.total ? Math.round(r.ganancia / r.total * 100) + ' % de lo vendido' : 'sin ventas todavía') : i === 1 ? deben.length + (deben.length === 1 ? ' cliente' : ' clientes') : puede('gastos') ? pp.length + (pp.length === 1 ? ' cuenta' : ' cuentas') + (pp[0] ? ' · ' + venceTxt(pp[0].vence).toLowerCase() : '') : 'anotado a clientes'}</span></button>`)}
    </div>
    <div class="dos-uno">
      <section class="tarjeta entra llena" style="--i:4">
        <div class="tarjeta-tit">Ventas de los últimos ${E && !suc ? '14' : '30'} días<button type="button" class="enlace-tasa toca" onClick=${() => ir('reportes')}>Reportes →</button></div>
        ${E && !suc
          ? html`<${Barras} datos=${mes.slice(-14).map((d, i) => ({ l: i % 2 ? '' : String(new Date(d.t).getDate()), v: d.total, tip: fechaCorta(d.t) + ' · ' + D.m(d.total), segs: S.negocio.sucursales.map((s, j) => ({ v: d.porSuc[s] || 0, c: color(j) })) }))} alto=${200} hueco=${8} llenar />
            <div class="chips" style="margin-top:10px">${S.negocio.sucursales.map((s, j) => html`<span class="fila sub" style="gap:6px"><i style=${{ width: '10px', height: '10px', borderRadius: '3px', background: color(j) }}></i>${s}</span>`)}</div>`
          : html`<${Linea} datos=${mes.map(d => ({ l: fechaCorta(d.t), v: d.total, tip: D.m(d.total) }))} alto=${200} id="mes" llenar />`}
        ${(() => { const dias = E && !suc ? mes.slice(-14) : mes, n = dias.length, tot = dias.reduce((a, d) => a + d.total, 0);
          const mejor = dias.reduce((a, d) => d.total > a.total ? d : a, dias[0]), antes = resumen(hoy0 - (2 * n - 1) * DIA, hoy0 - (n - 1) * DIA, suc).total;
          const q = antes ? Math.round((tot / antes - 1) * 100) : 0;
          return html`<div class="resumen-gr">
            <div><span class="sub">Mejor día</span><b class="num">${D.m(mejor.total)}</b><span class="sub faint">${new Date(mejor.t).toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'short' })}</span></div>
            <div><span class="sub">Promedio por día</span><b class="num">${D.m(tot / n)}</b><span class="sub faint">${Math.round(dias.reduce((a, d) => a + d.n, 0) / n)} ventas al día</span></div>
            <div><span class="sub">Contra los ${n} días anteriores</span><b class="num" style=${{ color: q >= 0 ? 'var(--in)' : 'var(--out)' }}>${q > 0 ? '▲ ' : q < 0 ? '▼ ' : '= '}${Math.abs(q)} %</b><span class="sub faint">antes: ${D.m(antes)}</span></div>
          </div>`; })()}
      </section>
      <div class="entra" style="--i:5">${Pendientes}</div>
    </div>
    <div class="mitades">
      ${puede('ordenes') && html`<div class="entra" style="--i:6"><${OrdenesHoy} pc /></div>`}
      <div class="entra" style="--i:7">${Recientes}</div>
    </div>`;
}

export function venceTxt(t) {
  if (!t) return 'Sin fecha';
  const d = Math.round((inicioDia(t) - inicioDia(Date.now())) / DIA);
  if (d < 0) return 'Vencido hace ' + (-d) + (d === -1 ? ' día' : ' días');
  if (d === 0) return 'Vence hoy';
  if (d === 1) return 'Vence mañana';
  return 'Vence en ' + d + ' días';
}
