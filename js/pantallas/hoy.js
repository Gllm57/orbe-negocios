// Hoy (teléfono) y Panel (computadora): cómo va el día, con gráficos en vivo.
import { html } from '../lib/preact-htm.js';
import { useApp } from '../ctx.js';
import { resumen, serieDias, inicioDia, deudores, porPagar, bajoMinimo, bajoCosto, cierreDeHoy, leer, diaClave, vigentes } from '../datos.js';
import { esElectronico } from '../paises.js';
import { Barras, Linea, Reparto, Monto, Anillo, color } from '../graficos.js';
import { Icono, LogoOrbe, iniciales, hora, fechaCorta } from '../ui.js';
import { nombreTasa } from '../paises.js';
import { FilaVenta } from './hojas.js';
import { OfertaRecorrido } from '../recorrido.js';
import { BarraTasas } from './tasas.js';

const DIA = 86400000;

export function Hoy() {
  const { S, P, T, D, E, tel, ir, abrir, suc, setSuc, enLinea, puede } = useApp();
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
  if (pp.length && puede('gastos')) pendientes.push({ i: 'calendario', t: 't-ros', txt: pp[0].n + ': ' + D.m(pp[0].v), sub: venceTxt(pp[0].vence), go: () => ir(tel ? 'mas' : 'gastos') });
  if (D.dual) pendientes.push({ i: 'sube', t: 't-vio', txt: nombreTasa(P, S.tasa) + ': ' + (P.id === 'VE' ? 'Bs ' : P.s + ' ') + new Intl.NumberFormat(P.loc, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(D.tasa), sub: S.tasa.modo === 'manual' ? 'Escrita a mano' : S.tasa.valor && S.tasa.fecha === diaClave(Date.now()) ? 'Leída hoy de internet' : 'Sin internet: se usa la última guardada', go: () => abrir('tasa') });
  if (D.dual && S.negocio.euro) pendientes.push({ i: 'sube', t: 't-azu', txt: 'Euro: ' + (P.id === 'VE' ? 'Bs ' : P.s + ' ') + new Intl.NumberFormat(P.loc, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(D.tasaEur), sub: S.tasas.euro && S.tasas.euro.valor ? (S.tasas.euro.modo === 'manual' ? 'Escrita a mano' : 'Leída ' + (S.tasas.euro.fecha === diaClave(Date.now()) ? 'hoy' : 'el ' + S.tasas.euro.fecha)) : 'Estimada con el dólar: léela o escríbela', go: () => abrir('tasa') });
  // La tasa saltó desde ayer: conviene revisar precios (o, en Venezuela, la tasa con la que cobras).
  if (D.dual) { const h = (S.historialTasas || []).filter(x => x.f === (S.tasa.fuente || 'oficial')); const q = h.length > 1 ? (h[h.length - 1].v / h[h.length - 2].v - 1) * 100 : 0;
    if (Math.abs(q) >= 3) pendientes.unshift({ i: 'alerta', t: 't-amb', txt: 'El dólar ' + (q > 0 ? 'subió ' : 'bajó ') + Math.abs(q).toFixed(1).replace('.', ',') + ' % desde ayer', sub: P.id === 'VE' || !puede('productos') ? 'Revisa las tasas con las que cobras' : 'Revisa tus precios', go: puede('productos') && P.id !== 'VE' ? () => abrir('remarcar') : () => abrir('tasa') }); }
  const sinGan = bajoCosto();
  if (sinGan.length && puede('productos')) pendientes.push({ i: 'etiqueta', t: 't-ros', txt: sinGan.length + (sinGan.length === 1 ? ' producto casi no deja ganancia' : ' productos casi no dejan ganancia'), sub: sinGan.slice(0, 2).map(p => p.n).join(', ') + ': cuesta reponerlos casi lo que cobras', go: () => abrir('remarcar', { alcance: 'margen' }) });
  if (S.negocio.pedirRef && puede('ajustes')) { const n = vigentes().filter(v => v.t > Date.now() - 7 * DIA).reduce((a, v) => a + v.pagos.filter(p => p.ref && !p.ok && esElectronico(p.m)).length, 0);
    if (n) pendientes.push({ i: 'check', t: 't-azu', txt: n + (n === 1 ? ' pago por verificar' : ' pagos por verificar') + ' con el banco', sub: 'Sube el estado de cuenta y Orbe los busca', go: () => abrir('conciliar') }); }
  if (puede('cierre')) pendientes.push(cierre ? { i: 'check', t: 't-ver', txt: 'Día cerrado', sub: 'Cerraste a las ' + hora(cierre.t), go: null } : { i: 'candado', t: 't-ver', txt: 'Cierre del día', sub: 'Cuenta la caja cuando cierres', go: () => abrir('cierre') });

  const recientes = leer().ventas.filter(v => !suc || v.suc === suc).slice(-6).reverse();

  const Pendientes = html`<div class="tarjeta" data-tour="pendientes" style="padding-bottom:6px">
    <div class="tarjeta-tit">Pendientes de hoy<span class="sub">${pendientes.filter(p => p.go).length} por hacer</span></div>
    <div class="lista">${pendientes.map((p, k) => html`<button type="button" class="item toca entra" style=${{ '--i': k, color: 'var(--ink)', cursor: p.go ? 'pointer' : 'default' }} onClick=${p.go || undefined}>
      <span class=${'ic ' + p.t} style="width:32px;height:32px;border-radius:10px"><${Icono} n=${p.i} t=${16} g=${2.2} /></span>
      <span class="crece" style="display:flex;flex-direction:column;gap:1px"><span style="font-size:14px;line-height:1.35">${p.txt}</span><span class="sub faint">${p.sub}</span></span>
      ${p.go && html`<${Icono} n="sig" t=${16} c="var(--faint)" />`}
    </button>`)}</div>
  </div>`;

  const Recientes = html`<div class="tarjeta" style="padding-bottom:6px">
    <div class="tarjeta-tit">Últimas ventas<span class="sub">${r.n} hoy</span></div>
    <div class="lista">${recientes.map((v, k) => html`<${FilaVenta} key=${v.id} v=${v} i=${k} fecha />`)}</div>
  </div>`;

  if (tel) return html`
    <header class="cab entra">
      <span class="logo marca">${iniciales(S.negocio.nombre)}</span>
      <span class="crece"><b class="corta">${S.negocio.nombre}</b><span class="sub corta">${new Date().toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' })} · ${P.f} ${E ? (suc || 'Todos los locales') : T.n}</span></span>
      <span class="pildora" style=${{ background: enLinea ? 'var(--in-soft)' : 'var(--amber-soft)', color: enLinea ? 'var(--in-text)' : 'var(--amber-text)' }}><span class="punto"></span>${enLinea ? 'En línea' : 'Sin internet'}</span>
    </header>
    <${BarraTasas} />
    <${OfertaRecorrido} />
    ${E && html`<div class="chips desliza">${[''].concat(S.negocio.sucursales).map(x => html`<button type="button" class=${'chip chico toca' + (suc === x ? ' on' : '')} onClick=${() => setSuc(x)}>${x || 'Todas'}</button>`)}</div>`}
    <section class="tarjeta entra" data-tour="resumen" style="--i:1;background:linear-gradient(160deg, color-mix(in srgb, var(--c1) 26%, var(--surface)), var(--surface));display:flex;flex-direction:column;gap:12px">
      <div class="fila" style="align-items:flex-start">
        <span class="crece" style="display:flex;flex-direction:column;gap:2px">
          <span class="sub">${T.vender === 'Cobrar' ? 'Cobrado hoy' : 'Ventas de hoy'}</span>
          <${Monto} v=${r.total} f=${D.m} clase="titulo" />
          ${D.dual && html`<span class="sub num">${D.s(r.total)}</span>`}
          <span class="pildora" style=${{ alignSelf: 'flex-start', marginTop: '6px', background: vs >= 0 ? 'var(--in-soft)' : 'var(--out-soft)', color: vs >= 0 ? 'var(--in-text)' : 'var(--out-text)' }}>${vs >= 0 ? '+' : ''}${vs} % vs ayer a esta hora</span>
        </span>
        <span style="display:flex;flex-direction:column;align-items:center;gap:4px"><${Anillo} p=${r.total / meta} tam=${68}>${Math.round(r.total / meta * 100)}%</${Anillo}><span class="sub" style="font-size:11px">de tu promedio</span></span>
      </div>
      <${Barras} datos=${horas} alto=${86} resaltar=${ahoraH - 7} hueco=${4} />
    </section>
    <div class="rejilla-3">
      ${[verGan ? ['Ganancia', D.m(r.ganancia), 'ya sin el costo', 'var(--in)'] : ['Ticket', D.m(r.ticket), 'promedio por venta', 'var(--ink)'], [T.inv ? 'Ventas' : 'Clientes', String(r.n), 'promedio ' + D.corto(r.ticket), 'var(--ink)'], ['Te deben', D.m(debenTot), deben.length + ' clientes', 'var(--amber)']].map((k, i) => html`
        <div class="tarjeta cifra entra" style=${{ '--i': 2 + i }}><span class="sub" style="font-size:11px">${k[0]}</span><span class="v num corta" style=${{ color: k[3] }}>${k[1]}</span><span class="faint corta" style="font-size:11px">${k[2]}</span></div>`)}
    </div>
    <div class="rejilla-3" data-tour="accesos">
      ${[['carrito', T.vender, 't-vio', () => ir('vender')], ['dinero', 'Anotar gasto', 't-ros', () => abrir('gasto')], ['candado', cierre ? 'Día cerrado' : 'Cierre del día', 't-ver', () => cierre ? null : abrir('cierre')]].filter((q, i) => [puede('vender'), puede('gastos'), puede('cierre')][i]).map((q, i) => html`
        <button type="button" class="tarjeta toca entra" style=${{ '--i': 5 + i, border: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '7px', padding: '14px 6px', color: 'var(--ink)', fontSize: '12px', fontWeight: 600 }} onClick=${q[3]}>
          <span class=${'ic ' + q[2]}><${Icono} n=${q[0]} t=${18} g=${2.2} /></span>${q[1]}</button>`)}
    </div>
    ${pagos.length > 0 && html`<section class="tarjeta entra" style="--i:8"><div class="tarjeta-tit">${E && !suc ? 'Por sucursal hoy' : 'Cómo te pagaron hoy'}</div><${Reparto} segs=${E && !suc ? sucs : pagos} f=${D.m} titulo="Vendido hoy" /></section>`}
    <section class="tarjeta entra" style="--i:8">
      <div class="tarjeta-tit">Últimos 7 días<button type="button" class="btn2 chico acento toca" onClick=${() => ir('reportes')}>Reportes</button></div>
      <${Barras} datos=${semana.map((d, i) => ({ l: i === 6 ? 'Hoy' : new Date(d.t).toLocaleDateString('es', { weekday: 'narrow' }), v: d.total, tip: fechaCorta(d.t) + ' · ' + D.m(d.total) }))} alto=${120} resaltar=${6} />
    </section>
    ${Pendientes}
    ${Recientes}`;

  // ---------- computadora ----------
  return html`
    <${OfertaRecorrido} />
    <div class="cifras">
      <div class="tarjeta cifra entra fila" style="--i:0;flex-direction:row;align-items:center">
        <span class="crece" style="display:flex;flex-direction:column;gap:4px"><span class="sub">${T.vender === 'Cobrar' ? 'Cobrado hoy' : 'Ventas de hoy'}</span><${Monto} v=${r.total} f=${D.m} clase="v" /><span class="sub" style=${{ color: vs >= 0 ? 'var(--in)' : 'var(--out)' }}>${vs >= 0 ? '+' : ''}${vs} % vs ayer${D.dual ? ' · ' + D.s(r.total) : ''}</span></span>
        <${Anillo} p=${r.total / meta} tam=${62}>${Math.round(r.total / meta * 100)}%</${Anillo}>
      </div>
      ${[verGan ? ['Ganancia de hoy', r.ganancia, 'ya sin el costo · ' + r.n + ' ventas', 'var(--in)'] : ['Ticket promedio', r.ticket, r.n + ' ventas hoy', 'var(--ink)'], ['Te deben', debenTot, deben.length + ' clientes', 'var(--amber)'], !puede('gastos') ? ['Fiado hoy', r.fiado, 'anotado a clientes', 'var(--amber)'] : ['Por pagar', ppTot, pp.length ? pp.length + ' cuentas · ' + venceTxt(pp[0].vence).toLowerCase() : 'Nada pendiente', 'var(--out)']].map((k, i) => html`
        <div class="tarjeta cifra entra" style=${{ '--i': i + 1 }}><span class="sub">${k[0]}</span><${Monto} v=${k[1]} f=${D.m} clase="v" /><span class="sub faint">${k[2]}</span></div>`)}
    </div>
    <div class="dos-uno">
      <section class="tarjeta entra llena" style="--i:4">
        <div class="tarjeta-tit">Ventas de los últimos ${E && !suc ? '14' : '30'} días<span class="sub">Total ${D.m((E && !suc ? mes.slice(-14) : mes).reduce((a, d) => a + d.total, 0))}</span></div>
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
      <section class="tarjeta entra" style="--i:5">
        <div class="tarjeta-tit">${E && !suc ? 'Por sucursal hoy' : 'Formas de pago hoy'}</div>
        ${(E && !suc ? sucs : pagos).length ? html`<${Reparto} segs=${E && !suc ? sucs : pagos} f=${D.m} titulo="Vendido hoy" tam=${132} />` : html`<p class="vacio">Todavía no hay ventas hoy.</p>`}
      </section>
    </div>
    <div class="tres estira">
      <section class="tarjeta entra llena" style="--i:6"><div class="tarjeta-tit">Ventas por hora<span class="sub">hoy</span></div><${Barras} datos=${horas} alto=${180} resaltar=${ahoraH - 7} llenar /></section>
      <div class="entra" style="--i:7">${Pendientes}</div>
      <div class="entra" style="--i:8">${Recientes}</div>
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
