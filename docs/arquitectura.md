# Arquitectura

## Idea general

Cada pantalla es una **escena** de Phaser. La lógica que no depende de Phaser (visión, mapa, voz, guardado) vive en `src/systems/` como funciones sueltas, para poder probarla con `node --test`. Los datos de balance y de niveles están en JSON, no en el código.

Regla de diseño: **la interfaz solo escucha**. `HudScene` lee valores del `registry` de Phaser y nunca controla al juego.

## Escenas (`src/scenes/`)

| Escena | Para qué |
|---|---|
| `TitleScene` | Pantalla de inicio: título e integrantes (desde `config.json`). |
| `VozScene` | Detecta hombre o mujer por la voz, o se elige a mano. Guarda `registry 'genero'`. |
| `MenuScene` | Menú, ayuda, selector de niveles. También **carga todos los assets** y crea las animaciones. |
| `LevelScene` | El nivel jugable. Carga el nivel que le indique `{ nivel }`. |
| `HudScene` | Barras de detección, vida y escudo, munición, avisos. Corre en paralelo al nivel. |
| `PausaScene` | Se superpone al nivel mientras este está detenido. |
| `ResultadosScene` | Tiempo, documentos e intentos al terminar un nivel. |

Orden de arranque en `main.ts`: `[Title, Voz, Menu, Level, Hud, Pausa, Resultados]`.

### Flujo

```
Título → Voz → Menú → Level(n) ⇄ Pausa
                         ↓ escotilla
                     Resultados → Level(n+1) o Menú
```

Al morir o ser descubierto, `LevelScene` se reinicia con `scene.restart({ nivel, prog })`. `prog` (tipo `Progreso`) conserva checkpoint, objetos recogidos, escudo, tiempo y número de intentos.

## `LevelScene`: qué hace cada parte

`create()` construye el nivel en este orden: lee el mapa → dibuja suelo y paredes → crea cuerpos físicos de pared → barricadas → objetos de las marcas del mapa (documentos, llaves, puertas, bombas…) → jugador → guardias → capa de noche o viñeta → cámara.

`update()` ejecuta cada fotograma:

1. `moverJugador`: lee la entrada, mueve, elige animación, genera ruido y polvo.
2. `vigilar`: actualiza guardias, dibuja conos, llena o vacía el medidor de detección y resuelve ataques.
3. `updateInteract`: mantener E junto a una barricada o la escotilla.
4. `updateShooting`: recarga, disparo y balas.
5. `updateObjetos`: recoger objetos, checkpoints, puertas y bombas.
6. `updateHud`: escribe el estado en el `registry`.
7. Si es de noche, repinta la capa oscura.

Eventos clave: `caught()` (descubierto o eliminado) reinicia desde el checkpoint; `win()` guarda el progreso y abre Resultados.

## Guardias (`src/entities/Guard.ts`)

Máquina de estados:

```
patrol ──ve al jugador──▶ chase ──lo pierde──▶ return ──▶ patrol
   │                                                ▲
   └── oye un ruido ──▶ investigate ────────────────┘
```

- **Tipos** (campo `tipo` en el JSON del nivel): `fusilero` (solo vigila y detecta), `cuchillero` (persigue rápido y apuñala al contacto), `granadero` (se detiene a distancia y lanza granadas).
- **Con `b`** el guardia patrulla de `a` a `b`; **sin `b`** es vigía y gira el cono cada 4 s.
- El ataque lo decide `LevelScene.atacar()`, no `Guard`: la clase solo mueve y recibe daño.

## Sistemas (`src/systems/`)

| Archivo | Contenido | ¿Usa Phaser? |
|---|---|---|
| `vision.ts` | `canSee`, `rayLength`, `isWall`, `fillRate`. Constante `TILE = 32`. | No |
| `mapa.ts` | `escanear()` busca las marcas del mapa; `danoExplosion()` | No |
| `voz.ts` | Frecuencia fundamental por autocorrelación y captura del micrófono | No |
| `input.ts` | Entrada unificada teclado, ratón y mando | Solo tipos |
| `guardado.ts` | Progreso en `localStorage` (con `try/catch`) | No |
| `fx.ts` | Sacudida, chispas, polvo, estallido, alerta "!", viñeta | Sí |
| `noche.ts` | Capa oscura con luces (canvas repintado cada fotograma) | Sí |
| `sonido.ts` | Efectos de sonido con Web Audio, sin archivos | Sí |

### Detección

Cada guardia revisa si el jugador está dentro de su cono, dentro del alcance y sin pared de por medio. Si lo ve, el medidor sube más rápido cuanto más cerca esté y más lento si el jugador va en sigilo. Si ningún guardia lo ve, baja. Al llegar a 100 % se reinicia el intento. Dentro de un nicho solo lo descubre un guardia a menos de 1 tile.

### Explosiones

Granadas y bombas usan `LevelScene.explotar()`: daña al jugador y a los guardias según la distancia (`danoExplosion`), y detona bombas cercanas en cadena. El escudo reduce el daño pero se desgasta.

### Noche

`crearNoche()` pinta un canvas oscuro del tamaño de la pantalla y borra círculos (luces) y polígonos (conos de los guardias). Las luces vienen de la linterna del jugador, de `luces` y de las antorchas del nivel.

## Pruebas (`tests/`)

- `vision.test.ts`: conos, paredes y velocidad de llenado.
- `mapa.test.ts`: marcas del mapa, daño de explosión y detección de voz con tonos sintéticos.
- `levels.test.ts`: cada nivel tiene filas del mismo largo, un inicio, una escotilla, guardias fuera de las paredes, y la escotilla es alcanzable.

Las pruebas importan JSON con `with { type: 'json' }`, que es lo que exige Node.

## Convenciones

- Posiciones de guardias y objetos del mapa en **tiles** (1 tile = 32 px). Barricadas: `x`, `y` en tiles y `w`, `h` en píxeles.
- Nombres en español, igual que el resto del proyecto.
- Valores de balance en `params.json`, nunca escritos dentro del código.
- Los comentarios `ponytail:` marcan atajos conscientes con su límite y la mejora posible.
