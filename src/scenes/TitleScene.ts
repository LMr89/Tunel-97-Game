import Phaser from "phaser";
import config from "../data/config.json";

const heading = { fontFamily: "Oswald, Arial, sans-serif", fontStyle: "bold" };
const text = { fontFamily: "Inter, Arial, sans-serif" };

// Pantalla de inicio: título, integrantes y "pulsa para empezar". Los textos salen de data/config.json.
export class TitleScene extends Phaser.Scene {
  constructor() {
    super("Title");
  }

  create() {
    const { width: w, height: h } = this.scale;
    this.add.rectangle(w / 2, h / 2, w, h, 0x120c08);
    this.dust(w, h);

    this.add
      .text(w / 2, 100, config.titulo, {
        ...heading,
        fontSize: "104px",
        color: "#E0A526",
      })
      .setOrigin(0.5)
      .setShadow(0, 6, "#000000", 10, false, true);
    this.add.rectangle(w / 2, 168, 260, 3, 0xe0a526);
    this.add
      .text(w / 2, 196, config.subtitulo, {
        ...text,
        fontSize: "16px",
        color: "#D9C3A0",
      })
      .setOrigin(0.5)
      .setLetterSpacing(4);

    this.add
      .text(w / 2, 262, "INTEGRANTES", {
        ...heading,
        fontSize: "18px",
        color: "#E0A526",
      })
      .setOrigin(0.5)
      .setLetterSpacing(3);
    const lista = config.integrantes
      .map((i) => `${i.nombre}  ·  ${i.rol}`)
      .join("\n");
    this.add
      .text(w / 2, 288, lista, {
        ...text,
        fontSize: "18px",
        color: "#D9C3A0",
        align: "center",
        lineSpacing: 6,
      })
      .setOrigin(0.5, 0);

    this.add
      .text(
        w / 2,
        h - 90,
        `${config.curso} · ${config.ciclo} · ${config.universidad}\nDocente: ${config.docente}`,
        { ...text, fontSize: "14px", color: "#8c7b64", align: "center" },
      )
      .setOrigin(0.5);

    const start = this.add
      .text(w / 2, h - 36, "PRESIONA CUALQUIER TECLA O CLIC", {
        ...heading,
        fontSize: "20px",
        color: "#D9C3A0",
      })
      .setOrigin(0.5)
      .setLetterSpacing(3);
    this.tweens.add({
      targets: start,
      alpha: 0.25,
      duration: 700,
      yoyo: true,
      repeat: -1,
    });

    this.input.keyboard?.once("keydown", () => this.go());
    this.input.once("pointerdown", () => this.go());
  }

  private go() {
    this.scene.start("Voz");
  }

  /** Polvo que sube lento: da vida al fondo sin assets. */
  private dust(w: number, h: number) {
    for (let i = 0; i < 40; i++) {
      const p = this.add.rectangle(
        Phaser.Math.Between(0, w),
        Phaser.Math.Between(0, h),
        3,
        3,
        0xd9c3a0,
        0.25,
      );
      this.tweens.add({
        targets: p,
        y: p.y - Phaser.Math.Between(40, 120),
        alpha: 0,
        duration: Phaser.Math.Between(3000, 7000),
        repeat: -1,
        delay: Phaser.Math.Between(0, 4000),
      });
    }
  }
}
