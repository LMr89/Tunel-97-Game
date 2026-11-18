import type Phaser from "phaser";
import config from "../data/config.json" with { type: "json" };

// Efectos de sonido generados con WebAudio: no necesitan archivos.
export type Sfx =
  | "disparo"
  | "impacto"
  | "explosion"
  | "alerta"
  | "piedra"
  | "cuchillo";
// [frecuencia inicial, final, duración s, ruido 0..1]
const SONIDOS: Record<Sfx, [number, number, number, number]> = {
  disparo: [500, 90, 0.12, 0.6],
  impacto: [220, 60, 0.1, 0.5],
  explosion: [120, 25, 0.7, 1],
  alerta: [440, 880, 0.18, 0],
  piedra: [300, 150, 0.08, 0.7],
  cuchillo: [900, 300, 0.1, 0.3],
};

export function sfx(scene: Phaser.Scene, nombre: Sfx) {
  const ctx = (scene.sound as unknown as { context?: AudioContext }).context;
  if (!config.efectos.sonido || !ctx || ctx.state !== "running") return;
  const [f0, f1, dur, ruido] = SONIDOS[nombre],
    t = ctx.currentTime;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.25, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
  gain.connect(ctx.destination);
  if (ruido < 1) {
    const o = ctx.createOscillator();
    o.type = "square";
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    o.connect(gain);
    o.start(t);
    o.stop(t + dur);
  }
  if (ruido > 0) {
    const buf = ctx.createBuffer(
      1,
      Math.ceil(ctx.sampleRate * dur),
      ctx.sampleRate,
    );
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * ruido;
    const n = ctx.createBufferSource();
    n.buffer = buf;
    n.connect(gain);
    n.start(t);
  }
}
