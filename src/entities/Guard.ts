import Phaser from "phaser";
import params from "../data/params.json";
import { TILE, rayLength, isWall, type Grid } from "../systems/vision";
import type { GuardCfg } from "../data/levels";

const px = (t: number) => t * TILE;
const WATCH_SECS = 4; // el vigía cambia de lado cada 4 s
const INVESTIGAR_SECS = 2; // espera en el punto del ruido antes de volver
const TINTES = {
  fusilero: 0xffb0a8,
  cuchillero: 0xffd27a,
  granadero: 0xb0a0ff,
};

// patrol -> chase (lo ve) -> return (lo pierde); investigate: va a un ruido y luego vuelve.
export type Modo = "patrol" | "chase" | "investigate" | "return";

/** Un guardia: su sprite, su ruta y su máquina de estados. Los ataques los resuelve el nivel. */
export class Guard {
  readonly sprite: Phaser.GameObjects.Sprite;
  readonly tipo: NonNullable<GuardCfg["tipo"]>;
  hp = params.guardHp;
  mode: Modo = "patrol";
  angry = false; // lo hirieron: persigue aunque el jugador dispare
  facing: number;
  cooldown = 0; // espera entre ataques (cuchillo) o granadas
  private to: 0 | 1 = 1;
  private timer = 0;
  private lost = 0;
  private stuck = 0;
  private foco = { x: 0, y: 0 };

  constructor(
    private scene: Phaser.Scene,
    private map: Grid,
    readonly cfg: GuardCfg,
  ) {
    this.tipo = cfg.tipo ?? "fusilero";
    this.facing = cfg.b ? 0 : Math.PI;
    // sprite lateral de 128 px; el origen cae en el centro del cuerpo (pies)
    this.sprite = scene.add
      .sprite(px(cfg.a[0]), px(cfg.a[1]), "s2_Idle")
      .setOrigin(0.5, 0.69)
      .setScale(0.6)
      .setDepth(5)
      .setTint(TINTES[this.tipo])
      .play("s2_Walk");
  }

  get x() {
    return this.sprite.x;
  }
  get y() {
    return this.sprite.y;
  }

  /** Un ruido lo hace investigar, salvo que ya persiga. */
  oir(x: number, y: number) {
    if (this.mode === "chase" || this.mode === "investigate") return;
    this.mode = "investigate";
    this.foco = { x, y };
    this.timer = 0;
    this.stuck = 0;
  }

  update(
    dt: number,
    tx: number,
    ty: number,
    spotted: boolean,
    shooting: boolean,
  ) {
    this.cooldown -= dt;
    if (spotted) {
      this.mode = "chase";
      this.lost = 0;
    } else if (this.mode === "chase") {
      this.lost += dt;
      if (shooting || this.lost >= params.guard.loseSecs) {
        this.mode = "return";
        this.stuck = 0;
      }
    }
    if (this.mode === "chase") return this.chase(tx, ty, dt);
    if (this.mode === "investigate") return this.investigate(dt);
    if (this.mode === "return") return this.volver(dt);
    this.patrullar(dt);
  }

  private chase(tx: number, ty: number, dt: number) {
    // el granadero se detiene a distancia para lanzar
    if (
      this.tipo === "granadero" &&
      Phaser.Math.Distance.Between(this.x, this.y, tx, ty) < px(4)
    ) {
      this.mirar(tx, ty);
      return;
    }
    const v =
      this.tipo === "cuchillero"
        ? params.cuchillero.speed
        : params.guard.chaseSpeed;
    this.stepTo(tx, ty, v, dt);
  }

  private investigate(dt: number) {
    const moved = this.stepTo(
      this.foco.x,
      this.foco.y,
      params.guard.patrolSpeed,
      dt,
    );
    this.stuck = moved ? 0 : this.stuck + dt;
    if (
      Phaser.Math.Distance.Between(this.x, this.y, this.foco.x, this.foco.y) <
        20 ||
      this.stuck > 1
    ) {
      this.timer += dt;
      if (this.timer >= INVESTIGAR_SECS) {
        this.mode = "return";
        this.stuck = 0;
      }
    }
  }

  private volver(dt: number) {
    const [hx, hy] = [px(this.cfg.a[0]), px(this.cfg.a[1])];
    const moved = this.stepTo(hx, hy, params.guard.patrolSpeed, dt);
    this.stuck = moved ? 0 : this.stuck + dt;
    if (
      Phaser.Math.Distance.Between(this.x, this.y, hx, hy) < 4 ||
      this.stuck > 1
    ) {
      this.sprite.setPosition(hx, hy); // ponytail: si se atasca en una esquina vuelve de golpe; usar pathfinding si hace falta
      this.mode = "patrol";
      this.to = 1;
      this.facing = this.cfg.b ? 0 : Math.PI;
    }
  }

  private patrullar(dt: number) {
    const { b } = this.cfg;
    if (!b) {
      // vigía
      this.timer += dt;
      if (this.timer >= WATCH_SECS) {
        this.timer = 0;
        this.facing = this.facing === 0 ? Math.PI : 0;
      }
      this.sprite.setFlipX(Math.cos(this.facing) < 0);
      return;
    }
    const target = this.to ? b : this.cfg.a;
    const tx = px(target[0]),
      ty = px(target[1]);
    const dist = Phaser.Math.Distance.Between(this.x, this.y, tx, ty);
    const step = px(params.guard.patrolSpeed) * dt;
    if (dist <= step) {
      this.sprite.setPosition(tx, ty);
      this.to = this.to ? 0 : 1;
      return;
    }
    this.mirar(tx, ty);
    this.sprite.x += Math.cos(this.facing) * step;
    this.sprite.y += Math.sin(this.facing) * step;
  }

  private mirar(tx: number, ty: number) {
    this.facing = Math.atan2(ty - this.y, tx - this.x);
    this.sprite.setFlipX(Math.cos(this.facing) < 0);
  }

  /** Avanza hacia (tx, ty) deslizando contra las paredes. Devuelve si se movió. */
  private stepTo(tx: number, ty: number, tilesPerSec: number, dt: number) {
    const dist = Phaser.Math.Distance.Between(this.x, this.y, tx, ty);
    this.mirar(tx, ty);
    if (dist < 20) return true; // ya está encima
    const d = Math.min(px(tilesPerSec) * dt, dist);
    const nx = this.x + Math.cos(this.facing) * d,
      ny = this.y + Math.sin(this.facing) * d;
    let moved = false;
    if (!isWall(this.map, nx, this.y)) {
      this.sprite.x = nx;
      moved = true;
    }
    if (!isWall(this.map, this.x, ny)) {
      this.sprite.y = ny;
      moved = true;
    }
    return moved;
  }

  /** Devuelve true si murió. */
  hurt(dmg: number) {
    this.hp -= dmg;
    this.angry = true;
    this.sprite.setTint(0xffffff);
    this.scene.time.delayedCall(
      80,
      () => this.sprite.active && this.sprite.setTint(TINTES[this.tipo]),
    );
    if (this.hp > 0) return false;
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0,
      angle: this.sprite.flipX ? -90 : 90,
      duration: 500,
      onComplete: () => this.sprite.destroy(),
    });
    return true;
  }

  /** Polígono del cono de visión, recortado por las paredes. */
  cono(range: number) {
    const half = (params.guard.coneDeg / 2) * (Math.PI / 180);
    const pts = [new Phaser.Math.Vector2(this.x, this.y)];
    for (let i = 0; i <= 16; i++) {
      const a = this.facing - half + (2 * half * i) / 16;
      const l = rayLength(this.map, this.x, this.y, a, range);
      pts.push(
        new Phaser.Math.Vector2(
          this.x + Math.cos(a) * l,
          this.y + Math.sin(a) * l,
        ),
      );
    }
    return pts;
  }

  /** Cono con borde grueso para no depender solo del color. */
  dibujarCono(g: Phaser.GameObjects.Graphics, pts: Phaser.Math.Vector2[]) {
    g.fillStyle(0xd9372b, 0.3)
      .fillPoints(pts, true)
      .lineStyle(2, 0xd9372b, 0.9)
      .strokePoints(pts, true);
  }

  /** Barra de vida sobre la cabeza (ámbar mientras persigue). */
  dibujarBarra(g: Phaser.GameObjects.Graphics) {
    const w = 30,
      x = this.x - w / 2,
      y = this.y - 30;
    g.fillStyle(0x000000, 0.8)
      .fillRect(x - 1, y - 1, w + 2, 6)
      .fillStyle(this.mode === "chase" ? 0xe0a526 : 0xd9372b)
      .fillRect(x, y, (w * this.hp) / params.guardHp, 4);
  }
}
