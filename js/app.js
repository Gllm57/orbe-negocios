// Orbe Negocios · arranque. Decide si es teléfono o computadora, y arma la navegación.
import { html, render, useState, useEffect } from './lib/preact-htm.js';
import { Ctx } from './ctx.js';
import { iniciarDatos, useDatos, leer, guardarTasa, guardarTasaExtra, tasaEuro, diaClave, bajoMinimo, deudores, porPagar, perfilActual, salir, guardarPerfil, ordenAtrasada } from './datos.js';
import { Recorrido } from './recorrido.js';
import { ChipTasa } from './pantallas/tasas.js';
import { puede, rolDe } from './permisos.js';
import { pais, tipo, dinero, leerTasa } from './paises.js';
import { Icono, LogoOrbe, Avisos, iniciales, avisar, TONOS, Bandera, MarcaNegocio } from './ui.js';
import { Inicio } from './pantallas/inicio.js';
import { Hoy } from './pantallas/hoy.js';
import { Ordenes } from './pantallas/ordenes.js';
import { BotonOrbe } from './pantallas/menuorbe.js';
import { Vender } from './pantallas/vender.js';
import { Clientes } from './pantallas/clientes.js';
import { Inventario } from './pantallas/inventario.js';
import { Gastos } from './pantallas/gastos.js';
import { Reportes } from './pantallas/reportes.js';
import { Mas } from './pantallas/mas.js';
import { HojaActual } from './pantallas/hojas.js';
import { Equipo } from './pantallas/equipo.js';
import { Acceso } from './pantallas/acceso.js';

const esTelefono = () => {
  const q = new URLSearchParams(location.search).get('vista');
  if (q === 'telefono') return true;
  if (q === 'pc') return false;
  const movil = /Android.+Mobile|iPhone|iPod|Windows Phone/i.test(navigator.userAgent);
  return movil || window.innerWidth < 900;
};

const SECCIONES = {
  hoy: { n: 'Hoy', npc: 'Panel', i: 'inicio', C: Hoy },
  vender: { n: 'Vender', npc: 'Caja', i: 'carrito', C: Vender },
  ordenes: { n: 'Órdenes', i: 'orden', C: Ordenes },
  clientes: { n: 'Clientes', i: 'personas', C: Clientes },
  inventario: { n: 'Inventario', i: 'caja', C: Inventario },
  gastos: { n: 'Gastos y por pagar', i: 'dinero', C: Gastos },
  reportes: { n: 'Reportes', i: 'grafico', C: Reportes },
  equipo: { n: 'Equipo', npc: 'Equipo y permisos', i: 'escudo', C: Equipo },
  mas: { n: 'Más', npc: 'Ajustes', i: 'mas', ipc: 'ajustes', C: Mas }
};
// Secciones que necesitan un permiso para verse.
const PERMISO_SEC = { vender: 'vender', gastos: 'gastos', reportes: 'ganancias', equipo: 'equipo', ordenes: 'ordenes' };

function aplicarTema(tema) {
  const r = document.documentElement;
  if (tema === 'claro') r.setAttribute('data-theme', 'light');
  else if (tema === 'oscuro') r.setAttribute('data-theme', 'dark');
  else r.removeAttribute('data-theme');
  const oscuro = tema === 'oscuro' || (tema !== 'claro' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.querySelector('meta[name=theme-color]').setAttribute('content', oscuro ? '#0b0a14' : '#f4f3fb');
}

function App() {
  const S = useDatos();
  const [tel, setTel] = useState(esTelefono());
  const [sec, setSec] = useState((location.hash || '#hoy').slice(1));
  const [hoja, setHoja] = useState(null);
  const [suc, setSuc] = useState('');
  const [enLinea, setEnLinea] = useState(navigator.onLine);
  const [tour, setTour] = useState(false);

  useEffect(() => {
    const r = () => setTel(esTelefono());
    const h = () => { setSec((location.hash || '#hoy').slice(1)); setHoja(null); };
    const on = () => { setEnLinea(true); avisar('Conectado otra vez'); }, off = () => { setEnLinea(false); avisar('Sin internet: todo se guarda aquí'); };
    window.addEventListener('resize', r); window.addEventListener('hashchange', h);
    window.addEventListener('online', on); window.addEventListener('offline', off);
    return () => { window.removeEventListener('resize', r); window.removeEventListener('hashchange', h); window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);
  useEffect(() => { document.documentElement.classList.toggle('pc', !tel); document.documentElement.classList.toggle('tel', tel); }, [tel]);
  useEffect(() => { aplicarTema(S.ajustes.tema); }, [S.ajustes.tema]);
  // Tasa del día (Venezuela y Argentina): si es automática, una vez al día y cuando vuelve el internet.
  const pid = S.negocio && S.negocio.pais;
  useEffect(() => {
    if ((pid === 'VE' || pid === 'AR') && S.tasa.modo !== 'manual' && enLinea && S.tasa.fecha !== diaClave(Date.now())) leerTasa(pid, S.tasa.fuente).then(v => { if (v) guardarTasa({ valor: v }, dinero(pais(pid)).bonito); });
  }, [pid, S.tasa.modo, S.tasa.fuente, enLinea]);
  // Tasa del euro: una vez al día si el negocio acepta euros y no la escribió a mano.
  const te = S.tasas && S.tasas.euro;
  useEffect(() => {
    if ((pid === 'VE' || pid === 'AR') && S.negocio.euro && enLinea && !(te && te.modo === 'manual') && !(te && te.fecha === diaClave(Date.now()))) leerTasa(pid, 'euro').then(v => { if (v) guardarTasaExtra('euro', { valor: v, modo: 'auto' }); });
  }, [pid, S.negocio && S.negocio.euro, enLinea, te && te.modo]);

  if (!S.negocio) return html`<${Inicio} tel=${tel} /><${Avisos} />`;
  const yo = perfilActual();
  if (!yo) return html`<${Acceso} tel=${tel} /><${Avisos} />`;
  const pd = k => puede(S, yo, k);
  const permitida = s => SECCIONES[s] && (!PERMISO_SEC[s] || pd(PERMISO_SEC[s]));

  const P = pais(S.negocio.pais), T = tipo(S.negocio.tipo), D = dinero(P, S.tasa.valor, S.negocio.euro ? tasaEuro() : 0);
  // Varios locales: aparece el selector de sucursal y los gráficos por sucursal (sea negocio o empresa).
  const E = S.negocio.sucursales.length > 1;
  const valida = permitida(sec) && !(sec === 'gastos' && tel) ? sec : 'hoy';
  const ir = s => { if (location.hash !== '#' + s) location.hash = s; else setSec(s); const p = document.querySelector('.principal') || document.querySelector('.app-fondo'); if (p) p.scrollTop = 0; };
  const abrir = (t, datos) => setHoja({ t, datos: datos || {}, n: Date.now() });
  // Solo para las pruebas automáticas (con «?prueba» en la dirección): abrir una hoja directamente.
  if (/[?&]prueba\b/.test(location.search)) window.__abrir = abrir;
  const marcarTour = v => guardarPerfil({ id: yo.id, tour: v });
  const ctx = { S, P, T, D, E, tel, ir, abrir, suc: E ? suc : '', setSuc, enLinea, yo, rol: rolDe(S, yo), puede: pd, ver: permitida,
    verRecorrido: () => { setHoja(null); setTour(true); }, omitirRecorrido: () => { marcarTour('omitido'); avisar('Lo encuentras en Ajustes → Ayuda'); } };
  const Tour = tour ? html`<${Recorrido} onFin=${() => { setTour(false); if (!yo.tour) marcarTour(Date.now()); }} />` : null;
  const nombreSec = s => s === 'vender' ? (tel ? T.vender : 'Caja') : s === 'inventario' && !T.inv ? 'Servicios' : tel ? SECCIONES[s].n : (SECCIONES[s].npc || SECCIONES[s].n);
  const Pantalla = SECCIONES[valida].C;
  const cuenta = { clientes: deudores().filter(c => c.deuda > 0).length, inventario: bajoMinimo().length, gastos: porPagar().length, ordenes: S.ordenes.filter(o => ordenAtrasada(o)).length };

  if (tel) {
    // Barra de abajo: cuatro secciones y, en el centro, el botón Orbe con lo demás (crear y otras secciones).
    const tabs = ['hoy', 'vender', 'inventario', 'mas'].filter(permitida);
    const mitad = Math.ceil(tabs.length / 2);
    const Tab = t => html`<button type="button" key=${t} class=${'toca' + (t === valida ? ' on' : '')} aria-current=${t === valida ? 'page' : 'false'} onClick=${() => ir(t)}>
            <${Icono} n=${t === 'inventario' && !T.inv ? 'lista' : SECCIONES[t].i} t=${22} /><span>${nombreSec(t)}</span></button>`;
    return html`<${Ctx.Provider} value=${ctx}>
      <div class=${'tel-raiz' + (hoja ? ' con-hoja' : '')}>
        <div class="app-fondo">
          <main class="pantalla" key=${valida}><${Pantalla} /></main>
        </div>
        <nav class="nav-tel" aria-label="Secciones" style=${{ gridTemplateColumns: 'repeat(' + (tabs.length + 1) + ', minmax(0, 1fr))' }}>
          ${tabs.slice(0, mitad).map(Tab)}<span class="nav-hueco" aria-hidden="true"></span>${tabs.slice(mitad).map(Tab)}
        </nav>
        <${BotonOrbe} seccion=${valida} />
      </div>
      ${hoja && html`<${HojaActual} key=${hoja.n} hoja=${hoja} cerrar=${() => setHoja(null)} />`}
      ${Tour}
      <${Avisos} />
    </${Ctx.Provider}>`;
  }

  const grupos = [['Día a día', ['hoy', 'vender', 'ordenes', 'clientes']], ['Operación', ['inventario', 'gastos']], ['Gestión', ['reportes', 'equipo', 'mas']]].map(g => [g[0], g[1].filter(permitida)]).filter(g => g[1].length);
  const colores = { clientes: 'var(--c3)', inventario: 'var(--c3)', gastos: 'var(--c5)', ordenes: 'var(--c5)' };
  return html`<${Ctx.Provider} value=${ctx}>
    <div class="marco-pc">
      <aside class="lateral" aria-label="Menú">
        <div class="fila" style="gap:10px;padding:0 6px"><${LogoOrbe} t=${30} /><b style="font-size:16px;letter-spacing:-0.02em">Orbe Negocios</b></div>
        <button type="button" class="tarjeta fila cab-negocio toca" style="padding:12px;gap:10px" title=${pd('ajustes') ? 'Editar los datos y el logo' : ''} onClick=${() => pd('ajustes') ? abrir('negocio') : avisar('Solo quien puede cambiar los ajustes edita los datos del negocio')}>
          <${MarcaNegocio} n=${S.negocio} lapiz=${pd('ajustes')} />
          <span class="crece" style="display:flex;flex-direction:column;gap:1px"><b class="corta" style="font-size:14px">${S.negocio.nombre}</b><span class="sub corta fila" style="gap:5px"><${Bandera} id=${P.id} t=${14} />${(S.negocio.escala === 'empresa' ? 'Empresa' : T.n) + (E ? ' · ' + S.negocio.sucursales.length + ' locales' : '')}</span></span>
        </button>
        <nav style="display:flex;flex-direction:column;gap:10px">
          ${grupos.map(g => html`<div class="grupo"><small>${g[0]}</small>
            ${g[1].map(s => html`<button type="button" class=${'nav-btn toca' + (s === valida ? ' on' : '')} aria-current=${s === valida ? 'page' : 'false'} onClick=${() => ir(s)}>
              <${Icono} n=${s === 'inventario' && !T.inv ? 'lista' : (SECCIONES[s].ipc || SECCIONES[s].i)} t=${18} />${nombreSec(s)}
              ${cuenta[s] ? html`<span class="cuenta" style=${{ background: colores[s] }}>${cuenta[s]}</span>` : null}
            </button>`)}</div>`)}
        </nav>
        <div style="margin-top:auto;display:flex;flex-direction:column;gap:8px">
          <div class="tarjeta fila" data-tour="usuario" style="padding:10px 12px;gap:10px">
            <span class=${'logo redondo ' + TONOS[S.perfiles.indexOf(yo) % 5]} style="width:34px;height:34px;font-size:12px">${iniciales(yo.n)}</span>
            <span class="crece" style="display:flex;flex-direction:column"><b class="corta" style="font-size:13px">${yo.n}</b><span class="sub corta" style="font-size:12px">${(rolDe(S, yo) || {}).n || ''}</span></span>
            <button type="button" class="icono-btn chico toca" aria-label="Cambiar de perfil" title="Cambiar de perfil" onClick=${() => salir()}><${Icono} n="personas" t=${16} /></button>
          </div>
          <span class="pildora" style=${{ background: enLinea ? 'var(--in-soft)' : 'var(--amber-soft)', color: enLinea ? 'var(--in-text)' : 'var(--amber-text)', padding: '9px 12px', borderRadius: '12px', justifyContent: 'flex-start' }}><span class="punto"></span>${enLinea ? 'En línea · todo guardado' : 'Sin internet · se guarda aquí'}</span>
        </div>
      </aside>
      <div class="principal">
        <div class="barra-sup">
          <div class="crece"><h1>${valida === 'hoy' ? saludo() : nombreSec(valida)}</h1><span class="sub">${subtitulo(valida, ctx)}</span></div>
          <${ChipTasa} />
          <label class="buscador"><${Icono} n="buscar" t=${16} c="var(--muted)" /><input type="search" aria-label="Buscar" placeholder="Buscar producto o cliente" onKeyDown=${e => { if (e.key === 'Enter' && e.target.value.trim()) { abrir('buscar', { q: e.target.value.trim() }); } }} /><span class="tecla">Enter</span></label>
          ${E && (valida === 'hoy' || valida === 'vender' || valida === 'reportes') && html`<div class="segmento" role="group" aria-label="Sucursal">${[''].concat(S.negocio.sucursales).map(x => html`<button type="button" class=${suc === x ? 'on' : ''} aria-pressed=${suc === x ? 'true' : 'false'} onClick=${() => setSuc(x)}>${x || 'Todas'}</button>`)}</div>`}
          ${valida !== 'vender' && pd('vender') && html`<button type="button" class="btn2 lleno toca" onClick=${() => ir('vender')}><${Icono} n="mas1" t=${16} g=${2.4} />${T.vender === 'Pedido' ? 'Nuevo pedido' : T.vender === 'Cobrar' ? 'Cobrar' : 'Nueva venta'}</button>`}
        </div>
        <div class="contenido" key=${valida}><${Pantalla} /></div>
      </div>
    </div>
    ${hoja && html`<${HojaActual} key=${hoja.n} hoja=${hoja} cerrar=${() => setHoja(null)} />`}
    ${Tour}
    <${Avisos} />
  </${Ctx.Provider}>`;
}

function saludo() { const h = new Date().getHours(); return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches'; }
function subtitulo(s, { S, E, suc, T }) {
  const f = new Date().toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' });
  const donde = E ? (suc ? 'Sucursal ' + suc : 'Todas las sucursales') : S.negocio.nombre;
  return {
    hoy: f.charAt(0).toUpperCase() + f.slice(1) + ' · ' + donde,
    vender: 'Escanea o toca los productos · F12 para cobrar',
    ordenes: 'Recibe, sigue y entrega trabajos y pedidos · arrastra las tarjetas para cambiar el estado',
    clientes: 'Quién te debe y su historial',
    inventario: T.inv ? 'Lo que tienes y lo que falta' : 'Precios y duración',
    gastos: 'Lo que gastas y lo que debes',
    reportes: donde,
    equipo: 'Perfiles de tu equipo y lo que cada uno puede hacer',
    mas: S.negocio.nombre
  }[s];
}

// Primero se leen los datos guardados; después se dibuja y se va la pantalla de carga.
iniciarDatos().then(() => {
  render(html`<${App} />`, document.getElementById('app'));
  requestAnimationFrame(() => { if (window.__listo) window.__listo(); });
});
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
