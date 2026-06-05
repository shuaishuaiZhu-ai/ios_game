import Phaser from "phaser";
import type { DroppedWeapon } from "../../core/models";
import { weaponTextureKey } from "../assets";
import { DepthLayers } from "./DepthLayers";

function color(hex: string): number {
  return Number.parseInt(hex.replace("#", ""), 16);
}

export class WeaponRenderer {
  private sprites = new Map<string, Phaser.GameObjects.Image>();

  constructor(private readonly scene: Phaser.Scene, private readonly graphics: Phaser.GameObjects.Graphics) {}

  render(weapons: DroppedWeapon[]): void {
    const active = new Set<string>();
    for (const weapon of weapons) {
      if (weapon.isPickedUp) continue;
      active.add(weapon.id);
      const key = weaponTextureKey(weapon.weaponID);
      const sprite = this.sprites.get(weapon.id) ?? this.scene.add.image(weapon.position.x, weapon.position.y, key);
      sprite.setTexture(key).setPosition(weapon.position.x, weapon.position.y).setDepth(DepthLayers.pickup);
      sprite.setDisplaySize(weapon.type === "ranged" ? 70 : 62, weapon.type === "ranged" ? 54 : 62);
      this.sprites.set(weapon.id, sprite);
      const ring = weapon.type === "ranged" ? "#00e5ff" : weapon.type === "utility" ? "#ffb02e" : "#ff4fd8";
      this.graphics.lineStyle(3, color(ring), 0.82).strokeCircle(weapon.position.x, weapon.position.y, 38);
    }
    for (const [id, sprite] of this.sprites) if (!active.has(id)) { sprite.destroy(); this.sprites.delete(id); }
  }
}
