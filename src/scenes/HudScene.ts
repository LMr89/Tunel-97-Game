import Phaser from "phaser";

const SAND = "#D9C3A0";
const txt = (
  size: number,
  color = SAND,
): Phaser.Types.GameObjects.Text.TextStyle => ({
  fontFamily: "Arial",
  fontSize: `${size}px`,
  color,
});

// Solo lee el registro; nunca controla al gameplay.
export class HudScene extends Phaser.Scene {
  private bar!: Phaser.GameObjects.Graphics;
  private info!: Phaser.GameObjects.Text;
  private ammo!: Phaser.GameObjects.Text;
  private aviso!: Phaser.GameObjects.Text;
  private inventario!: Phaser.GameObjects.Text;
  private nivel!: Phaser.GameObjects.Text;

  constructor() {
    super("Hud");
  }

  create() {
    const { width: w, height: h } = this.scale;
    this.bar = this.add.graphics();
    this.add.text(16, 8, "DETECCIÓN", txt(14));
    this.add.text(16, 30, "VIDA", txt(14));
    this.info = this.add.text(w / 2, h - 80, "", txt(16)).setOrigin(0.5);
    this.aviso = this.add
      .text(w / 2, 56, "", { ...txt(22, "#E0A526"), fontStyle: "bold" })
      .setOrigin(0.5);
    this.inventario = this.add.text(w - 16, 8, "", txt(14)).setOrigin(1, 0);
    this.nivel = this.add
      .text(w - 16, 30, "", txt(14, "#8c7b64"))
      .setOrigin(1, 0);
    this.add.text(16, h - 62, "BALAS  [R / □] recargar", txt(13));
    this.ammo = this.add.text(16, h - 44, "", {
      fontFamily: "Oswald, Arial, sans-serif",
      fontSize: "30px",
      color: "#E0A526",
      fontStyle: "bold",
    });
  }

  update() {
    const get = <T>(k: string, d: T) =>
      (this.registry.get(k) as T | undefined) ?? d;
    const d = get("detection", 0),
      hp = get("hp", 1),
      esc = get("escudo", 0);
    this.bar
      .clear()
      .fillStyle(0x2b1d14, 0.8)
      .fillRect(110, 8, 200, 16)
      .fillStyle(d > 0.6 ? 0xd9372b : 0xe0a526)
      .fillRect(110, 8, 200 * d, 16)
      .fillStyle(0x2b1d14, 0.8)
      .fillRect(110, 30, 200, 16)
      .fillStyle(hp > 0.35 ? 0x5fae5a : 0xd9372b)
      .fillRect(110, 30, 200 * hp, 16);
    if (esc > 0)
      this.bar
        .fillStyle(0x2b1d14, 0.8)
        .fillRect(110, 50, 200, 8)
        .fillStyle(0x7fb4d6)
        .fillRect(110, 50, 200 * esc, 8);
    this.ammo.setText(get("ammo", ""));
    this.info.setText(get("prompt", ""));
    this.aviso.setText(get("aviso", ""));
    this.inventario.setText(get("inventario", ""));
    this.nivel.setText(get("nivel", ""));
  }
}
