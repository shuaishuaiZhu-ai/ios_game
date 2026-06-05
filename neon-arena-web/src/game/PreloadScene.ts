import Phaser from "phaser";
import { arenaAssets } from "./assets";

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: "preload" });
  }

  preload(): void {
    for (const asset of arenaAssets) {
      // If a spritesheet is defined we load it via the dedicated API.  Otherwise fall
      // back to a static image.  Width/height on static images are retained for
      // backwards compatibility but are not strictly required by Phaser.
      if (asset.frameWidth && asset.frameHeight) {
        this.load.spritesheet(asset.key, asset.path, {
          frameWidth: asset.frameWidth,
          frameHeight: asset.frameHeight
        });
      } else {
        this.load.image(asset.key, asset.path);
      }
    }
  }

  create(): void {
    this.scene.start("arena");
  }
}
