import Phaser from "phaser";
import type { MapDefinition } from "../../core/models";
import { DepthLayers } from "./DepthLayers";

export class MapRenderer {
  private background?: Phaser.GameObjects.Image;
  private coverGraphics?: Phaser.GameObjects.Graphics;

  constructor(private readonly scene: Phaser.Scene, private readonly map: MapDefinition) {}

  create(): void {
    this.background = this.scene.add.image(this.map.size.x / 2, this.map.size.y / 2, this.map.art.backgroundKey);
    this.background.setDisplaySize(this.map.size.x, this.map.size.y).setDepth(DepthLayers.map);
    if (debugCollidersEnabled()) this.createCoverCues();
  }

  private createCoverCues(): void {
    this.coverGraphics = this.scene.add.graphics().setDepth(DepthLayers.coverCue);
    for (const wall of this.map.walls) {
      const rect = wall.rect;
      const isSolid = wall.kind === "solid";
      this.coverGraphics.fillStyle(isSolid ? 0x06131f : 0x11382d, isSolid ? 0.1 : 0.07);
      this.coverGraphics.fillRoundedRect(rect.origin.x, rect.origin.y, rect.size.x, rect.size.y, 8);
      this.coverGraphics.lineStyle(isSolid ? 3 : 2, isSolid ? 0x38f5d4 : 0xff4fd8, isSolid ? 0.24 : 0.18);
      this.coverGraphics.strokeRoundedRect(rect.origin.x, rect.origin.y, rect.size.x, rect.size.y, 8);
    }
  }
}

function debugCollidersEnabled(): boolean {
  return new URLSearchParams(window.location.search).get("debugColliders") === "1";
}
