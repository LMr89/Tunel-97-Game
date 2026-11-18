import type Phaser from "phaser";
import config from "../data/config.json" with { type: "json" };

const { zonaMuerta, ejes, botones } = config.mando;

/** Ignora el temblor del stick: 0 dentro de la zona muerta y reescala el resto a 0..1. */
export const deadzone = (v: number, z = zonaMuerta) =>
  Math.abs(v) < z ? 0 : (v - Math.sign(v) * z) / (1 - z);

/** Acciones del jugador, vengan de teclado, ratón o mando. El nivel solo lee esto. */
export interface Entrada {
  dx: number;
  dy: number; // -1..1
  aim: number | null; // ángulo del stick derecho (rad), null si está quieto
  sneak: boolean;
  fire: boolean;
  interact: boolean;
  shield: boolean;
  reload: boolean;
  rock: boolean;
  pause: boolean; // solo en el fotograma en que se pulsan
}

const KEYS = "W,A,S,D,E,R,Q,F,P,ESC,SPACE,UP,DOWN,LEFT,RIGHT,SHIFT";

export function createInput(scene: Phaser.Scene) {
  const k = scene.input.keyboard!.addKeys(KEYS) as Record<
    string,
    Phaser.Input.Keyboard.Key
  >;
  let click = false;
  const onClick = () => {
    click = true;
  };
  scene.input.on("pointerdown", onClick);
  scene.events.once("shutdown", () => scene.input.off("pointerdown", onClick));
  const prev: Record<string, boolean> = {};
  const edge = (name: string, now: boolean) => {
    const e = now && !prev[name];
    prev[name] = now;
    return e;
  };

  return {
    /** Un clic rápido no se pierde entre fotogramas; el nivel lo limpia al usarlo. */
    clearClick() {
      click = false;
    },
    read(): Entrada {
      const pad = [...(navigator.getGamepads?.() ?? [])].find(
        (g) => g?.connected,
      );
      const btn = (names: number[]) =>
        names.some((i) => pad?.buttons[i]?.pressed);
      const ax = (i: number) => deadzone(pad?.axes[i] ?? 0);
      const sx = ax(ejes.apuntarX),
        sy = ax(ejes.apuntarY);
      const mx = ax(ejes.moverX),
        my = ax(ejes.moverY);
      const dx =
        Number(k.D!.isDown || k.RIGHT!.isDown) -
          Number(k.A!.isDown || k.LEFT!.isDown) || mx;
      const dy =
        Number(k.S!.isDown || k.DOWN!.isDown) -
          Number(k.W!.isDown || k.UP!.isDown) || my;
      return {
        dx,
        dy,
        aim: sx || sy ? Math.atan2(sy, sx) : null,
        sneak: k.SHIFT!.isDown || btn(botones.sigilo),
        fire:
          k.SPACE!.isDown ||
          scene.input.activePointer.isDown ||
          click ||
          btn(botones.disparar),
        interact: k.E!.isDown || btn(botones.interactuar),
        shield: k.Q!.isDown || btn(botones.escudo),
        reload: edge("r", k.R!.isDown || btn(botones.recargar)),
        rock: edge("f", k.F!.isDown || btn(botones.piedra)),
        pause: edge("p", k.P!.isDown || k.ESC!.isDown || btn(botones.pausa)),
      };
    },
  };
}
