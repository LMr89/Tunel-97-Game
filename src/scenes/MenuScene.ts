import Phaser from "phaser";
import { LEVELS } from "../data/levels";
import { desbloqueados } from "../systems/guardado";

const AMBER = 0xe0a526,
  DARK = 0x2b1d14,
  SAND = "#D9C3A0";
const title = (
  size: number,
  color: string,
): Phaser.Types.GameObjects.Text.TextStyle => ({
  fontFamily: "Oswald, Arial, sans-serif",
  fontSize: `${size}px`,
  color,
  fontStyle: "bold",
});
const body = (
  size: number,
  color: string,
): Phaser.Types.GameObjects.Text.TextStyle => ({
  fontFamily: "Inter, Arial, sans-serif",
  fontSize: `${size}px`,
  color,
});

const CONTROLS = [
  "W A S D / Flechas / Stick izq.  ·  Mover",
  "Shift / L1  ·  Sigilo (más lento y silencioso)",
  "E (mantener) / ○  ·  Abrir barricada o escotilla",
  "Espacio, clic / R2 o ✕  ·  Disparar (stick der. apunta)",
  "R / □  ·  Recargar          F / △  ·  Lanzar piedra (atrae guardias)",
  "Q / L2 (mantener)  ·  Escudo      P / Esc / Start  ·  Pausa",
  "Nichos: escóndete dentro. Checkpoints: guardan tu avance.",
  "",
  "Evita el cono rojo de los guardias y llega a la escotilla.",
];

export class MenuScene extends Phaser.Scene {
  private cone!: Phaser.GameObjects.Graphics;
  private help?: Phaser.GameObjects.Container;

  constructor() {
    super("Menu");
  }

  preload() {
    this.load.audio("music", "assets/main_sound.mp3");
    // Comando: 8 direcciones, 12 cuadros por dirección (SovDigital). Terroristas: Craftpix.
    for (const a of ["idle", "walk", "run", "attack3"]) {
      this.load.spritesheet(`fs_${a}`, `assets/footsoldier/${a}.png`, {
        frameWidth: 134,
        frameHeight: 128,
      });
    }
    this.load.spritesheet("fx_muzzle", "assets/fx/muzzle.png", {
      frameWidth: 128,
      frameHeight: 64,
    }); // Explosion FX Free, CC BY 4.0
    for (const a of ["Idle", "Walk"]) {
      this.load.spritesheet(`s2_${a}`, `assets/soldiers/s2_${a}.png`, {
        frameWidth: 128,
        frameHeight: 128,
      });
    }
  }

  create() {
    this.createAnims();
    // El sonido es global: sigue sonando al cambiar de escena. Se activa con el primer clic/tecla.
    if (!this.sound.get("music"))
      this.sound.add("music", { loop: true, volume: 0.4 }).play();
    const { width: w, height: h } = this.scale;

    this.drawBackground(w, h);
    this.drawTunnelScene(w);

    this.add
      .text(w / 2, 92, "TÚNEL 97", title(96, "#E0A526"))
      .setOrigin(0.5)
      .setShadow(0, 6, "#000000", 10, false, true);
    this.add.rectangle(w / 2, 150, 240, 3, AMBER);
    this.add
      .text(w / 2, 178, "UNA MISIÓN DE SIGILO BAJO TIERRA", body(16, SAND))
      .setOrigin(0.5)
      .setLetterSpacing(4);

    this.button(w / 2, 240, "JUGAR", true, () =>
      this.scene.start("Level", { nivel: 0 }),
    );
    this.button(w / 2, 300, "CÓMO JUGAR", false, () => this.toggleHelp());
    this.selectorNiveles(w / 2, 340);
    this.input.keyboard?.on(
      "keydown-ENTER",
      () => !this.help && this.scene.start("Level", { nivel: 0 }),
    );

    this.add
      .text(
        w / 2,
        h - 18,
        "Obra de ficción inspirada en hechos reales. No representa personas reales.",
        body(12, "#8c7b64"),
      )
      .setOrigin(0.5);
  }

  private createAnims() {
    if (this.anims.exists("s2_Walk")) return;
    for (const a of ["Idle", "Walk"]) {
      this.anims.create({
        key: `s2_${a}`,
        frames: this.anims.generateFrameNumbers(`s2_${a}`),
        frameRate: 8,
        repeat: -1,
      });
    }
    this.anims.create({
      key: "fx_muzzle",
      frames: this.anims.generateFrameNumbers("fx_muzzle"),
      frameRate: 30,
    });
    // Filas del spritesheet: S, SE, E, NE, N, NW, W, SW
    for (let d = 0; d < 8; d++)
      for (const [a, fps] of [
        ["idle", 16],
        ["walk", 20],
        ["run", 24],
        ["attack3", 24],
      ] as const) {
        this.anims.create({
          key: `fs_${a}_${d}`,
          frameRate: fps,
          repeat: -1,
          frames: this.anims.generateFrameNumbers(`fs_${a}`, {
            start: d * 12,
            end: d * 12 + 11,
          }),
        });
      }
  }

  /** Roca moteada con degradado oscuro (viñeta) para que el texto destaque. */
  private drawBackground(w: number, h: number) {
    const rnd = new Phaser.Math.RandomDataGenerator(["menu97"]);
    const g = this.add.graphics();
    g.fillStyle(0x4a4d53).fillRect(0, 0, w, h);
    for (let i = 0; i < 700; i++) {
      g.fillStyle(rnd.pick([0x15171a, 0x5d6168, 0x3b3e43])).fillRect(
        rnd.between(0, w),
        rnd.between(0, h),
        rnd.between(2, 6),
        rnd.between(2, 5),
      );
    }
    g.fillGradientStyle(
      0x120c08,
      0x120c08,
      0x2b1d14,
      0x2b1d14,
      0.94,
      0.94,
      0.8,
      0.8,
    ).fillRect(0, 0, w, h);
  }

  /** Túnel inferior: el Comando camina y un guardia barre el cono. */
  private drawTunnelScene(w: number) {
    const top = 392,
      hh = 96,
      feet = top + 74;
    this.add.rectangle(w / 2, top + hh / 2, w, hh, 0x5a3d28);
    this.add.rectangle(w / 2, top + 3, w, 6, 0x2b1d14);
    this.add.rectangle(w / 2, top + hh - 3, w, 6, 0x2b1d14);

    const guardX = 800;
    const guard = this.add
      .sprite(guardX, feet, "s2_Idle")
      .setOrigin(0.5, 0.69)
      .setScale(0.75)
      .setFlipX(true)
      .setTint(0xffb0a8)
      .play("s2_Idle");
    guard.setDepth(2);
    this.cone = this.add.graphics().setDepth(1);
    const sweep = { a: 0 };
    this.tweens.add({
      targets: sweep,
      a: 0.3,
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut",
    });
    const redraw = () => {
      const half = Math.PI / 6,
        c = Math.PI + sweep.a,
        y = feet - 24;
      this.cone
        .clear()
        .fillStyle(0xd9372b, 0.3)
        .slice(guardX - 20, y, 230, c - half, c + half, false)
        .fillPath()
        .lineStyle(2, 0xd9372b, 0.8)
        .beginPath()
        .arc(guardX - 20, y, 230, c - half, c + half)
        .strokePath();
    };
    this.events.on("update", redraw);
    this.events.once("shutdown", () => this.events.off("update", redraw));

    const hero = this.add
      .sprite(-60, feet, "fs_walk")
      .setOrigin(67 / 134, 112 / 128)
      .setScale(0.75)
      .setDepth(3)
      .play("fs_walk_2");
    this.tweens.add({
      targets: hero,
      x: guardX - 330,
      duration: 7000,
      repeat: -1,
      repeatDelay: 600,
    });
  }

  private button(
    x: number,
    y: number,
    label: string,
    primary: boolean,
    onClick: () => void,
  ) {
    const bg = this.add
      .rectangle(x, y, 280, 52, primary ? AMBER : 0x1d130c, primary ? 1 : 0.85)
      .setStrokeStyle(2, AMBER)
      .setInteractive({ useHandCursor: true });
    const txt = this.add
      .text(x, y, label, title(26, primary ? "#2B1D14" : "#E0A526"))
      .setOrigin(0.5)
      .setLetterSpacing(3);
    bg.on("pointerover", () => {
      bg.setScale(1.05);
      txt.setScale(1.05);
    });
    bg.on("pointerout", () => {
      bg.setScale(1);
      txt.setScale(1);
    });
    bg.on("pointerdown", onClick);
  }

  /** Fila de botones numerados; los niveles sin superar el anterior aparecen bloqueados. */
  private selectorNiveles(cx: number, y: number) {
    const libres = desbloqueados(),
      paso = 56;
    this.add
      .text(cx, y, "NIVELES", body(12, "#8c7b64"))
      .setOrigin(0.5)
      .setLetterSpacing(3);
    LEVELS.forEach((lv, i) => {
      const x = cx + (i - (LEVELS.length - 1) / 2) * paso,
        ok = i < libres;
      const bg = this.add
        .rectangle(x, y + 30, 46, 40, ok ? 0x1d130c : 0x120c08, 0.9)
        .setStrokeStyle(2, ok ? AMBER : 0x4a3a2a);
      this.add
        .text(
          x,
          y + 30,
          ok ? String(i + 1) : "🔒",
          title(22, ok ? "#E0A526" : "#4a3a2a"),
        )
        .setOrigin(0.5);
      if (ok)
        bg.setInteractive({ useHandCursor: true })
          .on("pointerdown", () => this.scene.start("Level", { nivel: i }))
          .setData("n", lv.nombre);
    });
  }

  private toggleHelp() {
    if (this.help) {
      this.help.destroy();
      this.help = undefined;
      return;
    }
    const { width: w, height: h } = this.scale;
    const panel = this.add
      .rectangle(w / 2, h / 2, 760, 380, 0x120c08, 0.96)
      .setStrokeStyle(2, AMBER);
    const head = this.add
      .text(w / 2, h / 2 - 155, "CÓMO JUGAR", title(32, "#E0A526"))
      .setOrigin(0.5);
    const lines = this.add
      .text(w / 2, h / 2 - 105, CONTROLS.join("\n"), {
        ...body(16, SAND),
        lineSpacing: 7,
        align: "center",
      })
      .setOrigin(0.5, 0);
    const close = this.add
      .text(w / 2, h / 2 + 165, "Clic para cerrar", body(14, "#8c7b64"))
      .setOrigin(0.5);
    panel.setInteractive().on("pointerdown", () => this.toggleHelp());
    this.help = this.add
      .container(0, 0, [panel, head, lines, close])
      .setDepth(20);
  }
}
