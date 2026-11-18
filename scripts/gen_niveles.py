"""Genera src/data/levels/nivel2-4.json y añade marcas al nivel 1.
Se puede borrar: los JSON son la fuente de verdad. Sirve para rehacer un mapa rápido con rectángulos."""
import json
from collections import deque

DIR = 'src/data/levels/'


def grid(w, h):
    return [['#'] * w for _ in range(h)]


def carve(g, x, y, w, h, c='.'):
    for j in range(y, y + h):
        for i in range(x, x + w):
            g[j][i] = c


def marca(g, c, *pts):
    for x, y in pts:
        if c == 'N':  # los nichos se excavan en la pared, pegados al suelo
            assert any(g[y + dy][x + dx] != '#' for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))), f'nicho aislado {x},{y}'
        else:
            assert g[y][x] != '#', f'{c} sobre pared en {x},{y}'
        g[y][x] = c


def revisar(nombre, g, guardias):
    filas = [''.join(r) for r in g]
    ini = [(x, y) for y, r in enumerate(filas) for x, c in enumerate(r) if c == 'J'][0]
    fin = [(x, y) for y, r in enumerate(filas) for x, c in enumerate(r) if c == 'H'][0]
    vistos, cola = {ini}, deque([ini])
    while cola:
        x, y = cola.popleft()
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            n = (x + dx, y + dy)
            if n not in vistos and filas[n[1]][n[0]] != '#':
                vistos.add(n); cola.append(n)
    assert fin in vistos, f'{nombre}: la escotilla no es alcanzable'
    for gd in guardias:
        for x, y in (gd['a'], gd.get('b', gd['a'])):
            assert filas[int(y)][int(x)] != '#', f'{nombre}: guardia en pared {x},{y}'
    return filas


def guardar(n, nombre, g, guardias, extra=None):
    d = {'nombre': nombre, 'mapa': revisar(nombre, g, guardias), 'guardias': guardias, 'barricadas': []}
    d.update(extra or {})
    s = json.dumps(d, ensure_ascii=False, indent=1)
    open(f'{DIR}nivel{n}.json', 'w', encoding='utf8').write(s)


# ---- Nivel 1: se conserva el mapa y se añaden marcas
d = json.load(open(DIR + 'nivel1.json', encoding='utf8'))
g = [list(r) for r in d['mapa']]
for c, pts in {'C': [(8, 14), (26, 5)], 'N': [(7, 8), (14, 15), (28, 15)], 'P': [(4, 17), (13, 10), (11, 5)], 'M': [(6, 16)]}.items():
    for x, y in pts:
        if g[y][x] == '.':
            g[y][x] = c
        elif g[y][x] == '#' and c == 'N':
            g[y][x] = c
d['mapa'] = revisar('nivel1', g, d['guardias'])
d['decoracion'] = [{'t': 'tuberia', 'x': 16, 'y': 4.2, 'w': 6}, {'t': 'charco', 'x': 14, 'y': 17}, {'t': 'charco', 'x': 25, 'y': 11},
                   {'t': 'antorcha', 'x': 12, 'y': 4.4}, {'t': 'antorcha', 'x': 24, 'y': 16.5}]
open(DIR + 'nivel1.json', 'w', encoding='utf8').write(json.dumps(d, ensure_ascii=False, indent=1))

# ---- Nivel 2: sótano y almacenes. La llave (sala B) abre la puerta del pasillo sur; el escudo está en la sala C.
g = grid(40, 24)
carve(g, 2, 16, 8, 6)    # A: inicio
carve(g, 5, 6, 2, 10)    # pasillo vertical
carve(g, 5, 6, 22, 2)    # pasillo norte
carve(g, 14, 8, 2, 2)    # acceso a B
carve(g, 10, 10, 10, 6)  # B: almacén (llave)
carve(g, 26, 4, 10, 8)   # C: sala del escudo
carve(g, 10, 18, 26, 2)  # pasillo sur (puerta)
carve(g, 26, 16, 12, 6)  # D: sala final
marca(g, 'J', (3, 20)); marca(g, 'H', (36, 20))
marca(g, 'K', (18, 14)); marca(g, 'S', (34, 5)); marca(g, 'D', (24, 18), (24, 19))
marca(g, 'P', (3, 17), (11, 11), (28, 10)); marca(g, 'C', (5, 12), (14, 19)); marca(g, 'M', (33, 9), (30, 20))
marca(g, 'N', (4, 12), (22, 5), (25, 21))
guardias = [
    {'a': [8, 6], 'b': [20, 6]},                                    # patrullero norte
    {'a': [11, 12], 'b': [18, 12], 'tipo': 'cuchillero'},           # B
    {'a': [30, 6], 'tipo': 'cuchillero'},                           # C vigía
    {'a': [28, 18], 'b': [35, 18], 'tipo': 'cuchillero'},           # D
    {'a': [12, 18], 'b': [22, 19]},                                 # pasillo sur
]
guardar(2, 'Sótano y almacenes', g, guardias, {'decoracion': [
    {'t': 'tuberia', 'x': 12, 'y': 5.2, 'w': 8}, {'t': 'charco', 'x': 15, 'y': 13}, {'t': 'charco', 'x': 30, 'y': 19},
    {'t': 'antorcha', 'x': 9, 'y': 15.6}, {'t': 'antorcha', 'x': 20, 'y': 17.6}, {'t': 'antorcha', 'x': 31, 'y': 3.6}]})

# ---- Nivel 3: patio de noche. Espacio abierto con cobertura, linternas y granaderos.
g = grid(40, 22)
carve(g, 3, 3, 34, 16)
for r in [(10, 6, 2, 6), (16, 12, 6, 2), (24, 4, 2, 8), (28, 12, 6, 2), (8, 14, 4, 2), (18, 5, 3, 2), (31, 6, 2, 4), (14, 15, 2, 3)]:
    carve(g, *r, c='#')
marca(g, 'J', (4, 16)); marca(g, 'H', (35, 4))
marca(g, 'P', (5, 4), (21, 9), (34, 16)); marca(g, 'C', (7, 10), (22, 14)); marca(g, 'M', (13, 17), (27, 8))
marca(g, 'S', (6, 17)); marca(g, 'N', (9, 6), (27, 16))
guardias = [
    {'a': [8, 8], 'b': [8, 13]},
    {'a': [14, 8], 'tipo': 'granadero'},
    {'a': [20, 16], 'b': [20, 8], 'tipo': 'cuchillero'},
    {'a': [30, 9], 'tipo': 'granadero'},
    {'a': [28, 5], 'b': [36, 8]},
]
guardar(3, 'Patio y azotea', g, guardias, {'ambiente': 'noche', 'luces': [[4, 16], [20, 11], [35, 4]], 'decoracion': [
    {'t': 'antorcha', 'x': 15, 'y': 3.4}, {'t': 'antorcha', 'x': 26, 'y': 18.6}, {'t': 'charco', 'x': 22, 'y': 7}]})

# ---- Nivel 4: complejo final. Bombas en el pasillo sur, puerta con llave, todos los guardias, de noche.
g = grid(44, 24)
carve(g, 2, 17, 7, 5)    # inicio
carve(g, 4, 6, 2, 12)    # subida
carve(g, 4, 6, 30, 2)    # pasillo norte
carve(g, 28, 2, 10, 6)   # sala de la llave
carve(g, 9, 19, 26, 2)   # pasillo sur (bombas y puerta)
carve(g, 35, 14, 8, 8)   # sala E
carve(g, 38, 8, 2, 7)    # subida final
carve(g, 35, 3, 8, 6)    # sala de la escotilla
marca(g, 'J', (3, 20)); marca(g, 'H', (40, 4))
marca(g, 'S', (7, 18)); marca(g, 'K', (36, 4)); marca(g, 'D', (34, 19), (34, 20))
marca(g, 'B', (14, 19), (20, 20), (26, 19)); marca(g, 'P', (5, 11), (31, 3), (41, 20))
marca(g, 'C', (5, 14), (30, 6)); marca(g, 'M', (12, 7), (36, 17)); marca(g, 'N', (3, 12), (16, 5), (36, 22))
guardias = [
    {'a': [8, 6], 'b': [24, 6], 'tipo': 'cuchillero'},
    {'a': [30, 4], 'tipo': 'granadero'},
    {'a': [32, 7], 'tipo': 'cuchillero'},
    {'a': [30, 19], 'tipo': 'granadero'},
    {'a': [37, 17], 'b': [42, 17], 'tipo': 'cuchillero'},
    {'a': [40, 20], 'tipo': 'granadero'},
    {'a': [37, 6], 'b': [42, 6]},
]
guardar(4, 'Complejo final', g, guardias, {'ambiente': 'noche', 'luces': [[3, 20], [40, 4], [38, 18]], 'decoracion': [
    {'t': 'tuberia', 'x': 14, 'y': 5.2, 'w': 8}, {'t': 'antorcha', 'x': 12, 'y': 18.4}, {'t': 'antorcha', 'x': 27, 'y': 20.6},
    {'t': 'charco', 'x': 20, 'y': 7}]})
print('ok')
