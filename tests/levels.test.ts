import test from 'node:test';
import assert from 'node:assert/strict';
import { LEVELS } from '../src/data/levels/index.ts';
import { isWall } from '../src/systems/vision.ts';

LEVELS.forEach((lv, i) => {
  test(`nivel ${i + 1} (${lv.nombre}) es válido`, () => {
    assert.ok(lv.mapa.every((r) => r.length === lv.mapa[0]!.length), 'filas del mismo largo');
    const all = lv.mapa.join('');
    assert.equal(all.split('J').length - 1, 1, 'un inicio J');
    assert.equal(all.split('H').length - 1, 1, 'una escotilla H');
    for (const g of lv.guardias) for (const [x, y] of [g.a, g.b ?? g.a])
      assert.equal(isWall(lv.mapa, (x + 0.0) * 32, y * 32), false, `guardia en pared (${x},${y})`);
  });
});

LEVELS.forEach((lv, i) => {
  test(`nivel ${i + 1}: la escotilla es alcanzable desde el inicio`, () => {
    const at = (x: number, y: number) => lv.mapa[y]?.[x] ?? '#';
    const find = (m: string) => lv.mapa.flatMap((r, y) => [...r].flatMap((c, x) => (c === m ? [[x, y] as const] : [])))[0]!;
    const [sx, sy] = find('J'), [hx, hy] = find('H');
    const seen = new Set([`${sx},${sy}`]), cola = [[sx, sy]];
    for (let q = cola.shift(); q; q = cola.shift()) {
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
        const [x, y] = [q[0]! + dx, q[1]! + dy];
        if (at(x, y) !== '#' && !seen.has(`${x},${y}`)) { seen.add(`${x},${y}`); cola.push([x, y]); }
      }
    }
    assert.ok(seen.has(`${hx},${hy}`));
  });
});
