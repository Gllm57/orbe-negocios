// Orden de trabajo o pedido en papel: PDF (para mandarlo por WhatsApp) e impresión (carta o A4).
// El PDF se arma con jsPDF, que se carga la primera vez que hace falta y después funciona sin internet.
import { numeroOrden, anticipoDe, ESTADOS_ORDEN } from './datos.js';
import { totales } from './pantallas/vender.js';
import { iniciales } from './ui.js';
import { telInternacional } from './paises.js';

const BASE = new URL('./lib/', import.meta.url).href;
let cargando = null;
export const cargarPDF = () => cargando || (cargando = window.jspdf ? Promise.resolve() : new Promise((ok, mal) => {
  const s = document.createElement('script'); s.src = BASE + 'jspdf.umd.min.js'; s.onload = ok; s.onerror = () => { cargando = null; mal(new Error('jsPDF')); }; document.head.appendChild(s);
}));

// Carta en América; A4 en el resto.
const CARTA = ['US', 'CA', 'MX', 'GT', 'SV', 'HN', 'NI', 'CR', 'PA', 'DO', 'CO', 'VE', 'EC', 'PE', 'BO', 'CL', 'AR', 'UY', 'PY', 'BR', 'PH'];
export const COND_ORDEN = 'Revise su orden al recibirla. Los trabajos y equipos no retirados en 30 días después de avisarle pueden generar cargos por guardarlos. Conserve este documento para retirar.';

// Todo lo que sale en el papel, igual para el PDF y para la impresión.
export function datosOrden(o, { S, P, D }) {
  const cli = S.clientes.find(c => c.id === o.cli) || { n: o.cliN || 'Cliente', tel: '' };
  const resp = (S.perfiles.find(p => p.id === o.resp) || {}).n || '';
  const tt = totales(o.items, S.negocio, P), total = tt.total, ant = anticipoDe(o.id), saldo = Math.max(0, total - ant);
  const fecha = t => new Date(t).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' });
  const fechaHora = t => new Date(t).toLocaleString('es', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
  const n = S.negocio;
  return {
    numero: numeroOrden(o), titulo: o.tipo === 'pedido' ? 'PEDIDO' : 'ORDEN DE TRABAJO',
    negocio: n.nombre, logo: n.logo || '', inic: iniciales(n.nombre),
    datosNeg: [n.razon && n.razon !== n.nombre ? n.razon : '', n.fiscal ? P.fiscal[0] + ' ' + n.fiscal : '', n.dir || '', n.tel || ''].filter(Boolean).join(' · '),
    recibida: fecha(o.t), cliente: cli.n, telCli: cli.tel || '', entrega: o.entrega ? fechaHora(o.entrega) : 'Por confirmar', resp,
    estado: o.estado === 'cancelada' ? 'Cancelada' : (ESTADOS_ORDEN.find(e => e.k === o.estado) || {}).n || '',
    que: o.que, det: o.det || '',
    items: o.items.map(it => ({ n: it.n, q: it.q, p: D.m(it.p), t: D.m(it.q * it.p) })),
    impTxt: tt.txt ? tt.txt + ': ' + D.m(tt.imp) : '', total: D.m(total), totalOtra: D.dual ? D.s(total) : '', tasa: D.dual ? (P.id === 'VE' ? 'Bs' : 'US$') : '',
    anticipo: ant > 0 ? D.m(ant) : '', saldo: D.m(saldo), saldoN: saldo,
    cond: n.condOrden != null ? n.condOrden : COND_ORDEN, papel: CARTA.includes(P.id) ? 'letter' : 'a4'
  };
}

// Texto para WhatsApp junto con el PDF.
export function mensajeOrden(o, ctx) {
  const x = datosOrden(o, ctx), nombre = x.cliente.split(' ')[0];
  if (o.estado === 'lista') return 'Hola ' + nombre + ', te escribe ' + x.negocio + '. Tu ' + (o.tipo === 'pedido' ? 'pedido' : 'orden') + ' ' + x.numero + ' (' + x.que + ') ya está lista para retirar.' + (x.saldoN > 0 ? ' Saldo pendiente: ' + x.saldo + (x.totalOtra ? '' : '') + '.' : '') + ' ¡Te esperamos!';
  return 'Hola ' + nombre + ', te escribe ' + x.negocio + '. Te envío tu ' + (o.tipo === 'pedido' ? 'pedido' : 'orden de trabajo') + ' ' + x.numero + ': ' + x.que + '. Entrega: ' + x.entrega + '. Total ' + x.total + (x.anticipo ? ', anticipo ' + x.anticipo + ', saldo ' + x.saldo : '') + '.';
}
export const enlaceWA = (tel, texto, pid) => 'https://wa.me/' + telInternacional(tel, pid) + '?text=' + encodeURIComponent(texto);

// Las fuentes del PDF solo tienen letras latinas: se cambian los signos que no saldrían.
const limpio = x => String(x == null ? '' : x).replace(/[—–]/g, '-').replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/…/g, '...').replace(/[  ]/g, ' ').replace(/[^\n\x20-\x7E\xA0-\xFF€·]/g, '');

// El logo puede estar en WebP: el PDF necesita PNG o JPG.
function aPNG(src) {
  return new Promise(ok => {
    if (!src) { ok(null); return; }
    const img = new Image();
    img.onload = () => { const cv = document.createElement('canvas'); cv.width = img.naturalWidth; cv.height = img.naturalHeight; cv.getContext('2d').drawImage(img, 0, 0); ok({ src: cv.toDataURL('image/png'), w: img.naturalWidth, h: img.naturalHeight }); };
    img.onerror = () => ok(null); img.src = src;
  });
}

export async function pdfOrden(o, ctx) {
  await cargarPDF();
  const x = datosOrden(o, ctx), { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: x.papel }), W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight(), M = 16;
  const tinta = [26, 23, 51], gris = [98, 95, 125], suave = [140, 137, 166], violeta = [106, 92, 242], linea = [230, 228, 242], fondo = [247, 246, 252];
  const T = (txt, px, py, op) => doc.text(limpio(txt), px, py, op);
  let y = M;
  // Encabezado: logo, negocio y número.
  const logo = await aPNG(x.logo);
  if (logo) { const k = Math.min(20 / logo.w, 20 / logo.h); doc.addImage(logo.src, 'PNG', M, y, logo.w * k, logo.h * k); }
  else { doc.setFillColor(...violeta); doc.roundedRect(M, y, 18, 18, 5, 5, 'F'); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(12); T(x.inic, M + 9, y + 11.5, { align: 'center' }); }
  doc.setTextColor(...tinta); doc.setFont('helvetica', 'bold'); doc.setFontSize(14); T(x.negocio, M + 24, y + 6);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...gris);
  doc.splitTextToSize(limpio(x.datosNeg), 92).slice(0, 3).forEach((l, i) => doc.text(l, M + 24, y + 11 + i * 4));
  doc.setTextColor(...violeta); doc.setFont('helvetica', 'bold'); doc.setFontSize(13); T(x.titulo, W - M, y + 6, { align: 'right' });
  doc.setTextColor(...tinta); doc.setFontSize(12); T(x.numero, W - M, y + 12, { align: 'right' });
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...gris); T('Recibida ' + x.recibida + ' · ' + x.estado, W - M, y + 17, { align: 'right' });
  y += 28;
  // Cliente y entrega.
  const caja = (px, w, tit, l1, l2) => {
    doc.setFillColor(...fondo); doc.roundedRect(px, y, w, 19, 3, 3, 'F');
    doc.setFontSize(7); doc.setTextColor(...suave); doc.setFont('helvetica', 'bold'); T(tit, px + 4, y + 5.5);
    doc.setFontSize(10); doc.setTextColor(...tinta); T(l1, px + 4, y + 11);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...gris); T(l2, px + 4, y + 15.5);
  };
  const mitad = (W - 2 * M - 6) / 2;
  caja(M, mitad, 'CLIENTE', x.cliente, x.telCli);
  caja(M + mitad + 6, mitad, 'ENTREGA ESTIMADA', x.entrega, x.resp ? 'Responsable: ' + x.resp : '');
  y += 26;
  // Qué se recibe o se pide.
  doc.setFontSize(7); doc.setTextColor(...suave); doc.setFont('helvetica', 'bold'); T(o.tipo === 'pedido' ? 'PEDIDO' : 'EQUIPO O TRABAJO', M, y);
  doc.setFontSize(11); doc.setTextColor(...tinta); y += 5.5;
  doc.splitTextToSize(limpio(x.que), W - 2 * M).forEach(l => { doc.text(l, M, y); y += 5; });
  if (x.det) { doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...gris); doc.splitTextToSize(limpio(x.det), W - 2 * M).slice(0, 8).forEach(l => { doc.text(l, M, y); y += 4.3; }); }
  y += 4;
  // Tabla de trabajos y productos.
  const cCant = W - M - 62, cPrecio = W - M - 30, cTotal = W - M;
  doc.setFontSize(7); doc.setTextColor(...suave); doc.setFont('helvetica', 'bold');
  T('TRABAJO O PRODUCTO', M, y); T('CANT.', cCant, y, { align: 'right' }); T('PRECIO', cPrecio, y, { align: 'right' }); T('TOTAL', cTotal, y, { align: 'right' });
  y += 2.5; doc.setDrawColor(...linea); doc.setLineWidth(0.3); doc.line(M, y, W - M, y); y += 5;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(...tinta);
  if (!x.items.length) { doc.setTextColor(...gris); T('Sin trabajos anotados todavía', M, y); y += 7; }
  x.items.forEach(it => {
    const ls = doc.splitTextToSize(limpio(it.n), cCant - M - 16);
    if (y + ls.length * 4.5 > H - 70) { doc.addPage(); y = M; }
    ls.forEach((l, i) => doc.text(l, M, y + i * 4.5));
    T(String(it.q), cCant, y, { align: 'right' }); T(it.p, cPrecio, y, { align: 'right' }); T(it.t, cTotal, y, { align: 'right' });
    y += ls.length * 4.5 + 1.5; doc.line(M, y - 1, W - M, y - 1); y += 3.5;
  });
  // Totales.
  y += 2; const cx0 = W - M - 70;
  const fila = (a, b, fuerte) => { doc.setFont('helvetica', fuerte ? 'bold' : 'normal'); doc.setFontSize(fuerte ? 12 : 9.5); doc.setTextColor(...(fuerte ? tinta : gris)); T(a, cx0, y); T(b, W - M, y, { align: 'right' }); y += fuerte ? 7 : 5.2; };
  fila('Total', x.total);
  if (x.impTxt) { doc.setFontSize(8); doc.setTextColor(...suave); T(x.impTxt, W - M, y - 1.5, { align: 'right' }); y += 3.5; }
  if (x.totalOtra) fila('En ' + x.tasa, x.totalOtra);
  if (x.anticipo) fila('Anticipo', '-' + x.anticipo);
  fila(x.anticipo ? 'Saldo' : 'A pagar', x.saldo, true);
  // Condiciones y firmas.
  y = Math.max(y + 6, H - 62);
  if (x.cond) { doc.setFont('helvetica', 'normal'); doc.setFontSize(7.8); doc.setTextColor(...gris); doc.splitTextToSize(limpio(x.cond), W - 2 * M).slice(0, 5).forEach(l => { doc.text(l, M, y); y += 3.6; }); }
  y = H - 30; doc.setDrawColor(...tinta); doc.setLineWidth(0.3);
  doc.line(M, y, M + mitad - 10, y); doc.line(M + mitad + 16, y, W - M, y);
  doc.setFontSize(8.5); doc.setTextColor(...tinta); T('Firma del cliente', M + (mitad - 10) / 2, y + 5, { align: 'center' }); T('Recibido por', M + mitad + 16 + (W - M - (M + mitad + 16)) / 2, y + 5, { align: 'center' });
  doc.setFontSize(7); doc.setTextColor(...suave); T(x.numero + ' · ' + x.negocio, M, H - 10); T('Hecho con Orbe Negocios', W - M, H - 10, { align: 'right' });
  return doc.output('blob');
}

// Compartir el PDF: en el teléfono se abre el menú para elegir WhatsApp con el archivo puesto.
// Si el aparato no deja compartir archivos, se descarga y se abre WhatsApp con el mensaje.
export async function compartirPDF(blob, o, ctx) {
  const nombre = numeroOrden(o) + '.pdf', archivo = new File([blob], nombre, { type: 'application/pdf' });
  const texto = mensajeOrden(o, ctx), cli = ctx.S.clientes.find(c => c.id === o.cli) || {};
  if (navigator.canShare && navigator.canShare({ files: [archivo] })) {
    try { await navigator.share({ files: [archivo], title: nombre, text: texto }); return 'compartido'; }
    catch (e) { if (e && e.name === 'AbortError') return 'cancelado'; }
  }
  descargar(blob, nombre);
  if (cli.tel) window.open(enlaceWA(cli.tel, texto + ' (te adjunto el PDF)', ctx.P.id), '_blank', 'noopener');
  return 'descargado';
}
export function descargar(blob, nombre) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nombre;
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
}

// Imprimir: se arma la hoja en la página y se abre el diálogo de impresión del aparato.
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export function imprimirOrden(o, ctx) {
  const x = datosOrden(o, ctx);
  const z = document.createElement('div'); z.className = 'zona-imprimir';
  z.innerHTML = `<style>@page { size: ${x.papel === 'letter' ? 'letter' : 'A4'}; margin: 14mm; }</style>
    <div class="imp-cab">${x.logo ? `<img src="${x.logo}" alt="" class="imp-logo">` : `<span class="imp-logo imp-inic">${esc(x.inic)}</span>`}
      <div class="imp-neg"><b>${esc(x.negocio)}</b><span>${esc(x.datosNeg)}</span></div>
      <div class="imp-num"><b>${esc(x.titulo)}</b><strong>${esc(x.numero)}</strong><span>Recibida ${esc(x.recibida)} · ${esc(x.estado)}</span></div></div>
    <div class="imp-dos"><div><small>CLIENTE</small><b>${esc(x.cliente)}</b><span>${esc(x.telCli)}</span></div><div><small>ENTREGA ESTIMADA</small><b>${esc(x.entrega)}</b><span>${x.resp ? 'Responsable: ' + esc(x.resp) : ''}</span></div></div>
    <div class="imp-que"><small>${o.tipo === 'pedido' ? 'PEDIDO' : 'EQUIPO O TRABAJO'}</small><b>${esc(x.que)}</b>${x.det ? `<span>${esc(x.det)}</span>` : ''}</div>
    <table><thead><tr><th>Trabajo o producto</th><th>Cant.</th><th>Precio</th><th>Total</th></tr></thead><tbody>
      ${x.items.map(it => `<tr><td>${esc(it.n)}</td><td>${it.q}</td><td>${esc(it.p)}</td><td>${esc(it.t)}</td></tr>`).join('') || '<tr><td colspan="4">Sin trabajos anotados todavía</td></tr>'}</tbody></table>
    <div class="imp-tot"><div><span>Total</span><span>${esc(x.total)}</span></div>${x.impTxt ? `<div style="font-size:8.5pt;justify-content:flex-end">${esc(x.impTxt)}</div>` : ''}${x.totalOtra ? `<div><span>En ${esc(x.tasa)}</span><span>${esc(x.totalOtra)}</span></div>` : ''}${x.anticipo ? `<div><span>Anticipo</span><span>-${esc(x.anticipo)}</span></div>` : ''}<div class="imp-saldo"><span>${x.anticipo ? 'Saldo' : 'A pagar'}</span><span>${esc(x.saldo)}</span></div></div>
    ${x.cond ? `<p class="imp-cond">${esc(x.cond)}</p>` : ''}
    <div class="imp-firmas"><span>Firma del cliente</span><span>Recibido por</span></div>`;
  // La hoja solo se ve al imprimir; si el aparato no avisa que terminó, se quita en la próxima impresión.
  document.querySelectorAll('.zona-imprimir').forEach(v => v.remove());
  document.body.appendChild(z); document.documentElement.classList.add('imprimiendo');
  const fin = () => { document.documentElement.classList.remove('imprimiendo'); z.remove(); window.removeEventListener('afterprint', fin); };
  window.addEventListener('afterprint', fin);
  // Se espera a que cargue el logo antes de imprimir.
  const img = z.querySelector('img');
  const ya = () => window.print();
  if (img && !img.complete) { img.onload = ya; img.onerror = ya; } else setTimeout(ya, 60);
}
