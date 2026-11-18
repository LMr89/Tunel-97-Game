# Túnel 97

Juego 2D de sigilo con vista cenital, para navegador. El Comando recorre túneles, sótanos y patios evitando el cono de visión de los guardias, y debe llegar a la escotilla de cada nivel. Curso de Video Juegos, UTP 2026-II.

> Obra de ficción inspirada en hechos reales. No representa personas reales.

**Stack:** Phaser 4 · TypeScript · Vite. Sin backend: todo corre en el navegador.

## Cómo ejecutarlo

Requiere Node.js 20 o superior.

```bash
npm install
npm run dev      # servidor local con recarga (http://localhost:5173)
npm run build    # revisa tipos y genera dist/
npm test         # pruebas (node --test)
```

El micrófono (pantalla de voz) solo funciona en `localhost` o HTTPS. Las fuentes vienen de Google Fonts; sin internet se usa una fuente de respaldo.

## Qué hay en el juego

- **Flujo:** Título → Voz → Menú → Nivel → Resultados.
- **4 niveles:** túneles, sótano y almacenes, patio (de noche) y complejo final (de noche).
- **Sigilo:** conos de visión que se cortan con las paredes, medidor de detección, nichos para esconderse, ruido y piedras para distraer.
- **Combate opcional:** disparos, vida del jugador, escudo, y guardias cuchilleros y granaderos. Hay bombas en el mapa.
- **Progreso:** checkpoints, documentos, llaves y puertas, tiempo por nivel y niveles desbloqueables.
- **Voz:** detecta si la voz es de hombre o mujer (solo eso) para elegir el aspecto del personaje.
- **Mando:** teclado y ratón, o mando (mapeo pensado para PS3, aún sin probar en un mando real; ver `docs/controles.md`).
- **Efectos:** sacudida de cámara, partículas, explosiones, noche con linterna y sonidos generados por código.

## Controles rápidos

| Acción | Teclado / ratón | Mando |
|---|---|---|
| Mover | WASD / flechas | Stick izquierdo |
| Sigilo | Shift | L1 |
| Disparar | Espacio o clic | R2 o ✕ |
| Apuntar | Dirección de movimiento | Stick derecho |
| Recargar | R | □ |
| Interactuar (mantener) | E | ○ |
| Piedra | F | △ |
| Escudo (mantener) | Q | L2 |
| Pausa | P / Esc | Start |

## Estructura

```
src/
  main.ts            arranque de Phaser y lista de escenas
  scenes/            una escena por pantalla (Title, Voz, Menu, Level, Hud, Pausa, Resultados)
  entities/Guard.ts  guardia: ruta, estados y tipos
  systems/           lógica por tema: visión, entrada, voz, efectos, noche, sonido, guardado, mapa
  data/
    config.json      textos, mando, efectos, voz, personaje
    params.json      balance del juego (velocidades, daño, radios…)
    levels/          nivel1.json … nivel4.json + index.ts
tests/               pruebas de visión, niveles, mapa y voz
scripts/             gen_niveles.py (ayuda para armar mapas)
public/              assets (sprites, música) y gamepad-test.html
docs/                documentación detallada
resources/           packs originales de assets (no se versionan)
```

## Documentación

- [`docs/arquitectura.md`](docs/arquitectura.md): cómo está organizado el código y cómo fluye una partida.
- [`docs/niveles.md`](docs/niveles.md): cómo crear o editar un nivel.
- [`docs/configuracion.md`](docs/configuracion.md): qué hace cada valor de `config.json` y `params.json`.
- [`docs/controles.md`](docs/controles.md): controles y calibración del mando.
- [`docs/assets-y-licencias.md`](docs/assets-y-licencias.md): origen y licencias de los recursos.
