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
    this.storm.setAlpha(0.16).setDepth(DepthLayers.storm).setTint(color(this.map.art.accent));
    this.ring = this.scene.add.image(this.map.safeZone.center.x, this.map.safeZone.center.y, "fx-safe-zone");
    this.ring.setDepth(DepthLayers.safeZone).setAlpha(0.26).setTint(color(this.map.art.accent));
  }

  render(snapshot: MatchSnapshot | undefined): void {
    if (!snapshot) return;
    const zone = snapshot.safeZone;
    const accent = color(this.map.art.accent);
    this.graphics.lineStyle(6, accent, 0.78).strokeCircle(zone.center.x, zone.center.y, zone.radius);
    this.graphics.lineStyle(3, 0xffd26a, 0.42).strokeCircle(zone.center.x, zone.center.y, zone.radius + 16);
    this.graphics.lineStyle(2, 0xff4422, 0.34).strokeCircle(zone.center.x, zone.center.y, zone.radius - 16);
    this.ring?.setPosition(zone.center.x, zone.center.y).setDisplaySize(zone.radius * 2.08, zone.radius * 2.08).setAlpha(0.16 + zone.phase * 0.06);
    if (this.storm) {
      this.storm.tilePositionX += 0.28;
      this.storm.tilePositionY += 0.18;
      this.storm.setAlpha(0.1 + zone.phase * 0.06);
    }
  }
}
