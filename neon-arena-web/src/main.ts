import Phaser from "phaser";
import "./styles.css";
import { BrowserInputState } from "./game/input/BrowserInputState";
import { BootScene } from "./game/scenes/BootScene";
import { PreloadScene } from "./game/scenes/PreloadScene";
import { MainMenuScene } from "./game/scenes/MainMenuScene";
import { ArenaScene } from "./game/ArenaScene";

const inputState = new BrowserInputState();

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game-root",
  backgroundColor: "#070916",
  width: window.innerWidth,
  height: window.innerHeight,
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  render: {
    pixelArt: false,
    antialias: true,
    powerPreference: "high-performance"
  },
  scene: [BootScene, PreloadScene, MainMenuScene, ArenaScene]
});

window.addEventListener("resize", () => game.scale.resize(window.innerWidth, window.innerHeight));

game.events.once(Phaser.Core.Events.READY, () => {
  game.scene.start("boot", { inputState });
});
