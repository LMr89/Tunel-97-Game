import Phaser from "phaser";
import { LEVELS } from "../data/levels";
import { mejorTiempo } from "../systems/guardado";

const heading = { fontFamily: "Oswald, Arial, sans-serif", fontStyle: "bold" };
const text = { fontFamily: "Inter, Arial, sans-serif" };
const fmt = (s: number) =>
  `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

interface Datos {
  nivel: number;
  t: number;
  docs: number;
  total: number;
  muertes: number;
}

export class ResultadosScene extends Phaser.Scene {
  constructor() {
    super("Resultados");
  }

  create(d: Datos) {
    const { width: w, height: h } = this.scale;
    const siguiente = LEVELS[d.nivel + 1];
    this.add.rectangle(w / 2, h / 2, w, h, 0x120c08);
    this.add
      .text(w / 2, 90, "NIVEL SUPERADO", {
        ...heading,
        fontSize: "64px",
        color: "#E0A526",
      })
      .setOrigin(0.5);
    this.add
      .text(w / 2, 150, `Nivel ${d.nivel + 1}: ${LEVELS[d.nivel]!.nombre}`, {
        ...text,
        fontSize: "18px",
        color: "#D9C3A0",
      })
      .setOrigin(0.5);
    const mejor = mejorTiempo(d.nivel);
    const filas = [
      `Tiempo: ${fmt(d.t)}${mejor !== undefined ? `   (mejor: ${fmt(mejor)})` : ""}`,
      `Documentos: ${d.docs} / ${d.total}`,
      `Veces que te descubrieron o eliminaron: ${d.muertes}`,
    ];
    this.add
      .text(w / 2, 230, filas.join("\n"), {
        ...text,
        fontSize: "24px",
        color: "#D9C3A0",
        align: "center",
        lineSpacing: 14,
      })
      .setOrigin(0.5, 0);

    const next = () =>
      this.scene.start(
        siguiente ? "Level" : "Menu",
        siguiente ? { nivel: d.nivel + 1 } : undefined,
      );
    this.add
      .text(
        w / 2,
        h - 80,
        siguiente ? "ENTER / ✕: siguiente nivel" : "ENTER / ✕: volver al menú",
        { ...heading, fontSize: "22px", color: "#E0A526" },
      )
      .setOrigin(0.5);
    this.add
      .text(w / 2, h - 46, "R: repetir nivel     M: menú", {
        ...text,
        fontSize: "14px",
        color: "#8c7b64",
      })
      .setOrigin(0.5);
    const kb = this.input.keyboard!;
    kb.once("keydown-ENTER", next);
    kb.once("keydown-R", () => this.scene.start("Level", { nivel: d.nivel }));
    kb.once("keydown-M", () => this.scene.start("Menu"));
    this.input.once("pointerdown", next);
    // mando: ✕ avanza
    const vigila = () => {
      if (
        [...(navigator.getGamepads?.() ?? [])].some(
          (g) => g?.buttons[0]?.pressed,
        )
      ) {
        this.events.off("update", vigila);
        next();
      }
    };
    this.time.delayedCall(500, () => this.events.on("update", vigila));
  }
}
