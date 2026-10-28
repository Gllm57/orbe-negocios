// Países, monedas, formas de pago e impuestos. Mismo criterio que Orbe mundial:
// Venezuela y Argentina muestran dos monedas; los países con dólar o euro no usan tasas.

const GEN = ['Efectivo', 'Tarjeta', 'Transferencia'];

export const PAISES = [
  { id: 'AR', n: 'Argentina', f: '🇦🇷', s: '$', r: 1200, cur: 'pesos argentinos', loc: 'es-AR', pays: ['Mercado Pago', 'Transferencia', 'Efectivo', 'USDT'], tax: ['IVA', 21], fiscal: ['CUIT', '30-71234567-8'], suf: 'S.R.L.' },
  { id: 'BO', n: 'Bolivia', f: '🇧🇴', s: 'Bs.', r: 6.96, cur: 'bolivianos', loc: 'es-BO', pays: ['QR Simple', 'Efectivo', 'Transferencia'], tax: ['IVA', 13], fiscal: ['NIT', ''] },
  { id: 'BR', n: 'Brasil', f: '🇧🇷', s: 'R$', r: 5.4, cur: 'reales', loc: 'pt-BR', pays: ['Pix', 'Tarjeta', 'Efectivo'], tax: ['Impuesto', 0], fiscal: ['CNPJ', '12.345.678/0001-90'], suf: 'Ltda.' },
  { id: 'CA', n: 'Canadá', f: '🇨🇦', s: '$', r: 1.37, cur: 'dólares canadienses', loc: 'en-CA', pays: ['Tarjeta', 'Interac', 'Efectivo'], tax: ['GST', 5], fiscal: ['Business number', ''] },
  { id: 'CL', n: 'Chile', f: '🇨🇱', s: '$', r: 940, cur: 'pesos chilenos', loc: 'es-CL', pays: ['Transferencia', 'Tarjeta', 'Efectivo'], tax: ['IVA', 19], fiscal: ['RUT', '76.123.456-7'], suf: 'SpA' },
  { id: 'CO', n: 'Colombia', f: '🇨🇴', s: '$', r: 4000, cur: 'pesos colombianos', loc: 'es-CO', pays: ['Nequi', 'Daviplata', 'Transferencia', 'Efectivo'], tax: ['IVA', 19], fiscal: ['NIT', '900.123.456-7'], suf: 'S.A.S.' },
  { id: 'CR', n: 'Costa Rica', f: '🇨🇷', s: '₡', r: 510, cur: 'colones', loc: 'es-CR', pays: ['SINPE Móvil', 'Tarjeta', 'Efectivo'], tax: ['IVA', 13], fiscal: ['Cédula jurídica', ''] },
  { id: 'EC', n: 'Ecuador', f: '🇪🇨', s: '$', r: 1, cur: 'dólares', loc: 'es-EC', pays: ['Transferencia', 'De Una', 'Tarjeta', 'Efectivo'], tax: ['IVA', 15], fiscal: ['RUC', ''] },
  { id: 'SV', n: 'El Salvador', f: '🇸🇻', s: '$', r: 1, cur: 'dólares', loc: 'es-SV', pays: GEN, tax: ['IVA', 13], fiscal: ['NIT', ''] },
  { id: 'ES', n: 'España', f: '🇪🇸', s: '€', r: 0.885, eur: true, cur: 'euros', loc: 'es-ES', pays: ['Bizum', 'Tarjeta', 'Efectivo'], tax: ['IVA', 21], fiscal: ['NIF', 'B12345678'], suf: 'S.L.' },
  { id: 'US', n: 'Estados Unidos', f: '🇺🇸', s: '$', r: 1, cur: 'dólares', loc: 'en-US', pays: ['Tarjeta', 'Zelle', 'Cash App', 'Venmo', 'Efectivo'], tax: ['Sales tax', 0], fiscal: ['EIN', '12-3456789'], suf: 'LLC' },
  { id: 'FR', n: 'Francia', f: '🇫🇷', s: '€', r: 0.885, eur: true, cur: 'euros', loc: 'fr-FR', pays: ['Tarjeta', 'Efectivo', 'Transferencia'], tax: ['TVA', 20], fiscal: ['SIRET', ''] },
  { id: 'GT', n: 'Guatemala', f: '🇬🇹', s: 'Q', r: 7.7, cur: 'quetzales', loc: 'es-GT', pays: GEN, tax: ['IVA', 12], fiscal: ['NIT', ''] },
  { id: 'HN', n: 'Honduras', f: '🇭🇳', s: 'L', r: 26, cur: 'lempiras', loc: 'es-HN', pays: GEN, tax: ['ISV', 15], fiscal: ['RTN', ''] },
  { id: 'IT', n: 'Italia', f: '🇮🇹', s: '€', r: 0.885, eur: true, cur: 'euros', loc: 'it-IT', pays: ['Tarjeta', 'Satispay', 'Efectivo'], tax: ['IVA', 22], fiscal: ['Partita IVA', ''] },
  { id: 'MX', n: 'México', f: '🇲🇽', s: '$', r: 18.5, cur: 'pesos mexicanos', loc: 'es-MX', pays: ['Efectivo', 'Tarjeta', 'SPEI', 'CoDi', 'Mercado Pago'], tax: ['IVA', 16], fiscal: ['RFC', 'CLE010203AB1'], suf: 'S.A. de C.V.' },
  { id: 'NI', n: 'Nicaragua', f: '🇳🇮', s: 'C$', r: 36.7, cur: 'córdobas', loc: 'es-NI', pays: GEN, tax: ['IVA', 15], fiscal: ['RUC', ''] },
  { id: 'PA', n: 'Panamá', f: '🇵🇦', s: '$', r: 1, cur: 'dólares', loc: 'es-PA', pays: ['Yappy', 'Tarjeta', 'Efectivo'], tax: ['ITBMS', 7], fiscal: ['RUC', ''] },
  { id: 'PY', n: 'Paraguay', f: '🇵🇾', s: '₲', r: 7700, cur: 'guaraníes', loc: 'es-PY', pays: GEN, tax: ['IVA', 10], fiscal: ['RUC', ''] },
  { id: 'PE', n: 'Perú', f: '🇵🇪', s: 'S/', r: 3.7, cur: 'soles', loc: 'es-PE', pays: ['Yape', 'Plin', 'Tarjeta', 'Efectivo'], tax: ['IGV', 18], fiscal: ['RUC', '20123456789'], suf: 'S.A.C.' },
  { id: 'PT', n: 'Portugal', f: '🇵🇹', s: '€', r: 0.885, eur: true, cur: 'euros', loc: 'pt-PT', pays: ['MB Way', 'Tarjeta', 'Efectivo'], tax: ['IVA', 23], fiscal: ['NIF', ''] },
  { id: 'DO', n: 'República Dominicana', f: '🇩🇴', s: 'RD$', r: 61, cur: 'pesos dominicanos', loc: 'es-DO', pays: GEN, tax: ['ITBIS', 18], fiscal: ['RNC', ''] },
  { id: 'GB', n: 'Reino Unido', f: '🇬🇧', s: '£', r: 0.76, cur: 'libras', loc: 'en-GB', pays: ['Tarjeta', 'Efectivo', 'Transferencia'], tax: ['VAT', 20], fiscal: ['VAT number', ''] },
  { id: 'UY', n: 'Uruguay', f: '🇺🇾', s: '$', r: 40, cur: 'pesos uruguayos', loc: 'es-UY', pays: GEN, tax: ['IVA', 22], fiscal: ['RUT', ''] },
  { id: 'VE', n: 'Venezuela', f: '🇻🇪', s: '$', r: 1, cur: 'dólares y bolívares', loc: 'es-VE', pays: ['Pago Móvil', 'Efectivo $', 'Efectivo Bs', 'USDT', 'Zelle', 'Binance Pay'], tax: ['IVA', 16], fiscal: ['RIF', 'J-50123456-7'], suf: 'C.A.' }
];

export const TIPOS = [
  { id: 'tienda', n: 'Tienda', ex: 'Bodega, minimarket, ferretería, farmacia, ropa', inv: true, vender: 'Vender', color: 'vio' },
  { id: 'comida', n: 'Comida', ex: 'Comida rápida, cafetería, panadería, food truck', inv: true, vender: 'Pedido', color: 'amb' },
  { id: 'citas', n: 'Servicios con cita', ex: 'Peluquería, barbería, uñas, taller, consultorio', inv: false, vender: 'Cobrar', color: 'ver' },
  { id: 'online', n: 'Venta en línea', ex: 'Instagram, WhatsApp o TikTok, con envíos', inv: true, vender: 'Vender', color: 'ros' },
  { id: 'indep', n: 'Independiente', ex: 'Diseño, fotos, clases, técnico, consultoría', inv: false, vender: 'Cobrar', color: 'azu' }
];

export const pais = id => PAISES.find(p => p.id === id) || PAISES[PAISES.length - 1];
export const tipo = id => TIPOS.find(t => t.id === id) || TIPOS[0];

// Tasas del día. Venezuela: oficial del BCV y paralela. Argentina: oficial, blue, MEP y cripto.
// Si no hay internet se usa la última guardada; también se pueden escribir a mano.
export const TASA_VE_RESPALDO = 875.68;
export const FUENTES_AR = [{ v: 'oficial', n: 'Oficial' }, { v: 'blue', n: 'Blue' }, { v: 'bolsa', n: 'MEP' }];
// Tasas extra que un negocio puede usar para cobrar ciertas formas de pago.
export const TASAS_EXTRA = { VE: [{ k: 'paralela', n: 'Paralela', auto: true }, { k: 'usdt', n: 'USDT' }, { k: 'propia', n: 'Propia' }], AR: [{ k: 'paralela', n: 'Blue', auto: true }, { k: 'usdt', n: 'Cripto (USDT)', auto: true }, { k: 'propia', n: 'Propia' }] };
const URLS = {
  VE: { oficial: [['https://ve.dolarapi.com/v1/dolares/oficial', j => j.promedio], ['https://pydolarve.org/api/v2/dollar?page=bcv&monitor=usd', j => j.price]], paralela: [['https://ve.dolarapi.com/v1/dolares/paralelo', j => j.promedio]] },
  AR: { oficial: [['https://dolarapi.com/v1/dolares/oficial', j => j.venta]], blue: [['https://dolarapi.com/v1/dolares/blue', j => j.venta]], bolsa: [['https://dolarapi.com/v1/dolares/bolsa', j => j.venta]], paralela: [['https://dolarapi.com/v1/dolares/blue', j => j.venta]], usdt: [['https://dolarapi.com/v1/dolares/cripto', j => j.venta]] }
};
export async function leerTasa(paisId, fuente) {
  const fuentes = (URLS[paisId] || {})[fuente || 'oficial'] || [];
  for (const [url, saca] of fuentes) {
    try {
      const r = await fetch(url, { cache: 'no-store' });
      if (!r.ok) continue;
      const v = Number(saca(await r.json()));
      if (v > 0) return v;
    } catch (e) { /* sin conexión: probamos la siguiente */ }
  }
  return 0;
}
export const nombreTasa = (P, t) => P.id === 'VE' ? 'Tasa BCV' : 'Dólar ' + ((FUENTES_AR.find(f => f.v === (t && t.fuente)) || FUENTES_AR[0]).n).toLowerCase();
// Formas de pago en divisas (en Venezuela pagan IGTF si el negocio lo cobra).
export const esDivisa = m => /Efectivo \$|Zelle|USDT|Binance|Dólar|Divisa/i.test(m);
// Formas de pago electrónicas: se les puede pedir el número de referencia.
export const esElectronico = m => !/Efectivo|Fiado|Por cobrar|Saldo a favor/i.test(m);

// Billetes de cada moneda, para contar la caja.
const BILLETES = { USD: [1, 2, 5, 10, 20, 50, 100], VES: [5, 10, 20, 50, 100, 200, 500], ARS: [100, 200, 500, 1000, 2000, 10000, 20000], COP: [2000, 5000, 10000, 20000, 50000, 100000], MXN: [20, 50, 100, 200, 500, 1000], CLP: [1000, 2000, 5000, 10000, 20000], PEN: [10, 20, 50, 100, 200], EUR: [5, 10, 20, 50, 100, 200], BRL: [2, 5, 10, 20, 50, 100, 200], GBP: [5, 10, 20, 50], CAD: [5, 10, 20, 50, 100], BOB: [10, 20, 50, 100, 200], CRC: [1000, 2000, 5000, 10000, 20000], GTQ: [1, 5, 10, 20, 50, 100, 200], HNL: [1, 2, 5, 10, 20, 50, 100, 500], NIO: [10, 20, 50, 100, 200, 500, 1000], PYG: [2000, 5000, 10000, 20000, 50000, 100000], DOP: [50, 100, 200, 500, 1000, 2000], UYU: [20, 50, 100, 200, 500, 1000, 2000] };
const COD = { AR: 'ARS', BO: 'BOB', BR: 'BRL', CA: 'CAD', CL: 'CLP', CO: 'COP', CR: 'CRC', GB: 'GBP', GT: 'GTQ', HN: 'HNL', MX: 'MXN', NI: 'NIO', PY: 'PYG', PE: 'PEN', DO: 'DOP', UY: 'UYU' };
// Moneda de una forma de pago en efectivo: en Venezuela «Efectivo Bs» es bolívares y «Efectivo $» dólares.
export function monedaEfectivo(P, m) {
  if (P.id === 'VE') return /Bs/.test(m) ? { cod: 'VES', s: 'Bs', otra: true } : { cod: 'USD', s: '$', otra: false };
  if (/US\$|USD|Dólar/i.test(m)) return { cod: 'USD', s: 'US$', otra: true };
  return { cod: P.eur ? 'EUR' : COD[P.id] || 'USD', s: P.s, otra: false };
}
export const billetesDe = cod => BILLETES[cod] || BILLETES.USD;

// Formato de dinero según el país. Los montos se guardan en la moneda principal del negocio
// (en Venezuela, dólares; la segunda moneda se calcula con la tasa).
export function dinero(P, tasa) {
  const ve = P.id === 'VE', ar = P.id === 'AR', dec = P.r >= 100 ? 0 : 2;
  const nf = new Intl.NumberFormat(P.loc, { minimumFractionDigits: dec, maximumFractionDigits: dec });
  const nfc = new Intl.NumberFormat(P.loc, { notation: 'compact', maximumFractionDigits: 1 });
  const nf2 = new Intl.NumberFormat(ve ? 'es-VE' : 'es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const sim = P.s + (P.s.length > 1 ? ' ' : '');
  const m = v => (v < -0.004 ? '−' : '') + (P.eur ? nf.format(Math.abs(v)) + ' €' : sim + nf.format(Math.abs(v)));
  return {
    dec, dual: ve || ar,
    m,
    corto: v => P.eur ? nfc.format(v) + ' €' : sim + nfc.format(v),
    s: v => ve ? 'Bs ' + nf2.format(v * (tasa || TASA_VE_RESPALDO)) : ar ? 'US$ ' + nf2.format(v / (tasa || P.r)) : '',
    tasa: tasa || (ve ? TASA_VE_RESPALDO : P.r),
    // Pasa un monto a la otra moneda (Bs o US$) con una tasa dada, y al revés.
    aOtra: (v, t) => ve ? v * (t || tasa || TASA_VE_RESPALDO) : ar ? v / (t || tasa || P.r) : v,
    deOtra: (v, t) => ve ? v / (t || tasa || TASA_VE_RESPALDO) : ar ? v * (t || tasa || P.r) : v,
    // Redondea un precio en moneda local a un número «bonito».
    bonito: v => ve || P.r === 1 ? Math.round(v * 100) / 100 : P.r >= 1000 ? Math.round(v / 50) * 50 : P.r >= 100 ? Math.round(v / 10) * 10 : P.r >= 10 ? Math.round(v * 2) / 2 : Math.round(v * 20) / 20,
    redondo: v => dec ? Math.round(v * 100) / 100 : Math.round(v),
    // Pasa un precio de referencia en dólares a un precio "bonito" en la moneda del país.
    precio: usd => {
      const v = usd * P.r;
      if (ve || P.r === 1) return Math.round(v * 100) / 100;
      if (P.r >= 1000) return Math.round(v / 50) * 50;
      if (P.r >= 100) return Math.round(v / 10) * 10;
      if (P.r >= 10) return Math.round(v * 2) / 2;
      return Math.round(v * 20) / 20;
    },
    paso: dec ? (P.r >= 10 ? 10 : 1) : (P.r >= 1000 ? 1000 : 100),
    // Billetes con los que suele pagar alguien un total dado (para calcular el vuelto).
    billetes: t => {
      const b = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000, 200000].map(x => x * (P.r >= 1000 ? 10 : 1));
      const out = [t];
      b.forEach(u => { const v = Math.ceil(t / u) * u; if (v > t + 1e-9 && !out.includes(v) && out.length < 4 && u >= t / 20) out.push(v); });
      return out.sort((a, c) => a - c).slice(0, 4);
    }
  };
}
