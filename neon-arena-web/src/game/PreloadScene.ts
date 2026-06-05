import Phaser from "phaser";
import { arenaAssets } from "./assets";

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: "preload" });
  }

  preload(): void {
    for (const asset of arenaAssets) {
      if (asset.width && asset.height) {
        this.load.svg(asset.key, asset.path, { width: asset.width, height: asset.height });
      } else {
        this.load.svg(asset.key, asset.path);
      }
    }
  }

  create(): void {
    this.scene.start("arena");
  }
}
