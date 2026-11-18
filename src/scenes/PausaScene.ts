import Phaser from "phaser";
import { createInput } from "../systems/input";

// Se superpone al nivel mientras este permanece detenido.
export class PausaScene extends Phaser.Scene {
  constructor() {
    super("Pausa");
  }

  create() {
    const { width: w, height: h } = this.scale;
    this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.6);
    this.add
      .text(w / 2, h / 2 - 30, "PAUSA", {
        fontFamily: "Oswald, Arial",
        fontSize: "72px",
        color: "#E0A526",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    this.add
      .text(
        w / 2,
        h / 2 + 30,
        "P / Esc / Start: continuar     M: menú principal",
        { fontFamily: "Inter, Arial", fontSize: "18px", color: "#D9C3A0" },
      )
      .setOrigin(0.5);
    const inp = createInput(this);
    const abierta = this.time.now;
    this.input.keyboard!.once("keydown-M", () => {
      this.scene.stop("Level");
      this.scene.stop("Hud");
      this.scene.start("Menu");
    });
    this.events.on("update", () => {
      // la misma pulsación que abrió la pausa no debe cerrarla
      if (this.time.now - abierta > 300 && inp.read().pause) {
        this.scene.resume("Level");
        this.scene.stop();
      }
    });
  }
}
