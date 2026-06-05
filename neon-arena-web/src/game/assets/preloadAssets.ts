import Phaser from "phaser";
import { arenaAssets } from "./assetManifest";

export function preloadArenaAssets(scene: Phaser.Scene): void {
  for (const asset of arenaAssets) {
    if (asset.kind === "image") {
      scene.load.image(asset.key, asset.path);
    } else if (asset.kind === "spritesheet") {
      scene.load.spritesheet(asset.key, asset.path, { frameWidth: asset.frameWidth ?? 96, frameHeight: asset.frameHeight ?? 96 });
    } else {
      scene.load.json(asset.key, asset.path);
    }
  }
}
