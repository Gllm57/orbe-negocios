// Más (teléfono): gastos, cierre, reportes y ajustes. En la computadora es la pantalla de Ajustes.
import { html, useState } from '../lib/preact-htm.js';
import { useApp } from '../ctx.js';
import { cambiarAjustes, cambiarNegocio, exportar, resumen, gastosEntre, inicioDia, salir } from '../datos.js';
import { Monto } from '../graficos.js';
import { Icono, Interruptor, Chips, avisar, iniciales, TONOS, hace, Bandera } from '../ui.js';
import { nombreTasa } from '../paises.js';
import { BloqueGastos, inicioMes } from './gastos.js';
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

function Ajustes() {
  const { S, P, T, D, abrir, tel, puede, yo, rol, ir, verRecorrido } = useApp();
  const n = S.negocio;
  // Formas de pago del país, más las de euros si el negocio los acepta.
  const todasPays = P.pays.concat(n.euro && !P.eur ? ['Efectivo €', 'Transferencia en €'] : []);
  const Tarjeta = (titulo, icono, hijos, i, dt) => html`<section class="tarjeta entra" data-tour=${dt} style=${{ '--i': i }}>
    <div class="fila" style="gap:10px;margin-bottom:6px"><span class="ic t-vio" style="width:32px;height:32px;border-radius:10px"><${Icono} n=${icono} t=${16} g=${2.2} /></span><b style="font-size:15px">${titulo}</b></div>${hijos}</section>`;
  const Dato = (a, b) => html`<div class="fila" style="justify-content:space-between;padding:9px 0;border-top:1px solid var(--line);font-size:13px"><span class="muted">${a}</span><b style="font-weight:600;text-align:right">${b}</b></div>`;
  const tarjetas = [
    Tarjeta(n.escala === 'empresa' ? 'Empresa' : 'Negocio', n.escala === 'empresa' ? 'edificio' : T.id, html`
      ${Dato('Nombre', n.nombre)}${n.razon ? Dato('Razón social', n.razon) : null}${n.fiscal ? Dato(P.fiscal[0], n.fiscal) : null}
      ${Dato('Tipo', T.n)}${Dato('Tamaño', n.escala === 'empresa' ? 'Empresa' : 'Negocio')}
      <div class="chips" style="margin-top:8px"><button type="button" class="btn2 chico acento toca" onClick=${() => abrir('negocio')}><${Icono} n="lapiz" t=${14} />Cambiar datos</button></div>`, 0),
    Tarjeta('Órdenes de trabajo y pedidos', 'lista', html`
      <${Interruptor} on=${!!n.ordenes} onCambio=${v => { cambiarNegocio({ ordenes: v }, (v ? 'Activó' : 'Desactivó') + ' las órdenes de trabajo y pedidos'); avisar(v ? (tel ? 'Listo: «Órdenes» está en la barra de abajo. Clientes pasó a Más.' : 'Listo: «Órdenes» está en el menú') : 'Órdenes desactivadas (las guardadas no se borran)'); }} titulo="Usar órdenes" sub="Para talleres, reparaciones, encargos y pedidos con fecha de entrega, anticipo y seguimiento." />
      ${n.ordenes && html`<label class="campo entra" style="margin-top:6px"><span>Condiciones que salen en la orden impresa y en el PDF</span><textarea rows="3" value=${n.condOrden != null ? n.condOrden : COND_ORDEN} onChange=${e => cambiarNegocio({ condOrden: e.target.value.trim() })}></textarea></label>
        <div class="chips" style="margin-top:8px"><button type="button" class="btn2 chico acento toca" onClick=${() => ir('ordenes')}>Ir a Órdenes</button></div>`}`, 0),
    Tarjeta(n.sucursales.length > 1 ? 'Locales y sucursales' : 'Tu local', 'edificio', html`
      ${n.sucursales.length > 1 ? n.sucursales.map((x, k) => Dato('Local ' + (k + 1), x)) : html`<p class="sub" style="margin:4px 0 10px;line-height:1.45">Tienes un solo local, así que Orbe no te muestra sucursales. Si abres otro, agrégalo aquí.</p>`}
      <div class="chips" style="margin-top:8px"><button type="button" class="btn2 chico acento toca" onClick=${() => abrir('locales')}>${n.sucursales.length > 1 ? 'Cambiar o agregar' : '+ Agregar otro local'}</button></div>`, 1),
    Tarjeta('País y moneda', 'mundo', html`${Dato('País', html`<span class="fila" style="gap:6px;justify-content:flex-end"><${Bandera} id=${P.id} t=${16} />${P.n}</span>`)}${Dato('Moneda', P.id === 'VE' ? 'Dólares y bolívares' : P.usd2 ? P.cur.charAt(0).toUpperCase() + P.cur.slice(1) + ' y dólares' : P.cur)}
      ${D.dual ? html`${Dato(nombreTasa(P, S.tasa), (P.id === 'VE' ? 'Bs ' : P.s + ' ') + new Intl.NumberFormat(P.loc, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(D.tasa) + ' · ' + (S.tasa.modo === 'manual' ? 'a mano' : S.tasa.fecha || 'sin leer'))}
        <div class="chips" style="margin-top:8px"><button type="button" class="btn2 chico acento toca" onClick=${() => abrir('tasa')}>${S.tasa.modo === 'manual' ? 'Cambiar la tasa' : 'Tasa automática · cambiar'}</button>
          <button type="button" class="btn2 chico toca" onClick=${() => abrir('ceros')}>Quitar ceros</button></div>
        <${Interruptor} on=${!!n.euro} onCambio=${v => cambiarNegocio(Object.assign({ euro: v }, v && !n.pays.includes('Efectivo €') ? { pays: n.pays.concat(['Efectivo €']) } : {}), (v ? 'Empezó' : 'Dejó') + ' a aceptar euros')} titulo="Aceptar euros" sub=${'Cobra en € con la tasa del euro' + (P.id === 'VE' ? ' del BCV' : '') + ' y ve tus reportes en €'} />
        ${P.id === 'VE' && html`<${Interruptor} on=${!!n.igtf} onCambio=${v => cambiarNegocio({ igtf: v }, (v ? 'Activó' : 'Desactivó') + ' el IGTF')} titulo="Cobrar IGTF 3 %" sub="En pagos en divisas: efectivo $, Zelle, USDT, Binance" />`}
        ${P.id !== 'VE' && html`<${Interruptor} on=${!!n.fiadoUsd} onCambio=${v => cambiarNegocio({ fiadoUsd: v }, (v ? 'Activó' : 'Desactivó') + ' el fiado en dólares')} titulo="Fiado en dólares" sub="Lo que te deben no pierde valor si sube el dólar" />`}` : null}`, 1),
    Tarjeta('Formas de pago', 'tarjeta', html`<${Interruptor} on=${!!n.pedirRef} onCambio=${v => cambiarNegocio({ pedirRef: v })} titulo="Pedir referencia" sub="Al cobrar por transferencia, Pago Móvil, Zelle… para conciliar con el banco" />
      ${n.pedirRef && html`<div class="chips" style="margin:2px 0 8px"><button type="button" class="btn2 chico acento toca" onClick=${() => abrir('conciliar')}>Conciliar con el banco</button></div>`}
      <div class="chips" style="margin-top:6px">${todasPays.map(x => { const on = n.pays.includes(x); return html`<button type="button" class=${'chip chico toca' + (on ? ' on' : '')} aria-pressed=${on ? 'true' : 'false'} onClick=${() => { if (on && n.pays.length === 1) return; cambiarNegocio({ pays: on ? n.pays.filter(y => y !== x) : todasPays.filter(y => y === x || n.pays.includes(y)) }); }}>${x}</button>`; })}</div>`, 2),
    Tarjeta('Impuesto', 'porciento', html`
      <${Interruptor} on=${!!n.taxOn} onCambio=${v => cambiarNegocio({ taxOn: v })} titulo=${'Cobrar ' + P.tax[0] + ' ' + (n.taxGen != null ? n.taxGen : P.tax[1]) + ' %'} sub=${P.tax[1] ? 'Sale en el recibo' : 'En tu país varía según la zona: escribe la tuya'} />
      ${n.taxOn && html`<div class="segmento" style="width:100%">${[[true, 'En el precio'], [false, 'Aparte']].map(o => html`<button type="button" style="flex:1" class=${n.taxIncl === o[0] ? 'on' : ''} onClick=${() => cambiarNegocio({ taxIncl: o[0] })}>${o[1]}</button>`)}</div>
        <div class="fila" style="gap:10px;margin-top:10px"><span class="sub crece" style="line-height:1.4">Tasa general. A cada producto le puedes poner una reducida o exento.</span>
          <div class="pago-monto" style="width:110px;min-height:44px"><input class="num" type="text" inputmode="decimal" aria-label="Tasa general" placeholder=${String(P.tax[1])} value=${n.taxGen != null ? String(n.taxGen).replace('.', ',') : ''} onChange=${e => { const v = parseFloat(e.target.value.replace(',', '.')); cambiarNegocio({ taxGen: isFinite(v) && v >= 0 && v < 100 ? v : undefined }); }} /><span class="sub" style="padding-right:10px">%</span></div></div>`}`, 3),
    Tarjeta('Apariencia', 'sol', html`<div style="margin-top:6px"><${Chips} opciones=${[{ v: 'auto', n: 'Automático' }, { v: 'claro', n: 'Claro' }, { v: 'oscuro', n: 'Oscuro' }]} valor=${S.ajustes.tema || 'auto'} onCambio=${v => cambiarAjustes({ tema: v })} chico /></div>`, 4),
    Tarjeta('Impresora de tickets', 'doc', html`<${Impresora} />`, 5),
    Tarjeta('Copias y sin conexión', 'guardar', html`
      ${Dato('Dónde se guarda', 'En este aparato')}${Dato('Copias automáticas', 'Una por día · las últimas 7')}${Dato('Sin internet', 'Sigue funcionando')}
      <div class="chips" style="margin-top:8px">
        <button type="button" class="btn2 chico acento toca" onClick=${() => abrir('copias')}><${Icono} n="deshacer" t=${15} />Restaurar copia</button>
        <button type="button" class="btn2 chico toca" onClick=${() => { descargar('orbe-negocios-copia-' + new Date().toISOString().slice(0, 10) + '.json', exportar(), 'application/json'); avisar('Copia descargada'); }}><${Icono} n="descarga" t=${15} />Descargar copia</button>
        <button type="button" class="btn2 chico toca" onClick=${() => { descargar('orbe-ventas.csv', ventasCSV(0, Date.now() + 1), 'text/csv;charset=utf-8'); avisar('Excel descargado'); }}><${Icono} n="doc" t=${15} />Ventas en Excel</button>
      </div>`, 5, 'copias'),
    Tarjeta('Registro y cierres', 'escudo', html`${(S.registro || []).length ? (S.registro || []).slice(-3).reverse().map(x => Dato(x.que, hace(x.t))) : html`<p class="sub" style="margin:4px 0 10px;line-height:1.45">Aquí queda anotado quién anula ventas, hace devoluciones o borra algo.</p>`}
      <div class="chips" style="margin-top:8px"><button type="button" class="btn2 chico toca" onClick=${() => abrir('registro')}>Ver todo y revisar firmas</button>${S.cierres.length > 0 && html`<button type="button" class="btn2 chico toca" onClick=${() => abrir('cierres')}>Cierres Z</button>`}</div>`, 6),
    Tarjeta('Empezar de nuevo', 'basura', html`<p class="sub" style="margin:4px 0 10px;line-height:1.45">Borra este negocio de este aparato para probar otro país o tipo. Antes se guarda una copia.</p><button type="button" class="btn2 chico rojo toca" onClick=${() => abrir('borrar')}>Empezar de nuevo</button>`, 6)
  ];
  // Tu perfil va primero; los ajustes del negocio solo con permiso. La apariencia es de cada quien.
  const perfil = Tarjeta('Tu perfil', 'personas', html`
    <div class="fila" style="gap:10px;padding:6px 0 10px"><span class=${'logo redondo ' + TONOS[S.perfiles.indexOf(yo) % 5]} style="width:40px;height:40px;font-size:14px">${iniciales(yo.n)}</span>
      <span class="crece" style="display:flex;flex-direction:column"><b style="font-size:15px">${yo.n}</b><span class="sub">${rol ? rol.n : ''} · ${yo.pin ? 'con PIN' : 'sin PIN'}</span></span></div>
    <div class="chips">
      <button type="button" class="btn2 chico toca" onClick=${() => abrir('perfil', { pid: yo.id })}><${Icono} n="lapiz" t=${14} />Editar perfil</button>
      <button type="button" class="btn2 chico toca" onClick=${() => abrir('pin', { pid: yo.id })}><${Icono} n="candado" t=${14} />${yo.pin ? 'Cambiar PIN' : 'Poner PIN'}</button>
      <button type="button" class="btn2 chico acento toca" onClick=${() => salir()}>Cambiar de perfil</button>
      ${puede('equipo') && tel && html`<button type="button" class="btn2 chico verde toca" onClick=${() => ir('equipo')}>Equipo y permisos</button>`}
    </div>`, 0, 'perfil');
  const ayuda = Tarjeta('Ayuda', 'lista', html`<p class="sub" style="margin:4px 0 10px;line-height:1.45">Un recorrido guiado por toda la app: qué hace cada parte y cómo se usa.</p>
    <button type="button" class="btn2 chico acento toca" onClick=${verRecorrido}>Ver el recorrido guiado</button>`, 1);
  const apariencia = tarjetas[6];
  const lista = [perfil, ayuda].concat(puede('ajustes') ? tarjetas : [apariencia]);
  return tel ? html`<div class="pila">${lista}</div>` : html`<div class="ajustes-pc">${lista}</div>`;
}

export function Mas() {
  const { S, D, tel, ir, abrir, puede } = useApp();
  if (!tel) return html`<${Ajustes} />`;
  const desde = inicioMes(), r = resumen(desde, Date.now() + 1, '');
  const gastos = gastosEntre(desde, Date.now() + 1).reduce((a, g) => a + g.v, 0);
  const real = r.ganancia - gastos;
  const b = BloqueGastos({ compacto: true });
  const mes = new Date().toLocaleDateString('es', { month: 'long' });
  return html`
    <h1 class="titulo entra">Más</h1>
    ${puede('ganancias') && html`<button type="button" class="tarjeta toca entra" style="border:0;text-align:left;color:var(--ink);background:linear-gradient(160deg, color-mix(in srgb, var(--c2) 22%, var(--surface)), var(--surface));display:flex;flex-direction:column;gap:10px" onClick=${() => ir('reportes')}>
      <span class="fila"><span class="sub crece">Ganancia real de ${mes}</span><span class="pildora t-vio">Ver reportes <${Icono} n="sig" t=${12} g=${2.6} /></span></span>
      <${Monto} v=${real} f=${D.m} clase="titulo" />
      <span class="rejilla-3 num" style="gap:8px">${[['Ventas', r.total], ['Costo', -r.costo], ['Gastos', -gastos]].map(k => html`<span style="display:flex;flex-direction:column;gap:1px;min-width:0"><span class="sub" style="font-size:11px">${k[0]}</span><b class="corta" style="font-size:13px">${D.m(k[1])}</b></span>`)}</span>
    </button>`}
    <div class="rejilla-2" data-tour="mas-acciones">
      ${puede('gastos') && html`<button type="button" class="btn2 rojo toca" style="min-height:52px" onClick=${() => abrir('gasto')}>Anotar gasto</button>`}
      ${puede('cierre') && html`<button type="button" class="btn2 acento toca" style="min-height:52px" onClick=${() => abrir('cierre')}>Cierre del día</button>`}
      ${puede('vender') && html`<button type="button" class="btn2 toca" style="min-height:52px" onClick=${() => abrir('caja')}><${Icono} n="billete" t=${16} />Caja y turnos</button>`}
      ${S.negocio.ordenes && puede('ordenes') && html`<button type="button" class="btn2 verde toca" style="min-height:52px" onClick=${() => ir('clientes')}><${Icono} n="personas" t=${16} />Clientes</button>`}
    </div>
    ${puede('gastos') && html`${b.PorPagar}${b.Mes}${b.Recientes}`}
    <h2 class="sub" style="font-size:13px;margin:6px 4px -4px">Ajustes</h2>
    <${Ajustes} />`;
}
