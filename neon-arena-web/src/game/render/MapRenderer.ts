import Phaser from "phaser";
import type { MapDefinition } from "../../core/models";
import { DepthLayers } from "./DepthLayers";

export class MapRenderer {
  private background?: Phaser.GameObjects.Image;

  constructor(private readonly scene: Phaser.Scene, private readonly map: MapDefinition) {}

  create(): void {
    this.background = this.scene.add.image(this.map.size.x / 2, this.map.size.y / 2, this.map.art.backgroundKey);
    this.background.setDisplaySize(this.map.size.x, this.map.size.y).setDepth(DepthLayers.map);
  }
}
