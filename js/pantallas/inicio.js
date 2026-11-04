// Primer uso: país, tipo de negocio, tamaño y datos. Al final se arma el negocio.
import { html, useState } from '../lib/preact-htm.js';
import { PAISES, TIPOS, pais } from '../paises.js';
import { crearNegocio, nombreSugerido } from '../datos.js';
import { Icono, LogoOrbe, Interruptor, avisar, Bandera } from '../ui.js';

const PASOS = ['pais', 'tipo', 'tam', 'datos', 'listo'];
const SUCS = [['Uno solo', 1], ['2', 2], ['3', 3], ['4', 4], ['5', 5]];
export const NOMBRES_SUC = ['Centro', 'Norte', 'Este', 'Oeste', 'Sur'];
const TONO = { vio: 't-vio', amb: 't-amb', ver: 't-ver', ros: 't-ros', azu: 't-azu' };

export function Inicio({ tel }) {
  const [paso, setPaso] = useState(-1);
  const [c, setC] = useState({ pais: '', tipo: '', escala: 'negocio', nombre: '', razon: '', fiscal: '', sucN: 1, sucNombres: [], dueno: '', pays: null, taxOn: null, taxIncl: true });
  const [ejemplo, setEjemplo] = useState(true);
  const P = pais(c.pais || 'VE');
  const pon = o => setC(x => Object.assign({}, x, o));
  const i = PASOS.indexOf(paso);
  const puede = paso === 'pais' ? !!c.pais : paso === 'tipo' ? !!c.tipo : true;
  const siguiente = () => {
    if (!puede) return;
    if (paso === 'listo') { crearNegocio(Object.assign({}, c, { nombre: c.nombre || nombreSugerido(c.tipo, c.escala) }), ejemplo); avisar(ejemplo ? 'Listo. Cargamos un mes de ventas de ejemplo' : '¡Bienvenido a Orbe Negocios!'); return; }
    setPaso(PASOS[i + 1]);
  };
  const atras = () => setPaso(i <= 0 ? -1 : PASOS[i - 1]);
  const pays = c.pays || P.pays;
  const taxOn = c.taxOn ?? P.tax[1] > 0;
  const E = c.escala === 'empresa';

  const marco = contenido => html`<div style=${tel ? '' : 'min-height:100vh;display:grid;place-items:center;padding:32px 16px'}>
    <div class=${tel ? '' : 'tarjeta'} style=${tel ? 'min-height:100dvh;display:flex;flex-direction:column' : 'width:min(520px,100%);height:min(820px,calc(100vh - 64px));padding:0;display:flex;flex-direction:column;overflow:hidden;border-radius:28px'}>${contenido}</div></div>`;

  if (paso === -1) return marco(html`<div class="entra" style="flex:1;display:flex;flex-direction:column;gap:16px;padding:calc(72px + var(--sa-top)) 26px calc(28px + var(--sa-bottom))">
    <span class="entra"><${LogoOrbe} t=${88} orbita /></span>
    <div style="display:flex;flex-direction:column;gap:8px;margin-top:6px"><h1 style="font-size:34px">Orbe Negocios</h1><span style="font-size:18px;color:var(--muted)">Tú vendes. Orbe hace lo repetitivo.</span></div>
    <div class="pila" style="margin-top:14px;gap:14px">
      ${[['carrito', 'Vende y cobra con las formas de pago de tu país', 't-vio'], ['grafico', 'Mira cuánto vendes y cuánto ganas de verdad', 't-ver'], ['wifi', 'Funciona sin internet, en el teléfono y en la computadora', 't-amb']].map((x, k) => html`
        <div class="fila entra" style=${{ '--i': 4 + k * 3 }}><span class=${'ic ' + x[2]}><${Icono} n=${x[0]} t=${19} /></span><span style="font-size:15px;line-height:1.35">${x[1]}</span></div>`)}
    </div>
    <div style="margin-top:auto;display:flex;flex-direction:column;gap:10px">
      <button type="button" class="btn toca" onClick=${() => setPaso('pais')}>Empezar</button>
      <span class="sub" style="text-align:center">14 días gratis, sin tarjeta. Nunca se borra nada.</span>
    </div>
  </div>`);

  const titulos = {
    pais: ['¿Dónde está tu negocio?', 'Así ponemos tu moneda, las formas de pago de tu país y tus impuestos.'],
    tipo: ['¿Qué tipo de negocio tienes?', 'Orbe muestra solo lo que te sirve. Lo demás lo activas cuando quieras.'],
    tam: ['¿De qué tamaño es?', 'Si es una empresa, tus recibos llevan razón social y número fiscal.'],
    datos: [E ? 'Tu empresa' : 'Tu negocio', 'Ya lo llenamos según ' + P.n + '. Cambia lo que quieras.'],
    listo: ['Tu Orbe está listo', 'Armado para ' + (TIPOS.find(t => t.id === c.tipo) || TIPOS[0]).n.toLowerCase() + ' en ' + P.n + '.']
  }[paso];

  let cuerpo;
  if (paso === 'pais') cuerpo = html`<div class="pila" style="gap:8px">${PAISES.map((p, k) => { const on = c.pais === p.id; return html`
    <button type="button" key=${p.id} class=${'chip toca' + (on ? ' on' : '')} aria-pressed=${on ? 'true' : 'false'} onClick=${() => pon({ pais: p.id, pays: null, taxOn: null })} style="min-height:58px;border-radius:18px;justify-content:flex-start;gap:12px;color:var(--ink);background:${on ? '' : 'var(--surface)'}">
      <${Bandera} id=${p.id} t=${30} />
      <span style="flex:1;display:flex;flex-direction:column;text-align:left;gap:1px"><b style="font-size:15px">${p.n}</b><span class="sub" style="font-weight:500">${p.id === 'VE' ? 'Dólares y bolívares, con la tasa BCV' : p.usd2 ? p.cur.charAt(0).toUpperCase() + p.cur.slice(1) + ' y dólares' : p.cur.charAt(0).toUpperCase() + p.cur.slice(1) + ' · ' + p.pays.slice(0, 2).join(', ')}</span></span>
      ${on && html`<span style="width:24px;height:24px;border-radius:12px;background:var(--accent);display:grid;place-items:center;animation:pop .4s var(--spring)"><${Icono} n="check" t=${14} g=${3} c="#0b0a14" /></span>`}
    </button>`; })}</div>`;
  if (paso === 'tipo') cuerpo = html`<div class="pila" style="gap:10px">${TIPOS.map((t, k) => { const on = c.tipo === t.id; return html`
    <button type="button" key=${t.id} class=${'chip toca entra' + (on ? ' on' : '')} style=${{ '--i': k * 2, minHeight: '76px', borderRadius: '22px', justifyContent: 'flex-start', gap: '14px', color: 'var(--ink)', padding: '14px', background: on ? '' : 'var(--surface)' }} aria-pressed=${on ? 'true' : 'false'} onClick=${() => pon({ tipo: t.id })}>
      <span class=${'ic ' + TONO[t.color]} style="width:46px;height:46px;border-radius:14px"><${Icono} n=${t.id} t=${22} /></span>
      <span style="flex:1;display:flex;flex-direction:column;gap:3px;text-align:left"><b style="font-size:16px">${t.n}</b><span class="sub" style="font-weight:500">${t.ex}</span></span>
    </button>`; })}</div>`;
  if (paso === 'tam') cuerpo = html`<div class="pila">${[['negocio', 'Negocio', 'Hasta 10 personas, uno o dos locales', 'tienda', 't-vio', ['Vender, clientes, gastos y cierre del día', 'Dueño y algunos empleados']], ['empresa', 'Empresa', 'Varias sucursales o un equipo grande', 'edificio', 't-ver', ['Razón social y número fiscal en tus recibos', 'Ventas y caja por sucursal', 'Reportes por sucursal']]].map((z, k) => { const on = c.escala === z[0]; return html`
    <button type="button" key=${z[0]} class=${'chip toca entra' + (on ? ' on' : '')} style=${{ '--i': k * 3, flexDirection: 'column', alignItems: 'stretch', gap: '14px', borderRadius: '22px', padding: '16px', color: 'var(--ink)', background: on ? '' : 'var(--surface)' }} aria-pressed=${on ? 'true' : 'false'} onClick=${() => pon({ escala: z[0], sucN: z[0] === 'empresa' ? Math.max(2, c.sucN) : c.sucN })}>
      <span class="fila"><span class=${'ic ' + z[4]} style="width:46px;height:46px;border-radius:14px"><${Icono} n=${z[3]} t=${22} /></span><span style="flex:1;display:flex;flex-direction:column;gap:3px;text-align:left"><b style="font-size:17px">${z[1]}</b><span class="sub" style="font-weight:500">${z[2]}</span></span></span>
      <span class="pila" style="gap:8px;padding-left:4px">${z[5].map(f => html`<span class="fila" style="gap:10px;font-size:13px;font-weight:500"><${Icono} n="check" t=${14} g=${3} c="var(--in)" />${f}</span>`)}</span>
    </button>`; })}</div>`;
  if (paso === 'datos') cuerpo = html`<div class="pila" style="gap:18px">
    <label class="campo"><span>Tu nombre (serás el dueño)</span><input type="text" value=${c.dueno} placeholder="Ej.: Ana Ruiz" onInput=${e => pon({ dueno: e.target.value })} autocomplete="name" /></label>
    <label class="campo"><span>${E ? 'Nombre comercial' : 'Nombre del negocio'}</span><input type="text" value=${c.nombre} placeholder=${nombreSugerido(c.tipo, c.escala)} onInput=${e => pon({ nombre: e.target.value })} autocomplete="organization" /></label>
    ${E && html`<div class="pila entra" style="gap:18px">
      <label class="campo"><span>Razón social</span><input type="text" value=${c.razon} placeholder=${(c.nombre || nombreSugerido(c.tipo, c.escala)) + ' ' + (P.suf || 'S.A.')} onInput=${e => pon({ razon: e.target.value })} /></label>
      <label class="campo"><span>${P.fiscal[0]} (sale en tus recibos)</span><input type="text" value=${c.fiscal} placeholder=${P.fiscal[1] || 'Tu número fiscal'} onInput=${e => pon({ fiscal: e.target.value })} /></label>
    </div>`}
    <div class="campo"><span>${E ? '¿Cuántas sucursales tienes?' : '¿Cuántos locales tienes?'}</span>
      <div class="chips">${SUCS.map(s => html`<button type="button" class=${'chip toca' + (c.sucN === s[1] ? ' on' : '')} aria-pressed=${c.sucN === s[1] ? 'true' : 'false'} onClick=${() => pon({ sucN: s[1] })}>${s[1] === 1 && c.escala === 'empresa' ? 'Una sola' : s[0]}</button>`)}</div>
      <span class="sub faint">${c.sucN === 1 ? 'Si abres otro, lo agregas en Ajustes y Orbe separa las ventas y la caja de cada uno.' : 'Cada uno tendrá su caja, sus ventas y su inventario. Ponles nombre:'}</span>
      ${c.sucN > 1 && html`<div class="rejilla-2 entra" style="gap:8px">${Array.from({ length: c.sucN }, (_, k) => html`<label class="campo" key=${k}><span class="sr">Nombre del local ${k + 1}</span><input type="text" value=${c.sucNombres[k] || ''} placeholder=${NOMBRES_SUC[k]} onInput=${e => { const ns = c.sucNombres.slice(); ns[k] = e.target.value; pon({ sucNombres: ns }); }} /></label>`)}</div>`}
    </div>
    <div class="tarjeta fila"><${Bandera} id=${P.id} t=${34} /><span class="crece" style="display:flex;flex-direction:column;gap:2px"><b style="font-size:14px">Moneda</b><span class="sub">${P.id === 'VE' ? 'Precios en dólares y su valor en bolívares con la tasa BCV del día' : P.usd2 ? 'Precios en ' + P.cur + ' y su valor en dólares' : 'Todo en ' + P.cur + '.'}</span></span></div>
    <div class="campo"><span>Formas de pago que aceptas · ${pays.length} activas</span>
      <div class="chips">${P.pays.map(n => { const on = pays.includes(n); return html`<button type="button" class=${'chip toca' + (on ? ' on' : '')} aria-pressed=${on ? 'true' : 'false'} onClick=${() => pon({ pays: on ? (pays.length > 1 ? pays.filter(x => x !== n) : pays) : P.pays.filter(x => x === n || pays.includes(x)) })}>${on && html`<${Icono} n="check" t=${14} g=${3} c="var(--accent)" />`}${n}</button>`; })}</div></div>
    <div class="tarjeta" style="padding:4px 16px 12px">
      <${Interruptor} on=${taxOn && P.tax[1] > 0} onCambio=${v => P.tax[1] ? pon({ taxOn: v }) : avisar('Pon el porcentaje en Ajustes')} titulo=${'Cobrar ' + P.tax[0] + (P.tax[1] ? ' ' + P.tax[1] + ' %' : '')} sub=${P.tax[1] ? 'Lo puedes cambiar o apagar cuando quieras' : 'Varía según tu zona'} />
      ${taxOn && P.tax[1] > 0 && html`<div class="segmento" style="width:100%;margin-top:4px">${[[true, 'En el precio'], [false, 'Aparte']].map(o => html`<button type="button" style="flex:1" class=${c.taxIncl === o[0] ? 'on' : ''} onClick=${() => pon({ taxIncl: o[0] })}>${o[1]}</button>`)}</div>`}
    </div>
  </div>`;
  if (paso === 'listo') cuerpo = html`<div class="pila">
    <span style="width:76px;height:76px;border-radius:50%;background:var(--in);display:grid;place-items:center;animation:pop .55s var(--spring) both"><${Icono} n="check" t=${36} g=${2.8} c="#0b0a14" /></span>
    <div class="tarjeta"><div class="tarjeta-tit"><span class="sub">Encendido para ti</span></div><div class="pila">
      ${[['carrito', 'Vender y cobrar con ' + pays.slice(0, 2).join(', ') + (pays.length > 2 ? ' y más' : '')], ['personas', 'Clientes y lo que te deben'], [(TIPOS.find(t => t.id === c.tipo) || {}).inv ? 'caja' : 'lista', (TIPOS.find(t => t.id === c.tipo) || {}).inv ? 'Inventario y stock mínimo' : 'Servicios con precio y duración'], ].concat([['orden', 'Órdenes de trabajo y pedidos, con anticipo y PDF por WhatsApp']], [['dinero', 'Gastos y cuentas por pagar'], ['grafico', 'Reportes con gráficos'], ['candado', 'Cierre del día'], ['escudo', 'Perfiles para tu equipo, con permisos'], ['guardar', 'Copias y modo sin conexión']]).map((m, k) => html`
        <div class="fila entra" style=${{ '--i': 4 + k * 2, gap: '12px' }}><span class="ic t-ver" style="width:32px;height:32px;border-radius:10px"><${Icono} n=${m[0]} t=${16} g=${2.2} /></span><b style="font-size:14px;font-weight:600;line-height:1.35;min-width:0">${m[1]}</b></div>`)}
    </div></div>
    <div class="tarjeta" style="padding:4px 16px"><${Interruptor} on=${ejemplo} onCambio=${setEjemplo} titulo="Llenar con un mes de ventas de ejemplo" sub="Para probar. Trae dos empleados de prueba: Carla (encargada, PIN 1111) y Luis (cajero, PIN 2222)." /></div>
  </div>`;

  return marco(html`
    <div class="fila" style="padding:calc(14px + var(--sa-top)) 14px 0;gap:10px">
      <button type="button" class="icono-btn toca" aria-label="Atrás" onClick=${atras}><${Icono} n="atras" /></button>
      <div style="flex:1;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px;padding-right:54px">${PASOS.map((_, k) => html`<span style=${{ height: '4px', borderRadius: '2px', background: k <= i ? 'var(--accent)' : 'var(--line)', transition: 'background-color .35s ease' }}></span>`)}</div>
    </div>
    <div class="entra" key=${paso} style="flex:1;min-height:0;display:flex;flex-direction:column">
      <div style="padding:20px 22px 12px;display:flex;flex-direction:column;gap:6px"><h1 style="font-size:26px">${titulos[0]}</h1><span style="font-size:15px;color:var(--muted);line-height:1.4">${titulos[1]}</span></div>
      <div style="flex:1;overflow-y:auto;padding:6px 18px 130px">${cuerpo}</div>
    </div>
    <div style=${{ position: tel ? 'fixed' : 'relative', left: 0, right: 0, bottom: 0, marginTop: tel ? 0 : '-110px', padding: '16px 18px calc(24px + var(--sa-bottom))', background: 'linear-gradient(to top, var(' + (tel ? '--bg' : '--surface') + ') 70%, transparent)' }}>
      <button type="button" class=${'btn toca' + (puede ? '' : ' apagado')} aria-disabled=${puede ? 'false' : 'true'} onClick=${siguiente}>${paso === 'listo' ? (E ? 'Abrir mi empresa' : 'Abrir mi negocio') : 'Continuar'}</button>
    </div>`);
}
