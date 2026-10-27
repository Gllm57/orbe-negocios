// Orbe Negocios · arranque. Decide si es teléfono o computadora, y arma la navegación.
import { html, render, useState, useEffect } from './lib/preact-htm.js';
import { Ctx } from './ctx.js';
import { useDatos, leer, guardarTasa, diaClave, bajoMinimo, deudores, porPagar } from './datos.js';
import { pais, tipo, dinero, leerTasaVE } from './paises.js';
import { Icono, LogoOrbe, Avisos, iniciales, avisar } from './ui.js';
import { Inicio } from './pantallas/inicio.js';
import { Hoy } from './pantallas/hoy.js';
import { Vender } from './pantallas/vender.js';
import { Clientes } from './pantallas/clientes.js';
import { Inventario } from './pantallas/inventario.js';
import { Gastos } from './pantallas/gastos.js';
import { Reportes } from './pantallas/reportes.js';
import { Mas } from './pantallas/mas.js';
import { HojaActual } from './pantallas/hojas.js';

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
  clientes: { n: 'Clientes', i: 'personas', C: Clientes },
  inventario: { n: 'Inventario', i: 'caja', C: Inventario },
  gastos: { n: 'Gastos y por pagar', i: 'dinero', C: Gastos },
  reportes: { n: 'Reportes', i: 'grafico', C: Reportes },
  mas: { n: 'Más', npc: 'Ajustes', i: 'mas', ipc: 'ajustes', C: Mas }
};

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
  // Tasa del día en Venezuela: una vez al día, si hay internet.
  useEffect(() => {
    if (S.negocio && S.negocio.pais === 'VE' && S.tasaFecha !== diaClave(Date.now())) leerTasaVE().then(v => { if (v) guardarTasa(v); });
  }, [S.negocio && S.negocio.pais]);

  if (!S.negocio) return html`<${Inicio} tel=${tel} /><${Avisos} />`;

  const P = pais(S.negocio.pais), T = tipo(S.negocio.tipo), D = dinero(P, S.tasaVE);
  // Varios locales: aparece el selector de sucursal y los gráficos por sucursal (sea negocio o empresa).
  const E = S.negocio.sucursales.length > 1;
  const valida = SECCIONES[sec] && !(sec === 'gastos' && tel) ? sec : 'hoy';
  const ir = s => { if (location.hash !== '#' + s) location.hash = s; else setSec(s); const p = document.querySelector('.principal') || document.querySelector('.app-fondo'); if (p) p.scrollTop = 0; };
  const abrir = (t, datos) => setHoja({ t, datos: datos || {}, n: Date.now() });
  const ctx = { S, P, T, D, E, tel, ir, abrir, suc: E ? suc : '', setSuc, enLinea };
  const nombreSec = s => s === 'vender' ? (tel ? T.vender : 'Caja') : s === 'inventario' && !T.inv ? 'Servicios' : tel ? SECCIONES[s].n : (SECCIONES[s].npc || SECCIONES[s].n);
  const Pantalla = SECCIONES[valida].C;
  const cuenta = { clientes: deudores().filter(c => c.deuda > 0).length, inventario: bajoMinimo().length, gastos: porPagar().length };

  if (tel) {
    const tabs = ['hoy', 'vender', 'clientes', 'inventario', 'mas'];
    return html`<${Ctx.Provider} value=${ctx}>
      <div class=${'tel-raiz' + (hoja ? ' con-hoja' : '')}>
        <div class="app-fondo">
          <main class="pantalla" key=${valida}><${Pantalla} /></main>
        </div>
        <nav class="nav-tel" aria-label="Secciones">
          ${tabs.map(t => html`<button type="button" class=${'toca' + (t === valida ? ' on' : '')} aria-current=${t === valida ? 'page' : 'false'} onClick=${() => ir(t)}>
            <${Icono} n=${t === 'inventario' && !T.inv ? 'lista' : SECCIONES[t].i} t=${22} /><span>${nombreSec(t)}</span></button>`)}
        </nav>
      </div>
      ${hoja && html`<${HojaActual} key=${hoja.n} hoja=${hoja} cerrar=${() => setHoja(null)} />`}
      <${Avisos} />
    </${Ctx.Provider}>`;
  }

  const grupos = [['Día a día', ['hoy', 'vender', 'clientes']], ['Operación', ['inventario', 'gastos']], ['Gestión', ['reportes', 'mas']]];
  const colores = { clientes: 'var(--c3)', inventario: 'var(--c3)', gastos: 'var(--c5)' };
  return html`<${Ctx.Provider} value=${ctx}>
    <div class="marco-pc">
      <aside class="lateral" aria-label="Menú">
        <div class="fila" style="gap:10px;padding:0 6px"><${LogoOrbe} t=${30} /><b style="font-size:16px;letter-spacing:-0.02em">Orbe Negocios</b></div>
        <div class="tarjeta fila" style="padding:12px;gap:10px">
          <span class="logo marca">${iniciales(S.negocio.nombre)}</span>
          <span class="crece" style="display:flex;flex-direction:column;gap:1px"><b class="corta" style="font-size:14px">${S.negocio.nombre}</b><span class="sub corta">${P.f} ${(S.negocio.escala === 'empresa' ? 'Empresa' : T.n) + (E ? ' · ' + S.negocio.sucursales.length + ' locales' : '')}</span></span>
        </div>
        <nav style="display:flex;flex-direction:column;gap:10px">
          ${grupos.map(g => html`<div class="grupo"><small>${g[0]}</small>
            ${g[1].map(s => html`<button type="button" class=${'nav-btn toca' + (s === valida ? ' on' : '')} aria-current=${s === valida ? 'page' : 'false'} onClick=${() => ir(s)}>
              <${Icono} n=${s === 'inventario' && !T.inv ? 'lista' : (SECCIONES[s].ipc || SECCIONES[s].i)} t=${18} />${nombreSec(s)}
              ${cuenta[s] ? html`<span class="cuenta" style=${{ background: colores[s] }}>${cuenta[s]}</span>` : null}
            </button>`)}</div>`)}
        </nav>
        <div style="margin-top:auto;display:flex;flex-direction:column;gap:8px">
          <span class="pildora" style=${{ background: enLinea ? 'var(--in-soft)' : 'var(--amber-soft)', color: enLinea ? 'var(--in-text)' : 'var(--amber-text)', padding: '9px 12px', borderRadius: '12px', justifyContent: 'flex-start' }}><span class="punto"></span>${enLinea ? 'En línea · todo guardado' : 'Sin internet · se guarda aquí'}</span>
        </div>
      </aside>
      <div class="principal">
        <div class="barra-sup">
          <div class="crece"><h1>${valida === 'hoy' ? saludo() : nombreSec(valida)}</h1><span class="sub">${subtitulo(valida, ctx)}</span></div>
          <label class="buscador"><${Icono} n="buscar" t=${16} c="var(--muted)" /><input type="search" aria-label="Buscar" placeholder="Buscar producto o cliente" onKeyDown=${e => { if (e.key === 'Enter' && e.target.value.trim()) { abrir('buscar', { q: e.target.value.trim() }); } }} /><span class="tecla">Enter</span></label>
          ${E && (valida === 'hoy' || valida === 'vender' || valida === 'reportes') && html`<div class="segmento" role="group" aria-label="Sucursal">${[''].concat(S.negocio.sucursales).map(x => html`<button type="button" class=${suc === x ? 'on' : ''} aria-pressed=${suc === x ? 'true' : 'false'} onClick=${() => setSuc(x)}>${x || 'Todas'}</button>`)}</div>`}
          ${valida !== 'vender' && html`<button type="button" class="btn2 lleno toca" onClick=${() => ir('vender')}><${Icono} n="mas1" t=${16} g=${2.4} />${T.vender === 'Pedido' ? 'Nuevo pedido' : T.vender === 'Cobrar' ? 'Cobrar' : 'Nueva venta'}</button>`}
        </div>
        <div class="contenido" key=${valida}><${Pantalla} /></div>
      </div>
    </div>
    ${hoja && html`<${HojaActual} key=${hoja.n} hoja=${hoja} cerrar=${() => setHoja(null)} />`}
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
    clientes: 'Quién te debe y su historial',
    inventario: T.inv ? 'Lo que tienes y lo que falta' : 'Precios y duración',
    gastos: 'Lo que gastas y lo que debes',
    reportes: donde,
    mas: S.negocio.nombre
  }[s];
}

render(html`<${App} />`, document.getElementById('app'));
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
