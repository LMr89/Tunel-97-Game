// Progreso en localStorage. Todo va en try/catch: en ventana privada puede no estar disponible.
const KEY = "tunel97";
type Datos = { desbloqueados: number; mejores: Record<number, number> };

const leer = (): Datos => {
  try {
    return {
      desbloqueados: 1,
      mejores: {},
      ...JSON.parse(localStorage.getItem(KEY) ?? "{}"),
    };
  } catch {
    return { desbloqueados: 1, mejores: {} };
  }
};
const escribir = (d: Datos) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(d));
  } catch {
    /* sin guardado */
  }
};

export const desbloqueados = () => leer().desbloqueados;
export const mejorTiempo = (nivel: number) => leer().mejores[nivel];

/** Registra un nivel superado (índice desde 0): desbloquea el siguiente y guarda el mejor tiempo. */
export function superado(nivel: number, segundos: number) {
  const d = leer();
  d.desbloqueados = Math.max(d.desbloqueados, nivel + 2);
  d.mejores[nivel] = Math.min(d.mejores[nivel] ?? Infinity, segundos);
  escribir(d);
}
