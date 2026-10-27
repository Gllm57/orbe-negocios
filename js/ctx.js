// Contexto compartido: datos, país, moneda, navegación y hojas.
import { createContext, useContext } from './lib/preact-htm.js';
export const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);
