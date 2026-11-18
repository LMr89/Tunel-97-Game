import Phaser from "phaser";
import config from "../data/config.json" with { type: "json" };

// Efectos visuales cortos. Se pueden apagar desde config.json → efectos.
const { sacudida: SACUDIDA, particulas: PARTICULAS } = config.efectos;

export const sacudida = (scene: Phaser.Scene, ms = 120, fuerza = 0.004) => {
  if (SACUDIDA) scene.cameras.main.shake(ms, fuerza);
};

/** Partículas simples: círculos que salen en todas direcciones y se desvanecen. */
export function chispas(
  scene: Phaser.Scene,
  x: number,
  y: number,
  color = 0xffe9a0,
  n = 6,
  dist = 22,
) {
  if (!PARTICULAS) return;
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2,
      d = dist * (0.5 + Math.random() * 0.5);
    const p = scene.add.circle(x, y, 2, color).setDepth(7);
    scene.tweens.add({
      targets: p,
      x: x + Math.cos(a) * d,
      y: y + Math.sin(a) * d,
      alpha: 0,
      duration: 260,
      onComplete: () => p.destroy(),
    });
  }
}

/** Nube de polvo bajo los pies al caminar. */
export function polvo(scene: Phaser.Scene, x: number, y: number) {
  if (!PARTICULAS) return;
  const p = scene.add.circle(x, y, 3, 0xb89a72, 0.5).setDepth(4);
  scene.tweens.add({
    targets: p,
    scale: 2.2,
    alpha: 0,
    y: y - 6,
    duration: 450,
    onComplete: () => p.destroy(),
  });
}

/** Onda de fuego de una explosión. `radio` en px. */
export function estallido(
  scene: Phaser.Scene,
  x: number,
  y: number,
  radio: number,
) {
  const o = scene.add
    .circle(x, y, radio * 0.2, 0xffa030, 0.85)
    .setDepth(7)
    .setBlendMode(Phaser.BlendModes.ADD);
  scene.tweens.add({
    targets: o,
    scale: 5,
    alpha: 0,
    duration: 420,
    onComplete: () => o.destroy(),
  });
  chispas(scene, x, y, 0xffd070, 14, radio);
}

/** Signo "!" sobre un sprite cuando un guardia descubre al jugador. */
export function alerta(scene: Phaser.Scene, x: number, y: number) {
  const t = scene.add
    .text(x, y, "!", {
      fontFamily: "Oswald, Arial",
      fontSize: "28px",
      color: "#D9372B",
      fontStyle: "bold",
    })
    .setOrigin(0.5)
    .setDepth(9);
  scene.tweens.add({
    targets: t,
    y: y - 14,
    scale: 1.4,
    alpha: 0,
    duration: 700,
    onComplete: () => t.destroy(),
  });
}

/** Oscurece los bordes de la pantalla. Se llama una vez en create(). */
export function vineta(scene: Phaser.Scene) {
  const { width: w, height: h } = scene.scale;
  const tex = (
    scene.textures.exists("vineta")
      ? scene.textures.get("vineta")
      : scene.textures.createCanvas("vineta", w, h)
  ) as Phaser.Textures.CanvasTexture;
  const c = tex.getContext(),
    g = c.createRadialGradient(w / 2, h / 2, h * 0.35, w / 2, h / 2, h * 0.95);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, "rgba(0,0,0,0.55)");
  c.fillStyle = g;
  c.fillRect(0, 0, w, h);
  tex.refresh();
  scene.add.image(0, 0, "vineta").setOrigin(0).setScrollFactor(0).setDepth(9);
}
