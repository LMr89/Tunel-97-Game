// Lógica pura (sin Phaser). Los objetos del nivel se escriben directo en el mapa de texto:
//   J inicio  H escotilla  N nicho  C checkpoint  P documento  K llave  D puerta (pide llave)
//   S escudo  M botiquín   B bomba
export type Marca = "J" | "H" | "N" | "C" | "P" | "K" | "D" | "S" | "M" | "B";
export const MARCAS = "JHNCPKDSMB";

/** Devuelve la posición en tiles [x, y] de cada marca del mapa. */
export function escanear(
  mapa: readonly string[],
): Record<Marca, [number, number][]> {
  const out = Object.fromEntries(
    [...MARCAS].map((m) => [m, [] as [number, number][]]),
  ) as Record<Marca, [number, number][]>;
  mapa.forEach((fila, y) =>
    [...fila].forEach((c, x) => {
      if (MARCAS.includes(c)) out[c as Marca].push([x, y]);
    }),
  );
  return out;
}

/** Daño de una explosión: máximo en el centro y cae en línea recta hasta 0 en el borde del radio. */
export const danoExplosion = (dist: number, radio: number, max: number) =>
  dist >= radio ? 0 : Math.round(max * (1 - dist / radio));
