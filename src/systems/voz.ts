// Detección de género por tono de voz. Heurística: voz grave ≈ hombre, aguda ≈ mujer.
// La parte pura (sin navegador) se prueba con node --test.

/** Frecuencia fundamental (Hz) por autocorrelación, o null si no hay voz clara. */
export function frecuenciaFundamental(
  buf: Float32Array,
  sampleRate: number,
): number | null {
  const n = buf.length;
  let rms = 0;
  for (let i = 0; i < n; i++) rms += buf[i]! * buf[i]!;
  if (Math.sqrt(rms / n) < 0.01) return null; // silencio
  const minLag = Math.floor(sampleRate / 400),
    maxLag = Math.floor(sampleRate / 70); // voz humana: 70 a 400 Hz
  let best = 0,
    bestLag = 0;
  for (let lag = minLag; lag <= maxLag; lag++) {
    let c = 0;
    for (let i = 0; i < n - lag; i++) c += buf[i]! * buf[i + lag]!;
    if (c > best) {
      best = c;
      bestLag = lag;
    }
  }
  return bestLag && best / rms > 0.3 ? sampleRate / bestLag : null; // ponytail: umbral fijo de claridad 0.3; ajustar si falla con micrófonos ruidosos
}

export const mediana = (v: number[]) => {
  const s = [...v].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)]!;
};

export const clasificar = (hz: number, umbral: number): "M" | "F" =>
  hz < umbral ? "M" : "F";

/** Escucha el micrófono `segundos` y devuelve la mediana de F0 (null si casi no hubo voz). */
export async function escuchar(
  segundos: number,
  onNivel: (rms: number) => void,
): Promise<number | null> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const ctx = new AudioContext();
  const an = ctx.createAnalyser();
  an.fftSize = 2048;
  ctx.createMediaStreamSource(stream).connect(an);
  const buf = new Float32Array(an.fftSize),
    muestras: number[] = [];
  const fin = performance.now() + segundos * 1000;
  while (performance.now() < fin) {
    await new Promise((r) => setTimeout(r, 50));
    an.getFloatTimeDomainData(buf);
    onNivel(Math.sqrt(buf.reduce((s, x) => s + x * x, 0) / buf.length));
    const f = frecuenciaFundamental(buf, ctx.sampleRate);
    if (f) muestras.push(f);
  }
  stream.getTracks().forEach((t) => t.stop());
  void ctx.close();
  return muestras.length >= 5 ? mediana(muestras) : null;
}
