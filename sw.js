// Orbe Negocios · funciona sin internet. Guarda la app y responde desde la copia si no hay conexión.
const VERSION = 'orbe-negocios-v33';
const ARCHIVOS = ['./', 'index.html', 'manifest.webmanifest', 'css/orbe.css', 'icons/icono.svg', 'icons/icono-192.png',
  'js/lib/preact-htm.js', 'js/app.js', 'js/ctx.js', 'js/paises.js', 'js/datos.js', 'js/graficos.js', 'js/ui.js',
  'js/pantallas/inicio.js', 'js/pantallas/hoy.js', 'js/pantallas/vender.js', 'js/pantallas/clientes.js', 'js/pantallas/inventario.js',
  'js/pantallas/gastos.js', 'js/pantallas/reportes.js', 'js/pantallas/mas.js', 'js/pantallas/hojas.js',
  'js/permisos.js', 'js/pantallas/acceso.js', 'js/pantallas/equipo.js', 'js/pantallas/pagos.js', 'js/recorrido.js', 'js/hash.js', 'js/pantallas/tasas.js', 'js/buscar.js', 'js/pantallas/grupos.js', 'js/pantallas/escaner.js', 'js/lib/zxing.min.js', 'js/pantallas/ordenes.js', 'js/ordenpdf.js', 'js/pantallas/precios.js', 'js/pantallas/caja.js', 'js/impresora.js', 'js/carrito.js', 'js/pantallas/lineas.js', 'js/pantallas/promos.js', 'js/pantallas/factura.js', 'js/pantallas/menuorbe.js', 'js/lib/jspdf.umd.min.js', 'icons/icono-512.png', 'icons/icono-maskable-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(ARCHIVOS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const url = new URL(r.url);
  // Tasas: siempre de internet (la app guarda la última por su cuenta).
  if (/dolarapi|pydolarve/.test(url.host)) return;
  // La app: primero internet para tener lo último; si no hay, la copia guardada.
  // Con internet lento (o que no responde) no se espera más de 3 segundos: se abre la copia y lo nuevo queda para la próxima.
  const red = fetch(r).then(res => {
    if (res.ok && (url.origin === location.origin || /fonts\.(googleapis|gstatic)\.com/.test(url.host))) { const copia = res.clone(); caches.open(VERSION).then(c => c.put(r, copia)); }
    return res;
  });
  e.respondWith(caches.match(r).then(guardada => guardada
    ? Promise.race([red.catch(() => guardada), new Promise(ok => setTimeout(() => ok(guardada), 3000))])
    : red.catch(() => caches.match('index.html'))));
  e.waitUntil(red.then(() => {}, () => {}));
});
