// Países, monedas, formas de pago e impuestos. Mismo criterio que Orbe mundial:
// Venezuela y Argentina muestran dos monedas; los países con dólar o euro no usan tasas.

const GEN = ['Efectivo', 'Tarjeta', 'Transferencia'];

// usd2: moneda local inestable + dólar (como Argentina). red: tasas de impuesto reducidas.
export const PAISES = [
  { id: 'DE', n: 'Alemania', f: '🇩🇪', s: '€', r: 0.885, eur: true, cur: 'euros', loc: 'de-DE', pays: ['Tarjeta', 'Girocard', 'Efectivo', 'PayPal'], tax: ['MwSt', 19], red: [7], fiscal: ['Steuernummer', ''], suf: 'GmbH' },
  { id: 'AR', n: 'Argentina', f: '🇦🇷', s: '$', r: 1200, usd2: true, cur: 'pesos argentinos', loc: 'es-AR', pays: ['Mercado Pago', 'Transferencia', 'Efectivo', 'USDT'], tax: ['IVA', 21], red: [10.5], fiscal: ['CUIT', '30-71234567-8'], suf: 'S.R.L.' },
  { id: 'AU', n: 'Australia', f: '🇦🇺', s: 'A$', r: 1.52, cur: 'dólares australianos', loc: 'en-AU', pays: ['Tarjeta', 'PayID', 'Efectivo'], tax: ['GST', 10], red: [0], fiscal: ['ABN', ''] },
  { id: 'AT', n: 'Austria', f: '🇦🇹', s: '€', r: 0.885, eur: true, cur: 'euros', loc: 'de-AT', pays: ['Tarjeta', 'Efectivo', 'Transferencia'], tax: ['USt', 20], red: [13, 10], fiscal: ['UID', ''] },
  { id: 'BE', n: 'Bélgica', f: '🇧🇪', s: '€', r: 0.885, eur: true, cur: 'euros', loc: 'fr-BE', pays: ['Bancontact', 'Tarjeta', 'Efectivo'], tax: ['TVA', 21], red: [12, 6], fiscal: ['TVA', ''] },
  { id: 'BO', n: 'Bolivia', f: '🇧🇴', s: 'Bs.', r: 6.96, usd2: true, cur: 'bolivianos', loc: 'es-BO', pays: ['QR Simple', 'Efectivo', 'Transferencia', 'USDT'], tax: ['IVA', 13], fiscal: ['NIT', ''] },
  { id: 'BR', n: 'Brasil', f: '🇧🇷', s: 'R$', r: 5.4, cur: 'reales', loc: 'pt-BR', pays: ['Pix', 'Tarjeta', 'Efectivo'], tax: ['Impuesto', 0], fiscal: ['CNPJ', '12.345.678/0001-90'], suf: 'Ltda.' },
  { id: 'CA', n: 'Canadá', f: '🇨🇦', s: '$', r: 1.37, cur: 'dólares canadienses', loc: 'en-CA', pays: ['Tarjeta', 'Interac', 'Efectivo'], tax: ['GST', 5], red: [0], fiscal: ['Business number', ''] },
  { id: 'CL', n: 'Chile', f: '🇨🇱', s: '$', r: 940, cur: 'pesos chilenos', loc: 'es-CL', pays: ['Transferencia', 'Tarjeta', 'Efectivo'], tax: ['IVA', 19], fiscal: ['RUT', '76.123.456-7'], suf: 'SpA' },
  { id: 'CO', n: 'Colombia', f: '🇨🇴', s: '$', r: 4000, cur: 'pesos colombianos', loc: 'es-CO', pays: ['Nequi', 'Daviplata', 'Transferencia', 'Efectivo'], tax: ['IVA', 19], red: [5], fiscal: ['NIT', '900.123.456-7'], suf: 'S.A.S.' },
  { id: 'CR', n: 'Costa Rica', f: '🇨🇷', s: '₡', r: 510, cur: 'colones', loc: 'es-CR', pays: ['SINPE Móvil', 'Tarjeta', 'Efectivo'], tax: ['IVA', 13], red: [4, 2, 1], fiscal: ['Cédula jurídica', ''] },
  { id: 'EC', n: 'Ecuador', f: '🇪🇨', s: '$', r: 1, cur: 'dólares', loc: 'es-EC', pays: ['Transferencia', 'De Una', 'Tarjeta', 'Efectivo'], tax: ['IVA', 15], red: [5, 0], fiscal: ['RUC', ''] },
  { id: 'EG', n: 'Egipto', f: '🇪🇬', s: 'E£', r: 48.5, usd2: true, cur: 'libras egipcias', loc: 'en-EG', pays: ['Efectivo', 'InstaPay', 'Vodafone Cash', 'Tarjeta'], tax: ['VAT', 14], red: [5], fiscal: ['Tax ID', ''] },
  { id: 'SV', n: 'El Salvador', f: '🇸🇻', s: '$', r: 1, cur: 'dólares', loc: 'es-SV', pays: GEN, tax: ['IVA', 13], fiscal: ['NIT', ''] },
  { id: 'ES', n: 'España', f: '🇪🇸', s: '€', r: 0.885, eur: true, cur: 'euros', loc: 'es-ES', pays: ['Bizum', 'Tarjeta', 'Efectivo'], tax: ['IVA', 21], red: [10, 4], fiscal: ['NIF', 'B12345678'], suf: 'S.L.' },
  { id: 'US', n: 'Estados Unidos', f: '🇺🇸', s: '$', r: 1, cur: 'dólares', loc: 'en-US', pays: ['Tarjeta', 'Zelle', 'Cash App', 'Venmo', 'Efectivo'], tax: ['Sales tax', 0], fiscal: ['EIN', '12-3456789'], suf: 'LLC' },
  { id: 'PH', n: 'Filipinas', f: '🇵🇭', s: '₱', r: 57, cur: 'pesos filipinos', loc: 'en-PH', pays: ['GCash', 'Maya', 'Efectivo', 'Tarjeta'], tax: ['VAT', 12], red: [0], fiscal: ['TIN', ''] },
  { id: 'FR', n: 'Francia', f: '🇫🇷', s: '€', r: 0.885, eur: true, cur: 'euros', loc: 'fr-FR', pays: ['Tarjeta', 'Efectivo', 'Transferencia'], tax: ['TVA', 20], red: [10, 5.5], fiscal: ['SIRET', ''] },
  { id: 'GT', n: 'Guatemala', f: '🇬🇹', s: 'Q', r: 7.7, cur: 'quetzales', loc: 'es-GT', pays: GEN, tax: ['IVA', 12], fiscal: ['NIT', ''] },
  { id: 'HN', n: 'Honduras', f: '🇭🇳', s: 'L', r: 26, cur: 'lempiras', loc: 'es-HN', pays: GEN, tax: ['ISV', 15], red: [18], fiscal: ['RTN', ''] },
  { id: 'IN', n: 'India', f: '🇮🇳', s: '₹', r: 88, cur: 'rupias', loc: 'en-IN', pays: ['UPI', 'Efectivo', 'Tarjeta'], tax: ['GST', 18], red: [12, 5, 0], fiscal: ['GSTIN', ''] },
  { id: 'IE', n: 'Irlanda', f: '🇮🇪', s: '€', r: 0.885, eur: true, cur: 'euros', loc: 'en-IE', pays: ['Tarjeta', 'Efectivo', 'Revolut'], tax: ['VAT', 23], red: [13.5, 9], fiscal: ['VAT number', ''] },
  { id: 'IT', n: 'Italia', f: '🇮🇹', s: '€', r: 0.885, eur: true, cur: 'euros', loc: 'it-IT', pays: ['Tarjeta', 'Satispay', 'Efectivo'], tax: ['IVA', 22], red: [10, 5, 4], fiscal: ['Partita IVA', ''] },
  { id: 'KE', n: 'Kenia', f: '🇰🇪', s: 'KSh', r: 129, cur: 'chelines kenianos', loc: 'en-KE', pays: ['M-Pesa', 'Efectivo', 'Tarjeta'], tax: ['VAT', 16], red: [8, 0], fiscal: ['KRA PIN', ''] },
  { id: 'LB', n: 'Líbano', f: '🇱🇧', s: 'L£', r: 89500, usd2: true, cur: 'libras libanesas', loc: 'en-LB', pays: ['Efectivo $', 'Efectivo L£', 'Whish', 'OMT'], tax: ['VAT', 11], fiscal: ['Número fiscal', ''] },
  { id: 'MA', n: 'Marruecos', f: '🇲🇦', s: 'DH', r: 9.2, cur: 'dírhams', loc: 'fr-MA', pays: ['Efectivo', 'Tarjeta', 'Transferencia'], tax: ['TVA', 20], red: [14, 10, 7], fiscal: ['ICE', ''] },
  { id: 'MX', n: 'México', f: '🇲🇽', s: '$', r: 18.5, cur: 'pesos mexicanos', loc: 'es-MX', pays: ['Efectivo', 'Tarjeta', 'SPEI', 'CoDi', 'Mercado Pago'], tax: ['IVA', 16], red: [8, 0], fiscal: ['RFC', 'CLE010203AB1'], suf: 'S.A. de C.V.' },
  { id: 'NI', n: 'Nicaragua', f: '🇳🇮', s: 'C$', r: 36.7, cur: 'córdobas', loc: 'es-NI', pays: GEN, tax: ['IVA', 15], fiscal: ['RUC', ''] },
  { id: 'NG', n: 'Nigeria', f: '🇳🇬', s: '₦', r: 1550, usd2: true, cur: 'nairas', loc: 'en-NG', pays: ['Transferencia', 'POS', 'Efectivo', 'Opay'], tax: ['VAT', 7.5], red: [0], fiscal: ['TIN', ''] },
  { id: 'NL', n: 'Países Bajos', f: '🇳🇱', s: '€', r: 0.885, eur: true, cur: 'euros', loc: 'nl-NL', pays: ['iDEAL', 'Tarjeta', 'Efectivo'], tax: ['BTW', 21], red: [9], fiscal: ['BTW-id', ''] },
  { id: 'PA', n: 'Panamá', f: '🇵🇦', s: '$', r: 1, cur: 'dólares', loc: 'es-PA', pays: ['Yappy', 'Tarjeta', 'Efectivo'], tax: ['ITBMS', 7], red: [0], fiscal: ['RUC', ''] },
  { id: 'PY', n: 'Paraguay', f: '🇵🇾', s: '₲', r: 7700, cur: 'guaraníes', loc: 'es-PY', pays: GEN, tax: ['IVA', 10], red: [5], fiscal: ['RUC', ''] },
  { id: 'PE', n: 'Perú', f: '🇵🇪', s: 'S/', r: 3.7, cur: 'soles', loc: 'es-PE', pays: ['Yape', 'Plin', 'Tarjeta', 'Efectivo'], tax: ['IGV', 18], red: [0], fiscal: ['RUC', '20123456789'], suf: 'S.A.C.' },
  { id: 'PL', n: 'Polonia', f: '🇵🇱', s: 'zł', r: 3.7, cur: 'esloti', loc: 'pl-PL', pays: ['BLIK', 'Tarjeta', 'Efectivo'], tax: ['VAT', 23], red: [8, 5], fiscal: ['NIP', ''] },
  { id: 'PT', n: 'Portugal', f: '🇵🇹', s: '€', r: 0.885, eur: true, cur: 'euros', loc: 'pt-PT', pays: ['MB Way', 'Tarjeta', 'Efectivo'], tax: ['IVA', 23], red: [13, 6], fiscal: ['NIF', ''] },
  { id: 'DO', n: 'República Dominicana', f: '🇩🇴', s: 'RD$', r: 61, cur: 'pesos dominicanos', loc: 'es-DO', pays: GEN, tax: ['ITBIS', 18], red: [16, 0], fiscal: ['RNC', ''] },
  { id: 'GB', n: 'Reino Unido', f: '🇬🇧', s: '£', r: 0.76, cur: 'libras', loc: 'en-GB', pays: ['Tarjeta', 'Efectivo', 'Transferencia'], tax: ['VAT', 20], red: [5, 0], fiscal: ['VAT number', ''] },
  { id: 'ZA', n: 'Sudáfrica', f: '🇿🇦', s: 'R', r: 17.5, cur: 'rands', loc: 'en-ZA', pays: ['Tarjeta', 'SnapScan', 'Efectivo'], tax: ['VAT', 15], red: [0], fiscal: ['VAT number', ''] },
  { id: 'CH', n: 'Suiza', f: '🇨🇭', s: 'CHF', r: 0.8, cur: 'francos suizos', loc: 'de-CH', pays: ['Twint', 'Tarjeta', 'Efectivo'], tax: ['MWST', 8.1], red: [2.6], fiscal: ['UID', ''] },
  { id: 'TR', n: 'Turquía', f: '🇹🇷', s: '₺', r: 41.5, usd2: true, cur: 'liras', loc: 'tr-TR', pays: ['Tarjeta', 'Efectivo', 'Transferencia', 'Papara'], tax: ['KDV', 20], red: [10, 1], fiscal: ['VKN', ''] },
  { id: 'UY', n: 'Uruguay', f: '🇺🇾', s: '$', r: 40, cur: 'pesos uruguayos', loc: 'es-UY', pays: GEN, tax: ['IVA', 22], red: [10], fiscal: ['RUT', ''] },
  { id: 'VE', n: 'Venezuela', f: '🇻🇪', s: '$', r: 1, cur: 'dólares y bolívares', loc: 'es-VE', pays: ['Pago Móvil', 'Efectivo $', 'Efectivo Bs', 'USDT', 'Zelle', 'Binance Pay'], tax: ['IVA', 16], red: [8], fiscal: ['RIF', 'J-50123456-7'], suf: 'C.A.' },
  { id: 'ZW', n: 'Zimbabue', f: '🇿🇼', s: 'ZiG', r: 27, usd2: true, cur: 'ZiG (oro de Zimbabue)', loc: 'en-ZW', pays: ['Efectivo US$', 'EcoCash', 'Tarjeta', 'Efectivo ZiG'], tax: ['VAT', 15.5], red: [0], fiscal: ['BP number', ''] }
];

export const TIPOS = [
  { id: 'tienda', n: 'Tienda', ex: 'Bodega, minimarket, ferretería, farmacia, ropa', inv: true, vender: 'Vender', color: 'vio' },
  { id: 'comida', n: 'Comida', ex: 'Comida rápida, cafetería, panadería, food truck', inv: true, vender: 'Pedido', color: 'amb' },
  { id: 'citas', n: 'Servicios con cita', ex: 'Peluquería, barbería, uñas, taller, consultorio', inv: false, vender: 'Cobrar', color: 'ver' },
  { id: 'online', n: 'Venta en línea', ex: 'Instagram, WhatsApp o TikTok, con envíos', inv: true, vender: 'Vender', color: 'ros' },
  { id: 'indep', n: 'Independiente', ex: 'Diseño, fotos, clases, técnico, consultoría', inv: false, vender: 'Cobrar', color: 'azu' }
];

export const pais = id => PAISES.find(p => p.id === id) || PAISES.find(p => p.id === 'VE');
export const tipo = id => TIPOS.find(t => t.id === id) || TIPOS[0];

// Tasas del día. Venezuela: oficial del BCV y paralela. Argentina: oficial, blue, MEP y cripto.
// Si no hay internet se usa la última guardada; también se pueden escribir a mano.
export const TASA_VE_RESPALDO = 875.68;
export const FUENTES_AR = [{ v: 'oficial', n: 'Oficial' }, { v: 'blue', n: 'Blue' }, { v: 'bolsa', n: 'MEP' }];
// Tasas extra que un negocio puede usar para cobrar ciertas formas de pago.
const EXTRA_GEN = [{ k: 'paralela', n: 'Paralela' }, { k: 'usdt', n: 'USDT' }, { k: 'propia', n: 'Propia' }];
export const TASAS_EXTRA = new Proxy({ VE: [{ k: 'paralela', n: 'Paralela', auto: true }, { k: 'usdt', n: 'USDT' }, { k: 'propia', n: 'Propia' }], AR: [{ k: 'paralela', n: 'Blue', auto: true }, { k: 'usdt', n: 'Cripto (USDT)', auto: true }, { k: 'propia', n: 'Propia' }] }, { get: (o, k) => o[k] || (PAISES.find(p => p.id === k && p.usd2) ? EXTRA_GEN : undefined) });
// Países con dos monedas: Venezuela (precios en dólares) y los de moneda local + dólar.
export const dosMonedas = P => P.id === 'VE' || !!P.usd2;
// Nombre corto de la otra moneda.
export const otraMoneda = P => P.id === 'VE' ? 'Bs' : 'US$';
const URLS = {
  VE: { oficial: [['https://ve.dolarapi.com/v1/dolares/oficial', j => j.promedio], ['https://pydolarve.org/api/v2/dollar?page=bcv&monitor=usd', j => j.price]], paralela: [['https://ve.dolarapi.com/v1/dolares/paralelo', j => j.promedio]], euro: [['https://ve.dolarapi.com/v1/euros/oficial', j => j.promedio], ['https://pydolarve.org/api/v2/euro?page=bcv&monitor=eur', j => j.price]] },
  AR: { oficial: [['https://dolarapi.com/v1/dolares/oficial', j => j.venta]], blue: [['https://dolarapi.com/v1/dolares/blue', j => j.venta]], bolsa: [['https://dolarapi.com/v1/dolares/bolsa', j => j.venta]], paralela: [['https://dolarapi.com/v1/dolares/blue', j => j.venta]], usdt: [['https://dolarapi.com/v1/dolares/cripto', j => j.venta]], euro: [['https://dolarapi.com/v1/cotizaciones/eur', j => j.venta]] }
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
export const nombreTasa = (P, t) => P.id === 'VE' ? 'Tasa BCV' : P.id === 'AR' ? 'Dólar ' + ((FUENTES_AR.find(f => f.v === (t && t.fuente)) || FUENTES_AR[0]).n).toLowerCase() : 'Dólar';
// Formas de pago en divisas (en Venezuela pagan IGTF si el negocio lo cobra).
export const esDivisa = m => /Efectivo \$|Zelle|USDT|Binance|Dólar|Divisa|€|Euro/i.test(m);
// Formas de pago en euros.
export const esEuro = m => /€|Euro/i.test(m);
// Euro por dólar de referencia, si todavía no se leyó la tasa del euro.
export const EUR_USD = 1.16;
// Formas de pago electrónicas: se les puede pedir el número de referencia.
export const esElectronico = m => !/Efectivo|Fiado|Por cobrar|Saldo a favor/i.test(m);

// Billetes de cada moneda, para contar la caja.
const BILLETES = { TRY: [5, 10, 20, 50, 100, 200], NGN: [100, 200, 500, 1000], EGP: [5, 10, 20, 50, 100, 200], LBP: [5000, 10000, 20000, 50000, 100000], ZWG: [10, 20, 50, 100, 200], PLN: [10, 20, 50, 100, 200, 500], CHF: [10, 20, 50, 100, 200, 1000], AUD: [5, 10, 20, 50, 100], INR: [10, 20, 50, 100, 200, 500], PHP: [20, 50, 100, 200, 500, 1000], ZAR: [10, 20, 50, 100, 200], MAD: [20, 50, 100, 200], KES: [50, 100, 200, 500, 1000], USD: [1, 2, 5, 10, 20, 50, 100], VES: [5, 10, 20, 50, 100, 200, 500], ARS: [100, 200, 500, 1000, 2000, 10000, 20000], COP: [2000, 5000, 10000, 20000, 50000, 100000], MXN: [20, 50, 100, 200, 500, 1000], CLP: [1000, 2000, 5000, 10000, 20000], PEN: [10, 20, 50, 100, 200], EUR: [5, 10, 20, 50, 100, 200], BRL: [2, 5, 10, 20, 50, 100, 200], GBP: [5, 10, 20, 50], CAD: [5, 10, 20, 50, 100], BOB: [10, 20, 50, 100, 200], CRC: [1000, 2000, 5000, 10000, 20000], GTQ: [1, 5, 10, 20, 50, 100, 200], HNL: [1, 2, 5, 10, 20, 50, 100, 500], NIO: [10, 20, 50, 100, 200, 500, 1000], PYG: [2000, 5000, 10000, 20000, 50000, 100000], DOP: [50, 100, 200, 500, 1000, 2000], UYU: [20, 50, 100, 200, 500, 1000, 2000] };
const COD = { TR: 'TRY', NG: 'NGN', EG: 'EGP', LB: 'LBP', ZW: 'ZWG', PL: 'PLN', CH: 'CHF', AU: 'AUD', IN: 'INR', PH: 'PHP', ZA: 'ZAR', MA: 'MAD', KE: 'KES', AR: 'ARS', BO: 'BOB', BR: 'BRL', CA: 'CAD', CL: 'CLP', CO: 'COP', CR: 'CRC', GB: 'GBP', GT: 'GTQ', HN: 'HNL', MX: 'MXN', NI: 'NIO', PY: 'PYG', PE: 'PEN', DO: 'DOP', UY: 'UYU' };
// Moneda de una forma de pago en efectivo: en Venezuela «Efectivo Bs» es bolívares y «Efectivo $» dólares.
export function monedaEfectivo(P, m) {
  if (/€|Euro/i.test(m) && !P.eur) return { cod: 'EUR', s: '€', otra: true, eur: true };
  if (P.id === 'VE') return /Bs/.test(m) ? { cod: 'VES', s: 'Bs', otra: true } : { cod: 'USD', s: '$', otra: false };
  if (/US\$|USD|Dólar|Efectivo \$/i.test(m)) return { cod: 'USD', s: 'US$', otra: true };
  return { cod: P.eur ? 'EUR' : COD[P.id] || 'USD', s: P.s, otra: false };
}
export const billetesDe = cod => BILLETES[cod] || BILLETES.USD;

// Formato de dinero según el país. Los montos se guardan en la moneda principal del negocio
// (en Venezuela, dólares; la segunda moneda se calcula con la tasa).
export function dinero(P, tasa, tasaEur) {
  const ve = P.id === 'VE', ar = !!P.usd2, dec = P.r >= 100 ? 0 : 2;
  const nf = new Intl.NumberFormat(P.loc, { minimumFractionDigits: dec, maximumFractionDigits: dec });
  const nfc = new Intl.NumberFormat(P.loc, { notation: 'compact', maximumFractionDigits: 1 });
  const nf2 = new Intl.NumberFormat(P.loc, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const sim = P.s + (P.s.length > 1 ? ' ' : '');
  const m = v => (v < -0.004 ? '−' : '') + (P.eur ? nf.format(Math.abs(v)) + ' €' : sim + nf.format(Math.abs(v)));
  return {
    dec, dual: ve || ar,
    m,
    corto: v => P.eur ? nfc.format(v) + ' €' : sim + nfc.format(v),
    s: v => ve ? 'Bs ' + nf2.format(v * (tasa || TASA_VE_RESPALDO)) : ar ? 'US$ ' + nf2.format(v / (tasa || P.r)) : '',
    tasa: tasa || (ve ? TASA_VE_RESPALDO : P.r),
    // Euro: en Venezuela, bolívares por euro; en los de moneda local + dólar, moneda local por euro.
    tasaEur: tasaEur || (ve ? (tasa || TASA_VE_RESPALDO) * EUR_USD : P.r * EUR_USD),
    aEur: (v, te) => ve ? v * (tasa || TASA_VE_RESPALDO) / (te || tasaEur || (tasa || TASA_VE_RESPALDO) * EUR_USD) : v / (te || tasaEur || P.r * EUR_USD),
    deEur: (x, te) => ve ? x * (te || tasaEur || (tasa || TASA_VE_RESPALDO) * EUR_USD) / (tasa || TASA_VE_RESPALDO) : x * (te || tasaEur || P.r * EUR_USD),
    e: v => '€ ' + nf2.format(ve ? v * (tasa || TASA_VE_RESPALDO) / (tasaEur || (tasa || TASA_VE_RESPALDO) * EUR_USD) : v / (tasaEur || P.r * EUR_USD)),
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
