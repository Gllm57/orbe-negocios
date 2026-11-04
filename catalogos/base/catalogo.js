// Orbe Apps · catálogo con pedidos por WhatsApp.
// Lee los datos del negocio de window.NEGOCIO (negocio.js) y los productos de su hoja de Google publicada como CSV,
// o del archivo productos.csv de su carpeta si todavía no tiene hoja.
(() => {
  const N = window.NEGOCIO;
  const $ = s => document.querySelector(s);
  const llave = 'orbe-catalogo-' + (N.id || N.nombre);
  const guardar = () => { try { localStorage.setItem(llave, JSON.stringify(pedido)); } catch {} };
  let productos = [], filtro = 'Todos', busqueda = '';
  let pedido = (() => { try { return JSON.parse(localStorage.getItem(llave)) || {}; } catch { return {}; } })();
  pedido.items ||= {}; pedido.entrega ||= N.entrega?.domicilio ? 'domicilio' : 'retiro';

  document.documentElement.style.setProperty('--marca', N.color || '#c2335a');
  document.title = N.nombre + ' · Catálogo';

  const el = (tag, attrs = {}, ...hijos) => {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === 'text') e.textContent = v;
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
      else e.setAttribute(k, v === true ? '' : v);
    }
    hijos.flat().forEach(h => h != null && e.append(h));
    return e;
  };
  const dinero = n => (N.moneda?.simbolo ?? '$') + Number(n).toLocaleString('es', { minimumFractionDigits: N.moneda?.decimales ?? 0, maximumFractionDigits: N.moneda?.decimales ?? 0 });
  const sinTildes = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  const tonos = ['#f6c9d3', '#f9dfb9', '#d9d2f7', '#cfeadf', '#e8d3c4', '#d3e4f5', '#f3d6ec', '#e4ecc5'];
  const tono = s => tonos[[...s].reduce((a, c) => a + c.charCodeAt(0), 0) % tonos.length];

  // ---------- Datos ----------
  function leerCSV(texto) {
    const filas = []; let fila = [], celda = '', comillas = false;
    for (let i = 0; i < texto.length; i++) {
      const c = texto[i];
      if (comillas) {
        if (c === '"' && texto[i + 1] === '"') { celda += '"'; i++; }
        else if (c === '"') comillas = false;
        else celda += c;
      } else if (c === '"') comillas = true;
      else if (c === ',') { fila.push(celda); celda = ''; }
      else if (c === '\n' || c === '\r') {
        if (c === '\r' && texto[i + 1] === '\n') i++;
        fila.push(celda); filas.push(fila); fila = []; celda = '';
      } else celda += c;
    }
    if (celda || fila.length) { fila.push(celda); filas.push(fila); }
    return filas.filter(f => f.some(x => x.trim()));
  }
  // "28", "$28", "1.500", "1.500,50", "12.5" → número
  function numero(s) {
    let t = String(s || '').replace(/[^\d.,]/g, '');
    const ultimo = Math.max(t.lastIndexOf(','), t.lastIndexOf('.'));
    if (ultimo === -1) return Number(t) || 0;
    const decimales = t.length - ultimo - 1;
    if (decimales === 3 && !(t.includes(',') && t.includes('.'))) return Number(t.replace(/[.,]/g, '')) || 0;
    return Number(t.slice(0, ultimo).replace(/[.,]/g, '') + '.' + t.slice(ultimo + 1)) || 0;
  }
  // Enlace de Google Drive → imagen que se puede mostrar
  function foto(url) {
    const id = String(url || '').match(/(?:\/d\/|[?&]id=)([\w-]{20,})/)?.[1];
    return id ? `https://drive.google.com/thumbnail?id=${id}&sz=w600` : String(url || '').trim();
  }
  function aProductos(filas) {
    const cab = filas.shift().map(sinTildes);
    const col = nombre => cab.findIndex(c => c.startsWith(nombre));
    const c = { nombre: col('producto'), precio: col('precio'), cat: col('categoria'), desc: col('descripcion'), foto: col('foto'), hay: col('hay') };
    return filas.map((f, i) => ({
      id: 'p' + i + '-' + sinTildes(f[c.nombre]).replace(/\W+/g, '-'),
      nombre: (f[c.nombre] || '').trim(),
      precio: numero(f[c.precio]),
      categoria: (f[c.cat] || '').trim() || 'Otros',
      descripcion: (f[c.desc] || '').trim(),
      foto: c.foto >= 0 ? foto(f[c.foto]) : '',
      agotado: c.hay >= 0 && /^(no|agotado|0|false)$/.test(sinTildes(f[c.hay])),
    })).filter(p => p.nombre);
  }
  async function cargar() {
    const fuentes = [N.hoja, N.productos || 'productos.csv'].filter(Boolean);
    for (const url of fuentes) {
      try {
        const r = await fetch(url, { cache: 'no-store' });
        if (!r.ok) throw new Error(r.status);
        const lista = aProductos(leerCSV(await r.text()));
        if (lista.length) return lista;
      } catch (e) { console.warn('No se pudo leer', url, e); }
    }
    return [];
  }

  // ---------- Vista del catálogo ----------
  function cabecera() {
    const logo = N.logo ? el('img', { src: N.logo, alt: '' }) : (N.iniciales || N.nombre.slice(0, 2).toUpperCase());
    $('#cabecera').replaceChildren(el('div', { class: 'envoltura' },
      el('div', { class: 'logo' }, logo),
      el('div', {},
        el('h1', { text: N.nombre }),
        el('p', { text: [N.rubro, N.ciudad].filter(Boolean).join(' · ') }),
        N.horario ? el('span', { class: 'estado', text: N.horario }) : null)));
    $('#aviso').hidden = !N.aviso; $('#aviso').textContent = N.aviso || '';
    $('#pie').replaceChildren('Catálogo hecho por ', el('a', { href: 'https://orbe7apps.github.io/orbe-negocios/servicios/', target: '_blank', rel: 'noopener', text: 'Orbe Apps' }));
  }
  function categorias() {
    const cats = ['Todos', ...new Set(productos.map(p => p.categoria))];
    $('#cats').replaceChildren(...cats.map(c => el('button', { class: 'cat', 'aria-pressed': String(c === filtro), text: c, onclick: () => { filtro = c; pintar(); } })));
  }
  function botonCantidad(p) {
    const n = pedido.items[p.id] || 0;
    if (p.agotado) return el('span', { class: 'sin', text: 'Agotado' });
    if (!n) return el('button', { class: 'agregar', text: 'Agregar', 'aria-label': 'Agregar ' + p.nombre, onclick: () => cambiar(p.id, 1) });
    return el('div', { class: 'contador' },
      el('button', { 'aria-label': 'Quitar uno de ' + p.nombre, text: '−', onclick: () => cambiar(p.id, -1) }),
      el('b', { text: n }),
      el('button', { 'aria-label': 'Agregar otro ' + p.nombre, text: '+', onclick: () => cambiar(p.id, 1) }));
  }
  function miniatura(p, tam) {
    return el('div', { class: 'foto', style: `background:${tono(p.nombre)};${tam ? `width:${tam}px;height:${tam}px;font-size:${tam / 3}px` : ''}` },
      p.foto ? el('img', { src: p.foto, alt: '', loading: 'lazy', onerror: e => e.target.remove() }) : p.nombre[0]);
  }
  function tarjeta(p) {
    return el('article', { class: 'prod' + (p.agotado ? ' agotado' : '') },
      miniatura(p),
      el('div', { class: 'info' },
        el('b', { text: p.nombre }),
        p.descripcion ? el('span', { text: p.descripcion }) : null,
        el('div', { class: 'precio', text: dinero(p.precio) })),
      botonCantidad(p));
  }
  function pintar() {
    categorias();
    const q = sinTildes(busqueda);
    const vis = productos.filter(p => (filtro === 'Todos' || p.categoria === filtro) && (!q || sinTildes(p.nombre + ' ' + p.descripcion).includes(q)));
    const grupos = {};
    vis.forEach(p => (grupos[p.categoria] ||= []).push(p));
    const cont = $('#productos');
    if (!productos.length) cont.replaceChildren(el('p', { class: 'vacio', text: 'Cargando productos…' }));
    else if (!vis.length) cont.replaceChildren(el('p', { class: 'vacio', text: 'No encontramos productos con esa búsqueda.' }));
    else cont.replaceChildren(...Object.entries(grupos).map(([cat, ps]) =>
      el('section', { class: 'seccion' }, el('h2', { text: cat }), el('div', { class: 'lista' }, ps.map(tarjeta)))));
    flotante();
  }
  function lineas() {
    return Object.entries(pedido.items).map(([id, n]) => ({ p: productos.find(x => x.id === id), n })).filter(l => l.p && !l.p.agotado && l.n > 0);
  }
  function totales() {
    const sub = lineas().reduce((a, l) => a + l.p.precio * l.n, 0);
    const envio = pedido.entrega === 'domicilio' ? Number(N.entrega?.domicilio?.costo || 0) : 0;
    return { sub, envio, total: sub + envio, unidades: lineas().reduce((a, l) => a + l.n, 0) };
  }
  function flotante() {
    const t = totales();
    $('#flotante').hidden = !t.unidades;
    $('#ver-pedido').replaceChildren(el('span', { text: `Ver mi pedido · ${t.unidades} ${t.unidades === 1 ? 'producto' : 'productos'}` }), el('span', { text: dinero(t.sub) }));
  }
  function cambiar(id, d) {
    const n = Math.max(0, (pedido.items[id] || 0) + d);
    if (n) pedido.items[id] = n; else delete pedido.items[id];
    guardar(); pintar();
    if ($('#hoja').open) hojaPedido();
  }

  // ---------- Hoja del pedido ----------
  const hoja = $('#hoja');
  const cerrar = () => hoja.close();
  function cabHoja(titulo, atras) {
    return el('div', { class: 'hoja-cab' },
      atras ? el('button', { class: 'redondo', 'aria-label': 'Volver', onclick: atras, text: '‹' }) : null,
      el('h2', { text: titulo }),
      el('button', { class: 'redondo', 'aria-label': 'Cerrar', onclick: cerrar, text: '✕' }));
  }
  function cuentas() {
    const t = totales();
    return el('div', { class: 'cuentas' },
      el('div', {}, el('span', { text: 'Productos' }), el('span', { text: dinero(t.sub) })),
      t.envio ? el('div', {}, el('span', { text: 'Domicilio' }), el('span', { text: dinero(t.envio) })) : null,
      el('div', { class: 'total' }, el('span', { text: 'Total' }), el('span', { text: dinero(t.total) })));
  }
  function hojaPedido() {
    const ls = lineas();
    if (!ls.length) { cerrar(); return; }
    hoja.replaceChildren(el('div', { class: 'hoja-in' },
      cabHoja('Mi pedido'),
      el('div', { class: 'hoja-cuerpo' },
        ls.map(({ p, n }) => el('div', { class: 'linea' }, miniatura(p, 52),
          el('div', { class: 'info' }, el('b', { text: p.nombre }), el('span', { text: `${n} × ${dinero(p.precio)}` })),
          botonCantidad(p))),
        cuentas(),
        N.aviso ? el('div', { class: 'aviso', text: N.aviso }) : null),
      el('div', { class: 'hoja-pie' }, el('button', { class: 'principal', text: 'Continuar', onclick: hojaDatos }))));
  }
  function opciones(nombre, lista, actual, alElegir) {
    return el('div', { class: 'opciones', role: 'group', 'aria-label': nombre },
      lista.map(([valor, texto]) => el('button', { type: 'button', class: 'opcion', 'aria-pressed': String(valor === actual), text: texto, onclick: () => alElegir(valor) })));
  }
  function hojaDatos() {
    const d = pedido.datos ||= {};
    const entregas = [];
    if (N.entrega?.domicilio) entregas.push(['domicilio', 'Domicilio' + (N.entrega.domicilio.costo ? ' (+' + dinero(N.entrega.domicilio.costo) + ')' : '')]);
    if (N.entrega?.retiro) entregas.push(['retiro', 'Retiro en tienda']);
    const campo = (id, texto, attrs = {}) => el('label', { class: 'campo' }, texto,
      el(attrs.tag || 'input', { id, value: attrs.tag ? null : (d[id] || ''), ...attrs, tag: null,
        oninput: e => { d[id] = e.target.value; guardar(); } }, attrs.tag ? d[id] || '' : null));
    const err = el('p', { class: 'error', hidden: true });
    hoja.replaceChildren(el('div', { class: 'hoja-in' },
      cabHoja('Tus datos', hojaPedido),
      el('div', { class: 'hoja-cuerpo' },
        campo('nombre', 'Tu nombre', { autocomplete: 'name', required: true }),
        entregas.length > 1 ? el('div', { class: 'campo' }, 'Entrega', opciones('Entrega', entregas, pedido.entrega, v => { pedido.entrega = v; guardar(); hojaDatos(); })) : null,
        pedido.entrega === 'domicilio'
          ? campo('direccion', 'Dirección', { autocomplete: 'street-address', placeholder: 'Calle, número, barrio' })
          : (N.entrega?.retiro?.direccion ? el('p', { class: 'nota-prueba', text: 'Retiras en: ' + N.entrega.retiro.direccion }) : null),
        el('div', { class: 'fila2' },
          campo('dia', 'Día', { type: 'date', min: new Date().toISOString().slice(0, 10) }),
          campo('hora', 'Hora', { type: 'time' })),
        N.pagos?.length ? el('div', { class: 'campo' }, 'Forma de pago', opciones('Forma de pago', N.pagos.map(x => [x, x]), d.pago, v => { d.pago = v; guardar(); hojaDatos(); })) : null,
        campo('nota', 'Nota (opcional)', { tag: 'textarea', placeholder: N.notaEjemplo || 'Algo que debamos saber' }),
        cuentas(), err),
      el('div', { class: 'hoja-pie' },
        el('button', { class: 'principal wa', onclick: () => enviar(err) },
          el('span', { text: 'Enviar pedido por WhatsApp' })))));
  }
  function mensaje() {
    const d = pedido.datos || {}, t = totales();
    const fecha = d.dia ? new Date(d.dia + 'T12:00').toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' }) : '';
    const partes = [
      `Hola ${N.nombre}, quiero hacer este pedido:`, '',
      ...lineas().map(({ p, n }) => `${n} × ${p.nombre} — ${dinero(p.precio * n)}`), '',
      t.envio ? `Productos: ${dinero(t.sub)}\nDomicilio: ${dinero(t.envio)}` : null,
      `*Total: ${dinero(t.total)}*`, '',
      `Nombre: ${d.nombre}`,
      pedido.entrega === 'domicilio' ? `Entrega: domicilio, ${d.direccion}` : 'Entrega: retiro en tienda',
      fecha || d.hora ? `Día: ${[fecha, d.hora].filter(Boolean).join(', ')}` : null,
      d.pago ? `Pago: ${d.pago}` : null,
      d.nota ? `Nota: ${d.nota}` : null,
    ];
    return partes.filter(x => x != null).join('\n');
  }
  function enviar(err) {
    const d = pedido.datos || {};
    const falta = !d.nombre?.trim() ? 'Escribe tu nombre.'
      : pedido.entrega === 'domicilio' && !d.direccion?.trim() ? 'Escribe la dirección de entrega.'
      : N.pagos?.length && !d.pago ? 'Elige una forma de pago.' : '';
    if (falta) { err.hidden = false; err.textContent = falta; return; }
    const texto = mensaje();
    const numeroWa = String(N.whatsapp || '').replace(/\D/g, '');
    if (!numeroWa) return hojaMuestra(texto);
    location.href = `https://wa.me/${numeroWa}?text=${encodeURIComponent(texto)}`;
  }
  // Sin número todavía (muestra para un prospecto): se ve el mensaje que llegaría
  function hojaMuestra(texto) {
    hoja.replaceChildren(el('div', { class: 'hoja-in' },
      cabHoja('Así llega tu pedido', hojaDatos),
      el('div', { class: 'hoja-cuerpo' },
        el('p', { class: 'nota-prueba', text: 'Esta es una muestra. Con tu número de WhatsApp, este mensaje se abre en el chat de tu negocio y el cliente solo toca enviar.' }),
        el('div', { class: 'mensaje', text: texto })),
      el('div', { class: 'hoja-pie' }, el('button', { class: 'principal', text: 'Listo', onclick: cerrar }))));
  }

  // ---------- Arranque ----------
  $('#buscar').addEventListener('input', e => { busqueda = e.target.value; pintar(); });
  $('#ver-pedido').addEventListener('click', () => { hojaPedido(); hoja.showModal(); });
  hoja.addEventListener('click', e => { if (e.target === hoja) cerrar(); });
  cabecera(); pintar();
  cargar().then(lista => {
    productos = lista;
    if (!lista.length) $('#productos').replaceChildren(el('p', { class: 'vacio', text: 'No pudimos cargar los productos. Revisa tu conexión y vuelve a intentar.' }));
    else pintar();
  });
})();
