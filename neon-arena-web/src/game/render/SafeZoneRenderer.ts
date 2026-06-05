import Phaser from "phaser";
import type { MatchSnapshot, MapDefinition } from "../../core/models";
import { DepthLayers } from "./DepthLayers";

function color(hex: string): number {
  return Number.parseInt(hex.replace("#", ""), 16);
}

export class SafeZoneRenderer {
  private ring?: Phaser.GameObjects.Image;
  private storm?: Phaser.GameObjects.TileSprite;

  constructor(private readonly scene: Phaser.Scene, private readonly graphics: Phaser.GameObjects.Graphics, private readonly map: MapDefinition) {}

  create(): void {
    this.storm = this.scene.add.tileSprite(this.map.size.x / 2, this.map.size.y / 2, this.map.size.x, this.map.size.y, "fx-storm-tile");
    this.storm.setAlpha(0.26).setDepth(DepthLayers.storm);
    this.ring = this.scene.add.image(this.map.safeZone.center.x, this.map.safeZone.center.y, "fx-safe-zone");
    this.ring.setDepth(DepthLayers.safeZone).setAlpha(0.45);
  }

  render(snapshot: MatchSnapshot | undefined): void {
    if (!snapshot) return;
    const zone = snapshot.safeZone;
    this.graphics.lineStyle(8, color("#38f5d4"), 0.96).strokeCircle(zone.center.x, zone.center.y, zone.radius);
    this.graphics.lineStyle(4, color("#ff4fd8"), 0.6).strokeCircle(zone.center.x, zone.center.y, zone.radius + 18);
    this.graphics.lineStyle(2, color("#00e5ff"), 0.45).strokeCircle(zone.center.x, zone.center.y, zone.radius - 18);
    this.ring?.setPosition(zone.center.x, zone.center.y).setDisplaySize(zone.radius * 2.08, zone.radius * 2.08).setAlpha(0.24 + zone.phase * 0.08);
    if (this.storm) {
      this.storm.tilePositionX += 0.28;
      this.storm.tilePositionY += 0.18;
      this.storm.setAlpha(0.18 + zone.phase * 0.08);
    }
  }
}
