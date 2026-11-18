import nivel1 from "./nivel1.json" with { type: "json" };
import nivel2 from "./nivel2.json" with { type: "json" };
import nivel3 from "./nivel3.json" with { type: "json" };
import nivel4 from "./nivel4.json" with { type: "json" };

// x, y en tiles. Con `b` el guardia patrulla de a a b; sin `b` es vigía.
// tipo: fusilero (por defecto, solo vigila), cuchillero (ataca cuerpo a cuerpo), granadero (lanza granadas).
export interface GuardCfg {
  a: [number, number];
  b?: [number, number];
  tipo?: "fusilero" | "cuchillero" | "granadero";
}
// x, y en tiles; w, h en px. `sellada`: no se puede abrir.
export interface BarricadaCfg {
  x: number;
  y: number;
  w: number;
  h: number;
  sellada?: boolean;
}
// t: charco | antorcha | tuberia. x, y en tiles; w = largo de la tubería en tiles.
export interface DecoCfg {
  t: "charco" | "antorcha" | "tuberia";
  x: number;
  y: number;
  w?: number;
}
// mapa: '#' pared, '.' suelo y las marcas de systems/mapa.ts (J, H, N, C, P, K, D, S, M, B).
export interface Level {
  nombre: string;
  mapa: string[];
  guardias: GuardCfg[];
  barricadas: BarricadaCfg[];
  ambiente?: "noche";
  luces?: [number, number][];
  decoracion?: DecoCfg[];
}

// Para añadir un nivel: crear nivelN.json con esta forma y agregarlo aquí.
export const LEVELS: Level[] = [nivel1, nivel2, nivel3, nivel4] as Level[];
