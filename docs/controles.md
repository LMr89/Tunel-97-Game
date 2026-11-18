# Controles

| Acción | Teclado / ratón | Mando (PS3) |
|---|---|---|
| Mover | W A S D / flechas | Stick izquierdo |
| Sigilo (más lento y silencioso) | Shift | L1 |
| Disparar | Espacio o clic | R2 o ✕ |
| Apuntar | La dirección de movimiento | Stick derecho |
| Recargar | R | □ |
| Interactuar (mantener) | E | ○ |
| Lanzar piedra | F | △ |
| Escudo (mantener) | Q | L2 |
| Pausa | P / Esc | Start |
| Menús | Ratón, Enter | ✕ en resultados |

El personaje dispara en la dirección en que mira, que es una de 8 direcciones. Mientras se dispara no cambia de dirección, así que se puede avanzar o retroceder apuntando igual.

## Mando

El código lee el mando con la API `navigator.getGamepads()` del navegador, sin librerías. El mapeo está en `src/data/config.json` → `mando`:

```json
"mando": {
  "zonaMuerta": 0.2,
  "ejes": { "moverX": 0, "moverY": 1, "apuntarX": 2, "apuntarY": 3 },
  "botones": {
    "disparar": [7, 0], "recargar": [2], "interactuar": [1],
    "sigilo": [4], "escudo": [6], "piedra": [3], "pausa": [9]
  }
}
```

Los números son los índices del layout estándar de Gamepad. Cada acción acepta una lista de botones.

### Calibrar un mando

1. Conecta el mando y ejecuta `npm run dev`.
2. Abre `http://localhost:5173/gamepad-test.html` y pulsa botones: la página muestra el índice de cada botón y eje en vivo.
3. Si no coinciden con la tabla de arriba, cambia los números en `config.json`.

### Problemas frecuentes

- **El navegador no ve el mando:** pulsa cualquier botón con la ventana en foco; el navegador solo lo detecta después de la primera pulsación.
- **El DualShock 3 (PS3) en Windows** a veces aparece con un mapeo no estándar o no aparece. Si pasa, usa un driver como DS4Windows, DS3Tool o SCP, o Steam Input, y vuelve a calibrar.
- **El personaje se mueve solo:** sube `mando.zonaMuerta` (por ejemplo a 0.3).
- **Los ejes de apuntar no responden:** algunos mandos usan otros índices para el stick derecho. Mira la página de prueba y ajusta `apuntarX` y `apuntarY`.

## Cómo está hecho

`src/systems/input.ts` expone `createInput(scene)`. Su método `read()` devuelve en cada fotograma un objeto `Entrada` con `dx`, `dy`, `aim`, `sneak`, `fire`, `interact`, `shield`, y las pulsaciones puntuales `reload`, `rock` y `pause`. `LevelScene` solo lee ese objeto y no sabe qué dispositivo se usó. Para agregar una acción nueva: añádela a la interfaz `Entrada`, a `config.json` y a `read()`.
