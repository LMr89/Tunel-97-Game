import Phaser from "phaser";
import config from "../data/config.json";
import { escuchar, clasificar } from "../systems/voz";

const heading = { fontFamily: "Oswald, Arial, sans-serif", fontStyle: "bold" };
const text = { fontFamily: "Inter, Arial, sans-serif" };

// Detecta si la voz es de hombre o mujer (solo eso) y lo guarda en registry 'genero'.
// Si no hay micrófono, se niega el permiso o falla, se elige a mano.
export class VozScene extends Phaser.Scene {
  private estado!: Phaser.GameObjects.Text;
  private nivel!: Phaser.GameObjects.Rectangle;
  private ocupado = false;
  private hecho = false;

  constructor() {
    super("Voz");
  }

  create() {
    const { width: w, height: h } = this.scale;
    this.ocupado = false;
    this.hecho = false;
    this.add.rectangle(w / 2, h / 2, w, h, 0x120c08);
    this.add
      .text(w / 2, 90, "TU VOZ", {
        ...heading,
        fontSize: "64px",
        color: "#E0A526",
      })
      .setOrigin(0.5);
    this.add
      .text(
        w / 2,
        150,
        "El juego detecta si tu voz es de hombre o de mujer para elegir a tu personaje.\nNo se guarda ningún audio.",
        { ...text, fontSize: "16px", color: "#D9C3A0", align: "center" },
      )
      .setOrigin(0.5);
    this.estado = this.add
      .text(
        w / 2,
        250,
        'Pulsa GRABAR y di en voz alta: "Túnel noventa y siete"',
        { ...text, fontSize: "18px", color: "#D9C3A0", align: "center" },
      )
      .setOrigin(0.5);
    this.add
      .rectangle(w / 2, 300, 300, 14, 0x2b1d14)
      .setStrokeStyle(1, 0x8c7b64);
    this.nivel = this.add
      .rectangle(w / 2 - 150, 300, 0, 14, 0xe0a526)
      .setOrigin(0, 0.5);

    this.boton(w / 2, 370, "GRABAR", true, () => this.grabar());
    this.boton(w / 2 - 150, 440, "SOY HOMBRE", false, () => this.elegir("M"));
    this.boton(w / 2 + 150, 440, "SOY MUJER", false, () => this.elegir("F"));
    this.add
      .text(
        w / 2,
        h - 24,
        "Teclas: G grabar · H hombre · M mujer · Enter omitir (hombre)",
        { ...text, fontSize: "13px", color: "#8c7b64" },
      )
      .setOrigin(0.5);

    const kb = this.input.keyboard!;
    kb.on("keydown-G", () => this.grabar());
    kb.on("keydown-H", () => this.elegir("M"));
    kb.on("keydown-M", () => this.elegir("F"));
    kb.on("keydown-ENTER", () => this.elegir("M"));
  }

  private async grabar() {
    if (this.ocupado) return;
    this.ocupado = true;
    this.estado.setText("Escuchando…");
    try {
      const hz = await escuchar(config.voz.segundos, (rms) =>
        this.nivel.setSize(Math.min(rms * 1500, 300), 14),
      );
      if (hz === null) {
        this.estado.setText(
          "No se escuchó una voz clara. Prueba otra vez o elige a mano.",
        );
        this.ocupado = false;
        return;
      }
      this.elegir(
        clasificar(hz, config.voz.umbralHz),
        `Voz detectada (${Math.round(hz)} Hz)`,
      );
    } catch {
      this.estado.setText("No hay micrófono o no diste permiso. Elige a mano.");
      this.ocupado = false;
    }
  }

  private elegir(genero: "M" | "F", motivo = "Elegido") {
    if (this.hecho) return;
    this.hecho = true;
    this.registry.set("genero", genero);
    this.estado.setText(`${motivo}: ${genero === "M" ? "hombre" : "mujer"}`);
    this.input.keyboard!.removeAllListeners();
    this.time.delayedCall(900, () => this.scene.start("Menu"));
  }

  private boton(
    x: number,
    y: number,
    label: string,
    primary: boolean,
    onClick: () => void,
  ) {
    const bg = this.add
      .rectangle(x, y, 240, 46, primary ? 0xe0a526 : 0x1d130c, 0.95)
      .setStrokeStyle(2, 0xe0a526)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(x, y, label, {
        ...heading,
        fontSize: "22px",
        color: primary ? "#2B1D14" : "#E0A526",
      })
      .setOrigin(0.5);
    bg.on("pointerdown", onClick);
  }
}
