# Configuración

Hay dos archivos en `src/data/`. Se editan sin tocar el código; al guardar, `npm run dev` recarga solo.

- **`config.json`**: textos, entrada, efectos, voz y personaje.
- **`params.json`**: balance del juego.

Las distancias van en **tiles** (1 tile = 32 px) y las velocidades en **tiles por segundo**, salvo que se indique otra unidad.

## `config.json`

| Clave | Para qué |
|---|---|
| `titulo`, `subtitulo` | Textos de la pantalla de inicio |
| `curso`, `ciclo`, `universidad`, `docente` | Datos al pie de la pantalla de inicio |
| `integrantes` | Lista de `{ "nombre", "rol" }` que se muestra en la pantalla de inicio |
| `mando.zonaMuerta` | Ignora el temblor del stick (0 a 1) |
| `mando.ejes` | Índices de los ejes: mover (`moverX/Y`) y apuntar (`apuntarX/Y`) |
| `mando.botones` | Índices de botón por acción; cada acción acepta varios |
| `efectos.sacudida` / `particulas` / `sonido` | `true` o `false` para apagar cada tipo de efecto |
| `voz.umbralHz` | Por debajo de este tono es voz de hombre; por encima, de mujer (165 por defecto) |
| `voz.segundos` | Duración de la grabación |
| `personaje.M` / `personaje.F` | `tint` aplicado al sprite según género (`null` = sin tinte) |

## `params.json`

### Jugador

| Clave | Para qué |
|---|---|
| `player.walkSpeed` / `sneakSpeed` | Velocidad normal y en sigilo |
| `player.hp` | Vida máxima |
| `player.animRef.run` / `walk` | Velocidad (px/s) a la que la animación va a su ritmo normal. Si los pies patinan, ajusta este valor |
| `ammo.mag` / `reserve` / `reloadSecs` | Cargador, reserva y tiempo de recarga |
| `bullet.speed` / `range` / `cooldown` / `damage` | Disparo |
| `piedras.cantidad` / `alcance` | Piedras por intento y distancia de lanzamiento |
| `interactSeconds` | Segundos para abrir barricadas y la escotilla |
| `botiquin` | Vida que cura un botiquín |

### Guardias

| Clave | Para qué |
|---|---|
| `guard.patrolSpeed` / `chaseSpeed` | Velocidad al patrullar y al perseguir |
| `guard.coneDeg` / `range` | Apertura del cono (grados) y alcance |
| `guard.fillNear` / `fillFar` | Segundos para llenar el medidor a quemarropa y en el límite del cono |
| `guard.sneakFactor` | Qué tanto se ralentiza el llenado con sigilo (0.6 = 40 % más lento) |
| `guard.drain` | Cuánto baja el medidor por segundo si nadie lo ve |
| `guard.loseSecs` | Segundos que persigue antes de rendirse |
| `guardHp` | Impactos de bala que resiste un guardia |
| `cuchillero.*` | `speed`, `damage`, `cooldown` (s entre golpes), `reach` (px) |
| `granada.*` | `cada` (s entre lanzamientos), `vuelo`, `mecha`, `radio`, `damage`, `distMin` |

### Mundo

| Clave | Para qué |
|---|---|
| `ruido.caminar` / `barricada` / `piedra` | Radio (tiles) en que los guardias oyen cada ruido |
| `bomba.*` | `radio`, `damage`, `mecha`, `disparo` (distancia que la activa) |
| `escudo.*` | `durabilidad`, `lento` (velocidad al usarlo), `arcoCos` (cobertura frontal), `factorExplosion`, `golpe` (desgaste por golpe) |
| `noche.oscuridad` | 0 a 1: qué tan oscura es la noche |
| `noche.luz` | Radio de la linterna del jugador (tiles) |

## Consejos de balance

- **Muy difícil:** sube `guard.fillNear`/`fillFar`, baja `guard.range`, o aumenta `bullet.damage`.
- **Muy fácil:** baja `guard.drain`, sube `guard.loseSecs`, o reduce `cuchillero.damage`.
- Cambia un valor a la vez y juega el nivel completo antes de seguir.
