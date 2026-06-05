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
    this.createProps();
    this.createCoverCues();
  }

  private createProps(): void {
    this.map.walls.forEach((wall, index) => {
      if (!shouldPlaceProp(wall.kind, index)) {
        return;
      }

      const rect = wall.rect;
      const key = propKeyFor(wall.kind, index);
      const offset = propOffset(index);
      const prop = this.scene.add.image(rect.origin.x + rect.size.x / 2 + offset.x, rect.origin.y + rect.size.y / 2 + offset.y, key);
      const width = wall.kind === "solid" ? Phaser.Math.Clamp(rect.size.x * 0.72, 82, 190) : Phaser.Math.Clamp(rect.size.x * 0.58, 68, 150);
      const height = wall.kind === "solid" ? Phaser.Math.Clamp(rect.size.y * 1.08, 46, 120) : Phaser.Math.Clamp(rect.size.y * 0.88, 42, 96);
      prop.setDisplaySize(width, height).setDepth(DepthLayers.mapProp + rect.origin.y / 10000);
      prop.setAlpha(wall.kind === "solid" ? 0.34 : 0.3);
    });
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

function shouldPlaceProp(kind: string, index: number): boolean {
  if (kind === "softCover") {
    return index % 2 === 0;
  }
  return index % 3 !== 1;
}

function propKeyFor(kind: string, index: number): string {
  if (kind === "softCover") {
    return ["prop-cover-hedge", "prop-neon-plants", "prop-reflective-pool"][index % 3]!;
  }
  return ["prop-cover-wall", "prop-broken-glasshouse", "prop-sky-bridge"][index % 3]!;
}

function propOffset(index: number): { x: number; y: number } {
  const offsets = [
    { x: -18, y: -8 },
    { x: 16, y: 10 },
    { x: 0, y: -12 },
    { x: 22, y: -4 },
  ];
  return offsets[index % offsets.length]!;
}
