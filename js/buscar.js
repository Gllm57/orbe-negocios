// Búsqueda tolerante: sin acentos ni mayúsculas, con errores de tipeo, singular o plural,
// palabras en cualquier orden y el comienzo de una palabra. Ordena por parecido.

export const normal = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
// Raíz simple en español: «empanadas» → «empanada», «papas» → «papa», «refrescos» → «refresco».
const raiz = t => t.length > 4 && t.endsWith('es') && !/[aeiou]es$/.test(t) ? t.slice(0, -2) : t.length > 3 && t.endsWith('s') ? t.slice(0, -1) : t;

// Distancia de edición (con letras cambiadas de lugar), cortando apenas supera el máximo.
function distancia(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev2 = null, prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]; let menor = i;
    for (let j = 1; j <= b.length; j++) {
      const c = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + c);
      if (prev2 && i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, prev2[j - 2] + 1);
      cur[j] = v; if (v < menor) menor = v;
    }
    if (menor > max) return max + 1;
    prev2 = prev; prev = cur;
  }
  return prev[b.length];
}

// Qué tan bien coincide una palabra buscada con una palabra del nombre (0 = nada, 1 = igual).
function parecido(q, w) {
  if (w === q) return 1;
  const rq = raiz(q), rw = raiz(w);
  if (rq === rw) return 0.95;
  if (w.startsWith(q)) return q.length >= 2 ? 0.9 : 0.6;
  if (q.length >= 3 && w.includes(q)) return 0.7;
  if (/^\d+$/.test(q)) return 0;
  const tol = q.length >= 7 ? 2 : q.length >= 4 ? 1 : 0;
  if (!tol) return 0;
  if (distancia(rq, rw, tol) <= tol) return 0.65 - 0.1 * distancia(rq, rw, tol);
  // Comienzo con un error: «hambur» ~ «hamburguesa».
  if (q.length >= 4 && distancia(q, w.slice(0, q.length), 1) <= 1) return 0.5;
  return 0;
}

// Busca en una lista. textos(x) devuelve los textos de cada elemento (nombre, código, grupo…).
// Devuelve los que coinciden, del más parecido al menos. Con «suelto», alcanza con que coincida una palabra.
export function buscar(lista, q, textos, suelto) {
  const qs = normal(q).split(' ').filter(Boolean);
  if (!qs.length) return lista.slice();
  const out = [];
  lista.forEach((x, idx) => {
    const ts = textos(x).filter(Boolean).map(normal);
    const codigo = ts.some(t => t.replace(/ /g, '') === qs.join(''));
    const palabras = ts.join(' ').split(' ').filter(Boolean);
    let suma = 0, encontradas = 0;
    qs.forEach(q => { const p = palabras.reduce((m, w) => Math.max(m, parecido(q, w)), 0); if (p > 0) encontradas++; suma += p; });
    if (!codigo && (suelto ? !encontradas : encontradas < qs.length)) return;
    let puntos = codigo ? 10 : suma / qs.length;
    if (!codigo && normal(ts[0]).startsWith(normal(q))) puntos += 0.3;
    out.push({ x, puntos, idx });
  });
  out.sort((a, b) => b.puntos - a.puntos || a.idx - b.idx);
  // Si hay coincidencias claras, se esconden las que solo se parecen por un error de tipeo.
  const mejor = out.length ? out[0].puntos : 0;
  return (mejor >= 0.9 && !suelto ? out.filter(r => r.puntos >= 0.75) : out).map(r => r.x);
}

// Para «¿Quisiste decir…?»: los más parecidos aunque no coincidan todas las palabras.
export const parecidos = (lista, q, textos, n = 4) => buscar(lista, q, textos, true).slice(0, n);
