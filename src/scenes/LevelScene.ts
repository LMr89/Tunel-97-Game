import Phaser from "phaser";
import params from "../data/params.json";
import config from "../data/config.json";
import {
  TILE,
  canSee,
  fillRate,
  rayLength,
  isWall,
  type Grid,
} from "../systems/vision";
import { escanear, danoExplosion } from "../systems/mapa";
import { createInput, type Entrada } from "../systems/input";
import {
  chispas,
  polvo,
  estallido,
  alerta,
  sacudida,
  vineta,
} from "../systems/fx";
import { sfx } from "../systems/sonido";
import { crearNoche, type Luz } from "../systems/noche";
import { superado } from "../systems/guardado";
import { Guard } from "../entities/Guard";
import { LEVELS, type Level } from "../data/levels";

const px = (t: number) => t * TILE;
const dist = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y);
/** Dirección de 8 vías (0 = S, 1 = SE, 2 = E ...) a partir de un ángulo. */
const dirDe = (a: number) =>
  (Math.round((90 - Phaser.Math.RadToDeg(a)) / 45) + 8) % 8;
const dirAngulo = (d: number) => Phaser.Math.DegToRad(90 - d * 45);

// gx, gy: posición en el plano del pecho (colisiones); el dibujo se eleva hasta la altura del arma.
type Bullet = {
  obj: Phaser.GameObjects.Arc;
  gx: number;
  gy: number;
  vx: number;
  vy: number;
  left: number;
};
// Las balas viajan en el plano del pecho (BODY_H sobre los pies): con los pies pegados a una pared, el plano del suelo quedaría dentro del muro.
const MUZZLE_R = 18,
  MUZZLE_H = 30,
  BODY_H = 11;
type Target = { x: number; y: number; label: string; done: () => void };
type Item = {
  id: string;
  tipo: "P" | "K" | "S" | "M";
  x: number;
  y: number;
  obj: Phaser.GameObjects.GameObject;
};
type Bomba = {
  x: number;
  y: number;
  obj: Phaser.GameObjects.Arc;
  fuse: number;
};

/** Lo que se conserva al reintentar desde un checkpoint. */
export interface Progreso {
  cp?: [number, number];
  usados: string[];
  docs: number;
  llave: boolean;
  escudo: number;
  t: number;
  muertes: number;
}
const nuevoProgreso = (): Progreso => ({
  usados: [],
  docs: 0,
  llave: false,
  escudo: 0,
  t: 0,
  muertes: 0,
});

const floorNear = (map: Grid, x: number, y: number, r: number) => {
  for (let j = y - r; j <= y + r; j++)
    for (let i = x - r; i <= x + r; i++) {
      const c = map[j]?.[i];
      if (c && c !== "#") return true;
    }
  return false;
};

export class LevelScene extends Phaser.Scene {
  private nivel = 0;
  private level!: Level;
  private map!: string[];
  private prog = nuevoProgreso();
  private inp!: ReturnType<typeof createInput>;
  private player!: Phaser.GameObjects.Sprite;
  private tinte: number | undefined;
  private guards: Guard[] = [];
  private targets: Target[] = [];
  private items: Item[] = [];
  private bombas: Bomba[] = [];
  private puertas: {
    x: number;
    y: number;
    obj: Phaser.GameObjects.Rectangle;
  }[] = [];
  private checkpoints: { x: number; y: number; obj: Phaser.GameObjects.Arc }[] =
    [];
  private luces: Luz[] = [];
  private totalDocs = 0;
  private noche?: ReturnType<typeof crearNoche>;
  private cones!: Phaser.GameObjects.Graphics;
  private bars!: Phaser.GameObjects.Graphics;
  private hp = params.player.hp;
  private detection = 0;
  private interact = 0;
  private current: Target | undefined;
  private dir = 2; // E
  private ended = false;
  private bullets: Bullet[] = [];
  private cooldown = 0;
  private shooting = false;
  private shielding = false;
  private mag = 0;
  private reserve = 0;
  private reload = 0;
  private piedras = 0;
  private pasos = 0;

  constructor() {
    super("Level");
  }

  private get body() {
    return this.player.body as Phaser.Physics.Arcade.Body;
  }

  init(data: { nivel?: number; prog?: Progreso }) {
    this.nivel = data.nivel ?? 0;
    this.level = LEVELS[this.nivel]!;
    this.map = [...this.level.mapa]; // copia: las puertas se abren cambiando el mapa
    this.prog = data.prog ?? nuevoProgreso();
  }

  create() {
    Object.assign(this, {
      ended: false,
      detection: 0,
      interact: 0,
      guards: [],
      bullets: [],
      items: [],
      bombas: [],
      puertas: [],
      checkpoints: [],
      luces: [],
      targets: [],
      current: undefined,
      cooldown: 0,
      shooting: false,
      shielding: false,
      reload: 0,
      pasos: 0,
      noche: undefined,
      mag: params.ammo.mag,
      reserve: params.ammo.reserve,
      hp: params.player.hp,
      piedras: params.piedras.cantidad,
    });
    this.registry.set("detection", 0);
    this.registry.set("prompt", "");
    this.registry.set("aviso", "");
    this.registry.set("nivel", `Nivel ${this.nivel + 1}: ${this.level.nombre}`);
    if (!this.scene.isActive("Hud")) this.scene.launch("Hud");
    this.inp = createInput(this);
    this.cameras.main.fadeIn(400);

    const marcas = escanear(this.map);
    this.totalDocs = marcas.P.length;
    this.drawMap();
    const solid = this.physics.add.staticGroup();
    this.map.forEach((row, ty) =>
      [...row].forEach((c, tx) => {
        // solo las paredes que tocan el suelo necesitan cuerpo físico
        if (c === "#" && floorNear(this.map, tx, ty, 1)) {
          const w = this.add
            .rectangle(px(tx) + TILE / 2, px(ty) + TILE / 2, TILE, TILE)
            .setVisible(false);
          this.physics.add.existing(w, true);
          solid.add(w);
        }
      }),
    );

    for (const b of this.level.barricadas) {
      const rect = this.add
        .rectangle(px(b.x), px(b.y), b.w, b.h, b.sellada ? 0x3a2a1c : 0x8b5a2b)
        .setStrokeStyle(2, 0x2b1d14)
        .setDepth(3);
      this.physics.add.existing(rect, true);
      solid.add(rect);
      if (!b.sellada) {
        this.targets.push({
          x: rect.x,
          y: rect.y,
          label: "abrir la barricada",
          done: () => {
            rect.destroy();
            sfx(this, "impacto");
            this.ruido(rect.x, rect.y, params.ruido.barricada);
            this.targets = this.targets.filter(
              (t) => t.x !== rect.x || t.y !== rect.y,
            );
          },
        });
      }
    }
    const centro = ([x, y]: [number, number]) => ({
      x: px(x) + TILE / 2,
      y: px(y) + TILE / 2,
    });
    const hatch = centro(marcas.H[0]!);
    this.targets.push({
      ...hatch,
      label: "abrir la escotilla",
      done: () => this.win(),
    });
    this.crearObjetos(marcas, centro, solid);

    const start = centro(this.prog.cp ?? marcas.J[0]!);
    this.player = this.add
      .sprite(start.x, start.y, "fs_idle")
      .setOrigin(67 / 134, 112 / 128)
      .setScale(0.5)
      .setDepth(5);
    const tint = (config.personaje as Record<string, { tint: string | null }>)[
      this.registry.get("genero") ?? "M"
    ]?.tint;
    this.tinte = tint ? Number(tint) : undefined;
    if (this.tinte !== undefined) this.player.setTint(this.tinte);
    this.physics.add.existing(this.player);
    this.body.setSize(44, 44).setOffset(45, 68); // ~22 px sobre los pies
    this.physics.add.collider(this.player, solid);

    this.guards = this.level.guardias.map(
      (cfg) => new Guard(this, this.map, cfg),
    );
    this.cones = this.add.graphics().setDepth(4);
    this.bars = this.add.graphics().setDepth(7);

    if (this.level.ambiente === "noche")
      this.noche = crearNoche(this, params.noche.oscuridad);
    else vineta(this);

    const W = this.map[0]!.length * TILE,
      H = this.map.length * TILE;
    this.physics.world.setBounds(0, 0, W, H);
    this.cameras.main
      .setBounds(0, 0, W, H)
      .startFollow(this.player, true, 0.1, 0.1);
  }

  /** Dibuja el suelo, la roca y la decoración del nivel. */
  private drawMap() {
    const rnd = new Phaser.Math.RandomDataGenerator(["tunel97"]);
    const g = this.add.graphics();
    this.map.forEach((row, ty) =>
      [...row].forEach((c, tx) => {
        const x = px(tx),
          y = px(ty);
        if (c === "#") {
          if (!floorNear(this.map, tx, ty, 3)) {
            g.fillStyle(0x0b1626).fillRect(x, y, TILE, TILE);
            return;
          }
          g.fillStyle(rnd.pick([0x6a6e75, 0x707479, 0x65696f])).fillRect(
            x,
            y,
            TILE,
            TILE,
          );
          g.fillStyle(0x16181c);
          for (let i = 0; i < 3; i++)
            g.fillRect(
              x + rnd.between(2, 28),
              y + rnd.between(2, 28),
              rnd.between(2, 4),
              rnd.between(2, 4),
            );
          return;
        }
        g.fillStyle(rnd.pick([0x5a3d28, 0x553924, 0x60422c])).fillRect(
          x,
          y,
          TILE,
          TILE,
        );
        g.fillStyle(0x2b1d14, 0.55);
        if (this.map[ty - 1]?.[tx] === "#") g.fillRect(x, y, TILE, 5);
        if (this.map[ty + 1]?.[tx] === "#")
          g.fillRect(x, y + TILE - 5, TILE, 5);
        if (this.map[ty]?.[tx - 1] === "#") g.fillRect(x, y, 5, TILE);
        if (this.map[ty]?.[tx + 1] === "#")
          g.fillRect(x + TILE - 5, y, 5, TILE);
        const cx = x + TILE / 2,
          cy = y + TILE / 2;
        if (c === "H")
          this.add
            .circle(cx, cy, 14, 0xe0a526)
            .setStrokeStyle(3, 0x8a6212)
            .setDepth(2);
        if (c === "N")
          g.fillStyle(0x120c08, 0.85).fillRect(
            x + 3,
            y + 3,
            TILE - 6,
            TILE - 6,
          ); // nicho: hueco oscuro
      }),
    );
    for (const d of this.level.decoracion ?? []) {
      const x = px(d.x),
        y = px(d.y);
      if (d.t === "charco")
        this.add.ellipse(x, y, 38, 20, 0x3b5a73, 0.55).setDepth(1);
      if (d.t === "tuberia")
        this.add
          .rectangle(x, y, px(d.w ?? 3), 7, 0x4a5058)
          .setStrokeStyle(1, 0x16181c)
          .setDepth(1);
      if (d.t === "antorcha") {
        this.add.circle(x, y, 5, 0xffc04d).setDepth(3);
        const glow = this.add
          .circle(x, y, 26, 0xff9a30, 0.25)
          .setDepth(3)
          .setBlendMode(Phaser.BlendModes.ADD);
        this.tweens.add({
          targets: glow,
          alpha: 0.12,
          scale: 0.85,
          duration: 300 + rnd.between(0, 200),
          yoyo: true,
          repeat: -1,
        });
        this.luces.push({ x, y, r: px(3.2) });
      }
    }
    for (const [x, y] of this.level.luces ?? [])
      this.luces.push({ x: px(x) + TILE / 2, y: px(y) + TILE / 2, r: px(3.2) });
  }

  /** Crea lo que marca el mapa: objetos, checkpoints, puertas y bombas. */
  private crearObjetos(
    m: ReturnType<typeof escanear>,
    centro: (p: [number, number]) => { x: number; y: number },
    solid: Phaser.Physics.Arcade.StaticGroup,
  ) {
    const usados = new Set(this.prog.usados);
    const pickups = {
      P: 0xf2e6c9,
      K: 0xe0a526,
      S: 0x7fb4d6,
      M: 0xffffff,
    } as const;
    for (const tipo of ["P", "K", "S", "M"] as const)
      for (const p of m[tipo]) {
        const id = `${tipo}${p[0]},${p[1]}`;
        if (usados.has(id)) continue;
        const c = centro(p);
        const obj =
          tipo === "S"
            ? this.add
                .circle(c.x, c.y, 9, pickups[tipo])
                .setStrokeStyle(3, 0x35566d)
            : tipo === "K"
              ? this.add
                  .circle(c.x, c.y, 7, pickups[tipo])
                  .setStrokeStyle(2, 0x8a6212)
              : this.add
                  .rectangle(
                    c.x,
                    c.y,
                    tipo === "M" ? 14 : 12,
                    tipo === "M" ? 14 : 16,
                    pickups[tipo],
                  )
                  .setStrokeStyle(2, tipo === "M" ? 0xd9372b : 0x8c7b64);
        obj.setDepth(2);
        this.tweens.add({
          targets: obj,
          scale: 1.2,
          duration: 600,
          yoyo: true,
          repeat: -1,
        });
        this.items.push({ id, tipo, ...c, obj });
      }
    for (const p of m.C) {
      const c = centro(p);
      this.checkpoints.push({
        ...c,
        obj: this.add
          .circle(c.x, c.y, 11)
          .setStrokeStyle(3, 0x4aa3a0)
          .setDepth(2),
      });
    }
    for (const p of m.D) {
      const c = centro(p);
      const obj = this.add
        .rectangle(c.x, c.y, TILE, TILE, 0x4a5560)
        .setStrokeStyle(3, 0x1d242b)
        .setDepth(3);
      this.physics.add.existing(obj, true);
      solid.add(obj);
      this.puertas.push({ ...c, obj });
    }
    for (const p of m.B) {
      const c = centro(p);
      this.bombas.push({
        ...c,
        fuse: -1,
        obj: this.add
          .circle(c.x, c.y, 8, 0x2a2a2a)
          .setStrokeStyle(3, 0xd9372b)
          .setDepth(2),
      });
    }
  }

  update(_t: number, dtMs: number) {
    if (this.ended) return;
    const dt = dtMs / 1000;
    this.prog.t += dt;
    const inp = this.inp.read();
    if (inp.pause) {
      this.scene.launch("Pausa");
      this.scene.pause();
      return;
    }

    this.moverJugador(inp, dt);
    this.vigilar(dt, inp);
    this.updateInteract(dt, inp);
    this.updateShooting(dt, inp);
    this.updateObjetos(dt);
    this.updateHud();
    if (this.noche) {
      this.noche.actualizar(
        [
          { x: this.player.x, y: this.player.y - 10, r: px(params.noche.luz) },
          ...this.luces,
        ],
        this.guards.map((g) => g.cono(px(params.guard.range))),
      );
    }
  }

  private get oculto() {
    return (
      this.map[Math.floor(this.player.y / TILE)]?.[
        Math.floor(this.player.x / TILE)
      ] === "N"
    );
  }

  private moverJugador(inp: Entrada, dt: number) {
    this.shielding = inp.shield && this.prog.escudo > 0;
    const speed =
      px(inp.sneak ? params.player.sneakSpeed : params.player.walkSpeed) *
      (this.shielding ? params.escudo.lento : 1);
    const mag = Math.hypot(inp.dx, inp.dy),
      k = mag > 1 ? 1 / mag : 1; // el stick da velocidad proporcional
    this.body.setVelocity(inp.dx * k * speed, inp.dy * k * speed);
    const armed = this.mag > 0 && this.reload <= 0;
    if (!armed) this.inp.clearClick();
    this.shooting = inp.fire && armed && !this.shielding;
    // Al disparar se mantiene la orientación (se puede avanzar o retroceder apuntando igual).
    if (inp.aim !== null) this.dir = dirDe(inp.aim);
    else if (mag > 0 && !this.shooting)
      this.dir = dirDe(Math.atan2(inp.dy, inp.dx));
    // Normal: correr (zancada amplia). Sigilo: caminar. El paso va al ritmo del movimiento real para que los pies no patinen.
    const anim = this.shooting ? "attack3" : mag > 0 ? (inp.sneak ? "walk" : "run") : "idle";
    this.player.anims.play(`fs_${anim}_${this.dir}`, true);
    this.player.anims.timeScale =
      anim === "run" || anim === "walk"
        ? Phaser.Math.Clamp(this.body.speed / params.player.animRef[anim], 0.3, 2)
        : 1;
    this.player.setAlpha(this.oculto ? 0.5 : 1);

    if (mag > 0) {
      this.pasos += dt;
      if (this.pasos >= 0.35) {
        this.pasos = 0;
        polvo(this, this.player.x, this.player.y);
        if (!inp.sneak)
          this.ruido(this.player.x, this.player.y, params.ruido.caminar);
      }
    }
    if (inp.rock && this.piedras > 0) this.lanzarPiedra();
  }

  /** Alerta a los guardias a `radio` tiles: van a investigar el punto. */
  private ruido(x: number, y: number, radio: number) {
    for (const gd of this.guards)
      if (dist(gd, { x, y }) < px(radio)) gd.oir(x, y);
  }

  private lanzarPiedra() {
    this.piedras--;
    const a = dirAngulo(this.dir);
    const len = rayLength(
      this.map,
      this.player.x,
      this.player.y,
      a,
      px(params.piedras.alcance),
    );
    const tx = this.player.x + Math.cos(a) * len,
      ty = this.player.y + Math.sin(a) * len;
    const rock = this.add
      .circle(this.player.x, this.player.y - BODY_H, 4, 0x9a9a9a)
      .setDepth(6);
    this.tweens.add({
      targets: rock,
      x: tx,
      y: ty,
      duration: 350,
      onComplete: () => {
        rock.destroy();
        sfx(this, "piedra");
        chispas(this, tx, ty, 0xb0b0b0, 5, 14);
        this.ruido(tx, ty, params.ruido.piedra);
      },
    });
  }

  /** Visión de cada guardia, detección y ataques. */
  private vigilar(dt: number, inp: Entrada) {
    const g = params.guard,
      range = px(g.range);
    let seenBy = Infinity;
    this.cones.clear();
    this.bars.clear();
    const pecho = { x: this.player.x, y: this.player.y - BODY_H };
    for (const gd of this.guards) {
      const r = canSee(
        this.map,
        gd.x,
        gd.y,
        gd.facing,
        pecho.x,
        pecho.y,
        range,
        g.coneDeg,
      );
      // En un nicho solo lo descubre un guardia que pasa pegado a él.
      const spotted =
        r.seen &&
        !(this.oculto && r.dist > TILE) &&
        (!this.shooting || gd.angry);
      const antes = gd.mode;
      gd.update(dt, pecho.x, pecho.y, spotted, this.shooting);
      if (antes !== "chase" && gd.mode === "chase") {
        alerta(this, gd.x, gd.y - 40);
        sfx(this, "alerta");
      }
      gd.dibujarCono(this.cones, gd.cono(range));
      gd.dibujarBarra(this.bars);
      if (spotted) seenBy = Math.min(seenBy, r.dist);
      if (!this.oculto) this.atacar(gd, pecho, range);
    }
    const close = seenBy < TILE * 1.2 ? 2 : 1; // a quemarropa se llena el doble de rápido
    this.detection =
      seenBy < Infinity
        ? this.detection +
          fillRate(
            seenBy,
            range,
            g.fillNear,
            g.fillFar,
            inp.sneak,
            g.sneakFactor,
          ) *
            close *
            dt
        : this.detection - g.drain * dt;
    this.detection = Phaser.Math.Clamp(this.detection, 0, 1);
    if (this.detection >= 1) this.caught("Te descubrieron");
    if (this.shielding) {
      const a = dirAngulo(this.dir);
      this.bars
        .lineStyle(5, 0x7fb4d6, 0.9)
        .beginPath()
        .arc(this.player.x, this.player.y - BODY_H, 22, a - 0.9, a + 0.9)
        .strokePath();
    }
  }

  /** El cuchillero apuñala al contacto; el granadero lanza una granada a donde está el jugador. */
  private atacar(gd: Guard, pecho: { x: number; y: number }, range: number) {
    if (gd.mode !== "chase" || gd.cooldown > 0) return;
    const d = dist(gd, pecho);
    if (gd.tipo === "cuchillero" && d < params.cuchillero.reach) {
      gd.cooldown = params.cuchillero.cooldown;
      sfx(this, "cuchillo");
      if (this.protege(gd)) this.golpeEscudo();
      else this.danar(params.cuchillero.damage);
    }
    const a = Math.atan2(pecho.y - gd.y, pecho.x - gd.x);
    if (
      gd.tipo === "granadero" &&
      d >= px(params.granada.distMin) &&
      d <= range + px(3) &&
      rayLength(this.map, gd.x, gd.y, a, d) >= d
    ) {
      gd.cooldown = params.granada.cada;
      this.lanzarGranada(gd, { x: this.player.x, y: this.player.y });
    }
  }

  /** ¿El escudo cubre el golpe? Solo protege de lo que viene por el frente. */
  private protege(src: { x: number; y: number }) {
    if (!this.shielding) return false;
    const a = dirAngulo(this.dir),
      d = Math.hypot(src.x - this.player.x, src.y - this.player.y) || 1;
    return (
      (Math.cos(a) * (src.x - this.player.x) +
        Math.sin(a) * (src.y - this.player.y)) /
        d >
      params.escudo.arcoCos
    );
  }

  private golpeEscudo() {
    this.prog.escudo = Math.max(0, this.prog.escudo - params.escudo.golpe);
    chispas(this, this.player.x, this.player.y - BODY_H, 0x7fb4d6, 6, 20);
    sfx(this, "impacto");
    if (this.prog.escudo === 0) this.aviso("¡Escudo roto!");
  }

  private danar(n: number) {
    this.hp -= n;
    this.player.setTint(0xff5050);
    this.time.delayedCall(120, () =>
      this.tinte === undefined
        ? this.player.clearTint()
        : this.player.setTint(this.tinte),
    );
    sacudida(this, 150, 0.006);
    if (this.hp <= 0) this.caught("Te eliminaron");
  }

  private lanzarGranada(gd: Guard, to: { x: number; y: number }) {
    const gr = this.add
      .circle(gd.x, gd.y - 20, 4, 0x3f5b3a)
      .setStrokeStyle(1, 0x000000)
      .setDepth(6);
    this.tweens.add({
      targets: gr,
      x: to.x,
      y: to.y,
      duration: params.granada.vuelo * 1000,
      onComplete: () => {
        gr.destroy();
        const aviso = this.add
          .circle(to.x, to.y, px(params.granada.radio), 0xd9372b, 0.18)
          .setStrokeStyle(2, 0xd9372b, 0.9)
          .setDepth(3);
        this.tweens.add({
          targets: aviso,
          alpha: 0.6,
          duration: 200,
          yoyo: true,
          repeat: -1,
        });
        this.time.delayedCall(params.granada.mecha * 1000, () => {
          aviso.destroy();
          this.explotar(
            to.x,
            to.y,
            params.granada.radio,
            params.granada.damage,
          );
        });
      },
    });
  }

  /** Explosión compartida por granadas y bombas: daña al jugador, a los guardias y detona bombas cercanas. */
  private explotar(x: number, y: number, radioTiles: number, dano: number) {
    const R = px(radioTiles);
    estallido(this, x, y, R);
    sacudida(this, 250, 0.008);
    sfx(this, "explosion");
    let dp = danoExplosion(dist(this.player, { x, y }), R, dano);
    if (dp > 0) {
      if (this.shielding) {
        dp = Math.round(dp * params.escudo.factorExplosion);
        this.golpeEscudo();
      }
      this.danar(dp);
    }
    for (const gd of [...this.guards]) {
      const dg = danoExplosion(dist(gd, { x, y }), R, dano);
      if (dg > 0) this.herir(gd, Math.ceil(dg / 20)); // la vida del guardia se cuenta en golpes de bala
    }
    for (const b of this.bombas)
      if (b.fuse < 0 && dist(b, { x, y }) < R) b.fuse = 0.3; // reacción en cadena
    this.ruido(x, y, 8);
  }

  private herir(gd: Guard, dmg: number) {
    if (gd.hurt(dmg)) this.guards = this.guards.filter((x) => x !== gd);
  }

  /** Mantener E junto a una barricada o la escotilla durante `interactSeconds`. */
  private updateInteract(dt: number, inp: Entrada) {
    const near = this.targets.find((t) => dist(this.player, t) < TILE * 1.5);
    if (near !== this.current) {
      this.current = near;
      this.interact = 0;
    }
    this.interact = near && inp.interact ? this.interact + dt : 0;
    const pct = Math.round(
      Math.min(this.interact / params.interactSeconds, 1) * 100,
    );
    this.registry.set(
      "prompt",
      near ? `Mantén [E / ○] para ${near.label}${pct ? ` ${pct}%` : ""}` : "",
    );
    if (near && this.interact >= params.interactSeconds) {
      this.interact = 0;
      near.done();
    }
  }

  /** Objetos recogibles, checkpoints, puertas y bombas. */
  private updateObjetos(dt: number) {
    const aqui = { x: this.player.x, y: this.player.y };
    for (const it of [...this.items]) {
      if (dist(aqui, it) > TILE * 0.8) continue;
      if (it.tipo === "M" && this.hp >= params.player.hp) continue; // el botiquín espera si estás sano
      this.items = this.items.filter((x) => x !== it);
      it.obj.destroy();
      this.prog.usados.push(it.id);
      if (it.tipo === "P") {
        this.prog.docs++;
        this.aviso("Documento recogido");
      }
      if (it.tipo === "K") {
        this.prog.llave = true;
        this.aviso("Llave recogida");
      }
      if (it.tipo === "S") {
        this.prog.escudo = params.escudo.durabilidad;
        this.aviso("Escudo: mantén [Q / L2]");
      }
      if (it.tipo === "M") {
        this.hp = Math.min(params.player.hp, this.hp + params.botiquin);
        this.aviso("Botiquín");
      }
      sfx(this, "piedra");
    }
    for (const cp of this.checkpoints) {
      if (dist(aqui, cp) > TILE * 0.8) continue;
      const [tx, ty] = [Math.floor(cp.x / TILE), Math.floor(cp.y / TILE)];
      if (this.prog.cp?.[0] === tx && this.prog.cp?.[1] === ty) continue;
      this.prog.cp = [tx, ty];
      this.hp = params.player.hp;
      this.checkpoints.forEach((c) =>
        c.obj.setStrokeStyle(3, c === cp ? 0xe0a526 : 0x4aa3a0),
      );
      this.aviso("Checkpoint");
    }
    for (const p of [...this.puertas]) {
      if (!this.prog.llave || dist(aqui, p) > TILE * 1.4) continue;
      const [tx, ty] = [Math.floor(p.x / TILE), Math.floor(p.y / TILE)];
      this.map[ty] =
        this.map[ty]!.slice(0, tx) + "." + this.map[ty]!.slice(tx + 1);
      p.obj.destroy();
      this.puertas = this.puertas.filter((x) => x !== p);
      this.aviso("Puerta abierta");
      sfx(this, "impacto");
    }
    for (const b of [...this.bombas]) {
      if (b.fuse < 0 && dist(aqui, b) < px(params.bomba.disparo)) {
        b.fuse = params.bomba.mecha;
        sfx(this, "alerta");
      }
      if (b.fuse < 0) continue;
      b.fuse -= dt;
      b.obj.setFillStyle(Math.floor(b.fuse * 8) % 2 ? 0xd9372b : 0x2a2a2a);
      if (b.fuse > 0) continue;
      b.obj.destroy();
      this.bombas = this.bombas.filter((x) => x !== b);
      this.explotar(b.x, b.y, params.bomba.radio, params.bomba.damage);
    }
  }

  /** Espacio, clic o R2 disparan hacia donde mira el Comando, desde la boca del arma. */
  private updateShooting(dt: number, inp: Entrada) {
    const b = params.bullet,
      am = params.ammo;
    this.cooldown -= dt;
    if (this.reload > 0) {
      this.reload -= dt;
      if (this.reload <= 0) {
        const n = Math.min(am.mag - this.mag, this.reserve);
        this.mag += n;
        this.reserve -= n;
      }
    } else if (
      this.mag < am.mag &&
      this.reserve > 0 &&
      (inp.reload || this.mag === 0)
    ) {
      this.reload = am.reloadSecs;
    }
    this.registry.set(
      "ammo",
      this.reload > 0
        ? "Recargando…"
        : this.mag + this.reserve === 0
          ? "SIN BALAS"
          : `${this.mag} / ${this.reserve}`,
    );
    if (this.cooldown <= 0 && this.shooting) {
      this.cooldown = b.cooldown;
      this.mag--;
      this.inp.clearClick();
      sfx(this, "disparo");
      sacudida(this, 60, 0.002);
      const angle = dirAngulo(this.dir); // 8 direcciones: S, SE, E, ...
      const c = Math.cos(angle),
        s = Math.sin(angle);
      // ponytail: boca del arma aproximada (radio + altura fijos); afinar por dirección si hace falta
      const gx = this.player.x + c * MUZZLE_R,
        gy = this.player.y - BODY_H + s * MUZZLE_R;
      const obj = this.add
        .circle(gx, gy - (MUZZLE_H - BODY_H), 3, 0xffe9a0)
        .setDepth(6);
      this.add
        .sprite(gx, gy - (MUZZLE_H - BODY_H), "fx_muzzle")
        .setOrigin(0.075, 0.5)
        .setScale(0.5)
        .setRotation(angle)
        .setDepth(6)
        .setBlendMode(Phaser.BlendModes.ADD)
        .play("fx_muzzle")
        .once(
          "animationcomplete",
          (_a: unknown, _f: unknown, spr: Phaser.GameObjects.Sprite) =>
            spr.destroy(),
        );
      this.bullets.push({
        obj,
        gx,
        gy,
        vx: c * px(b.speed),
        vy: s * px(b.speed),
        left: px(b.range),
      });
    }
    this.bullets = this.bullets.filter((bl) => {
      bl.gx += bl.vx * dt;
      bl.gy += bl.vy * dt;
      bl.left -= Math.hypot(bl.vx, bl.vy) * dt;
      bl.obj.setPosition(bl.gx, bl.gy - (MUZZLE_H - BODY_H));
      // plano del pecho: se compara con el centro del guardia
      const hit = this.guards.find(
        (gd) => Math.abs(gd.x - bl.gx) < 20 && Math.abs(gd.y - bl.gy) < 24,
      );
      const bomba = this.bombas.find(
        (bo) =>
          bo.fuse !== 0 &&
          Math.abs(bo.x - bl.gx) < 14 &&
          Math.abs(bo.y - bl.gy) < 14,
      );
      const pared = isWall(this.map, bl.gx, bl.gy);
      if (hit) {
        this.herir(hit, b.damage);
        sfx(this, "impacto");
      }
      if (bomba) bomba.fuse = 0.01; // un disparo la detona
      if (hit || bomba || pared || bl.left <= 0) {
        if (hit || pared)
          chispas(this, bl.obj.x, bl.obj.y, hit ? 0xd9372b : 0xffe9a0, 5, 14);
        bl.obj.destroy();
        return false;
      }
      return true;
    });
  }

  private updateHud() {
    const r = this.registry;
    r.set("detection", this.detection);
    r.set("hp", this.hp / params.player.hp);
    r.set("escudo", this.prog.escudo / params.escudo.durabilidad);
    r.set(
      "inventario",
      `Piedras [F / △]: ${this.piedras}   Documentos: ${this.prog.docs}/${this.totalDocs}${this.prog.llave ? "   Llave ✔" : ""}`,
    );
  }

  private aviso(texto: string) {
    this.registry.set("aviso", texto);
    this.time.delayedCall(2000, () => this.registry.set("aviso", ""));
  }

  private caught(msg: string) {
    if (this.ended) return;
    this.ended = true;
    this.body.setVelocity(0, 0);
    this.prog.muertes++;
    this.banner(msg, "#D9372B");
    this.time.delayedCall(1500, () =>
      this.scene.restart({ nivel: this.nivel, prog: this.prog }),
    );
  }

  private win() {
    this.ended = true;
    this.body.setVelocity(0, 0);
    this.registry.set("prompt", "");
    superado(this.nivel, this.prog.t);
    this.banner("Nivel superado", "#E0A526");
    this.time.delayedCall(1500, () => {
      this.scene.stop("Hud");
      this.scene.start("Resultados", {
        nivel: this.nivel,
        t: this.prog.t,
        docs: this.prog.docs,
        total: this.totalDocs,
        muertes: this.prog.muertes,
      });
    });
  }

  private banner(text: string, color: string) {
    this.add
      .text(this.cameras.main.midPoint.x, this.cameras.main.midPoint.y, text, {
        fontFamily: "Oswald, Arial, sans-serif",
        fontSize: "64px",
        color,
        backgroundColor: "#2B1D14",
        padding: { x: 24, y: 12 },
      })
      .setOrigin(0.5)
      .setDepth(10);
  }
}
