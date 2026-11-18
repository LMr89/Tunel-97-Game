# Assets y licencias

## Qué se usa

| Recurso | Dónde | Autor / licencia |
|---|---|---|
| Soldado del jugador (8 direcciones: idle, walk, run, attack3) | `public/assets/footsoldier/` | Free Footsoldier, SovDigital. Ver `LICENSE-sovdigital.txt` |
| Guardias (hojas laterales idle y walk) | `public/assets/soldiers/` | Craftpix, soldados gratuitos. Ver `LICENSE-craftpix.txt` |
| Fogonazo del arma | `public/assets/fx/muzzle.png` | Explosion FX Free, heyheythere, CC BY 4.0. Ver `LICENSE-explosionfx.txt` |
| Música principal | `public/assets/main_sound.mp3` | Aportado por el equipo. **Confirmar su origen y licencia** antes de publicar |

Todo lo demás se dibuja por código (suelo, paredes, objetos, efectos y sonidos), sin archivos de imagen ni audio.

La licencia **CC BY 4.0** exige atribución. Si se publica el juego, menciona a *heyheythere* y el enlace a su pack en los créditos.

## La carpeta `resources/`

Contiene los packs originales completos (con más animaciones de las que usa el juego) y sus `.zip`. **No se sube al repositorio** porque pesa mucho (`.gitignore`). El juego solo necesita lo que está en `public/assets/`.

Packs que ya tenemos y aún no se usan del todo:

- **Footsoldier:** `hurt`, `death`, `run`, `attack`, `attack2` y `attack4`.
- **Craftpix (Soldier_1, 2 y 3):** `Dead`, `Hurt`, `Grenade`, `Attack`, `Run`, `Shot`, `Recharge`.
- **Explosion FX Free:** hojas de explosión en `fire/` y `white/`.

## Cómo agregar un sprite nuevo

1. Copia la imagen a `public/assets/<carpeta>/` junto con su licencia.
2. Cárgala en `MenuScene.preload()` con `this.load.spritesheet(clave, ruta, { frameWidth, frameHeight })` o `this.load.image`.
3. Si es animada, crea la animación en `MenuScene.createAnims()`.
4. Úsala en `LevelScene` con `this.add.sprite(x, y, clave)`.

Las hojas del soldado tienen celdas de 134×128 px y 12 cuadros por dirección, con las filas en el orden S, SE, E, NE, N, NW, W, SW.
