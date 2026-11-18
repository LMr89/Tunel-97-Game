import type Phaser from "phaser";

export interface Luz {
  x: number;
  y: number;
  r: number;
}

/**
 * Capa oscura que cubre la pantalla con "agujeros" de luz. Es un canvas que se repinta cada fotograma:
 * se rellena de oscuro y luego se borra (destination-out) alrededor de cada luz.
 */
export function crearNoche(scene: Phaser.Scene, oscuridad: number) {
  const { width: w, height: h } = scene.scale;
  const tex = (
    scene.textures.exists("noche")
      ? scene.textures.get("noche")
      : scene.textures.createCanvas("noche", w, h)
  ) as Phaser.Textures.CanvasTexture;
  scene.add.image(0, 0, "noche").setOrigin(0).setScrollFactor(0).setDepth(8);
  const c = tex.getContext(),
    cam = scene.cameras.main;

  return {
    /** `luces` y `conos` vienen en coordenadas del mundo. */
    actualizar(luces: Luz[], conos: { x: number; y: number }[][]) {
      c.globalCompositeOperation = "source-over";
      c.clearRect(0, 0, w, h);
      c.fillStyle = `rgba(4,7,18,${oscuridad})`;
      c.fillRect(0, 0, w, h);
      c.globalCompositeOperation = "destination-out";
      for (const l of luces) {
        const x = l.x - cam.scrollX,
          y = l.y - cam.scrollY;
        const g = c.createRadialGradient(x, y, l.r * 0.2, x, y, l.r);
        g.addColorStop(0, "rgba(0,0,0,1)");
        g.addColorStop(1, "rgba(0,0,0,0)");
        c.fillStyle = g;
        c.beginPath();
        c.arc(x, y, l.r, 0, Math.PI * 2);
        c.fill();
      }
      c.fillStyle = "rgba(0,0,0,0.55)"; // los conos de los guardias (linternas) también iluminan
      for (const poly of conos) {
        c.beginPath();
        poly.forEach((p, i) =>
          i
            ? c.lineTo(p.x - cam.scrollX, p.y - cam.scrollY)
            : c.moveTo(p.x - cam.scrollX, p.y - cam.scrollY),
        );
        c.closePath();
        c.fill();
      }
      tex.refresh();
    },
  };
}
