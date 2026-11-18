import test from 'node:test';
import assert from 'node:assert/strict';
import { canSee, fillRate, TILE } from '../src/systems/vision.ts';

const grid = ['#####', '#...#', '#.#.#', '#...#', '#####'];
const c = (t: number) => (t + 0.5) * TILE;
const R = 4 * TILE;

test('ve al jugador dentro del cono', () => {
  assert.equal(canSee(grid, c(1), c(1), 0, c(3), c(1), R, 60).seen, true);
});
test('una pared bloquea la vista', () => {
  assert.equal(canSee(grid, c(2), c(1), Math.PI / 2, c(2), c(3), R, 60).seen, false);
});
test('fuera del cono no ve', () => {
  assert.equal(canSee(grid, c(1), c(1), Math.PI, c(3), c(1), R, 60).seen, false);
});
test('el sigilo llena más lento', () => {
  assert.ok(fillRate(0, R, 1.5, 3, true, 0.6) < fillRate(0, R, 1.5, 3, false, 0.6));
});
