// Más (teléfono): un menú por temas (dinero, tu negocio, ventas y cobro, la app). En la computadora es la pantalla de Ajustes.
import { html, useState, useEffect } from '../lib/preact-htm.js';
import { useApp } from '../ctx.js';
import { cambiarAjustes, cambiarNegocio, exportar, resumen, gastosEntre, salir, porPagar, cierreDeHoy, cajaAbierta } from '../datos.js';
import { Icono, Interruptor, Chips, avisar, iniciales, TONOS, hace, Bandera } from '../ui.js';
import { nombreTasa } from '../paises.js';
import { inicioMes } from './gastos.js';
import { descargar, ventasCSV } from './reportes.js';
import { COND_ORDEN } from '../ordenpdf.js';
import { ajustesImpresora, hayBluetooth, conectarBluetooth, olvidarBluetooth, conectada, nombreImpresora, imprimir } from '../impresora.js';

// Impresora térmica: tamaño del papel, cómo se imprime, cajón y prueba.
function Impresora() {
  const { S, P } = useApp();
  const a = ajustesImpresora(), bt = hayBluetooth();
  const [nombre, setNombre] = useState(conectada() ? nombreImpresora() : '');
  const pon = x => cambiarNegocio({ impresora: Object.assign({}, a, x) });
  const conectar = async () => { try { setNombre(await conectarBluetooth()); avisar('Impresora conectada'); } catch (e) { avisar(e && e.message === 'sin-canal' ? 'Esa impresora no recibe datos por Bluetooth' : 'No se conectó. Enciende la impresora y vuelve a intentar'); } };
  const prueba = () => imprimir([{ t: S.negocio.nombre, c: 1, g: 1, n: 1 }, { t: 'Prueba de impresión', c: 1 }, { sep: '-' }, { a: 'Papel', b: a.ancho + ' mm' }, { a: 'Acentos', b: 'áéíóú ñ ¿¡ €' }, { a: 'Moneda', b: P.s + ' 1.234,56' }, { sep: '-' }, { t: 'Orbe Negocios', c: 1 }], { logo: S.negocio.logo }).catch(() => avisar('No se pudo imprimir'));
  return html`<div class="pila" style="gap:10px;margin-top:6px">
    <div class="campo"><span>Papel</span><${Chips} opciones=${[{ v: 58, n: '58 mm' }, { v: 80, n: '80 mm' }]} valor=${a.ancho} onCambio=${v => pon({ ancho: v })} chico /></div>
    <div class="campo"><span>Cómo imprime</span><${Chips} opciones=${[{ v: 'sistema', n: 'Del sistema (AirPrint, Wi-Fi, USB)' }, { v: 'bluetooth', n: 'Bluetooth directa' }]} valor=${a.modo} onCambio=${v => { if (v === 'bluetooth' && !bt) { avisar('Este navegador no permite Bluetooth. En iPhone usa una impresora con AirPrint.'); return; } pon({ modo: v }); }} chico /></div>
    ${a.modo === 'bluetooth' && html`<div class="fila entra" style="gap:8px"><span class="sub crece">${nombre ? 'Conectada: ' + nombre : 'Sin conectar'}</span>${nombre ? html`<button type="button" class="btn2 chico toca" onClick=${() => { olvidarBluetooth(); setNombre(''); }}>Desconectar</button>` : html`<button type="button" class="btn2 chico acento toca" onClick=${conectar}>Buscar impresora</button>`}</div>
      <${Interruptor} on=${!!a.cajon} onCambio=${v => pon({ cajon: v })} titulo="Abrir el cajón al cobrar en efectivo" sub="El cajón va conectado a la impresora." />`}
    ${!bt && html`<span class="sub faint" style="font-size:12px;line-height:1.4">En iPhone y iPad la impresión va por AirPrint (impresoras térmicas Wi-Fi compatibles). Bluetooth directa funciona en Android y computadoras con Chrome.</span>`}
    <${Interruptor} on=${!!a.auto} onCambio=${v => pon({ auto: v })} titulo="Imprimir el ticket al cobrar" sub="Sin tocar nada más." />
    <div class="chips"><button type="button" class="btn2 chico acento toca" onClick=${prueba}>Imprimir prueba</button></div>
  </div>`;
}

// Todos los ajustes como temas: en el celular, un menú por grupos donde cada tema abre su página;
// en la computadora, la lista de temas a la izquierda y el tema elegido a la derecha.
function useTemas() {
  const { S, P, T, D, abrir, tel, puede, yo, rol, ir, verRecorrido } = useApp();
  const n = S.negocio, aj = puede('ajustes');
  const todasPays = P.pays.concat(n.euro && !P.eur ? ['Efectivo €', 'Transferencia en €'] : []);
  const Dato = (a, b) => html`<div class="fila" style="justify-content:space-between;padding:10px 0;border-top:1px solid var(--line);font-size:14px"><span class="muted">${a}</span><b style="font-weight:600;text-align:right">${b}</b></div>`;
  const Botones = (...bs) => html`<div class="chips" style="margin-top:10px">${bs}</div>`;
  const fmt2 = x => new Intl.NumberFormat(P.loc, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(x);
  const mes0 = inicioMes(), rm = puede('ganancias') ? resumen(mes0, Date.now() + 1, '') : null;
  const gastosMes = gastosEntre(mes0, Date.now() + 1).reduce((a, g) => a + g.v, 0);
  const pp = porPagar(), ppTot = pp.reduce((a, g) => a + g.v, 0), cz = cierreDeHoy(), imp = ajustesImpresora();
  const nombreMes = new Date().toLocaleDateString('es', { month: 'long' });
  const temas = [
    { k: 'perfil', g: '', i: 'personas', c: 't-vio', n: 'Tu perfil', r: [yo.n, rol ? rol.n : ''].filter((x, i, a) => x && a.indexOf(x) === i).join(' · ') + ' · ' + (yo.pin ? 'con PIN' : 'sin PIN'), cuerpo: () => html`
      <div class="fila" style="gap:12px;padding:4px 0 12px"><span class=${'logo redondo ' + TONOS[S.perfiles.indexOf(yo) % 5]} style="width:48px;height:48px;font-size:16px">${iniciales(yo.n)}</span>
        <span class="crece" style="display:flex;flex-direction:column"><b style="font-size:16px">${yo.n}</b><span class="sub">${rol ? rol.n : ''} · ${yo.pin ? 'con PIN' : 'sin PIN'}</span></span></div>
      ${Botones(html`<button type="button" class="btn2 chico toca" onClick=${() => abrir('perfil', { pid: yo.id })}><${Icono} n="lapiz" t=${14} />Editar perfil</button>`, html`<button type="button" class="btn2 chico toca" onClick=${() => abrir('pin', { pid: yo.id })}><${Icono} n="candado" t=${14} />${yo.pin ? 'Cambiar PIN' : 'Poner PIN'}</button>`, html`<button type="button" class="btn2 chico acento toca" onClick=${() => salir()}>Cambiar de perfil</button>`)}` },
    puede('gastos') && { k: 'gastos', g: 'Dinero', i: 'dinero', c: 't-ros', n: 'Gastos y por pagar', r: pp.length ? D.m(ppTot) + ' por pagar · ' + pp.length + (pp.length === 1 ? ' cuenta' : ' cuentas') : 'Gastado este mes: ' + D.m(gastosMes), ir: () => ir('gastos'), solo: true },
    puede('vender') && { k: 'caja', g: 'Dinero', i: 'billete', c: 't-ver', n: 'Caja y turnos', r: cajaAbierta() ? 'Caja abierta · retiros y turnos' : 'Abrir caja, retiros y turnos', ir: () => abrir('caja'), solo: true },
    puede('cierre') && { k: 'cierre', g: 'Dinero', i: 'candado', c: 't-vio', n: 'Cierre del día', r: cz ? 'Cerrado a las ' + new Date(cz.t).toLocaleTimeString('es', { hour: 'numeric', minute: '2-digit' }) : 'Cuenta la caja al cerrar', ir: () => abrir('cierre'), solo: true },
    puede('ganancias') && { k: 'reportes', g: 'Dinero', i: 'grafico', c: 't-azu', n: 'Reportes', r: 'Ganancia real de ' + nombreMes + ': ' + D.m(rm.ganancia - gastosMes), ir: () => ir('reportes'), solo: true },
    aj && { k: 'negocio', g: 'Tu negocio', i: n.escala === 'empresa' ? 'edificio' : 'tienda', c: 't-vio', n: 'Datos y logo', r: n.nombre + ' · ' + T.n, cuerpo: () => html`
      ${Dato('Nombre', n.nombre)}${n.razon ? Dato('Razón social', n.razon) : null}${n.fiscal ? Dato(P.fiscal[0], n.fiscal) : null}${n.tel ? Dato('Teléfono', n.tel) : null}${n.dir ? Dato('Dirección', n.dir) : null}
      ${Dato('Tipo', T.n)}${Dato('Tamaño', n.escala === 'empresa' ? 'Empresa' : 'Negocio')}
      ${Botones(html`<button type="button" class="btn2 chico acento toca" onClick=${() => abrir('negocio')}><${Icono} n="lapiz" t=${14} />Cambiar datos y logo</button>`)}` },
    puede('equipo') && tel && { k: 'equipo', g: 'Tu negocio', i: 'personas', c: 't-ver', n: 'Equipo y permisos', r: S.perfiles.filter(x => !x.inactivo && !x.borrado).length + ' personas', ir: () => ir('equipo'), solo: true },
    aj && { k: 'locales', g: 'Tu negocio', i: 'edificio', c: 't-azu', n: 'Locales', r: n.sucursales.length === 1 ? '1 local' : n.sucursales.length + ' locales', cuerpo: () => html`
      ${n.sucursales.length > 1 ? n.sucursales.map((x, k) => Dato('Local ' + (k + 1), x)) : html`<p class="sub" style="margin:0 0 6px;line-height:1.45">Tienes un solo local, así que Orbe no te muestra sucursales. Si abres otro, agrégalo aquí.</p>`}
      ${Botones(html`<button type="button" class="btn2 chico acento toca" onClick=${() => abrir('locales')}>${n.sucursales.length > 1 ? 'Cambiar o agregar' : '+ Agregar otro local'}</button>`)}` },
    aj && { k: 'pagos', g: 'Ventas y cobro', i: 'tarjeta', c: 't-vio', n: 'Formas de pago', r: n.pays.length + (n.pays.length === 1 ? ' activa' : ' activas') + (n.pedirRef ? ' · pide referencia' : ''), cuerpo: () => html`
      <span class="sub">Toca para activar o quitar.</span>
      <div class="chips" style="margin:8px 0 12px">${todasPays.map(x => { const on = n.pays.includes(x); return html`<button type="button" class=${'chip chico toca' + (on ? ' on' : '')} aria-pressed=${on ? 'true' : 'false'} onClick=${() => { if (on && n.pays.length === 1) return; cambiarNegocio({ pays: on ? n.pays.filter(y => y !== x) : todasPays.filter(y => y === x || n.pays.includes(y)) }); }}>${x}</button>`; })}</div>
      <${Interruptor} on=${!!n.pedirRef} onCambio=${v => cambiarNegocio({ pedirRef: v })} titulo="Pedir referencia" sub="Al cobrar por transferencia, Pago Móvil, Zelle… para conciliar con el banco" />
      ${n.pedirRef && Botones(html`<button type="button" class="btn2 chico acento toca" onClick=${() => abrir('conciliar')}>Conciliar con el banco</button>`)}` },
    aj && { k: 'tasas', g: 'Ventas y cobro', i: 'sube', c: 't-amb', n: D.dual ? 'Tasas y monedas' : 'País y moneda', r: D.dual ? nombreTasa(P, S.tasa) + ' ' + fmt2(D.tasa) + (n.euro ? ' · euro activo' : '') : P.n + ' · ' + P.cur, cuerpo: () => html`
      ${Dato('País', html`<span class="fila" style="gap:6px;justify-content:flex-end"><${Bandera} id=${P.id} t=${16} />${P.n}</span>`)}${Dato('Moneda', P.id === 'VE' ? 'Dólares y bolívares' : P.usd2 ? P.cur.charAt(0).toUpperCase() + P.cur.slice(1) + ' y dólares' : P.cur)}
      ${D.dual ? html`${Dato(nombreTasa(P, S.tasa), (P.id === 'VE' ? 'Bs ' : P.s + ' ') + fmt2(D.tasa) + ' · ' + (S.tasa.modo === 'manual' ? 'a mano' : S.tasa.fecha || 'sin leer'))}
        ${Botones(html`<button type="button" class="btn2 chico acento toca" onClick=${() => abrir('tasa')}>Ver y cambiar las tasas</button>`, html`<button type="button" class="btn2 chico toca" onClick=${() => abrir('ceros')}>Quitar ceros</button>`)}
        <${Interruptor} on=${!!n.euro} onCambio=${v => cambiarNegocio(Object.assign({ euro: v }, v && !n.pays.includes('Efectivo €') ? { pays: n.pays.concat(['Efectivo €']) } : {}), (v ? 'Empezó' : 'Dejó') + ' a aceptar euros')} titulo="Aceptar euros" sub=${'Cobra en € con la tasa del euro' + (P.id === 'VE' ? ' del BCV' : '') + ' y ve tus reportes en €'} />
        ${P.id === 'VE' && html`<${Interruptor} on=${!!n.igtf} onCambio=${v => cambiarNegocio({ igtf: v }, (v ? 'Activó' : 'Desactivó') + ' el IGTF')} titulo="Cobrar IGTF 3 %" sub="En pagos en divisas: efectivo $, Zelle, USDT, Binance" />`}
        ${P.id !== 'VE' && html`<${Interruptor} on=${!!n.fiadoUsd} onCambio=${v => cambiarNegocio({ fiadoUsd: v }, (v ? 'Activó' : 'Desactivó') + ' el fiado en dólares')} titulo="Fiado en dólares" sub="Lo que te deben no pierde valor si sube el dólar" />`}` : null}` },
    aj && { k: 'impuesto', g: 'Ventas y cobro', i: 'porciento', c: 't-azu', n: 'Impuesto', r: n.taxOn ? P.tax[0] + ' ' + (n.taxGen != null ? n.taxGen : P.tax[1]) + ' % ' + (n.taxIncl ? 'en el precio' : 'aparte') : 'No cobras impuesto', cuerpo: () => html`
      <${Interruptor} on=${!!n.taxOn} onCambio=${v => cambiarNegocio({ taxOn: v })} titulo=${'Cobrar ' + P.tax[0] + ' ' + (n.taxGen != null ? n.taxGen : P.tax[1]) + ' %'} sub=${P.tax[1] ? 'Sale en el recibo' : 'En tu país varía según la zona: escribe la tuya'} />
      ${n.taxOn && html`<div class="segmento" style="width:100%;margin-top:8px">${[[true, 'En el precio'], [false, 'Aparte']].map(o => html`<button type="button" style="flex:1" class=${n.taxIncl === o[0] ? 'on' : ''} onClick=${() => cambiarNegocio({ taxIncl: o[0] })}>${o[1]}</button>`)}</div>
        <div class="fila" style="gap:10px;margin-top:12px"><span class="sub crece" style="line-height:1.4">Tasa general. A cada producto le puedes poner una reducida o exento.</span>
          <div class="pago-monto" style="width:110px;min-height:44px"><input class="num" type="text" inputmode="decimal" aria-label="Tasa general" placeholder=${String(P.tax[1])} value=${n.taxGen != null ? String(n.taxGen).replace('.', ',') : ''} onChange=${e => { const v = parseFloat(e.target.value.replace(',', '.')); cambiarNegocio({ taxGen: isFinite(v) && v >= 0 && v < 100 ? v : undefined }); }} /><span class="sub">%</span></div></div>`}` },
    aj && { k: 'impresora', g: 'Ventas y cobro', i: 'doc', c: 't-ver', n: 'Impresora de tickets', r: imp.ancho + ' mm · ' + (imp.modo === 'bluetooth' ? 'Bluetooth' : 'del sistema') + (imp.auto ? ' · imprime al cobrar' : ''), cuerpo: () => html`<${Impresora} />` },
    aj && { k: 'ordenes', g: 'Ventas y cobro', i: 'orden', c: 't-azu', n: 'Órdenes de trabajo', r: 'Condiciones del PDF', cuerpo: () => html`
      <p class="sub" style="margin:0 0 8px;line-height:1.45">Siempre activas: las creas desde el botón Orbe o desde Órdenes.</p>
      <label class="campo"><span>Condiciones que salen en la orden impresa y en el PDF</span><textarea rows="4" value=${n.condOrden != null ? n.condOrden : COND_ORDEN} onChange=${e => cambiarNegocio({ condOrden: e.target.value.trim() })}></textarea></label>
      ${Botones(html`<button type="button" class="btn2 chico acento toca" onClick=${() => ir('ordenes')}>Ir a Órdenes</button>`)}` },
    { k: 'apariencia', g: 'La app', i: 'sol', c: 't-amb', n: 'Apariencia', r: { auto: 'Automática', claro: 'Clara', oscuro: 'Oscura' }[S.ajustes.tema || 'auto'], cuerpo: () => html`<${Chips} opciones=${[{ v: 'auto', n: 'Automático' }, { v: 'claro', n: 'Claro' }, { v: 'oscuro', n: 'Oscuro' }]} valor=${S.ajustes.tema || 'auto'} onCambio=${v => cambiarAjustes({ tema: v })} />` },
    aj && { k: 'copias', g: 'La app', i: 'guardar', c: 't-ver', n: 'Copias y Excel', r: 'Una copia por día · las últimas 7', cuerpo: () => html`
      ${Dato('Dónde se guarda', 'En este aparato')}${Dato('Copias automáticas', 'Una por día · las últimas 7')}${Dato('Sin internet', 'Sigue funcionando')}
      ${Botones(html`<button type="button" class="btn2 chico acento toca" onClick=${() => abrir('copias')}><${Icono} n="deshacer" t=${15} />Restaurar copia</button>`, html`<button type="button" class="btn2 chico toca" onClick=${() => { descargar('orbe-negocios-copia-' + new Date().toISOString().slice(0, 10) + '.json', exportar(), 'application/json'); avisar('Copia descargada'); }}><${Icono} n="descarga" t=${15} />Descargar copia</button>`, html`<button type="button" class="btn2 chico toca" onClick=${() => { descargar('orbe-ventas.csv', ventasCSV(0, Date.now() + 1), 'text/csv;charset=utf-8'); avisar('Excel descargado'); }}><${Icono} n="doc" t=${15} />Ventas en Excel</button>`)}` },
    aj && { k: 'registro', g: 'La app', i: 'escudo', c: 't-vio', n: 'Registro y cierres', r: (S.registro || []).length ? 'Último: ' + hace(S.registro[S.registro.length - 1].t) : 'Quién anula, devuelve o borra', cuerpo: () => html`
      ${(S.registro || []).length ? (S.registro || []).slice(-5).reverse().map(x => Dato(x.que, hace(x.t))) : html`<p class="sub" style="margin:0 0 6px;line-height:1.45">Aquí queda anotado quién anula ventas, hace devoluciones o borra algo.</p>`}
      ${Botones(html`<button type="button" class="btn2 chico toca" onClick=${() => abrir('registro')}>Ver todo y revisar firmas</button>`, S.cierres.length > 0 && html`<button type="button" class="btn2 chico toca" onClick=${() => abrir('cierres')}>Cierres Z</button>`)}` },
    { k: 'ayuda', g: 'La app', i: 'lista', c: 't-azu', n: 'Ayuda y recorrido', r: 'Qué hace cada parte y cómo se usa', cuerpo: () => html`<p class="sub" style="margin:0 0 6px;line-height:1.45">Un recorrido guiado por toda la app: qué hace cada parte y cómo se usa.</p>
      ${Botones(html`<button type="button" class="btn2 chico acento toca" onClick=${verRecorrido}>Ver el recorrido guiado</button>`)}` },
    aj && { k: 'borrar', g: 'La app', i: 'basura', c: 't-ros', n: 'Empezar de nuevo', r: 'Borra este negocio de este aparato', cuerpo: () => html`<p class="sub" style="margin:0 0 6px;line-height:1.45">Borra este negocio de este aparato para probar otro país o tipo. Antes se guarda una copia.</p>
      ${Botones(html`<button type="button" class="btn2 chico rojo toca" onClick=${() => abrir('borrar')}>Empezar de nuevo</button>`)}` }
  ].filter(Boolean);
  return temas;
}
const GRUPOS = ['', 'Dinero', 'Tu negocio', 'Ventas y cobro', 'La app'];
const TOUR = { perfil: 'perfil', copias: 'copias' };
const Fila = (t, onClick) => html`<button type="button" key=${t.k} class="opcion-menu toca" data-tour=${TOUR[t.k]} onClick=${onClick}>
  <span class=${'ic ' + t.c} style="width:36px;height:36px;border-radius:11px"><${Icono} n=${t.i} t=${17} g=${2.2} /></span>
  <span class="crece" style="display:flex;flex-direction:column;gap:1px;min-width:0"><b>${t.n}</b><span class="sub corta">${t.r}</span></span>
  <${Icono} n="sig" t=${16} c="var(--faint)" /></button>`;

// Computadora: temas a la izquierda y el elegido a la derecha.
function Ajustes() {
  const temas = useTemas().filter(t => !t.solo);
  const [k, setK] = useState('perfil');
  const t = temas.find(x => x.k === k) || temas[0];
  return html`<div class="ajustes-dos">
    <nav class="ajustes-temas" aria-label="Temas de ajustes">${GRUPOS.map(g => { const de = temas.filter(x => x.g === g); return de.length ? html`<div key=${g || 'yo'}>${g && html`<small>${g}</small>`}${de.map(x => html`<button type="button" class=${'toca' + (x.k === t.k ? ' on' : '')} data-tour=${TOUR[x.k]} aria-current=${x.k === t.k ? 'true' : 'false'} onClick=${() => setK(x.k)}><span class=${'ic ' + x.c}><${Icono} n=${x.i} t=${15} g=${2.2} /></span>${x.n}</button>`)}</div>` : null; })}</nav>
    <section class="tarjeta ajustes-tema entra" key=${t.k}><div class="fila" style="gap:12px;margin-bottom:6px"><span class=${'ic ' + t.c}><${Icono} n=${t.i} t=${18} g=${2.2} /></span><span class="crece" style="display:flex;flex-direction:column"><b style="font-size:19px">${t.n}</b><span class="sub">${t.r}</span></span></div>${t.cuerpo()}</section>
  </div>`;
}

// Celular: menú por grupos; cada tema abre su página.
export function Mas() {
  const { tel } = useApp();
  const temas = useTemas();
  const [k, setK] = useState('');
  useEffect(() => { const p = document.querySelector('.app-fondo'); if (p) p.scrollTop = 0; }, [k]);
  if (!tel) return html`<${Ajustes} />`;
  const t = k && temas.find(x => x.k === k && !x.solo);
  if (t) return html`
    <button type="button" class="volver toca entra" onClick=${() => setK('')}><${Icono} n="atras" t=${18} />Más</button>
    <div class="fila entra" style="gap:12px"><span class=${'ic ' + t.c}><${Icono} n=${t.i} t=${18} g=${2.2} /></span><h1 class="titulo crece">${t.n}</h1></div>
    <section class="tarjeta entra" style="--i:1">${t.cuerpo()}</section>`;
  return html`
    <h1 class="titulo entra">Más</h1>
    ${GRUPOS.map((g, gi) => { const de = temas.filter(x => x.g === g); return de.length ? html`<div class="pila entra" style=${{ gap: '8px', '--i': gi }} data-tour=${g === 'Dinero' ? 'mas-acciones' : undefined}>${g && html`<h2 class="grupo-menu">${g}</h2>`}
      <section class="tarjeta menu-lista">${de.map(x => Fila(x, () => x.solo ? x.ir() : setK(x.k)))}</section></div>` : null; })}`;
}
