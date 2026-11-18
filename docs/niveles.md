# Cómo crear o editar un nivel

Un nivel es un archivo JSON en `src/data/levels/`. No hay que tocar código, solo registrarlo.

## Pasos para un nivel nuevo

1. Copia `nivel1.json` como `nivel5.json` y edítalo.
2. En `src/data/levels/index.ts` agrega `import nivel5 from './nivel5.json' with { type: 'json' };` y añádelo al arreglo `LEVELS`.
3. Ejecuta `npm test`: valida el formato y que la escotilla sea alcanzable.
4. `npm run dev`, entra desde el selector de niveles del menú. Los niveles se desbloquean al superar el anterior.

## Formato

```json
{
  "nombre": "Los túneles",
  "ambiente": "noche",
  "mapa": ["####…", "#J..#", "…"],
  "guardias": [{ "a": [9, 7], "b": [9, 12], "tipo": "cuchillero" }],
  "barricadas": [{ "x": 21.8, "y": 5, "w": 24, "h": 64 }],
  "luces": [[4, 16]],
  "decoracion": [{ "t": "antorcha", "x": 12, "y": 4.4 }]
}
```

`ambiente`, `luces` y `decoracion` son opcionales.

## El mapa

Es una lista de textos: **una fila por texto, un carácter por tile** (1 tile = 32 px). Todas las filas deben tener el mismo largo. Los objetos se escriben directamente en el mapa:

| Carácter | Qué es | Notas |
|---|---|---|
| `#` | Pared | Bloquea paso y vista |
| `.` | Suelo | |
| `J` | Inicio del jugador | Exactamente uno |
| `H` | Escotilla (meta) | Exactamente una; se abre manteniendo E 2 s |
| `N` | Nicho | Excavado en la pared, pegado al suelo; el jugador se esconde dentro |
| `C` | Checkpoint | Guarda el avance y cura por completo |
| `P` | Documento | Coleccionable; cuenta en los resultados |
| `K` | Llave | Abre las puertas `D` |
| `D` | Puerta | Bloquea hasta tener la llave; se abre al acercarse. Ocupa 1×2 tiles: pon dos `D` seguidas |
| `S` | Escudo | Se recoge; se usa manteniendo Q o L2 |
| `M` | Botiquín | Cura 40; espera si estás con vida completa |
| `B` | Bomba | Explota por cercanía, por reacción en cadena o al dispararle |

Los pasillos de 2 tiles de ancho funcionan mejor para patrullas y conos.

## Guardias

```json
{ "a": [9, 7], "b": [9, 12], "tipo": "cuchillero" }
```

- `a`: posición inicial, en tiles `[x, y]`. Debe estar sobre suelo.
- `b`: si existe, el guardia patrulla de `a` a `b`. Si no, es **vigía** y gira el cono cada 4 s.
- `tipo`: `fusilero` (por defecto, solo vigila), `cuchillero`, `granadero`.

## Barricadas

```json
{ "x": 21.8, "y": 5, "w": 24, "h": 64, "sellada": true }
```

`x`, `y` en tiles (admite decimales); `w`, `h` en píxeles. Con `sellada` no se puede abrir. Abrirlas hace ruido.

## Ambiente y luz

- `"ambiente": "noche"` oscurece el nivel. El jugador lleva linterna y los conos de los guardias también iluminan.
- `luces`: puntos `[x, y]` en tiles con luz fija, útiles para marcar zonas.

## Decoración

`t` puede ser `charco`, `antorcha` o `tuberia`. Las antorchas además iluminan de noche. Para `tuberia`, `w` es el largo en tiles. La decoración no bloquea el paso.

## Generador opcional

`scripts/gen_niveles.py` arma mapas con rectángulos (`carve`) y comprueba que la escotilla sea alcanzable. Es solo una ayuda: los JSON son la fuente de verdad, y volver a ejecutarlo reescribe `nivel2.json`, `nivel3.json` y `nivel4.json`. Si editaste esos archivos a mano, no lo ejecutes.

## Consejos de diseño

- Divide el nivel en zonas: una de aprendizaje sin guardias, una con decisiones (dos rutas) y una final más difícil.
- Pon un checkpoint antes de cada tramo peligroso y documentos en rutas alternativas para premiar la exploración.
- Con noche, deja luz cerca del inicio para que el jugador se ubique.
- No dejes al jugador a menos de 4 tiles del cono de un guardia en el primer segundo.
