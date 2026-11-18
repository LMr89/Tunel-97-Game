import Phaser from "phaser";
import { TitleScene } from "./scenes/TitleScene";
import { MenuScene } from "./scenes/MenuScene";
import { LevelScene } from "./scenes/LevelScene";
import { HudScene } from "./scenes/HudScene";
import { VozScene } from "./scenes/VozScene";
import { PausaScene } from "./scenes/PausaScene";
import { ResultadosScene } from "./scenes/ResultadosScene";

// Las fuentes web deben estar listas antes de crear los textos del lienzo.
const fonts = Promise.race([
  Promise.all([
    document.fonts.load("700 40px Oswald"),
    document.fonts.load("16px Inter"),
  ]),
  new Promise((r) => setTimeout(r, 2000)), // sin red: seguir con la fuente de respaldo
]);
fonts
  .catch(() => {})
  .finally(
    () =>
      new Phaser.Game({
        type: Phaser.AUTO,
        width: 960,
        height: 540,
        backgroundColor: "#2B1D14",
        parent: document.body,
        physics: { default: "arcade" },
        scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
        scene: [
          TitleScene,
          VozScene,
          MenuScene,
          LevelScene,
          HudScene,
          PausaScene,
          ResultadosScene,
        ],
      }),
  );
