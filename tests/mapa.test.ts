import test from 'node:test';
import assert from 'node:assert/strict';
import { escanear, danoExplosion } from '../src/systems/mapa.ts';
import { frecuenciaFundamental, clasificar } from '../src/systems/voz.ts';

test('escanear encuentra las marcas', () => {
  const m = escanear(['#####', '#J.N#', '#H.C#']);
  assert.deepEqual(m.J, [[1, 1]]);
  assert.deepEqual(m.N, [[3, 1]]);
  assert.deepEqual(m.C, [[3, 2]]);
});
test('la explosión cae con la distancia', () => {
  assert.equal(danoExplosion(0, 100, 40), 40);
  assert.equal(danoExplosion(50, 100, 40), 20);
  assert.equal(danoExplosion(100, 100, 40), 0);
});
const seno = (hz: number) => Float32Array.from({ length: 2048 }, (_, i) => 0.5 * Math.sin((2 * Math.PI * hz * i) / 44100));
test('detecta tono grave y agudo', () => {
  const h = frecuenciaFundamental(seno(110), 44100)!, m = frecuenciaFundamental(seno(220), 44100)!;
  assert.ok(Math.abs(h - 110) < 6, `grave ${h}`);
  assert.ok(Math.abs(m - 220) < 12, `agudo ${m}`);
  assert.equal(clasificar(h, 165), 'M');
  assert.equal(clasificar(m, 165), 'F');
});
test('el silencio no da frecuencia', () => {
  assert.equal(frecuenciaFundamental(new Float32Array(2048), 44100), null);
});
