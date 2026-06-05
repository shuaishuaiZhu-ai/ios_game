import Phaser from "phaser";
import type { DroppedWeapon } from "../../core/models";
import { weaponTextureKey } from "../assets";
import { DepthLayers } from "./DepthLayers";

function color(hex: string): number {
  return Number.parseInt(hex.replace("#", ""), 16);
}

export class WeaponRenderer {
  private sprites = new Map<string, Phaser.GameObjects.Image>();
  private shadows = new Map<string, Phaser.GameObjects.Ellipse>();

  constructor(private readonly scene: Phaser.Scene, private readonly graphics: Phaser.GameObjects.Graphics) {}

  render(weapons: DroppedWeapon[]): void {
    const active = new Set<string>();
    for (const weapon of weapons) {
      if (weapon.isPickedUp) continue;
      active.add(weapon.id);
      const key = weaponTextureKey(weapon.weaponID);
      const sprite = this.sprites.get(weapon.id) ?? this.scene.add.image(weapon.position.x, weapon.position.y, key);
      const shadow = this.shadows.get(weapon.id) ?? this.scene.add.ellipse(weapon.position.x, weapon.position.y + 24, 64, 20, 0x000000, 0.28);
      const bob = Math.sin(this.scene.time.now / 420 + weapon.position.x * 0.01) * 4;
      shadow.setPosition(weapon.position.x, weapon.position.y + 24).setDepth(DepthLayers.pickup - 0.2).setAlpha(0.22);
      sprite.setTexture(key).setPosition(weapon.position.x, weapon.position.y + bob).setDepth(DepthLayers.pickup + 0.1);
      sprite.setRotation(Math.sin(this.scene.time.now / 700 + weapon.position.y * 0.01) * 0.08);
      sprite.setDisplaySize(weapon.type === "ranged" ? 78 : 66, weapon.type === "ranged" ? 60 : 66);
      this.sprites.set(weapon.id, sprite);
      this.shadows.set(weapon.id, shadow);
      const ring = weapon.type === "ranged" ? "#00e5ff" : weapon.type === "utility" ? "#ffb02e" : "#ff4fd8";
      this.graphics.lineStyle(3, color(ring), 0.84).strokeCircle(weapon.position.x, weapon.position.y, 40);
      this.graphics.lineStyle(1, color(ring), 0.42).strokeCircle(weapon.position.x, weapon.position.y, 52);
    }
    for (const [id, sprite] of this.sprites) if (!active.has(id)) { sprite.destroy(); this.sprites.delete(id); }
    for (const [id, shadow] of this.shadows) if (!active.has(id)) { shadow.destroy(); this.shadows.delete(id); }
  }
}
