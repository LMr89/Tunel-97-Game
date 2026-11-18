// Lógica pura (sin Phaser) para poder probarla con node --test.
export const TILE = 32;
export type Grid = readonly string[];

// '#' pared y 'D' puerta cerrada bloquean el paso y la vista.
export const isWall = (g: Grid, px: number, py: number): boolean => {
  const c = g[Math.floor(py / TILE)]?.[Math.floor(px / TILE)] ?? "#";
  return c === "#" || c === "D";
};

/** Distancia que recorre un rayo antes de chocar con una pared (o `max`). */
export function rayLength(
  g: Grid,
  x: number,
  y: number,
  angle: number,
  max: number,
): number {
  const step = 4; // ponytail: muestreo fijo de 4 px; cambiar a DDA si se necesita exactitud
  for (let d = 0; d < max; d += step) {
    if (isWall(g, x + Math.cos(angle) * d, y + Math.sin(angle) * d)) return d;
  }
  return max;
}

export function canSee(
  g: Grid,
  gx: number,
  gy: number,
  facing: number,
  tx: number,
  ty: number,
  rangePx: number,
  coneDeg: number,
): { seen: boolean; dist: number } {
  const dist = Math.hypot(tx - gx, ty - gy);
  const angle = Math.atan2(ty - gy, tx - gx);
  const diff = Math.abs(
    Math.atan2(Math.sin(angle - facing), Math.cos(angle - facing)),
  );
  const seen =
    dist <= rangePx &&
    diff <= (coneDeg / 2) * (Math.PI / 180) &&
    rayLength(g, gx, gy, angle, dist) >= dist;
  return { seen, dist };
}

/** Velocidad de llenado del medidor (fracción/s): 1/1.5 s cerca, 1/3 s en el límite. */
export function fillRate(
  dist: number,
  rangePx: number,
  near: number,
  far: number,
  sneak: boolean,
  sneakFactor: number,
): number {
  const secs = near + (far - near) * Math.min(dist / rangePx, 1);
  return (1 / secs) * (sneak ? sneakFactor : 1);
}
