import Phaser from "phaser";
import type { ProjectileState } from "../../core/models";
import { projectileTextureKey } from "../assets";
import { DepthLayers } from "./DepthLayers";

export class ProjectileRenderer {
  private sprites = new Map<string, Phaser.GameObjects.Image>();

  constructor(private readonly scene: Phaser.Scene) {}

  render(projectiles: ProjectileState[]): void {
    const active = new Set<string>();
    for (const projectile of projectiles) {
      active.add(projectile.id);
      const key = projectileTextureKey(projectile.weaponID);
      const sprite = this.sprites.get(projectile.id) ?? this.scene.add.image(projectile.position.x, projectile.position.y, key);
      sprite.setTexture(key).setPosition(projectile.position.x, projectile.position.y).setRotation(Math.atan2(projectile.velocity.y, projectile.velocity.x));
      sprite.setDisplaySize(projectile.weaponID === "pulse-bow" ? 70 : 48, 22).setDepth(DepthLayers.projectile);
      this.sprites.set(projectile.id, sprite);
    }
    for (const [id, sprite] of this.sprites) if (!active.has(id)) { sprite.destroy(); this.sprites.delete(id); }
  }
}
