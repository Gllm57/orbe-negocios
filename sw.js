// Orbe Negocios · funciona sin internet. Guarda la app y responde desde la copia si no hay conexión.
const VERSION = 'orbe-negocios-v17';
const ARCHIVOS = ['./', 'index.html', 'manifest.webmanifest', 'css/orbe.css', 'icons/icono.svg', 'icons/icono-192.png',
  'js/lib/preact-htm.js', 'js/app.js', 'js/ctx.js', 'js/paises.js', 'js/datos.js', 'js/graficos.js', 'js/ui.js',
  'js/pantallas/inicio.js', 'js/pantallas/hoy.js', 'js/pantallas/vender.js', 'js/pantallas/clientes.js', 'js/pantallas/inventario.js',
  'js/pantallas/gastos.js', 'js/pantallas/reportes.js', 'js/pantallas/mas.js', 'js/pantallas/hojas.js',
  'js/permisos.js', 'js/pantallas/acceso.js', 'js/pantallas/equipo.js', 'js/pantallas/pagos.js', 'js/recorrido.js', 'js/hash.js', 'js/pantallas/tasas.js'];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(ARCHIVOS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const url = new URL(r.url);
  // Tasas: siempre de internet (la app guarda la última por su cuenta).
  if (/dolarapi|pydolarve/.test(url.host)) return;
  // La app: primero internet para tener lo último; si no hay, la copia guardada.
  e.respondWith(fetch(r).then(res => {
    if (res.ok && (url.origin === location.origin || /fonts\.(googleapis|gstatic)\.com/.test(url.host))) { const copia = res.clone(); caches.open(VERSION).then(c => c.put(r, copia)); }
    return res;
  }).catch(() => caches.match(r).then(x => x || caches.match('index.html'))));
});
